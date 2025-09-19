
import { useState, useRef, useEffect } from 'react';
import Input from './common/Input';
import PageLayout from './common/PageLayout';
import Button from './common/Button';
import LoadingSpinner from './common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { useNavigation } from '../hooks/useNavigation';
import { validateConcern } from '../utils/validation';
import { MESSAGES } from '../constants';


const ConcernInputPage = ({ role, onMenuClick }) => {
  const [concern, setConcern] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // 디버깅: onMenuClick prop 확인
  console.log('ConcernInputPage - onMenuClick:', onMenuClick);
  
  const { user, isLoggedIn } = useAuth();
  const { getAiAnswer } = useApi();
  const { goTo } = useNavigation();

  useEffect(() => {
    inputRef.current && inputRef.current.focus();
  }, []);

  const handleSubmit = async () => {
    setError('');
    
    const validation = validateConcern(concern);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    if (!isLoggedIn) {
      setError(MESSAGES.validation.loginRequired);
      return;
    }

    try {
      const { data, error: apiError } = await getAiAnswer(role, concern);
      
      if (apiError) {
        setError(MESSAGES.error.aiFailed);
        return;
      }

      goTo.fortune({
        role,
        concern,
        answer: data.answer
      });
    } catch (err) {
      setError(MESSAGES.error.aiFailed);
      console.error('AI 요청 에러:', err);
    }
  };

  return (
    <PageLayout title={`${role || '역할 미지정'}으로서 고민을 한 줄로 정리해 보세요`}>
      {onMenuClick && (
        <div style={{ position: 'absolute', top: 16, right: 32, zIndex: 200 }}>
          <button
            aria-label="메뉴"
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: 36, 
              cursor: 'pointer', 
              color: '#ff9800', 
              padding: 8 
            }}
            onClick={onMenuClick}
          >
            &#9776;
          </button>
        </div>
      )}
      <Input
        ref={inputRef}
        type="text"
        value={concern}
        onChange={e => setConcern(e.target.value)}
        placeholder="고민을 입력하세요"
        error={error}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <Button
          onClick={handleSubmit}
          variant="secondary"
          size="small"
        >
          다음
        </Button>
      </div>
    </PageLayout>
  );
}

export default ConcernInputPage;