
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/base/Button';
import Card from '../../components/base/Card';
import Header from '../../components/feature/Header';
import FortuneCookie from '../../components/feature/FortuneCookie';

interface LocationState {
  selectedRole?: {
    id: string;
    name: string;
    icon: string;
    description: string;
    color: string;
  };
  concern?: string;
}

export default function FortuneCookiePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedRole, concern } = (location.state as LocationState) || {};
  
  const [isOpening, setIsOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [showFortune, setShowFortune] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // Mock AI 응답 - 실제로는 API 호출
  const fortuneMessage = "새로운 도전은 언제나 두려움을 동반하지만, 그 두려움 너머에 성장이 있습니다. 당신의 역량을 믿고 한 걸음씩 나아가세요. 완벽하지 않아도 괜찮습니다. 시작하는 용기가 가장 중요한 첫 걸음이니까요. 🌟";
  
  const handleCookieClick = () => {
    if (!isOpened) {
      setIsOpening(true);
      setTimeout(() => {
        setIsOpening(false);
        setIsOpened(true);
        setTimeout(() => {
          setShowFortune(true);
        }, 500);
      }, 2000);
    }
  };
  
  const handleShare = async (platform: string) => {
    setIsSharing(true);
    
    const shareText = `🥠 오늘의 운세쿠키 결과\n\n"${fortuneMessage}"\n\n운세쿠키에서 받은 조언이에요!`;
    const shareUrl = window.location.href;
    
    try {
      if (platform === 'copy') {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        alert('클립보드에 복사되었습니다!');
      } else if (platform === 'kakao') {
        // 카카오톡 공유 (실제 구현시 카카오 SDK 필요)
        const kakaoUrl = `https://share.kakaocdn.net/talk/friends/picker/link?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(kakaoUrl, '_blank');
      } else if (platform === 'instagram') {
        // 인스타그램 공유 (모바일에서는 앱으로, 데스크톱에서는 웹으로)
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          const instagramUrl = `instagram://story-camera`;
          window.location.href = instagramUrl;
        } else {
          const instagramWebUrl = `https://www.instagram.com/`;
          window.open(instagramWebUrl, '_blank');
          // 클립보드에 텍스트 복사
          await navigator.clipboard.writeText(shareText);
          alert('인스타그램이 열렸습니다! 텍스트가 클립보드에 복사되었어요.');
        }
      } else if (platform === 'twitter') {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank');
      } else if (platform === 'facebook') {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(facebookUrl, '_blank');
      }
    } catch (error) {
      console.error('공유 실패:', error);
    }
    
    setTimeout(() => setIsSharing(false), 1000);
  };
  
  const handleNewFortune = () => {
    navigate('/role-select');
  };
  
  const saveToHistory = () => {
    const historyItem = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      role: selectedRole,
      concern,
      fortune: fortuneMessage
    };
    
    const existingHistory = JSON.parse(localStorage.getItem('fortuneHistory') || '[]');
    const updatedHistory = [historyItem, ...existingHistory].slice(0, 50); // 최대 50개 저장
    localStorage.setItem('fortuneHistory', JSON.stringify(updatedHistory));
  };
  
  useEffect(() => {
    if (showFortune) {
      saveToHistory();
    }
  }, [showFortune]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 역할 정보 */}
        {selectedRole && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${selectedRole.color} flex items-center justify-center text-white shadow-lg`}>
                <i className={selectedRole.icon}></i>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">{selectedRole.name} 상담</h3>
                <p className="text-sm text-gray-600 truncate">{concern}</p>
              </div>
            </div>
          </Card>
        )}
        
        {/* 포춘쿠키 영역 */}
        <div className="text-center mb-8">
          {!showFortune ? (
            <Card className="p-12 bg-gradient-to-br from-white to-amber-50">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {!isOpened ? '당신의 운세쿠키가 준비되었습니다!' : '운세를 확인하는 중...'}
              </h2>
              
              <div className="mb-8">
                <FortuneCookie 
                  isOpening={isOpening}
                  isOpened={isOpened}
                  onCookieClick={handleCookieClick}
                />
              </div>
              
              {isOpening && (
                <div className="flex justify-center items-center space-x-2 text-amber-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-600 border-t-transparent"></div>
                  <span>마법의 조언을 준비하고 있어요...</span>
                </div>
              )}
            </Card>
          ) : (
            /* 운세 결과 */
            <Card className="p-8 bg-gradient-to-br from-white to-amber-50 shadow-xl animate-fade-in">
              <div className="mb-6">
                <div className="text-4xl mb-4">🥠</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">당신의 운세</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-orange-400 mx-auto rounded-full"></div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-inner mb-6">
                <p className="text-lg leading-relaxed text-gray-700 font-medium">
                  "{fortuneMessage}"
                </p>
              </div>
              
              <div className="text-sm text-gray-500 mb-6">
                {new Date().toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </div>
              
              {/* 공유 버튼들 */}
              <div className="space-y-4">
                <div className="flex justify-center space-x-3 flex-wrap gap-2">
                  <button
                    onClick={() => handleShare('kakao')}
                    disabled={isSharing}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-full hover:bg-yellow-500 transition-colors duration-300 shadow-md text-sm font-medium"
                  >
                    <i className="ri-kakao-talk-fill"></i>
                    <span>카카오톡</span>
                  </button>
                  
                  <button
                    onClick={() => handleShare('instagram')}
                    disabled={isSharing}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-colors duration-300 shadow-md text-sm font-medium"
                  >
                    <i className="ri-instagram-fill"></i>
                    <span>인스타그램</span>
                  </button>
                  
                  <button
                    onClick={() => handleShare('twitter')}
                    disabled={isSharing}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-400 text-white rounded-full hover:bg-blue-5
00 transition-colors duration-300 shadow-md text-sm font-medium"
                  >
                    <i className="ri-twitter-fill"></i>
                    <span>트위터</span>
                  </button>
                  
                  <button
                    onClick={() => handleShare('facebook')}
                    disabled={isSharing}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-300 shadow-md text-sm font-medium"
                  >
                    <i className="ri-facebook-fill"></i>
                    <span>페이스북</span>
                  </button>
                  
                  <button
                    onClick={() => handleShare('copy')}
                    disabled={isSharing}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors duration-300 shadow-md text-sm font-medium"
                  >
                    <i className="ri-clipboard-line"></i>
                    <span>복사</span>
                  </button>
                </div>
                <div className="flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/past-concerns')}
                  >
                    이전 기록 보기
                  </Button>
                  
                  <Button
                    onClick={handleNewFortune}
                  >
                    새로운 운세 보기
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
