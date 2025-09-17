import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import RoleSelectPage from './components/RoleSelectPage';
import HistoryPage from './components/HistoryPage';
import HamburgerMenu from './components/HamburgerMenu';
import MenuOverlay from './components/MenuOverlay';
import MainButton from './components/MainButton';
import IntroPage from './components/IntroPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import MainPage from './components/MainPage';
import ConcernInputPage from './components/ConcernInputPage';
import FortuneCookiePage from './components/FortuneCookiePage';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  return (
    <>
      {menuOpen && (
        <MenuOverlay
          onClose={() => setMenuOpen(false)}
          onLogin={() => { setMenuOpen(false); navigate('/login'); }}
          onHistory={() => { setMenuOpen(false); navigate('/history'); }}
        />
      )}
      <Routes>
        <Route path="/" element={<IntroPage onMenuClick={() => setMenuOpen(true)} />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/role" element={<RoleSelectPage onSelect={r => { setRole(r); navigate('/concern'); }} />} />
  <Route path="/concern" element={<ConcernInputPage role={role} />} />
  <Route path="/fortune" element={<FortuneCookiePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </>
  );
}

export default App;