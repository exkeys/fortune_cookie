import { Send, Bookmark, X, Facebook, Instagram, Copy } from 'lucide-react';
import { useState, useEffect, useRef, useId } from 'react';
import { useApi } from '../../../hooks/useApi';

interface FortuneResultDisplayProps {
  fortuneMessage: string;
  longAdvice?: string;
  isSharing: boolean;
  onShare: (platform: string) => void;
  onSaveAndViewHistory: () => void;
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(longAdvice || "");
  const [hasGenerated, setHasGenerated] = useState(false);
  const { getAiBothAdvices } = useApi();

  // 안정 표출을 위한 최종 버퍼/락
  const [finalAdvice, setFinalAdvice] = useState<string | null>(longAdvice || null);
  const [showAdvice, setShowAdvice] = useState<boolean>(!!longAdvice);
  const isAdviceLockedRef = useRef<boolean>(!!longAdvice);
  const revealDelayMs = 1200; // 충분한 시간 대기 후 노출 (더 느린 등장)

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
    if (!hasGenerated && !longAdvice && selectedRole && concern && randomFortune) {
      setHasGenerated(true);
      const generateAiAdvice = async () => {
        try {
          console.log('랜덤 운세를 사용한 AI 조언 생성:', { randomFortune });
          const { data } = await (getAiBothAdvices as any)(selectedRole.name, concern, randomFortune);
          const longAdviceText = data?.longAdvice || "긴 조언을 받지 못했습니다.";
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
        } catch (error) {
          console.error('긴 조언 로딩 실패:', error);
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
    } catch {}
  }, [fortuneMessage]);

  useEffect(() => {
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
    } catch {}
  }, [fortuneMessage, aiAdvice, finalAdvice, showAdvice, selectedRole, concern, randomFortune]);

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
    const isBrowserSideButton = (ev: any) => {
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
      } catch {}
    };
    const handlePopState = () => {
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
  }, []);

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
      await navigator.clipboard.writeText(shareText);
      setShowMoreMenu(false);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* 복사 완료 알림 */}
      {showCopySuccess && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 bg-black text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm font-medium">복사 완료!</span>
        </div>
      )}
      
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-full flex items-center justify-center text-xl">
              🥠
            </div>
            <div>
              <p className="font-semibold text-xs">fortune_cookie</p>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          
          {/* 점 3개 메뉴 */}
          <div className="flex items-center relative">
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="flex flex-col gap-1 p-1 hover:bg-gray-100 rounded"
            >
              <div className="w-1 h-1 bg-black rounded-full"></div>
              <div className="w-1 h-1 bg-black rounded-full"></div>
              <div className="w-1 h-1 bg-black rounded-full"></div>
            </button>
            
            {/* 더보기 메뉴 */}
            {showMoreMenu && (
              <>
                {/* 배경 오버레이 */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMoreMenu(false)}
                />
                {/* 메뉴 */}
                <div className="absolute right-0 top-8 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-20 min-w-[140px] overflow-hidden">
                  <button 
                    onClick={handleCopyText}
                    className="w-full px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-3 transition-colors duration-150"
                  >
                    <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                      <Copy size={12} className="text-gray-600" />
                    </div>
                    <span className="font-medium">복사하기</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 이미지 영역 (메시지 카드) */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-100 px-8 md:px-12 py-14">
          <div className="bg-white p-8 md:p-12 rounded-lg shadow-md min-h-[432px]">
            {/* 포춘 쿠키 종이 조각 - 양쪽이 안으로 들어간 형태 */}
            <div className="relative flex justify-center mb-7">
              {/* 종이 그림자 */}
              <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-90 h-16 bg-gray-300 opacity-30 blur-sm"></div>

              <div className="relative rotate-1 ml-7">
                <svg width="432" height="64" viewBox="0 0 432 64" className="drop-shadow-lg">
                  {/* 테두리 포함된 종이 경로 (양쪽 안으로 파인 모양) */}
                  <path
                    d="M 0 0 L 416 0 L 400 32 L 416 64 L 0 64 L 16 32 Z"
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

                {/* 운세 메시지 텍스트 */}
                <div className="absolute inset-0 flex items-center justify-center px-8">
                  <p className="text-lg md:text-xl font-medium text-gray-900 text-center leading-tight font-sans">
                    "{fortuneMessage}"
                  </p>
                </div>
              </div>
            </div>
            
            {/* AI 해석 */}
            <div className="border-t border-gray-200 pt-7 relative min-h-[64px]">
              {/* 실제 텍스트: 항상 렌더링하되, 준비 전에는 투명 */}
              <p
                className={`text-base md:text-lg text-gray-700 leading-relaxed font-sans whitespace-pre-wrap break-words transition-opacity duration-500 ${showAdvice ? 'opacity-100' : 'opacity-0'}`}
              >
                {finalAdvice ?? ''}
              </p>
              {/* 로딩 오버레이: 준비되면 서서히 사라짐 */}
              <div
                className={`absolute inset-0 flex items-center justify-center text-gray-500 transition-opacity duration-300 ${showAdvice ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                aria-hidden={showAdvice}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">AI가 답변을 생성 중입니다</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 공유하기와 액션 버튼 */}
        <div className="px-3 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between gap-4">
            {/* 공유하기 버튼 */}
            <div className="flex items-center gap-2 relative">
              <button 
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
              >
                <Send size={23} />
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
                  <div className="absolute left-8 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-xl p-1.5 flex gap-1 z-20 border border-gray-200">
                    <button 
                      onClick={() => {
                        onShare('kakao');
                        setShowShareMenu(false);
                      }}
                      disabled={isSharing}
                      className="w-10 h-10 bg-yellow-400 text-gray-900 rounded-full hover:bg-yellow-500 transition-all disabled:opacity-50 flex items-center justify-center hover:scale-110"
                      title="KakaoTalk"
                    >
                      <i className="ri-kakao-talk-fill text-lg"></i>
                    </button>
                    <button 
                      onClick={() => {
                        onShare('instagram');
                        setShowShareMenu(false);
                      }}
                      disabled={isSharing}
                      className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white rounded-full hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center hover:scale-110"
                      title="Instagram"
                    >
                      <Instagram size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        onShare('facebook');
                        setShowShareMenu(false);
                      }}
                      disabled={isSharing}
                      className="w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center hover:scale-110"
                      title="Facebook"
                    >
                      <Facebook size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        onShare('twitter');
                        setShowShareMenu(false);
                      }}
                      disabled={isSharing}
                      className="w-10 h-10 bg-black text-white rounded-full hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center hover:scale-110"
                      title="X (Twitter)"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </button>
                    <button 
                      onClick={() => {
                        onShare('copy');
                        setShowShareMenu(false);
                      }}
                      disabled={isSharing}
                      className="w-10 h-10 bg-gray-700 text-white rounded-full hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center hover:scale-110"
                      title="클립보드 복사"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 액션 버튼들 */}
            <div className="flex gap-2">
              <button 
                onClick={onSaveAndViewHistory}
                disabled={!showAdvice}
                title={!showAdvice ? 'AI 생성 중에는 저장할 수 없습니다' : undefined}
                className={`px-3 py-2 rounded-lg transition-colors font-medium text-xs flex items-center gap-1.5 
                  ${!showAdvice 
                    ? 'bg-blue-400 text-white opacity-60 cursor-not-allowed' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'}`}
              >
                <Bookmark size={14} />
                저장
              </button>
              <button 
                onClick={onFinish}
                className="px-3 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium text-xs flex items-center gap-1.5"
              >
                <X size={14} />
                마침
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}