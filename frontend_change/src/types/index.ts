export interface User {
  id: string;
  email?: string;
  created_at?: string;
  school?: string;
}

export interface NavigationState {
  role?: string;
  concern?: string;
  answer?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Theme {
  colors: Record<string, string>;
  sizes: Record<string, any>;
  layout: Record<string, any>;
}

export interface Animation {
  duration: {
    fast: string;
    medium: string;
    slow: string;
  };
  easing: string;
}

export interface Routes {
  home: string;
  main: string;
  role: string;
  concern: string;
  fortune: string;
  login: string;
  signup: string;
  history: string;
}

export interface ApiEndpoints {
  baseUrl: string;
  ai: string;
  aiBoth: string;
  save: string;
  concerns: string;
  customRoles: string;
}

export interface Messages {
  validation: {
    roleRequired: string;
    concernRequired: string;
    loginRequired: string;
  };
  success: {
    saved: string;
    saving: string;
    welcome: string;
  };
  error: {
    saveFailed: string;
    aiFailed: string;
    userSaveFailed: string;
  };
  loading: {
    aiThinking: string;
  };
}

// 카카오 SDK 타입 선언 (전역 타입)
declare global {
  interface Window {
    Kakao: any;
  }
}

