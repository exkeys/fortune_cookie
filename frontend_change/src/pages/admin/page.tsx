import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabaseClient';
import Card from '../../components/base/Card';
import Header from '../../components/feature/Header';
import UsersTable from './components/UsersTable';
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
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'analytics' | 'marketing' | 'settings' | 'system'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<FortuneStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserModal, setShowUserModal] = useState<User | null>(null);

  // 모든 데이터 로드
  useEffect(() => {
    if (!user || !user.id || !user.is_admin) return;
    const fetchData = async () => {
      setIsLoading(true);
      // 사용자 데이터 로드
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (usersError) {
        console.error('Error fetching users:', usersError);
        setUsers([]);
      } else {
        setUsers(usersData as User[]);
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
      setStats({
        totalFortunes: totalFortunes ?? 0,
        todayFortunes: todayFortunes ?? 0,
        weeklyFortunes: 0, // TODO: 실제 쿼리로 교체 가능
        monthlyFortunes: 0, // TODO: 실제 쿼리로 교체 가능
        popularRoles: [], // TODO: 실제 쿼리로 교체 가능
        userGrowth: [],
        fortuneGrowth: [],
        schoolStats: []
      });
      setSystemHealth({
        cpu: 45,
        memory: 62,
        storage: 78,
        uptime: '15일 3시간',
        responseTime: 180,
        errorRate: 0.2
      });
      setIsLoading(false);
    };
    fetchData();
  }, [user]);

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
    } catch (error) {
      console.error('Error performing user action:', error);
    }
  };

  if (authLoading || isLoading) {
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
          <div className="space-y-6">
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{users.length}</div>
                    <div className="text-sm opacity-90">총 사용자</div>
                  </div>
                  <i className="ri-user-line text-3xl opacity-80"></i>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-r from-green-500 to-teal-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{stats.totalFortunes}</div>
                    <div className="text-sm opacity-90">총 운세</div>
                  </div>
                  <i className="ri-star-line text-3xl opacity-80"></i>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{stats.todayFortunes}</div>
                    <div className="text-sm opacity-90">오늘의 운세</div>
                  </div>
                  <i className="ri-calendar-line text-3xl opacity-80"></i>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-r from-red-500 to-pink-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">{users.filter(u => u.is_admin).length}</div>
                    <div className="text-sm opacity-90">관리자</div>
                  </div>
                  <i className="ri-shield-user-line text-3xl opacity-80"></i>
                </div>
              </Card>
            </div>

            {/* 시스템 상태 */}
            {systemHealth && (
              <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <i className="ri-pulse-line mr-2 text-green-500"></i>
                  시스템 상태
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">CPU 사용률</span>
                      <span className="font-bold text-gray-800">{systemHealth.cpu}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${systemHealth.cpu}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">메모리 사용률</span>
                      <span className="font-bold text-gray-800">{systemHealth.memory}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${systemHealth.memory}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">저장공간</span>
                      <span className="font-bold text-gray-800">{systemHealth.storage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-amber-500 h-2 rounded-full" 
                        style={{ width: `${systemHealth.storage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* 사용자 관리 탭 */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-800">사용자 관리</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="사용자 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
              </div>
            </div>

            <UsersTable
              users={users}
              selectedUsers={selectedUsers}
              setSelectedUsers={setSelectedUsers}
              setShowUserModal={setShowUserModal}
              handleUserAction={handleUserAction}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          </div>
        )}

        {/* 마케팅 탭 */}
        {activeTab === 'marketing' && stats && (
          <div className="space-y-6">
            <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <i className="ri-megaphone-line mr-2 text-orange-500"></i>
                마케팅 대시보드
              </h2>

              {/* 마케팅 지표 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">
                        {users.length > 0 ? ((users.filter(u => u.status === 'active').length / users.length) * 100).toFixed(1) : '0'}%
                      </div>
                      <div className="text-sm opacity-90">활성 사용자율</div>
                    </div>
                    <i className="ri-user-heart-line text-3xl opacity-80"></i>
                  </div>
                </Card>
                
                <Card className="p-6 bg-gradient-to-r from-green-500 to-teal-500 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">
                        {users.length > 0 ? (stats.totalFortunes / users.length).toFixed(1) : '0'}
                      </div>
                      <div className="text-sm opacity-90">사용자당 평균</div>
                    </div>
                    <i className="ri-trophy-line text-3xl opacity-80"></i>
                  </div>
                </Card>
                
                <Card className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">{stats.schoolStats.length}</div>
                      <div className="text-sm opacity-90">참여 학교 수</div>
                    </div>
                    <i className="ri-school-line text-3xl opacity-80"></i>
                  </div>
                </Card>
                
                <Card className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">-</div>
                      <div className="text-sm opacity-90">충성 고객</div>
                    </div>
                    <i className="ri-star-line text-3xl opacity-80"></i>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 학교별 마케팅 분석 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i className="ri-building-line mr-2 text-amber-500"></i>
                    학교별 마케팅 현황
                  </h3>
                  <div className="space-y-4">
                    {stats.schoolStats.map((school, index) => {
                      const totalUsers = stats.schoolStats.reduce((sum, s) => sum + s.users, 0);
                      const marketShare = totalUsers > 0 ? ((school.users / totalUsers) * 100).toFixed(1) : '0';
                      const avgFortunes = school.users > 0 ? (school.fortunes / school.users).toFixed(1) : '0';
                      
                      return (
                        <div key={school.school} className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-bold text-gray-800">{school.school}</div>
                                <div className="text-sm text-gray-600">시장점유율 {marketShare}%</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-amber-600">{school.users}명</div>
                              <div className="text-sm text-gray-500">평균 {avgFortunes}개</div>
                            </div>
                          </div>
                          
                          {/* 마케팅 등급 */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">마케팅 등급</span>
                            <div className="flex items-center space-x-2">
                              {parseFloat(avgFortunes) >= 5 ? (
                                <span className="text-green-600 font-bold text-sm">🔥 핫</span>
                              ) : parseFloat(avgFortunes) >= 3 ? (
                                <span className="text-amber-600 font-bold text-sm">⚡ 활발</span>
                              ) : (
                                <span className="text-gray-600 font-bold text-sm">📈 성장 가능</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 마케팅 인사이트 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i className="ri-lightbulb-line mr-2 text-green-500"></i>
                    마케팅 인사이트
                  </h3>
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                      <h4 className="font-bold text-gray-700 mb-3">🎯 타겟 그룹</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">최고 활성 학교</span>
                          <span className="font-bold text-green-600">
                            {stats.schoolStats.length > 0 ? stats.schoolStats.reduce((max, school) => 
                              (school.fortunes / school.users) > (max.fortunes / max.users) ? school : max
                            ).school : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">최대 규모 학교</span>
                          <span className="font-bold text-blue-600">
                            {stats.schoolStats.length > 0 ? stats.schoolStats.reduce((max, school) => 
                              school.users > max.users ? school : max
                            ).school : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">성장 잠재력</span>
                          <span className="font-bold text-amber-600">
                            {stats.schoolStats.filter(s => (s.fortunes / s.users) < 3).length}개 학교
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 기타 탭들 */}
        {activeTab === 'analytics' && (
          <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">분석</h2>
            <p className="text-gray-600">분석 기능 구현 예정</p>
          </Card>
        )}

        {activeTab === 'settings' && (
          <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">설정</h2>
            <p className="text-gray-600">설정 기능 구현 예정</p>
          </Card>
        )}

        {activeTab === 'system' && (
          <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">시스템</h2>
            <p className="text-gray-600">시스템 관리 기능 구현 예정</p>
          </Card>
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