import { useState } from 'react';
import { API_ENDPOINTS } from '../constants';

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
    return await request(API_ENDPOINTS.save, {
      method: 'POST',
      body: JSON.stringify({ 
        persona, 
        concern, 
        aiAnswer, 
        userId 
      }),
    });
  };

  const getConcerns = async (userId) => {
    return await request(`${API_ENDPOINTS.concerns}/${userId}`, {
      method: 'GET',
    });
  };

  const deleteConcern = async (concernId) => {
    return await request(`${API_ENDPOINTS.concerns}/${concernId}`, {
      method: 'DELETE',
    });
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
