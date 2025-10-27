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
      
      // 먼저 해당 이메일로 밴된 사용자가 있는지 확실히 체크
      const { data: bannedCheck, error: bannedCheckError } = await supabase
        .from('users')
        .select('id, email, status')
        .eq('email', email)
        .eq('status', 'banned')
        .maybeSingle();

      logger.info('밴된 사용자 체크 결과', { 
        email,
        bannedCheck,
        bannedCheckError,
        isBanned: !!bannedCheck 
      });

      // 밴된 사용자면 즉시 차단
      if (bannedCheck) {
        logger.error('🚫 밴된 사용자 로그인 시도 차단 🚫', { 
          email, 
          userId: bannedCheck.id,
          status: bannedCheck.status,
          timestamp: new Date().toISOString(),
          message: '밴된 계정이 로그인을 시도했습니다!'
        });
        throw new DatabaseError('계정이 차단되었습니다. 관리자에게 문의하세요.');
      }

      // 기존 사용자 정보 조회 (status 포함)
      const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('id, created_at, login_count, status, email')
        .eq('email', email)
        .maybeSingle(); // single 대신 maybeSingle 사용

      // 사용자 조회 결과 상세 로깅
      logger.info('기존 사용자 조회 상세 결과', { 
        email, 
        existingUser,
        existingUserError,
        hasExistingUser: !!existingUser,
        existingUserStatus: existingUser?.status,
        existingUserId: existingUser?.id
      });
      
      // 삭제된 사용자도 로그인 차단
      if (existingUser && existingUser.status === 'deleted') {
        logger.warn('삭제된 사용자 로그인 차단', { email, status: existingUser.status });
        throw new DatabaseError('탈퇴한 계정입니다.');
      }

      // Supabase에 upsert - 기존 사용자는 status 건드리지 않음, 신규는 active
      const upsertData = { 
        email, 
        nickname,
        created_at: existingUser?.created_at || new Date().toISOString(),
        last_login_at: new Date().toISOString(),
        login_count: (existingUser?.login_count || 0) + 1
      };
      
      // 신규 사용자인 경우에만 status 설정
      if (!existingUser) {
        upsertData.status = 'active';
        logger.info('✅ 신규 사용자 - active 상태로 생성', { email, upsertData });
      } else {
        logger.info('🔄 기존 사용자 - status 유지', { 
          email, 
          currentStatus: existingUser.status,
          willUpdateStatus: false,
          upsertData 
        });
      }

      logger.info('📝 upsert 실행 전 데이터 확인:', { 
        email,
        upsertData,
        hasStatusField: 'status' in upsertData 
      });

      const { data, error } = await supabase
        .from('users')
        .upsert([upsertData], { onConflict: 'email' })
        .select()
        .single();
        
      logger.info('📝 upsert 완료 후 결과:', { 
        email,
        resultStatus: data?.status,
        error: error ? error.message : null 
      });
      
      if (error) {
        logger.error('Supabase 사용자 저장 실패', error);
        throw new DatabaseError('사용자 정보 저장에 실패했습니다');
      }
      
      logger.info('카카오 로그인 성공', { 
        userId: data.id, 
        email: data.email,
        status: data.status 
      });
      
      return { 
        userId: data.id, 
        email: data.email, 
        nickname: data.nickname,
        status: data.status
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

      // 2. daily_usage_log는 24시간 보존 정책에 따라 삭제하지 않음
      // (스케줄러가 자동으로 24시간 후 삭제)
      logger.info('daily_usage_log는 24시간 보존 정책에 따라 유지됨', { userId });

      // 3. 사용자 정보를 deleted 상태로 변경 (완전 삭제 대신 비활성화)
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

      // 4. Supabase Auth에서 사용자 완전 삭제 (Admin API 사용)
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
      
      logger.info('회원탈퇴 성공 (daily_usage_log는 24시간 보존)', { userId });
      return { 
        success: true, 
        message: '회원탈퇴가 완료되었습니다',
        note: 'daily_usage_log는 24시간 동안 보존됩니다'
      };
    } catch (error) {
      logger.error('회원탈퇴 예외', error);
      throw error;
    }
  }
}
