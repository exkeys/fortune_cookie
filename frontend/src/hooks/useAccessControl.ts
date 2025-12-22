import { useState, useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { apiFetch } from '../utils/apiClient';

interface ModalConfig {
  title: string;
  message: string;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
  cancelButtonText?: string;
  variant?: 'default' | 'dailyLimit';
  nextAvailableAt?: string | null;
}

interface UseAccessControlOptions {
  userId: string | undefined;
  navigate: NavigateFunction;
  onShowModal: (config: ModalConfig) => void;
  onCloseModal?: () => void;
}

export function useAccessControl({ userId, navigate, onShowModal, onCloseModal }: UseAccessControlOptions) {
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);

  const checkAccessPermission = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    
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
        
        // AccessModal의 iOS 스타일에서 메시지 자동 처리 (SVG 아이콘 사용)
        onShowModal({
          title: '서버 연결 실패',
          message: '',
          actionButton: {
            text: '새로고침',
            onClick: () => window.location.reload()
          }
        });
        return false;
      }
      
      const data = await response.json();
      
      // 접근 불가능한 경우
      if (!data.canAccess) {
        if (data.reason?.includes('차단된')) {
          // 차단된 계정은 항상 /account-banned 페이지로 리다이렉트
          navigate('/account-banned');
          return false;
        }
        
        // 모든 케이스를 '이용 기간 미설정' 초록색 UI로 통합
        // 학교명 추출 시도
        let schoolName = '해당 학교';
        if (data.reason?.includes('학교 정보가 설정되지')) {
          // "학교 정보가 설정되지 않았습니다" 형식에서 학교명 추출 시도
          const match = data.reason.match(/(.+?)의 학교 정보가/);
          if (match) {
            schoolName = match[1];
          }
        } else if (data.reason?.includes('이용 기간이 설정되지')) {
          const schoolMatch = data.reason.match(/(.+)의 이용 기간이/);
          if (schoolMatch) {
            schoolName = schoolMatch[1];
          }
        } else if (data.reason?.includes('이용 기간(') && data.reason.includes('이 아닙니다')) {
          const periodMatch = data.reason.match(/(.+)의 이용 기간\(/);
          if (periodMatch) {
            schoolName = periodMatch[1];
          }
        } else if (data.reason) {
          // 기타 경우: reason에서 학교명 추출 시도
          const match = data.reason.match(/(.+?)의/);
          if (match) {
            schoolName = match[1];
          }
        }
        
        // AccessModal의 초록색 UI 사용 (학교명만 message에 포함하여 추출)
        onShowModal({
          title: '이용 기간 미설정',
          message: `${schoolName}의 포춘쿠키 서비스 이용 기간이 아직 설정되지 않았습니다.`,
          actionButton: undefined
        });
        return false;
      }
      
      // 일일 사용 제한에 걸린 경우 (일일 제한 스타일 모달)
      if (!data.canUse) {
        const nextAvailableAt = (data as any).nextAvailableAt || null;
        
        onShowModal({
          title: '오늘의 포춘쿠키를 이미 받으셨어요!',
          message: '', // 일일 제한 스타일에서는 메시지 미사용
          actionButton: {
            text: '나의 기록 보기',
            onClick: () => {
              if (onCloseModal) {
                onCloseModal();
              }
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
      
      // AccessModal의 iOS 스타일 에러 처리에 맞춰 title만 설정
      let title = '서버 연결 실패'; // 기본값: AccessModal의 isApiError에서 처리
      
      if (error instanceof Error && error.message && !(error instanceof TypeError)) {
        // JavaScript 오류: AccessModal의 isJavaScriptError에서 처리
        title = 'JavaScript 오류';
      }
      
      onShowModal({
        title,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        actionButton: {
          text: '새로고침',
          onClick: () => window.location.reload()
        }
      });
      return false;
    } finally {
      setIsCheckingAccess(false); // 중복 요청 방지 상태 리셋
    }
  }, [userId, navigate, onShowModal, isCheckingAccess, onCloseModal]);

  return {
    checkAccessPermission,
    isCheckingAccess
  };
}

