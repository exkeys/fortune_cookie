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
