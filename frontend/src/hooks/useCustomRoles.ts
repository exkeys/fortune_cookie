import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';

interface CustomRoleRow {
  id: string;
  role_name: string;
}

// 커스텀 역할 목록 조회
export const useCustomRoles = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['customRoles', userId],
    queryFn: async (): Promise<CustomRoleRow[]> => {
      if (!userId) {
        return [];
      }

      const response = await apiFetch(`/api/custom-roles`);
      if (!response.ok) {
        throw new Error('커스텀 역할 목록 조회 실패');
      }

      const result = await response.json();
      const data = result.customRoles || [];
      
      // localStorage에 캐시 저장 (다음 로딩 시 즉시 표시)
      try {
        const cacheData = {
          data,
          cachedAt: Date.now()
        };
        localStorage.setItem(`custom_roles_cache_${userId}`, JSON.stringify(cacheData));
      } catch (error) {
        // localStorage 저장 실패 시 무시
      }
      
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지 (초기 로딩 최적화)
    gcTime: 10 * 60 * 1000, // 10분간 캐시 보관
    refetchOnWindowFocus: false, // 포커스 시 자동 refetch 비활성화
    // 첫 로딩 시 localStorage 캐시를 즉시 표시 (깜빡임 방지)
    placeholderData: () => {
      if (!userId) return undefined;
      
      try {
        const cached = localStorage.getItem(`custom_roles_cache_${userId}`);
        if (cached) {
          const cacheData = JSON.parse(cached);
          const cacheAge = Date.now() - (cacheData.cachedAt || 0);
          // 10분 이내 캐시만 사용 (너무 오래된 캐시는 무시)
          if (cacheAge < 10 * 60 * 1000 && Array.isArray(cacheData.data)) {
            return cacheData.data;
          }
        }
      } catch (error) {
        // 캐시 파싱 실패 시 무시
      }
      
      return undefined;
    },
  });
};

// 커스텀 역할 생성
export const useCreateCustomRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiFetch('/api/custom-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleName: ''
        })
      });

      if (!response.ok) {
        throw new Error('커스텀 역할 생성 실패');
      }

      const result = await response.json();
      return { customRole: result.customRole, userId };
    },
    onSuccess: (data) => {
      // Optimistic Update: 새 역할을 캐시에 즉시 추가
      queryClient.setQueryData(['customRoles', data.userId], (old: CustomRoleRow[] | undefined) => {
        if (!old) return [data.customRole];
        return [...old, data.customRole];
      });
      
      // localStorage 캐시도 업데이트
      try {
        const updatedData = queryClient.getQueryData<CustomRoleRow[]>(['customRoles', data.userId]) || [];
        const cacheData = {
          data: updatedData,
          cachedAt: Date.now()
        };
        localStorage.setItem(`custom_roles_cache_${data.userId}`, JSON.stringify(cacheData));
      } catch (error) {
        // localStorage 업데이트 실패 시 무시
      }
      
      // 백그라운드에서 최신 데이터 확인 (선택사항)
      queryClient.invalidateQueries({ queryKey: ['customRoles', data.userId] });
    },
  });
};

// 커스텀 역할 수정
export const useUpdateCustomRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, roleName, userId }: { roleId: string; roleName: string; userId: string }) => {
      const response = await apiFetch(`/api/custom-roles/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleName
        })
      });

      if (!response.ok) {
        throw new Error('커스텀 역할 수정 실패');
      }

      return { roleId, roleName, userId };
    },
    onSuccess: (data) => {
      // Optimistic Update: 캐시 즉시 업데이트
      queryClient.setQueryData(['customRoles', data.userId], (old: CustomRoleRow[] | undefined) => {
        if (!old) return old;
        return old.map((role) =>
          role.id === data.roleId
            ? { ...role, role_name: data.roleName }
            : role
        );
      });
      
      // localStorage 캐시도 업데이트
      try {
        const updatedData = queryClient.getQueryData<CustomRoleRow[]>(['customRoles', data.userId]) || [];
        const cacheData = {
          data: updatedData,
          cachedAt: Date.now()
        };
        localStorage.setItem(`custom_roles_cache_${data.userId}`, JSON.stringify(cacheData));
      } catch (error) {
        // localStorage 업데이트 실패 시 무시
      }
      
      // 백그라운드에서 최신 데이터 확인 (선택사항)
      queryClient.invalidateQueries({ queryKey: ['customRoles', data.userId] });
    },
  });
};

// 커스텀 역할 삭제
export const useDeleteCustomRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleId, userId }: { roleId: string; userId: string }) => {
      const response = await apiFetch(`/api/custom-roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('커스텀 역할 삭제 실패');
      }

      return { roleId, userId };
    },
    onSuccess: (data) => {
      // Optimistic Update: 캐시에서 즉시 제거
      queryClient.setQueryData(['customRoles', data.userId], (old: CustomRoleRow[] | undefined) => {
        if (!old) return old;
        return old.filter((role) => role.id !== data.roleId);
      });
      
      // localStorage 캐시도 업데이트
      try {
        const updatedData = queryClient.getQueryData<CustomRoleRow[]>(['customRoles', data.userId]) || [];
        const cacheData = {
          data: updatedData,
          cachedAt: Date.now()
        };
        localStorage.setItem(`custom_roles_cache_${data.userId}`, JSON.stringify(cacheData));
      } catch (error) {
        // localStorage 업데이트 실패 시 무시
      }
      
      // 백그라운드에서 최신 데이터 확인 (선택사항)
      queryClient.invalidateQueries({ queryKey: ['customRoles', data.userId] });
    },
  });
};

