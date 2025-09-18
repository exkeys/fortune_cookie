// 기본 타입 정의
export interface User {
  id: string;
  email?: string;
  created_at?: string;
}

export interface Concern {
  id: string;
  user_id: string;
  role: string;
  concern: string;
  answer: string;
  created_at: string;
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
  colors: {
    primary: string;
    primaryLight: string;
    primaryHover: string;
    background: string;
    white: string;
    text: string;
    textLight: string;
    error: string;
    success: string;
    border: string;
    shadow: string;
    shadowLight: string;
    shadowHover: string;
  };
  sizes: {
    fontSize: {
      small: number;
      medium: number;
      large: number;
      xlarge: number;
      xxlarge: number;
    };
    spacing: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    borderRadius: {
      small: number;
      medium: number;
      large: number;
    };
    button: {
      padding: string;
      paddingSmall: string;
      paddingInput: string;
    };
  };
  layout: {
    fullScreen: {
      minHeight: string;
      minWidth: string;
      height: string;
      width: string;
      position: string;
      top: number;
      left: number;
      overflow: string;
    };
    container: {
      display: string;
      flexDirection: string;
      alignItems: string;
      justifyContent: string;
      height: string;
      width: string;
    };
    input: {
      width: number;
      maxWidth: string;
    };
  };
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
  save: string;
  concerns: string;
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


