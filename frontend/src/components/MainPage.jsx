import MainButton from './MainButton';
import { useNavigate } from 'react-router-dom';

function MainPage() {
  const navigate = useNavigate();
  return (
    <div
      style={{
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
      }}
    >
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
            어떤 고민을 하고 있나요?
          </h1>
        </div>
        <div style={{ width: '100vw', display: 'flex', justifyContent: 'center' }}>
          <MainButton
            onClick={() => navigate('/role')}
          >
            다음
          </MainButton>
        </div>
      </div>
    </div>
  );
}

export default MainPage;
