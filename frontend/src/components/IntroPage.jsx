import React, { useEffect, useState } from 'react';
import HamburgerMenu from './HamburgerMenu';
import MainButton from './MainButton';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function KakaoHeader() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    }
    fetchUser();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      right: 32,
      zIndex: 201,
      background: 'transparent',
      padding: 0,
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      minWidth: 0
    }}>
      {user && (
        <span style={{ color: '#111', fontWeight: 700, textShadow: '0 2px 8px #0008, 0 1px 0 #fff', background: 'transparent', fontSize: 18 }}>
          {user.user_metadata?.name || user.email || '사용자'}님, 환영합니다 🎉
        </span>
      )}
    </div>
  );
}

function IntroPage({ onMenuClick }) {
  const navigate = useNavigate();

  const handleNext = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('로그인 후 이용해 주세요.');
      return;
    }
    
    try {
      // upsert 시 onConflict를 email로 설정하고, id와 email 모두 업데이트
      const { error } = await supabase.from('users').upsert([
        { 
          id: user.id, 
          email: user.email,
          nickname: user.user_metadata?.name || user.email?.split('@')[0] || '사용자'
        }
      ], { 
        onConflict: 'email' // email이 중복될 때의 처리
      });
      
      if (error) {
        console.error('DB 저장 에러:', error);
        // 이미 존재하는 사용자라면 에러를 무시하고 진행
        if (error.code !== '23505') {
          alert('사용자 정보 저장에 실패했습니다.');
          return;
        }
      }
      
      // localStorage에 userId 저장
      localStorage.setItem('userId', user.id);
      navigate('/main');
    } catch (err) {
      console.error('DB 저장 예외:', err);
      alert('사용자 정보 저장에 실패했습니다.');
    }
  };

  return (
    <>
      <KakaoHeader />
      <div style={{
        minHeight: '100vh',
        minWidth: '100vw',
        height: '100vh',
        width: '100vw',
        background: '#fffbe6',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden',
        paddingTop: 80 // 헤더 높이만큼 패딩
      }}>
        <div style={{ position: 'absolute', top: 16, right: 32, zIndex: 200 }}>
          <HamburgerMenu onClick={onMenuClick} />
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
          }}
        >
          <div style={{ width: '100vw', display: 'flex', justifyContent: 'center' }}>
            <h1
              style={{
                fontSize: 56,
                fontWeight: 800,
                color: '#ff9800',
                margin: 0,
                marginBottom: 40,
                letterSpacing: 2,
                textShadow: '0 2px 8px rgba(0,0,0,0.08)',
                textAlign: 'center',
                width: 'auto',
                wordBreak: 'keep-all',
              }}
            >
              오늘의 해답
            </h1>
          </div>
          <div style={{ width: '100vw', display: 'flex', justifyContent: 'center' }}>
            <MainButton onClick={handleNext}>
              다음
            </MainButton>
          </div>
        </div>
      </div>
    </>
  );
}

export default IntroPage;