import { useState, useEffect } from 'react';
import Button from '../../../components/base/Button';
import Card from '../../../components/base/Card';
import { KAKAO_JAVASCRIPT_KEY } from '../../../constants';
import { useResponsive } from '../../../hooks/useResponsive';
import CopySuccessModal from '../../../components/base/CopySuccessModal';
import AiFeedModal from '../../../components/base/AiFeedModal';

interface Role {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

interface HistoryItem {
  id: string;
  date: string;
  role?: Role;
  concern?: string;
  fortune: string;
  aiFeed?: string; // AI 피드 추가
}

interface DetailModalProps {
  item: HistoryItem;
  formatDate: (dateString: string) => string;
  onClose: () => void;
  onNewFortune: () => void;
  onDelete: () => void;
}

// 텍스트 자르기 함수 (80자 제한)
const truncateText = (text: string, maxLength: number = 35): { text: string; isTruncated: boolean } => {
  if (!text || text.length <= maxLength) {
    return { text: text || '', isTruncated: false };
  }
  return { text: text.substring(0, maxLength) + '...', isTruncated: true };
};

export default function DetailModal({
  item,
  formatDate,
  onClose,
  onNewFortune,
  onDelete
}: DetailModalProps) {
  const { isMobile } = useResponsive();
  const [isAiFeedModalOpen, setIsAiFeedModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);

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

  const handleShareClick = () => {
    setIsShareModalOpen(true);
  };

  const handleShare = async (platform: string) => {
    setIsSharing(true);
    
    const shareText = `🥠 오늘의 포춘쿠키!

"${item.fortune}"

✨ 내 오늘 운세 한 줄 요약이에요.
#오늘의운세 #포춘쿠키 #AI운세 #하루한줄 #자기계발

👇 지금 너의 쿠키도 열어봐`;
    const shareUrl = window.location.origin;
    
    try {
      if (platform === 'copy') {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        setIsShareModalOpen(false);
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
          } catch (error) {
            console.error('카카오톡 공유 오류:', error);
            // 에러 발생 시 클립보드 복사로 대체
            await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
            setIsShareModalOpen(false);
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
                navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
                setIsShareModalOpen(false);
                setShowCopyModal(true);
              }
            }, 300);
          } else {
            await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
            setIsShareModalOpen(false);
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
    } catch (error) {
      console.error('공유 실패:', error);
    }
    
    setTimeout(() => setIsSharing(false), 1000);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card 
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {/* 모달 헤더 */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center space-x-4">
              {item.role && (
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${item.role.color} flex items-center justify-center text-white shadow-lg`}>
                  {item.role.id === 'ceo' ? (
                    <span className="text-xl">👑</span>
                  ) : (
                    <i className={`${item.role.icon} text-xl`}></i>
                  )}
                </div>
              )}
              <div>
                <h3 className="font-bold text-gray-800 text-2xl mb-1">
                  {item.role?.name || '일반 상담'}
                </h3>
                <p className="text-gray-500">
                  {formatDate(item.date)}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors duration-300"
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          </div>
          
          {/* 고민 내용 */}
          {item.concern && (
            <div className="mb-8">
              <h4 className="font-bold text-gray-800 mb-4 text-sm sm:text-base md:text-lg flex items-center whitespace-nowrap">
                <i className="ri-question-line mr-2 text-blue-500 text-sm sm:text-base md:text-lg"></i>
                나눈 고민
              </h4>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-5 md:p-6 rounded-xl border-l-4 border-blue-400">
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg">
                  {item.concern}
                </p>
              </div>
            </div>
          )}
          
          {/* 운세 내용 */}
          <div className="mb-8">
            <h4 className="font-bold text-gray-800 mb-4 text-sm sm:text-base md:text-lg flex items-center whitespace-nowrap">
              <i className="ri-magic-line mr-2 text-purple-500 text-sm sm:text-base md:text-lg"></i>
              받은 조언
            </h4>
            <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4 sm:p-5 md:p-6 rounded-xl border-l-4 border-purple-400 shadow-inner">
              <p className="text-gray-800 leading-relaxed font-medium text-sm sm:text-base md:text-lg">
                "✨ {item.fortune}"
              </p>
            </div>
          </div>

          {/* AI 피드 섹션 */}
          {item.aiFeed && (
            <div className="mb-8">
              <h4 className="font-bold text-gray-800 mb-4 text-sm sm:text-base md:text-lg flex items-center whitespace-nowrap">
                <i className="ri-robot-line mr-2 text-blue-500 text-sm sm:text-base md:text-lg"></i>
                AI 피드
              </h4>
              <div 
                className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 sm:p-5 md:p-6 rounded-xl border-l-4 border-blue-400 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setIsAiFeedModalOpen(true)}
              >
                {(() => {
                  const { text } = truncateText(item.aiFeed);
                  return (
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-lg">
                      {text}
                    </p>
                  );
                })()}
              </div>
            </div>
          )}
          
          {/* 액션 버튼들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={handleShareClick}
              className="bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
            >
              <i className="ri-share-line mr-2"></i>
              운세 공유하기
            </Button>
            
            <Button
              variant="outline"
              onClick={onNewFortune}
              className="bg-white hover:bg-green-50 hover:border-green-300 hover:text-green-600"
            >
              <i className="ri-refresh-line mr-2"></i>
              비슷한 고민으로 새 운세 받기
            </Button>
            
            <Button
              variant="outline"
              onClick={onDelete}
              className="bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-600 md:col-span-2"
            >
              <i className="ri-delete-bin-line mr-2"></i>
              이 기록 삭제하기
            </Button>
          </div>
        </div>
      </Card>

      {/* AI 피드 전용 모달 */}
      {isAiFeedModalOpen && item.aiFeed && (
        <AiFeedModal 
          content={item.aiFeed}
          isOpen={isAiFeedModalOpen}
          onClose={() => setIsAiFeedModalOpen(false)}
        />
      )}

      {/* 공유 모달 */}
      {isShareModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={(e) => {
              e.stopPropagation();
              setIsShareModalOpen(false);
            }}
          />
          <div 
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">운세 공유하기</h3>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => handleShare('kakao')}
                  disabled={isSharing}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-full hover:bg-yellow-500 transition-colors shadow-md text-sm font-medium disabled:opacity-50"
                >
                  <i className="ri-kakao-talk-fill"></i>
                  <span>카카오톡</span>
                </button>
                
                <button
                  onClick={() => handleShare('instagram')}
                  disabled={isSharing}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-colors shadow-md text-sm font-medium disabled:opacity-50"
                >
                  <i className="ri-instagram-fill"></i>
                  <span>인스타그램</span>
                </button>
                
                <button
                  onClick={() => handleShare('twitter')}
                  disabled={isSharing}
                  className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-all shadow-md text-sm font-medium disabled:opacity-50"
                  title="X (Twitter)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span>트위터</span>
                </button>
                
                <button
                  onClick={() => handleShare('facebook')}
                  disabled={isSharing}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md text-sm font-medium disabled:opacity-50"
                >
                  <i className="ri-facebook-fill"></i>
                  <span>페이스북</span>
                </button>
                
                <button
                  onClick={() => handleShare('copy')}
                  disabled={isSharing}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors shadow-md text-sm font-medium disabled:opacity-50"
                >
                  <i className="ri-clipboard-line"></i>
                  <span>복사</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 복사 완료 모달 */}
      <CopySuccessModal 
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
      />
    </div>
  );
}