
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Button from '../../components/base/Button';
import Card from '../../components/base/Card';
import { useAuth } from '../../hooks/useAuth';

export default function IntroPage() {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { isLoggedIn, login, logout } = useAuth();
  
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    setShowMenu(false);
    await login('kakao');
  };

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
  };

  const handleFeedback = () => {
    setShowMenu(false);
    // 피드백 페이지로 이동하거나 모달 표시
    alert('피드백 기능은 곧 추가될 예정입니다!');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 via-orange-200 to-pink-200 relative overflow-hidden">
      {/* 햄버거 메뉴 버튼 */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105"
        >
          <i className={`${showMenu ? 'ri-close-line' : 'ri-menu-line'} text-amber-600 text-2xl md:text-3xl`}></i>
        </button>
      </div>

      {/* 오버레이 메뉴 */}
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowMenu(false)}
          ></div>
          <div className="fixed top-24 md:top-28 right-4 bg-white rounded-2xl shadow-2xl z-50 p-8 md:p-10 min-w-72 md:min-w-80 animate-fade-in">
            <div className="space-y-4 md:space-y-6">
              {!isLoggedIn ? (
                <button
                  onClick={handleLogin}
                  className="w-full flex items-center space-x-4 md:space-x-5 px-6 py-4 md:py-6 text-left hover:bg-amber-50 rounded-lg transition-colors duration-300 group"
                >
                  <i className="ri-login-circle-line text-amber-600 group-hover:text-amber-700 text-2xl md:text-3xl"></i>
                  <span className="font-medium text-gray-700 group-hover:text-gray-800 text-lg md:text-xl lg:text-2xl">로그인</span>
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-4 md:space-x-5 px-6 py-4 md:py-6 text-left hover:bg-red-50 rounded-lg transition-colors duration-300 group"
                >
                  <i className="ri-logout-circle-line text-red-600 group-hover:text-red-700 text-2xl md:text-3xl"></i>
                  <span className="font-medium text-gray-700 group-hover:text-gray-800 text-lg md:text-xl lg:text-2xl">로그아웃</span>
                </button>
              )}
              
              <button
                onClick={() => {
                  setShowMenu(false);
                  navigate('/past-concerns');
                }}
                className="w-full flex items-center space-x-4 md:space-x-5 px-6 py-4 md:py-6 text-left hover:bg-blue-50 rounded-lg transition-colors duration-300 group"
              >
                <i className="ri-history-line text-blue-600 group-hover:text-blue-700 text-2xl md:text-3xl"></i>
                <span className="font-medium text-gray-700 group-hover:text-gray-800 text-lg md:text-xl lg:text-2xl">이전 운세 기록 보기</span>
              </button>
              
              <button
                onClick={handleFeedback}
                className="w-full flex items-center space-x-4 md:space-x-5 px-6 py-4 md:py-6 text-left hover:bg-green-50 rounded-lg transition-colors duration-300 group"
              >
                <i className="ri-feedback-line text-green-600 group-hover:text-green-700 text-2xl md:text-3xl"></i>
                <span className="font-medium text-gray-700 group-hover:text-gray-800 text-lg md:text-xl lg:text-2xl">피드백</span>
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-amber-200 bg-opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-orange-200 bg-opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 bg-opacity-10 rounded-full blur-3xl"></div>
      </div>
      
      {/* 떠다니는 아이콘들 */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            <i className={`${['ri-star-fill', 'ri-heart-fill', 'ri-sparkle-fill'][Math.floor(Math.random() * 3)]} text-amber-300 text-opacity-30 text-2xl`}></i>
          </div>
        ))}
      </div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className={`text-center transform transition-all duration-1000 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {/* 메인 로고/제목 */}
          <div className="mb-12">
            <h1 
              className="text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem] font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 bg-clip-text text-transparent mb-8 pb-20 pt-4 leading-relaxed"
              style={{ fontFamily: "Pacifico, serif" }}
            >
              fortune cookie
            </h1>
            <div className="flex justify-center mb-8">
              <div className="text-[8rem] md:text-[10rem] lg:text-[12rem] xl:text-[14rem] animate-bounce">🥠</div>
            </div>
          </div>
          
          {/* 소개 카드 */}
          <Card className="max-w-5xl mx-auto p-10 md:p-12 lg:p-16 mb-12" glow>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-8">
              당신만의 맞춤 운세를 확인해보세요
            </h2>

            
            {/* 특징 리스트 */}
            <div className="space-y-6 mb-10">
              <div className="flex items-center space-x-4 text-amber-600">
                <i className="ri-user-star-line w-8 h-8 md:w-10 md:h-10 flex items-center justify-center"></i>
                <span className="text-xl md:text-2xl lg:text-3xl font-medium">역할별 맞춤 상담</span>
              </div>
              <div className="flex items-center space-x-4 text-orange-600">
                <i className="ri-magic-line w-8 h-8 md:w-10 md:h-10 flex items-center justify-center"></i>
                <span className="text-xl md:text-2xl lg:text-3xl font-medium">AI 포춘쿠키 생성</span>
              </div>
              <div className="flex items-center space-x-4 text-pink-600">
                <i className="ri-share-line w-8 h-8 md:w-10 md:h-10 flex items-center justify-center"></i>
                <span className="text-xl md:text-2xl lg:text-3xl font-medium">결과 공유 가능</span>
              </div>
            </div>
          </Card>
          
          {/* 시작 버튼 */}
          <div className="space-y-6">
            <Button 
              size="lg"
              onClick={() => {
                if (isLoggedIn) {
                  navigate('/role-select');
                } else {
                  alert('로그인 후 이용해 주세요');
                }
              }}
              className="px-12 py-6 md:px-16 md:py-8 text-xl md:text-2xl lg:text-3xl shadow-2xl hover:shadow-amber-300/50"
            >
              <span className="flex items-center space-x-3">
                <span>운세보기 시작하기</span>
                <i className="ri-arrow-right-line text-2xl md:text-3xl"></i>
              </span>
            </Button>
            
            <button
              onClick={() => navigate('/past-concerns')}
              className="block mx-auto text-amber-600 hover:text-amber-700 text-lg md:text-xl lg:text-2xl font-medium transition-colors duration-300"
            >
              이전 운세 기록 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
