import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/base/Button';
import Card from '../../components/base/Card';

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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 flex items-center justify-center px-4">
      {/* 배경 데코레이션 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="text-center p-8 shadow-2xl" glow>
          {/* 아이콘 */}
          <div className="mb-6">
            <div className="text-8xl mb-4 animate-bounce">🚫</div>
            <div className="w-16 h-1 bg-red-500 mx-auto rounded-full"></div>
          </div>

          {/* 제목 */}
          <h1 className="text-3xl font-bold text-red-600 mb-4">
            계정 차단됨
          </h1>

          {/* 메시지 */}
          <div className="mb-8 space-y-4">
            <p className="text-lg text-gray-800 font-medium">
              죄송합니다. 현재 계정이 차단된 상태입니다.
            </p>
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
              <p className="text-sm text-red-700">
                서비스 이용 정책 위반으로 인해<br />
                관리자에 의해 계정이 차단되었습니다.
              </p>
            </div>
            <p className="text-gray-600">
              자세한 내용은 관리자에게 문의해 주세요.
            </p>
          </div>

          {/* 연락처 정보 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">📧 문의처</p>
            <p className="text-sm font-mono text-gray-800">
              admin@fortunecookie.com
            </p>
          </div>

          {/* 로그아웃 버튼 */}
          <Button 
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            로그아웃
          </Button>

          {/* 하단 메시지 */}
          <p className="text-xs text-gray-500 mt-4">
            다른 계정으로 로그인하시거나<br />
            관리자에게 문의하여 해결하시기 바랍니다.
          </p>
        </Card>
      </div>
    </div>
  );
}
