
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FortuneCookie from './FortuneCookie';


function FortuneCookiePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, concern, answer } = location.state || {};
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'success', 'error'
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (saved) return;
    setSaveStatus('saving');
    try {
      const res = await fetch('http://localhost:4000/api/concerns/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: role, concern, aiAnswer: answer })
      });
      if (res.ok) {
        setSaveStatus('success');
        setSaved(true);
      } else {
        setSaveStatus('error');
      }
    } catch (e) {
      setSaveStatus('error');
    }
  };

  const handleFinish = () => {
    navigate('/');
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
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden',
      }}
    >
      <FortuneCookie answer={answer} />
      <div style={{ marginTop: 40, display: 'flex', gap: 24 }}>
        <button
          onClick={handleSave}
          disabled={saved || saveStatus === 'saving'}
          style={{
            padding: '14px 36px',
            fontSize: 20,
            background: saved ? '#bdbdbd' : '#ff9800',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: saved ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            boxShadow: '0 2px 8px #0001',
            transition: 'background 0.2s',
          }}
        >
          {saveStatus === 'saving' ? '저장 중...' : saved ? '저장 완료' : '저장하기'}
        </button>
        <button
          onClick={handleFinish}
          style={{
            padding: '14px 36px',
            fontSize: 20,
            background: '#ff9800',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 700,
            boxShadow: '0 2px 8px #0001',
            transition: 'background 0.2s',
          }}
        >
          마침
        </button>
      </div>
      {saveStatus === 'error' && (
        <div style={{ color: 'red', marginTop: 16, fontWeight: 600 }}>저장에 실패했습니다. 다시 시도해 주세요.</div>
      )}
    </div>
  );
}

export default FortuneCookiePage;
