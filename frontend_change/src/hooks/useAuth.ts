import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import type { User as BaseUser } from '../types';
import { clearAllUserData, clearSessionData } from '../utils/dataCleanup';

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
  } catch (e) {
    return 'unknown';
  }
}

async function logToServer(message: string, data?: any) {
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
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    // best-effort logging
  }
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

  // 마지막으로 setUser한 user id를 기억 (반드시 함수 내부에 선언)
  const lastUserIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  const processingRef = useRef(false);
  const isCooldownRedirectRef = useRef<boolean>(false); // 쿨다운 리다이렉트 방지 플래그

  useEffect(() => {
    let isMounted = true;
    
    // 1. onAuthStateChange 리스너를 먼저 등록
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] onAuthStateChange event:', event, session);
      
      if (!isMounted) return;
      
      // 이벤트 타입에 따라 안전하게 처리: SIGNED_IN / INITIAL_SESSION / SIGNED_OUT 만 상태를 변경
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        // 이미 같은 user id로 setUser가 되어 있으면 중복 처리하지 않음
        if (lastUserIdRef.current === session.user.id) {
          logToServer('[useAuth] onAuthStateChange: DUPLICATE_USER', { event, session });
          if (isMounted) setIsLoading(false);
          return;
        }
        
        // 이미 처리 중이면 무시
        if (processingRef.current) {
          logToServer('[useAuth] onAuthStateChange: ALREADY_PROCESSING', { event, session });
          if (isMounted) setIsLoading(false);
          return;
        }
        
        processingRef.current = true;
        isInitializedRef.current = true;
        logToServer('[useAuth] onAuthStateChange: SIGNED_IN', { event, session });
        console.log('[useAuth] handleUserSession 호출 전');
        try {
          await handleUserSession(session);
          console.log('[useAuth] handleUserSession 호출 후');
        } catch (error) {
          console.error('[useAuth] handleUserSession 오류:', error);
        } finally {
          processingRef.current = false;
          if (isMounted) {
            console.log('[useAuth] setIsLoading(false) 호출');
            setIsLoading(false);
          }
        }
        return;
      }

      // SIGNED_OUT 이벤트 처리
      if (event === 'SIGNED_OUT') {
        logToServer('[useAuth] onAuthStateChange: SIGNED_OUT', { event, session });
        
        // 🚫 쿨다운 리다이렉트 중이면 무한 루프 방지
        if (isCooldownRedirectRef.current || sessionStorage.getItem('cooldown-redirect') === 'true') {
          console.log('[useAuth] 🚫 쿨다운 리다이렉트로 인한 SIGNED_OUT - 무시');
          return;
        }
        
        lastUserIdRef.current = null;
        isInitializedRef.current = false;
        if (isMounted) {
          setUser(null);
          setIsLoggedIn(false);
          setIsLoading(false);
        }
        // 로그아웃 시 세션 데이터만 정리
        clearSessionData();
        return;
      }

      // 기타 이벤트는 로깅만
      logToServer('[useAuth] onAuthStateChange: IGNORED', { event, session });
    });

    // 2. 초기 세션 확인 (fallback)
    const initializeAuth = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('[useAuth] getSession error:', sessionError);
          if (isMounted) {
            setUser(null);
            setIsLoggedIn(false);
            setIsLoading(false);
          }
          return;
        }
        
        console.log('[useAuth] getSession (init):', sessionData);
        
        // onAuthStateChange가 아직 호출되지 않았다면 직접 처리
        if (!isInitializedRef.current && isMounted) {
          if (sessionData?.session?.user) {
            // 이미 같은 user id로 처리되었는지 확인
            if (lastUserIdRef.current === sessionData.session.user.id) {
              logToServer('[useAuth] getSession: DUPLICATE_USER', { session: sessionData.session });
              if (isMounted) setIsLoading(false);
              return;
            }
            
            // 이미 처리 중이면 무시
            if (processingRef.current) {
              logToServer('[useAuth] getSession: ALREADY_PROCESSING', { session: sessionData.session });
              if (isMounted) setIsLoading(false);
              return;
            }
            
            processingRef.current = true;
            isInitializedRef.current = true;
            console.log('[useAuth] getSession에서 handleUserSession 호출 전');
            try {
              await handleUserSession(sessionData.session);
              console.log('[useAuth] getSession에서 handleUserSession 호출 후');
            } catch (error) {
              console.error('[useAuth] getSession handleUserSession 오류:', error);
            } finally {
              processingRef.current = false;
            }
          } else {
            if (isMounted) {
              setUser(null);
              setIsLoggedIn(false);
            }
          }
          if (isMounted) setIsLoading(false);
        }
      } catch (err) {
        console.error('[useAuth] getSession (init) unexpected error:', err);
        if (isMounted) {
          setUser(null);
          setIsLoggedIn(false);
          setIsLoading(false);
        }
      }
    };

    // 초기화 실행
    initializeAuth();

    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  // 사용자 세션 처리 함수 분리
  const handleUserSession = async (session: any) => {
    console.log('[useAuth] handleUserSession 시작:', session.user.id);
    
    // 🚫 쿨다운 리다이렉트 중이면 처리 중지
    if (isCooldownRedirectRef.current || sessionStorage.getItem('cooldown-redirect') === 'true') {
      console.log('[useAuth] 🚫 쿨다운 리다이렉트 중 - 처리 중지');
      return;
    }
    
    // ✅ 재가입 제한 체크 (OAuth 성공 직후)
    try {
      console.log('[useAuth] 🛡️ 재가입 제한 체크 시작:', session.user.email);
      
      const response = await fetch('/api/auth/validate-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: session.user.email 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('[useAuth] 🚫 재가입 제한 감지:', errorData);
        
        if (errorData.isRestricted) {
          // 24시간 재가입 제한 - 리다이렉트 플래그 설정
          isCooldownRedirectRef.current = true;
          sessionStorage.setItem('cooldown-redirect', 'true');
          
          console.log('[useAuth] 강제 로그아웃 실행');
          await supabase.auth.signOut();
          
          setUser(null);
          setIsLoggedIn(false);
          
          // 전용 페이지로 이동 (즉시 & 강제)
          console.log('[useAuth] 🚫 쿨다운 페이지로 강제 이동');
          
          // 현재 페이지가 쿨다운 페이지가 아닌 경우에만 이동
          if (window.location.pathname !== '/account-cooldown') {
            window.location.replace('/account-cooldown');
          }
          
          return;
        }
      }
      
      console.log('[useAuth] ✅ 재가입 제한 체크 통과');
      
    } catch (validationError) {
      console.error('[useAuth] 재가입 제한 체크 실패:', validationError);
      // 네트워크 오류 등은 무시하고 계속 진행 (서비스 중단 방지)
    }
    
    const meta = session.user.user_metadata || {};
    const displayName = meta.nickname || meta.name || meta.full_name || (session.user.email ? session.user.email.split('@')[0] : '');
    
    // 먼저 기본 사용자 데이터로 설정 (데이터베이스 조회 실패해도 로그인 유지)
    const defaultUserData = {
      ...(session.user as BaseUser),
      is_admin: false, // 기본값으로 설정, 나중에 업데이트
      status: 'active',
      school: 'unknown', // 기본값으로 설정하여 intro 페이지가 나오도록 함
    };
    
    lastUserIdRef.current = session.user.id;
    setUser(defaultUserData);
    setIsLoggedIn(true);
    console.log('[useAuth] 기본 사용자 데이터 설정 완료:', defaultUserData);
    
    // 백그라운드에서 데이터베이스 작업 수행 (실패해도 로그인은 유지)
    const updateUserData = async () => {
      try {
        console.log('[useAuth] 사용자 정보 조회 시작');
        
        const selectPromise = supabase
          .from('users')
          .select('is_admin, status, school')
          .eq('id', session.user.id)
          .single();
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('select timeout')), 2000)
        );
        
        const { data: userRow, error: userError } = await Promise.race([selectPromise, timeoutPromise]) as any;
          
        if (!userError && userRow) {
          const updatedUserData = {
            ...(session.user as BaseUser),
            is_admin: userRow?.is_admin ?? false,
            status: userRow?.status ?? 'active',
            school: userRow?.school ?? undefined,
          };
          console.log('[useAuth] 사용자 데이터 업데이트:', updatedUserData);
          setUser(updatedUserData);
        } else {
          console.error('[useAuth] select users failed:', userError);
          // 데이터베이스 조회 실패 시에도 현재 사용자 정보로 업데이트 시도
          const currentUser = session.user as BaseUser;
          if (currentUser) {
            const fallbackUserData = {
              ...currentUser,
              is_admin: false,
              status: 'active',
              school: undefined,
            };
            console.log('[useAuth] 폴백 사용자 데이터 설정:', fallbackUserData);
            setUser(fallbackUserData);
          }
        }
      } catch (e) {
        console.error('[useAuth] select users failed:', e);
      }
    };
    
    // upsert 작업 (백그라운드에서 실행)
    const upsertUserData = async () => {
      try {
        console.log('[useAuth] users 테이블 upsert 시작');
        
        // 먼저 기존 사용자 정보 조회 (status, login_count 확인용)
        const { data: existingUser } = await supabase
          .from('users')
          .select('status, is_admin, login_count')
          .eq('id', session.user.id)
          .maybeSingle();
        
        console.log('[useAuth] 기존 사용자 상태 확인:', {
          userId: session.user.id,
          email: session.user.email,
          existingStatus: existingUser?.status || 'none',
          isAdmin: existingUser?.is_admin || false,
          loginCount: existingUser?.login_count || 0
        });
        
        // 밴된 사용자면 즉시 로그아웃 처리
        if (existingUser && existingUser.status === 'banned') {
          console.error('[useAuth] 🚫 밴된 사용자 로그인 감지 - 계정 차단 페이지로 리다이렉트');
          await supabase.auth.signOut();
          window.location.href = '/account-banned';
          return;
        }
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('upsert timeout')), 3000)
        );
          
        // upsert 데이터 준비 - status는 기존값 유지하거나 신규시에만 active
        const upsertData: any = {
          id: session.user.id,
          email: session.user.email,
          nickname: displayName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login_at: new Date().toISOString(), // 마지막 로그인 시간 업데이트
          login_count: (existingUser?.login_count || 0) + 1, // 로그인 횟수 증가
        };
        
        // 기존 사용자가 없는 경우에만 status를 active로 설정
        if (!existingUser) {
          upsertData.status = 'active';
          console.log('[useAuth] 신규 사용자 - active 상태로 설정');
        } else {
          console.log('[useAuth] 기존 사용자 - status 유지:', existingUser.status);
          // status 필드를 아예 포함하지 않아서 기존값 유지
        }
        
        const upsertPromise = supabase.from('users').upsert(upsertData);
        
        const { error: upsertError } = await Promise.race([upsertPromise, timeoutPromise]) as any;
        
        if (upsertError) {
          console.error('[useAuth] upsert users error:', upsertError);
        } else {
          console.log('[useAuth] users 테이블 upsert 완료');
        }
      } catch (e) {
        console.error('[useAuth] upsert users failed:', e);
      }
    };
    
    // 백그라운드에서 데이터베이스 작업 실행
    Promise.all([updateUserData(), upsertUserData()]).catch(e => {
      console.error('[useAuth] background tasks failed:', e);
    });
    
    console.log('[useAuth] handleUserSession 완료');
  };


  const login = async (provider: string = 'kakao') => {
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: provider as any,
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });
    if (error) throw error;
  };

  const logout = async () => {
    try {
      // 1. 현재 사용자 ID 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      // 2. 백엔드 로그아웃 API 호출 (last_logout_at 업데이트)
      if (user?.id) {
        try {
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id }),
          });
          
          if (!response.ok) {
            console.warn('백엔드 로그아웃 API 호출 실패:', response.status);
          } else {
            console.log('백엔드 로그아웃 기록 저장 완료');
          }
        } catch (apiError) {
          console.warn('백엔드 로그아웃 API 호출 중 오류:', apiError);
          // 백엔드 오류가 있어도 로그아웃은 진행
        }
      }
      
      // 3. Supabase 로그아웃
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      // 1. 현재 사용자 정보 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('사용자를 찾을 수 없습니다');

      const userId = user.id;
      logToServer('[useAuth] deleteAccount: 회원탈퇴 시작', { userId });

      // 2. 백엔드에 회원탈퇴 요청
      try {
        const response = await fetch('/api/auth/delete-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '회원탈퇴 처리에 실패했습니다');
        }

        const result = await response.json();
        logToServer('[useAuth] deleteAccount: 백엔드 삭제 완료', result);
      } catch (apiError) {
        console.error('[useAuth] 백엔드 회원탈퇴 실패:', apiError);
        // 백엔드 오류가 있어도 클라이언트 정리는 진행
      }

      // 3. Supabase Auth에서 사용자 삭제 시도
      try {
        // Supabase는 클라이언트에서 직접 사용자 삭제를 지원하지 않으므로 로그아웃으로 대체
        await supabase.auth.signOut();
      } catch (authError) {
        console.warn('[useAuth] Supabase 로그아웃 실패:', authError);
      }

      // 4. 클라이언트 측 모든 데이터 정리
      clearAllUserData();
      
      // 5. 상태 초기화
      lastUserIdRef.current = null;
      isInitializedRef.current = false;
      setUser(null);
      setIsLoggedIn(false);
      setIsLoading(false);

      logToServer('[useAuth] deleteAccount: 회원탈퇴 완료', { userId });
      
    } catch (error) {
      logToServer('[useAuth] deleteAccount: 회원탈퇴 실패', { error });
      console.error('[useAuth] 회원탈퇴 실패:', error);
      throw error;
    }
  };

  return { user, isLoggedIn, isLoading, login, logout, deleteAccount };
};


export default useAuth;