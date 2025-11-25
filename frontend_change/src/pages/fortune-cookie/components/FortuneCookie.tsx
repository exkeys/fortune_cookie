import { useState, useEffect } from 'react';

interface FortuneCookieProps {
  isOpening?: boolean;
  onCookieClick?: () => void;
  isOpened?: boolean;
}

export default function FortuneCookie({ isOpening = false, onCookieClick, isOpened = false }: FortuneCookieProps) {
  const [showSparkles, setShowSparkles] = useState(false);
  const [showCracked, setShowCracked] = useState(false);
  
  useEffect(() => {
    if (isOpening) {
      setShowSparkles(true);
      // 깨지는 효과 타이밍
      setTimeout(() => {
        setShowCracked(true);
      }, 800);
      
      const timer = setTimeout(() => setShowSparkles(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpening]);
  
  return (
    <div className="relative flex items-center justify-center p-8">
      {/* 반짝이는 효과 - 더 많고 화려하게 */}
      {showSparkles && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: '1s'
              }}
            >
              <i className={`${['ri-sparkle-fill', 'ri-star-fill', 'ri-heart-fill'][Math.floor(Math.random() * 3)]} text-amber-400 ${['text-sm', 'text-base', 'text-lg'][Math.floor(Math.random() * 3)]}`}></i>
            </div>
          ))}
        </div>
      )}
      
      {/* 포춘쿠키 - 크기 대폭 확대 */}
      <div
        className={`relative cursor-pointer transition-all duration-500 transform ${
          isOpening 
            ? 'animate-bounce scale-110 rotate-12' 
            : 'hover:scale-125 hover:rotate-3 hover:shadow-2xl'
        } ${isOpened ? 'opacity-90' : ''}`}
        onClick={onCookieClick}
        style={{ filter: 'drop-shadow(0 10px 20px rgba(245, 158, 11, 0.3))' }}
      >
        <div className={`relative ${isOpening ? 'animate-pulse' : ''}`}>
          {/* 원본 포춘쿠키 이미지 - 크기 대폭 확대 */}
          <div className={`relative transition-all duration-700 ${showCracked ? 'opacity-0 transform rotate-45 scale-75' : 'opacity-100'} scale-110`}>
            <img
              src="https://static.readdy.ai/image/e4377b1cf779405d18e407a36958a94f/96067f8db312c80237ba6cd7d2a0c3a0.png"
              alt="Fortune Cookie"
              className="w-48 h-36 object-contain hover:brightness-110 transition-all duration-300"
            />
          </div>
          
          {/* 깨진 포춘쿠키 이미지 - 크기 대폭 확대 */}
          <div className={`absolute top-0 left-0 transition-all duration-700 ${showCracked ? 'opacity-100' : 'opacity-0'}`}>
            <img
              src="https://static.readdy.ai/image/e4377b1cf779405d18e407a36958a94f/33d3532e99d359d3f5a8fe8decfab589.png"
              alt="Cracked Fortune Cookie"
              className={`w-48 h-36 object-contain transition-all duration-700 ${
                isOpened ? 'transform rotate-6 scale-110' : ''
              }`}
            />
            
            {/* 쿠키가 깨진 후 나타나는 종이 - 크기 확대 */}
            {isOpened && (
              <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 animate-slide-up scale-110">
                <div className="relative">
                  {/* 종이 그림자 - 더 큰 크기 */}
                  <div className="absolute top-2 left-2 w-36 h-28 bg-gray-400 rounded-lg opacity-20 blur-sm"></div>
                  
                  {/* 종이 - 더 큰 크기 */}
                  <div className="w-36 h-28 bg-gradient-to-b from-amber-50 via-white to-amber-50 rounded-lg shadow-2xl border-2 border-amber-200 flex items-center justify-center transform rotate-2 animate-float">
                    <div className="text-center px-4 py-3">
                      <div className="text-sm text-gray-600 leading-tight space-y-2">
                        <div className="w-20 h-0.5 bg-amber-500 mx-auto rounded-full"></div>
                        <div className="w-16 h-0.5 bg-amber-400 mx-auto rounded-full"></div>
                        <div className="w-18 h-0.5 bg-amber-500 mx-auto rounded-full"></div>
                        <div className="w-14 h-0.5 bg-amber-400 mx-auto rounded-full"></div>
                        <div className="w-19 h-0.5 bg-amber-500 mx-auto rounded-full"></div>
                        <div className="w-12 h-0.5 bg-amber-400 mx-auto rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 종이 위의 반짝임 효과 - 더 많이 */}
                  <div className="absolute -top-2 -right-2 text-amber-400 animate-pulse">
                    <i className="ri-sparkle-fill text-lg"></i>
                  </div>
                  <div className="absolute -bottom-1 -left-1 text-orange-400 animate-pulse" style={{ animationDelay: '0.5s' }}>
                    <i className="ri-star-fill text-sm"></i>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 그림자 - 더 큰 크기와 강화된 효과 */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-40 h-8 bg-amber-300 bg-opacity-40 rounded-full blur-lg"></div>
        
        {/* 호버시 추가 반짝임 */}
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute top-4 right-4 text-amber-400 animate-ping">
            <i className="ri-sparkle-fill text-lg"></i>
          </div>
          <div className="absolute bottom-4 left-4 text-yellow-400 animate-ping" style={{ animationDelay: '0.3s' }}>
            <i className="ri-star-fill text-base"></i>
          </div>
        </div>
      </div>
      
      {/* 클릭 안내 - 더 큰 크기와 강화된 스타일 */}
      {!isOpened && !isOpening && (
        <div 
          className="absolute -bottom-8 sm:-bottom-10 md:-bottom-12 left-1/2 transform -translate-x-1/2 text-amber-600 text-xs sm:text-sm md:text-base lg:text-lg font-bold animate-bounce bg-white px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full shadow-lg border-2 border-amber-200 whitespace-nowrap cursor-pointer hover:bg-amber-50 hover:border-amber-300 transition-all"
          onClick={onCookieClick}
        >
          <div className="flex items-center space-x-1 sm:space-x-2">
            <span>쿠키를 눌러보세요!</span>
            <span className="text-base sm:text-lg md:text-xl lg:text-2xl">🥠</span>
          </div>
        </div>
      )}
      
      {/* 추가 장식 효과 */}
      {!isOpened && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-2 h-2 bg-amber-300 rounded-full animate-pulse opacity-60"></div>
          <div className="absolute bottom-0 right-1/4 w-1 h-1 bg-orange-400 rounded-full animate-pulse opacity-50" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 right-0 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse opacity-40" style={{ animationDelay: '2s' }}></div>
        </div>
      )}
    </div>
  );
}