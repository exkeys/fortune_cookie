import DashboardTab from './components/DashboardTab';
import UsersTab from './components/UsersTab';
import SettingsTab from './components/SettingsTab';
// page
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAdminUsers, useDashboardStats } from '../../hooks/useAdminData';
// Admin 페이지는 상단 헤더를 숨깁니다.
import UserDetailModal from './components/UserDetailModal';
import { apiFetch } from '../../utils/apiClient';
import FCLogoImg from '../../../관리자 페이지 이미지.png';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings'>('dashboard');
  const [isAdminChecked, setIsAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserModal, setShowUserModal] = useState<User | null>(null);
  
  // 다크모드 상태 관리 (기본값: 다크 모드)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('adminDarkMode');
    // localStorage에 값이 없으면 기본값으로 다크 모드(true) 사용
    if (saved === null) {
      return true;
    }
    return saved === 'true';
  });

  // React Query로 데이터 관리 (관리자 권한이 확인된 후에만 활성화)
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useAdminUsers(isAdmin);
  const { data: stats = null, isLoading: statsLoading } = useDashboardStats(isAdmin);

  // 다크모드 토글 및 HTML 클래스 관리
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDarkMode) {
      htmlElement.classList.add('dark');
      console.log('다크모드 활성화');
    } else {
      htmlElement.classList.remove('dark');
      console.log('다크모드 비활성화');
    }
    localStorage.setItem('adminDarkMode', String(isDarkMode));
  }, [isDarkMode]);

  // 초기 마운트 시 다크모드 적용 (기본값: 다크 모드)
  useEffect(() => {
    const htmlElement = document.documentElement;
    const saved = localStorage.getItem('adminDarkMode');
    // localStorage에 값이 없으면 기본값으로 다크 모드 적용
    const shouldBeDark = saved === null ? true : saved === 'true';
    if (shouldBeDark) {
      htmlElement.classList.add('dark');
      console.log('초기 마운트: 다크모드 적용');
    } else {
      htmlElement.classList.remove('dark');
      console.log('초기 마운트: 라이트모드 적용');
    }
  }, []);

  const toggleDarkMode = () => {
    console.log('다크모드 토글 버튼 클릭됨, 현재 상태:', isDarkMode);
    setIsDarkMode(prev => {
      const newValue = !prev;
      console.log('새로운 다크모드 상태:', newValue);
      return newValue;
    });
  };

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg text-gray-600 dark:text-gray-400">로딩 중...</div>
        </div>
      </div>
    );
  }

  // 관리자가 아닌 경우
  if (!isAdmin || !user || !user.is_admin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center">
        <div className="text-2xl text-gray-700 dark:text-gray-300 font-semibold">관리자만 접근할 수 있습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* 왼쪽 사이드바 네비게이션 (고정 펼침) */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 sticky top-0 self-start h-[calc(100vh)] flex flex-col">
          <div className="px-4 pt-2 pb-5 space-y-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors focus:outline-none"
              aria-label="뒤로 가기"
            >
              <i className="ri-arrow-left-line text-base"></i>
              <span>뒤로가기</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="focus:outline-none rounded-md"
              aria-label="홈으로 이동"
            >
              <img
                src={FCLogoImg}
                alt="Fortune Cookie Admin Logo"
                className="w-[17rem] h-24 object-contain -mt-2"
              />
            </button>
        </div>
          <nav className="px-2 pb-4 space-y-1 -mt-4 flex-1">
            {[
              { id: 'dashboard', label: '대시보드', icon: 'ri-dashboard-line' },
              { id: 'users', label: '사용자 관리', icon: 'ri-user-line' },
              { id: 'settings', label: '설정', icon: 'ri-settings-line' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'dashboard' | 'users' | 'settings')}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 text-sm ${
                  activeTab === tab.id
                    ? 'bg-slate-100 dark:bg-gray-700 text-slate-900 dark:text-gray-100 font-medium border-l-4 border-slate-600 dark:border-gray-500'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <i className={`${tab.icon} text-xl mr-3`}></i>
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </nav>
          {/* 다크모드 전환 버튼 */}
          <div className="px-2 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              aria-label="다크모드 전환"
            >
              <i className={`${isDarkMode ? 'ri-sun-line' : 'ri-moon-line'} text-xl mr-3`}></i>
              <span className="whitespace-nowrap">{isDarkMode ? '라이트모드' : '다크모드'}</span>
            </button>
          </div>
        </aside>

        {/* 메인 컨텐츠 영역 */}
        <main className="flex-1 bg-gray-50 dark:bg-gray-900">
          <div className="p-6 lg:p-8">
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
          </div>
        </main>
      </div>

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
  );
}