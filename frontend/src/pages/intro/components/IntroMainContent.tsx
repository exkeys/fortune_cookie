import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../supabaseClient';
import Button from '../../../components/base/Button';
import Card from '../../../components/base/Card';
import AccessModal from '../../../components/feature/AccessModal';
import { apiFetch } from '../../../utils/apiClient';

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
  variant?: 'default' | 'dailyLimit'; // 모달 스타일 변형: dailyLimit은 일일 사용 제한 카운트다운 모달
  nextAvailableAt?: string | null; // 다음 이용 가능 시간 (ISO string, used_at 기준)
}

export default function IntroMainContent({ isLoggedIn }: IntroMainContentProps) {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    icon: ''
  });
  const [isCheckingAccess, setIsCheckingAccess] = useState(false); // 중복 요청 방지
  
  const handleLogin = async () => {
    try {
      await login('kakao');
    } catch (e) {
      console.error('로그인 실패:', e);
      setModal({
        isOpen: true,
        title: '로그인 실패',
        message: '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        icon: '⚠️'
      });
    }
  };
  
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // 접근 권한 체크 함수
  const checkAccessPermission = async () => {
    if (!user?.id) return false;
    
    // 중복 요청 방지
    if (isCheckingAccess) {
      return false;
    }
    
    setIsCheckingAccess(true);
    
    try {
      await supabase.auth.getSession();
      const response = await apiFetch(`/api/access-control/check-full-access`);
      
      if (!response.ok) {
        // 401 에러 처리
        if (response.status === 401) {
          try {
            const errorText = await response.text();
            let errorData: Record<string, unknown> = {};
            
            // JSON 파싱 시도
            try {
              errorData = JSON.parse(errorText) as Record<string, unknown>;
            } catch {
              // JSON이 아니면 빈 객체 유지
            }
            
            // DB에 deletion이 실제로 있는 경우에만 account-cooldown으로 리다이렉트
            if (errorData.isRestricted === true) {
              console.error('회원탈퇴 후 24시간 제한 (DB 확인됨), account-cooldown으로 리다이렉트');
              await supabase.auth.signOut();
              navigate('/account-cooldown');
              return false;
            }
          } catch (e) {
            // 에러 처리 실패 시 intro로 리다이렉트
            console.error('401 에러 처리 중 오류:', e);
          }
          
          // 그 외의 401 에러는 intro로 리다이렉트
          console.error('토큰 검증 실패, intro로 리다이렉트');
          await supabase.auth.signOut();
          navigate('/');
          return false;
        }
        
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
      
      // 접근 불가능한 경우
      if (!data.canAccess) {
        let icon = '🚫';
        let title = '서비스 이용 제한';
        let message = data.reason || '서비스 이용이 제한되었습니다.';
        let actionButton = undefined;
        
        if (data.reason?.includes('차단된')) {
          // 차단된 계정은 항상 /account-banned 페이지로 리다이렉트
          navigate('/account-banned');
          return false;
          
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
          
          icon = ''; // AccessModal에서 Calendar 아이콘을 사용하므로 이모지 불필요
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
      
      // 일일 사용 제한에 걸린 경우 (일일 제한 스타일 모달)
      if (!data.canUse) {
        const nextAvailableAt = (data as any).nextAvailableAt || null;
        
        setModal({
          isOpen: true,
          title: '오늘의 포춘쿠키를 이미 받으셨어요!',
          message: '', // 일일 제한 스타일에서는 메시지 미사용
          icon: '✨',
          actionButton: {
            text: '나의 기록 보기',
            onClick: () => {
              setModal(prev => ({ ...prev, isOpen: false }));
              navigate('/past-concerns');
            }
          },
          variant: 'dailyLimit', // 일일 제한 스타일 적용 (카운트다운 표시)
          nextAvailableAt // 다음 이용 가능 시간 전달
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
      return;
    }
    
    if (!isLoggedIn) {
      setModal({
        isOpen: true,
        title: '로그인 필요',
        message: '포춘쿠키 서비스를 이용하려면 로그인이 필요합니다.',
        icon: '🔐',
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
        message: '사용자 정보를 불러올 수 없습니다.\n\n다시 로그인해 주세요.',
        icon: '👤'
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
    if (user.is_admin) {
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
        icon={modal.icon}
        actionButton={modal.actionButton}
        cancelButtonText={modal.cancelButtonText}
        variant={modal.variant}
        nextAvailableAt={modal.nextAvailableAt}
      />
    </div>
  );
}