import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../supabaseClient';

export const useAnalytics = () => {
  const { user } = useAuth();
  const pageStartTimeRef = useRef(null);

  // 페이지 진입 시간 기록
  const trackPageEnter = (pageName) => {
    pageStartTimeRef.current = Date.now();
  };

  // 페이지 이탈 시간 기록
  const trackPageExit = (pageName) => {
    if (pageStartTimeRef.current && user) {
      const duration = Date.now() - pageStartTimeRef.current;
      if (duration > 0) {
        updateUserTotalUsageTime(duration);
      }
      pageStartTimeRef.current = null;
    }
  };

  // 기존 페이지 체류 시간 집계는 세션 기반 훅으로 대체됨(중복 방지 위해 비활성)
  const updateUserTotalUsageTime = async (_duration) => {
    return;
  };

  // 탭 전환/백그라운드 전환 시에도 시간 기록
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        trackPageExit('visibility_hidden');
      } else {
        trackPageEnter('visibility_visible');
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [user]);

  return {
    trackPageEnter,
    trackPageExit,
    trackConcernSubmit: () => {},
    trackAIResponse: () => {},
    trackResultSave: () => {},
    trackSessionStart: () => {},
    trackSessionEnd: () => {},
    sessionId: 'simple-session'
  };
};
