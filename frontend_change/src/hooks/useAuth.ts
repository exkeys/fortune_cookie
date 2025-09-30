import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import type { User as BaseUser } from '../types';


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
}

export const useAuth = (): AuthReturn => {
  const [user, setUser] = useState<(BaseUser & { is_admin?: boolean; status?: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);



  // robust: 마지막으로 setUser한 user id를 기억
  const lastUserIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  const processingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // robust: 사용자 세션 처리 함수
    const handleUserSession = async (session: any) => {
      if (!session?.user) return;
      const meta = session.user.user_metadata || {};
      const displayName = meta.nickname || meta.name || meta.full_name || (session.user.email ? session.user.email.split('@')[0] : '');
      // 기본 사용자 데이터로 우선 설정
      const defaultUserData = {
        ...(session.user as BaseUser),
        is_admin: false,
        status: 'active',
        school: 'unknown',
      };
      lastUserIdRef.current = session.user.id;
      setUser(defaultUserData);
      setIsLoggedIn(true);
      // DB에서 정보 조회 및 업데이트(실패해도 로그인은 유지)
      const updateUserData = async () => {
        try {
          const selectPromise = supabase
            .from('users')
            .select('is_admin, status, school')
            .eq('id', session.user.id)
            .single();
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('select timeout')), 2000));
          const { data: userRow, error: userError } = await Promise.race([selectPromise, timeoutPromise]) as any;
          if (!userError && userRow) {
            const updatedUserData = {
              ...(session.user as BaseUser),
              is_admin: userRow?.is_admin ?? false,
              status: userRow?.status ?? 'active',
              school: userRow?.school ?? undefined,
            };
            setUser(updatedUserData);
          } else {
            setUser(defaultUserData);
          }
        } catch (e) {
          setUser(defaultUserData);
        }
      };
      // upsert 작업(백그라운드)
      const upsertUserData = async () => {
        try {
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('upsert timeout')), 3000));
          const upsertPromise = supabase.from('users').upsert({
            id: session.user.id,
            email: session.user.email,
            nickname: displayName,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          await Promise.race([upsertPromise, timeoutPromise]);
        } catch (e) {}
      };
      Promise.all([updateUserData(), upsertUserData()]).catch(() => {});
    };

    // robust: onAuthStateChange 리스너 등록
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
        } catch (error) {} finally {
          processingRef.current = false;
          if (isMounted) setIsLoading(false);
        }
        return;
      }
      if (event === 'SIGNED_OUT') {
        logToServer('[useAuth] onAuthStateChange: SIGNED_OUT', { event, session });
        lastUserIdRef.current = null;
        isInitializedRef.current = false;
        if (isMounted) {
          setUser(null);
          setIsLoggedIn(false);
          setIsLoading(false);
        }
        return;
      }
      logToServer('[useAuth] onAuthStateChange: IGNORED', { event, session });
    });

    // robust: 새로고침 등에서 onAuthStateChange가 불안정할 때 fallback
    const initializeAuth = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          if (isMounted) {
            setUser(null);
            setIsLoggedIn(false);
            setIsLoading(false);
          }
          return;
        }
        // fallback: onAuthStateChange가 아직 호출되지 않았다면 직접 처리
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
            } catch (error) {} finally {
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



  const login = async (provider: string = 'kakao') => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: provider as any });
    if (error) throw error;
  };

  const logout = async () => {
    // 로그아웃 시간을 Supabase users 테이블에 직접 업데이트
    if (user?.id) {
      try {
        await supabase
          .from('users')
          .update({ last_logout_at: new Date().toISOString() })
          .eq('id', user.id);
        console.log('[useAuth] logout time updated in users table');
      } catch (e) {
        console.error('[useAuth] logout time update failed:', e);
        // 업데이트 실패해도 로그아웃은 계속 진행
      }
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { user, isLoggedIn, isLoading, login, logout };
};


export default useAuth;