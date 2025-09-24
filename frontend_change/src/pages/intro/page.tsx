
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import HamburgerMenu from './components/HamburgerMenu';
import BackgroundDecorations from './components/BackgroundDecorations';
import FloatingIcons from './components/FloatingIcons';
import IntroMainContent from './components/IntroMainContent';

export default function IntroPage() {
  const navigate = useNavigate();
  const { isLoggedIn, login, logout } = useAuth();
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 via-orange-200 to-pink-200 relative overflow-hidden">
      <HamburgerMenu
        isLoggedIn={isLoggedIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onPastConcerns={handlePastConcerns}
        onFeedback={handleFeedback}
      />
      
      <BackgroundDecorations />
      
      <FloatingIcons />
      
      <IntroMainContent isLoggedIn={isLoggedIn} />
    </div>
  );
}
