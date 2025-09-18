

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function MenuOverlay({ onClose, onLogin, onHistory }) {
  const [user, setUser] = useState(null);

  // 로그인 상태 실시간 반영
  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    }
    fetchUser();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    onClose();
  };
  const [showLoginGuide, setShowLoginGuide] = useState(false);

  const handleHistoryClick = () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      onHistory();
      onClose();
    } else {
      setShowLoginGuide(true);
    }
  };

  return (
    <>
  <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 300 }} onClick={onClose}>
        <div
          style={{
            position: 'absolute',
            top: 48,
            right: 20,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            padding: 0,
            minWidth: 160,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
          onClick={e => e.stopPropagation()}
        >
          {!user && (
            <div
              style={{
                padding: '16px 32px',
                cursor: 'pointer',
                fontWeight: 600,
                color: '#ffb300',
                fontSize: 18,
                borderBottom: '1px solid #ffe082',
                textAlign: 'center',
                width: '100%',
              }}
              onClick={onLogin}
            >
              로그인
            </div>
          )}
          {user && (
            <>
              <div
                style={{
                  padding: '16px 32px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#e57373',
                  fontSize: 18,
                  borderBottom: '1px solid #ffe082',
                  textAlign: 'center',
                  width: '100%',
                }}
                onClick={handleLogout}
              >
                로그아웃
              </div>
              <div
                style={{
                  padding: '16px 32px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#ffb300',
                  fontSize: 18,
                  textAlign: 'right',
                  width: '100%',
                }}
                onClick={handleHistoryClick}
              >
                지난 고민 보기
              </div>
            </>
          )}
        </div>
      </div>
      {showLoginGuide && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.45)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowLoginGuide(false)}
        >
          <div
            style={{
              background: '#fff',
              padding: '40px 32px',
              borderRadius: 16,
              fontSize: 24,
              color: '#ff9800',
              fontWeight: 700,
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
              textAlign: 'center',
              maxWidth: 360,
              lineHeight: 1.5
            }}
          >
            로그인을 하신 후<br />사용할 수 있습니다.
          </div>
        </div>
      )}
    </>
  );
}

export default MenuOverlay;