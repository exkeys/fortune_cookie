import React from 'react';
import UsersTable from './UsersTable';

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
}

const UsersTab: React.FC<UsersTabProps> = ({
  users,
  selectedUsers,
  setSelectedUsers,
  setShowUserModal,
  handleUserAction,
  searchTerm,
  setSearchTerm,
}) => {
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
  );
};

export default UsersTab;
