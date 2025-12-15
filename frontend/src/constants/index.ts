import type { Animation, Routes, ApiEndpoints, Messages } from '../types';

export const COLORS = {
  primary: '#ff9800',
  primaryLight: '#ffb300',
  primaryHover: '#ffe082',
  background: '#fffbe6',
  white: '#fff',
  text: '#333',
  textLight: '#666',
  error: 'red',
  success: '#009688',
  border: '#ffb300',
  shadow: 'rgba(0,0,0,0.08)',
  shadowLight: 'rgba(0,0,0,0.10)',
  shadowHover: 'rgba(0,0,0,0.15)',
} as const;

export const SIZES = {
  fontSize: {
    small: 16,
    medium: 20,
    large: 24,
    xlarge: 28,
    xxlarge: 56,
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    small: 8,
    medium: 12,
    large: 40,
  },
  button: {
    padding: '18px 60px',
    paddingSmall: '14px 36px',
    paddingInput: '12px 20px',
  },
} as const;

const requiredEnv = (value: string | undefined, key: string) => {
  if (!value) {
    throw new Error(`환경 변수 ${key}가 설정되지 않았습니다.`);
  }
  return value;
};

const API_BASE_URL = requiredEnv(import.meta.env.VITE_API_BASE_URL, 'VITE_API_BASE_URL');
const API_ENDPOINT_AI = requiredEnv(import.meta.env.VITE_API_ENDPOINT_AI, 'VITE_API_ENDPOINT_AI');
const API_ENDPOINT_AI_BOTH = requiredEnv(import.meta.env.VITE_API_ENDPOINT_AI_BOTH, 'VITE_API_ENDPOINT_AI_BOTH');
const API_ENDPOINT_SAVE = requiredEnv(import.meta.env.VITE_API_ENDPOINT_SAVE, 'VITE_API_ENDPOINT_SAVE');
const API_ENDPOINT_CONCERNS = requiredEnv(import.meta.env.VITE_API_ENDPOINT_CONCERNS, 'VITE_API_ENDPOINT_CONCERNS');
const API_ENDPOINT_CUSTOM_ROLES = requiredEnv(import.meta.env.VITE_API_ENDPOINT_CUSTOM_ROLES, 'VITE_API_ENDPOINT_CUSTOM_ROLES');
const SUPPORT_EMAIL_VALUE = requiredEnv(import.meta.env.VITE_SUPPORT_EMAIL, 'VITE_SUPPORT_EMAIL');

export const API_ENDPOINTS: ApiEndpoints = {
  baseUrl: API_BASE_URL,
  ai: API_ENDPOINT_AI,
  aiBoth: API_ENDPOINT_AI_BOTH,
  save: API_ENDPOINT_SAVE,
  concerns: API_ENDPOINT_CONCERNS,
  customRoles: API_ENDPOINT_CUSTOM_ROLES,
};

// routes are aligned to frontend_change router
export const ROUTES: Routes = {
  home: '/',
  main: '/home',
  role: '/role-select',
  concern: '/concern-input',
  fortune: '/fortune-cookie',
  login: '/login',
  signup: '/signup',
  history: '/past-concerns',
};

export const MESSAGES: Messages = {
  validation: {
    roleRequired: '역할을 입력해 주세요.',
    concernRequired: '고민을 입력해 주세요.',
    loginRequired: '로그인 후 이용해 주세요.',
  },
  success: {
    saved: '저장 완료',
    saving: '저장 중...',
    welcome: '환영합니다!',
  },
  error: {
    saveFailed: '저장에 실패했습니다. 다시 시도해 주세요.',
    aiFailed: 'AI 답변 요청 또는 저장에 실패했습니다.',
    userSaveFailed: '사용자 정보 저장에 실패했습니다.',
  },
  loading: {
    aiThinking: 'AI가 답변 중...',
  },
};

export const ANIMATION: Animation = {
  duration: {
    fast: '0.2s',
    medium: '0.5s',
    slow: '0.7s',
  },
  easing: 'ease-in-out',
};

// 카카오 JavaScript 키 (카카오톡 공유 기능용)
export const KAKAO_JAVASCRIPT_KEY = requiredEnv(import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY, 'VITE_KAKAO_JAVASCRIPT_KEY');
export const SUPPORT_EMAIL = SUPPORT_EMAIL_VALUE;


