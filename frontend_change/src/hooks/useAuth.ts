// 서버로 로그 전송 함수
async function logToServer(message: string, data?: any) {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, data }),
    });
  } catch (e) {
    // 서버로 로그 전송 실패 시 무시
  }
}
import { useEffect, useState } from 'react';
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


  useEffect(() => {
    // 1. onAuthStateChange 리스너를 먼저 등록
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] onAuthStateChange event:', event, session);
      // 세션 이벤트별로 로그 추가
      if (event === 'SIGNED_OUT') {
        logToServer('[useAuth] onAuthStateChange: SIGNED_OUT', { event, session });
      }
      if (event === 'TOKEN_REFRESHED') {
        logToServer('[useAuth] onAuthStateChange: TOKEN_REFRESHED', { event, session });
      }
      if (event === 'SIGNED_IN') {
        logToServer('[useAuth] onAuthStateChange: SIGNED_IN', { event, session });
      }
      if (session?.user) {
        // users 테이블에 row가 없으면 자동 upsert
        // 닉네임 우선순위: nickname > name > full_name > email 앞부분
        const meta = session.user.user_metadata || {};
        const displayName = meta.nickname || meta.name || meta.full_name || (session.user.email ? session.user.email.split('@')[0] : '');
        await supabase.from('users').upsert({
          id: session.user.id,
          email: session.user.email,
          nickname: displayName,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        // users 테이블에서 is_admin, status, school 값도 가져오기
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
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    });

    // 2. 앱 첫 로드시 세션 복구를 기다리기 위해 getSession()에서 null이어도 바로 setUser(null)하지 않음
    (async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) console.error('[useAuth] getSession error:', sessionError);
        console.log('[useAuth] getSession (init):', sessionData);
        // 세션이 있으면 onAuthStateChange에서 처리됨. 세션이 없어도 바로 setUser(null)하지 않음.
        // 단, 앱이 mount되고 1.5초(1500ms) 내에 onAuthStateChange가 호출되지 않으면 setUser(null)로 fallback
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      } catch (err) {
        console.error('[useAuth] getSession (init) unexpected error:', err);
        setIsLoading(false);
      }
    })();
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