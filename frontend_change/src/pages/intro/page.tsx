
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import HamburgerMenu from './components/HamburgerMenu';
import BackgroundDecorations from './components/BackgroundDecorations';
import FloatingIcons from './components/FloatingIcons';
import IntroMainContent from './components/IntroMainContent';

import { useEffect } from 'react';

export default function IntroPage() {
  const navigate = useNavigate();
  const { user, isLoggedIn, login, logout } = useAuth();
  // 첫 로그인(학교 정보 없는 경우)에는 학교 선택 페이지로 이동
  useEffect(() => {
    if (user && !user.is_admin && !user['school']) {
      navigate('/school-select');
    }
  }, [user, navigate]);
  if (user && !user.is_admin && !user['school']) {
    return null;
  }
  // 차단된 계정이면 차단 안내 페이지 표시
  if (user && user.status === 'banned') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-200 via-orange-200 to-pink-200">
        <div className="text-6xl mb-8">🚫</div>
        <div className="text-2xl text-red-600 font-bold mb-4">차단된 계정입니다.</div>
        <div className="text-lg text-gray-700 mb-8">서비스 이용이 제한되었습니다. 관리자에게 문의하세요.</div>
        <button
          className="px-6 py-3 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 transition"
          onClick={logout}
        >
          로그아웃
        </button>
      </div>
    );
  }
  const handleLogin = async () => {
    if (user && user.status === 'banned') {
      alert('차단된 계정입니다. 관리자에게 문의하세요.');
      return;
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 via-orange-200 to-pink-200 relative overflow-hidden">
      <HamburgerMenu
        isLoggedIn={isLoggedIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onPastConcerns={handlePastConcerns}
        onFeedback={handleFeedback}
        {...(user?.is_admin ? { onAdmin: handleAdmin } : {})}
      />
      <BackgroundDecorations />
      <FloatingIcons />
      <IntroMainContent isLoggedIn={isLoggedIn} />
    </div>
  );
}
