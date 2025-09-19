import { useState } from 'react';
import MainButton from './MainButton';
import Input from './common/Input';
import PageLayout from './common/PageLayout';
import { validateRole } from '../utils/validation';
import { MESSAGES } from '../constants';

const RoleSelectPage = ({ onSelect, onMenuClick }) => {
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  // 디버깅: onMenuClick prop 확인
  console.log('RoleSelectPage - onMenuClick:', onMenuClick);

  const handleNext = () => {
    const validation = validateRole(role);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }
    setError('');
    if (onSelect) onSelect(role.trim());
  };

  return (
    <PageLayout title="오늘은 어떤 역할로 고민을 나누고 싶으신가요?">
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
        type="text"
        value={role}
        onChange={e => setRole(e.target.value)}
        placeholder="예: 스타트업 CEO, 디자이너, 대학생 등"
        error={error}
        onKeyDown={e => { if (e.key === 'Enter') handleNext(); }}
      />
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <MainButton onClick={handleNext}>다음</MainButton>
      </div>
    </PageLayout>
  );
}

export default RoleSelectPage;
