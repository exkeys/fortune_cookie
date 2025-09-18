import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import RoleSelectPage from './components/RoleSelectPage';
import MenuOverlay from './components/MenuOverlay';
import IntroPage from './components/IntroPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import MainPage from './components/MainPage';
import ConcernInputPage from './components/ConcernInputPage';
import FortuneCookiePage from './components/FortuneCookiePage';
import PastConcernsPage from './components/PastConcernsPage';
import ErrorBoundary from './components/ErrorBoundary';
import { useNavigation } from './hooks/useNavigation';
import errorHandler from './utils/errorHandler';
import performanceMonitor from './utils/performance';

const App: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [role, setRole] = useState<string>('');
  const { goTo } = useNavigation();

  return (
    <ErrorBoundary>
      {menuOpen && (
        <MenuOverlay
          onClose={() => setMenuOpen(false)}
          onLogin={() => { setMenuOpen(false); goTo.login(); }}
          onHistory={() => { setMenuOpen(false); goTo.history(); }}
        />
      )}
      <Routes>
        <Route path="/" element={<IntroPage onMenuClick={() => setMenuOpen(true)} />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/role" element={<RoleSelectPage onSelect={(r: string) => { setRole(r); goTo.concern(); }} />} />
        <Route path="/concern" element={<ConcernInputPage role={role} />} />
        <Route path="/fortune" element={<FortuneCookiePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/history" element={<PastConcernsPage userId={localStorage.getItem('userId')} />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;


