
import PastConcernsPage from './PastConcernsPage';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

function HistoryPage() {
  const [userId, setUserId] = useState('');
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      if (data && data.user) {
        setUserId(data.user.id);
      } else {
        setUserId('');
      }
      setChecked(true);
    }
    fetchUser();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (!checked) return null; // 아직 체크 중이면 아무것도 렌더링하지 않음

  return (
    <>
      <PastConcernsPage userId={userId} />
      {!userId && (
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
            pointerEvents: 'auto',
            overflow: 'hidden',
          }}
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

export default HistoryPage;
