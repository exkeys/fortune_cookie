
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
    async function check() {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          // users 테이블에서 is_admin 값도 가져오기
          const { data: adminData } = await supabase
            .from('users')
            .select('is_admin, status')
            .eq('id', data.user.id)
            .single();
          setUser({ ...(data.user as BaseUser), is_admin: adminData?.is_admin, status: adminData?.status });
          setIsLoggedIn(true);
        } else {
          setUser(null);
          setIsLoggedIn(false);
        }
      } finally {
        setIsLoading(false);
      }
    }
    check();
    const { data: listener } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        // users 테이블에서 is_admin 값도 가져오기
        const { data: adminData } = await supabase
          .from('users')
          .select('is_admin, status')
          .eq('id', session.user.id)
          .single();
        setUser({ ...(session.user as BaseUser), is_admin: adminData?.is_admin, status: adminData?.status });
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    });
    return () => listener?.subscription.unsubscribe();
  }, []);


  const login = async (provider: string = 'kakao') => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: provider as any });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { user, isLoggedIn, isLoading, login, logout };
};


