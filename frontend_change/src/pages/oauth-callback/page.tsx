import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/base/LoadingSpinner';
import { logger } from '../../utils/logger';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // 🔥 중복 실행 방지 플래그 체크 (가장 먼저)
    const processed = sessionStorage.getItem('oauth_processed');
    if (processed) {
      logger.log('[OAuthCallback] ⏭️ 이미 처리됨 - 중복 실행 방지');
      return; // 두번째 실행 막기
    }
    
    // 플래그 설정 (처리 시작)
    sessionStorage.setItem('oauth_processed', 'true');
    // Suspense fallback에 상태 변경 알림
    window.dispatchEvent(new CustomEvent('oauth-status-change', { detail: { isProcessing: true } }));
      logger.log('[OAuthCallback] ✅ 처리 시작 - 플래그 설정');

    const handleOAuthCallback = async () => {
      logger.log('[OAuthCallback] 🚀 로그인 프로세스 시작');
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // 에러 응답 파싱 헬퍼 함수
      const parseErrorResponse = async (response: Response) => {
        let errorData;
        const contentType = response.headers.get('content-type');
        
        try {
          if (contentType?.includes('application/json')) {
            errorData = await response.json();
          } else {
            const text = await response.text();
            errorData = { error: text || `HTTP ${response.status}` };
          }
        } catch {
          errorData = { error: `HTTP ${response.status}` };
        }
        
        return errorData;
      };

      try {
        // 에러 체크 (가장 먼저)
        if (error) {
          alert('로그인 에러: ' + (errorDescription || error));
          navigate('/');
          return;
        }

        // 인가 코드 체크
        if (!code) {
          alert('인가 코드가 없습니다.');
          navigate('/');
          return;
        }

        // URL 정리 (재요청 방지)
        window.history.replaceState({}, '', '/oauth-callback');

        // 1단계: 토큰 교환
        logger.log('[OAuthCallback] 📝 1단계: 토큰 교환 시작');
        let response;
        try {
          const baseRedirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/oauth-callback`;
          const redirectUri = baseRedirectUri.replace(/\/$/, '');
          
          response = await fetch('/api/auth/kakao/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri }),
          });
        } catch (fetchError: any) {
          console.error('[OAuthCallback] ❌ 토큰 교환 네트워크 오류:', fetchError);
          throw new Error(`네트워크 오류: ${fetchError?.message || fetchError}`);
        }

        if (!response.ok) {
          const errorData = await parseErrorResponse(response);
          console.error('[OAuthCallback] ❌ 토큰 교환 실패:', { status: response.status, error: errorData });
          throw new Error(errorData.error || errorData.message || '토큰 교환 실패');
        }

        const { accessToken } = await response.json();
        if (!accessToken) {
          console.error('[OAuthCallback] ❌ 액세스 토큰 없음');
          throw new Error('액세스 토큰이 없습니다');
        }
        logger.log('[OAuthCallback] ✅ 토큰 교환 완료');

        // 2단계: 로그인 (재가입 제한 체크 포함)
        logger.log('[OAuthCallback] 🔐 2단계: 로그인 API 호출 시작 (재가입 제한 체크 포함)');
        const loginResponse = await fetch('/api/auth/kakao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken }),
        });
        
        logger.log('[OAuthCallback] 📊 로그인 API 응답:', { 
          status: loginResponse.status, 
          ok: loginResponse.ok,
          statusText: loginResponse.statusText 
        });

        if (!loginResponse.ok) {
          const errorData = await parseErrorResponse(loginResponse);
          console.error('[OAuthCallback] ❌ 로그인 API 실패:', { 
            status: loginResponse.status, 
            errorData,
            isRestricted: errorData.isRestricted,
            error: errorData.error 
          });

          // 재가입 제한 체크 (즉시 리다이렉트, 로딩 화면 표시 안 함)
          if (errorData.isRestricted === true) {
            logger.log('[OAuthCallback] ⏰ 재가입 제한 감지 - account-cooldown으로 리다이렉트');
            logger.log('[OAuthCallback] 🔄 플래그 설정: auth_check_completed=true, auth_check_result=restricted');
            setShowLoading(false);
            
            // Supabase 세션 정리 (useAuth가 세션을 찾지 못하도록)
            try {
              const { supabase } = await import('../../supabaseClient');
              await supabase.auth.signOut();
              logger.log('[OAuthCallback] 🧹 Supabase 세션 정리 완료');
            } catch (e) {
              logger.error('[OAuthCallback] ❌ Supabase 세션 정리 실패:', e);
            }
            
            // useAuth에서 재체크 방지를 위한 플래그 설정
            sessionStorage.setItem('auth_check_completed', 'true');
            sessionStorage.setItem('auth_check_result', 'restricted');
            // 중복 실행 방지 플래그는 유지 (리다이렉트 후에도 재실행 방지)
            // Suspense fallback에 상태 변경 알림 (리다이렉트 전)
            window.dispatchEvent(new CustomEvent('oauth-status-change', { detail: { isProcessing: false } }));
            // 즉시 리다이렉트
            logger.log('[OAuthCallback] 🔀 /account-cooldown으로 리다이렉트 시작');
            window.location.replace('/account-cooldown');
            return;
          }

          // 차단된 사용자 체크 (즉시 리다이렉트, 로딩 화면 표시 안 함)
          if (errorData.error?.includes('차단')) {
            logger.log('[OAuthCallback] 🚫 차단된 사용자 감지 - account-banned으로 리다이렉트');
            logger.log('[OAuthCallback] 🔄 플래그 설정: auth_check_completed=true, auth_check_result=banned');
            setShowLoading(false);
            
            // Supabase 세션 정리 (useAuth가 세션을 찾지 못하도록)
            try {
              const { supabase } = await import('../../supabaseClient');
              await supabase.auth.signOut();
              logger.log('[OAuthCallback] 🧹 Supabase 세션 정리 완료');
            } catch (e) {
              logger.error('[OAuthCallback] ❌ Supabase 세션 정리 실패:', e);
            }
            
            // useAuth에서 재체크 방지를 위한 플래그 설정
            sessionStorage.setItem('auth_check_completed', 'true');
            sessionStorage.setItem('auth_check_result', 'banned');
            // 중복 실행 방지 플래그는 유지 (리다이렉트 후에도 재실행 방지)
            // Suspense fallback에 상태 변경 알림 (리다이렉트 전)
            window.dispatchEvent(new CustomEvent('oauth-status-change', { detail: { isProcessing: false } }));
            // 즉시 리다이렉트
            logger.log('[OAuthCallback] 🔀 /account-banned으로 리다이렉트 시작');
            window.location.replace('/account-banned');
            return;
          }

          console.error('[OAuthCallback] ❌ 알 수 없는 로그인 실패:', errorData);
          throw new Error(
            errorData.error || 
            errorData.message || 
            `로그인에 실패했습니다 (${loginResponse.status})`
          );
        }

        const loginResult = await loginResponse.json();
        logger.log('[OAuthCallback] ✅ 로그인 성공:', { 
          userId: loginResult.userId, 
          email: loginResult.email 
        });

        if (!loginResult.userId || !loginResult.email) {
          console.error('[OAuthCallback] ❌ 사용자 정보 없음');
          throw new Error('사용자 정보가 없습니다');
        }

        // 3단계: 프로필 캐시 저장 (즉시, 세션 설정 전에 먼저 저장)
        logger.log('[OAuthCallback] 💾 3단계: 프로필 캐시 저장');
        const profileCache = {
          id: loginResult.userId,
          email: loginResult.email ?? '',
          nickname: loginResult.nickname ?? loginResult.email?.split('@')[0] ?? '사용자',
          status: loginResult.status ?? 'active',
          school: loginResult.school && loginResult.school !== 'unknown' 
            ? loginResult.school 
            : null,
          is_admin: loginResult.is_admin ?? false,
          created_at: loginResult.created_at ?? null,
          cachedAt: Date.now()
        };
        
        localStorage.setItem(`user_profile_cache_${loginResult.userId}`, JSON.stringify(profileCache));

        // 추가 데이터 저장 (settings 페이지용)
        if (loginResult.email) {
          localStorage.setItem('user_email', loginResult.email);
        }

        if (loginResult.school && 
            loginResult.school !== 'unknown' && 
            loginResult.school.trim() !== '') {
          localStorage.setItem('user_school', loginResult.school);
        }

        if (loginResult.created_at) {
          localStorage.setItem('user_created_at', loginResult.created_at);
        }

        // 4단계: Supabase 세션 설정 (완료될 때까지 대기)
        logger.log('[OAuthCallback] 🔑 4단계: Supabase 세션 설정');
        if (loginResult.accessToken && loginResult.refreshToken) {
          try {
            const { supabase } = await import('../../supabaseClient');
            const { data: { session }, error: sessionError } = await supabase.auth.setSession({
              access_token: loginResult.accessToken,
              refresh_token: loginResult.refreshToken
            });

            if (sessionError || !session) {
              console.error('[OAuthCallback] ❌ 세션 설정 실패:', {
                error: sessionError,
                userId: loginResult.userId
              });
              // 세션 설정 실패해도 프로필 캐시는 저장되었으므로 계속 진행
            } else {
              logger.log('[OAuthCallback] ✅ Supabase 세션 설정 완료');
            }
          } catch (importError) {
            logger.error('[OAuthCallback] ❌ Supabase import 실패:', importError);
            // import 실패는 무시 (이미 프로필 캐시는 저장됨)
          }
        }

        // 5단계: 로그인 성공 플래그 설정 (useAuth에서 재체크 방지)
        logger.log('[OAuthCallback] 🏁 5단계: 로그인 성공 플래그 설정');
        sessionStorage.setItem('auth_check_completed', 'true');
        sessionStorage.setItem('auth_check_result', 'success');
        logger.log('[OAuthCallback] 🔄 플래그 설정: auth_check_completed=true, auth_check_result=success');
        
        // 모든 처리가 완료되었으므로 로그인 처리 플래그 제거
        sessionStorage.removeItem('login_processing');
        
        // 중복 실행 방지 플래그 정리
        sessionStorage.removeItem('oauth_processed');
        // Suspense fallback에 상태 변경 알림
        window.dispatchEvent(new CustomEvent('oauth-status-change', { detail: { isProcessing: false } }));
        
        // 홈으로 이동
        logger.log('[OAuthCallback] 🏠 홈으로 이동');
        window.location.href = '/';

      } catch (error: any) {
        const errorMessage = error?.message || '알 수 없는 오류';
        console.error('[OAuthCallback] ❌ 전체 프로세스 에러:', error);
        
        // 로그인 처리 플래그 정리
        sessionStorage.removeItem('login_processing');
        sessionStorage.removeItem('auth_check_completed');
        sessionStorage.removeItem('auth_check_result');
        // 중복 실행 방지 플래그 정리
        sessionStorage.removeItem('oauth_processed');
        // Suspense fallback에 상태 변경 알림
        window.dispatchEvent(new CustomEvent('oauth-status-change', { detail: { isProcessing: false } }));
        logger.log('[OAuthCallback] 🧹 플래그 정리 완료');
        
        // Supabase 세션 정리
        try {
          const { supabase } = await import('../../supabaseClient');
          await supabase.auth.signOut();
        } catch {}
        
        setShowLoading(false);
        alert('로그인 중 오류: ' + errorMessage);
        navigate('/');
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  // 재가입 제한이나 차단된 사용자인 경우 로딩 화면 표시 안 함
  if (!showLoading) {
    return null;
  }

  return (
    <LoadingSpinner 
      message="로그인 처리 중..." 
      subMessage="잠시만 기다려주세요"
    />
  );
}

