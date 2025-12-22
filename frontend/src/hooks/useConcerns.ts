import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

interface HistoryItem {
  id: string;
  persona: string;
  concern: string;
  ai_response: string;
  ai_feed: string;
  created_at: string;
  is_saved: boolean;
}

// 고민 목록 조회
export const useConcerns = (userId: string | undefined, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['concerns', userId],
    queryFn: async (): Promise<HistoryItem[]> => {
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('ai_answers')
        .select('id, persona, concern, ai_response, ai_feed, created_at, is_saved')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('고민 목록 조회 실패:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!userId && enabled,
    staleTime: 0, // 항상 최신 데이터 조회 (운세 저장 후 즉시 반영)
    gcTime: 300000, // 5분간 캐시 보관 (메모리 최적화)
    refetchOnWindowFocus: false, // 포커스 시 자동 refetch 비활성화 (불필요한 API 호출 방지)
    refetchOnMount: true, // 마운트 시 항상 refetch (최신 데이터 보장)
  });
};

// 고민 삭제
export const useDeleteConcern = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (concernId: string) => {
      const { error } = await supabase
        .from('ai_answers')
        .delete()
        .eq('id', concernId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // 고민 목록 캐시 무효화 (자동 재조회)
      queryClient.invalidateQueries({ queryKey: ['concerns'] });
    },
  });
};

// 고민 저장 상태 변경
export const useUpdateConcernSaveStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ concernId, isSaved }: { concernId: string; isSaved: boolean }) => {
      const { error } = await supabase
        .from('ai_answers')
        .update({ is_saved: isSaved })
        .eq('id', concernId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // 고민 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['concerns'] });
    },
  });
};

