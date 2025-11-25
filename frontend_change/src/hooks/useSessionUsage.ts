import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useSessionUsage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // 초기 세션 확인
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id ?? null;
        
        // Supabase 세션이 없으면 localStorage의 백엔드 로그인 정보 확인
        if (!uid) {
          const backendAuthData = localStorage.getItem('auth_backend_user');
          if (backendAuthData) {
            try {
              const backendUser = JSON.parse(backendAuthData);
              if (backendUser.id) {
                setIsLoggedIn(true);
                setUserId(backendUser.id);
                return;
              }
            } catch {
              // 무시
            }
          }
        }
        
        setIsLoggedIn(!!uid);
        setUserId(uid);
      } catch {
        setIsLoggedIn(false);
        setUserId(null);
      }
    };

    checkInitialSession();

    const sub = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user?.id ?? null;
      
      // Supabase 세션이 없으면 localStorage 확인
      if (!uid && event === 'INITIAL_SESSION') {
        const backendAuthData = localStorage.getItem('auth_backend_user');
        if (backendAuthData) {
          try {
            const backendUser = JSON.parse(backendAuthData);
            if (backendUser.id) {
              setIsLoggedIn(true);
              setUserId(backendUser.id);
              return;
            }
          } catch {
            // 무시
          }
        }
      }
      
      setIsLoggedIn(!!uid);
      setUserId(uid);
    });
    
    // localStorage 변경 감지 (다른 탭에서의 변경 감지용)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_backend_user') {
        if (e.newValue) {
          try {
            const backendUser = JSON.parse(e.newValue);
            if (backendUser.id) {
              setIsLoggedIn(true);
              setUserId(backendUser.id);
            }
          } catch {
            // 무시
          }
        } else {
          // localStorage에서 삭제된 경우
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
              setIsLoggedIn(false);
              setUserId(null);
            }
          });
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => { 
      sub.data?.subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const sessionActiveRef = useRef(false);
  const bufferedMsRef = useRef(0);
  const lastActivityAtRef = useRef<number>(Date.now());
  const lastFlushAtRef = useRef<number>(0);
  const flushTimerRef = useRef<number | null>(null);
  const inactivityTimerRef = useRef<number | null>(null);
  const isFlushingRef = useRef(false); // 중복 flush 방지용

  const markActivity = useCallback(() => { 
    lastActivityAtRef.current = Date.now(); 
  }, []);
  
  const clearTimers = () => { 
    if (flushTimerRef.current) {
      clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };
  
  const resetInactivityTimer = () => { 
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = window.setTimeout(() => {
      stopSession('idle');
    }, 20 * 60 * 1000) as unknown as number; 
  };

  const flushBuffer = async () => {
    // 이미 flush 중이면 무시
    if (isFlushingRef.current) return;
    
    const now = Date.now();
    const elapsed = now - (lastFlushAtRef.current || now);
    
    if (sessionActiveRef.current && now - lastActivityAtRef.current < 20 * 60 * 1000) {
      bufferedMsRef.current += elapsed;
    }
    
    lastFlushAtRef.current = now;

    // userId 확인 (localStorage fallback)
    let currentUserId = userId;
    if (!currentUserId) {
      const backendAuthData = localStorage.getItem('auth_backend_user');
      if (backendAuthData) {
        try {
          const backendUser = JSON.parse(backendAuthData);
          currentUserId = backendUser.id;
        } catch {
          // 무시
        }
      }
    }
    
    if (!currentUserId) return;
    
    // total_usage_minutes 컬럼 제거로 인해 사용 시간 전송 로직 제거됨
    // bufferedMsRef는 세션 추적용으로만 사용 (전송하지 않음)
  };

  const startSession = useCallback(() => {
    if (!isLoggedIn || !userId || sessionActiveRef.current) return;
    
    sessionActiveRef.current = true;
    lastActivityAtRef.current = Date.now();
    lastFlushAtRef.current = Date.now();
    
    if (!flushTimerRef.current) {
      flushTimerRef.current = window.setInterval(() => { 
        void flushBuffer(); 
      }, 60 * 1000) as unknown as number;
    }
    
    resetInactivityTimer();
  }, [isLoggedIn, userId]);

  const stopSession = useCallback(async (reason: string) => {
    if (!sessionActiveRef.current) return;
    
    sessionActiveRef.current = false;
    clearTimers();
    
    // logout이 아닌 경우에만 flush
    if (reason !== 'logout') {
      await flushBuffer();
    }
  }, []);

  useEffect(() => {
    const onActivity = () => { 
      markActivity(); 
      resetInactivityTimer(); 
    };
    
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('click', onActivity);
    window.addEventListener('scroll', onActivity);
    
    // beforeunload 이벤트를 visibility change로 대체
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // 탭이 백그라운드로 갈 때만 flush (창 닫기와 구분)
        if (sessionActiveRef.current && !isFlushingRef.current) {
          void flushBuffer();
        }
      }
    };
    
    // Page Visibility API 사용
    document.addEventListener('visibilitychange', onVisibilityChange);
    
    // cleanup
    return () => { 
      window.removeEventListener('mousemove', onActivity); 
      window.removeEventListener('keydown', onActivity); 
      window.removeEventListener('click', onActivity); 
      window.removeEventListener('scroll', onActivity); 
      document.removeEventListener('visibilitychange', onVisibilityChange);
      
      // cleanup 시 타이머만 정리, flush는 하지 않음
      clearTimers();
    };
  }, [markActivity]);

  useEffect(() => { 
    if (isLoggedIn && userId) {
      startSession();
    } else {
      stopSession('logout');
    }
  }, [isLoggedIn, userId, startSession, stopSession]);
  
  // 컴포넌트 unmount 시 cleanup
  useEffect(() => {
    return () => {
      clearTimers();
      // unmount 시에는 flush하지 않음
    };
  }, []);
}