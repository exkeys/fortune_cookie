import React, { useState, useEffect, useMemo } from 'react';
import UsersTable from './UsersTable';
import SchoolEditModal from './SchoolEditModal';
import schoolsData from '../../../data/schools.json';
import { apiFetch } from '../../../utils/apiClient';

interface User {
  id: string;
  email: string;
  nickname: string;
  school?: string;
  status: 'active' | 'inactive' | 'deleted' | 'banned';
  is_admin: boolean;
  created_at: string;
  last_login_at: string | null;
  last_logout_at?: string | null;
}

interface UsersTabProps {
  users: User[];
  selectedUsers: string[];
  setSelectedUsers: (ids: string[]) => void;
  setShowUserModal: (user: User | null) => void;
  handleUserAction: (action: string, userId?: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fetchUsers: () => void;
}

const UsersTab: React.FC<UsersTabProps> = ({
  users,
  selectedUsers,
  setSelectedUsers,
  setShowUserModal,
  handleUserAction,
  searchTerm,
  setSearchTerm,
  fetchUsers,
}) => {
  const [showSchoolEditModal, setShowSchoolEditModal] = useState<User | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [adminFilter, setAdminFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [showBulkSchoolModal, setShowBulkSchoolModal] = useState(false);
  const [bulkSchoolSearch, setBulkSchoolSearch] = useState('');
  const [selectedBulkSchool, setSelectedBulkSchool] = useState('');
  const [bulkSchoolLoading, setBulkSchoolLoading] = useState(false);

  // 학교 데이터 타입 정의
  interface School {
    id: number;
    name: string;
    category: string;
  }

  const schoolsArray = Array.isArray(schoolsData) ? (schoolsData as School[]) : (schoolsData as { schools: School[] }).schools;

  // 일괄 학교 수정용 필터링된 학교 목록
  const filteredBulkSchools = useMemo(() => {
    if (!bulkSchoolSearch) {
      return schoolsArray;
    }
    
    const searchLower = bulkSchoolSearch.toLowerCase().trim();
    
    return schoolsArray
      .filter((school: School) =>
        (school.name || '').toLowerCase().includes(searchLower) ||
        (school.category && school.category.toLowerCase().includes(searchLower))
      )
      .sort((a: School, b: School) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const aStartsWith = aName.startsWith(searchLower);
        const bStartsWith = bName.startsWith(searchLower);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        return aName.localeCompare(bName);
      });
  }, [bulkSchoolSearch]);

  // 일괄 학교 수정 처리
  const handleBulkSchoolUpdate = async () => {
    if (!selectedBulkSchool) {
      alert('학교를 선택해주세요.');
      return;
    }

    try {
      setBulkSchoolLoading(true);
      
      // 선택된 모든 사용자에 대해 학교 업데이트
      const updatePromises = selectedUsers.map(userId =>
        apiFetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, field: 'school', value: selectedBulkSchool })
        })
      );

      const results = await Promise.allSettled(updatePromises);
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok));
      
      if (failed.length > 0) {
        alert(`${failed.length}명의 사용자 학교 수정에 실패했습니다.`);
      } else {
        alert(`${selectedUsers.length}명의 사용자 학교가 "${selectedBulkSchool}"로 변경되었습니다.`);
      }
      
      fetchUsers();
      setSelectedUsers([]);
      setShowBulkSchoolModal(false);
      setSelectedBulkSchool('');
      setBulkSchoolSearch('');
    } catch (error) {
      console.error('일괄 학교 수정 실패:', error);
      alert('학교 수정 중 오류가 발생했습니다.');
    } finally {
      setBulkSchoolLoading(false);
    }
  };

  useEffect(() => {
    if (!confirmDeleteUser) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConfirmDeleteUser(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmDeleteUser]);

  // 필터 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!isFilterOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.filter-dropdown')) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  // 일괄 작업 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!isBulkActionOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.bulk-action-menu')) {
        setIsBulkActionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBulkActionOpen]);

  const handleCSVDownload = () => {
    // CSV 헤더
    const headers = ['이메일', '닉네임', '학교', '상태', '관리자', '가입일', '마지막 로그인'];
    
    // CSV 데이터 변환
    const csvData = users.map(user => [
      user.email || '',
      user.nickname || '',
      user.school || '',
      user.status || '',
      user.is_admin ? '예' : '아니오',
      user.created_at ? new Date(user.created_at).toLocaleString('ko-KR') : '',
      user.last_login_at ? new Date(user.last_login_at).toLocaleString('ko-KR') : ''
    ]);
    
    // CSV 문자열 생성
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // BOM 추가 (한글 인코딩을 위한 UTF-8 BOM)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 다운로드 링크 생성
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `사용자_목록_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // UsersTable에서 오는 액션을 가로채어 삭제는 확인 모달을 띄움
  const handleActionWithConfirm = (action: string, userId?: string) => {
    if (action === 'delete' && userId) {
      const target = users.find(u => u.id === userId) || null;
      setConfirmDeleteUser(target);
      return;
    }
    handleUserAction(action, userId);
  };

  const confirmDelete = () => {
    if (confirmDeleteUser) {
      handleUserAction('delete', confirmDeleteUser.id);
      setConfirmDeleteUser(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight mt-2">User Management</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">사용자 정보, 권한을 관리합니다.</p>
          </div>
          <button
            onClick={handleCSVDownload}
            className="self-start mt-7 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-2 transition-colors"
            title="Download"
          >
            <i className="ri-download-line"></i>
            <span>Download</span>
          </button>
        </div>
        <div className="mt-5 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="-mt-8 space-y-3">
        {/* 필터 영역 */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          {/* 선택된 필터 태그 표시 */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {(adminFilter !== 'all' || statusFilter !== 'all') && (
              <>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  적용된 필터:
                </span>
                {adminFilter !== 'all' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <i className="ri-shield-star-line text-amber-600 dark:text-amber-400 text-xs"></i>
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      {adminFilter === 'admin' ? '관리자' : '일반 사용자'}
                    </span>
                    <button
                      onClick={() => setAdminFilter('all')}
                      className="ml-1 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </div>
                )}
                {statusFilter !== 'all' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <i className={`ri-${statusFilter === 'active' ? 'check' : 'close'}-circle-line text-blue-600 dark:text-blue-400 text-xs`}></i>
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {statusFilter === 'active' ? '활성' : '차단됨'}
                    </span>
                    <button
                      onClick={() => setStatusFilter('all')}
                      className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                    >
                      <i className="ri-close-line text-sm"></i>
                    </button>
                  </div>
                )}
                {(adminFilter !== 'all' || statusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setAdminFilter('all');
                      setStatusFilter('all');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <i className="ri-close-circle-line"></i>
                    <span>모두 초기화</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* 필터 버튼 및 검색창 */}
          <div className="flex items-center gap-3">
            {/* 필터 버튼 */}
            <div className="relative filter-dropdown">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all duration-200 ${
                  (adminFilter !== 'all' || statusFilter !== 'all')
                    ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 shadow-sm'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <i className="ri-filter-3-line text-base"></i>
                <span className="text-sm font-semibold">필터</span>
                {(adminFilter !== 'all' || statusFilter !== 'all') && (
                  <span className="px-1.5 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                    {[adminFilter !== 'all' ? 1 : 0, statusFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
                  </span>
                )}
                <i className={`ri-arrow-${isFilterOpen ? 'up' : 'down'}-s-line text-sm transition-transform duration-200`}></i>
              </button>

              {/* 필터 드롭다운 */}
              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-20 overflow-hidden">
                  <div className="p-5 space-y-5">
                    {/* 헤더 */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <i className="ri-filter-3-line text-lg text-gray-600 dark:text-gray-400"></i>
                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">필터 옵션</h3>
                      </div>
                      <button
                        onClick={() => setIsFilterOpen(false)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <i className="ri-close-line text-gray-500 dark:text-gray-400"></i>
                      </button>
                    </div>

                    {/* 관리자 필터 */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                        <i className="ri-shield-star-line text-amber-500"></i>
                        <span>권한</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'all', label: '전체', icon: 'ri-list-check' },
                          { value: 'admin', label: '관리자', icon: 'ri-shield-star-fill' },
                          { value: 'user', label: '일반 사용자', icon: 'ri-user-line' }
                        ].map(option => (
                          <button
                            key={option.value}
                            onClick={() => setAdminFilter(option.value as 'all' | 'admin' | 'user')}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                              adminFilter === option.value
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
                            }`}
                          >
                            <i className={`${option.icon} ${adminFilter === option.value ? 'text-white' : ''}`}></i>
                            <span>{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 상태 필터 */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                        <i className="ri-information-line text-blue-500"></i>
                        <span>상태</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'all', label: '전체', icon: 'ri-list-check' },
                          { value: 'active', label: '활성', icon: 'ri-checkbox-circle-fill', color: 'green' },
                          { value: 'banned', label: '차단됨', icon: 'ri-close-circle-fill', color: 'red' }
                        ].map(option => (
                          <button
                            key={option.value}
                            onClick={() => setStatusFilter(option.value as 'all' | 'active' | 'banned')}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                              statusFilter === option.value
                                ? option.value === 'active'
                                  ? 'bg-green-500 text-white shadow-md shadow-green-500/30 scale-105'
                                  : option.value === 'banned'
                                  ? 'bg-red-500 text-white shadow-md shadow-red-500/30 scale-105'
                                  : 'bg-blue-500 text-white shadow-md shadow-blue-500/30 scale-105'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
                            }`}
                          >
                            <i className={`${option.icon} ${statusFilter === option.value ? 'text-white' : ''}`}></i>
                            <span>{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 필터 초기화 */}
                    {(adminFilter !== 'all' || statusFilter !== 'all') && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            setAdminFilter('all');
                            setStatusFilter('all');
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <i className="ri-refresh-line"></i>
                          <span>모든 필터 초기화</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 검색창 및 일괄 작업 */}
            <div className="flex items-center gap-3">
              {/* 검색창 */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="이름, 학교, 이메일로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent w-full transition-all"
          />
          <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
              </div>

              {/* 일괄 작업 버튼 (선택된 사용자가 있을 때만 표시) */}
              {selectedUsers.length > 0 && (
                <div className="relative bulk-action-menu">
                  <button
                    onClick={() => setIsBulkActionOpen(!isBulkActionOpen)}
                    className="flex items-center gap-2 px-4 py-2 border border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors shadow-sm"
                  >
                    <i className="ri-more-2-line text-base"></i>
                    <span className="text-sm font-semibold">일괄 작업</span>
                    <span className="px-1.5 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                      {selectedUsers.length}
                    </span>
                    <i className={`ri-arrow-${isBulkActionOpen ? 'up' : 'down'}-s-line text-xs`}></i>
                  </button>

                  {/* 일괄 작업 드롭다운 */}
                  {isBulkActionOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsBulkActionOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-20 overflow-hidden">
                        <div className="py-1.5">
                          {/* 관리자로 설정 */}
                          <button
                            onClick={() => {
                              selectedUsers.forEach(userId => {
                                const user = users.find(u => u.id === userId);
                                if (user && !user.is_admin) {
                                  handleUserAction('makeAdmin', userId);
                                }
                              });
                              setSelectedUsers([]);
                              setIsBulkActionOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                          >
                            <i className="ri-user-star-line text-base text-indigo-500 dark:text-indigo-400"></i>
                            <span>관리자로 설정</span>
                          </button>

                          {/* 일반 사용자로 */}
                          <button
                            onClick={() => {
                              selectedUsers.forEach(userId => {
                                const user = users.find(u => u.id === userId);
                                if (user && user.is_admin) {
                                  handleUserAction('removeAdmin', userId);
                                }
                              });
                              setSelectedUsers([]);
                              setIsBulkActionOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                          >
                            <i className="ri-shield-star-line text-base text-purple-500 dark:text-purple-400"></i>
                            <span>일반 사용자로</span>
                          </button>

                          {/* 차단 */}
                          <button
                            onClick={() => {
                              selectedUsers.forEach(userId => {
                                const user = users.find(u => u.id === userId);
                                if (user && user.status !== 'banned') {
                                  handleUserAction('ban', userId);
                                }
                              });
                              setSelectedUsers([]);
                              setIsBulkActionOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-yellow-700 dark:text-yellow-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                          >
                            <i className="ri-close-circle-line text-base text-yellow-500 dark:text-yellow-400"></i>
                            <span>차단</span>
                          </button>

                          {/* 차단 해제 */}
                          <button
                            onClick={() => {
                              selectedUsers.forEach(userId => {
                                const user = users.find(u => u.id === userId);
                                if (user && user.status === 'banned') {
                                  handleUserAction('unban', userId);
                                }
                              });
                              setSelectedUsers([]);
                              setIsBulkActionOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-green-700 dark:text-green-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                          >
                            <i className="ri-checkbox-circle-line text-base text-green-500 dark:text-green-400"></i>
                            <span>차단 해제</span>
                          </button>

                          {/* 학교 수정 */}
                          <button
                            onClick={() => {
                              setShowBulkSchoolModal(true);
                              setIsBulkActionOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                          >
                            <i className="ri-school-line text-base text-gray-500 dark:text-gray-400"></i>
                            <span>학교 수정</span>
                          </button>

                          {/* 구분선 */}
                          <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>

                          {/* 삭제 */}
                          <button
                            onClick={() => {
                              if (confirm(`선택한 ${selectedUsers.length}명의 사용자를 삭제하시겠습니까?`)) {
                                selectedUsers.forEach(userId => {
                                  handleUserAction('delete', userId);
                                });
                                setSelectedUsers([]);
                                setIsBulkActionOpen(false);
                              }
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                          >
                            <i className="ri-delete-bin-line text-base text-red-500 dark:text-red-400"></i>
                            <span>삭제</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <UsersTable
        users={users}
        selectedUsers={selectedUsers}
        setSelectedUsers={setSelectedUsers}
        setShowUserModal={setShowUserModal}
        handleUserAction={handleActionWithConfirm}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        setShowSchoolEditModal={setShowSchoolEditModal}
        adminFilter={adminFilter}
        statusFilter={statusFilter}
      />
      
      {showSchoolEditModal && (
        <SchoolEditModal
          user={showSchoolEditModal}
          onClose={() => setShowSchoolEditModal(null)}
          onUpdate={fetchUsers}
        />
      )}

      {/* 일괄 학교 수정 모달 */}
      {showBulkSchoolModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[998]"
            onClick={() => setShowBulkSchoolModal(false)}
          />
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <div 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">일괄 학교 수정</h3>
                <button
                  onClick={() => setShowBulkSchoolModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <i className="ri-close-line text-gray-600 dark:text-gray-400"></i>
                </button>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">선택된 사용자:</span> {selectedUsers.length}명
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">학교 선택 *</label>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-xl mb-2 flex items-center px-3 py-2">
                    <i className="ri-search-line text-gray-400 dark:text-gray-500 mr-2"></i>
                    <input
                      type="text"
                      value={bulkSchoolSearch}
                      onChange={(e) => {
                        setBulkSchoolSearch(e.target.value);
                        if (selectedBulkSchool !== e.target.value) {
                          setSelectedBulkSchool('');
                        }
                      }}
                      placeholder="학교명을 검색하세요"
                      className="bg-transparent flex-1 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                    />
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {filteredBulkSchools.length > 0 ? (
                      filteredBulkSchools.map((school: School, idx: number) => (
                        <button
                          key={school.id}
                          type="button"
                          onClick={() => {
                            setSelectedBulkSchool(school.name);
                            setBulkSchoolSearch(school.name);
                          }}
                          className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                            idx !== filteredBulkSchools.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                          } ${
                            selectedBulkSchool === school.name
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600'
                          }`}
                        >
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${
                              selectedBulkSchool === school.name ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                            }`}>
                              {school.name}
                            </div>
                            {school.category && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{school.category}</div>
                            )}
                          </div>
                          {selectedBulkSchool === school.name ? (
                            <i className="ri-check-line text-blue-600 dark:text-blue-400 text-lg"></i>
                          ) : (
                            <i className="ri-arrow-right-s-line text-gray-300 dark:text-gray-600 text-lg"></i>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                        검색 결과가 없습니다
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleBulkSchoolUpdate}
                    disabled={bulkSchoolLoading || !selectedBulkSchool}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors"
                  >
                    {bulkSchoolLoading ? '수정 중...' : `${selectedUsers.length}명 수정하기`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkSchoolModal(false);
                      setSelectedBulkSchool('');
                      setBulkSchoolSearch('');
                    }}
                    disabled={bulkSchoolLoading}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 삭제 확인 모달 */}
      {confirmDeleteUser && (
        <>
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[998] animate-fade-in" onClick={() => setConfirmDeleteUser(null)} />
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" onClick={() => setConfirmDeleteUser(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="p-8">
                {/* 아이콘 */}
                <div className="flex justify-center mb-5">
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>

                {/* 제목 */}
                <h3 className="text-center text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">회원을 삭제할까요?</h3>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">삭제한 회원 정보는 복구할 수 없어요</p>

                {/* 회원 카드 */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                      {(confirmDeleteUser.nickname || confirmDeleteUser.email || '?').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{confirmDeleteUser.nickname || '사용자'}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{confirmDeleteUser.email}</p>
                    </div>
                  </div>
                </div>

                {/* 체크리스트 */}
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-2">삭제되는 정보</p>
                  <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-amber-600 dark:text-amber-400">✓</span> 계정 및 프로필 정보
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-600 dark:text-amber-400">✓</span> 작성한 고민 및 AI 답변
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-600 dark:text-amber-400">✓</span> 활동 기록 및 설정
                    </li>
                  </ul>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3">
                  <button onClick={() => setConfirmDeleteUser(null)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    취소
                  </button>
                  <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-500 dark:bg-red-600 text-white font-semibold hover:bg-red-600 dark:hover:bg-red-700 transition-colors">
                    삭제
                  </button>
                </div>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slide-up {
              from { opacity: 0; transform: translateY(30px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in { animation: fade-in 0.3s ease-out; }
            .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
          `}</style>
        </>
      )}
    </div>
  );
};

export default UsersTab;
