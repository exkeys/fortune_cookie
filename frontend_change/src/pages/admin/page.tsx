import DashboardTab from './components/DashboardTab';
import UsersTab from './components/UsersTab';
import MarketingTab from './components/MarketingTab';
import AnalyticsTab from './components/AnalyticsTab';
import SettingsTab from './components/SettingsTab';
import SystemTab from './components/SystemTab';
// page
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabaseClient';
import Header from '../../components/feature/Header';
import UserDetailModal from './components/UserDetailModal';

interface User {
  id: string;
  email: string;
  nickname: string;
  status: 'active' | 'inactive' | 'deleted' | 'banned';
  is_admin: boolean;
  created_at: string;
  last_login_at: string | null;
}

interface FortuneStats {
  totalFortunes: number;
  todayFortunes: number;
  weeklyFortunes: number;
  monthlyFortunes: number;
  popularRoles: { name: string; count: number; color: string }[];
  userGrowth: { date: string; users: number }[];
  fortuneGrowth: { date: string; fortunes: number }[];
  schoolStats: { school: string; users: number; fortunes: number }[];
}

interface SystemHealth {
  cpu: number;
  memory: number;
  storage: number;
  uptime: string;
  responseTime: number;
  errorRate: number;
}

export default function AdminPage() {
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'analytics' | 'marketing' | 'settings' | 'system'>('dashboard');
  const [isAdminChecked, setIsAdminChecked] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<FortuneStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserModal, setShowUserModal] = useState<User | null>(null);

  // 관리자 권한 확인 및 데이터 로드
  useEffect(() => {
    const checkAdminAndLoadData = async () => {
      // 인증 로딩이 완료될 때까지 대기
      if (authLoading) {
        console.log('[AdminPage] 인증 로딩 중...');
        return;
      }
      
      // 로그인되지 않은 경우
      if (!isLoggedIn || !user) {
        console.log('[AdminPage] 로그인되지 않음 또는 사용자 정보 없음');
        setIsAdminChecked(true);
        return;
      }

      console.log('[AdminPage] 사용자 정보 확인:', { userId: user.id, isAdmin: user.is_admin });

      try {
        // 관리자 권한 재확인
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('is_admin, status')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('관리자 권한 확인 실패:', userError);
          setIsAdminChecked(true);
          return;
        }

        // 관리자가 아닌 경우
        if (!userData?.is_admin) {
          console.log('[AdminPage] 관리자가 아님');
          setIsAdminChecked(true);
          return;
        }

        console.log('[AdminPage] 관리자 권한 확인됨, 데이터 로드 시작');

        // 관리자인 경우 데이터 로드
        const fetchData = async () => {
      // 사용자 데이터 로드
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      let usersArr: any[] = [];
      if (usersError) {
        console.error('Error fetching users:', usersError);
        setUsers([]);
      } else {
        setUsers(usersData as User[]);
        usersArr = usersData as any[];
      }
      // 실제 Supabase에서 총 운세/오늘 운세 수 가져오기
      const { count: totalFortunes } = await supabase
        .from('ai_answers')
        .select('*', { count: 'exact', head: true });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayFortunes } = await supabase
        .from('ai_answers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // 학교별 사용자 수 및 운세 수 집계
      let schoolStats: { school: string; users: number; fortunes: number }[] = [];
      if (Array.isArray(usersArr) && usersArr.length > 0) {
        const schoolMap: { [school: string]: { users: number; fortunes: number } } = {};
        // 운세 데이터 전체 가져오기 (school별 집계 위해)
        const { data: allFortunes } = await supabase
          .from('ai_answers')
          .select('id, user_id');
        usersArr.forEach((user) => {
          const school = user.school || '미입력';
          if (!schoolMap[school]) {
            schoolMap[school] = { users: 0, fortunes: 0 };
          }
          schoolMap[school].users += 1;
        });
        if (Array.isArray(allFortunes)) {
          allFortunes.forEach((fortune: any) => {
            const userObj = usersArr.find((u) => u.id === fortune.user_id);
            const school = userObj?.school || '미입력';
            if (schoolMap[school]) {
              schoolMap[school].fortunes += 1;
            }
          });
        }
        schoolStats = Object.entries(schoolMap).map(([school, obj]) => ({ school, users: obj.users, fortunes: obj.fortunes }));
      }

      // 사용자 증가 추이(userGrowth) 계산: 가입일 기준 일별 누적 사용자 수
      let userGrowth: { date: string; users: number }[] = [];
      if (Array.isArray(usersArr) && usersArr.length > 0) {
        // 가입일 기준 오름차순 정렬
        const sorted = [...usersArr].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const dateMap: { [date: string]: number } = {};
        sorted.forEach((user) => {
          const date = user.created_at.slice(0, 10); // YYYY-MM-DD
          if (dateMap[date]) {
            dateMap[date] += 1;
          } else {
            dateMap[date] = 1;
          }
        });
        // 누적합 계산
        let cumulative = 0;
        userGrowth = Object.entries(dateMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => {
            cumulative += count;
            return { date, users: cumulative };
          });
      }
      setStats({
        totalFortunes: totalFortunes ?? 0,
        todayFortunes: todayFortunes ?? 0,
        weeklyFortunes: 0, // TODO: 실제 쿼리로 교체 가능
        monthlyFortunes: 0, // TODO: 실제 쿼리로 교체 가능
        popularRoles: [], // TODO: 실제 쿼리로 교체 가능
        userGrowth,
        fortuneGrowth: [],
        schoolStats
      });
      setSystemHealth({
        cpu: 45,
        memory: 62,
        storage: 78,
        uptime: '15일 3시간',
        responseTime: 180,
        errorRate: 0.2
      });
        };
        
        await fetchData();
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setIsAdminChecked(true);
      }
    };

    checkAdminAndLoadData();
  }, [authLoading, isLoggedIn, user?.id]); // user 전체 대신 user.id만 의존성으로 설정

  const handleUserAction = async (action: string, userId?: string) => {
    if (!userId) return;

    try {
      switch (action) {
        case 'makeAdmin':
          await supabase
            .from('users')
            .update({ is_admin: true })
            .eq('id', userId);
          break;
        case 'removeAdmin':
          await supabase
            .from('users')
            .update({ is_admin: false })
            .eq('id', userId);
          break;
        case 'ban':
          await supabase
            .from('users')
            .update({ status: 'banned' })
            .eq('id', userId);
          break;
        case 'unban':
          await supabase
            .from('users')
            .update({ status: 'active' })
            .eq('id', userId);
          break;
        case 'delete':
          await supabase
            .from('users')
            .update({ status: 'deleted' })
            .eq('id', userId);
          break;
      }
      
      // 데이터 새로고침
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setUsers(data as User[]);
      }
    } catch (error: any) {
      // 에러 메시지 및 status 코드 alert로 출력
      let msg = 'Error performing user action';
      if (error?.message) msg += `: ${error.message}`;
      if (error?.status) msg += ` (status: ${error.status})`;
      alert(msg);
      console.error('Error performing user action:', error);
    }
  };

  // 로딩 중이거나 관리자 권한 확인 중인 경우
  if (authLoading || !isAdminChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  // 관리자가 아닌 경우
  if (!user || !user.is_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex flex-col items-center justify-center">
        <Header />
        <div className="text-2xl text-gray-700 font-bold mt-20">관리자만 접근할 수 있습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">관리자 대시보드</h1>
          <p className="text-gray-600">시스템 관리 및 사용자 관리</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <div className="flex space-x-2 bg-white/50 backdrop-blur-sm p-2 rounded-xl">
            {[
              { id: 'dashboard', label: '대시보드', icon: 'ri-dashboard-line' },
              { id: 'users', label: '사용자 관리', icon: 'ri-user-line' },
              { id: 'analytics', label: '분석', icon: 'ri-bar-chart-line' },
              { id: 'marketing', label: '마케팅', icon: 'ri-megaphone-line' },
              { id: 'settings', label: '설정', icon: 'ri-settings-line' },
              { id: 'system', label: '시스템', icon: 'ri-computer-line' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/70 hover:text-gray-800'
                }`}
              >
                <i className={`${tab.icon} text-lg`}></i>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 대시보드 탭 */}
        {activeTab === 'dashboard' && stats && (
          <DashboardTab users={users} stats={stats} systemHealth={systemHealth} />
        )}

        {/* 사용자 관리 탭 */}
        {activeTab === 'users' && (
          <UsersTab
            users={users}
            selectedUsers={selectedUsers}
            setSelectedUsers={setSelectedUsers}
            setShowUserModal={setShowUserModal}
            handleUserAction={handleUserAction}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        )}

        {/* 마케팅 탭 */}
        {activeTab === 'marketing' && stats && (
          <MarketingTab users={users} stats={stats} />
        )}

        {/* 기타 탭들 */}
        {activeTab === 'analytics' && (
          <AnalyticsTab />
        )}
        {activeTab === 'settings' && (
          <SettingsTab />
        )}
        {activeTab === 'system' && (
          <SystemTab />
        )}

        {/* 사용자 상세 모달 */}
        {showUserModal && (
          <UserDetailModal
            user={showUserModal}
            onClose={() => setShowUserModal(null)}
            onMakeAdmin={() => {
              handleUserAction('makeAdmin', showUserModal.id);
              setShowUserModal(null);
            }}
            onRemoveAdmin={() => {
              handleUserAction('removeAdmin', showUserModal.id);
              setShowUserModal(null);
            }}
            onBan={() => {
              handleUserAction('ban', showUserModal.id);
              setShowUserModal(null);
            }}
            onUnban={() => {
              handleUserAction('unban', showUserModal.id);
              setShowUserModal(null);
            }}
          />
        )}
      </div>
    </div>
  );
}