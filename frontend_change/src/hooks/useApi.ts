import { useState } from 'react';
import { API_ENDPOINTS } from '../constants';
import { supabase } from '../supabaseClient';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const request = async (endpoint: string, options: RequestInit = {}) => {
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
  };

  const getAiAnswer = async (persona: string, concern: string) => {
    return await request(API_ENDPOINTS.ai, { method: 'POST', body: JSON.stringify({ persona, concern }) });
  };

  const saveConcern = async (persona: string, concern: string, aiAnswer: string, userId?: string) => {
    try {
      if (!userId) return { data: null, error: '로그인이 필요합니다' } as const;
      
      
      // upsert 사용: 동일한 user_id + persona + concern이 있으면 업데이트, 없으면 삽입
      const { error } = await supabase.from('ai_answers').upsert({ 
        user_id: userId, 
        persona, 
        concern, 
        ai_response: aiAnswer, 
        is_saved: true,
        created_at: new Date().toISOString() // 업데이트 시에도 현재 시간으로 갱신하여 최신순 정렬
      }, {
        onConflict: 'user_id,persona,concern' // 충돌 시 기준 컬럼
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

  return { loading, error, request, getAiAnswer, saveConcern, saveConcernToBackend } as const;
};


