import React, { useState, useRef, useEffect } from 'react';
import imageCookie from '../assets/images/image_cookie.png';
import imageCookieAlt from '../assets/images/image_cookie_alt.png';
import imageSlip from '../assets/images/image_slip.png';

const CinematicFortuneCookie = ({ answer = "오늘은 당신에게 특별한 기회가 찾아올 것입니다. 용기를 내어 새로운 도전을 해보세요! 🍀" }) => {
  const [stage, setStage] = useState('initial'); // initial -> cracking -> broken -> paper
  const [particles, setParticles] = useState([]);
  const [showMessage, setShowMessage] = useState(false);
  const containerRef = useRef(null);
  const audioRef = useRef(null);

  // 파티클 생성 함수
  const createParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 400 + 100,
        y: Math.random() * 200 + 150,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        size: Math.random() * 4 + 2,
        color: `hsl(${Math.random() * 60 + 30}, 70%, 60%)` // 황금색 계열
      });
    }
    setParticles(newParticles);
  };

  // 파티클 애니메이션
  useEffect(() => {
    if (particles.length === 0) return;
    
    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vy: particle.vy + 0.2, // 중력 효과
        life: particle.life - 0.02,
        size: particle.size * 0.98
      })).filter(particle => particle.life > 0));
    }, 16);

    return () => clearInterval(interval);
  }, [particles]);

  const handleCookieClick = () => {
    if (stage !== 'initial') return;
    
    // 사운드 효과 (선택적)
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    // 단계별 애니메이션
    setStage('cracking');
    createParticles();
    
    setTimeout(() => {
      setStage('broken');
    }, 800);
    
    setTimeout(() => {
      setStage('paper');
    }, 1200);
    
    setTimeout(() => {
      setShowMessage(true);
    }, 2000);
  };

  const handleReset = () => {
    setStage('initial');
    setParticles([]);
    setShowMessage(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
      {/* 배경 별빛 효과 */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* 메인 컨테이너 */}
      <div 
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center"
        style={{ perspective: '1000px' }}
      >
        {/* 파티클 효과 */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.life,
              filter: 'blur(0.5px)',
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
            }}
          />
        ))}

        {/* 포춘쿠키 - 초기 상태 */}
        {stage === 'initial' && (
          <div
            className="relative cursor-pointer transform transition-all duration-300 hover:scale-110 hover:rotate-3"
            onClick={handleCookieClick}
            style={{
              filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))',
              transform: 'rotateX(-10deg) rotateY(5deg) scale(3.0)'
            }}
          >
            {/* 포춘 쿠키 이미지 - 매우 크게 */}
            <div className="relative w-[600px] h-[450px]">
              <img
                src={imageCookie}
                alt="Fortune Cookie"
                className="w-full h-full"
                style={{
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))',
                  objectFit: 'contain'
                }}
              />
              
              {/* 마법 같은 빛 효과 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse" 
                   style={{ clipPath: 'polygon(40% 0%, 60% 0%, 80% 100%, 20% 100%)' }} />
            </div>
            
            {/* 클릭 안내 */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
              <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg animate-bounce">
                <span className="text-purple-800 font-bold text-lg">✨ 클릭하여 운명을 확인하세요 ✨</span>
              </div>
            </div>
          </div>
        )}

        {/* 포춘쿠키 - 갈라지는 상태 */}
        {stage === 'cracking' && (
          <div className="relative" style={{ transform: 'scale(4.0)' }}>
            <div className="w-[600px] h-[450px]">
              <img
                src={imageCookieAlt}
                alt="Cracking Fortune Cookie"
                className="w-full h-full"
                style={{
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))',
                  objectFit: 'contain',
                  animation: 'crackShake 0.8s ease-out'
                }}
              />
              
              {/* 갈라짐 효과 선 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500 rounded-full animate-pulse"
                     style={{
                       filter: 'drop-shadow(0 0 10px #8B5CF6)',
                       animation: 'crackGlow 0.8s ease-out'
                     }} />
              </div>
            </div>
            
            {/* 갈라짐 충격파 효과 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-purple-500 rounded-full animate-ping" 
                   style={{ animationDuration: '0.5s' }} />
              <div className="absolute w-8 h-8 bg-purple-400 rounded-full animate-ping" 
                   style={{ animationDuration: '0.7s', animationDelay: '0.2s' }} />
              <div className="absolute w-12 h-12 bg-purple-300 rounded-full animate-ping" 
                   style={{ animationDuration: '0.9s', animationDelay: '0.4s' }} />
            </div>
          </div>
        )}

        {/* 포춘쿠키 - 완전히 부서진 상태 (쿠키 이미지 제거) */}
        {stage === 'broken' && (
          <div className="relative">
            {/* 쿠키 이미지 제거 - 텍스트만 표시 */}
          </div>
        )}

        {/* 종이 위에 텍스트 표시 */}
        {stage === 'paper' && (

          <div className="relative flex items-start justify-start" style={{ width: '100%', height: '100%' }}>
            {/* 종이 배경 - 격자 무늬 없이 */}
            <div 
              className="absolute bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-inner border border-gray-200"
              style={{
                width: '700px',
                height: '500px',
                left: '0', // 왼쪽 정렬
                top: '50%',
                marginLeft: '0',
                marginTop: '-250px',
                animation: 'paperUnfold 1s ease-out'
              }}
            />

            {/* 메시지 텍스트 - 매우 크게 */}
            {showMessage && (
              <div 
                className="absolute flex items-center justify-center text-center p-8"
                style={{
                  width: '1700px',
                  height: '480px',
                  left: '50%', 
                  top: '50%',
                  marginLeft: '0',
                  marginTop: '-340px',
                  animation: 'messageAppear 1s ease-out'
                }}
              >
                <div className="space-y-8">
                  {/* 장식적 요소 */}
                  <div className="flex justify-center space-x-4 mb-8">
                    <div className="w-16 h-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                    <div className="text-amber-500 text-5xl">✨</div>
                    <div className="w-16 h-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                  </div>
                  {/* 메인 메시지 - 매우 크게 */}
                  <p 
                    className="text-gray-900 leading-relaxed font-bold"
                    style={{
                      fontFamily: "'Noto Serif KR', serif",
                      textShadow: '0 3px 6px rgba(0,0,0,0.3)',
                      animation: 'textGlow 2s ease-in-out infinite alternate',
                      color: '#1F2937',
                      fontSize: '3rem',
                      lineHeight: '1.2'
                    }}
                  >
                    {answer}
                  </p>
                  {/* 하단 장식 */}
                  <div className="flex justify-center space-x-4 mt-10">
                    <div className="w-20 h-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                    <div className="text-amber-500 text-3xl">🌟</div>
                    <div className="w-20 h-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                  </div>
                </div>
              </div>
            )}

            {/* 종이 위의 마법적 효과 */}
            {showMessage && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-amber-300 rounded-full animate-pulse"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${1 + Math.random()}s`,
                      filter: 'blur(1px)',
                      opacity: 0.6
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}


        {/* 숨겨진 오디오 (선택적) */}
        <audio
          ref={audioRef}
          preload="auto"
          style={{ display: 'none' }}
        >
          <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEgBjqZ1/LKdSgHKHTN7+CWSA0PVqzn77BdGAg+ltryxn0vBSl+zPLaizsIGGS57OihUQ0LUKjh8bllHgg2jdnywn4xBSJ4x/DNfjAIJXbM7eSaTA4PU6nf8btuGwU7k9nyyH4vBSZ9y/LajDwIF2W89OihUg0LTafh8btoBjiN2fHCfiUFI3zL7+OZSw0PVK3e8b5xHQU7k9n0yH0vBSJ9y/LajT0IF2W89OmhUQ0LTafh8bxpBzaO2fTCficFJYLH7eSaSQ0PVq3e8bRdGgU9lNn0xn0uBSJ/y++zZ43M=" type="audio/wav" />
        </audio>
      </div>

      {/* CSS 애니메이션 정의 */}
      <style jsx>{`
        @keyframes crackShake {
          0%, 100% { transform: scale(1.1) rotate(0deg); }
          25% { transform: scale(1.15) rotate(-2deg); }
          75% { transform: scale(1.15) rotate(2deg); }
        }
        
        @keyframes crackGlow {
          0% { opacity: 0; }
          50% { opacity: 1; filter: drop-shadow(0 0 20px #8B5CF6); }
          100% { opacity: 0.8; }
        }
        
        @keyframes fallDown {
          from { transform: scale(0.8) rotate(5deg); opacity: 0.7; }
          to { transform: scale(0.6) rotate(10deg) translateY(20px); opacity: 0.3; }
        }
        
        @keyframes paperUnfold {
          from { 
            transform: scale(0.1) rotate(180deg); 
            opacity: 0; 
          }
          50% { 
            transform: scale(0.8) rotate(10deg); 
            opacity: 0.5; 
          }
          to { 
            transform: scale(1) rotate(0deg); 
            opacity: 1; 
          }
        }
        
        @keyframes messageAppear {
          from { 
            opacity: 0; 
            transform: translateY(20px) scale(0.9); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        @keyframes textGlow {
          from { text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
          to { text-shadow: 0 1px 4px rgba(245, 11, 46, 0.3); }
        }
      `}</style>
    </div>
  );
};

export default CinematicFortuneCookie;
