
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabaseClient';
import { clearFormData } from '../../utils/formPersistence';
import RoleInfoDisplay from './components/RoleInfoDisplay';
import CookieAnimationArea from './components/CookieAnimationArea';
import FortuneResultDisplay from './components/FortuneResultDisplay';

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
  const { user } = useAuth();
  const { selectedRole, concern } = (location.state as LocationState) || {};
  const { getAiBothAdvices, saveConcern } = useApi();
  
  const [isOpening, setIsOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [showFortune, setShowFortune] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  
  // AI 응답 받기 (실제 백엔드 연결)
  const [fortuneMessage, setFortuneMessage] = useState("");
  const [longAdvice, setLongAdvice] = useState("");
  const [isLoadingFortune, setIsLoadingFortune] = useState(true);
  
  // 카카오 SDK 초기화
  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init('2e6b2a19fc93c2c6205051ecbdac861f'); // JavaScript 키
    }
  }, []);

  // 페이지 로드 시 랜덤 운세 즉시 가져오기
  useEffect(() => {
    (async () => {
      if (selectedRole && concern) {
        try {
          // AI 백엔드 호출 부분 주석처리 - JSON 파일로 대체
          // const { data } = await getAiBothAdvices(selectedRole.name, concern);
          // const shortAdvice = data?.shortAdvice || data?.message || "운세를 받지 못했습니다. 다시 시도해 주세요.";
          // const longAdviceText = data?.longAdvice || "긴 조언을 받지 못했습니다.";
          // setFortuneMessage(shortAdvice);
          // setLongAdvice(longAdviceText);
          
          // JSON 파일에서 랜덤 조언 즉시 가져오기 (빠른 로딩)
          const response = await fetch('/data/short-advices.json');
          const advicesData = await response.json();
          const randomAdvice = advicesData.advices[Math.floor(Math.random() * advicesData.advices.length)];
          
          // JSON 필드명이 "text"로 되어 있음
          setFortuneMessage(randomAdvice.text);
          
          // 랜덤 운세는 즉시 로딩 완료 처리
          setIsLoadingFortune(false);
          
          // 긴 조언은 백그라운드에서 별도로 로딩 (시간이 걸려도 OK)
          (async () => {
            try {
              const { data } = await getAiBothAdvices(selectedRole.name, concern);
              const longAdviceText = data?.longAdvice || "긴 조언을 받지 못했습니다.";
              setLongAdvice(longAdviceText);
            } catch (error) {
              console.error('긴 조언 로딩 실패:', error);
              setLongAdvice("긴 조언을 받지 못했습니다.");
            }
          })();
        } catch (error) {
          setFortuneMessage("운세를 받지 못했습니다. 다시 시도해 주세요.");
          setLongAdvice("긴 조언을 받지 못했습니다.");
          setIsLoadingFortune(false);
        }
      } else {
        setIsLoadingFortune(false);
      }
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
        }, 500); // 운세 표시 시간 늘림 (300ms → 600ms)
      }, 3000); // 쿠키 열리는 시간 늘림 (800ms → 1.5초)
    }
  };
  
  const handleShare = async (platform: string) => {
    setIsSharing(true);
    
    const shareText = `🥠 오늘의 포춘쿠키!

"${fortuneMessage}"

✨ 내 오늘 운세 한 줄 요약이에요.
#오늘의운세 #포춘쿠키 #AI운세 #하루한줄 #자기계발

👇 지금 너의 쿠키도 열어봐`;
    const shareUrl = window.location.href;
    
    try {
      if (platform === 'copy') {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        setShowCopyModal(true);
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
          setShowCopyModal(true);
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
        const result = await saveConcern(selectedRole.name, concern, fortuneMessage, longAdvice, uid);
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
      
      // 폼 데이터 삭제 (완료 시)
      clearFormData();
      
      // 과거 운세 기록 페이지로 이동
      navigate('/past-concerns');
    } catch (error) {
      console.error('저장 중 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleFinish = () => {
    // 폼 데이터 삭제 (완료 시)
    clearFormData();
    
    // 저장하지 않고 intro 페이지로 이동
    navigate('/');
  };
  
  const saveToHistory = () => {
    const historyItem = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      role: selectedRole,
      concern,
      fortune: fortuneMessage,
      aiFeed: longAdvice
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

  // 운세가 표시될 때 daily_usage_log에 사용 기록 추가
  useEffect(() => {
    if (showFortune && user?.id) {
      const recordUsageLog = async () => {
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
      };

      recordUsageLog();
    }
  }, [showFortune, user?.id]);

  // 기존 history 조작 방식 제거 - 이제 Header 컴포넌트에서 시각적으로 비활성화
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 to-orange-200">
      <Header disableBackButton={true} disableHomeButton={true} />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {selectedRole && (
          <RoleInfoDisplay 
            selectedRole={selectedRole} 
            concern={concern} 
          />
        )}
        
        <div className="text-center mb-10">
          {!showFortune ? (
            <CookieAnimationArea
              isLoadingFortune={isLoadingFortune}
              isOpened={isOpened}
              isOpening={isOpening}
              onCookieClick={handleCookieClick}
            />
          ) : (
            /* 운세 결과 */
            <FortuneResultDisplay
              fortuneMessage={fortuneMessage}
              longAdvice={longAdvice}
              isSharing={isSharing}
              onShare={handleShare}
              onSaveAndViewHistory={handleSaveAndViewHistory}
              onFinish={handleFinish}
            />
          )}
        </div>
      </div>

      {/* Copy Modal */}
      {showCopyModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[998]"
            onClick={() => setShowCopyModal(false)}
          />
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 pointer-events-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">복사 완료!</h3>
                <p className="text-sm text-gray-600 mb-6">
                  클립보드에 복사되었습니다.<br />
                  다른 곳에 붙여넣기하여 운세를 공유해보세요.
                </p>
                <button
                  onClick={() => setShowCopyModal(false)}
                  className="w-full px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
