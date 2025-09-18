import { MESSAGES } from '../constants';

export const validateRole = (role) => {
  if (!role || !role.trim()) {
    return { isValid: false, message: MESSAGES.validation.roleRequired };
  }
  return { isValid: true, message: '' };
};

export const validateConcern = (concern) => {
  if (!concern || !concern.trim()) {
    return { isValid: false, message: MESSAGES.validation.concernRequired };
  }
  return { isValid: true, message: '' };
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { isValid: false, message: '올바른 이메일 형식을 입력해주세요.' };
  }
  return { isValid: true, message: '' };
};

export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return { isValid: false, message: '비밀번호는 6자 이상이어야 합니다.' };
  }
  return { isValid: true, message: '' };
};
