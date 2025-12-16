// modal
import { useState } from 'react';
import Card from '../../../components/base/Card';
import CopySuccessModal from '../../../components/base/CopySuccessModal';

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

interface UserDetailModalProps {
  user: User;
  onClose: () => void;
  onMakeAdmin: () => void;
  onRemoveAdmin: () => void;
  onBan: () => void;
  onUnban: () => void;
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

export default function UserDetailModal({
  user,
  onClose,
  onMakeAdmin: _onMakeAdmin,
  onRemoveAdmin: _onRemoveAdmin,
  onBan: _onBan,
  onUnban: _onUnban,
}: UserDetailModalProps) {
  const [showCopyModal, setShowCopyModal] = useState(false);
  
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

  const handleCopyId = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 모달 닫기 이벤트와 충돌 방지
    try {
      await navigator.clipboard.writeText(user.id);
      setShowCopyModal(true);
      setTimeout(() => setShowCopyModal(false), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
      // 폴백: 텍스트 영역을 사용한 복사 방법
      const textArea = document.createElement('textarea');
      textArea.value = user.id;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      document.body.appendChild(textArea);
      textArea.select();
      textArea.setSelectionRange(0, user.id.length);
      try {
        // document.execCommand는 deprecated되었지만, 일부 환경에서의 폴백으로 필요
        // eslint-disable-next-line deprecation/deprecation
        const success = document.execCommand('copy');
        if (success) {
        setShowCopyModal(true);
        setTimeout(() => setShowCopyModal(false), 2000);
        } else {
          throw new Error('execCommand failed');
        }
      } catch (fallbackError) {
        console.error('폴백 복사 실패:', fallbackError);
        alert('복사에 실패했습니다. 수동으로 복사해주세요.');
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };
  return (
    <div 
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <Card 
        className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-0 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-10">
          {/* 프로필 헤더 */}
          <div className="flex items-start justify-between mb-10 pb-8 border-b border-gray-200/60 dark:border-gray-700/60">
            <div className="flex items-center gap-5">
              {/* 아바타 - 더 큰 크기와 그림자 */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-3xl text-white font-bold shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20">
                  {user.nickname.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-gray-900 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                  {user.is_admin ? (
                    <i className="ri-shield-star-fill text-amber-500 text-xs"></i>
                  ) : (
                    <i className="ri-user-fill text-blue-500 text-xs"></i>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1.5">{user.nickname}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 flex items-center gap-2">
                  <i className="ri-mail-line text-xs"></i>
                  {user.email}
                </p>
                <div className="flex gap-2">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getRoleColor(user.is_admin)} shadow-sm`}>
                    <i className={`ri-${user.is_admin ? 'shield-star' : 'user'}-line mr-1.5`}></i>
                    {getRoleText(user.is_admin)}
                  </span>
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(user.status)} shadow-sm`}>
                    <i className={`ri-${user.status === 'active' ? 'check' : user.status === 'banned' ? 'close' : 'time'}-circle-line mr-1.5`}></i>
                    {getStatusText(user.status)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200 hover:scale-105"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* 통계 카드 그리드 - 더 세련된 디자인 */}
          <div className="grid grid-cols-3 gap-5 mb-10">
            <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/30 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                  <i className="ri-star-line text-blue-600 dark:text-blue-400 text-lg"></i>
                </div>
              </div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">작성한 운세</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{user.fortune_count ?? 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">개</div>
            </div>
            <div className="group relative bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 p-6 rounded-2xl border border-purple-100 dark:border-purple-800/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                  <i className="ri-calendar-check-line text-purple-600 dark:text-purple-400 text-lg"></i>
                </div>
              </div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">가입일</div>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {formatDate(user.created_at).split(' ')[0]}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {formatDate(user.created_at).split(' ').slice(1).join(' ')}
              </div>
            </div>
            <div className="group relative bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                  <i className="ri-time-line text-emerald-600 dark:text-emerald-400 text-lg"></i>
                </div>
              </div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">마지막 활동</div>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {user.last_login_at ? formatDate(user.last_login_at).split(' ')[0] : 'N/A'}
              </div>
              {user.last_login_at && (
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {formatDate(user.last_login_at).split(' ').slice(1).join(' ')}
                </div>
              )}
            </div>
          </div>

          {/* 상세 정보 - 더 세련된 스타일 */}
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <i className="ri-information-line"></i>
              상세 정보
            </h4>
            <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-xl p-1">
              <div className="flex items-center justify-between py-4 px-4 border-b border-gray-100/50 dark:border-gray-700/50 group hover:bg-white dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <i className="ri-fingerprint-line text-blue-600 dark:text-blue-400 text-sm"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">사용자 ID</span>
                </div>
                <button
                  onClick={handleCopyId}
                  type="button"
                  className="font-mono text-sm text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer transition-colors flex items-center gap-2 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                >
                  <span className="break-all text-right">{user.id}</span>
                  <i className="ri-file-copy-line text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"></i>
                </button>
              </div>
              {user.school && (
                <div className="flex items-center justify-between py-4 px-4 border-b border-gray-100/50 dark:border-gray-700/50 group hover:bg-white dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <i className="ri-school-line text-purple-600 dark:text-purple-400 text-sm"></i>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">학교</span>
                  </div>
                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">{user.school}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-4 px-4 border-b border-gray-100/50 dark:border-gray-700/50 group hover:bg-white dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <i className="ri-login-box-line text-green-600 dark:text-green-400 text-sm"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">마지막 로그인</span>
                </div>
                <span className="text-sm text-gray-900 dark:text-gray-100">{formatDate(user.last_login_at || null)}</span>
              </div>
              <div className="flex items-center justify-between py-4 px-4 group hover:bg-white dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <i className="ri-logout-box-line text-orange-600 dark:text-orange-400 text-sm"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">마지막 로그아웃</span>
                </div>
                <span className="text-sm text-gray-900 dark:text-gray-100">{formatDate(user.last_logout_at || null)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 복사 완료 모달 */}
      <CopySuccessModal 
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        message="사용자 ID가 클립보드에 복사되었습니다."
      />
    </div>
  );
}