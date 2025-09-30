import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useSessionUsage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user?.id ?? null;
      setIsLoggedIn(!!uid);
      setUserId(uid);
    });
    return () => { sub.data?.subscription.unsubscribe(); };
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

  const flushBuffer = async (final = false) => {
    // 이미 flush 중이면 무시
    if (isFlushingRef.current) return;
    
    const now = Date.now();
    const elapsed = now - (lastFlushAtRef.current || now);
    
    if (sessionActiveRef.current && now - lastActivityAtRef.current < 20 * 60 * 1000) {
      bufferedMsRef.current += elapsed;
    }
    
    lastFlushAtRef.current = now;

    if (!userId) return;
    
    const minutes = Math.floor(bufferedMsRef.current / 60000) || (final && bufferedMsRef.current > 0 ? 1 : 0);
    
    if (minutes > 0) {
      try {
        isFlushingRef.current = true;
        const { error } = await supabase.rpc('add_usage_minutes', { delta_minutes: minutes });
        if (!error) {
          bufferedMsRef.current -= minutes * 60000;
        }
      } catch (err) {
        console.error('Failed to flush buffer:', err);
      } finally {
        isFlushingRef.current = false;
      }
    }
  };

  const startSession = useCallback(() => {
    if (!isLoggedIn || !userId || sessionActiveRef.current) return;
    
    sessionActiveRef.current = true;
    lastActivityAtRef.current = Date.now();
    lastFlushAtRef.current = Date.now();
    
    if (!flushTimerRef.current) {
      flushTimerRef.current = window.setInterval(() => { 
        void flushBuffer(false); 
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
      await flushBuffer(true);
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
          void flushBuffer(false);
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