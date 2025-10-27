import axios from 'axios';
import { supabase, supabaseAdmin } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { ExternalServiceError, DatabaseError } from '../utils/errors.js';
import { HashUtils } from '../utils/hashUtils.js';

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

      // 1. 24시간 재가입 제한 체크 (해시 기반)
      await this.checkDeletionRestriction(email);

      // 2. 기존 사용자 정보 조회
      const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('id, created_at, login_count, status, email')
        .eq('email', email)
        .maybeSingle();

      // 사용자 조회 결과 상세 로깅
      logger.info('기존 사용자 조회 상세 결과', { 
        email, 
        existingUser,
        existingUserError,
        hasExistingUser: !!existingUser,
        existingUserStatus: existingUser?.status,
        existingUserId: existingUser?.id
      });
      
      // 3. 기존 사용자 상태 체크
      if (existingUser && existingUser.status === 'banned') {
        logger.warn('밴된 사용자 로그인 차단', { email, status: existingUser.status });
        throw new DatabaseError('계정이 차단되었습니다. 관리자에게 문의하세요.');
      }

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

  // 회원탈퇴 (완전 삭제 방식)
  static async deleteAccount(userId, userAgent = '', ipAddress = '') {
    try {
      logger.info('회원탈퇴 요청 (완전 삭제 방식)', { userId });

      // 1. 사용자 정보 조회 (삭제 전 이메일 확보)
      const { data: user, error: userFetchError } = await supabase
        .from('users')
        .select('email, nickname, status')
        .eq('id', userId)
        .single();

      if (userFetchError || !user) {
        logger.error('사용자 조회 실패', { userId, userFetchError });
        throw new DatabaseError('사용자 정보를 찾을 수 없습니다');
      }

      const userEmail = user.email;
      const deleteTime = new Date().toISOString();

      // 2. 24시간 재가입 제한을 위한 해시 정보 저장 (개인정보 없음)
      const emailHash = HashUtils.hashEmail(userEmail);
      const userAgentHash = HashUtils.hashUserAgent(userAgent);
      const ipHash = HashUtils.hashIP(ipAddress);
      const expiresAt = HashUtils.getExpirationTime();

      const restrictionData = {
        email_hash: emailHash,
        user_agent_hash: userAgentHash,
        ip_hash: ipHash,
        expires_at: expiresAt.toISOString(),
        deletion_reason: 'user_request'
      };

      const { error: restrictionError } = await supabase
        .from('deletion_restrictions')
        .insert(restrictionData);

      if (restrictionError) {
        logger.error('재가입 제한 정보 저장 실패', { 
          restrictionError,
          errorCode: restrictionError.code,
          errorMessage: restrictionError.message 
        });
        throw new DatabaseError('탈퇴 처리 중 오류가 발생했습니다');
      }

      logger.info('재가입 제한 정보 저장 성공', { 
        expiresAt: expiresAt.toISOString()
      });

      // 3. 사용자의 모든 관련 데이터 삭제
      const { error: concernsError } = await supabase
        .from('ai_answers')
        .delete()
        .eq('user_id', userId);
      
      if (concernsError) {
        logger.error('고민 기록 삭제 실패', concernsError);
        throw new DatabaseError('사용자 데이터 삭제에 실패했습니다');
      }

      // 4. daily_usage_log 삭제 (즉시 삭제로 변경)
      const { error: usageLogError } = await supabase
        .from('daily_usage_log')
        .delete()
        .eq('user_id', userId);
      
      if (usageLogError) {
        logger.warn('사용 로그 삭제 실패 (계속 진행)', usageLogError);
        // 치명적이지 않으므로 계속 진행
      }

      // 5. users 테이블에서 완전 삭제 (강력한 방식)
      let deletedData = null;
      let userDeleteError = null;
      
      // 1차 시도: 일반 삭제
      try {
        const result = await supabase
          .from('users')
          .delete()
          .eq('id', String(userId))
          .select();
        
        deletedData = result.data;
        userDeleteError = result.error;
        
      } catch (deleteAttemptError) {
        logger.error('1차 삭제 시도 중 예외', { userId, deleteAttemptError });
        userDeleteError = deleteAttemptError;
      }
      
      // 2차 시도: 관리자 권한으로 재시도 (1차 실패 시)
      if (userDeleteError || !deletedData || deletedData.length === 0) {
        logger.info('관리자 권한으로 재시도', { userId });
        
        try {
          const adminResult = await supabaseAdmin
            .from('users') 
            .delete()
            .eq('id', String(userId))
            .select();
          
          deletedData = adminResult.data;
          userDeleteError = adminResult.error;
          
        } catch (adminDeleteError) {
          logger.error('관리자 권한 삭제 중 예외', { userId, adminDeleteError });
          userDeleteError = adminDeleteError;
        }
      }
      
      // 최종 삭제 결과 확인
      if (userDeleteError) {
        logger.error('사용자 정보 삭제 실패', { 
          userId, 
          error: userDeleteError,
          code: userDeleteError.code,
          message: userDeleteError.message 
        });
        throw new DatabaseError('회원탈퇴 처리에 실패했습니다');
      }
      
      if (!deletedData || deletedData.length === 0) {
        logger.error('삭제된 데이터 없음', { userId });
        throw new DatabaseError('사용자 정보를 찾을 수 없거나 삭제에 실패했습니다');
      }
      
      logger.info('users 테이블 삭제 성공', { 
        userId, 
        deletedCount: deletedData.length
      });

      // 6. Supabase Auth에서도 완전 삭제
      try {
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        
        if (authDeleteError) {
          logger.warn('Supabase Auth 사용자 삭제 실패', authDeleteError);
          // 데이터는 이미 삭제되었으므로 경고만 출력
        } else {
          logger.info('Supabase Auth 사용자 삭제 성공', { userId });
        }
      } catch (authError) {
        logger.warn('Supabase Auth 삭제 중 예외', authError);
      }
      
      logger.info('회원탈퇴 성공 (완전 삭제, 24시간 재가입 제한)', { 
        userId, 
        deleteTime,
        expiresAt: expiresAt.toISOString()
      });
      
      return {
        success: true,
        message: '회원탈퇴가 완료되었습니다. 개인정보는 즉시 삭제되며, 24시간 후 동일한 계정으로 재가입이 가능합니다.',
        data: { 
          userId,
          deleteTime,
          restrictionExpiresAt: expiresAt.toISOString(),
          personalDataDeleted: true
        }
      };
      
    } catch (error) {
      logger.error('회원탈퇴 예외', error);
      throw error;
    }
  }

  /**
   * 24시간 재가입 제한 체크 (해시 기반)
   * @param {string} email - 확인할 이메일
   * @throws {DatabaseError} 24시간 내 재가입 시도 시
   */
  static async checkDeletionRestriction(email) {
    try {
      logger.info('재가입 제한 체크 시작');
      
      const emailHash = HashUtils.hashEmail(email);
      
      // deletion_restrictions 테이블에서 해시 확인
      const { data: restriction, error: restrictionError } = await supabase
        .from('deletion_restrictions')
        .select('expires_at, created_at')
        .eq('email_hash', emailHash)
        .maybeSingle();

      if (restrictionError) {
        logger.error('재가입 제한 체크 실패', { restrictionError });
        // 에러 시 안전하게 통과 (서비스 중단 방지)
        return;
      }

      if (!restriction) {
        logger.info('제한 없음 - 재가입 가능');
        return;
      }

      // 만료 시간 체크
      if (HashUtils.isExpired(restriction.expires_at)) {
        // 만료된 제한은 즉시 정리
        await supabase
          .from('deletion_restrictions')
          .delete()
          .eq('email_hash', emailHash);
        
        logger.info('만료된 재가입 제한 정리', { emailHash });
        return;
      }

      // 24시간 내 재가입 시도 차단
      logger.warn('24시간 내 재가입 시도 차단', { 
        createdAt: restriction.created_at,
        expiresAt: restriction.expires_at
      });

      throw new DatabaseError(
        `탈퇴 후 24시간 내에는 재가입할 수 없습니다.`
      );

    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error; // 재가입 제한 에러는 그대로 전파
      }
      
      logger.error('재가입 제한 체크 중 예외', error);
      // 기타 에러는 안전하게 통과 (서비스 중단 방지)
    }
  }

}
