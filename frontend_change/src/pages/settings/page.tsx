import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/feature/Header';
import { 
  MessageSquare,
  LogOut, 
  Trash2,
  FileText,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, deleteAccount } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cachedData, setCachedData] = useState<{
    email: string | null;
    school: string | null;
    created_at: string | null;
  }>({
    email: null,
    school: null,
    created_at: null
  });

  // 이메일, 학교, 가입일 캐싱
  useEffect(() => {
    // sessionStorage에서 데이터 확인
    const cachedEmail = sessionStorage.getItem('user_email');
    const cachedSchool = sessionStorage.getItem('user_school');
    const cachedCreatedAt = sessionStorage.getItem('user_created_at');
    
    // 캐시 데이터가 모두 있으면 사용
    if (cachedEmail && cachedCreatedAt) {
      setCachedData({
        email: cachedEmail,
        school: cachedSchool,
        created_at: cachedCreatedAt
      });
    }
    
    // DB에서 새로운 데이터가 있으면 캐시 업데이트
    if (user?.email) {
      const emailToCache = user.email;
      const schoolToCache = (user as any).school || null;
      const createdAtToCache = user.created_at;
      
      // school이 unknown이 아닌 경우만 저장
      if (schoolToCache && schoolToCache !== 'unknown') {
        sessionStorage.setItem('user_school', schoolToCache);
      }
      sessionStorage.setItem('user_email', emailToCache);
      if (createdAtToCache) {
        sessionStorage.setItem('user_created_at', createdAtToCache);
      }
      
      setCachedData(prev => ({
        email: emailToCache,
        school: schoolToCache && schoolToCache !== 'unknown' ? schoolToCache : prev.school,
        created_at: createdAtToCache || prev.created_at
      }));
    }
  }, [user?.email, user?.created_at, (user as any)?.school]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
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

  // 이메일에서 첫 글자 추출
  const getInitial = () => {
    const email = cachedData.email || user?.email;
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-amber-50 to-orange-50">
      <Header />
      
      <div className="max-w-lg mx-auto px-6 py-6 space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                {getInitial()}
              </div>
              <div className="flex-1">
                <p className="text-sm text-black">{cachedData.email || user?.email || 'N/A'}</p>
                <p className="text-xs text-black mt-0.5">
                  {cachedData.school || (user as any)?.school || '학교 정보 없음'}
                </p>
                <p className="text-xs text-black mt-0.5">
                  가입일: {cachedData.created_at ? new Date(cachedData.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            <button 
              onClick={() => {
                sessionStorage.setItem('pastConcernsFrom', 'settings');
                navigate('/past-concerns');
              }}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">과거 고민 관리</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button 
              onClick={() => navigate('/feedback')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">피드백 보내기</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <button 
            onClick={handleLogout}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">로그아웃</span>
            </div>
          </button>
        </div>

        {/* Account Delete */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <button 
            onClick={handleDeleteClick}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-red-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-500" />
              <span className="font-medium text-red-500">계정 삭제</span>
            </div>
          </button>
        </div>

        {/* Version */}
        <div className="text-center text-sm text-gray-500 py-2">
          포춘쿠키
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteConfirm && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[998]"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 pointer-events-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">계정 삭제</h3>
                  <p className="text-sm text-gray-500">정말로 탈퇴하시겠습니까?</p>
                </div>
              </div>

              <div className="bg-red-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-800 leading-relaxed">
                  회원탈퇴 시 모든 데이터가 <strong>영구적으로 삭제</strong>되며 복구할 수 없습니다.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors font-medium text-xs"
                >
                  {isDeleting ? '처리 중...' : '탈퇴하기'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-3 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg disabled:opacity-50 transition-colors font-medium text-xs"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}