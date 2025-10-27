import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/feature/Header';
import Button from '../../components/base/Button';
import Card from '../../components/base/Card';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, deleteAccount } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount();
      alert('회원탈퇴가 완료되었습니다.');
      navigate('/');
    } catch (error) {
      console.error('회원탈퇴 실패:', error);
      alert('회원탈퇴에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">설정</h1>

          {/* 사용자 정보 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">계정 정보</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">이메일:</span>
                  <span className="font-medium">{user?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">가입일:</span>
                  <span className="font-medium">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 계정 관리 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">계정 관리</h2>
            <div className="space-y-4">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full justify-center"
              >
                로그아웃
              </Button>

              <Button
                onClick={() => navigate('/past-concerns')}
                variant="outline"
                className="w-full justify-center"
              >
                과거 고민 관리
              </Button>

              <Button
                onClick={() => navigate('/feedback')}
                variant="outline"
                className="w-full justify-center"
              >
                피드백 보내기
              </Button>
            </div>
          </div>

          {/* 위험 구역 */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-red-600 mb-4">위험 구역</h2>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-700 text-sm mb-4">
                회원탈퇴 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
              </p>

              {!showDeleteConfirm ? (
                <Button
                  onClick={handleDeleteAccount}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  회원탈퇴
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="font-medium text-red-800">
                    정말로 회원탈퇴 하시겠습니까?
                  </p>
                  <div className="flex space-x-3">
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isDeleting ? '처리 중...' : '네, 탈퇴합니다'}
                    </Button>
                    <Button
                      onClick={() => setShowDeleteConfirm(false)}
                      variant="outline"
                      disabled={isDeleting}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}