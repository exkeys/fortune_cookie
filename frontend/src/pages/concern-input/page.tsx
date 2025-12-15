import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/feature/Header';
import SelectedRoleDisplay from './components/SelectedRoleDisplay';
import PageTitle from './components/PageTitle';
import ConcernInputArea from './components/ConcernInputArea';
import SuggestedConcerns from './components/SuggestedConcerns';
import SubmitButton from './components/SubmitButton';
import { loadFormData, updateFormData } from '../../utils/formPersistence';

interface LocationState {
  selectedRole?: {
    id: string;
    name: string;
    icon: string;
    description: string;
    color: string;
  };
}

export default function ConcernInputPage() {
  useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedRole } = (location.state as LocationState) || {};

  const [concern, setConcern] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const maxChars = 100;

  // 컴포넌트 마운트 시 저장된 폼 데이터 복원
  useEffect(() => {
    const savedData = loadFormData();
    if (savedData?.concern) {
      setConcern(savedData.concern);
      setCharCount(savedData.concern.length);
    }
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxChars) {
      setConcern(value);
      setCharCount(value.length);
      // 입력할 때마다 localStorage에 저장
      updateFormData({ concern: value });
    }
  };
  
  const handleSubmit = async () => {
    if (!concern.trim()) return;
    setIsSubmitting(true);
    try {
      // 최종 폼 데이터 저장
      updateFormData({ concern: concern.trim() });
      
      // AI 답변 생성은 Fortune 페이지에서 처리하도록 변경
      navigate('/fortune-cookie', { state: { selectedRole, concern: concern.trim() } });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setConcern(suggestion);
    setCharCount(suggestion.length);
    // 제안 클릭 시에도 localStorage에 저장
    updateFormData({ concern: suggestion });
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 to-orange-200">
      <Header />
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 lg:py-12 max-w-3xl">
        <SelectedRoleDisplay selectedRole={selectedRole} />
        <PageTitle />
        <ConcernInputArea 
          concern={concern}
          charCount={charCount}
          maxChars={maxChars}
          onInputChange={handleInputChange}
        />
        <SuggestedConcerns onSuggestionClick={handleSuggestionClick} />
        <SubmitButton 
          concern={concern}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
