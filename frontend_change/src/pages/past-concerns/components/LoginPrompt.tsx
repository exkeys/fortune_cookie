import Button from '../../../components/base/Button';
import Card from '../../../components/base/Card';
import { supabase } from '../../../supabaseClient';

export default function LoginPrompt() {
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'kakao' });
    if (error) console.error('로그인 에러:', error);
  };

  return (
    <Card className="p-20 md:p-24 lg:p-28 text-center bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <div className="text-9xl md:text-[12rem] lg:text-[15rem] xl:text-[18rem] mb-12">🔐</div>
      <h3 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-800 mb-6">로그인이 필요해요</h3>
      <p className="text-xl md:text-2xl lg:text-3xl xl:text-4xl text-gray-600 mb-12 leading-relaxed">과거 운세 기록을 보려면 먼저 로그인해주세요</p>
      <Button 
        onClick={handleLogin}
        size="lg"
        className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl px-12 py-6 md:px-16 md:py-8 lg:px-20 lg:py-10 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
      >
        카카오로 로그인하기
      </Button>
    </Card>
  );
}