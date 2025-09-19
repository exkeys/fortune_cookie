import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '../types';

interface AuthReturn {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (provider?: string) => Promise<void>;
  logout: () => Promise<void>;
  saveUserToDB: () => Promise<{ error: any }>;
}

export const useAuth = (): AuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    async function checkUser() {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUser(data.user as User);
          setIsLoggedIn(true);
          // 초기 로드 시에도 사용자 정보를 데이터베이스에 저장
          try {
            await saveUserToDB();
          } catch (error) {
            console.error('사용자 DB 저장 실패:', error);
          }
        } else {
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user as User);
        setIsLoggedIn(true);
        // 로그인 시 사용자 정보를 데이터베이스에 저장
        try {
          await saveUserToDB();
        } catch (error) {
          console.error('사용자 DB 저장 실패:', error);
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (provider: string = 'kakao'): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: provider as any });
      if (error) throw error;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // 로그아웃 직전에 마지막 로그아웃 시각 저장 (세션 유효할 때만)
      try {
        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = (authData?.user as any)?.id || (user as any)?.id;
        if (currentUserId) {
          // 1) 서버시간 기준 RPC 우선 시도
          const { error: rpcError } = await supabase.rpc('set_last_logout_now');
          if (rpcError) {
            // 2) 실패 시 클라이언트 시간으로 upsert (행이 없어도 보장 저장)
            await supabase
              .from('users')
              .upsert([{ id: currentUserId, last_logout_at: new Date().toISOString() }], { onConflict: 'id' });
          }
        }
      } catch (e) {
        console.warn('로그아웃 시간 저장 경고(무시 가능):', e);
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const saveUserToDB = async (): Promise<{ error: any }> => {
    if (!user) return { error: 'No user found' };

    try {
      // 먼저 기존 사용자가 있는지 확인 (id 기준)
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id, email, login_count')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116은 "not found" 에러
        console.error('사용자 조회 에러:', fetchError);
        throw fetchError;
      }

      if (existingUser) {
        // 기존 사용자가 있으면 업데이트 (login_count 증가)
        const { error } = await supabase
          .from('users')
          .update({
            email: user.email,
            nickname: (user as any).user_metadata?.name || user.email?.split('@')[0] || '사용자',
            oauth_provider: (user as any).app_metadata?.provider || 'kakao',
            last_login_at: new Date().toISOString(),
            login_count: (existingUser.login_count || 0) + 1,
            status: 'active'
          })
          .eq('id', user.id);

        if (error) {
          console.error('사용자 업데이트 에러:', error);
          throw error;
        }
      } else {
        // 새 사용자면 삽입 시도
        const { error } = await supabase
          .from('users')
          .insert([
            { 
              id: user.id, 
              email: user.email,
              nickname: (user as any).user_metadata?.name || user.email?.split('@')[0] || '사용자',
              oauth_provider: (user as any).app_metadata?.provider || 'kakao',
              last_login_at: new Date().toISOString(),
              login_count: 1,
              status: 'active'
            }
          ]);

        if (error) {
          // 이메일 중복 에러인 경우, 기존 사용자 정보만 업데이트
          if (error.code === '23505' && error.message.includes('email')) {
            console.log('이메일 중복 감지, 기존 사용자 정보 업데이트 시도');
            // 이메일로 기존 사용자 조회
            const { data: existingUserByEmail, error: fetchEmailError } = await supabase
              .from('users')
              .select('id, email, login_count')
              .eq('email', user.email)
              .single();

            if (fetchEmailError) {
              console.error('이메일로 사용자 조회 에러:', fetchEmailError);
              throw fetchEmailError;
            }

            const { error: updateError } = await supabase
              .from('users')
              .update({
                //id: user.id, // 새로운 Supabase Auth ID로 업데이트
                nickname: (user as any).user_metadata?.name || user.email?.split('@')[0] || '사용자',
                oauth_provider: (user as any).app_metadata?.provider || 'kakao',
                last_login_at: new Date().toISOString(),
                login_count: (existingUserByEmail?.login_count || 0) + 1,
                status: 'active'
              })
              .eq('email', user.email)

            if (updateError) {
              console.error('이메일 중복 사용자 업데이트 에러:', updateError);
              throw updateError;
            }
          } else {
            console.error('사용자 삽입 에러:', error);
            throw error;
          }
        }
      }
      
      return { error: null };
    } catch (error) {
      console.error('DB 저장 에러:', error);
      return { error };
    }
  };

  return {
    user,
    isLoggedIn,
    isLoading,
    login,
    logout,
    saveUserToDB,
  };
};


