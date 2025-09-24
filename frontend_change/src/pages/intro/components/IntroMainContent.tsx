import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/base/Button';
import Card from '../../../components/base/Card';

interface IntroMainContentProps {
  isLoggedIn: boolean;
}

export default function IntroMainContent({ isLoggedIn }: IntroMainContentProps) {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
      <div className={`text-center transform transition-all duration-1000 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        {/* 메인 로고/제목 */}
        <div className="mb-12">
          <h1 
            className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 bg-clip-text text-transparent mb-6 pb-16 pt-3 leading-relaxed"
            style={{ fontFamily: "Pacifico, serif" }}
          >
            fortune cookie
          </h1>
          <div className="flex justify-center mb-6">
            <div className="text-[6rem] md:text-[8rem] lg:text-[9rem] xl:text-[10rem] animate-bounce">🥠</div>
          </div>
        </div>
        
        {/* 소개 카드 */}
        <Card className="max-w-3xl mx-auto p-6 md:p-7 lg:p-8 mb-8" glow>
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-4">
            당신만의 맞춤 운세를 확인해보세요
          </h2>

          {/* 특징 리스트 */}
          <div className="space-y-4 mb-7">
            <div className="flex items-center space-x-3 text-amber-600">
              <i className="ri-user-star-line w-6 h-6 md:w-7 md:h-7 flex items-center justify-center"></i>
              <span className="text-base md:text-lg lg:text-xl font-medium">역할별 맞춤 상담</span>
            </div>
            <div className="flex items-center space-x-3 text-orange-600">
              <i className="ri-magic-line w-6 h-6 md:w-7 md:h-7 flex items-center justify-center"></i>
              <span className="text-base md:text-lg lg:text-xl font-medium">AI 포춘쿠키 생성</span>
            </div>
            <div className="flex items-center space-x-3 text-pink-600">
              <i className="ri-share-line w-6 h-6 md:w-7 md:h-7 flex items-center justify-center"></i>
              <span className="text-base md:text-lg lg:text-xl font-medium">결과 공유 가능</span>
            </div>
          </div>
        </Card>
        
        {/* 시작 버튼 */}
        <div className="space-y-4">
          <Button 
            size="md"
            onClick={() => {
              if (isLoggedIn) {
                navigate('/role-select');
              } else {
                alert('로그인 후 이용해 주세요');
              }
            }}
            className="px-8 py-4 md:px-10 md:py-5 text-base md:text-lg lg:text-xl shadow-xl hover:shadow-amber-300/50"
          >
            <span className="flex items-center space-x-2">
              <span>운세보기 시작하기</span>
              <i className="ri-arrow-right-line text-lg md:text-xl"></i>
            </span>
          </Button>
          
          <button
            onClick={() => navigate('/past-concerns')}
            className="block mx-auto text-amber-600 hover:text-amber-700 text-sm md:text-base lg:text-lg font-medium transition-colors duration-300"
          >
            이전 운세 기록 보기
          </button>
        </div>
      </div>
    </div>
  );
}