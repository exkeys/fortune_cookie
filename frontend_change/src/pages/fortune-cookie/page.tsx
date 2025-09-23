
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/base/Button';
import Card from '../../components/base/Card';
import Header from '../../components/feature/Header';
import FortuneCookie from '../../components/feature/FortuneCookie';
import { useApi } from '../../hooks/useApi';
import { supabase } from '../../supabaseClient';

// 카카오 SDK 타입 선언
declare global {
  interface Window {
    Kakao: any;
  }
}

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
  const { getAiAnswer, saveConcern } = useApi();
  
  const [isOpening, setIsOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [showFortune, setShowFortune] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // AI 응답 받기 (실제 백엔드 연결)
  const [fortuneMessage, setFortuneMessage] = useState("");
  const [isLoadingFortune, setIsLoadingFortune] = useState(true);
  
  // 카카오 SDK 초기화
  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init('2e6b2a19fc93c2c6205051ecbdac861f'); // JavaScript 키
    }
  }, []);

  // 페이지 로드 시 AI 답변 가져오기
  useEffect(() => {
    (async () => {
      if (selectedRole && concern) {
        try {
          const { data } = await getAiAnswer(selectedRole.name, concern);
          const aiAnswer = data?.answer || data?.message || "운세를 받지 못했습니다. 다시 시도해 주세요.";
          setFortuneMessage(aiAnswer);
          
          // 자동 저장 제거 - 사용자가 "저장하기" 버튼을 클릭했을 때만 저장
        } catch (error) {
          setFortuneMessage("운세를 받지 못했습니다. 다시 시도해 주세요.");
        }
      }
      setIsLoadingFortune(false);
    })();
  }, [selectedRole, concern]);
  
  const handleCookieClick = () => {
    if (!isOpened && !isLoadingFortune) {
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
        // 카카오톡 공유
        if (window.Kakao && window.Kakao.Share) {
          window.Kakao.Share.sendDefault({
            objectType: 'text',
            text: shareText,
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
            buttons: [
              {
                title: '운세 보러가기',
                link: {
                  mobileWebUrl: shareUrl,
                  webUrl: shareUrl,
                },
              },
            ],
          });
        } else {
          // SDK가 로드되지 않았을 때 대안
          await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
          alert('카카오톡 공유 기능을 사용할 수 없어 클립보드에 복사되었습니다!');
        }
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
  
  const handleSaveAndViewHistory = async () => {
    try {
      // Supabase에 저장
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      
      if (uid && selectedRole && concern && fortuneMessage) {
        const result = await saveConcern(selectedRole.name, concern, fortuneMessage, uid);
        if (result.error) {
          console.error('저장 실패:', result.error);
          alert(`저장에 실패했습니다: ${result.error}`);
          return; // 저장 실패 시 이동하지 않음
        }
      } else {
        alert('저장할 데이터가 부족합니다. 로그인 상태와 운세 내용을 확인해주세요.');
        return;
      }
      
      // localStorage에도 저장 (백업용)
      saveToHistory();
      
      // 과거 운세 기록 페이지로 이동
      navigate('/past-concerns');
    } catch (error) {
      console.error('저장 중 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleFinish = () => {
    // 저장하지 않고 intro 페이지로 이동
    navigate('/intro');
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
    <div className="min-h-screen bg-gradient-to-br from-amber-200 to-orange-200">
      <Header />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* 역할 정보 */}
        {selectedRole && (
          <Card className="p-6 md:p-8 mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 max-w-4xl mx-auto">
            <div className="flex items-center space-x-4 md:space-x-5">
              <div className={`w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-r ${selectedRole.color} flex items-center justify-center text-white shadow-lg`}>
                <i className={`${selectedRole.icon} text-xl md:text-2xl lg:text-3xl`}></i>
              </div>
              <div className="flex-1">
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{selectedRole.name} 상담</h3>
                <p className="text-sm md:text-base lg:text-lg text-gray-600 mt-2">{concern}</p>
              </div>
            </div>
          </Card>
        )}
        
        {/* 포춘쿠키 영역 */}
        <div className="text-center mb-10">
          {!showFortune ? (
            <Card className="p-16 md:p-20 lg:p-24 xl:p-28 bg-gradient-to-br from-white to-amber-50 max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-800 mb-12">
                {isLoadingFortune ? 'AI가 운세를 생성하고 있어요...' : !isOpened ? '당신의 운세쿠키가 준비되었습니다!' : '운세를 확인하는 중...'}
              </h2>
              
              <div className="mb-16 transform scale-150 md:scale-175 lg:scale-200 xl:scale-225">
                <FortuneCookie 
                  isOpening={isOpening}
                  isOpened={isOpened}
                  onCookieClick={handleCookieClick}
                />
              </div>
              
              {isOpening && (
                <div className="flex justify-center items-center space-x-3 text-amber-600">
                  <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-2 border-amber-600 border-t-transparent"></div>
                  <span className="text-lg md:text-xl lg:text-2xl">마법의 조언을 준비하고 있어요...</span>
                </div>
              )}
            </Card>
          ) : (
            /* 운세 결과 */
            <Card className="p-10 md:p-12 lg:p-14 bg-gradient-to-br from-white to-amber-50 shadow-xl animate-fade-in max-w-4xl mx-auto">
              <div className="mb-6">
                <div className="text-5xl md:text-6xl lg:text-7xl mb-5">🥠</div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-3">당신의 운세</h2>
                <div className="w-20 h-1.5 md:w-28 md:h-2 bg-gradient-to-r from-amber-400 to-orange-400 mx-auto rounded-full"></div>
              </div>
              
              <div className="bg-white p-6 md:p-8 lg:p-10 rounded-xl shadow-inner mb-6">
                <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-700 font-medium">
                  "{fortuneMessage}"
                </p>
              </div>
              
              <div className="text-sm md:text-base lg:text-lg text-gray-500 mb-6">
                {new Date().toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </div>
              
              {/* 공유 버튼들 */}
              <div className="space-y-5">
                <div className="flex justify-center space-x-2 flex-wrap gap-2">
                  <button
                    onClick={() => handleShare('kakao')}
                    disabled={isSharing}
                    className="flex items-center space-x-2 px-4 py-2 md:px-5 md:py-3 bg-yellow-400 text-yellow-900 rounded-full hover:bg-yellow-500 transition-colors duration-300 shadow-md text-xs md:text-sm lg:text-base font-medium"
                  >
                    <i className="ri-kakao-talk-fill text-sm md:text-base"></i>
                    <span>카카오톡</span>
                  </button>
                  
                  <button
                    onClick={() => handleShare('instagram')}
                    disabled={isSharing}
                    className="flex items-center space-x-2 px-4 py-2 md:px-5 md:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-colors duration-300 shadow-md text-xs md:text-sm lg:text-base font-medium"
                  >
                    <i className="ri-instagram-fill text-sm md:text-base"></i>
                    <span>인스타그램</span>
                  </button>
                  
                  <button
                    onClick={() => handleShare('twitter')}
                    disabled={isSharing}
                    className="flex items-center space-x-2 px-4 py-2 md:px-5 md:py-3 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition-colors duration-300 shadow-md text-xs md:text-sm lg:text-base font-medium"
                  >
                    <i className="ri-twitter-fill text-sm md:text-base"></i>
                    <span>트위터</span>
                  </button>
                  
                  <button
                    onClick={() => handleShare('facebook')}
                    disabled={isSharing}
                    className="flex items-center space-x-2 px-4 py-2 md:px-5 md:py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-300 shadow-md text-xs md:text-sm lg:text-base font-medium"
                  >
                    <i className="ri-facebook-fill text-sm md:text-base"></i>
                    <span>페이스북</span>
                  </button>
                  
                  <button
                    onClick={() => handleShare('copy')}
                    disabled={isSharing}
                    className="flex items-center space-x-2 px-5 py-3 md:px-6 md:py-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors duration-300 shadow-md text-sm md:text-base lg:text-lg font-medium"
                  >
                    <i className="ri-clipboard-line text-base md:text-lg"></i>
                    <span>복사</span>
                  </button>
                </div>
                <div className="flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleSaveAndViewHistory}
                    className="text-base md:text-lg lg:text-xl px-6 py-3 md:px-8 md:py-4"
                  >
                    저장하기
                  </Button>
                  
                  <Button
                    size="lg"
                    onClick={handleFinish}
                    className="text-base md:text-lg lg:text-xl px-6 py-3 md:px-8 md:py-4"
                  >
                    마침
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
