import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import type { User as BaseUser } from '../types';
import type { Session } from '@supabase/supabase-js';
import { clearAllUserData, clearSessionData } from '../utils/dataCleanup';
import { apiFetch } from '../utils/apiClient';
import { ensureAccessToken, clearAccessToken } from '../utils/authSession';
import { logger } from '../utils/logger';

// 서버로 로그 전송 (진단: timestamp, visibilityState, pathname, tabId 포함)
function getTabId() {
  try {
    const key = 'FC_TAB_ID';
    let id = localStorage.getItem(key);
    if (!id) {
      id = Math.random().toString(36).slice(2, 10);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'unknown';
  }
}

function logToServer(message: string, data?: unknown) {
  try {
    const payload = {
      message,
      data,
      meta: {
        ts: new Date().toISOString(),
        visibility: typeof document !== 'undefined' ? document.visibilityState : 'unknown',
        pathname: typeof location !== 'undefined' ? location.pathname : 'unknown',
        tabId: getTabId(),
      },
    };
    
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {}
}

interface AuthReturn {
  user: (BaseUser & { is_admin?: boolean; status?: string }) | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (provider?: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuth = (): AuthReturn => {
  const [user, setUser] = useState<(BaseUser & { is_admin?: boolean; status?: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const lastUserIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  const processingRef = useRef(false);
  const isCooldownRedirectRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    
    // 1. onAuthStateChange 리스너 등록
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        if (lastUserIdRef.current === session.user.id) {
          logToServer('[useAuth] onAuthStateChange: DUPLICATE_USER', { event, session });
          if (isMounted) setIsLoading(false);
          return;
        }
        
        if (processingRef.current) {
          logToServer('[useAuth] onAuthStateChange: ALREADY_PROCESSING', { event, session });
          if (isMounted) setIsLoading(false);
          return;
        }
        
        processingRef.current = true;
        isInitializedRef.current = true;
        logToServer('[useAuth] onAuthStateChange: SIGNED_IN', { event, session });
        try {
          await handleUserSession(session);
        } catch (error) {
        } finally {
          processingRef.current = false;
          if (isMounted) {
            setIsLoading(false);
          }
        }
        return;
      }

      if (event === 'SIGNED_OUT') {
        logToServer('[useAuth] onAuthStateChange: SIGNED_OUT', { event, session });
        
        if (isCooldownRedirectRef.current || sessionStorage.getItem('cooldown-redirect') === 'true') {
          return;
        }
        
        // refresh 실패로 인한 SIGNED_OUT인지 확인 (재시도)
        try {
          const stored = localStorage.getItem('sb-rudiauwvjsczsfbtjfoz-auth-token');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.refresh_token) {
                // refresh token이 있으면 재시도 (최대 3번)
                for (let i = 0; i < 3; i++) {
                  const { data: { session: retried }, error } = await supabase.auth.refreshSession();
                  
                  if (!error && retried?.access_token) {
                    // refresh 성공 - SIGNED_OUT 무시하고 세션 복구
                    logger.log('세션 복구 성공 (재시도)', i + 1);
                    return; // SIGNED_OUT 처리 안 함
                  }
                  
                  // refresh token 만료 등 영구적 실패는 재시도하지 않음
                  if (error?.message?.includes('refresh_token_not_found') || 
                      error?.message?.includes('invalid_grant')) {
                    break;
                  }
                  
                  // 네트워크 오류 등은 재시도
                  if (i < 2) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                  }
                }
              }
            } catch {
              // JSON 파싱 실패 등
            }
          }
        } catch {
          // 재시도 실패 - 실제 로그아웃으로 처리
        }
        
        // 실제 로그아웃인 경우에만 처리
        lastUserIdRef.current = null;
        isInitializedRef.current = false;
        
        if (lastUserIdRef.current) {
          localStorage.removeItem(`user_profile_cache_${lastUserIdRef.current}`);
        }
        
        if (isMounted) {
          setUser(null);
          setIsLoggedIn(false);
          setIsLoading(false);
        }
        clearSessionData();
        return;
      }

      logToServer('[useAuth] onAuthStateChange: IGNORED', { event, session });
    });

    // 2. 기존 하이브리드 구조 데이터 마이그레이션 (B 구조 전환 시 한 번만 실행)
    const migrateFromHybridToB = () => {
      try {
        // 기존 하이브리드 구조의 세션 데이터 정리
        sessionStorage.removeItem('fc_access_token');
        sessionStorage.removeItem('fc_access_token_exp');
        sessionStorage.removeItem('fc_csrf_token');
        localStorage.removeItem('auth_backend_user');
        
        // Supabase 세션은 유지 (Supabase SDK가 자동 관리)
      } catch {
        // 무시
      }
    };
    
    // 마이그레이션 실행 (한 번만)
    if (!localStorage.getItem('b_structure_migrated')) {
      migrateFromHybridToB();
      localStorage.setItem('b_structure_migrated', 'true');
    }

    // 3. 초기 세션 확인 (fallback)
    const initializeAuth = async () => {
      try {
        // 재가입 제한으로 리다이렉트된 경우 세션 체크 스킵
        const authCheckResult = sessionStorage.getItem('auth_check_result');
        if (authCheckResult === 'restricted' || authCheckResult === 'banned') {
          logger.log('[useAuth] ⏭️ 재가입 제한/밴 상태 감지 - initializeAuth 스킵');
          if (isMounted) {
            setUser(null);
            setIsLoggedIn(false);
            setIsLoading(false);
          }
          return;
        }
        
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData?.session?.user) {
          const allLocalStorageKeys = Object.keys(localStorage);
          allLocalStorageKeys.forEach(key => {
            if (key.startsWith('user_profile_cache_')) {
              localStorage.removeItem(key);
            }
          });
          localStorage.removeItem('auth_backend_user');
          
          if (isMounted) {
            setUser(null);
            setIsLoggedIn(false);
            setIsLoading(false);
          }
          return;
        }
        
        const userId = sessionData.session.user.id;
        
        // 캐시된 프로필 먼저 읽기 (즉시 표시)
        const cachedProfileKey = `user_profile_cache_${userId}`;
        const cachedProfileData = localStorage.getItem(cachedProfileKey);
        
        if (cachedProfileData) {
          try {
            const cachedProfile = JSON.parse(cachedProfileData);
            
            if (isMounted) {
              setUser({
                id: cachedProfile.id,
                email: cachedProfile.email,
                user_metadata: { nickname: cachedProfile.nickname },
                school: cachedProfile.school || undefined,
                is_admin: cachedProfile.is_admin || false,
                status: cachedProfile.status || 'active',
                created_at: cachedProfile.created_at
              } as BaseUser & { is_admin?: boolean; status?: string; school?: string; created_at?: string });
              setIsLoggedIn(true);
              setIsLoading(false);
            }
            
            // 백그라운드에서 DB 최신 정보로 갱신
            void (async () => {
              try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) return;


                const response = await apiFetch('/api/auth/profile');
                
                // 401 에러 처리
                if (response.status === 401) {
                    try {
                      const errorText = await response.text();
                      let errorData: Record<string, unknown> = {};
                      
                      // JSON 파싱 시도
                      try {
                        errorData = JSON.parse(errorText);
                      } catch (parseError) {
                        // JSON이 아니면 빈 객체 유지
                        logger.warn('[useAuth] 에러 응답 JSON 파싱 실패 (정상일 수 있음)', parseError);
                      }
                      
                      // DB에 deletion이 실제로 있는 경우에만 account-cooldown으로 리다이렉트
                      if (errorData.isRestricted === true) {
                        console.error('회원탈퇴 후 24시간 제한 (DB 확인됨), account-cooldown으로 리다이렉트');
                        await supabase.auth.signOut();
                        if (isMounted) {
                          setUser(null);
                          setIsLoggedIn(false);
                          setIsLoading(false);
                        }
                        if (window.location.pathname !== '/account-cooldown') {
                          window.location.href = '/account-cooldown';
                        }
                        return;
                      }
                  } catch (e) {
                    // 에러 처리 실패 시 intro로 리다이렉트
                    console.error('401 에러 처리 중 오류:', e);
                  }
                  
                  // 그 외의 401 에러는 intro로 리다이렉트
                  console.error('토큰 검증 실패, intro로 리다이렉트');
                  await supabase.auth.signOut();
                  if (isMounted) {
                    setUser(null);
                    setIsLoggedIn(false);
                    setIsLoading(false);
                  }
                  if (window.location.pathname !== '/') {
                    window.location.href = '/';
                  }
                  return;
                }
                
                if (response.ok) {
                  const result = await response.json();
                  if (result.user) {
                    const dbUser = result.user;
                    
                    const updatedProfile = {
                      id: dbUser.id,
                      email: dbUser.email,
                      nickname: dbUser.nickname,
                      status: dbUser.status,
                      school: dbUser.school || null,
                      is_admin: dbUser.is_admin || false,
                      created_at: dbUser.created_at,
                      cachedAt: Date.now()
                    };
                    localStorage.setItem(cachedProfileKey, JSON.stringify(updatedProfile));
                    
                    if (isMounted) {
                      setUser({
                        id: dbUser.id,
                        email: dbUser.email,
                        user_metadata: { nickname: dbUser.nickname },
                        school: dbUser.school || undefined,
                        is_admin: dbUser.is_admin || false,
                        status: dbUser.status || 'active',
                        created_at: dbUser.created_at
                      } as BaseUser & { is_admin?: boolean; status?: string; school?: string; created_at?: string });
                      
                      // 프로필 업데이트 완료
                      setIsLoading(false);
                    }
                  }
                }
              } catch (err) {
                logger.warn('[useAuth] 프로필 업데이트 중 오류 (무시됨)', err);
              }
            })();
            return;
          } catch (initError) {
            logger.warn('[useAuth] 초기화 중 오류 (무시됨)', initError);
          }
        }
        
        if (!isInitializedRef.current && isMounted) {
          if (sessionData?.session?.user) {
            if (lastUserIdRef.current === sessionData.session.user.id) {
              logToServer('[useAuth] getSession: DUPLICATE_USER', { session: sessionData.session });
              if (isMounted) setIsLoading(false);
              return;
            }
            
            if (processingRef.current) {
              logToServer('[useAuth] getSession: ALREADY_PROCESSING', { session: sessionData.session });
              if (isMounted) setIsLoading(false);
              return;
            }
            
            processingRef.current = true;
            isInitializedRef.current = true;
            try {
              await handleUserSession(sessionData.session);
            } catch (error) {
            } finally {
              processingRef.current = false;
            }
          } else {
            localStorage.removeItem('auth_backend_user');
            
            if (isMounted) {
              setUser(null);
              setIsLoggedIn(false);
              setIsLoading(false);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
          setIsLoggedIn(false);
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  // ⚡ 최적화된 사용자 세션 처리 함수
  const handleUserSession = async (session: Session) => {
    logger.log('[useAuth] 🔄 handleUserSession 시작:', { userId: session.user.id });
    
    if (isCooldownRedirectRef.current || sessionStorage.getItem('cooldown-redirect') === 'true') {
      logger.log('[useAuth] ⏭️ 쿨다운 리다이렉트 플래그 감지 - 스킵');
      return;
    }
    
    // oauth-callback에서 이미 체크가 완료된 경우 재체크 스킵
    const authCheckCompleted = sessionStorage.getItem('auth_check_completed') === 'true';
    const authCheckResult = sessionStorage.getItem('auth_check_result');
    
    logger.log('[useAuth] 📋 체크 상태:', { authCheckCompleted, authCheckResult });
    
    if (authCheckCompleted) {
      // 체크 결과에 따라 처리
      if (authCheckResult === 'restricted') {
        logger.log('[useAuth] ⏰ 재가입 제한 이미 체크됨 - 스킵');
        // 이미 재가입 제한으로 리다이렉트됨, 여기서는 처리하지 않음
        return;
      }
      if (authCheckResult === 'banned') {
        logger.log('[useAuth] 🚫 밴 상태 이미 체크됨 - 스킵');
        // 이미 밴으로 리다이렉트됨, 여기서는 처리하지 않음
        return;
      }
      if (authCheckResult === 'success') {
        logger.log('[useAuth] ✅ 로그인 성공 이미 체크됨 - 재체크 스킵');
        // 로그인 성공, 체크 스킵하고 바로 진행
        sessionStorage.removeItem('auth_check_completed');
        sessionStorage.removeItem('auth_check_result');
        // Step 2로 바로 진행
      }
    }
    
    const userId = session.user.id;
    const userEmail = session.user.email;
    const meta = session.user.user_metadata || {};
    const displayName = meta.nickname || meta.name || meta.full_name || (userEmail ? userEmail.split('@')[0] : '');
    
    // ⚡ Step 1: 재가입 제한 + Ban 체크 (이미 체크되지 않은 경우에만)
    if (!authCheckCompleted) {
      logger.log('[useAuth] 🔍 Step 1: 재가입 제한 + Ban 체크 시작');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 500);
        
        const [validateResponse, banCheckData] = await Promise.race([
          Promise.all([
            // 재가입 제한 체크
            fetch('/api/auth/validate-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: userEmail }),
              signal: controller.signal
            }).catch(() => null),
            // Ban 상태 체크
            Promise.resolve(
              supabase
                .from('users')
                .select('status')
                .eq('id', userId)
                .maybeSingle()
            ).then(res => res.data).catch(() => null)
          ]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 500))
        ]) as any;
        
        clearTimeout(timeoutId);
        
        logger.log('[useAuth] 📊 체크 결과:', { 
          validateResponseStatus: validateResponse?.status,
          validateResponseOk: validateResponse?.ok,
          banCheckData 
        });
        
        // 재가입 제한 체크
        if (validateResponse && !validateResponse.ok) {
          const errorData = await validateResponse.json();
          logger.log('[useAuth] 📋 재가입 제한 체크 응답:', errorData);
          // 실제로 isRestricted가 true인 경우에만 account-cooldown으로 리다이렉트
          if (errorData.isRestricted === true) {
            logger.log('[useAuth] ⏰ 재가입 제한 감지 - account-cooldown으로 리다이렉트');
            isCooldownRedirectRef.current = true;
            sessionStorage.setItem('cooldown-redirect', 'true');
            localStorage.removeItem('auth_backend_user');
            await supabase.auth.signOut();
            setUser(null);
            setIsLoggedIn(false);
            if (window.location.pathname !== '/account-cooldown') {
              logger.log('[useAuth] 🔀 /account-cooldown으로 리다이렉트');
              window.location.replace('/account-cooldown');
            }
            return;
          }
        }
        
        // Ban 상태 체크
        if (banCheckData && banCheckData.status === 'banned') {
          logger.log('[useAuth] 🚫 밴 상태 감지 - account-banned으로 리다이렉트');
          await supabase.auth.signOut();
          window.location.href = '/account-banned';
          return;
        }
        
        logger.log('[useAuth] ✅ 재가입 제한/Ban 체크 통과');
      } catch (e: any) {
        // 타임아웃이나 에러 시에는 account-cooldown으로 보내지 않음
        // 실제로 deletion restriction이 확인된 경우에만 보내야 함
        logger.warn('[useAuth] ⚠️ 재가입 제한 체크 중 에러 발생 (타임아웃 또는 네트워크 오류):', e.message);
        // 에러 발생 시 그냥 통과 (deletion이 없을 수 있으므로)
      }
    } else {
      logger.log('[useAuth] ⏭️ 이미 체크 완료됨 - Step 1 스킵');
    }
    
    // ⚡ Step 2: 즉시 기본 데이터로 로그인 처리
    const defaultUserData = {
      ...(session.user as BaseUser),
      is_admin: false,
      status: 'active',
      school: 'unknown',
    };
    
    lastUserIdRef.current = userId;
    setUser(defaultUserData);
    setIsLoggedIn(true);
    
    // oauth-callback에서 이미 모든 처리를 완료했으므로 즉시 로딩 완료
    if (authCheckCompleted && authCheckResult === 'success') {
      setIsLoading(false);
    } else {
      // 일반적인 경우 (Supabase OAuth 등)에는 즉시 로딩 완료
      setIsLoading(false);
    }
    
    // ⚡ Step 3: 백그라운드에서 상세 정보 업데이트 (비차단)
    const updateProfile = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession?.access_token) return;

        // B 구조: Supabase SDK가 자동으로 토큰 관리하므로 setAccessToken 불필요

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await apiFetch('/api/auth/profile', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // 401 에러 처리
        if (response.status === 401) {
          try {
            const errorText = await response.text();
            let errorData: Record<string, unknown> = {};
            
            // JSON 파싱 시도
            try {
              errorData = JSON.parse(errorText);
            } catch (parseError) {
              // JSON이 아니면 빈 객체 유지
              logger.warn('[useAuth] 에러 응답 JSON 파싱 실패 (정상일 수 있음)', parseError);
            }
            
            // DB에 deletion이 실제로 있는 경우에만 account-cooldown으로 리다이렉트
            if (errorData.isRestricted === true) {
              console.error('회원탈퇴 후 24시간 제한 (DB 확인됨), account-cooldown으로 리다이렉트');
              await supabase.auth.signOut();
              setUser(null);
              setIsLoggedIn(false);
              if (window.location.pathname !== '/account-cooldown') {
                window.location.href = '/account-cooldown';
              }
              return;
            }
          } catch (e) {
            // 에러 처리 실패 시 intro로 리다이렉트
            console.error('401 에러 처리 중 오류:', e);
          }
          
          // 그 외의 401 에러는 intro로 리다이렉트
          console.error('토큰 검증 실패, intro로 리다이렉트');
          await supabase.auth.signOut();
          setUser(null);
          setIsLoggedIn(false);
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
          return;
        }
        
        if (response.ok) {
          const result = await response.json();
          if (result.user) {
            const dbUser = result.user;
            const updatedUserData = {
              ...(session.user as BaseUser),
              is_admin: dbUser.is_admin ?? false,
              status: dbUser.status ?? 'active',
              school: dbUser.school ?? undefined,
              created_at: dbUser.created_at ?? session.user.created_at,
            };
            setUser(updatedUserData);
            
            // 캐시 저장
            const profileCache = {
              id: dbUser.id,
              email: dbUser.email,
              nickname: dbUser.nickname,
              status: dbUser.status,
              school: dbUser.school || null,
              is_admin: dbUser.is_admin || false,
              created_at: dbUser.created_at,
              cachedAt: Date.now()
            };
            localStorage.setItem(`user_profile_cache_${userId}`, JSON.stringify(profileCache));
            
            // 프로필 업데이트 완료
            // oauth-callback에서 이미 모든 처리를 완료했으므로 여기서는 플래그 제거 불필요
            return;
          }
        }
        
        // Fallback: Supabase 직접 조회
        const { data: userRow } = await Promise.race([
          supabase
            .from('users')
            .select('is_admin, status, school, created_at, email, nickname')
            .eq('id', userId)
            .single(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000))
        ]) as any;
        
        if (userRow) {
          const updatedUserData = {
            ...(session.user as BaseUser),
            is_admin: userRow.is_admin ?? false,
            status: userRow.status ?? 'active',
            school: userRow.school ?? undefined,
            created_at: userRow.created_at ?? session.user.created_at,
          };
          setUser(updatedUserData);
          
          const profileCache = {
            id: userId,
            email: userRow.email || userEmail,
            nickname: userRow.nickname || displayName,
            status: userRow.status || 'active',
            school: userRow.school || null,
            is_admin: userRow.is_admin || false,
            created_at: userRow.created_at || session.user.created_at,
            cachedAt: Date.now()
          };
          localStorage.setItem(`user_profile_cache_${userId}`, JSON.stringify(profileCache));
        }
      } catch (cacheError) {
        logger.warn('[useAuth] 프로필 캐시 저장 실패', cacheError);
      }
    };
    
    // ⚡ Step 4: 백그라운드에서 DB Upsert (비차단)
    const upsertUser = async () => {
      try {
        const currentTime = new Date().toISOString();
        
        // 빠른 exists 체크
        const { data: exists } = await Promise.race([
          supabase.from('users').select('id').eq('id', userId).maybeSingle(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 300))
        ]) as any;
        
        const upsertData: Record<string, unknown> = {
          id: userId,
          email: userEmail,
          nickname: displayName,
          updated_at: currentTime,
          last_login_at: currentTime,
        };
        
        if (!exists) {
          upsertData.status = 'active';
          upsertData.created_at = currentTime;
          localStorage.setItem('user_created_at', currentTime);
        }
        
        await Promise.race([
          supabase.from('users').upsert(upsertData),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
        ]);
        
        // created_at은 이미 위에서 설정했으므로 중복 체크 제거
      } catch (upsertError) {
        logger.warn('[useAuth] 사용자 데이터 upsert 실패', upsertError);
      }
    };
    
    // 백그라운드 작업 병렬 실행
    // oauth-callback에서 이미 모든 처리를 완료했으므로 여기서는 플래그 제거 불필요
    Promise.all([updateProfile(), upsertUser()]).catch(() => {});
  };

  const login = async (provider: string = 'kakao') => {
    if (provider !== 'kakao') {
      throw new Error('지원하지 않는 로그인 제공자입니다');
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'login'
          }
        }
      });

      if (error) {
        throw error;
      }
    } catch (error: unknown) {
      logger.error('[useAuth] 로그인 오류:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      let userId: string | null = null;
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!userError && user) {
        userId = user.id;
      }
      
      if (userId) {
        try {
          const token = await ensureAccessToken();
          if (token) {
            await apiFetch('/api/auth/logout', {
              method: 'POST'
            });
          }
        } catch (apiError) {}
      }
      
      lastUserIdRef.current = null;
      isInitializedRef.current = false;
      setUser(null);
      setIsLoggedIn(false);
      setIsLoading(false);
      
      await supabase.auth.signOut();
      clearAccessToken();
      clearSessionData({ full: true });
      
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_school');
      localStorage.removeItem('user_created_at');
      
      const kakaoCookies = [
        'kauth', 'kakao', 'kakao_account', 'kakao_token',
        'kakao_access_token', 'kakao_refresh_token'
      ];
      
      const domains = [
        window.location.hostname,
        '.kakao.com', '.kakao.co.kr', '.kauth.kakao.com'
      ];
      
      kakaoCookies.forEach(cookieName => {
        domains.forEach(domain => {
          document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          if (domain.startsWith('.')) {
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
          } else {
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
          }
        });
      });
      
      const allLocalStorageKeys = Object.keys(localStorage);
      allLocalStorageKeys.forEach(key => {
        if (key.toLowerCase().includes('kakao') || key.toLowerCase().includes('kauth')) {
          localStorage.removeItem(key);
        }
      });
      
      window.location.href = '/';
    } catch (error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        localStorage.removeItem(`user_profile_cache_${user.id}`);
      }
      
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('sb-')
      );
      supabaseKeys.forEach(key => localStorage.removeItem(key));
      
      const allLocalStorageKeys = Object.keys(localStorage);
      allLocalStorageKeys.forEach(key => {
        if (key.toLowerCase().includes('kakao') || key.toLowerCase().includes('kauth')) {
          localStorage.removeItem(key);
        }
      });
      
      await supabase.auth.signOut();
      
      lastUserIdRef.current = null;
      isInitializedRef.current = false;
      setUser(null);
      setIsLoggedIn(false);
      setIsLoading(false);
      clearSessionData({ full: true });
      
      window.location.href = '/';
    }
  };

  const deleteAccount = async () => {
    try {
      let userId: string | null = null;
      
      const backendAuthData = localStorage.getItem('auth_backend_user');
      if (backendAuthData) {
        try {
          const backendUser = JSON.parse(backendAuthData);
          userId = backendUser.id;
        } catch (parseError) {
          logger.warn('[useAuth] 백엔드 인증 데이터 파싱 실패', parseError);
        }
      }
      
      if (!userId) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user) {
          userId = user.id;
        }
      }
      
      if (!userId) {
        throw new Error('사용자를 찾을 수 없습니다');
      }

      logToServer('[useAuth] deleteAccount: 회원탈퇴 시작', { userId });

      try {
        const response = await apiFetch('/api/auth/delete-account', {
          method: 'POST',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '회원탈퇴 처리에 실패했습니다');
        }

        const result = await response.json();
        logToServer('[useAuth] deleteAccount: 백엔드 삭제 완료', result);
      } catch (apiError) {}

      localStorage.removeItem('auth_backend_user');
      
      lastUserIdRef.current = null;
      isInitializedRef.current = false;
      setUser(null);
      setIsLoggedIn(false);
      setIsLoading(false);

      try {
        await supabase.auth.signOut();
      } catch (authError) {}

      clearAccessToken();
      clearAllUserData();

      logToServer('[useAuth] deleteAccount: 회원탈퇴 완료', { userId });
      
    } catch (error) {
      logToServer('[useAuth] deleteAccount: 회원탈퇴 실패', { error });
      localStorage.removeItem('auth_backend_user');
      lastUserIdRef.current = null;
      isInitializedRef.current = false;
      setUser(null);
      setIsLoggedIn(false);
      setIsLoading(false);
      clearAllUserData();
      throw error;
    }
  };

  return { user, isLoggedIn, isLoading, login, logout, deleteAccount };
};

export default useAuth;