import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import type { User as BaseUser } from '../types';

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
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 사용자 상태를 설정하는 함수
    const setUserState = async (session: any, isNewLogin: boolean = false) => {
      if (!session?.user) return;

      const meta = session.user.user_metadata || {};
      const displayName = meta.nickname || meta.name || meta.full_name || (session.user.email ? session.user.email.split('@')[0] : '');
      
      // 새 로그인인 경우에만 사용자 정보 업데이트
      if (isNewLogin) {
        try {
          const { data: existingUser } = await supabase
            .from('users')
            .select('login_count, created_at, last_login_at, last_logout_at')
            .eq('id', session.user.id)
            .single();
          
          const prevCount = existingUser?.login_count ?? 0;
          const existingCreatedAt = existingUser?.created_at;

          await supabase.from('users').upsert({
            id: session.user.id,
            email: session.user.email,
            nickname: displayName,
            status: 'active',
            created_at: existingCreatedAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            login_count: prevCount + 1,
            last_login_at: new Date().toISOString(),
            last_logout_at: null,
          });
        } catch (e) {
          console.error('[useAuth] upsert users failed:', e);
        }
      }

      // 사용자 정보 조회 및 상태 설정
      try {
        const { data: userRow } = await supabase
          .from('users')
          .select('is_admin, status, school')
          .eq('id', session.user.id)
          .single();
        
        setUser({
          ...(session.user as BaseUser),
          is_admin: userRow?.is_admin ?? false,
          status: userRow?.status ?? 'active',
          school: userRow?.school ?? undefined,
        });
      } catch (e) {
        console.error('[useAuth] select users failed:', e);
        setUser(session.user as BaseUser);
      }
      
      lastUserIdRef.current = session.user.id;
      setIsLoggedIn(true);
      setIsLoading(false);
    };

    // onAuthStateChange 리스너 등록
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] onAuthStateChange event:', event, session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // 새로운 로그인
        await setUserState(session, true);
        return;
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoggedIn(false);
        setIsLoading(false);
        lastUserIdRef.current = null;
        return;
      }

      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          // 세션 복구 (새로고침 등)
          await setUserState(session, false);
        } else {
          // 세션이 없으면 로그아웃 상태로 설정
          setUser(null);
          setIsLoggedIn(false);
          lastUserIdRef.current = null;
        }
        setIsLoading(false);
        return;
      }

      // 기타 이벤트는 로딩만 해제
      if (event === 'TOKEN_REFRESHED') {
        setIsLoading(false);
      }
    });

    return () => listener?.subscription.unsubscribe();
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