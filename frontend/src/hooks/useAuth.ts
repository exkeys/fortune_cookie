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
          localStorage.setItem('userId', data.user.id);
        } else {
          setUser(null);
          setIsLoggedIn(false);
          localStorage.removeItem('userId');
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

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user as User);
        setIsLoggedIn(true);
        localStorage.setItem('userId', session.user.id);
      } else {
        setUser(null);
        setIsLoggedIn(false);
        localStorage.removeItem('userId');
      }
      setIsLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (provider: string = 'kakao'): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) throw error;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
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
      const { error } = await supabase.from('users').upsert([
        { 
          id: user.id, 
          email: user.email,
          nickname: user.user_metadata?.name || user.email?.split('@')[0] || '사용자'
        }
      ], { 
        onConflict: 'email'
      });
      
      if (error && error.code !== '23505') {
        throw error;
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


