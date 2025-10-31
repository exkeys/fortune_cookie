
import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '../constants';
import { supabase } from '../supabaseClient';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const request = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_ENDPOINTS.baseUrl}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as any).error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      return { data, error: null } as const;
    } catch (err: any) {
      const errorMessage = err?.message || 'API 요청 실패';
      setError(errorMessage);
      return { data: null, error: errorMessage } as const;
    } finally {
      setLoading(false);
    }
  }, []);


  const getAiAnswer = async (persona: string, concern: string) => {
    return await request(API_ENDPOINTS.ai, { method: 'POST', body: JSON.stringify({ persona, concern }) });
  };

  const getAiBothAdvices = useCallback(async (persona: string, concern: string, randomFortune?: string) => {
    return await request(API_ENDPOINTS.aiBoth, {
      method: 'POST',
      body: JSON.stringify({ persona, concern, randomFortune })
    });
  }, [request]);

  const saveConcern = async (persona: string, concern: string, aiAnswer: string, aiFeed: string, userId?: string, updateId?: string) => {
    try {
      if (!userId) return { data: null, error: '로그인이 필요합니다' } as const;
      
      // updateId가 있으면 기존 레코드 업데이트 (비슷한 고민으로 새 운세 받기)
      if (updateId) {
        const { error } = await supabase
          .from('ai_answers')
          .update({
            ai_response: aiAnswer,
            ai_feed: aiFeed,
            updated_at: new Date().toISOString()
          })
          .eq('id', updateId)
          .eq('user_id', userId); // 보안: 본인 레코드만 업데이트
        
        if (error) {
          return { data: null, error: `업데이트 실패: ${error.message}` } as const;
        }
        return { data: { success: true }, error: null } as const;
      }
      
      // updateId가 없으면 항상 새 레코드 생성 (일반 포춘쿠키 받기)
      const { error } = await supabase.from('ai_answers').insert({ 
        user_id: userId, 
        persona, 
        concern, 
        ai_response: aiAnswer, 
        ai_feed: aiFeed,
        is_saved: true
      });
      
      if (error) {
        return { data: null, error: `저장 실패: ${error.message}` } as const;
      }
      return { data: { success: true }, error: null } as const;
    } catch (err: any) {
      return { data: null, error: err?.message || '저장 실패' } as const;
    }
  };

  // backend 저장 경로 사용 (Express)
  const saveConcernToBackend = async (persona: string, concern: string, aiAnswer: string, userId: string) => {
    return await request(API_ENDPOINTS.save, {
      method: 'POST',
      body: JSON.stringify({ persona, concern, aiAnswer, userId })
    });
  };

  return { loading, error, request, getAiAnswer, getAiBothAdvices, saveConcern, saveConcernToBackend } as const;
};


