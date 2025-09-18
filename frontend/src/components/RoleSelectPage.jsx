import { useState } from 'react';
import MainButton from './MainButton';
import Input from './common/Input';
import PageLayout from './common/PageLayout';
import { validateRole } from '../utils/validation';
import { MESSAGES } from '../constants';

const RoleSelectPage = ({ onSelect }) => {
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

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
      <Input
        type="text"
        value={role}
        onChange={e => setRole(e.target.value)}
        placeholder="예: 스타트업 CEO, 디자이너, 대학생 등"
        error={error}
        onKeyDown={e => { if (e.key === 'Enter') handleNext(); }}
      />
      <div style={{ width: '100vw', display: 'flex', justifyContent: 'center' }}>
        <MainButton onClick={handleNext}>다음</MainButton>
      </div>
    </PageLayout>
  );
}

export default RoleSelectPage;
