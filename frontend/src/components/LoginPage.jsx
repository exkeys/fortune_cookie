

import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

function LoginPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      if (data && data.user) {
        setIsLoggedIn(true);
        setUser(data.user);
        // 로그인된 경우 userId를 localStorage에 저장
        localStorage.setItem('userId', data.user.id);
      } else {
        setIsLoggedIn(false);
        setUser(null);
        // 로그아웃 시 userId 제거
        localStorage.removeItem('userId');
      }
    }
    checkUser();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'kakao' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5' }}>
      <h2>로그인</h2>
      {isLoggedIn ? (
        <div style={{ marginTop: 32, fontSize: 20, color: '#009688', fontWeight: 700, textAlign: 'center' }}>
          {user?.email || '로그인 완료!'}<br />
          <span style={{ fontSize: 24 }}>🎉</span> 환영합니다!
        </div>
      ) : (
        <button
          onClick={handleKakaoLogin}
          style={{
            marginTop: 32,
            padding: '14px 40px',
            fontSize: 20,
            background: '#fee500',
            color: '#181600',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px #0001',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <span style={{ fontSize: 24 }}>🐤</span> 카카오로 로그인
        </button>
      )}
    </div>
  );
}

export default LoginPage;
