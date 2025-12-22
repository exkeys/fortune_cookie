import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { apiFetch } from '../../utils/apiClient';
import LoadingSpinner from '../../components/base/LoadingSpinner';
import { logger } from '../../utils/logger';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL에서 토큰 추출 (Supabase OAuth는 해시에 토큰을 포함)
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const error = hashParams.get('error') || searchParams.get('error');
        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');

        // 에러가 있으면 처리
        if (error) {
          console.error('OAuth 에러:', error, errorDescription);
          alert('로그인 실패: ' + (errorDescription || error));
          navigate('/');
          return;
        }

        // URL에서 토큰이 있으면 세션 설정
        let session;
        if (accessToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });

          if (sessionError) {
            console.error('세션 설정 에러:', sessionError);
            alert('로그인 실패: ' + sessionError.message);
            navigate('/');
            return;
          }

          session = sessionData.session;
          
          // URL 정리 (토큰 제거)
          window.history.replaceState({}, '', '/auth/callback');
        } else {
          // 토큰이 없으면 기존 세션 확인
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            console.error('세션 가져오기 에러:', sessionError);
            alert('로그인 실패: ' + sessionError.message);
            navigate('/');
            return;
          }

          session = sessionData.session;
        }

        // 백엔드 세션 생성 로직도 제거 (B 구조에서는 불필요)

        if (session?.user) {
          // 세션이 생성되었으면 사용자 정보를 백엔드와 동기화
          try {
            // 백엔드 API로 사용자 정보 동기화 (재가입 제한 체크 포함)
            const syncResponse = await apiFetch('/api/auth/sync-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                email: session.user.email,
                nickname: session.user.user_metadata?.nickname || session.user.user_metadata?.name || session.user.email?.split('@')[0]
              })
            });

            if (syncResponse.ok) {
              const syncResult = await syncResponse.json();
              
              // 프로필 캐시 저장
              if (syncResult.userId) {
                const profileCache = {
                  id: syncResult.userId,
                  email: syncResult.email,
                  nickname: syncResult.nickname,
                  status: syncResult.status || 'active',
                  school: syncResult.school || null,
                  is_admin: syncResult.is_admin || false,
                  created_at: syncResult.created_at || null,
                  cachedAt: Date.now()
                };
                localStorage.setItem(`user_profile_cache_${syncResult.userId}`, JSON.stringify(profileCache));
                
                // 신규 가입자인 경우 학교 선택 페이지로 리다이렉트
                const school = syncResult.school;
                if (!school || school === 'unknown' || school.trim() === '') {
                  window.history.replaceState({}, '', '/');
                  window.location.href = '/school-select';
                  return;
                }
              }
            }
          } catch (syncError) {
            // 동기화 실패해도 로그인은 진행 (이미 세션이 있음)
            logger.warn('사용자 정보 동기화 실패:', syncError);
          }

          // URL 정리 후 홈으로 이동
          window.history.replaceState({}, '', '/');
          window.location.href = '/';
        } else {
          // 세션이 없으면 에러
          console.error('세션이 생성되지 않았습니다');
          alert('로그인에 실패했습니다. 다시 시도해주세요.');
          navigate('/');
        }
      } catch (error) {
        console.error('예외 발생:', error);
        alert('로그인 중 오류가 발생했습니다.');
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <LoadingSpinner 
      message="로그인 처리 중..." 
      subMessage="잠시만 기다려주세요"
    />
  );
}



