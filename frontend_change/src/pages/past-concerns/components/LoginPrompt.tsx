import Card from '../../../components/base/Card';
import { supabase } from '../../../supabaseClient';

export default function LoginPrompt() {
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'kakao' });
    if (error) console.error('로그인 에러:', error);
  };

  return (
    <Card className="p-0 text-center bg-white border-0 shadow-lg max-w-md mx-auto overflow-hidden">
      {/* 상단 그린 헤더 */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-center">
        <div className="text-5xl mb-3">🔐</div>
        <h3 className="text-xl font-bold text-white">로그인이 필요합니다</h3>
      </div>

      <div className="p-8">
        {/* 체크리스트 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-700 font-medium mb-2">로그인하면 이런 것들을 할 수 있어요</p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> 내 운세 기록 저장
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> 언제든 다시보기
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span> AI 맞춤 조언 받기
            </li>
          </ul>
        </div>

        {/* 버튼 */}
        <button
          onClick={handleLogin}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-lg transition-colors mb-3"
        >
          카카오로 로그인하기
        </button>

        {/* 하단 설명 */}
        <p className="text-xs text-center text-gray-500 mt-4">3초만에 시작할 수 있어요</p>
      </div>
    </Card>
  );
}