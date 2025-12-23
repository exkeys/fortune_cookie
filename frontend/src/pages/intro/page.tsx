
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import HamburgerMenu from './components/HamburgerMenu';
import BackgroundDecorations from './components/BackgroundDecorations';
import FloatingIcons from './components/FloatingIcons';
import IntroMainContent from './components/IntroMainContent';
import { supabase } from '../../supabaseClient';

import { useEffect, useState, useRef } from 'react';

export default function IntroPage() {
  const navigate = useNavigate();
  const { user, isLoggedIn, login, logout } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
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

  // 🔄 관리자 권한 실시간 업데이트 (캐시 우선 + Realtime)
  useEffect(() => {
    if (!user?.id) {
      setIsAdmin(null);
      return;
    }

    // 1. 초기값: 캐시 우선 (깜빡임 방지)
    const cachedProfile = localStorage.getItem(`user_profile_cache_${user.id}`);
    if (cachedProfile) {
      try {
        const profile = JSON.parse(cachedProfile);
        if (profile.is_admin !== undefined) {
          setIsAdmin(profile.is_admin);
        } else {
          setIsAdmin(user.is_admin ?? false);
        }
      } catch {
        setIsAdmin(user.is_admin ?? false);
      }
    } else {
      setIsAdmin(user.is_admin ?? false);
    }

    // 2. 🔄 Supabase Realtime 구독: 관리자 권한 변경 감지
    const channel = supabase
      .channel(`user-admin-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          // is_admin 필드가 실제로 변경되었는지 확인
          const oldIsAdmin = payload.old?.is_admin;
          const newIsAdmin = payload.new?.is_admin;
          
          // is_admin 필드가 변경되지 않았으면 스킵 (다른 필드 업데이트 시 불필요한 처리 방지)
          if (oldIsAdmin === newIsAdmin) {
            return;
          }
          
          // is_admin 필드가 변경되었을 때만 업데이트
          if (payload.new && 'is_admin' in payload.new) {
            const updatedIsAdmin = newIsAdmin ?? false;
            
            // ✅ 상태 업데이트 (즉시 반영)
            setIsAdmin(updatedIsAdmin);
            
            // ✅ 캐시도 즉시 업데이트 (다음 로딩 시 정확한 값 유지)
            const cachedProfile = localStorage.getItem(`user_profile_cache_${user.id}`);
            if (cachedProfile) {
              try {
                const profile = JSON.parse(cachedProfile);
                profile.is_admin = updatedIsAdmin;
                profile.cachedAt = Date.now();
                localStorage.setItem(`user_profile_cache_${user.id}`, JSON.stringify(profile));
              } catch {
                // 캐시 업데이트 실패 시 무시
              }
            }
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user?.id, user?.is_admin]);

  // 🔔 커스텀 이벤트 감지: 관리자 페이지에서 권한 변경 시 즉시 반영
  useEffect(() => {
    if (!user?.id) return;

    const handleAdminStatusChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ userId: string; isAdmin: boolean }>;
      const { userId, isAdmin } = customEvent.detail;

      // 현재 사용자 자신의 권한이 변경된 경우에만 처리
      if (userId === user.id) {
        // ✅ localStorage에서 직접 읽어서 즉시 업데이트 (API 호출 없이)
        const cachedProfile = localStorage.getItem(`user_profile_cache_${user.id}`);
        if (cachedProfile) {
          try {
            const profile = JSON.parse(cachedProfile);
            // 이벤트에서 받은 값으로 업데이트
            profile.is_admin = isAdmin;
            profile.cachedAt = Date.now();
            localStorage.setItem(`user_profile_cache_${user.id}`, JSON.stringify(profile));
          } catch {
            // 캐시 파싱 실패 시 무시
          }
        }
        
        // ✅ 상태 즉시 업데이트
        setIsAdmin(isAdmin);
      }
    };

    // 커스텀 이벤트 리스너 등록
    window.addEventListener('userAdminStatusChanged', handleAdminStatusChange);

    // 페이지 visibility 변경 시에도 확인 (다른 탭에서 돌아올 때)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const cachedProfile = localStorage.getItem(`user_profile_cache_${user.id}`);
        if (cachedProfile) {
          try {
            const profile = JSON.parse(cachedProfile);
            if (profile.is_admin !== undefined && profile.is_admin !== isAdmin) {
              setIsAdmin(profile.is_admin);
            }
          } catch {
            // 캐시 파싱 실패 시 무시
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('userAdminStatusChanged', handleAdminStatusChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, isAdmin]);

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
        onAdmin={isAdmin === true ? handleAdmin : undefined}
      />
      <BackgroundDecorations />
      <FloatingIcons />
      <IntroMainContent isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
    </div>
  );
}
