import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { logger } from '../utils/logger.js';

/**
 * 일반 API Rate Limiting
 * - 기본: 100 requests / 15분 (프로덕션)
 * - 개발 환경: 500 requests / 15분 (더 관대)
 * - 환경 변수로 조정 가능
 * - 인증된 사용자 API는 제외 (별도 rate limit 적용)
 */
const isDevelopment = process.env.NODE_ENV === 'development';
export const generalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15분 (기본값) --> 900000ms = 15분, 10은 10진법
  max: parseInt(process.env.RATE_LIMIT_MAX || (isDevelopment ? '500' : '100'), 10), // 개발: 500, 프로덕션: 100
  message: {
    success: false,
    error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10) / 1000 / 60) // 분 단위
  },
  standardHeaders: true, // `RateLimit-*` 헤더 반환
  legacyHeaders: false, // `X-RateLimit-*` 헤더 비활성화
  handler: (req, res) => {
    logger.warn('Rate limit 초과', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      success: false,
      error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
      retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10) / 1000 / 60)
    });
  },
  // IP 기반 추적 (프록시 환경 고려, IPv6 안전 처리)
  keyGenerator: ipKeyGenerator,
  // 인증된 사용자 API 및 로그 API는 제외 (별도 rate limit 적용 또는 제한 없음)
  skip: (req) => {
    // /auth/profile은 인증된 사용자용 rate limit 적용
    if (req.path === '/auth/profile') return true;
    // /log는 클라이언트 로그용이므로 제한 없음
    if (req.path === '/log') return true;
    return false;
  }
});

/**
 * 로그인 API Rate Limiting (더 엄격)
 * - 기본: 10 requests / 15분 (프로덕션)
 * - 개발 환경: 20 requests / 15분 (더 관대)
 * - 무차별 대입 공격 방지
 */
export const authRateLimit = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15분
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || (isDevelopment ? '20' : '10'), 10), // 개발: 20, 프로덕션: 10
  message: {
    success: false,
    error: '로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('로그인 Rate limit 초과', {
      ip: req.ip,
      path: req.path,
      email: req.body?.email || 'unknown'
    });
    res.status(429).json({
      success: false,
      error: '로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.',
      retryAfter: 15
    });
  },
  keyGenerator: ipKeyGenerator
});

/**
 * AI API Rate Limiting (비용 절감)
 * - 기본: 20 requests / 1시간 (프로덕션)
 * - 개발 환경: 100 requests / 1시간 (더 관대)
 * - OpenAI API 비용 절감 및 남용 방지
 */
export const aiRateLimit = rateLimit({
  windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1시간
  max: parseInt(process.env.AI_RATE_LIMIT_MAX || (isDevelopment ? '100' : '20'), 10), // 개발: 100, 프로덕션: 20
  message: {
    success: false,
    error: 'AI 요청 한도를 초과했습니다. 1시간 후 다시 시도해주세요.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('AI Rate limit 초과', {
      ip: req.ip,
      userId: req.userId || 'anonymous',
      path: req.path
    });
    res.status(429).json({
      success: false,
      error: 'AI 요청 한도를 초과했습니다. 1시간 후 다시 시도해주세요.',
      retryAfter: 60
    });
  },
  keyGenerator: (req) => {
    // 인증된 사용자는 userId 기반, 비인증은 IP 기반 (IPv6 안전 처리)
    if (req.userId) {
      return req.userId;
    }
    return ipKeyGenerator(req);
  }
});

/**
 * 관리자 API Rate Limiting (보안 강화)
 * - 기본: 50 requests / 15분 (프로덕션)
 * - 개발 환경: 200 requests / 15분 (더 관대)
 * - 관리자 기능 보호
 */
export const adminRateLimit = rateLimit({
  windowMs: parseInt(process.env.ADMIN_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15분
  max: parseInt(process.env.ADMIN_RATE_LIMIT_MAX || (isDevelopment ? '200' : '50'), 10), // 개발: 200, 프로덕션: 50
  message: {
    success: false,
    error: '관리자 API 요청 한도를 초과했습니다.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('관리자 Rate limit 초과', {
      ip: req.ip,
      userId: req.userId || 'unknown',
      path: req.path
    });
    res.status(429).json({
      success: false,
      error: '관리자 API 요청 한도를 초과했습니다.',
      retryAfter: 15
    });
  },
  keyGenerator: (req) => {
    // userId가 있으면 userId 기반, 없으면 IP 기반 (IPv6 안전 처리)
    if (req.userId) {
      return req.userId;
    }
    return ipKeyGenerator(req);
  }
});

/**
 * 인증된 사용자 API Rate Limiting (더 관대한 제한)
 * - 기본: 200 requests / 15분 (프로덕션)
 * - 개발 환경: 1000 requests / 15분 (더 관대)
 * - 인증된 사용자 전용 (사용자 ID 기반)
 * - 프로필 조회 등 자주 호출되는 API에 사용
 * - authenticateToken 미들웨어 이후에 사용해야 함 (req.userId 필요)
 */
export const authenticatedRateLimit = rateLimit({
  windowMs: parseInt(process.env.AUTHENTICATED_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15분
  max: parseInt(process.env.AUTHENTICATED_RATE_LIMIT_MAX || (isDevelopment ? '1000' : '200'), 10), // 개발: 1000, 프로덕션: 200
  message: {
    success: false,
    error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    retryAfter: 15
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('인증된 사용자 Rate limit 초과', {
      ip: req.ip,
      userId: req.userId || 'unknown',
      path: req.path
    });
    res.status(429).json({
      success: false,
      error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
      retryAfter: 15
    });
  },
  keyGenerator: (req) => {
    // authenticateToken 미들웨어 이후이므로 req.userId가 항상 존재
    // 사용자 ID 기반으로 rate limit 적용 (같은 사용자는 같은 제한 공유)
    // IPv6 안전 처리
    if (req.userId) {
      return req.userId;
    }
    return ipKeyGenerator(req);
  }
});

