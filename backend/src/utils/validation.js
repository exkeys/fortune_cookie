import { ValidationError } from './errors.js';

// UUID 검증 함수
export const isUUID = (str) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

// 이메일 검증 함수
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 필수 필드 검증
export const validateRequiredFields = (data, requiredFields) => {
  const missingFields = requiredFields.filter(field => !data[field]);
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

// 요청 데이터 검증
export const validateRequest = (req, requiredFields) => {
  const validation = validateRequiredFields(req.body, requiredFields);
  
  if (!validation.isValid) {
    return {
      isValid: false,
      error: `필수 필드가 누락되었습니다: ${validation.missingFields.join(', ')}`
    };
  }
  
  return { isValid: true };
};

// UUID 검증 헬퍼 (ValidationError throw)
export const validateUUID = (value, fieldName = 'id') => {
  if (!value || !isUUID(value)) {
    throw new ValidationError(`유효한 ${fieldName}가 필요합니다`);
  }
  return true;
};

// userId 검증 헬퍼 (ValidationError throw)
export const validateUserId = (userId, fieldName = 'userId') => {
  return validateUUID(userId, fieldName);
};

// 여러 필드 UUID 검증 헬퍼
export const validateUUIDs = (fields) => {
  const errors = [];
  for (const [fieldName, value] of Object.entries(fields)) {
    if (!value || !isUUID(value)) {
      errors.push(fieldName);
    }
  }
  if (errors.length > 0) {
    throw new ValidationError(`유효한 ${errors.join(', ')}가 필요합니다`);
  }
  return true;
};

// userId 유효성 검증 (null, 'null', 빈 문자열 체크)
export const isValidUserId = (userId) => {
  return userId && userId !== 'null' && userId !== '' && userId.trim() !== '';
};
