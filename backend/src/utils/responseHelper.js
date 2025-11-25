/**
 * 일관된 API 응답 형식을 제공하는 헬퍼 함수
 */

/**
 * 성공 응답
 * @param {Object} res - Express response 객체
 * @param {*} data - 응답 데이터
 * @param {number} statusCode - HTTP 상태 코드 (기본: 200)
 */
export const successResponse = (res, data, statusCode = 200) => {
  return res.status(statusCode).json(data);
};

/**
 * 에러 응답
 * @param {Object} res - Express response 객체
 * @param {string} message - 에러 메시지
 * @param {number} statusCode - HTTP 상태 코드 (기본: 500)
 */
export const errorResponse = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({ error: message });
};

/**
 * 검증 실패 응답
 * @param {Object} res - Express response 객체
 * @param {string} message - 검증 실패 메시지
 */
export const validationErrorResponse = (res, message) => {
  return res.status(400).json({ error: message });
};

