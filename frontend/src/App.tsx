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
import { useSessionUsage } from './hooks/useSessionUsage';
// import { supabase } from './supabaseClient';
// import { useEffect } from 'react';

const App: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [role, setRole] = useState<string>('');
  const { goTo } = useNavigation();
  useSessionUsage();

  /*
  const AuthTimesDebug: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [loginAt, setLoginAt] = useState<string>('-');
    const [logoutAt, setLogoutAt] = useState<string>('-');

    const fetchTimes = async () => {
      try {
        setLoading(true);
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id;
        if (!uid) {
          setLoginAt('-');
          setLogoutAt('-');
          return;
        }
        const { data, error } = await supabase
          .from('users')
          .select('last_login_at, last_logout_at')
          .eq('id', uid)
          .single();
        if (!error && data) {
          const toKst = (v?: string | null) => v ? new Date(v).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
          setLoginAt(toKst(data.last_login_at));
          setLogoutAt(toKst(data.last_logout_at));
        }
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => { void fetchTimes(); }, []);

    if (process.env.NODE_ENV === 'production') return null;
    return (
      <div style={{ position: 'fixed', bottom: 8, left: 8, zIndex: 9999, background: '#0008', color: '#fff', padding: '8px 10px', borderRadius: 6, fontSize: 12 }}>
        <div>last_login: {loginAt}</div>
        <div>last_logout: {logoutAt}</div>
        <button onClick={fetchTimes} disabled={loading} style={{ marginTop: 4, fontSize: 12 }}>refresh</button>
      </div>
    );
  };
  */


  return (
    <ErrorBoundary>
      {/* <AuthTimesDebug />  디버그 패널 비활성화 */}
      {/* Debug usage panel (commented out after verification)
      {process.env.NODE_ENV !== 'production' && (
        <div style={{ position: 'fixed', bottom: 8, right: 8, zIndex: 9999, background: '#0008', color: '#fff', padding: '8px 10px', borderRadius: 6, fontSize: 12 }}>
          <div>usage session: {String(debugInfo.sessionActive)}</div>
          <div>flushed(min): {debugInfo.totalFlushedMinutes}</div>
          <div>buffer(ms): {debugInfo.bufferedMs}</div>
          <div>last: {debugInfo.lastEvent}</div>
        </div>
      )}
      */}
      {menuOpen && (
        <MenuOverlay
          onClose={() => setMenuOpen(false)}
          onLogin={() => { setMenuOpen(false); goTo.login(); }}
          onHistory={() => { setMenuOpen(false); goTo.history(); }}
        />
      )}
      <Routes>
        <Route path="/" element={<IntroPage onMenuClick={() => setMenuOpen(true)} />} />
        <Route path="/main" element={<MainPage onMenuClick={() => setMenuOpen(true)} />} />
        <Route path="/role" element={<RoleSelectPage onSelect={(r: string) => { setRole(r); goTo.concern(); }} onMenuClick={() => setMenuOpen(true)} />} />
        <Route path="/concern" element={<ConcernInputPage role={role} onMenuClick={() => setMenuOpen(true)} />} />
        <Route path="/fortune" element={<FortuneCookiePage onMenuClick={() => setMenuOpen(true)} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/history" element={<PastConcernsPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;


