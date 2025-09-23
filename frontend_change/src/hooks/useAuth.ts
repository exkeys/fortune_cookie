import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { User } from '../types';

interface AuthReturn {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (provider?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = (): AuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    async function check() {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUser(data.user as User);
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
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setUser(session.user as User);
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


