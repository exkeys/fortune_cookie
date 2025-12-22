
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Header from '../../components/feature/Header';
import CopySuccessModal from '../../components/base/CopySuccessModal';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { supabase } from '../../supabaseClient';
import { clearFormData } from '../../utils/formPersistence';
import { apiFetch } from '../../utils/apiClient';
import { logger } from '../../utils/logger';
import { KAKAO_JAVASCRIPT_KEY } from '../../constants';
import CookieAnimationArea from './components/CookieAnimationArea';
import FortuneResultDisplay from './components/FortuneResultDisplay';
import FortuneRandomResult from './components/FortuneRandomResult';

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
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const { selectedRole, concern, updateId } = (location.state as LocationState & { updateId?: string }) || {};
  const { saveConcern } = useApi();
  
  const [isOpening, setIsOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [showFortune, setShowFortune] = useState(false);
  const [showRandomResult, setShowRandomResult] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  
  // AI 응답 받기 (실제 백엔드 연결)
  const [fortuneMessage, setFortuneMessage] = useState("");
  const [longAdvice, setLongAdvice] = useState("");
  const [isLoadingFortune, setIsLoadingFortune] = useState(true);
  const [randomFortune, setRandomFortune] = useState("");
  
  // 카카오 SDK 초기화 (SDK 로드 확인 후 초기화)
  useEffect(() => {
    const initKakao = () => {
      if (window.Kakao) {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(KAKAO_JAVASCRIPT_KEY);
        }
      } else {
        // SDK가 아직 로드되지 않았으면 재시도
        setTimeout(initKakao, 100);
      }
    };
    
    initKakao();
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
          
          if (advicesData && advicesData.advices && advicesData.advices.length > 0) {
            const randomIndex = Math.floor(Math.random() * advicesData.advices.length);
            const randomAdvice = advicesData.advices[randomIndex];
            
            if (randomAdvice && randomAdvice.text && typeof randomAdvice.text === 'string') {
              setFortuneMessage(randomAdvice.text);
            } else {
              setFortuneMessage("운세를 받지 못했습니다.");
            }
          } else {
            setFortuneMessage("운세를 받지 못했습니다.");
          }
          
          // 랜덤 운세는 즉시 로딩 완료 처리
          setIsLoadingFortune(false);
          
          // 긴 조언은 FortuneResultDisplay에서 별도로 로딩
          setLongAdvice("");
        } catch {
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
          setShowRandomResult(true);
        }, 300); // 운세 표시 시간 단축 (500ms → 300ms)
      }, 1000); // 쿠키 열리는 시간 단축 (3000ms → 1500ms)
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
        if (window.Kakao && window.Kakao.isInitialized() && window.Kakao.Share) {
          try {
            window.Kakao.Share.sendDefault({
              objectType: 'text',
              text: shareText,
              link: {
                mobileWebUrl: shareUrl,
                webUrl: shareUrl,
              },
            });
          } catch (error) {
            console.error('카카오톡 공유 오류:', error);
            // 에러 발생 시 클립보드 복사로 대체
            await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
            setShowCopyModal(true);
          }
        } else {
          // SDK가 로드되지 않았거나 초기화되지 않았을 때 대안
          // SDK 재초기화 시도
          if (window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init(KAKAO_JAVASCRIPT_KEY);
            // 초기화 후 다시 시도
            setTimeout(() => {
              if (window.Kakao && window.Kakao.isInitialized() && window.Kakao.Share) {
                window.Kakao.Share.sendDefault({
                  objectType: 'text',
                  text: shareText,
                  link: {
                    mobileWebUrl: shareUrl,
                    webUrl: shareUrl,
                  },
                });
              } else {
                navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
                setShowCopyModal(true);
              }
            }, 300);
          } else {
            await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
            setShowCopyModal(true);
          }
        }
      } else if (platform === 'instagram') {
        // 인스타그램 공유 (모바일에서는 앱으로, 데스크톱에서는 웹으로)
        if (isMobile) {
          const instagramUrl = `instagram://story-camera`;
          window.location.href = instagramUrl;
        } else {
          const instagramWebUrl = `https://www.instagram.com/`;
          window.open(instagramWebUrl, '_blank');
        }
      } else if (platform === 'twitter') {
        const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank');
      } else if (platform === 'facebook') {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(facebookUrl, '_blank');
      }
    } catch {
      // 에러 무시
    }
    
    setTimeout(() => setIsSharing(false), 1000);
  };
  
  const handleSaveAndViewHistory = async (aiFeed?: string) => {
    try {
      // 사용자 ID 확인 (Supabase 세션 또는 localStorage)
      let uid = user?.id;
      
      // user.id가 없으면 Supabase 세션 확인
      if (!uid) {
        const { data: auth } = await supabase.auth.getUser();
        uid = auth?.user?.id;
      }
      
      // Supabase 세션도 없으면 localStorage 확인
      if (!uid) {
        const backendAuthData = localStorage.getItem('auth_backend_user');
        if (backendAuthData) {
          try {
            const backendUser = JSON.parse(backendAuthData);
            uid = backendUser.id;
          } catch {
            // 무시
          }
        }
      }
      
      // FortuneResultDisplay에서 전달된 aiFeed를 우선 사용, 없으면 longAdvice 사용
      const finalAiFeed = aiFeed || longAdvice || "";
      
      if (!uid) {
        alert('로그인이 필요합니다. 다시 로그인해주세요.');
        navigate('/');
        return;
      }
      
      if (!selectedRole || !concern || !fortuneMessage) {
        alert('저장할 데이터가 부족합니다. 운세 내용을 확인해주세요.');
        return;
      }
      
      // updateId가 있으면 업데이트 모드, 없으면 새 레코드 생성 모드
      const result = await saveConcern(selectedRole.name, concern, fortuneMessage, finalAiFeed, updateId);
      if (result.error) {
        alert(`저장에 실패했습니다: ${result.error}`);
        return; // 저장 실패 시 이동하지 않음
      }
      
      // 운세 저장 후 React Query 캐시 무효화 (즉시 반영)
      queryClient.invalidateQueries({ queryKey: ['concerns'] });
      
      // 운세 저장 후 사용자 정보를 DB에서 다시 불러와서 localStorage 업데이트
      // 저장할 때 사용한 uid를 그대로 사용 (DB에서 직접 가져옴)
      try {
        await supabase.auth.getSession();

        const response = await apiFetch(`/api/access-control/check-access`);
        if (response.ok) {
          const result = await response.json();
          if (result.user) {
            // DB에서 가져온 최신 정보로 localStorage 업데이트
            localStorage.setItem('auth_backend_user', JSON.stringify({
              id: result.user.id,
              email: result.user.email,
              nickname: result.user.nickname,
              status: result.user.status,
              school: result.user.school || null,
              is_admin: result.user.is_admin || false,
              created_at: result.user.created_at
            }));
          }
        }
      } catch (refreshError) {
        // 갱신 실패해도 저장은 완료되었으므로 계속 진행
      }
      
      // localStorage에도 저장 (백업용)
      saveToHistory(finalAiFeed);
      
      // 폼 데이터 삭제 (완료 시)
      clearFormData();
      
      // 저장 후 운세보관함으로 이동하는 경우 플래그 설정 (모바일 뒤로 가기 처리용)
      try {
        sessionStorage.setItem('pastConcernsFromFortune', 'true');
      } catch (error) {
        logger.warn('[FortuneCookiePage] sessionStorage 설정 실패', error);
      }
      
      // 과거 운세 기록 페이지로 이동 (replace: true로 히스토리 교체하여 포춘 쿠키 페이지 제거)
      navigate(`/past-concerns?refresh=${Date.now()}`, { replace: true });
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleFinish = () => {
    // 폼 데이터 삭제 (완료 시)
    clearFormData();
    
    // 저장하지 않고 intro 페이지로 이동
    navigate('/');
  };

  const handlePrevious = () => {
    // 이전 페이지 (고민 입력 페이지)로 이동
    navigate('/concern-input', {
      state: { selectedRole }
    });
  };

  const handleNext = (randomFortuneMessage: string) => {
    // 랜덤 운세 저장
    setRandomFortune(randomFortuneMessage);
    
    // 미리보기에서 최종 운세 페이지로 이동
    setShowRandomResult(false);
    setShowFortune(true);
    
    // 긴 조언은 FortuneResultDisplay에서 별도로 로딩
    setLongAdvice("");
  };
  
  const saveToHistory = (aiFeedOverride?: string) => {
    const historyItem = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      role: selectedRole,
      concern,
      fortune: fortuneMessage,
      aiFeed: aiFeedOverride || longAdvice || ""
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

  // 모바일에서 뒤로 가기 버튼 처리 (포춘 쿠키 준비 화면에서 INTRO로 이동)
  useEffect(() => {
    // 모바일 기기 감지
    const isLikelyMobileDevice = () => {
      if (typeof window === 'undefined') return false;
      try {
        const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
        const hasTouchPoints = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        const isTouchUA = /Android|iPhone|iPad|iPod|Samsung/i.test(ua);
        return hasCoarsePointer || hasTouchPoints || isTouchUA;
      } catch {
        return false;
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      // 포춘 쿠키 준비 화면에서만 처리 (!showRandomResult && !showFortune)
      if (!showRandomResult && !showFortune) {
        const isMobileBack = event.isTrusted && isLikelyMobileDevice();
        
        if (isMobileBack) {
          event.preventDefault?.();
          try {
            sessionStorage.setItem('intro_exit_override', 'true');
          } catch (error) {
            logger.warn('[FortuneCookiePage] sessionStorage 설정 실패', error);
          }
          navigate('/', { replace: true });
          return;
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate, showRandomResult, showFortune]);

  // daily_usage_log 로직은 FortuneRandomResult 컴포넌트의 다음 버튼으로 이동됨

  // 기존 history 조작 방식 제거 - 이제 Header 컴포넌트에서 시각적으로 비활성화
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 to-orange-200">
      <Header disableBackButton={showFortune} disableHomeButton={showFortune} />
      
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 lg:py-12 max-w-4xl">
        <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          {!showRandomResult && !showFortune ? (
            <CookieAnimationArea
              isLoadingFortune={isLoadingFortune}
              isOpened={isOpened}
              isOpening={isOpening}
              onCookieClick={handleCookieClick}
            />
          ) : showRandomResult ? (
            /* 미리보기 운세 결과 */
            <FortuneRandomResult
              fortuneMessage={fortuneMessage}
              user={user}
              onPrevious={handlePrevious}
              onNext={handleNext}
            />
          ) : (
            /* 최종 운세 결과 */
            <FortuneResultDisplay
              fortuneMessage={fortuneMessage}
              longAdvice={longAdvice}
              isSharing={isSharing}
              onShare={handleShare}
              onSaveAndViewHistory={handleSaveAndViewHistory}
              onFinish={handleFinish}
              selectedRole={selectedRole}
              concern={concern}
              randomFortune={randomFortune}
            />
          )}
        </div>
      </div>

      {/* Copy Modal */}
      <CopySuccessModal 
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
      />
    </div>
  );
}
