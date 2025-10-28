import React, { useState } from 'react';
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
        handleUserAction={handleUserAction}
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
    </div>
  );
};

export default UsersTab;
