// modal
import { useState } from 'react';
import Card from '../../../components/base/Card';
import Button from '../../../components/base/Button';

interface User {
  id: string;
  email: string;
  nickname: string;
  status: 'active' | 'inactive' | 'deleted' | 'banned';
  is_admin: boolean;
  created_at: string;
  last_login_at: string | null;
  last_logout_at?: string | null;
}

interface UserDetailModalProps {
  user: User;
  onClose: () => void;
  onMakeAdmin: () => void;
  onRemoveAdmin: () => void;
  onBan: () => void;
  onUnban: () => void;
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

export default function UserDetailModal({
  user,
  onClose,
  onMakeAdmin,
  onRemoveAdmin,
  onBan,
  onUnban,
}: UserDetailModalProps) {
  const [showFullId, setShowFullId] = useState(false);
  
  // 디버깅을 위한 콘솔 로그
  console.log('UserDetailModal - user data:', {
    id: user.id,
    last_login_at: user.last_login_at,
    last_logout_at: user.last_logout_at,
    created_at: user.created_at
  });
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error, 'Input:', dateString);
      return 'N/A';
    }
  };

  const truncateId = (id: string, maxLength: number = 10) => {
    if (id.length <= maxLength) return id;
    return showFullId ? id : `${id.substring(0, maxLength)}...`;
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white">
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{user.nickname}</h3>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex space-x-2 mt-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.is_admin)}`}>
                  {getRoleText(user.is_admin)}
                </span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                  {getStatusText(user.status)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors duration-300"
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-100">
              <h4 className="font-bold text-gray-800 mb-4">계정 정보</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">가입일</span>
                  <span className="font-bold text-gray-800 text-xs">
                    {formatDate(user.created_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-xs">마지막 로그인</span>
                  <span className="font-bold text-gray-800 text-xs">
                    {formatDate(user.last_login_at || null)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-xs">마지막 로그아웃</span>
                  <span className="font-bold text-gray-800 text-xs">
                    {formatDate(user.last_logout_at || null)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-xs">사용자 ID</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-800 font-mono text-xs break-all">
                      {truncateId(user.id || '')}
                    </span>
                    {(user.id?.length || 0) > 10 && (
                      <button
                        onClick={() => setShowFullId(!showFullId)}
                        className="text-blue-500 hover:text-blue-700 text-xs font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        {showFullId ? '접기' : '더보기'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
              <h4 className="font-bold text-gray-800 mb-4">계정 상태</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">계정 상태</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                    {getStatusText(user.status)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">권한 레벨</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.is_admin)}`}>
                    {getRoleText(user.is_admin)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white hover:bg-gray-50"
            >
              닫기
            </Button>
            {user.is_admin ? (
              <Button
                onClick={onRemoveAdmin}
                className="flex-1 bg-purple-500 hover:bg-purple-600"
              >
                👤 관리자 권한 해제
              </Button>
            ) : (
              <Button
                onClick={onMakeAdmin}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600"
              >
                👑 관리자로 설정
              </Button>
            )}
            {user.status === 'banned' ? (
              <Button
                onClick={onUnban}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                ✅ 차단 해제
              </Button>
            ) : (
              <Button
                onClick={onBan}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600"
              >
                🚫 사용자 차단
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}