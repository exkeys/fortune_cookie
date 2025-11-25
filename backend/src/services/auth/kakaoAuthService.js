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
      logger.info('카카오 로그인 요청', { 
        hasAccessToken: !!accessToken,
        accessTokenPrefix: accessToken ? accessToken.substring(0, 20) + '...' : '없음',
        accessTokenLength: accessToken?.length
      });
      
      if (!accessToken) {
        throw new ExternalServiceError('카카오 액세스 토큰이 제공되지 않았습니다');
      }
      
      // 카카오 API로 사용자 정보 가져오기
      logger.info('카카오 사용자 정보 조회 시작', {
        url: 'https://kapi.kakao.com/v2/user/me',
        hasAuthorizationHeader: true
      });

      const kakaoRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
      });
      
      logger.info('카카오 API 응답 받음', {
        status: kakaoRes.status,
        hasData: !!kakaoRes.data
      });
      
      const kakaoUser = kakaoRes.data;
      
      if (!kakaoUser || !kakaoUser.kakao_account) {
        logger.error('카카오 사용자 정보 구조가 올바르지 않음', kakaoUser);
        throw new ExternalServiceError('카카오 사용자 정보를 가져올 수 없습니다');
      }

      const email = kakaoUser.kakao_account?.email;
      const nickname = kakaoUser.kakao_account?.profile?.nickname;
      
      if (!email) {
        logger.error('카카오 이메일 정보 없음', kakaoUser);
        throw new ExternalServiceError('카카오 이메일 정보를 가져올 수 없습니다');
      }
      
      logger.info('카카오 사용자 정보 조회 성공', { 
        email, 
        nickname: nickname || '없음',
        userId: kakaoUser.id
      });
      
      // 먼저 해당 이메일로 밴된 사용자가 있는지 확실히 체크
      const { data: bannedCheck, error: bannedCheckError } = await supabase
        .from('users')
        .select('id, email, status')
        .eq('email', email)
        .eq('status', 'banned')
        .maybeSingle();

      logger.info('밴된 사용자 체크 결과', { 
        email,
        bannedCheck,
        bannedCheckError,
        isBanned: !!bannedCheck 
      });

      // 밴된 사용자면 즉시 차단
      if (bannedCheck) {
        logger.error('🚫 밴된 사용자 로그인 시도 차단 🚫', { 
          email, 
          userId: bannedCheck.id,
          status: bannedCheck.status,
          timestamp: new Date().toISOString(),
          message: '밴된 계정이 로그인을 시도했습니다!'
        });
        throw new DatabaseError('계정이 차단되었습니다. 관리자에게 문의하세요.');
      }

      // 1. 재가입 제한 체크 (밴/deleted처럼 DB 상태 직접 확인)
      const restriction = await AccountService.checkDeletionRestriction(email);
      if (restriction && restriction.isRestricted) {
        logger.warn('재가입 제한으로 로그인 차단', { email });
        throw new DatabaseError(restriction.message || '탈퇴 후 24시간 내에는 재가입할 수 없습니다.');
      }

      // 2. 기존 사용자 정보 조회
      const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('id, created_at, status, email')
        .eq('email', email)
        .maybeSingle();

      // 사용자 조회 결과 상세 로깅
      logger.info('기존 사용자 조회 상세 결과', { 
        email, 
        existingUser,
        existingUserError,
        hasExistingUser: !!existingUser,
        existingUserStatus: existingUser?.status,
        existingUserId: existingUser?.id
      });
      
      // 3. 기존 사용자 상태 체크
      if (existingUser && existingUser.status === 'banned') {
        logger.warn('밴된 사용자 로그인 차단', { email, status: existingUser.status });
        throw new DatabaseError('계정이 차단되었습니다. 관리자에게 문의하세요.');
      }

      if (existingUser && existingUser.status === 'deleted') {
        logger.warn('삭제된 사용자 로그인 차단', { email, status: existingUser.status });
        throw new DatabaseError('탈퇴한 계정입니다.');
      }

      // 기존 사용자인 경우 업데이트
      if (existingUser) {
        logger.info('🔄 기존 사용자 - 업데이트', { 
          email, 
          userId: existingUser.id,
          currentStatus: existingUser.status
        });

        // auth.users에 사용자가 있는지 확인
        let authUser = null;
        try {
          const { data: existingAuthUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(existingUser.id);
          
          if (getUserError || !existingAuthUser?.user) {
            // auth.users에 사용자가 없으면 생성
            logger.warn('기존 사용자가 auth.users에 없음 - auth.users에 생성 시도', { 
              userId: existingUser.id, 
              email,
              error: getUserError?.message 
            });
            
            const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
              id: existingUser.id, // 기존 ID 사용
              email: email,
              email_confirm: true,
              user_metadata: {
                nickname: nickname,
                provider: 'kakao'
              }
            });

            if (authError) {
              // 이미 존재하는 경우 다시 조회
              if (authError.message?.includes('already registered') || 
                  authError.message?.includes('already exists') ||
                  authError.message?.includes('User already registered')) {
                logger.info('auth.users에 이미 존재함 - 재조회', { userId: existingUser.id });
                const { data: retryAuthUser } = await supabaseAdmin.auth.admin.getUserById(existingUser.id);
                if (retryAuthUser?.user) {
                  authUser = retryAuthUser;
                }
              } else {
                logger.error('auth.users 생성 실패', { 
                  error: authError, 
                  userId: existingUser.id,
                  email 
                });
                throw new DatabaseError(`인증 사용자 생성에 실패했습니다: ${authError.message || '알 수 없는 오류'}`);
              }
            } else {
              authUser = newAuthUser;
              logger.info('auth.users에 기존 사용자 생성 성공', { 
                userId: existingUser.id, 
                email 
              });
            }
          } else {
            authUser = existingAuthUser;
            logger.info('auth.users에서 기존 사용자 확인', { 
              userId: existingUser.id, 
              email 
            });
          }
        } catch (authCheckError) {
          logger.error('auth.users 확인 중 오류', { 
            error: authCheckError, 
            userId: existingUser.id,
            email 
          });
          // auth.users 확인 실패해도 계속 진행 (기존 동작 유지)
        }

        const updateData = {
          nickname,
          last_login_at: new Date().toISOString()
        };

      const { data, error } = await supabase
        .from('users')
          .update(updateData)
          .eq('id', existingUser.id)
        .select()
        .single();
      
      if (error) {
          logger.error('기존 사용자 업데이트 실패', { 
            error,
            errorMessage: error?.message,
            errorCode: error?.code,
            errorDetails: error?.details,
            errorHint: error?.hint,
            userId: existingUser.id 
          });
        throw new DatabaseError('사용자 정보 저장에 실패했습니다');
      }
      
        logger.info('기존 사용자 업데이트 성공', { 
        userId: data.id, 
        email: data.email,
        status: data.status 
      });
      
      return { 
        userId: data.id, 
        email: data.email, 
        nickname: data.nickname,
        status: data.status,
        school: data.school || null
        };
      }

      // 신규 사용자인 경우 auth.users에 먼저 생성
      logger.info('✅ 신규 사용자 - auth.users에 생성 시작', { email });
      
      let authUser = null;
      
      // auth.users에 사용자 생성 시도 (이미 존재할 수 있으므로 에러 처리)
      logger.info('auth.users에 새 사용자 생성 시도', { email });
      
      const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true, // 이메일 인증 완료 처리
        user_metadata: {
          nickname: nickname,
          provider: 'kakao'
        }
      });

      if (authError) {
        // 이미 존재하는 사용자 에러인 경우
        if (authError.message?.includes('already registered') || 
            authError.message?.includes('already exists') ||
            authError.message?.includes('User already registered') ||
            authError.message?.includes('A user with this email address has already been registered')) {
          logger.warn('사용자가 이미 auth.users에 존재함', { email, error: authError.message });
          
          // auth.users에서 이메일로 사용자 찾기
          try {
            const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            
            if (!listError && usersList?.users) {
              const existingAuthUserByEmail = usersList.users.find(u => u.email === email);
              
              if (existingAuthUserByEmail) {
                authUser = { user: existingAuthUserByEmail };
                logger.info('auth.users에서 이메일로 기존 사용자 찾음', { 
                  userId: existingAuthUserByEmail.id, 
                  email 
                });
              } else {
                // auth.users에 이메일이 없는데 에러가 발생한 경우는 이상하지만 계속 진행
                logger.warn('auth.users 목록에서 이메일을 찾을 수 없음 (에러는 발생했지만)', { email });
                
                // public.users에서 확인
                const { data: existingPublicUser } = await supabase
                  .from('users')
                  .select('id')
                  .eq('email', email)
                  .maybeSingle();
                
                if (existingPublicUser?.id) {
                  const { data: existingAuthUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(existingPublicUser.id);
                  if (!getUserError && existingAuthUser?.user) {
                    authUser = existingAuthUser;
                    logger.info('public.users ID로 auth.users 사용자 찾음', { userId: existingAuthUser.user.id, email });
                  } else {
                    throw new DatabaseError('사용자 인증 정보를 찾을 수 없습니다');
                  }
                } else {
                  throw new DatabaseError('사용자 계정을 찾을 수 없습니다');
                }
              }
            } else {
              logger.error('auth.users 목록 조회 실패', { error: listError });
              throw new DatabaseError('사용자 인증 정보를 조회할 수 없습니다');
            }
          } catch (findError) {
            logger.error('기존 사용자 찾기 실패', { error: findError, email });
            throw new DatabaseError(`사용자 계정을 찾을 수 없습니다: ${findError.message || '알 수 없는 오류'}`);
          }
        } else {
          // 다른 에러인 경우
          logger.error('auth.users 생성 실패', { 
            error: authError, 
            errorMessage: authError?.message,
            errorCode: authError?.code,
            errorStatus: authError?.status,
            email 
          });
          throw new DatabaseError(`사용자 계정 생성에 실패했습니다: ${authError.message || '알 수 없는 오류'}`);
        }
      } else {
        authUser = newAuthUser;
      }

      if (!authUser?.user) {
        logger.error('auth.users 사용자 정보 없음', { email });
        throw new DatabaseError('사용자 계정을 찾을 수 없습니다');
      }

      logger.info('auth.users 생성 성공', { userId: authUser.user.id, email });

      // public.users에 사용자 정보 저장
      const currentTime = new Date().toISOString();
      const insertData = {
        id: authUser.user.id,
        email,
        nickname,
        status: 'active',
        created_at: currentTime,
        updated_at: currentTime,
        last_login_at: currentTime
      };

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([insertData])
        .select()
        .single();

      if (insertError) {
        logger.error('public.users 생성 실패', { 
          error: insertError, 
          errorMessage: insertError?.message,
          errorCode: insertError?.code,
          errorDetails: insertError?.details,
          errorHint: insertError?.hint,
          userId: authUser.user.id 
        });
        // auth.users는 이미 생성되었으므로 롤백 시도
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw new DatabaseError('사용자 정보 저장에 실패했습니다');
      }

      logger.info('신규 사용자 생성 성공', { 
        userId: newUser.id, 
        email: newUser.email,
        status: newUser.status 
      });

      // 신규 사용자 정보 반환
      // 프론트엔드에서 Supabase 세션을 생성하기 위해 사용자 정보 반환
      return { 
        userId: newUser.id, 
        email: newUser.email, 
        nickname: newUser.nickname,
        status: newUser.status,
        school: newUser.school || null
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

