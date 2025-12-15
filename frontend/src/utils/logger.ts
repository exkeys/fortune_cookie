/**
 * 로깅 유틸리티
 * 프로덕션에서는 에러만 로깅, 개발 환경에서는 모든 로그 출력
 * 프로덕션 빌드 시 console.log는 자동으로 제거됨 (vite.config.ts 설정)
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
    // 프로덕션에서는 로그를 서버로 전송하거나 무시
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
    // 프로덕션에서는 경고를 서버로 전송하거나 무시
  },
  error: (...args: unknown[]) => {
    // 에러는 개발/프로덕션 모두 로깅
    // 프로덕션 빌드 시 console.error는 유지 (중요한 에러 추적)
    // TODO: 프로덕션에서는 에러 모니터링 서비스(Sentry 등)로 전송
    console.error(...args);
  },
};

