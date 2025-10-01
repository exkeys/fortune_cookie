
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import { useApi } from '../../hooks/useApi';
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
  const { selectedRole, concern } = (location.state as LocationState) || {};
  const { getAiBothAdvices, saveConcern } = useApi();
  
  const [isOpening, setIsOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [showFortune, setShowFortune] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
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

  // 페이지 로드 시 AI 답변 가져오기
  useEffect(() => {
    (async () => {
      if (selectedRole && concern) {
        try {
          const { data } = await getAiBothAdvices(selectedRole.name, concern);
          const shortAdvice = data?.shortAdvice || data?.message || "운세를 받지 못했습니다. 다시 시도해 주세요.";
          const longAdviceText = data?.longAdvice || "긴 조언을 받지 못했습니다.";
          setFortuneMessage(shortAdvice);
          setLongAdvice(longAdviceText);
        } catch (error) {
          setFortuneMessage("운세를 받지 못했습니다. 다시 시도해 주세요.");
          setLongAdvice("긴 조언을 받지 못했습니다.");
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 to-orange-200">
      <Header />
      
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
    </div>
  );
}
