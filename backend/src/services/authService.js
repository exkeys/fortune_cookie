import axios from 'axios';
import { supabase, supabaseAdmin } from '../config/database.js';
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
      
      // 기존 사용자 정보 조회
      const { data: existingUser } = await supabase
        .from('users')
        .select('created_at, login_count')
        .eq('email', email)
        .single();

      // Supabase에 upsert (중복 email 처리)
      const { data, error } = await supabase
        .from('users')
        .upsert(
          [{ 
            email, 
            nickname,
            created_at: existingUser?.created_at || new Date().toISOString(), // 기존 생성일 유지
            last_login_at: new Date().toISOString(),
            status: 'active',
            login_count: (existingUser?.login_count || 0) + 1
          }],
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

  // 로그아웃
  static async logout(userId) {
    try {
      logger.info('로그아웃 요청', { userId });
      
      const { error } = await supabase
        .from('users')
        .update({ last_logout_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (error) {
        logger.error('로그아웃 시간 업데이트 실패', error);
        throw new DatabaseError('로그아웃 처리에 실패했습니다');
      }
      
      logger.info('로그아웃 성공', { userId });
      return { success: true };
    } catch (error) {
      logger.error('로그아웃 예외', error);
      throw error;
    }
  }

  // 회원탈퇴
  static async deleteAccount(userId) {
    try {
      logger.info('회원탈퇴 요청', { userId });
      
      // 1. 사용자의 모든 고민 기록 삭제
      const { error: concernsError } = await supabase
        .from('ai_answers')
        .delete()
        .eq('user_id', userId);
      
      if (concernsError) {
        logger.error('고민 기록 삭제 실패', concernsError);
        throw new DatabaseError('사용자 데이터 삭제에 실패했습니다');
      }

      // 2. 사용자 정보를 deleted 상태로 변경 (완전 삭제 대신 비활성화)
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          email: null, // 개인정보 제거
          nickname: '삭제된 사용자',
          last_logout_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (userError) {
        logger.error('사용자 정보 삭제 처리 실패', userError);
        throw new DatabaseError('회원탈퇴 처리에 실패했습니다');
      }

      // 3. Supabase Auth에서 사용자 완전 삭제 (Admin API 사용)
      try {
        const { data: deleteResult, error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        
        if (deleteError) {
          logger.error('Supabase Auth 사용자 삭제 실패', deleteError);
          // Auth 삭제가 실패해도 데이터는 이미 정리되었으므로 경고만 출력
        } else {
          logger.info('Supabase Auth 사용자 삭제 성공', { userId, deleteResult });
        }
      } catch (authError) {
        logger.error('Supabase Auth 삭제 중 예외', authError);
        // Auth 삭제 실패는 치명적이지 않음
      }
      
      logger.info('회원탈퇴 성공', { userId });
      return { success: true, message: '회원탈퇴가 완료되었습니다' };
    } catch (error) {
      logger.error('회원탈퇴 예외', error);
      throw error;
    }
  }
}
