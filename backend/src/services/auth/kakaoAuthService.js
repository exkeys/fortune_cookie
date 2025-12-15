import axios from 'axios';
import { supabase, supabaseAdmin } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { ExternalServiceError, DatabaseError } from '../../utils/errors.js';
import { AccountService } from './accountService.js';

export class KakaoAuthService {
  // 카카오 인가 코드로 accessToken 받기
  static async getKakaoAccessToken(code, redirectUri) {
    // 카카오 REST API 키만 사용
    const API_KEY = process.env.KAKAO_REST_API_KEY;
    
    if (!API_KEY) {
      throw new ExternalServiceError('KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다');
    }
    
    // redirect_uri 정규화 (trailing slash 제거, 공백 제거)
    const normalizedRedirectUri = redirectUri?.trim().replace(/\/$/, '');
    
    try {
      if (!code) {
        throw new ExternalServiceError('인가 코드가 제공되지 않았습니다');
      }
      
      if (!normalizedRedirectUri) {
        throw new ExternalServiceError('리디렉션 URI가 제공되지 않았습니다');
      }
      
      logger.info('카카오 인가 코드로 accessToken 요청', { 
        code: code ? '있음' : '없음', 
        redirectUri: normalizedRedirectUri,
        usingKeyPrefix: API_KEY.substring(0, 8) + '...'
      });
      
      // 카카오 토큰 발급 API 호출
      const CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET || '';
      
      const requestData = {
          grant_type: 'authorization_code',
        client_id: API_KEY,
        redirect_uri: normalizedRedirectUri,
          code: code,
      };
      
      // 클라이언트 시크릿이 설정되어 있으면 추가
      if (CLIENT_SECRET) {
        requestData.client_secret = CLIENT_SECRET;
      }

      logger.info('카카오 토큰 요청 데이터', {
        grant_type: requestData.grant_type,
        client_id: API_KEY.substring(0, 8) + '...',
        redirect_uri: requestData.redirect_uri,
        redirect_uri_length: requestData.redirect_uri.length,
        code: code ? '있음' : '없음',
        code_length: code?.length,
        has_client_secret: !!CLIENT_SECRET
      });
      
      // 카카오 개발자 콘솔 설정 확인 안내
      logger.info('💡 카카오 개발자 콘솔에서 다음 redirect_uri가 등록되어 있는지 확인하세요:', {
        redirect_uri: normalizedRedirectUri,
        note: '카카오 개발자 콘솔 > 내 애플리케이션 > 앱 설정 > 플랫폼 > Web 플랫폼 > Redirect URI에 정확히 일치하는 값이 등록되어 있어야 합니다.'
      });

      // 카카오 API는 form-urlencoded 형식을 요구하므로 URLSearchParams로 변환
      const formParams = new URLSearchParams();
      formParams.append('grant_type', requestData.grant_type);
      formParams.append('client_id', requestData.client_id);
      formParams.append('redirect_uri', requestData.redirect_uri);
      formParams.append('code', requestData.code);
      
      // 클라이언트 시크릿이 있으면 추가
      if (requestData.client_secret) {
        formParams.append('client_secret', requestData.client_secret);
      }

      logger.info('카카오 토큰 요청 전송', {
        url: 'https://kauth.kakao.com/oauth/token',
        hasFormParams: true,
        formParamsLength: formParams.toString().length
      });

      let tokenResponse;
      try {
        tokenResponse = await axios.post(
          'https://kauth.kakao.com/oauth/token',
          formParams.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
          },
        }
      );
      } catch (axiosError) {
        logger.error('카카오 API axios 요청 실패', {
          error: axiosError.message,
          response: axiosError.response?.data,
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          requestData: {
            grant_type: requestData.grant_type,
            client_id: requestData.client_id.substring(0, 8) + '...',
            redirect_uri: requestData.redirect_uri,
            code: requestData.code ? '있음' : '없음'
          }
        });
        throw axiosError;
      }

      const accessToken = tokenResponse.data.access_token;
      if (!accessToken) {
        logger.error('카카오 accessToken 응답에 토큰 없음', tokenResponse.data);
        throw new ExternalServiceError('카카오 accessToken을 받을 수 없습니다');
      }

      logger.info('카카오 accessToken 발급 성공');
      return accessToken;
    } catch (error) {
      logger.error('카카오 accessToken 발급 실패', {
        error: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        responseHeaders: error.response?.headers,
        redirectUri
      });
      
      if (error.response) {
        const errorData = error.response.data;
        const errorDescription = errorData?.error_description || errorData?.error || error.message;
        
        logger.error('카카오 API 에러 상세', {
          error: errorDescription,
          errorCode: errorData?.error_code,
          status: error.response.status,
          requestRedirectUri: normalizedRedirectUri,
          requestClientId: API_KEY.substring(0, 8) + '...'
        });
        
        // rate limit 에러인 경우 특별 처리 (블랙리스트 추가 비활성화 - 개발 중)
        if (errorDescription && (
          errorDescription.includes('rate limit') || 
          errorDescription.includes('too many requests') ||
          error.response.status === 429
        )) {
          logger.error('카카오 API rate limit 에러', {
            codePrefix: code.substring(0, 10) + '...',
            redirectUri: normalizedRedirectUri,
            message: '같은 인가 코드로 중복 요청이 발생했거나, 단기간에 너무 많은 요청이 발생했습니다'
          });
          
          throw new ExternalServiceError('카카오 토큰 발급 실패: token request rate limit exceeded. 잠시 후 다시 시도해주세요.');
        }
        
        // "Bad client credentials" 에러인 경우 상세 안내
        if (errorDescription && errorDescription.includes('Bad client credentials')) {
          logger.error('❌ Bad client credentials 에러 해결 방법:', {
            step1: '카카오 개발자 콘솔(https://developers.kakao.com)에서 확인:',
            step2: '1. 내 애플리케이션 > 앱 설정 > 플랫폼 > Web 플랫폼 > Redirect URI에 다음이 등록되어 있는지 확인:',
            redirect_uri: normalizedRedirectUri,
            step3: '2. 앱 키에서 REST API 키를 확인하고, 백엔드 .env 파일에 KAKAO_REST_API_KEY로 설정',
            current_redirect_uri: normalizedRedirectUri,
            note: 'redirect_uri는 정확히 일치해야 하며, http://localhost:3000/oauth-callback 형식이어야 합니다'
          });
        }
        
        throw new ExternalServiceError(`카카오 토큰 발급 실패: ${errorDescription}`);
      }
      throw new ExternalServiceError(`카카오 토큰 발급 실패: ${error.message}`);
    }
  }

  // 카카오 로그인
  static async kakaoLogin(accessToken) {
    try {
      if (!accessToken) {
        throw new ExternalServiceError('카카오 액세스 토큰이 제공되지 않았습니다');
      }

      const kakaoRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      const kakaoUser = kakaoRes.data;
      
      if (!kakaoUser || !kakaoUser.kakao_account) {
        throw new ExternalServiceError('카카오 사용자 정보를 가져올 수 없습니다');
      }

      const email = kakaoUser.kakao_account?.email;
      const nickname = kakaoUser.kakao_account?.profile?.nickname;
      
      if (!email) {
        throw new ExternalServiceError('카카오 이메일 정보를 가져올 수 없습니다');
      }
      
      // 보안 체크 병렬 실행
      const [bannedCheckResult, restrictionResult, existingUserResult] = await Promise.all([
        supabase
        .from('users')
        .select('id, email, status')
        .eq('email', email)
        .eq('status', 'banned')
          .maybeSingle(),
        
        AccountService.checkDeletionRestriction(email),
        
        supabase
          .from('users')
          .select('id, created_at, status, email, school, nickname, is_admin')
          .eq('email', email)
          .maybeSingle()
      ]);

      const bannedCheck = bannedCheckResult.data;
      const restriction = restrictionResult;
      const { data: existingUser, error: existingUserError } = existingUserResult;

      if (existingUserError) {
        logger.error('사용자 조회 실패', { email, error: existingUserError });
        throw new DatabaseError('사용자 정보 조회에 실패했습니다');
      }

      if (bannedCheck) {
        logger.error('밴된 사용자 차단', { email, userId: bannedCheck.id });
        throw new DatabaseError('계정이 차단되었습니다. 관리자에게 문의하세요.');
      }

      if (restriction && restriction.isRestricted) {
        logger.warn('재가입 제한 차단', { email });
        throw new DatabaseError(restriction.message || '탈퇴 후 24시간 내에는 재가입할 수 없습니다.');
      }

      if (existingUser && existingUser.status === 'banned') {
        throw new DatabaseError('계정이 차단되었습니다. 관리자에게 문의하세요.');
      }

      if (existingUser && existingUser.status === 'deleted') {
        throw new DatabaseError('탈퇴한 계정입니다.');
      }

      if (existingUser) {
        const { data, error } = await supabase
          .from('users')
          .update({
          nickname,
          last_login_at: new Date().toISOString()
          })
          .eq('id', existingUser.id)
        .select()
        .single();
      
      if (error) {
          logger.error('사용자 업데이트 실패', { error, userId: existingUser.id });
        throw new DatabaseError('사용자 정보 저장에 실패했습니다');
      }
      
      return { 
        userId: data.id, 
        email: data.email, 
        nickname: data.nickname,
        status: data.status,
          school: data.school || null,
          is_admin: data.is_admin || false,
          created_at: data.created_at
        };
      }

      // 신규 사용자 생성
      let authUser = null;
      
      const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true, // 이메일 인증 완료 처리
        user_metadata: {
          nickname: nickname,
          provider: 'kakao'
        }
      });

      if (authError) {
        if (authError.message?.includes('already registered') || 
            authError.message?.includes('already exists')) {
          const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
          const existingAuthUser = usersList?.users.find(u => u.email === email);
              
          if (existingAuthUser) {
            authUser = { user: existingAuthUser };
                } else {
                  throw new DatabaseError('사용자 계정을 찾을 수 없습니다');
          }
        } else {
          logger.error('auth.users 생성 실패', { error: authError, email });
          throw new DatabaseError(`사용자 계정 생성 실패: ${authError.message}`);
        }
      } else {
        authUser = newAuthUser;
      }

      if (!authUser?.user) {
        throw new DatabaseError('사용자 계정을 찾을 수 없습니다');
      }

      const currentTime = new Date().toISOString();
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{
        id: authUser.user.id,
        email,
        nickname,
        status: 'active',
        created_at: currentTime,
        updated_at: currentTime,
        last_login_at: currentTime
        }])
        .select()
        .single();

      if (insertError) {
        logger.error('사용자 생성 실패', { error: insertError, userId: authUser.user.id });
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw new DatabaseError('사용자 정보 저장에 실패했습니다');
      }

      return { 
        userId: newUser.id, 
        email: newUser.email, 
        nickname: newUser.nickname,
        status: newUser.status,
        school: newUser.school || null,
        is_admin: newUser.is_admin || false,
        created_at: newUser.created_at
      };
    } catch (error) {
      // 카카오 API 에러 처리
      if (error.response) {
        const errorStatus = error.response.status;
        const errorData = error.response.data;
        
        logger.error('카카오 API 에러', {
          status: errorStatus,
          errorData: errorData,
          errorMessage: errorData?.msg || errorData?.message || error.message,
          errorCode: errorData?.code,
          responseHeaders: error.response.headers
        });

        if (errorStatus === 401) {
          const errorMsg = errorData?.msg || errorData?.message || '카카오 인증에 실패했습니다';
          logger.error('카카오 인증 실패 (401)', { 
            errorMsg,
            errorCode: errorData?.code,
            accessTokenProvided: !!accessToken,
            accessTokenLength: accessToken?.length
          });
          
          if (errorMsg.includes('no authentication key') || errorMsg.includes('authentication key')) {
            throw new ExternalServiceError('카카오 액세스 토큰이 유효하지 않습니다. 다시 로그인해주세요.');
          }
          
        throw new ExternalServiceError('카카오 인증에 실패했습니다');
      }
      
        if (errorStatus === 400) {
          throw new ExternalServiceError(`카카오 API 요청 오류: ${errorData?.msg || errorData?.message || '잘못된 요청입니다'}`);
        }
      }

      // 네트워크 에러 등 기타 에러
      logger.error('카카오 로그인 예외', {
        error: error.message,
        stack: error.stack,
        hasResponse: !!error.response
      });
      
      throw error;
    }
  }
}

