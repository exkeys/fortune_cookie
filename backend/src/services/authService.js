import axios from 'axios';
import { supabase } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { ExternalServiceError, DatabaseError } from '../utils/errors.js';

export class AuthService {
  // 카카오 로그인
  static async kakaoLogin(accessToken) {
    try {
      logger.info('카카오 로그인 요청');
      
      // 카카오 API로 사용자 정보 가져오기
      const kakaoRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      const kakaoUser = kakaoRes.data;
      const email = kakaoUser.kakao_account.email;
      const nickname = kakaoUser.kakao_account.profile.nickname;
      
      logger.info('카카오 사용자 정보 조회 성공', { email, nickname });
      
      // Supabase에 upsert (중복 email 처리)
      const { data, error } = await supabase
        .from('users')
        .upsert(
          [{ email, nickname }],
          { onConflict: 'email' }
        )
        .select()
        .maybeSingle();
      
      if (error) {
        logger.error('Supabase 사용자 저장 실패', error);
        throw new DatabaseError('사용자 정보 저장에 실패했습니다');
      }
      
      logger.info('카카오 로그인 성공', { userId: data.id, email: data.email });
      return { 
        userId: data.id, 
        email: data.email, 
        nickname: data.nickname 
      };
    } catch (error) {
      if (error.response?.status === 401) {
        logger.error('카카오 인증 실패', error);
        throw new ExternalServiceError('카카오 인증에 실패했습니다');
      }
      
      logger.error('카카오 로그인 예외', error);
      throw error;
    }
  }
}
