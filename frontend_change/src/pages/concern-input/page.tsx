
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/feature/Header';
import SelectedRoleDisplay from './components/SelectedRoleDisplay';
import PageTitle from './components/PageTitle';
import ConcernInputArea from './components/ConcernInputArea';
import SuggestedConcerns from './components/SuggestedConcerns';
import SubmitButton from './components/SubmitButton';

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
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedRole } = (location.state as LocationState) || {};
  
  const [concern, setConcern] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const maxChars = 100;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxChars) {
      setConcern(value);
      setCharCount(value.length);
    }
  };
  
  const handleSubmit = async () => {
    if (!concern.trim()) return;
    setIsSubmitting(true);
    try {
      // AI 답변 생성은 Fortune 페이지에서 처리하도록 변경
      navigate('/fortune-cookie', { state: { selectedRole, concern: concern.trim() } });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setConcern(suggestion);
    setCharCount(suggestion.length);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 to-orange-200">
      <Header />
      
      <div className="container mx-auto px-3 py-8 max-w-3xl">
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
