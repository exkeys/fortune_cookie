import { Send, Bookmark, X, Facebook, Instagram, Copy } from 'lucide-react';
import { useState, useEffect, useRef, useId, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../../hooks/useApi';
import { logger } from '../../../utils/logger';

interface FortuneResultDisplayProps {
  fortuneMessage: string;
  longAdvice?: string;
  isSharing: boolean;
  onShare: (platform: string) => void;
  onSaveAndViewHistory: (aiFeed?: string) => void;
  onFinish: () => void;
  selectedRole?: {
    id: string;
    name: string;
    icon: string;
    description: string;
    color: string;
  };
  concern?: string;
  randomFortune?: string;
}

export default function FortuneResultDisplay({ 
  fortuneMessage, 
  longAdvice,
  isSharing, 
  onShare, 
  onSaveAndViewHistory, 
  onFinish,
  selectedRole,
  concern,
  randomFortune
}: FortuneResultDisplayProps) {
  const gradientId = useId();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(longAdvice || "");
  const [hasGenerated, setHasGenerated] = useState(false);
  const { getAiBothAdvices } = useApi();
  const navigate = useNavigate();

  // 안정 표출을 위한 최종 버퍼/락
  const [finalAdvice, setFinalAdvice] = useState<string | null>(longAdvice || null);
  const [showAdvice, setShowAdvice] = useState<boolean>(!!longAdvice);
  const isAdviceLockedRef = useRef<boolean>(!!longAdvice);
  const revealDelayMs = 1200; // 충분한 시간 대기 후 노출 (더 느린 등장)
  const requestStartedRef = useRef<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 텍스트 너비 측정을 위한 ref와 state
  const textMeasureRef = useRef<HTMLDivElement>(null);
  const [paperWidth, setPaperWidth] = useState(432); // 기본 너비

  // 텍스트 길이에 따라 종이 너비 계산
  useEffect(() => {
    if (textMeasureRef.current && fortuneMessage) {
      // 숨겨진 요소로 실제 텍스트 너비 측정
      const textWidth = textMeasureRef.current.offsetWidth;
      // 패딩(좌우 각 32px) + 여유 공간(40px) 추가
      const minWidth = 280;
      const maxWidth = 800;
      const calculatedWidth = Math.max(minWidth, Math.min(maxWidth, textWidth + 80));
      setPaperWidth(calculatedWidth);
    }
  }, [fortuneMessage]);

  // prop으로 긴 조언이 나중에 도착하는 경우를 처리하되, 한번 확정되면 더 이상 교체하지 않음
  useEffect(() => {
    if (longAdvice && !isAdviceLockedRef.current) {
      // 잠깐 버퍼링 후 최종 확정 및 락
      const timer = setTimeout(() => {
        setFinalAdvice(longAdvice);
        setShowAdvice(true);
        isAdviceLockedRef.current = true;
      }, revealDelayMs);
      return () => clearTimeout(timer);
    }
  }, [longAdvice]);

  // 컴포넌트 마운트 시 AI 응답 생성 (한 번만)
  useEffect(() => {
    if (!requestStartedRef.current && !hasGenerated && !longAdvice && selectedRole && concern && randomFortune) {
      requestStartedRef.current = true; // 렌더 직후 중복 실행 차단 (state 업데이트 레이스 방지)
      setHasGenerated(true);
      const generateAiAdvice = async () => {
        try {
          const result = await getAiBothAdvices(selectedRole.name, concern, randomFortune);
          const longAdviceText = result?.data?.longAdvice || "긴 조언을 받지 못했습니다.";
          setAiAdvice(longAdviceText);

          // 최종 확정 로직: 지연 후 단 한번만 노출/락
          if (!isAdviceLockedRef.current) {
            const timer = setTimeout(() => {
              setFinalAdvice(longAdviceText);
              setShowAdvice(true);
              isAdviceLockedRef.current = true;
            }, revealDelayMs);
            return () => clearTimeout(timer);
          }
        } catch (error: unknown) {
          logger.error('긴 조언 로딩 실패:', error);
          const fallback = "긴 조언을 받지 못했습니다.";
          setAiAdvice(fallback);
          if (!isAdviceLockedRef.current) {
            setFinalAdvice(fallback);
            setShowAdvice(true);
            isAdviceLockedRef.current = true;
          }
        }
      };
      generateAiAdvice();
    }
  }, [hasGenerated, longAdvice, selectedRole, concern, randomFortune, getAiBothAdvices]);

  // 새로고침 후 동일 화면 복원을 위한 상태 저장/복원(sessionStorage)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('fortune_result_state');
      if (raw) {
        const saved = JSON.parse(raw || '{}');
        // 동일한 fortuneMessage일 때만 복원
        if (saved?.fortuneMessage === fortuneMessage) {
          if (typeof saved.finalAdvice === 'string') {
            setFinalAdvice(saved.finalAdvice);
            setShowAdvice(true);
            isAdviceLockedRef.current = true;
          }
          if (typeof saved.aiAdvice === 'string') {
            setAiAdvice(saved.aiAdvice);
          }
        }
      }
    } catch (error) {
      logger.warn('[FortuneResultDisplay] sessionStorage 복원 실패', error);
    }
  }, [fortuneMessage]);

  // sessionStorage 저장 최적화 (throttle 적용)
  const saveToSessionStorage = useCallback(() => {
    try {
      const payload = {
        fortuneMessage,
        aiAdvice,
        finalAdvice,
        showAdvice,
        selectedRoleName: selectedRole?.name || null,
        concern: concern || null,
        randomFortune: randomFortune || null,
        ts: Date.now()
      };
      sessionStorage.setItem('fortune_result_state', JSON.stringify(payload));
    } catch (error) {
      logger.warn('[FortuneResultDisplay] sessionStorage 저장 실패', error);
    }
  }, [fortuneMessage, aiAdvice, finalAdvice, showAdvice, selectedRole?.name, concern, randomFortune]);

  useEffect(() => {
    // throttle: 500ms마다 최대 1회 저장
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveToSessionStorage();
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [saveToSessionStorage]);

  // 이 페이지에서만 새로고침(F5/Ctrl+R)과 뒤로가기를 최대한 차단
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase();
      const keyCode = (e as any).keyCode;
      const isRefreshKey = key === 'f5' || keyCode === 116 || (key === 'r' && (e.ctrlKey || (e as any).metaKey));
      if (isRefreshKey) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // 마우스 뒤로가기(XButton1) / 앞으로가기(XButton2) 차단
    const isBrowserSideButton = (ev: MouseEvent | PointerEvent) => {
      // 일부 브라우저는 button 3/4, 일부는 buttons 비트마스크 8/16 사용
      const button: number = typeof ev.button === 'number' ? ev.button : -1;
      const buttons: number = typeof ev.buttons === 'number' ? ev.buttons : 0;
      const sideButtonByButton = button === 3 || button === 4;
      const sideButtonByMask = (buttons & 8) === 8 || (buttons & 16) === 16; // X1/X2
      return sideButtonByButton || sideButtonByMask;
    };

    const handlePointerEvent = (e: PointerEvent | MouseEvent) => {
      if (isBrowserSideButton(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // 뒤로가기 방지: 현재 주소로 스택 고정 + popstate에서 되돌리기
    const lockHistory = () => {
      try {
        window.history.pushState(null, '', window.location.href);
      } catch (error) {
        logger.warn('[FortuneResultDisplay] history pushState 실패 (무시 가능)', error);
      }
    };
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
      if (showShareMenu) {
        event.preventDefault?.();
        setShowShareMenu(false);
        lockHistory();
        return;
      }

      const isMobileBack = event.isTrusted && isLikelyMobileDevice();

      if (isMobileBack) {
        try {
          sessionStorage.setItem('intro_exit_override', 'true');
        } catch (error) {
          logger.warn('[FortuneResultDisplay] sessionStorage 설정 실패 (무시 가능)', error);
        }
        navigate('/', { replace: true });
        return;
      }

      lockHistory();
    };

    // 초기 한 번 푸시로 잠금
    lockHistory();

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('popstate', handlePopState);
    // 마우스 사이드 버튼 이벤트 캡처 (최대한 이른 단계에서 차단)
    window.addEventListener('auxclick', handlePointerEvent as any, { capture: true } as any);
    window.addEventListener('pointerdown', handlePointerEvent as any, { capture: true } as any);
    window.addEventListener('pointerup', handlePointerEvent as any, { capture: true } as any);
    window.addEventListener('mousedown', handlePointerEvent as any, { capture: true } as any);
    window.addEventListener('mouseup', handlePointerEvent as any, { capture: true } as any);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown, { capture: true } as any);
      window.removeEventListener('auxclick', handlePointerEvent as any, { capture: true } as any);
      window.removeEventListener('pointerdown', handlePointerEvent as any, { capture: true } as any);
      window.removeEventListener('pointerup', handlePointerEvent as any, { capture: true } as any);
      window.removeEventListener('mousedown', handlePointerEvent as any, { capture: true } as any);
      window.removeEventListener('mouseup', handlePointerEvent as any, { capture: true } as any);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate, showShareMenu]);

  // 복사 기능
  const handleCopyText = async () => {
    const adviceForCopy = finalAdvice ?? aiAdvice;
    const shareText = `🥠 오늘의 포춘쿠키! 🥠

"${fortuneMessage}"

${adviceForCopy}

✨ 내 오늘 운세 한 줄 요약이에요.
#오늘의운세 #포춘쿠키 #AI운세 #하루한줄 #자기계발

${window.location.origin}`;
    
    try {
      // 모바일 호환성을 위한 복사 방법
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        // Fallback: textarea를 사용한 복사 방법 (모바일 호환)
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          // execCommand는 deprecated되었지만 모바일 fallback으로 필요
          const successful = (document as any).execCommand('copy');
          if (!successful) {
            throw new Error('execCommand failed');
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
      
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
      // 에러가 발생해도 사용자에게 알림 표시
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    }
  };

  const APPLE_SPINNER_SEGMENTS = Array.from({ length: 12 });

  return (
    <div className={`max-w-4xl mx-auto relative px-2 sm:px-4 md:px-6 ${!showAdvice ? 'mt-16 sm:mt-0' : ''}`}>
      {/* 복사 완료 알림 */}
      {showCopySuccess && (
        <div className="absolute top-12 sm:top-16 left-1/2 transform -translate-x-1/2 z-50 bg-black text-white px-3 sm:px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xs sm:text-sm font-medium">복사 완료!</span>
        </div>
      )}
      
      <div className="bg-white border border-gray-300 rounded-2xl shadow-sm overflow-hidden">
        {/* 이미지 영역 (메시지 카드) */}
        <div className="bg-white px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-10 md:py-12 lg:py-14 min-h-[300px] sm:min-h-[380px] md:min-h-[432px] relative">
          {/* 프로필 정보 - 제일 위쪽 왼쪽 */}
          <div className="absolute top-1 left-0 p-2 sm:p-3 flex items-center gap-2">
            {/* 인스타그램 스타일 스토리 배지 */}
            <div className="relative">
              {/* 외부 원형 그라데이션 테두리 (인스타그램 스토리 스타일) */}
              <div 
                className="w-10 h-10 rounded-full p-[2px]"
                style={{
                  background: 'linear-gradient(45deg, #F58529, #FEDA77, #DD2A7B, #8134AF, #515BD4)'
                }}
              >
                {/* 내부 원형 (포춘 쿠키 이미지) */}
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-xl">
                    🥠
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="font-semibold text-xs sm:text-sm">fortune_cookie</p>
                {/* 인증 표시 */}
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">회원님을 위한 추천</p>
            </div>
          </div>
          
          {/* 점 3개 버튼 - 제일 위쪽 */}
          <div className="absolute top-1 right-0 p-2 sm:p-3">
            <button 
              onClick={handleCopyText}
              title="복사하기"
              className="flex flex-col gap-0.5 p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800 transition-colors"
            >
              <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
            </button>
          </div>
          
          {/* 포춘 쿠키 종이 조각 - 양쪽이 안으로 들어간 형태 */}
          <div className="relative flex justify-center mb-7 mt-12 sm:mt-0">
            {/* 텍스트 너비 측정용 숨겨진 요소 */}
            <div 
              ref={textMeasureRef}
              className="absolute invisible whitespace-nowrap text-sm sm:text-base md:text-lg lg:text-xl font-medium font-sans"
              aria-hidden="true"
            >
              "{fortuneMessage}"
            </div>
            
            {/* 종이 그림자 */}
            <div 
              className="absolute top-1 left-1/2 h-12 sm:h-14 md:h-16 bg-gray-300 opacity-30 blur-sm scale-90 sm:scale-100 origin-center"
              style={{ width: `${paperWidth}px`, transform: 'translateX(calc(-50% - 6px))' }}
            ></div>

            <div className="relative rotate-1 ml-4 sm:ml-5 md:ml-7 scale-90 sm:scale-100 origin-center" style={{ left: '-6px' }}>
              <svg 
                width={paperWidth} 
                height="64" 
                viewBox={`0 0 ${paperWidth} 64`} 
                className="drop-shadow-lg"
                style={{ minWidth: '280px', maxWidth: '800px' }}
              >
                {/* 테두리 포함된 종이 경로 (양쪽 안으로 파인 모양) */}
                <path
                  d={`M 0 0 L ${paperWidth - 16} 0 L ${paperWidth - 32} 32 L ${paperWidth - 16} 64 L 0 64 L 16 32 Z`}
                  fill={`url(#${gradientId})`}
                  stroke="#fed7aa"
                  strokeWidth="2"
                  shapeRendering="geometricPrecision"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fffbeb" />
                    <stop offset="50%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#fffbeb" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            {/* 운세 메시지 텍스트 (종이와 별도로 위치 조정) */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center px-4 sm:px-6 md:px-8 scale-[0.93] sm:scale-100 origin-center" style={{ width: `${paperWidth}px`, height: '64px' }}>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl font-medium text-gray-900 text-center leading-tight font-sans">
                "{fortuneMessage}"
              </p>
            </div>
          </div>
          
          {/* AI 해석 */}
          <div className="border-t border-gray-200 pt-4 sm:pt-5 md:pt-7 relative min-h-[48px] sm:min-h-[56px] md:min-h-[64px]">
            <p
              className={`text-left text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed font-sans whitespace-pre-wrap break-words transition-opacity duration-500 ${showAdvice ? 'opacity-100' : 'opacity-0'}`}
            >
              {finalAdvice ?? ''}
            </p>
            {/* 로딩 오버레이: 준비되면 서서히 사라짐 */}
            <div
              className={`absolute inset-0 flex items-center justify-center text-gray-500 transition-opacity duration-300 ${showAdvice ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              aria-hidden={showAdvice}
            >
              <div className="flex flex-col items-center gap-4 mt-14 sm:mt-14">
                <div className="relative w-12 h-12">
                  {APPLE_SPINNER_SEGMENTS.map((_, i) => (
                    <div
                      key={i}
                      className="absolute left-1/2 top-0 w-0.5 h-3 -ml-px bg-gray-400 rounded-full"
                      style={{
                        transform: `rotate(${i * 30}deg) translateY(0)`,
                        transformOrigin: '0 24px',
                        opacity: 1 - i * 0.08,
                        animation: 'fortuneAppleFade 1s linear infinite',
                        animationDelay: `${-1 + i * 0.083}s`
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600">AI 답변 생성 중...</p>
              </div>
              <style>{`
                @keyframes fortuneAppleFade {
                  0% { opacity: 1; }
                  100% { opacity: 0.15; }
                }
              `}</style>
            </div>
          </div>
        </div>

        {/* 공유하기와 액션 버튼 */}
        <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 border-t border-gray-200">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* 공유하기 버튼 */}
            <div className="flex items-center gap-2 relative">
              <button 
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
              >
                <Send size={20} className="sm:w-[23px] sm:h-[23px]" />
              </button>
              
              {/* 공유 메뉴 */}
              {showShareMenu && (
                <>
                  {/* 배경 오버레이 */}
                  <div 
                    className="fixed inset-0 z-0" 
                    onClick={() => setShowShareMenu(false)}
                  />
                  {/* 메뉴 */}
                  <div className="absolute left-6 sm:left-8 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-xl p-1 sm:p-1.5 flex gap-0.5 sm:gap-1 z-20 border border-gray-200">
                    <button 
                      onClick={() => {
                        onShare('kakao');
                        setShowShareMenu(false);
                      }}
                      disabled={isSharing}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-400 text-gray-900 rounded-full hover:bg-yellow-500 transition-all disabled:opacity-50 flex items-center justify-center hover:scale-110"
                      title="KakaoTalk"
                    >
                      <i className="ri-kakao-talk-fill text-sm sm:text-lg"></i>
                    </button>
                    <button 
                      onClick={() => {
                        onShare('instagram');
                        setShowShareMenu(false);
                      }}
                      disabled={isSharing}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white rounded-full hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center hover:scale-110"
                      title="Instagram"
                    >
                      <Instagram size={14} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <button 
                      onClick={() => {
                        onShare('facebook');
                        setShowShareMenu(false);
                      }}
                      disabled={isSharing}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center hover:scale-110"
                      title="Facebook"
                    >
                      <Facebook size={14} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <button 
                      onClick={() => {
                        onShare('twitter');
                        setShowShareMenu(false);
                      }}
                      disabled={isSharing}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-black text-white rounded-full hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center hover:scale-110"
                      title="X (Twitter)"
                    >
                      <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </button>
                    <button 
                      onClick={async (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        await handleCopyText();
                        setShowShareMenu(false);
                      }}
                      onTouchEnd={async (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        await handleCopyText();
                        setShowShareMenu(false);
                      }}
                      disabled={isSharing}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-700 text-white rounded-full hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center hover:scale-110"
                      title="클립보드 복사"
                    >
                      <Copy size={14} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 액션 버튼들 */}
            <div className="flex gap-1.5 sm:gap-2">
              <button 
                onClick={() => onSaveAndViewHistory(finalAdvice ?? undefined)}
                disabled={!showAdvice}
                title={!showAdvice ? 'AI 생성 중에는 저장할 수 없습니다' : '저장'}
                className={`p-2 rounded-lg transition-colors flex items-center justify-center
                  ${!showAdvice 
                    ? 'text-gray-400 opacity-60 cursor-not-allowed' 
                    : 'text-gray-600 hover:text-gray-800'}`}
              >
                <Bookmark size={20} className="sm:w-6 sm:h-6" />
              </button>
              <button 
                onClick={onFinish}
                title="마침"
                className="p-2 text-gray-600 rounded-lg hover:text-gray-800 transition-colors flex items-center justify-center"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}