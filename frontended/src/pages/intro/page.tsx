
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Button from '../../components/base/Button';
import Card from '../../components/base/Card';

export default function IntroPage() {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowMenu(false);
    // 실제로는 로그인 로직 구현
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowMenu(false);
    // 실제로는 로그아웃 로직 구현
  };

  const handleFeedback = () => {
    setShowMenu(false);
    // 피드백 페이지로 이동하거나 모달 표시
    alert('피드백 기능은 곧 추가될 예정입니다!');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 relative overflow-hidden">
      {/* 햄버거 메뉴 버튼 */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105"
        >
          <i className={`${showMenu ? 'ri-close-line' : 'ri-menu-line'} text-amber-600 text-xl`}></i>
        </button>
      </div>

      {/* 오버레이 메뉴 */}
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowMenu(false)}
          ></div>
          <div className="fixed top-20 right-4 bg-white rounded-2xl shadow-2xl z-50 p-6 min-w-48 animate-fade-in">
            <div className="space-y-3">
              {!isLoggedIn ? (
                <button
                  onClick={handleLogin}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-amber-50 rounded-lg transition-colors duration-300 group"
                >
                  <i className="ri-login-circle-line text-amber-600 group-hover:text-amber-700"></i>
                  <span className="font-medium text-gray-700 group-hover:text-gray-800">로그인</span>
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-red-50 rounded-lg transition-colors duration-300 group"
                >
                  <i className="ri-logout-circle-line text-red-600 group-hover:text-red-700"></i>
                  <span className="font-medium text-gray-700 group-hover:text-gray-800">로그아웃</span>
                </button>
              )}
              
              <button
                onClick={() => {
                  setShowMenu(false);
                  navigate('/past-concerns');
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-blue-50 rounded-lg transition-colors duration-300 group"
              >
                <i className="ri-history-line text-blue-600 group-hover:text-blue-700"></i>
                <span className="font-medium text-gray-700 group-hover:text-gray-800">이전 운세 기록 보기</span>
              </button>
              
              <button
                onClick={handleFeedback}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-green-50 rounded-lg transition-colors duration-300 group"
              >
                <i className="ri-feedback-line text-green-600 group-hover:text-green-700"></i>
                <span className="font-medium text-gray-700 group-hover:text-gray-800">피드백</span>
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
          <div className="mb-8">
            <h1 
              className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 bg-clip-text text-transparent mb-4"
              style={{ fontFamily: "Pacifico, serif" }}
            >
              운세쿠키
            </h1>
            <div className="flex justify-center mb-6">
              <div className="text-8xl animate-bounce">🥠</div>
            </div>
          </div>
          
          {/* 소개 카드 */}
          <Card className="max-w-md mx-auto p-8 mb-8" glow>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              당신만의 맞춤 운세를 확인해보세요
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              AI가 분석하는 개인 맞춤형 포춘쿠키로<br />
              오늘의 고민과 궁금증을 해결해보세요
            </p>
            
            {/* 특징 리스트 */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-center space-x-2 text-amber-600">
                <i className="ri-user-star-line w-5 h-5 flex items-center justify-center"></i>
                <span className="text-sm font-medium">역할별 맞춤 상담</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-orange-600">
                <i className="ri-magic-line w-5 h-5 flex items-center justify-center"></i>
                <span className="text-sm font-medium">AI 포춘쿠키 생성</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-pink-600">
                <i className="ri-share-line w-5 h-5 flex items-center justify-center"></i>
                <span className="text-sm font-medium">결과 공유 가능</span>
              </div>
            </div>
          </Card>
          
          {/* 시작 버튼 */}
          <div className="space-y-4">
            <Button 
              size="lg"
              onClick={() => navigate('/role-select')}
              className="shadow-2xl hover:shadow-amber-300/50"
            >
              <span className="flex items-center space-x-2">
                <span>운세보기 시작하기</span>
                <i className="ri-arrow-right-line"></i>
              </span>
            </Button>
            
            <button
              onClick={() => navigate('/past-concerns')}
              className="block mx-auto text-amber-600 hover:text-amber-700 text-sm font-medium transition-colors duration-300"
            >
              이전 운세 기록 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
