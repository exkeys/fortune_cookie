import crypto from 'crypto';
import axios from 'axios';
import { KakaoAuthService } from '../services/auth/kakaoAuthService.js';
import { AccountService } from '../services/auth/accountService.js';
import { ProfileService } from '../services/auth/profileService.js';
import { validateRequest } from '../utils/validation.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../utils/controllerWrapper.js';
import { successResponse, errorResponse, validationErrorResponse } from '../utils/responseHelper.js';
import { supabase, supabaseAdmin } from '../config/database.js';
import { setRefreshTokenCookie, clearRefreshTokenCookie, REFRESH_COOKIE_NAME } from '../utils/authTokens.js';
import { config } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';

const CSRF_COOKIE_NAME = 'fc_csrf_token';

const getCsrfCookieOptions = () => ({
  httpOnly: false,
  secure: config.env === 'production',
  sameSite: 'strict',
  path: '/api'
});

const generateCsrfToken = () => crypto.randomBytes(32).toString('hex');

const normalizeSupabaseUrl = (url) => url?.replace(/\/$/, '');

const calculateExpiresAt = (expiresAt, expiresIn) => {
  return expiresAt
    ? new Date(expiresAt).getTime()
    : expiresIn
      ? Date.now() + expiresIn * 1000
      : null;
};

const restrictionErrorResponse = (res, restriction) => {
  return res.status(403).json({
    success: false,
    error: restriction.message || '탈퇴 후 24시간 내에는 재가입할 수 없습니다.',
    canLogin: false,
    isRestricted: true
  });
};

const refreshSupabaseSession = async (refreshToken) => {
  const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다');
  }

  const endpoint = `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`;

  try {
    const response = await axios.post(
      endpoint,
      { refresh_token: refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`
        }
      }
    );
    
    // 리프레시 토큰 만료 시간 확인을 위한 로그
    const responseData = response.data;
    if (responseData?.refresh_token) {
      try {
        const [, payload] = responseData.refresh_token.split('.');
        if (payload) {
          const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, '=');
          const decoded = Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
          const parsed = JSON.parse(decoded);
          if (parsed.exp) {
            const expiresAt = new Date(parsed.exp * 1000);
            const daysUntilExpiry = Math.ceil((parsed.exp * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
            logger.info('🔍 리프레시 토큰 만료 시간 확인', {
              expiresAt: expiresAt.toISOString(),
              daysUntilExpiry: `${daysUntilExpiry}일`,
              expiresInSeconds: parsed.exp - Math.floor(Date.now() / 1000)
            });
          }
        }
      } catch (decodeError) {
        logger.warn('리프레시 토큰 디코딩 실패', { error: decodeError.message });
      }
    }
    
    logger.info('📋 Supabase 토큰 갱신 응답', {
      hasAccessToken: !!responseData?.access_token,
      hasRefreshToken: !!responseData?.refresh_token,
      expiresIn: responseData?.expires_in,
      expiresAt: responseData?.expires_at,
      tokenType: responseData?.token_type
    });
    
    return responseData;
  } catch (error) {
    logger.error('Supabase 토큰 갱신 실패', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    });
    throw error;
  }
};

export class AuthController {
  // 카카오 로그인 통합 API (토큰 교환 + 로그인 한 번에)
  static kakaoLoginDirect = asyncHandler(async (req, res) => {
    const validation = validateRequest(req, ['code', 'redirectUri']);
    if (!validation.isValid) {
      return validationErrorResponse(res, validation.error);
    }
    
    const { code, redirectUri } = req.body;
    let currentStep = 'token_exchange';
    
    try {
    const accessToken = await KakaoAuthService.getKakaoAccessToken(code, redirectUri);
    
      if (!accessToken) {
        return res.status(400).json({
          success: false,
          error: '토큰 교환에 실패했습니다',
          errorCode: 'TOKEN_EXCHANGE_FAILED',
          step: '1/2',
          stepName: currentStep,
          retryable: true
        });
      }
      
      currentStep = 'login';
      const result = await KakaoAuthService.kakaoLogin(accessToken);
      
      return successResponse(res, result);
      
    } catch (error) {
      logger.error('통합 로그인 실패', { step: currentStep, error: error.message });
      
      if (error.message?.includes('24시간') || error.message?.includes('재가입')) {
        return res.status(403).json({
          success: false,
          error: error.message || '탈퇴 후 24시간 내에는 재가입할 수 없습니다',
          errorCode: 'RESTRICTION_COOLDOWN',
          isRestricted: true,
          step: '2/2',
          stepName: currentStep
        });
      }
      
      if (error.message?.includes('차단')) {
        return res.status(403).json({
          success: false,
          error: error.message || '계정이 차단되었습니다',
          errorCode: 'ACCOUNT_BANNED',
          step: '2/2',
          stepName: currentStep
        });
      }
      
      if (currentStep === 'token_exchange') {
        return res.status(400).json({
          success: false,
          error: error.message || '토큰 교환에 실패했습니다',
          errorCode: 'TOKEN_EXCHANGE_FAILED',
          step: '1/2',
          stepName: currentStep,
          retryable: true
        });
      }
      
      return res.status(500).json({
        success: false,
        error: error.message || '로그인에 실패했습니다',
        errorCode: 'LOGIN_FAILED',
        step: currentStep === 'login' ? '2/2' : '1/2',
        stepName: currentStep
      });
    }
  });

  // CSRF 토큰 발급
  static getCsrfToken = asyncHandler(async (req, res) => {
    const existingToken = req.cookies?.[CSRF_COOKIE_NAME];
    const csrfToken = existingToken || generateCsrfToken();

    const cookieOptions = {
      ...getCsrfCookieOptions(),
      maxAge: 1000 * 60 * 60 // 1시간
    };
    res.cookie(CSRF_COOKIE_NAME, csrfToken, cookieOptions);

    return successResponse(res, { csrfToken });
  });

  // 로그인 후 리프레시 토큰을 HttpOnly 쿠키에 저장
  static createSessionFromToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body || {};

    if (!refreshToken || typeof refreshToken !== 'string') {
      return validationErrorResponse(res, '리프레시 토큰이 필요합니다');
    }

    try {
      logger.info('🔐 세션 생성 시작 - 리프레시 토큰으로 세션 생성');
      const session = await refreshSupabaseSession(refreshToken);

      const {
        access_token: accessToken,
        refresh_token: newRefreshToken,
        expires_in: expiresIn,
        expires_at: expiresAt,
        token_type: tokenType = 'bearer',
        user
      } = session || {};

      const refreshForCookie = typeof newRefreshToken === 'string' && newRefreshToken.length > 0
        ? newRefreshToken
        : refreshToken;

      setRefreshTokenCookie(res, refreshForCookie);

      logger.info('✅ 리프레시 토큰 쿠키 설정 완료', {
        cookieMaxAge: '14일 (현재 설정)',
        note: '위의 로그에서 실제 리프레시 토큰 만료 시간 확인 가능'
      });

      const calculatedExpiresAt = calculateExpiresAt(expiresAt, expiresIn);

      return successResponse(res, {
        success: true,
        accessToken: accessToken || null,
        tokenType,
        expiresAt: calculatedExpiresAt,
        user: user || null
      });
    } catch (error) {
      logger.error('세션 생성 실패', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });

      clearRefreshTokenCookie(res);
      const status = error?.response?.status || 500;
      const message = error?.response?.data?.error_description || '세션을 생성할 수 없습니다';
      return errorResponse(res, message, status === 400 ? 401 : status);
    }

  });

  // 리프레시 토큰으로 액세스 토큰 갱신
  static refreshAccessToken = asyncHandler(async (req, res) => {
    const csrfHeader = req.get('X-CSRF-Token');
    const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];

    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      logger.warn('CSRF 토큰 검증 실패', { hasHeader: !!csrfHeader, hasCookie: !!csrfCookie });
      return errorResponse(res, 'CSRF 토큰이 유효하지 않습니다', 403);
    }

    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      logger.warn('리프레시 토큰 쿠키 없음');
      clearRefreshTokenCookie(res);
      return errorResponse(res, '리프레시 토큰이 없습니다', 401);
    }

    try {
      const tokenResponse = await refreshSupabaseSession(refreshToken);

      const {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_in: expiresIn,
        expires_at: expiresAt,
        token_type: tokenType = 'bearer'
      } = tokenResponse || {};

      if (newRefreshToken && typeof newRefreshToken === 'string') {
        setRefreshTokenCookie(res, newRefreshToken);
      }

      const calculatedExpiresAt = calculateExpiresAt(expiresAt, expiresIn);

      if (!newAccessToken) {
        logger.warn('Supabase 갱신 응답에 access_token 없음');
        return errorResponse(res, '토큰 갱신에 실패했습니다', 401);
      }

      return successResponse(res, {
        accessToken: newAccessToken,
        tokenType,
        expiresAt: calculatedExpiresAt
      });
    } catch (error) {
      clearRefreshTokenCookie(res);
      const status = error?.response?.status || 500;
      const message = error?.response?.data?.error_description || '토큰 갱신 중 오류가 발생했습니다';
      return errorResponse(res, message, status === 400 ? 401 : status);
    }
  });

  // 로그아웃
  static logout = asyncHandler(async (req, res) => {
    // userId는 인증 미들웨어에서 설정됨
    const userId = req.userId;
    
    clearRefreshTokenCookie(res);
    res.clearCookie(CSRF_COOKIE_NAME, getCsrfCookieOptions());

    const result = await ProfileService.logout(userId);
    
    return successResponse(res, result);
  });

  // 사용자 정보 동기화 (Supabase OAuth 로그인 후)
  static syncUser = asyncHandler(async (req, res) => {
    // JWT 토큰에서 사용자 정보 가져오기
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return validationErrorResponse(res, '인증 토큰이 필요합니다');
    }
    
    // Supabase JWT 검증
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !authUser) {
      return errorResponse(res, '유효하지 않은 토큰입니다', 401);
    }
    
    const { email, nickname } = req.body;
    
    if (!email) {
      return validationErrorResponse(res, '이메일이 필요합니다');
    }
    
    logger.info('사용자 정보 동기화 요청', { 
      userId: authUser.id,
      email 
    });
    
    // 1. 재가입 제한 체크 (밴/deleted처럼 DB 상태 직접 확인)
    const restriction = await AccountService.checkDeletionRestriction(email);
    if (restriction && restriction.isRestricted) {
      return restrictionErrorResponse(res, restriction);
    }
    
    // 2. 기존 사용자 정보 조회
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, created_at, status, email, school, is_admin')
      .eq('id', authUser.id)
      .maybeSingle();
    
    // 3. 기존 사용자 상태 체크
    if (existingUser && existingUser.status === 'banned') {
      logger.warn('밴된 사용자 로그인 차단', { email, status: existingUser.status });
      return errorResponse(res, '계정이 차단되었습니다. 관리자에게 문의하세요.', 403);
    }

    if (existingUser && existingUser.status === 'deleted') {
      logger.warn('삭제된 사용자 로그인 차단', { email, status: existingUser.status });
      return errorResponse(res, '탈퇴한 계정입니다.', 403);
    }

    // 4. 기존 사용자인 경우 업데이트
    if (existingUser) {
      logger.info('🔄 기존 사용자 - 업데이트', { 
        email, 
        userId: existingUser.id,
        currentStatus: existingUser.status
      });

      const updateData = {
        nickname: nickname || existingUser.email?.split('@')[0] || '사용자',
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
          userId: existingUser.id 
        });
        throw new DatabaseError('사용자 정보 저장에 실패했습니다');
      }
    
      logger.info('기존 사용자 업데이트 성공', { 
        userId: data.id, 
        email: data.email,
        status: data.status 
      });
    
      return successResponse(res, { 
        userId: data.id, 
        email: data.email, 
        nickname: data.nickname,
        status: data.status,
        school: data.school || null,
        is_admin: data.is_admin || false,
        created_at: data.created_at
      });
    }

    // 5. 신규 사용자인 경우 public.users에 생성
    logger.info('✅ 신규 사용자 - public.users에 생성 시작', { email });
    
    const currentTime = new Date().toISOString();
    const insertData = {
      id: authUser.id, // Supabase Auth의 사용자 ID 사용
      email: email,
      nickname: nickname || email.split('@')[0] || '사용자',
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
        userId: authUser.id 
      });
      throw new DatabaseError('사용자 정보 저장에 실패했습니다');
    }

    logger.info('신규 사용자 생성 성공', { 
      userId: newUser.id, 
      email: newUser.email,
      status: newUser.status 
    });

    return successResponse(res, { 
      userId: newUser.id, 
      email: newUser.email, 
      nickname: newUser.nickname,
      status: newUser.status,
      school: newUser.school || null,
      is_admin: newUser.is_admin || false,
      created_at: newUser.created_at
    });
  });

  // 로그인 검증 (재가입 제한 체크)
  static validateLogin = asyncHandler(async (req, res) => {
    const validation = validateRequest(req, ['email']);
    if (!validation.isValid) {
      return validationErrorResponse(res, validation.error);
    }
    
    const { email } = req.body;
    
    logger.info('로그인 검증 요청', { email });
    
    // 재가입 제한 체크만 수행 (밴/deleted처럼 DB 상태 직접 확인)
    const restriction = await AccountService.checkDeletionRestriction(email);
    if (restriction && restriction.isRestricted) {
      return restrictionErrorResponse(res, restriction);
    }
    
    // 제한 없으면 성공 응답
    return successResponse(res, {
      success: true,
      message: '로그인 가능',
      canLogin: true
    });
  });

  // 회원탈퇴
  static deleteAccount = asyncHandler(async (req, res) => {
    // 요청한 사용자 ID (인증 미들웨어에서 설정됨)
    const requesterId = req.userId;
    
    // 삭제할 사용자 ID (body에서 가져오거나, 없으면 요청한 사용자 자신)
    const targetUserId = req.body?.userId || requesterId;
    
    // 관리자가 다른 사용자를 삭제하는 경우 권한 확인
    if (targetUserId !== requesterId) {
      const { data: requester } = await supabaseAdmin
        .from('users')
        .select('is_admin')
        .eq('id', requesterId)
        .single();
      
      if (!requester?.is_admin) {
        logger.warn('관리자 권한 없이 다른 사용자 삭제 시도', { requesterId, targetUserId });
        return errorResponse(res, '관리자만 다른 사용자를 삭제할 수 있습니다', 403);
      }
      
      logger.info('관리자가 다른 사용자 삭제 요청', { requesterId, targetUserId });
    }
    
    // 요청 정보 수집 (개인정보보호를 위해 해시화됨)
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    
    logger.info('회원탈퇴 요청 상세정보', { 
      requesterId,
      targetUserId,
      hasUserAgent: !!userAgent,
      hasIpAddress: !!ipAddress,
      // 실제 값은 로그에 남기지 않음 (개인정보보호)
    });
    
    const result = await AccountService.deleteAccount(targetUserId, userAgent, ipAddress);
    
    return successResponse(res, result);
  });

  // 사용자 프로필 조회
  static getProfile = asyncHandler(async (req, res) => {
    // userId는 인증 미들웨어에서 설정됨
    const userId = req.userId;

    logger.info('프로필 조회 요청', { userId });

    const result = await ProfileService.getProfile(userId);
    
    return successResponse(res, result);
  });

  // 사용자 프로필 업데이트
  static updateProfile = asyncHandler(async (req, res) => {
    // userId는 인증 미들웨어에서 설정됨
    const userId = req.userId;
    const updates = req.body;
    
    if (!updates || Object.keys(updates).length === 0) {
      return validationErrorResponse(res, '업데이트할 필드가 필요합니다');
    }

    logger.info('프로필 업데이트 요청', { userId, updates });

    const result = await ProfileService.updateProfile(userId, updates);
    
    return successResponse(res, result);
  });
}
