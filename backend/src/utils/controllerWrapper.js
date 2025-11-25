import { logger } from './logger.js';

/**
 * 컨트롤러 메서드를 래핑하여 자동 에러 처리
 * try-catch 패턴을 자동으로 처리하여 코드 중복을 제거
 * 
 * @param {Function} fn - 컨트롤러 메서드
 * @returns {Function} Express 라우트 핸들러
 * 
 * @example
 * // 기존
 * static async myMethod(req, res, next) {
 *   try {
 *     // 로직
 *   } catch (error) {
 *     logger.error('에러', error);
 *     next(error);
 *   }
 * }
 * 
 * // 사용 후
 * static myMethod = asyncHandler(async (req, res) => {
 *   // 로직 (try-catch 불필요)
 * });
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      logger.error('컨트롤러 에러 발생', {
        method: req.method,
        path: req.path,
        error: error.message,
        stack: error.stack
      });
      next(error);
    });
  };
};

