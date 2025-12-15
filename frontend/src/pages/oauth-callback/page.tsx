import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/base/LoadingSpinner';
import { logger } from '../../utils/logger';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // 중복 실행 방지
    const processed = sessionStorage.getItem('oauth_processed');
    if (processed) {
      logger.log('[OAuthCallback] 이미 처리됨');
      return;
    }
    
    sessionStorage.setItem('oauth_processed', 'true');
    window.dispatchEvent(new CustomEvent('oauth-status-change', { detail: { isProcessing: true } }));

    const handleOAuthCallback = async () => {
      logger.log('[OAuthCallback] 로그인 시작');
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // 에러 응답 파싱
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
        if (error) {
          alert('로그인 에러: ' + (errorDescription || error));
          navigate('/');
          return;
        }

        if (!code) {
          alert('인가 코드가 없습니다.');
          navigate('/');
          return;
        }

        window.history.replaceState({}, '', '/oauth-callback');
        let loginResponse;
        try {
          const baseRedirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI || `${window.location.origin}/oauth-callback`;
          const redirectUri = baseRedirectUri.replace(/\/$/, '');
          
          loginResponse = await fetch('/api/auth/kakao/login-direct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri }),
          });
        } catch (fetchError: unknown) {
          logger.error('[OAuthCallback] 통합 로그인 네트워크 오류:', fetchError);
          const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
          throw new Error(`네트워크 오류: ${errorMessage}`);
        }

        if (!loginResponse.ok) {
          const errorData = await parseErrorResponse(loginResponse);

          if (errorData.isRestricted === true) {
            setShowLoading(false);
            
            try {
              const { supabase } = await import('../../supabaseClient');
              await supabase.auth.signOut();
            } catch (e) {
              logger.error('[OAuthCallback] 세션 정리 실패:', e);
            }
            
            sessionStorage.setItem('auth_check_completed', 'true');
            sessionStorage.setItem('auth_check_result', 'restricted');
            window.dispatchEvent(new CustomEvent('oauth-status-change', { detail: { isProcessing: false } }));
            window.location.replace('/account-cooldown');
            return;
          }

          if (errorData.error?.includes('차단')) {
            setShowLoading(false);
            
            try {
              const { supabase } = await import('../../supabaseClient');
              await supabase.auth.signOut();
            } catch (e) {
              logger.error('[OAuthCallback] 세션 정리 실패:', e);
            }
            
            sessionStorage.setItem('auth_check_completed', 'true');
            sessionStorage.setItem('auth_check_result', 'banned');
            window.dispatchEvent(new CustomEvent('oauth-status-change', { detail: { isProcessing: false } }));
            window.location.replace('/account-banned');
            return;
          }

          throw new Error(
            errorData.error || 
            errorData.message || 
            `로그인에 실패했습니다 (${loginResponse.status})`
          );
        }

        const loginResult = await loginResponse.json();

        if (!loginResult.userId || !loginResult.email) {
          throw new Error('사용자 정보가 없습니다');
        }
        const profileCache = {
          id: loginResult.userId,
          email: loginResult.email ?? '',
          nickname: loginResult.nickname ?? loginResult.email?.split('@')[0] ?? '사용자',
          status: loginResult.status ?? 'active',
          school: loginResult.school && loginResult.school !== 'unknown' ? loginResult.school : null,
          is_admin: loginResult.is_admin ?? false,
          created_at: loginResult.created_at ?? null,
          cachedAt: Date.now()
        };
        
        localStorage.setItem(`user_profile_cache_${loginResult.userId}`, JSON.stringify(profileCache));

        if (loginResult.email) {
          localStorage.setItem('user_email', loginResult.email);
        }

        if (loginResult.school && loginResult.school !== 'unknown' && loginResult.school.trim() !== '') {
          localStorage.setItem('user_school', loginResult.school);
        }

        if (loginResult.created_at) {
          localStorage.setItem('user_created_at', loginResult.created_at);
        }

        if (loginResult.accessToken && loginResult.refreshToken) {
          try {
            const { supabase } = await import('../../supabaseClient');
            await supabase.auth.setSession({
              access_token: loginResult.accessToken,
              refresh_token: loginResult.refreshToken
            });
          } catch (e) {
            logger.error('[OAuthCallback] 세션 설정 실패:', e);
          }
        }

        sessionStorage.setItem('auth_check_completed', 'true');
        sessionStorage.setItem('auth_check_result', 'success');
        sessionStorage.removeItem('login_processing');
        sessionStorage.removeItem('oauth_processed');
        window.dispatchEvent(new CustomEvent('oauth-status-change', { detail: { isProcessing: false } }));
        
        window.location.href = '/';

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        logger.error('[OAuthCallback] 로그인 에러:', error);
        
        sessionStorage.removeItem('login_processing');
        sessionStorage.removeItem('auth_check_completed');
        sessionStorage.removeItem('auth_check_result');
        sessionStorage.removeItem('oauth_processed');
        window.dispatchEvent(new CustomEvent('oauth-status-change', { detail: { isProcessing: false } }));
        
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

