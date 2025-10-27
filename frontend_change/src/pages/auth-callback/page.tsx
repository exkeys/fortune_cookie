import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      console.log('=== /auth/callback 페이지 로드됨 ===');
      console.log('현재 URL:', window.location.href);
      console.log('Hash:', window.location.hash);
      console.log('Search:', window.location.search);

      try {
        // URL에서 토큰 추출
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const error = hashParams.get('error') || searchParams.get('error');

        console.log('추출된 토큰:', { 
          accessToken: !!accessToken, 
          refreshToken: !!refreshToken,
          error
        });

        if (accessToken) {
          console.log('토큰으로 세션 설정 시작...');
          
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) {
            console.error('세션 설정 에러:', sessionError);
            alert('로그인 실패: ' + sessionError.message);
            navigate('/');
          } else if (session) {
            console.log('✅ 세션 설정 완료!');
            console.log('사용자:', session.user.email);
            // 메인 페이지로 이동
            window.location.href = '/';
          }
        } else if (error) {
          console.error('OAuth 에러:', error);
          if (error.includes('state')) {
            // state 파라미터 에러는 무시하고 메인으로 이동
            console.log('state 파라미터 에러 무시');
            navigate('/');
          } else {
            alert('로그인 에러: ' + error);
            navigate('/');
          }
        } else {
          console.warn('토큰도 없고 에러도 없음 - 메인으로 이동');
          navigate('/');
        }
      } catch (error) {
        console.error('예외 발생:', error);
        alert('로그인 중 오류: ' + error);
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">로그인 처리 중...</h2>
        <p className="text-gray-600">잠시만 기다려주세요</p>
      </div>
    </div>
  );
}



