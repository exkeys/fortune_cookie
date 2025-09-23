
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/base/Button';
import Card from '../../components/base/Card';
import Header from '../../components/feature/Header';

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
  const maxChars = 300;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxChars) {
      setConcern(value);
      setCharCount(value.length);
    }
  };
  
  const handleSubmit = async () => {
    if (concern.trim()) {
      setIsSubmitting(true);
      
      // 로딩 시뮬레이션
      setTimeout(() => {
        navigate('/fortune-cookie', {
          state: {
            selectedRole,
            concern: concern.trim()
          }
        });
      }, 1500);
    }
  };
  
  // 추천 질문들
  const suggestedConcerns = [
    "오늘 중요한 결정을 내려야 하는데 고민이에요",
    "새로운 도전을 시작하려고 하는데 용기가 필요해요",
    "인간관계에서 어려움을 겪고 있어요",
    "미래에 대한 불안감이 있어요",
    "일과 삶의 균형을 찾고 싶어요"
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 선택된 역할 표시 */}
        {selectedRole && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${selectedRole.color} flex items-center justify-center text-white shadow-lg`}>
                <i className={selectedRole.icon}></i>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{selectedRole.name}</h3>
                <p className="text-sm text-gray-600">{selectedRole.description}</p>
              </div>
            </div>
          </Card>
        )}
        
        {/* 페이지 제목 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            어떤 고민이 있으신가요?
          </h1>
          <p className="text-gray-600">
            솔직하고 구체적으로 적어주세요. AI가 더 정확한 조언을 드릴 수 있어요.
          </p>
        </div>
        
        {/* 입력 영역 */}
        <Card className="p-6 mb-6">
          <div className="relative">
            <textarea
              value={concern}
              onChange={handleInputChange}
              placeholder="예: 새로운 프로젝트를 시작하려고 하는데, 성공할 수 있을지 확신이 서지 않아요. 어떤 마음가짐으로 임해야 할까요?"
              className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl resize-none focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all duration-300 text-gray-800 placeholder-gray-400"
              style={{ fontSize: '16px' }}
            />
            <div className="absolute bottom-2 right-2 text-sm text-gray-400">
              {charCount}/{maxChars}
            </div>
          </div>
          
          {/* 글자 수 진행 바 */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  charCount > maxChars * 0.8 ? 'bg-orange-400' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min((charCount / maxChars) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </Card>
        
        {/* 추천 질문 */}
        <Card className="p-6 mb-8">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center">
            <i className="ri-lightbulb-line text-amber-500 mr-2"></i>
            이런 고민은 어떠세요?
          </h3>
          <div className="space-y-2">
            {suggestedConcerns.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setConcern(suggestion);
                  setCharCount(suggestion.length);
                }}
                className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-amber-50 hover:border-amber-200 border border-transparent transition-all duration-300 text-sm text-gray-700"
              >
                "{suggestion}"
              </button>
            ))}
          </div>
        </Card>
        
        {/* 제출 버튼 */}
        <div className="text-center">
          <Button
            size="lg"
            disabled={!concern.trim() || isSubmitting}
            loading={isSubmitting}
            onClick={handleSubmit}
            className="shadow-xl"
          >
            {isSubmitting ? (
              <span>포춘쿠키 생성 중...</span>
            ) : (
              <span className="flex items-center space-x-2">
                <span>포춘쿠키 받기</span>
                <span>🥠</span>
              </span>
            )}
          </Button>
          
          {concern.trim() && (
            <p className="mt-4 text-sm text-amber-600">
              💡 팁: 구체적인 상황일수록 더 정확한 조언을 받을 수 있어요
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
