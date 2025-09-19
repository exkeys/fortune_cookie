import { useState } from 'react';
import { API_ENDPOINTS } from '../constants';
import { supabase } from '../supabaseClient';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const request = async (endpoint, options = {}) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_ENDPOINTS.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (err) {
      const errorMessage = err.message || 'API 요청 실패';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getAiAnswer = async (persona, concern) => {
    return await request(API_ENDPOINTS.ai, {
      method: 'POST',
      body: JSON.stringify({ persona, concern }),
    });
  };

  const saveConcern = async (persona, concern, aiAnswer, userId) => {
    // Supabase RLS를 통과하려면 인증된 사용자 세션으로 직접 저장해야 함
    try {
      if (!userId) {
        return { data: null, error: '로그인이 필요합니다' };
      }

      const { error } = await supabase
        .from('ai_answers')
        .insert({
          user_id: userId,
          persona,
          concern,
          ai_response: aiAnswer,
          is_saved: true,
        });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: { success: true }, error: null };
    } catch (err) {
      return { data: null, error: err?.message || '저장 실패' };
    }
  };

  const getConcerns = async (userId) => {
    try {
      if (!userId) {
        return { data: { concerns: [] }, error: null };
      }
      const { data, error } = await supabase
        .from('ai_answers')
        .select('id, persona, concern, ai_response, is_saved, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }
      return { data: { concerns: data || [] }, error: null };
    } catch (err) {
      return { data: null, error: err?.message || '목록 조회 실패' };
    }
  };

  const deleteConcern = async (concernId) => {
    try {
      const { error } = await supabase
        .from('ai_answers')
        .delete()
        .eq('id', concernId);

      if (error) {
        return { data: null, error: error.message };
      }
      return { data: { success: true }, error: null };
    } catch (err) {
      return { data: null, error: err?.message || '삭제 실패' };
    }
  };

  return {
    loading,
    error,
    request,
    getAiAnswer,
    saveConcern,
    getConcerns,
    deleteConcern,
  };
};
