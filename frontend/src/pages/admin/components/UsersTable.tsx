import Card from '../../../components/base/Card';
import { Edit2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  nickname: string;
  status: 'active' | 'inactive' | 'deleted' | 'banned';
  is_admin: boolean;
  created_at: string;
  last_login_at: string | null;
  last_logout_at?: string | null;
  school?: string;
  fortune_count?: number;
}

interface UsersTableProps {
  users: User[];
  selectedUsers: string[];
  setSelectedUsers: (ids: string[]) => void;
  setShowUserModal: (user: User | null) => void;
  handleUserAction: (action: string, userId?: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setShowSchoolEditModal: (user: User | null) => void;
  adminFilter: 'all' | 'admin' | 'user';
  statusFilter: 'all' | 'active' | 'banned';
}

const getRoleColor = (is_admin: boolean) =>
  is_admin ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
const getRoleText = (is_admin: boolean) => (is_admin ? '관리자' : '사용자');
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
    case 'inactive': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    case 'banned': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
    case 'deleted': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
  }
};
const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return '활성';
    case 'inactive': return '비활성';
    case 'banned': return '차단됨';
    case 'deleted': return '삭제됨';
    default: return '알 수 없음';
  }
};

const UsersTable = ({
  users,
  selectedUsers,
  setSelectedUsers,
  setShowUserModal,
  handleUserAction,
  searchTerm,
  setShowSchoolEditModal,
  adminFilter,
  statusFilter,
}: UsersTableProps) => {

  const lower = searchTerm.toLowerCase();
  const filteredUsers = users.filter(user => {
    // 검색어 필터
    const matchesSearch = !searchTerm || (
      (user.nickname && user.nickname.toLowerCase().includes(lower)) ||
      (user.email && user.email.toLowerCase().includes(lower)) ||
      (user.school && user.school.toLowerCase().includes(lower))
    );

    // 관리자 필터
    const matchesAdmin = adminFilter === 'all' || 
      (adminFilter === 'admin' && user.is_admin) ||
      (adminFilter === 'user' && !user.is_admin);

    // 상태 필터
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesAdmin && matchesStatus;
  });

  return (
    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 dark:border-gray-700 shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-amber-50 dark:from-gray-700 dark:to-gray-700">
            <tr>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200">
                <input
                  type="checkbox"
                  className="w-4 h-4 cursor-pointer"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(filteredUsers.map(u => u.id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                  checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUsers.includes(u.id))}
                />
              </th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200">닉네임</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200">이메일</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200">학교</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200">가입일</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200">마지막 로그인</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200">운세수</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200">권한</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200">상태</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredUsers.map((user) => (
              <tr 
                key={user.id} 
                className="hover:bg-amber-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer"
                onClick={() => setShowUserModal(user)}
              >
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                      }
                    }}
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="font-bold text-gray-800 dark:text-gray-200">{user.nickname}</div>
                </td>
                <td className="px-4 py-4 text-gray-700 dark:text-gray-300 text-sm">{user.email}</td>
                <td className="px-4 py-4 text-gray-700 dark:text-gray-300 text-sm">{user.school || '-'}</td>
                <td className="px-4 py-4 text-gray-700 dark:text-gray-300 text-sm">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : ''}
                </td>
                <td className="px-4 py-4 text-gray-700 dark:text-gray-300 text-sm">
                  {user.last_login_at 
                    ? new Date(user.last_login_at).toLocaleDateString('ko-KR', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '로그인 기록 없음'
                  }
                </td>
                <td className="px-4 py-4 text-gray-700 dark:text-gray-300 text-sm text-center">
                  {user.fortune_count ?? 0}
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.is_admin)}`}>
                    {getRoleText(user.is_admin)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {user.status === 'banned' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                      <i className="ri-error-warning-line text-sm"></i>
                      <span>차단됨</span>
                    </span>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                      {getStatusText(user.status)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setShowUserModal(user)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105"
                      title="상세보기"
                    >
                      <i className="ri-eye-line text-base"></i>
                    </button>
                    {user.is_admin ? (
                      <button
                        onClick={() => handleUserAction('removeAdmin', user.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all duration-200 hover:scale-105"
                        title="관리자 권한 해제"
                      >
                        <i className="ri-shield-star-line text-base"></i>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUserAction('makeAdmin', user.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-200 hover:scale-105"
                        title="관리자로 설정"
                      >
                        <i className="ri-user-star-line text-base"></i>
                      </button>
                    )}
                    {user.status === 'banned' ? (
                      <button
                        onClick={() => handleUserAction('unban', user.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-all duration-200 hover:scale-105"
                        title="차단 해제"
                      >
                        <i className="ri-close-circle-line text-base"></i>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUserAction('ban', user.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 transition-all duration-200 hover:scale-105"
                        title="사용자 차단"
                      >
                        <i className="ri-checkbox-circle-line text-base"></i>
                      </button>
                    )}
                    <button
                      onClick={() => setShowSchoolEditModal(user)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105"
                      title="학교 수정"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={() => handleUserAction('delete', user.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all duration-200 hover:scale-105"
                      title="사용자 삭제"
                    >
                      <i className="ri-delete-bin-line text-base"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default UsersTable;