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

  const markActivity = useCallback(() => { lastActivityAtRef.current = Date.now(); }, []);
  const clearTimers = () => { if (flushTimerRef.current) clearInterval(flushTimerRef.current); if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current); };
  const resetInactivityTimer = () => { if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current); inactivityTimerRef.current = window.setTimeout(() => stopSession('idle'), 20 * 60 * 1000) as unknown as number; };

  const flushBuffer = async (final = false) => {
    const now = Date.now();
    const elapsed = now - (lastFlushAtRef.current || now);
    if (sessionActiveRef.current && now - lastActivityAtRef.current < 20 * 60 * 1000) bufferedMsRef.current += elapsed;
    lastFlushAtRef.current = now;

    if (!userId) return;
    const minutes = Math.floor(bufferedMsRef.current / 60000) || (final && bufferedMsRef.current > 0 ? 1 : 0);
    if (minutes > 0) {
      const { error } = await supabase.rpc('add_usage_minutes', { delta_minutes: minutes });
      if (!error) bufferedMsRef.current -= minutes * 60000;
    }
  };

  const startSession = useCallback(() => {
    if (!isLoggedIn || !userId || sessionActiveRef.current) return;
    sessionActiveRef.current = true;
    lastActivityAtRef.current = Date.now();
    lastFlushAtRef.current = Date.now();
    if (!flushTimerRef.current) flushTimerRef.current = window.setInterval(() => { void flushBuffer(false); }, 60 * 1000) as unknown as number;
    resetInactivityTimer();
  }, [isLoggedIn, userId]);

  const stopSession = useCallback(async (_reason: string) => {
    if (!sessionActiveRef.current) return;
    sessionActiveRef.current = false;
    clearTimers();
    await flushBuffer(true);
  }, []);

  useEffect(() => {
    const onActivity = () => { markActivity(); resetInactivityTimer(); };
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('click', onActivity);
    window.addEventListener('scroll', onActivity);
    const onBeforeUnload = () => { void flushBuffer(true); };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => { window.removeEventListener('mousemove', onActivity); window.removeEventListener('keydown', onActivity); window.removeEventListener('click', onActivity); window.removeEventListener('scroll', onActivity); window.removeEventListener('beforeunload', onBeforeUnload); };
  }, [markActivity]);

  useEffect(() => { if (isLoggedIn && userId) startSession(); else stopSession('logout'); }, [isLoggedIn, userId, startSession, stopSession]);
}


