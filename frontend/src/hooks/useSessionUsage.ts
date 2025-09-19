import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './useAuth';

// 세션 기반 분 단위 사용시간 집계 훅
// - 로그인 시 세션 시작
// - 로그아웃/탭 종료/가시성 hidden/20분 무활동 시 종료로 간주하고 누적 반영
// - 1분 미만도 누적 보장: 내부 버퍼에 ms를 모았다가 60초마다 반영

const INACTIVITY_LIMIT_MS = 20 * 60 * 1000; // 20분
const FLUSH_INTERVAL_MS = 60 * 1000; // 1분마다 강제 플러시

export function useSessionUsage() {
  const { user, isLoggedIn } = useAuth();
  const [debugInfo, setDebugInfo] = useState({
    isLoggedIn: false,
    sessionActive: false,
    bufferedMs: 0,
    lastActivityAt: 0,
    lastFlushAt: 0,
    totalFlushedMinutes: 0,
    lastFlushMinutes: 0,
    lastEvent: 'init'
  });

  const sessionActiveRef = useRef(false);
  const bufferedMsRef = useRef(0);
  const lastActivityAtRef = useRef<number>(Date.now());
  const lastFlushAtRef = useRef<number>(0);
  const flushTimerRef = useRef<number | null>(null);
  const inactivityTimerRef = useRef<number | null>(null);

  const markActivity = useCallback(() => {
    lastActivityAtRef.current = Date.now();
    setDebugInfo((d) => ({ ...d, lastActivityAt: lastActivityAtRef.current, lastEvent: 'activity' }));
  }, []);

  const startSession = useCallback(() => {
    if (!isLoggedIn || !user) return;
    if (sessionActiveRef.current) return;
    sessionActiveRef.current = true;
    lastActivityAtRef.current = Date.now();
    lastFlushAtRef.current = Date.now();
    setDebugInfo((d) => ({
      ...d,
      isLoggedIn: true,
      sessionActive: true,
      lastActivityAt: lastActivityAtRef.current,
      lastFlushAt: lastFlushAtRef.current,
      lastEvent: 'session_start'
    }));

    // 1분마다 플러시
    if (!flushTimerRef.current) {
      flushTimerRef.current = window.setInterval(() => {
        void flushBuffer('interval');
      }, FLUSH_INTERVAL_MS) as unknown as number;
    }

    // 무활동 타이머 시작
    resetInactivityTimer();
  }, [isLoggedIn, user]);

  const stopSession = useCallback((reason: string) => {
    if (!sessionActiveRef.current) return;
    sessionActiveRef.current = false;
    clearTimers();
    void flushBuffer(reason, true); // 종료 시 마지막까지 반영
    setDebugInfo((d) => ({ ...d, sessionActive: false, lastEvent: `session_stop:${reason}` }));
  }, []);

  function clearTimers() {
    if (flushTimerRef.current) {
      clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }

  function resetInactivityTimer() {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = window.setTimeout(() => {
      stopSession('inactivity_20m');
    }, INACTIVITY_LIMIT_MS) as unknown as number;
  }

  // 버퍼에 ms 누적 -> 분으로 올림 없이 합산하고, 서버에는 분 단위로 증분 반영
  async function flushBuffer(trigger: string, final: boolean = false) {
    const now = Date.now();
    const elapsedSinceLastFlush = now - (lastFlushAtRef.current || now);
    if (elapsedSinceLastFlush < 0) return;

    // 마지막 활동 이후 경과 ms만큼 버퍼 증가
    const elapsedSinceLastActivity = now - lastActivityAtRef.current;
    // 세션 중이고, 20분 유휴가 아니면 누적
    if (sessionActiveRef.current && elapsedSinceLastActivity < INACTIVITY_LIMIT_MS) {
      bufferedMsRef.current += elapsedSinceLastFlush;
    }

    lastFlushAtRef.current = now;

    // 버퍼를 분 단위로 변환하여 서버 반영
    const minutes = Math.floor(bufferedMsRef.current / 60000);
    if (minutes > 0 && user) {
      const { error } = await supabase.rpc('add_usage_minutes', { delta_minutes: minutes });
      if (!error) {
        bufferedMsRef.current -= minutes * 60000;
        setDebugInfo((d) => ({
          ...d,
          lastFlushAt: now,
          lastFlushMinutes: minutes,
          totalFlushedMinutes: d.totalFlushedMinutes + minutes,
          bufferedMs: bufferedMsRef.current,
          lastEvent: `flush:${trigger}${final ? ':final' : ''}`
        }));
      } else {
        setDebugInfo((d) => ({ ...d, lastEvent: `flush_error:${trigger}` }));
        // 에러 시 버퍼는 보존하여 재시도
      }
    } else if (final && bufferedMsRef.current > 0 && user) {
      // 최종 종료인데 1분 미만이 남아있다면 1분으로 반영하여 손실 방지
      const { error } = await supabase.rpc('add_usage_minutes', { delta_minutes: 1 });
      if (!error) {
        bufferedMsRef.current = 0;
        setDebugInfo((d) => ({
          ...d,
          lastFlushAt: now,
          lastFlushMinutes: 1,
          totalFlushedMinutes: d.totalFlushedMinutes + 1,
          bufferedMs: 0,
          lastEvent: `flush_force_minute:${trigger}`
        }));
      }
    } else {
      setDebugInfo((d) => ({ ...d, lastFlushAt: now, bufferedMs: bufferedMsRef.current, lastEvent: `flush_noop:${trigger}` }));
    }
  }

  // 전역 이벤트 바인딩(유휴 판단용)
  useEffect(() => {
    const onActivity = () => {
      markActivity();
      resetInactivityTimer();
    };

    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('click', onActivity);
    window.addEventListener('scroll', onActivity);

    const onVisibilityChange = () => {
      if (document.hidden) {
        // 숨길 때 즉시 플러시(버퍼 손실 방지)
        void flushBuffer('visibility_hidden');
      } else {
        markActivity();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const onBeforeUnload = () => {
      // 종료 직전 최종 반영 시도
      void flushBuffer('beforeunload', true);
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('click', onActivity);
      window.removeEventListener('scroll', onActivity);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [markActivity]);

  // 로그인/로그아웃 변화 감지
  useEffect(() => {
    if (isLoggedIn && user) {
      startSession();
    } else {
      stopSession('logout');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user?.id]);

  return {
    debugInfo
  };
}


