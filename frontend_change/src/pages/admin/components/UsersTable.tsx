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
}

const getRoleColor = (is_admin: boolean) =>
  is_admin ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200';
const getRoleText = (is_admin: boolean) => (is_admin ? '관리자' : '사용자');
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 border-green-200';
    case 'inactive': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'banned': return 'bg-red-100 text-red-800 border-red-200';
    case 'deleted': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
}: UsersTableProps) => {

  const lower = searchTerm.toLowerCase();
  const filteredUsers = users.filter(user => {
    // 닉네임, 이메일, 학교 중 하나라도 검색어를 포함하면 true
    return (
      (user.nickname && user.nickname.toLowerCase().includes(lower)) ||
      (user.email && user.email.toLowerCase().includes(lower)) ||
      (user.school && user.school.toLowerCase().includes(lower))
    );
  });

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-amber-50">
            <tr>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
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
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800">닉네임</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800">이메일</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800">학교</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800">가입일</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800">마지막 로그인</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800">운세수</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800">권한</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800">상태</th>
              <th className="px-4 py-4 text-left text-sm font-bold text-gray-800">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <tr 
                key={user.id} 
                className="hover:bg-amber-50/50 transition-colors duration-200 cursor-pointer"
                onClick={() => setShowUserModal(user)}
              >
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
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
                  <div className="font-bold text-gray-800">{user.nickname}</div>
                </td>
                <td className="px-4 py-4 text-gray-700 text-sm">{user.email}</td>
                <td className="px-4 py-4 text-gray-700 text-sm">{user.school || '-'}</td>
                <td className="px-4 py-4 text-gray-700 text-sm">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : ''}
                </td>
                <td className="px-4 py-4 text-gray-700 text-sm">
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
                <td className="px-4 py-4 text-gray-700 text-sm text-center">
                  {user.fortune_count ?? 0}
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.is_admin)}`}>
                    {getRoleText(user.is_admin)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                    {getStatusText(user.status)}
                  </span>
                </td>
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setShowUserModal(user)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors duration-300"
                      title="상세보기"
                    >
                      📋
                    </button>
                    {user.is_admin ? (
                      <button
                        onClick={() => handleUserAction('removeAdmin', user.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-purple-50 text-purple-500 hover:bg-purple-100 transition-colors duration-300"
                        title="관리자 권한 해제"
                      >
                        ⭐
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUserAction('makeAdmin', user.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-colors duration-300"
                        title="관리자로 설정"
                      >
                        👤
                      </button>
                    )}
                    <button
                      onClick={() => handleUserAction(user.status === 'banned' ? 'unban' : 'ban', user.id)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors duration-300 ${
                        user.status === 'banned' 
                          ? 'bg-green-50 text-green-500 hover:bg-green-100' 
                          : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                      }`}
                      title={user.status === 'banned' ? '차단 해제' : '사용자 차단'}
                    >
                      {user.status === 'banned' ? '🚫' : '✅'}
                    </button>
                    <button
                      onClick={() => setShowSchoolEditModal(user)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                      title="학교 수정"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleUserAction('delete', user.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors duration-300"
                      title="사용자 삭제"
                    >
                      🗑️
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