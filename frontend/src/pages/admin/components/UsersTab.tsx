import React, { useState, useEffect } from 'react';
import UsersTable from './UsersTable';
import SchoolEditModal from './SchoolEditModal';

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">사용자 관리</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="이름, 학교, 이메일로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
          <button
            onClick={handleCSVDownload}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <i className="ri-download-line"></i>
            <span>다운로드</span>
          </button>
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
      />
      
      {showSchoolEditModal && (
        <SchoolEditModal
          user={showSchoolEditModal}
          onClose={() => setShowSchoolEditModal(null)}
          onUpdate={fetchUsers}
        />
      )}

      {/* 삭제 확인 모달 */}
      {confirmDeleteUser && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[998] animate-fade-in" onClick={() => setConfirmDeleteUser(null)} />
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" onClick={() => setConfirmDeleteUser(null)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="p-8">
                {/* 아이콘 */}
                <div className="flex justify-center mb-5">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>

                {/* 제목 */}
                <h3 className="text-center text-xl font-bold text-gray-900 mb-2">회원을 삭제할까요?</h3>
                <p className="text-center text-sm text-gray-600 mb-6">삭제한 회원 정보는 복구할 수 없어요</p>

                {/* 회원 카드 */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                      {(confirmDeleteUser.nickname || confirmDeleteUser.email || '?').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{confirmDeleteUser.nickname || '사용자'}</p>
                      <p className="text-sm text-gray-600 truncate">{confirmDeleteUser.email}</p>
                    </div>
                  </div>
                </div>

                {/* 체크리스트 */}
                <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm font-semibold text-amber-900 mb-2">삭제되는 정보</p>
                  <ul className="text-xs text-amber-800 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-amber-600">✓</span> 계정 및 프로필 정보
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-600">✓</span> 작성한 고민 및 AI 답변
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-600">✓</span> 활동 기록 및 설정
                    </li>
                  </ul>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3">
                  <button onClick={() => setConfirmDeleteUser(null)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition-colors">
                    취소
                  </button>
                  <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors">
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
