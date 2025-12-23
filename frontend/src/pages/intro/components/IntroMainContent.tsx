import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useAccessControl } from '../../../hooks/useAccessControl';
import Button from '../../../components/base/Button';
import Card from '../../../components/base/Card';
import AccessModal from '../../../components/feature/AccessModal';

interface IntroMainContentProps {
  isLoggedIn: boolean;
  isAdmin: boolean | null;
}

interface ModalState {
  isOpen: boolean;
  title: string;
  message?: string; // 특별 스타일 모달에서는 사용하지 않음
  actionButton?: {
    text: string;
    onClick: () => void;
  };
  cancelButtonText?: string;
  variant?: 'default' | 'dailyLimit'; // 모달 스타일 변형: dailyLimit은 일일 사용 제한 카운트다운 모달
  nextAvailableAt?: string | null; // 다음 이용 가능 시간 (ISO string, used_at 기준)
}

export default function IntroMainContent({ isLoggedIn, isAdmin }: IntroMainContentProps) {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: ''
  });
  
  const handleLogin = async () => {
    try {
      await login('kakao');
    } catch (e) {
      console.error('로그인 실패:', e);
      setModal({
        isOpen: true,
        title: '로그인 실패',
        message: ''
      });
    }
  };
  
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // 전역 접근 권한 체크 훅 사용
  const { checkAccessPermission, isCheckingAccess } = useAccessControl({
    userId: user?.id,
    navigate,
    onShowModal: (config) => {
      setModal({
        isOpen: true,
        ...config
      });
    },
    onCloseModal: () => {
      setModal(prev => ({ ...prev, isOpen: false }));
    }
  });

  // 시작하기 버튼 핸들러
  const handleStartClick = async () => {
    // 접근 권한 체크 중이면 무시
    if (isCheckingAccess) {
      return;
    }
    
    if (!isLoggedIn) {
      setModal({
        isOpen: true,
        title: '로그인 필요',
        message: '',
        actionButton: {
          text: '카카오 로그인',
          onClick: handleLogin
        }
      });
      return;
    }

    // 사용자 ID 유효성 체크
    if (!user?.id) {
      console.error('사용자 ID가 없음:', { user, isLoggedIn });
      setModal({
        isOpen: true,
        title: '사용자 정보 오류',
        message: ''
      });
      return;
    }

    // 먼저 접근 권한 체크 (이미 사용했는지 확인)
    const canAccess = await checkAccessPermission();
    
    // 이미 사용했거나 다른 제한에 걸리면 해당 모달이 이미 표시됨
    if (!canAccess) {
      return;
    }
    
    // 관리자는 바로 이동 (일일 제한 없음)
    if (isAdmin === true) {
      navigate('/role-select');
      return;
    }
    
    // 일반 사용자는 사전 안내 모달 표시
    setModal({
      isOpen: true,
      title: '포춘쿠키 이용 안내',
      message: '', // AccessModal에서 하드코딩된 메시지 사용
      actionButton: {
        text: '확인',
        onClick: () => {
          setModal(prev => ({ ...prev, isOpen: false }));
          navigate('/role-select'); // 이미 체크했으니 바로 이동
        }
      },
      cancelButtonText: '취소'
    });
  };

  // 모달 닫기
  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="relative z-10 flex items-center justify-center min-h-screen md:min-h-screen h-screen md:h-auto px-4 py-3 sm:py-4 md:py-0">
      <div className={`text-center transform transition-all duration-1000 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        {/* 메인 로고/제목 */}
        <div className="mb-5 sm:mb-6 md:mb-12">
          <h1 
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 bg-clip-text text-transparent mb-3 sm:mb-4 md:mb-6 pb-6 sm:pb-8 md:pb-16 pt-1 sm:pt-2 md:pt-3 leading-tight sm:leading-snug md:leading-relaxed"
            style={{ fontFamily: "Pacifico, serif" }}
          >
            fortune cookie
          </h1>
          <div className="flex justify-center mb-3 sm:mb-4 md:mb-6">
            <div className="text-[4.5rem] sm:text-[5.5rem] md:text-[8rem] lg:text-[9rem] xl:text-[10rem] animate-bounce">🥠</div>
          </div>
        </div>
        
        {/* 소개 카드 */}
        <Card className="max-w-3xl mx-auto p-5 sm:p-6 md:p-7 lg:p-8 mb-5 sm:mb-6 md:mb-8" glow>
          <h2 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-4 md:mb-4">
            당신만의 맞춤 운세를 확인해보세요
          </h2>

          {/* 특징 리스트 */}
          <div className="space-y-3 sm:space-y-3 md:space-y-4 mb-5 sm:mb-6 md:mb-7">
            <div className="flex items-center space-x-2.5 sm:space-x-3 md:space-x-3 text-amber-600">
              <i className="ri-user-star-line w-6 h-6 sm:w-6 sm:h-6 md:w-7 md:h-7 flex items-center justify-center text-base sm:text-base md:text-base"></i>
              <span className="text-base sm:text-base md:text-lg lg:text-xl font-medium">역할별 맞춤 상담</span>
            </div>
            <div className="flex items-center space-x-2.5 sm:space-x-3 md:space-x-3 text-orange-600">
              <i className="ri-magic-line w-6 h-6 sm:w-6 sm:h-6 md:w-7 md:h-7 flex items-center justify-center text-base sm:text-base md:text-base"></i>
              <span className="text-base sm:text-base md:text-lg lg:text-xl font-medium">AI 포춘쿠키 생성</span>
            </div>
            <div className="flex items-center space-x-2.5 sm:space-x-3 md:space-x-3 text-pink-600">
              <i className="ri-share-line w-6 h-6 sm:w-6 sm:h-6 md:w-7 md:h-7 flex items-center justify-center text-base sm:text-base md:text-base"></i>
              <span className="text-base sm:text-base md:text-lg lg:text-xl font-medium">결과 공유 가능</span>
            </div>
          </div>
        </Card>
        
        {/* 시작 버튼 */}
        <div className="space-y-3 sm:space-y-3 md:space-y-4">
          <Button 
            size="md"
            onClick={handleStartClick}
            disabled={isCheckingAccess}
            className={`px-7 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-5 text-base sm:text-base md:text-lg lg:text-xl shadow-xl ${
              isCheckingAccess 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:shadow-amber-300/50'
            }`}
          >
            <span className="flex items-center space-x-2">
              <span>{isCheckingAccess ? '권한 확인 중...' : '운세보기 시작하기'}</span>
              {isCheckingAccess ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <i className="ri-arrow-right-line text-lg sm:text-lg md:text-xl"></i>
              )}
            </span>
          </Button>
        </div>
      </div>

      {/* 접근 제한 안내 모달 */}
      <AccessModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        actionButton={modal.actionButton}
        cancelButtonText={modal.cancelButtonText}
        variant={modal.variant}
        nextAvailableAt={modal.nextAvailableAt}
      />
    </div>
  );
}