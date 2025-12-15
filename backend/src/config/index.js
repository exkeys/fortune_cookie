import dotenv from 'dotenv';

dotenv.config();

const defaultCorsOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://192.168.120.48:3000',
];

const parseOrigins = (value) =>
  value
    ? value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

const envCorsOrigins = parseOrigins(process.env.CORS_ORIGINS);

const combinedCorsOrigins = [
  ...envCorsOrigins,
  process.env.FRONTEND_URL,
];

const corsOrigins =
  combinedCorsOrigins.filter(Boolean).length > 0
    ? combinedCorsOrigins
    : defaultCorsOrigins;

export const config = {
  // 서버 설정
  port: process.env.PORT || 4000,
  
  // CORS 설정
  cors: {
    origin: [...new Set(corsOrigins.filter(Boolean))],
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
  },
  
  // Rate Limiting 설정
  rateLimit: {
    // 일반 API
    general: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15분
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10) // 최대 100 요청
    },
    // 인증 API
    auth: {
      windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15분
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10) // 최대 5 요청
    },
    // AI API
    ai: {
      windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1시간
      max: parseInt(process.env.AI_RATE_LIMIT_MAX || '20', 10) // 최대 20 요청
    },
    // 관리자 API
    admin: {
      windowMs: parseInt(process.env.ADMIN_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15분
      max: parseInt(process.env.ADMIN_RATE_LIMIT_MAX || '50', 10) // 최대 50 요청
    }
  }
};
