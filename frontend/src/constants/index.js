// 앱 전체에서 사용되는 상수들
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
};

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
};

export const LAYOUT = {
  fullScreen: {
    minHeight: '100vh',
    minWidth: '100vw',
    height: '100vh',
    width: '100vw',
    position: 'fixed',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
  },
  input: {
    width: 420,
    maxWidth: '90%',
  },
};

export const API_ENDPOINTS = {
  baseUrl: 'http://localhost:4000',
  ai: '/api/concerns/ai',
  save: '/api/concerns/save',
  concerns: '/api/concerns',
};

export const ROUTES = {
  home: '/',
  main: '/main',
  role: '/role',
  concern: '/concern',
  fortune: '/fortune',
  login: '/login',
  signup: '/signup',
  history: '/history',
};

export const MESSAGES = {
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

export const ANIMATION = {
  duration: {
    fast: '0.2s',
    medium: '0.5s',
    slow: '0.7s',
  },
  easing: 'ease-in-out',
};
