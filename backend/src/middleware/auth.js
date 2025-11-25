import { createClient } from '@supabase/supabase-js';
import { AuthenticationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY;

// JWT 검증용 Supabase 클라이언트
const supabaseAuth = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Supabase JWT 토큰 검증 미들웨어
 * Authorization 헤더에서 토큰을 추출하고 검증하여 req.userId에 저장
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
      logger.warn('인증 토큰 없음', { 
        path: req.path,
        method: req.method 
      });
      throw new AuthenticationError('인증 토큰이 필요합니다');
    }

    // Supabase JWT 검증
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      logger.warn('토큰 검증 실패', { 
        error: error?.message,
        path: req.path 
      });
      throw new AuthenticationError('유효하지 않은 토큰입니다');
    }

    // req.userId에 userId 저장 (기존 코드와 호환)
    req.userId = user.id;
    
    logger.info('토큰 인증 성공', { 
      userId: user.id,
      path: req.path 
    });
    
    next();
  } catch (error) {
    // AuthenticationError는 그대로 전달
    if (error instanceof AuthenticationError) {
      return res.status(401).json({ 
        error: error.message,
        code: 'UNAUTHORIZED'
      });
    }
    
    // 기타 에러는 다음 미들웨어로 전달
    next(error);
  }
};

/**
 * 선택적 인증 미들웨어 (토큰이 있으면 검증, 없으면 통과)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
      if (!error && user) {
        req.userId = user.id;
      }
    }
    
    next();
  } catch (error) {
    // 에러가 있어도 통과 (선택적 인증)
    next();
  }
};

