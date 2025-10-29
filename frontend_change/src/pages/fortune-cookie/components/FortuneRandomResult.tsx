import { useState, useEffect } from 'react';
import Typewriter from 'typewriter-effect';
import Card from '../../../components/base/Card';


interface FortuneRandomResultProps {
  fortuneMessage: string;
  user?: { id: string } | null;
  onPrevious: () => void;
  onNext: (randomFortune: string) => void;
}

export default function FortuneRandomResult({ 
  fortuneMessage,
  user,
  onPrevious,
  onNext
}: FortuneRandomResultProps) {
  const [isTyping, setIsTyping] = useState(true);

  // 운세 메시지가 바뀔 때마다 타이핑 상태 초기화
  useEffect(() => {
    if (fortuneMessage) {
      setIsTyping(true);
    }
  }, [fortuneMessage]);
  
  const handleNextClick = async () => {
    // 다음 버튼 클릭 시 daily_usage_log에 사용 기록 추가
    if (user?.id) {
      try {
        console.log('포춘 쿠키 사용 로그 기록 시작...', { userId: user.id });
        const response = await fetch('/api/daily-usage-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        });

        if (response.ok) {
          console.log('✅ 일일 사용 로그 기록 완료');
        } else {
          const errorData = await response.json();
          console.error('일일 사용 로그 기록 실패:', errorData);
        }
      } catch (error) {
        console.error('일일 사용 로그 API 호출 에러:', error);
      }
    }
    
    // 다음 페이지로 이동
    onNext(fortuneMessage);
  };
  return (
    <Card className="p-10 md:p-12 lg:p-14 bg-gradient-to-br from-white to-amber-50 shadow-xl animate-fade-in max-w-4xl mx-auto relative">
      {/* 전체 카드 오른쪽 클릭 영역 (모바일 스타일) */}
      <button
        onClick={handleNextClick}
        disabled={isTyping}
        className={`absolute right-0 top-0 bottom-0 w-1/5 z-20 transition-colors duration-200 ${
          isTyping 
            ? 'cursor-not-allowed pointer-events-none opacity-50' 
            : 'cursor-pointer hover:bg-gray-300/50 active:bg-gray-400/60'
        }`}
        aria-label="오른쪽 영역 클릭하여 다음으로"
      />
      
      {/* 전체 카드 왼쪽 클릭 영역 */}
      <button
        onClick={onPrevious}
        className="absolute left-0 top-0 bottom-0 w-1/5 cursor-pointer z-20 transition-colors duration-200 hover:bg-gray-300/50 active:bg-gray-400/60"
        aria-label="왼쪽 영역 클릭하여 이전으로"
      />
      
      <div className="mb-6">
        <div className="text-5xl md:text-6xl lg:text-7xl mb-5">🥠</div>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-3">당신의 운세</h2>
        <div className="w-20 h-1.5 md:w-28 md:h-2 bg-gradient-to-r from-amber-400 to-orange-400 mx-auto rounded-full"></div>
      </div>

      {/* 운세 종이(메시지) 영역 - Typewriter 효과 적용 */}
      <div className="relative mb-6">
        <div className="bg-white p-6 md:p-8 lg:p-10 rounded-xl shadow-inner relative z-10">
          <div className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-700 font-medium font-sans">
            {fortuneMessage && (
              <div 
                className="typewriter-container"
                style={{ 
                  fontSize: 'inherit', 
                  lineHeight: 'inherit', 
                  fontFamily: 'inherit',
                  fontWeight: 'inherit',
                  color: 'inherit'
                }}
              >
                <Typewriter
                  key={fortuneMessage}
                  onInit={(typewriter: any) => {
                    typewriter
                      .typeString(fortuneMessage)
                      .callFunction(() => {
                        setIsTyping(false);
                      })
                      .start();
                  }}
                  options={{
                    delay: 100,
                    deleteSpeed: 0,
                    cursor: '',
                    loop: false,
                    wrapperClassName: 'typewriter-wrapper',
                    cursorClassName: 'typewriter-cursor'
                  }}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* 랜덤 데이터 바깥(좌/우) 플로팅 버튼 */}
        <button
          aria-label="이전"
          onClick={onPrevious}
          className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/90 text-gray-700 shadow-lg ring-1 ring-gray-200 hover:bg-white hover:shadow-xl transition absolute -left-9 top-1/2 -translate-y-1/2 z-30"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          aria-label="다음"
          onClick={handleNextClick}
          disabled={isTyping}
          className={`hidden md:flex items-center justify-center w-12 h-12 rounded-full shadow-lg ring-1 transition absolute -right-9 top-1/2 -translate-y-1/2 z-30
            ${isTyping ? 'bg-blue-400/60 text-white ring-blue-300 cursor-not-allowed' : 'bg-blue-500 text-white ring-blue-400 hover:bg-blue-600 hover:shadow-xl'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="text-sm md:text-base lg:text-lg text-gray-500 mb-6">
        {new Date().toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          weekday: 'long'
        })}
      </div>

      {/* 하단 버튼 제거됨 */}
    </Card>
  );
}
