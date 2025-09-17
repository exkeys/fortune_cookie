
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ConcernInputPage({ role }) {
  const [concern, setConcern] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError('');
    if (!concern.trim()) {
      setError('고민을 입력해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:4000/api/concerns', {
        persona: role,
        concern
      });
      // 답변을 받으면 바로 FortuneCookiePage로 이동
      navigate('/fortune', {
        state: {
          role,
          concern,
          answer: res.data.answer
        }
      });
    } catch (err) {
      setError('AI 답변 요청에 실패했습니다.');
    }
    setLoading(false);
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
            textShadow: '0 2px 8px rgba(0,0,0,0.08)',
            textAlign: 'center',
            width: 'auto',
            wordBreak: 'keep-all',
          }}
        >
          {role ? <b>{role}</b> : '역할 미지정'}로서 고민을 한 줄로 정리해 보세요
        </h1>
        <input
          type="text"
          value={concern}
          onChange={e => setConcern(e.target.value)}
          placeholder="고민을 입력하세요"
          style={{ fontSize: 20, padding: '12px 20px', borderRadius: 12, border: '1px solid #ffb300', marginBottom: 16, width: 420, maxWidth: '90%' }}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          disabled={loading}
        />
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <div style={{ width: '100vw', display: 'flex', justifyContent: 'center' }}>
          <button onClick={handleSubmit} disabled={loading} style={{ fontSize: 20, padding: '10px 40px', borderRadius: 12, background: '#ffb300', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
            {loading ? 'AI가 답변 중...' : '다음'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConcernInputPage;