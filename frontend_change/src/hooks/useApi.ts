
import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '../constants';
import { ensureAccessToken } from '../utils/authSession';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const request = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    setLoading(true);
    setError('');
    try {
      const { headers: optionHeaders, ...restOptions } = options;
      const headers = new Headers({ 'Content-Type': 'application/json' });

      if (optionHeaders) {
        if (optionHeaders instanceof Headers) {
          optionHeaders.forEach((value, key) => headers.set(key, value));
        } else if (Array.isArray(optionHeaders)) {
          optionHeaders.forEach(([key, value]) => headers.set(key, value));
        } else {
          Object.entries(optionHeaders).forEach(([key, value]) => headers.set(key, value));
        }
      }
      
      // 인증이 필요한 요청에만 토큰 추가
      const accessToken = await ensureAccessToken();
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
      
      const response = await fetch(`${API_ENDPOINTS.baseUrl}${endpoint}`, {
        credentials: 'include',
        headers,
        ...restOptions,
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

  const saveConcern = async (persona: string, concern: string, aiAnswer: string, aiFeed: string, updateId?: string) => {
    try {
      // updateId가 있으면 기존 레코드 업데이트 (비슷한 고민으로 새 운세 받기) - 백엔드 API 사용
      if (updateId) {
        return await request(`${API_ENDPOINTS.concerns}/${updateId}`, {
          method: 'PUT',
          body: JSON.stringify({
            aiAnswer,
            aiFeed
          })
        });
      }
      
      // updateId가 없으면 항상 새 레코드 생성 (일반 포춘쿠키 받기) - 백엔드 API 사용
      return await request(API_ENDPOINTS.save, {
        method: 'POST',
        body: JSON.stringify({
          persona, 
          concern, 
          aiAnswer,
          aiFeed
        })
      });
    } catch (err: any) {
      return { data: null, error: err?.message || '저장 실패' } as const;
    }
  };

  // backend 저장 경로 사용 (Express) - 하위 호환성 유지
  const saveConcernToBackend = async (persona: string, concern: string, aiAnswer: string) => {
    return await request(API_ENDPOINTS.save, {
      method: 'POST',
      body: JSON.stringify({ persona, concern, aiAnswer })
    });
  };

  return { loading, error, request, getAiAnswer, getAiBothAdvices, saveConcern, saveConcernToBackend } as const;
};


