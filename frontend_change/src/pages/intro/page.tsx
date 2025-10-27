
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import HamburgerMenu from './components/HamburgerMenu';
import BackgroundDecorations from './components/BackgroundDecorations';
import FloatingIcons from './components/FloatingIcons';
import IntroMainContent from './components/IntroMainContent';
import { supabase } from '../../supabaseClient';

import { useEffect } from 'react';

export default function IntroPage() {
  const navigate = useNavigate();
  const { user, isLoggedIn, login, logout } = useAuth();
  
  // OAuth 콜백 처리 (URL에 토큰이 있는 경우)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      console.log('=== Intro 페이지 OAuth 콜백 체크 ===');
      console.log('현재 URL:', window.location.href);
      console.log('Hash:', window.location.hash);
      
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
      
      console.log('추출된 토큰:', { 
        accessToken: !!accessToken, 
        refreshToken: !!refreshToken 
      });
      
      if (accessToken) {
        console.log('토큰 발견, 세션 설정 중...');
        try {
          const { data: { session }, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (error) {
            console.error('세션 설정 에러:', error);
          } else if (session) {
            console.log('✅ 로그인 성공!');
            window.history.replaceState({}, '', '/');
            window.location.reload();
          }
        } catch (error) {
          console.error('콜백 처리 에러:', error);
        }
      } else {
        console.log('토큰 없음 - 정상 페이지');
      }
    };
    
    handleOAuthCallback();
  }, []);
  
  // 첫 로그인(학교 정보가 null이거나 undefined인 경우)에는 학교 선택 페이지로 이동
  useEffect(() => {
    if (user && !user.is_admin && (user['school'] === null || user['school'] === undefined)) {
      navigate('/school-select');
    }
  }, [user?.id, user?.is_admin, user?.school, navigate]); // user 전체 대신 필요한 속성만 의존성으로 설정
  if (user && !user.is_admin && (user['school'] === null || user['school'] === undefined)) {
    return null;
  }
  // 차단된 계정이면 차단 페이지로 리다이렉트
  useEffect(() => {
    if (user && user.status === 'banned') {
      console.log('🚫 밴된 사용자 감지 - 계정 차단 페이지로 리다이렉트');
      navigate('/account-banned');
    }
  }, [user?.status, navigate]);
  const handleLogin = async () => {
    await login('kakao');
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleFeedback = () => {
    navigate('/feedback');
  };

  const handlePastConcerns = () => {
    navigate('/past-concerns');
  };
  
  const handleAdmin = () => {
    navigate('/admin');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 via-orange-200 to-pink-200 relative overflow-hidden">
      <HamburgerMenu
        isLoggedIn={isLoggedIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onPastConcerns={handlePastConcerns}
        onFeedback={handleFeedback}
        onSettings={isLoggedIn ? handleSettings : undefined}
        onAdmin={user?.is_admin ? handleAdmin : undefined}
      />
      <BackgroundDecorations />
      <FloatingIcons />
      <IntroMainContent isLoggedIn={isLoggedIn} />
    </div>
  );
}
