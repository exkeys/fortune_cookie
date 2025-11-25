
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import HamburgerMenu from './components/HamburgerMenu';
import BackgroundDecorations from './components/BackgroundDecorations';
import FloatingIcons from './components/FloatingIcons';
import IntroMainContent from './components/IntroMainContent';
import { supabase } from '../../supabaseClient';

import { useEffect } from 'react';

export default function IntroPage() {
  const navigate = useNavigate();
  const { user, isLoggedIn, login, logout } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  
  // 모바일/태블릿에서 페이지 진입 시 스크롤을 맨 위로 이동
  useEffect(() => {
    // 화면 크기를 직접 체크하여 모바일/태블릿인지 확인 (데스크톱 제외)
    const checkAndScroll = () => {
      const width = window.innerWidth;
      // 모바일(768px 이하) 또는 태블릿(1024px 이하)일 때만 스크롤 이동
      if (width <= 1024) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };
    
    // 즉시 실행
    checkAndScroll();
    
    // DOM 렌더링 후에도 확인
    const timer = setTimeout(() => {
      checkAndScroll();
      requestAnimationFrame(() => {
        checkAndScroll();
      });
    }, 0);
    
    return () => clearTimeout(timer);
  }, []); // 페이지 마운트 시 한 번만 실행

  // isMobile 또는 isTablet 상태가 변경될 때도 스크롤을 맨 위로 이동
  useEffect(() => {
    if (isMobile || isTablet) {
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: 'instant' });
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isMobile, isTablet]);
  
  // 🚫 쿨다운 상태 체크 (최우선)
  useEffect(() => {
    const isCooldownRedirect = sessionStorage.getItem('cooldown-redirect') === 'true';
    if (isCooldownRedirect) {
      navigate('/account-cooldown');
      return;
    }
  }, [navigate]);

  // 운세 결과에서 하드웨어 뒤로가기로 돌아온 경우: 다음 뒤로가기는 앱 종료 처리
  useEffect(() => {
    const shouldEnableExitOverride = sessionStorage.getItem('intro_exit_override') === 'true';
    if (!shouldEnableExitOverride) {
      return;
    }

    sessionStorage.removeItem('intro_exit_override');

    const handleIntroExit = () => {
      window.removeEventListener('popstate', handleIntroExit);
      const backSteps = window.history.length > 1 ? -(window.history.length - 1) : -1;
      window.history.go(backSteps);
    };

    try {
      const currentUrl = window.location.pathname + window.location.search + window.location.hash;
      window.history.replaceState({ introExitGuard: 'root' }, '', currentUrl);
      window.history.pushState({ introExitGuard: 'pending' }, '', currentUrl);
    } catch {}

    window.addEventListener('popstate', handleIntroExit, { once: false });

    return () => {
      window.removeEventListener('popstate', handleIntroExit);
    };
  }, []);
  
  // OAuth 콜백 처리 (URL에 토큰이 있는 경우)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
      
      if (accessToken) {
        try {
          const { data: { session }, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (error) {
            console.error('세션 설정 에러:', error);
          } else if (session) {
            // 백엔드 세션 생성 로직도 제거 (B 구조에서는 불필요)
            window.history.replaceState({}, '', '/');
            window.location.reload();
          }
        } catch (error) {
          console.error('콜백 처리 에러:', error);
        }
      }
    };
    
    handleOAuthCallback();
  }, []);
  
  // 차단된 계정이면 차단 페이지로 리다이렉트 (최우선)
  useEffect(() => {
    if (user && user.status === 'banned') {
      navigate('/account-banned');
      return;
    }
  }, [user?.status, navigate]);

  // 첫 로그인(학교 정보가 null이거나 undefined인 경우)에는 학교 선택 페이지로 이동
  // 단, 밴된 사용자는 제외
  useEffect(() => {
    if (user && !user.is_admin && user.status !== 'banned' && (user['school'] === null || user['school'] === undefined)) {
      navigate('/school-select');
    }
  }, [user?.id, user?.is_admin, user?.school, user?.status, navigate]); // user 전체 대신 필요한 속성만 의존성으로 설정

  // 학교 선택이 필요한 경우 로딩 상태 표시 (밴된 사용자는 제외)
  if (user && !user.is_admin && user.status !== 'banned' && (user['school'] === null || user['school'] === undefined)) {
    return null;
  }
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
    <div className="min-h-screen md:min-h-screen h-screen md:h-auto bg-gradient-to-br from-amber-200 via-orange-200 to-pink-200 relative overflow-hidden">
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
