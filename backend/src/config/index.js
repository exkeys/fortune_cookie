import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // 서버 설정
  port: process.env.PORT || 4000,
  
  // CORS 설정
  cors: {
    origin: [
      'http://localhost:3000',  // Vite 기본 포트
      'http://localhost:3001',  // Vite 개발 서버 (포트 충돌 시)
      'http://localhost:5173',  // Vite 개발 서버
      'http://localhost:8080',  // 추가 포트
      'http://192.168.120.48:3000',  // 모바일 접근용 네트워크 IP (현재)
      process.env.FRONTEND_URL
    ].filter(Boolean), // undefined 값 제거
    credentials: true
  },
  
  // API 키들
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  
  // Supabase 설정
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY
  },
  
  // 환경
  env: process.env.NODE_ENV || 'development',
  
  // 로깅
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
