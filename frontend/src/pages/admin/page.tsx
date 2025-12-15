import DashboardTab from './components/DashboardTab';
import UsersTab from './components/UsersTab';
import SettingsTab from './components/SettingsTab';
// page
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAdminUsers, useDashboardStats } from '../../hooks/useAdminData';
import Header from '../../components/feature/Header';
import UserDetailModal from './components/UserDetailModal';
import { apiFetch } from '../../utils/apiClient';

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

export default function AdminPage() {
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings'>('dashboard');
  const [isAdminChecked, setIsAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserModal, setShowUserModal] = useState<User | null>(null);

  // React Query로 데이터 관리 (관리자 권한이 확인된 후에만 활성화)
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useAdminUsers(isAdmin);
  const { data: stats = null, isLoading: statsLoading } = useDashboardStats(isAdmin);

  // 관리자 권한 확인 및 데이터 로드
  useEffect(() => {
    const checkAdminAndLoadData = async () => {
      // 인증 로딩이 완료될 때까지 대기
      if (authLoading) {
        return;
      }
      
      // 로그인되지 않은 경우
      if (!isLoggedIn || !user) {
        setIsAdminChecked(true);
        return;
      }

      try {
        // 관리자 권한 재확인 - 백엔드 API 사용 (RLS 우회)
        let userId = user.id;
        
        // user.id가 없으면 localStorage에서 확인
        if (!userId) {
          const backendAuthData = localStorage.getItem('auth_backend_user');
          if (backendAuthData) {
            try {
              const backendUser = JSON.parse(backendAuthData);
              userId = backendUser.id;
            } catch {
              // 무시
            }
          }
        }
        
        if (!userId) {
          setIsAdminChecked(true);
          return;
        }
        
        // 백엔드 API를 통해 사용자 정보 조회 (JWT 토큰으로 인증)
        const response = await apiFetch(`/api/access-control/check-access`);
        if (!response.ok) {
          setIsAdminChecked(true);
          return;
        }
        
        const result = await response.json();
        const userData = result.user;
        
        if (!userData) {
          setIsAdminChecked(true);
          return;
        }

        // 관리자가 아닌 경우
        if (!userData.is_admin) {
          setIsAdminChecked(true);
          setIsAdmin(false);
          return;
        }

        // 관리자인 경우 - React Query가 자동으로 데이터 로드
        setIsAdmin(true);
    } catch (error) {
      // 에러 무시
    } finally {
      setIsAdminChecked(true);
    }
  };

    checkAdminAndLoadData();
  }, [authLoading, isLoggedIn, user?.id]); // user 전체 대신 user.id만 의존성으로 설정

  const handleUserAction = useCallback(async (action: string, userId?: string) => {
    if (!userId) return;

    try {
      // B 구조: apiFetch가 자동으로 토큰 관리하므로 setAccessToken 불필요
      // 백엔드 API를 통해 사용자 작업 수행
      let apiEndpoint = '/api/admin/users';
      let updateData: Record<string, unknown> = {};
      
      switch (action) {
        case 'makeAdmin':
          updateData = { userId, field: 'is_admin', value: true };
          break;
        case 'removeAdmin':
          updateData = { userId, field: 'is_admin', value: false };
          break;
        case 'ban':
          updateData = { userId, field: 'status', value: 'banned' };
          break;
        case 'unban':
          updateData = { userId, field: 'status', value: 'active' };
          break;
        case 'delete':
          // 삭제는 별도 API 사용
          const deleteResponse = await apiFetch('/api/auth/delete-account', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
          });

          if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json();
            throw new Error(errorData.error || '사용자 삭제에 실패했습니다');
          }
          break;
        default:
          throw new Error('알 수 없는 작업입니다');
      }
      
      // 삭제가 아닌 경우 업데이트 API 호출
      if (action !== 'delete') {
        const updateResponse = await apiFetch(apiEndpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
        
        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(errorData.error || '사용자 업데이트에 실패했습니다');
        }
      }
      
      // 데이터 새로고침
      await refetchUsers();
    } catch (error: unknown) {
      // 에러 메시지 및 status 코드 alert로 출력
      let msg = '사용자 작업 실패';
      if (error instanceof Error) {
        msg += `: ${error.message}`;
      }
      if (error && typeof error === 'object' && 'status' in error) {
        msg += ` (status: ${error.status})`;
      }
      alert(msg);
    }
  }, [refetchUsers]);

  // UserDetailModal 핸들러들
  const handleCloseModal = useCallback(() => {
    setShowUserModal(null);
  }, []);

  const handleMakeAdmin = useCallback(() => {
    if (showUserModal) {
      handleUserAction('makeAdmin', showUserModal.id);
      setShowUserModal(null);
    }
  }, [showUserModal, handleUserAction]);

  const handleRemoveAdmin = useCallback(() => {
    if (showUserModal) {
      handleUserAction('removeAdmin', showUserModal.id);
      setShowUserModal(null);
    }
  }, [showUserModal, handleUserAction]);

  const handleBan = useCallback(() => {
    if (showUserModal) {
      handleUserAction('ban', showUserModal.id);
      setShowUserModal(null);
    }
  }, [showUserModal, handleUserAction]);

  const handleUnban = useCallback(() => {
    if (showUserModal) {
      handleUserAction('unban', showUserModal.id);
      setShowUserModal(null);
    }
  }, [showUserModal, handleUserAction]);

  // 로딩 중이거나 관리자 권한 확인 중인 경우
  if (authLoading || !isAdminChecked || (isAdmin && (usersLoading || statsLoading))) {
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
  if (!isAdmin || !user || !user.is_admin) {
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
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-1 sm:mb-2">관리자 대시보드</h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">시스템 관리 및 사용자 관리</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2 bg-white/50 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
            {[
              { id: 'dashboard', label: '대시보드', icon: 'ri-dashboard-line' },
              { id: 'users', label: '사용자 관리', icon: 'ri-user-line' },
              { id: 'settings', label: '설정', icon: 'ri-settings-line' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'dashboard' | 'users' | 'settings')}
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-md sm:rounded-lg transition-all duration-300 text-xs sm:text-sm md:text-base ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-white/70 hover:text-gray-800'
                }`}
              >
                <i className={`${tab.icon} text-sm sm:text-base md:text-lg`}></i>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 대시보드 탭 */}
        {activeTab === 'dashboard' && stats && (
          <DashboardTab users={users} stats={stats} />
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
            fetchUsers={refetchUsers}
          />
        )}

        {/* 설정 탭 */}
        {activeTab === 'settings' && (
          <SettingsTab />
        )}

        {/* 사용자 상세 모달 */}
        {showUserModal && (
          <UserDetailModal
            user={showUserModal}
            onClose={handleCloseModal}
            onMakeAdmin={handleMakeAdmin}
            onRemoveAdmin={handleRemoveAdmin}
            onBan={handleBan}
            onUnban={handleUnban}
          />
        )}
      </div>
    </div>
  );
}