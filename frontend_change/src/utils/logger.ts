/**
 * 로깅 유틸리티
 * 프로덕션에서는 에러만 로깅, 개발 환경에서는 모든 로그 출력
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // 에러는 항상 로깅
    console.error(...args);
  },
};

