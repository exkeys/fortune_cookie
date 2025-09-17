import { useState } from 'react';
import MainButton from './MainButton';

function RoleSelectPage({ onSelect }) {
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!role.trim()) {
      setError('역할을 입력해 주세요.');
      return;
    }
    setError('');
    if (onSelect) onSelect(role.trim());
  };

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
        <h1
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: '#ff9800',
            margin: 0,
            marginBottom: 40,
            letterSpacing: 2,
            textShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          오늘은 어떤 역할로 고민을 나누고 싶으신가요?
        </h1>
        <input
          type="text"
          value={role}
          onChange={e => setRole(e.target.value)}
          placeholder="예: 스타트업 CEO, 디자이너, 대학생 등"
          style={{ fontSize: 20, padding: '12px 20px', borderRadius: 12, border: '1px solid #ffb300', marginBottom: 16, width: 420, maxWidth: '90%' }}
          onKeyDown={e => { if (e.key === 'Enter') handleNext(); }}
        />
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <div style={{ width: '100vw', display: 'flex', justifyContent: 'center' }}>
          <MainButton onClick={handleNext}>다음</MainButton>
        </div>
      </div>
    </div>
  );
}

export default RoleSelectPage;
