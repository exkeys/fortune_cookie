import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import Button from '../../../components/base/Button';
import Card from '../../../components/base/Card';
import AccessModal from '../../../components/feature/AccessModal';

interface IntroMainContentProps {
  isLoggedIn: boolean;
}

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  icon: string;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
  cancelButtonText?: string;
}

export default function IntroMainContent({ isLoggedIn }: IntroMainContentProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    icon: ''
  });
  const [isCheckingAccess, setIsCheckingAccess] = useState(false); // 중복 요청 방지
  
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // 접근 권한 체크 함수
  const checkAccessPermission = async () => {
    if (!user?.id) return false;
    
    // 중복 요청 방지
    if (isCheckingAccess) {
      console.log('접근 권한 체크 중복 요청 방지');
      return false;
    }
    
    setIsCheckingAccess(true);
    
    try {
      console.log('인트로에서 접근 권한 체크 시작...', { userId: user.id });
      const response = await fetch(`/api/access-control/check-full-access?userId=${user.id}`);
      
      console.log('API 응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 응답 에러:', { status: response.status, text: errorText });
        
        setModal({
          isOpen: true,
          title: 'API 연결 오류',
          message: `서버와의 연결에 문제가 있습니다.\n\n응답 코드: ${response.status}\n오류 내용: ${errorText || '알 수 없는 오류'}\n\n잠시 후 다시 시도해주세요.`,
          icon: '🔌'
        });
        return false;
      }
      
      const data = await response.json();
      console.log('🔍 접근 권한 체크 결과 (상세):', {
        canAccess: data.canAccess,
        canUse: data.canUse,
        reason: data.reason,
        user: data.user,
        fullResponse: data
      });
      
      // 접근 불가능한 경우
      if (!data.canAccess) {
        let icon = '🚫';
        let title = '서비스 이용 제한';
        let message = data.reason || '서비스 이용이 제한되었습니다.';
        let actionButton = undefined;
        
        if (data.reason?.includes('차단된')) {
          icon = '🚫';
          title = '계정 차단';
          message = '죄송합니다. 현재 계정이 차단된 상태입니다.\n\n서비스 이용에 문제가 있어 관리자에 의해 차단되었습니다. 자세한 내용은 관리자에게 문의해 주세요.';
          
        } else if (data.reason?.includes('학교 정보가 설정되지')) {
          icon = '🏫';
          title = '학교 선택 필요';
          message = '포춘쿠키 서비스를 이용하려면 먼저 학교를 선택해야 합니다.\n\n"학교 선택하기" 버튼을 눌러 소속 학교를 등록해 주세요.';
          actionButton = {
            text: '학교 선택하기',
            onClick: () => {
              setModal(prev => ({ ...prev, isOpen: false }));
              navigate('/school-select');
            }
          };
          
        } else if (data.reason?.includes('이용 기간이 설정되지')) {
          // 학교명 추출
          const schoolMatch = data.reason.match(/(.+)의 이용 기간이/);
          const schoolName = schoolMatch ? schoolMatch[1] : '해당 학교';
          
          icon = '📅';
          title = '이용 기간 미설정';
          message = `${schoolName}의 포춘쿠키 서비스 이용 기간이 아직 설정되지 않았습니다.\n\n관리자가 이용 기간을 설정하면 서비스를 이용하실 수 있습니다. 관리자에게 문의해 주세요.`;
          
        } else if (data.reason?.includes('이용 기간(') && data.reason.includes('이 아닙니다')) {
          // 학교명과 날짜 추출
          const periodMatch = data.reason.match(/(.+)의 이용 기간\((.+) ~ (.+)\)이 아닙니다/);
          const schoolName = periodMatch ? periodMatch[1] : '해당 학교';
          const startDate = periodMatch ? periodMatch[2] : '';
          const endDate = periodMatch ? periodMatch[3] : '';
          
          // 현재 날짜와 비교해서 메시지 결정
          const currentDate = new Date();
          const startDateObj = new Date(startDate);
          const endDateObj = new Date(endDate);
          
          let statusMessage = '';
          if (currentDate < startDateObj) {
            const daysUntilStart = Math.ceil((startDateObj.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
            statusMessage = `서비스 시작까지 ${daysUntilStart}일 남았습니다.`;
          } else if (currentDate > endDateObj) {
            const daysAfterEnd = Math.ceil((currentDate.getTime() - endDateObj.getTime()) / (1000 * 60 * 60 * 24));
            statusMessage = `서비스 종료 후 ${daysAfterEnd}일이 지났습니다.`;
          }
          
          icon = '📅';
          title = '이용 기간 종료';
          message = `${schoolName}의 포춘쿠키 서비스 이용 기간이 아닙니다.\n\n📅 이용 기간: ${startDate} ~ ${endDate}\n${statusMessage}\n\n새로운 이용 기간에 대해서는 관리자에게 문의해 주세요.`;
          
        } else {
          // 기타 경우는 원본 메시지 사용하되 좀 더 친절하게
          message = `서비스 이용이 일시적으로 제한되었습니다.\n\n상세 내용: ${data.reason}\n\n문제가 지속되면 관리자에게 문의해 주세요.`;
        }
        
        setModal({
          isOpen: true,
          title,
          message,
          icon,
          actionButton
        });
        return false;
      }
      
      // 일일 사용 제한에 걸린 경우
      if (!data.canUse) {
        const message = `하루에 하나씩만 받을 수 있어요.\n\n내일 다시 찾아와 주세요! 🌅`;
        
        setModal({
          isOpen: true,
          title: '오늘의 포춘쿠키를 이미 받으셨어요!',
          message,
          icon: '🍪',
          actionButton: {
            text: '지난 고민 보기 📝',
            onClick: () => {
              setModal(prev => ({ ...prev, isOpen: false }));
              navigate('/past-concerns');
            }
          }
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('접근 권한 체크 실패:', error);
      
      let errorMessage = '접근 권한 확인 중 오류가 발생했습니다.';
      let icon = '⚠️';
      let title = '연결 오류';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // 네트워크 연결 오류
        title = '서버 연결 실패';
        errorMessage = '백엔드 서버에 연결할 수 없습니다.\n\n가능한 원인:\n• 백엔드 서버가 실행되지 않음\n• 네트워크 연결 문제\n• 프록시 설정 오류\n\n서버 상태를 확인해 주세요.';
        icon = '🔌';
      } else if (error instanceof Error && error.message) {
        // 기타 JavaScript 에러
        errorMessage = `JavaScript 오류가 발생했습니다.\n\n오류 내용: ${error.message}\n\n개발자 도구(F12) 콘솔을 확인해 주세요.`;
        icon = '💻';
      }
      
      setModal({
        isOpen: true,
        title,
        message: errorMessage,
        icon,
        actionButton: {
          text: '새로고침',
          onClick: () => window.location.reload()
        }
      });
      return false;
    } finally {
      setIsCheckingAccess(false); // 중복 요청 방지 상태 리셋
    }
  };

  // 시작하기 버튼 핸들러
  const handleStartClick = async () => {
    // 접근 권한 체크 중이면 무시
    if (isCheckingAccess) {
      console.log('접근 권한 체크 중 - 버튼 클릭 무시');
      return;
    }
    
    if (!isLoggedIn) {
      setModal({
        isOpen: true,
        title: '로그인 필요',
        message: '포춘쿠키 서비스를 이용하려면 로그인이 필요합니다.',
        icon: '🔑'
      });
      return;
    }

    // 사용자 ID 유효성 체크
    if (!user?.id) {
      console.error('사용자 ID가 없음:', { user, isLoggedIn });
      setModal({
        isOpen: true,
        title: '사용자 정보 오류',
        message: '사용자 정보를 불러올 수 없습니다.\n\n다시 로그인해 주세요.',
        icon: '👤'
      });
      return;
    }

    console.log('시작하기 버튼 클릭 - 접근 권한 체크 시작:', { 
      userId: user.id, 
      userSchool: user.school,
      userStatus: user.status,
      isAdmin: user.is_admin
    });

    // 먼저 접근 권한 체크 (이미 사용했는지 확인)
    const canAccess = await checkAccessPermission();
    
    // 이미 사용했거나 다른 제한에 걸리면 해당 모달이 이미 표시됨
    if (!canAccess) {
      return;
    }
    
    // 관리자는 바로 이동 (일일 제한 없음)
    if (user.is_admin) {
      console.log('관리자 - 사전 안내 모달 생략하고 바로 이동');
      navigate('/role-select');
      return;
    }
    
    // 일반 사용자는 사전 안내 모달 표시
    setModal({
      isOpen: true,
      title: '포춘쿠키 이용 안내',
      message: '하루에 한 번만 사용 가능합니다.\n\n포춘쿠키를 받으시겠어요? 🍪',
      icon: '💡',
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
    <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
      <div className={`text-center transform transition-all duration-1000 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        {/* 메인 로고/제목 */}
        <div className="mb-12">
          <h1 
            className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 bg-clip-text text-transparent mb-6 pb-16 pt-3 leading-relaxed"
            style={{ fontFamily: "Pacifico, serif" }}
          >
            fortune cookie
          </h1>
          <div className="flex justify-center mb-6">
            <div className="text-[6rem] md:text-[8rem] lg:text-[9rem] xl:text-[10rem] animate-bounce">🥠</div>
          </div>
        </div>
        
        {/* 소개 카드 */}
        <Card className="max-w-3xl mx-auto p-6 md:p-7 lg:p-8 mb-8" glow>
          <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-4">
            당신만의 맞춤 운세를 확인해보세요
          </h2>

          {/* 특징 리스트 */}
          <div className="space-y-4 mb-7">
            <div className="flex items-center space-x-3 text-amber-600">
              <i className="ri-user-star-line w-6 h-6 md:w-7 md:h-7 flex items-center justify-center"></i>
              <span className="text-base md:text-lg lg:text-xl font-medium">역할별 맞춤 상담</span>
            </div>
            <div className="flex items-center space-x-3 text-orange-600">
              <i className="ri-magic-line w-6 h-6 md:w-7 md:h-7 flex items-center justify-center"></i>
              <span className="text-base md:text-lg lg:text-xl font-medium">AI 포춘쿠키 생성</span>
            </div>
            <div className="flex items-center space-x-3 text-pink-600">
              <i className="ri-share-line w-6 h-6 md:w-7 md:h-7 flex items-center justify-center"></i>
              <span className="text-base md:text-lg lg:text-xl font-medium">결과 공유 가능</span>
            </div>
          </div>
        </Card>
        
        {/* 시작 버튼 */}
        <div className="space-y-4">
          <Button 
            size="md"
            onClick={handleStartClick}
            disabled={isCheckingAccess}
            className={`px-8 py-4 md:px-10 md:py-5 text-base md:text-lg lg:text-xl shadow-xl ${
              isCheckingAccess 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:shadow-amber-300/50'
            }`}
          >
            <span className="flex items-center space-x-2">
              <span>{isCheckingAccess ? '권한 확인 중...' : '운세보기 시작하기'}</span>
              {isCheckingAccess ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <i className="ri-arrow-right-line text-lg md:text-xl"></i>
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
        icon={modal.icon}
        actionButton={modal.actionButton}
        cancelButtonText={modal.cancelButtonText}
      />
    </div>
  );
}