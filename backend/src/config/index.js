import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // 서버 설정
  port: process.env.PORT || 4000,
  
  // CORS 설정
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
