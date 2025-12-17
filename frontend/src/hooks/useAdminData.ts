import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';

interface User {
  id: string;
  email: string;
  nickname: string;
  status: 'active' | 'inactive' | 'deleted' | 'banned';
  is_admin: boolean;
  created_at: string;
  last_login_at: string | null;
  fortune_count?: number;
}

interface FortuneStats {
  totalUsers?: number;
  totalFortunes: number;
  todayFortunes: number;
  totalAdmins: number;
  schoolStats: { school: string; users: number; fortunes: number }[];
}

// 사용자 목록 조회
export const useAdminUsers = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async (): Promise<User[]> => {
      const usersResponse = await apiFetch('/api/admin/users');

      if (!usersResponse.ok) {
        throw new Error(`사용자 목록 조회 실패: ${usersResponse.status}`);
      }

      const { users } = await usersResponse.json();
      return users || [];
    },
    enabled,
    staleTime: 0, // 캐시 없이 항상 최신 데이터
    refetchOnMount: 'always',
  });
};

// 대시보드 통계 조회
export const useDashboardStats = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: async (): Promise<FortuneStats> => {
      const response = await apiFetch('/api/admin/dashboard');

      if (!response.ok) {
        console.warn('대시보드 통계 조회 실패:', response.status);
        return {
          totalUsers: 0,
          totalFortunes: 0,
          todayFortunes: 0,
          totalAdmins: 0,
          schoolStats: []
        };
      }

      const data = await response.json();

      return {
        totalUsers: data.totalUsers ?? 0,
        totalFortunes: data.totalFortunes ?? 0,
        todayFortunes: data.todayFortunes ?? 0,
        totalAdmins: data.totalAdmins ?? 0,
        schoolStats: data.schoolStats || []
      };
    },
    enabled,
    staleTime: 0, // 캐시 없이 항상 최신 데이터
    refetchOnMount: 'always',
  });
};

