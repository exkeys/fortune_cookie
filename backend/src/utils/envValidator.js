import { logger } from './logger.js';

/**
 * 필수 환경 변수 목록
 */
const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_ANON_KEY',
  'OPENAI_API_KEY',
  'KAKAO_REST_API_KEY'
];

/**
 * 환경 변수 검증
 * @throws {Error} 필수 환경 변수가 없을 경우
 */
export const validateEnvVars = () => {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    const errorMessage = `필수 환경 변수가 누락되었습니다: ${missing.join(', ')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  logger.info('환경 변수 검증 완료', {
    validated: REQUIRED_ENV_VARS.length,
    nodeEnv: process.env.NODE_ENV || 'development'
  });
};

/**
 * 선택적 환경 변수 검증 및 경고
 */
export const validateOptionalEnvVars = () => {
  const optionalVars = {
    'FRONTEND_URL': '프론트엔드 URL',
    'PORT': '서버 포트',
    'LOG_LEVEL': '로깅 레벨'
  };
  
  const warnings = [];
  
  Object.keys(optionalVars).forEach(key => {
    if (!process.env[key]) {
      warnings.push(`${optionalVars[key]} (${key})이 설정되지 않았습니다. 기본값이 사용됩니다.`);
    }
  });
  
  if (warnings.length > 0) {
    logger.warn('선택적 환경 변수 경고', { warnings });
  }
};

