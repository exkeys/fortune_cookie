import { useEffect } from 'react';

export default function AccountCooldownPage() {
  useEffect(() => {
    // 쿨다운 리다이렉트 플래그 정리 (페이지 도달 확인)
    sessionStorage.removeItem('cooldown-redirect');
    // oauth-callback에서 설정한 체크 완료 플래그도 정리
    sessionStorage.removeItem('auth_check_completed');
    sessionStorage.removeItem('auth_check_result');
    // 중복 실행 방지 플래그 정리 (다음 로그인을 위해)
    sessionStorage.removeItem('oauth_processed');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 via-orange-200 to-pink-200 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center">
        {/* 아이콘 */}
        <div className="text-7xl mb-6 animate-bounce">⏰</div>

        {/* 타이틀 */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          재가입 제한
        </h1>

        {/* 메시지 */}
        <div className="space-y-4 mb-8">
          <p className="text-lg text-gray-700 leading-relaxed">
            탈퇴 후 <span className="font-bold text-orange-600">24시간</span> 동안은<br />
            동일한 계정으로 재가입할 수 없습니다.
          </p>
        </div>

        {/* 안내 박스 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800">
            24시간 동안 재가입이 제한됩니다.
          </p>
        </div>

        {/* 버튼 */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 rounded-xl hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all shadow-lg"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

