
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
  
  // 추천 질문들
  const suggestedConcerns = [
    "오늘 중요한 결정을 내려야 하는데 고민이에요",
    "새로운 도전을 시작하려고 하는데 용기가 필요해요",
    "인간관계에서 어려움을 겪고 있어요",
    "미래에 대한 불안감이 있어요",
    "일과 삶의 균형을 찾고 싶어요",
    "자신감이 부족해서 망설이고 있어요",
    "내 선택이 옳은지 확신이 서지 않아요",
    "계속 노력해도 성과가 없을까 봐 두려워요"
    
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 to-orange-200">
      <Header />
      
      <div className="container mx-auto px-3 py-8 max-w-3xl">
        {/* 선택된 역할 표시 */}
        {selectedRole && (
          <Card className="p-3 md:p-4 mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 max-w-2xl mx-auto">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className={`w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-r ${selectedRole.color} flex items-center justify-center text-white shadow-lg`}>
                <i className={`${selectedRole.icon} text-sm md:text-base lg:text-lg`}></i>
              </div>
              <div>
                <h3 className="text-sm md:text-base lg:text-lg font-bold text-gray-800">{selectedRole.name}</h3>
                <p className="text-xs md:text-sm lg:text-base text-gray-600">{selectedRole.description}</p>
              </div>
            </div>
          </Card>
        )}
        
        {/* 페이지 제목 */}
        <div className="text-center mb-3">
          <h1 className="text-base md:text-lg lg:text-xl font-bold text-gray-800 mb-1">
            어떤 고민이 있으신가요?
          </h1>
          <p className="text-xs md:text-sm lg:text-base text-gray-600">
            솔직하고 구체적으로 적어주세요. AI가 더 정확한 조언을 드릴 수 있어요.
          </p>
        </div>
        
        {/* 입력 영역 */}
        <Card className="p-2 md:p-2 lg:p-3 mb-3 max-w-3xl mx-auto">
          <div className="relative">
            <textarea
              value={concern}
              onChange={handleInputChange}
              placeholder="예: 새로운 프로젝트를 시작하려고 하는데, 성공할 수 있을지 확신이 서지 않아요."
              className="w-full h-20 md:h-24 lg:h-28 p-2 text-xs md:text-sm border border-gray-200 rounded resize-none focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-100 transition-all duration-300 text-gray-800 placeholder-gray-400"
            />
            <div className="absolute bottom-1 right-1 text-xs text-gray-400">
              {charCount}/{maxChars}
            </div>
          </div>
          
          {/* 글자 수 진행 바 */}
          <div className="mt-1">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className={`h-1 rounded-full transition-all duration-300 ${
                  charCount > maxChars * 0.8 ? 'bg-orange-400' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min((charCount / maxChars) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </Card>
        
        {/* 추천 질문 */}
        <Card className="p-2 md:p-2 lg:p-3 mb-4 max-w-4xl mx-auto">
          <h3 className="text-xs md:text-sm lg:text-base font-bold text-gray-800 mb-1 flex items-center">
            <i className="ri-lightbulb-line text-amber-500 mr-1 text-sm md:text-base lg:text-lg"></i>
            이런 고민은 어떠세요?
          </h3>
          <div className="space-y-1">
            {suggestedConcerns.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setConcern(suggestion);
                  setCharCount(suggestion.length);
                }}
                className="w-full text-left p-2 md:p-3 lg:p-4 rounded-lg bg-gray-50 hover:bg-amber-50 hover:border-amber-200 border border-transparent transition-all duration-300 text-xs md:text-sm lg:text-base text-gray-700"
              >
                "{suggestion}"
              </button>
            ))}
          </div>
        </Card>
        
        {/* 제출 버튼 */}
        <div className="text-center">
          <Button
            size="md"
            disabled={!concern.trim() || isSubmitting}
            loading={isSubmitting}
            onClick={handleSubmit}
            className="shadow-lg text-sm md:text-base lg:text-lg px-6 py-3 md:px-8 md:py-4"
          >
            {isSubmitting ? (
              <span>포춘쿠키 생성 중...</span>
            ) : (
              <span className="flex items-center space-x-2">
                <span>포춘쿠키 받기</span>
                <span className="text-lg md:text-xl lg:text-2xl">🥠</span>
              </span>
            )}
          </Button>
          
          {concern.trim() && (
            <p className="mt-3 text-xs md:text-sm lg:text-base text-amber-600">
              💡 팁: 구체적인 상황일수록 더 정확한 조언을 받을 수 있어요
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
