

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // supabaseClient.js 경로에 맞게 수정


function ConcernInputPage({ role }) {

  const [concern, setConcern] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current && inputRef.current.focus();
  }, []);

    const handleSubmit = async () => {
    console.log('handleSubmit called'); // 1. 함수 진입 확인
    setError('');
    if (!concern.trim()) {
      setError('고민을 입력해 주세요.');
      console.log('concern is empty');
      return;
    }
    setLoading(true);
    try {
      console.log('before getUser');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('user:', user); // 2. user 객체 전체 출력
      if (!user) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        console.log('user is null');
        return;
      }
      console.log('userId to save:', user.id); // 3. user.id 값 출력
      // 1. AI 답변 요청
      const aiRes = await axios.post('http://localhost:4000/api/concerns/ai', {
        persona: role,
        concern
      });
      const aiAnswer = aiRes.data.answer;

      // 2. DB 저장 요청 (userId 포함)
      // [자동 저장 비활성화] 아래 코드를 주석 처리하면 FortuneCookiePage에서만 저장됩니다.
      // console.log('DB 저장 요청 userId:', user.id);
      // await axios.post('http://localhost:4000/api/concerns/save', {
      //   persona: role,
      //   concern,
      //   aiAnswer,
      //   userId: user.id
      // });

      // 3. FortuneCookiePage로 이동
      navigate('/fortune', {
        state: {
          role,
          concern,
          answer: aiAnswer
        }
      });
    } catch (err) {
      setError('AI 답변 요청 또는 저장에 실패했습니다.');
      console.log('error:', err);
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
          ref={inputRef}
          type="text"
          value={concern}
          onChange={e => setConcern(e.target.value)}
          placeholder="고민을 입력하세요"
          style={{ fontSize: 20, padding: '12px 20px', borderRadius: 12, border: '1px solid #ffb300', marginBottom: 16, width: 420, maxWidth: '90%' }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault(); // 중복 방지
              handleSubmit();
            }
          }}
          disabled={loading}
        />
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <div style={{ width: '100vw', display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{ fontSize: 20, padding: '10px 40px', borderRadius: 12, background: '#ffb300', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            {loading ? 'AI가 답변 중...' : '다음'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConcernInputPage;