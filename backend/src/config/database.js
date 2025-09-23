import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase 클라이언트 설정 (서버는 service role 키를 우선 사용)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// 데이터베이스 연결 상태 확인
export const checkDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection failed:', error);
      return false;
    }
    
    console.log('Database connected successfully');
    return true;
  } catch (err) {
    console.error('Database connection error:', err);
    return false;
  }
};
