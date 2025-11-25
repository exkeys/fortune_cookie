import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

// Supabase 클라이언트 설정 (서버는 service role 키를 우선 사용)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY; // .env에서는 SERVICE_KEY로 되어있음
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// 관리자 권한 Supabase 클라이언트 (사용자 삭제 등에 사용)
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// 데이터베이스 연결 상태 확인
export const checkDatabaseConnection = async () => {
  try {
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      logger.error('Database connection failed:', error);
      return false;
    }
    
    logger.info('Database connected successfully');
    return true;
  } catch (err) {
    logger.error('Database connection error:', err);
    return false;
  }
};
