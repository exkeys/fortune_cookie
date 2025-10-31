import { Mail } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function AccountBannedPage() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 실패:', error);
      // 실패해도 강제로 메인페이지로 이동
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">⛔</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">계정 이용 제한</h1>
            <div className="inline-block bg-red-100 text-red-700 px-4 py-1 rounded-full text-sm font-semibold">
              차단됨
            </div>
          </div>
          
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚨</span>
              <div>
                <p className="font-bold text-gray-900 text-sm mb-2">계정이 차단되었어요</p>
                <p className="text-gray-700 text-xs leading-relaxed">
                  서비스 이용 정책을 위반하여 관리자가 계정을 차단했습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <p className="font-semibold text-gray-900 text-sm mb-3">이용할 수 없는 기능</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <span className="text-gray-600 text-sm">포춘쿠키 받기</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <span className="text-gray-600 text-sm">고민 상담 작성</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <span className="text-gray-600 text-sm">서비스 이용</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Mail size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 text-sm mb-1">도움이 필요하신가요?</p>
                <p className="text-gray-600 text-xs mb-2">관리자에게 문의해 주세요</p>
                <p className="text-blue-600 text-xs font-mono">admin@fortunecookie.com</p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition mb-3"
          >
            로그아웃
          </button>
          
          <p className="text-gray-500 text-xs text-center">
            다른 계정으로 로그인하거나 관리자에게 문의하세요
          </p>
        </div>
      </div>
    </div>
  );
}
