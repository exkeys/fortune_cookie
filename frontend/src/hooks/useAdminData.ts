import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiClient';
import { supabase } from '../supabaseClient';

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
    staleTime: 2 * 60 * 1000, // 2분간 캐시 유지
  });
};

// 대시보드 통계 조회
export const useDashboardStats = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: async (): Promise<FortuneStats> => {
      const { data, error } = await supabase.rpc('get_dashboard_stats');

      if (error || !data) {
        console.warn('대시보드 통계 조회 실패:', error);
        return {
          totalUsers: 0,
          totalFortunes: 0,
          todayFortunes: 0,
          totalAdmins: 0,
          schoolStats: []
        };
      }

      return {
        totalUsers: data.totalUsers ?? 0,
        totalFortunes: data.totalFortunes ?? 0,
        todayFortunes: data.todayFortunes ?? 0,
        totalAdmins: data.totalAdmins ?? 0,
        schoolStats: data.schoolStats || []
      };
    },
    enabled,
    staleTime: 1 * 60 * 1000, // 1분간 캐시 유지
  });
};

