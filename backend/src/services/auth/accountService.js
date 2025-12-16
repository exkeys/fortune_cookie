import { supabaseAdmin } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { DatabaseError } from '../../utils/errors.js';
import { HashUtils } from '../../utils/hashUtils.js';

export class AccountService {
  /**
   * 재가입 제한 체크 (해시 기반)
   * === 운영용: 24시간 재가입 제한 체크 (운영시 활성화) ===
   * 24시간 재가입 제한 체크 (해시 기반)
   * @param {string} email - 확인할 이메일
   * @returns {Promise<{isRestricted: boolean, message?: string}>} 제한 여부와 메시지
   * 
   * === 테스트용: 1분 재가입 제한 체크 (테스트시 주석 해제 필요) ===
   * 1분 재가입 제한 체크 (해시 기반, 테스트용)
   * @param {string} email - 확인할 이메일
   * @returns {Promise<{isRestricted: boolean, message?: string}>} 제한 여부와 메시지
   */
  static async checkDeletionRestriction(email) {
    try {
      const emailHash = HashUtils.hashEmail(email);
      
      const { data: restriction, error: restrictionError } = await supabaseAdmin
        .from('deletion_restrictions')
        .select('expires_at, created_at')
        .eq('email_hash', emailHash)
        .maybeSingle();

      if (restrictionError) {
        logger.error('재가입 제한 체크 실패', { restrictionError });
        return { isRestricted: false };
      }

      if (!restriction) {
        return { isRestricted: false };
      }

      if (HashUtils.isExpired(restriction.expires_at)) {
        await supabaseAdmin
          .from('deletion_restrictions')
          .delete()
          .eq('email_hash', emailHash);
        
        return { isRestricted: false };
      }

      logger.warn('재가입 제한 차단', { 
        createdAt: restriction.created_at,
        expiresAt: restriction.expires_at
      });
      
      return { 
        isRestricted: true,
        message: '탈퇴 후 24시간 내에는 재가입할 수 없습니다.'
      };
      
      // === 테스트용: 1분 내 재가입 시도 차단 (테스트시 주석 해제 필요) ===
      // logger.warn('1분 내 재가입 시도 차단 (테스트용)', { 
      //   createdAt: restriction.created_at,
      //   expiresAt: restriction.expires_at
      // });
      //
      // return { 
      //   isRestricted: true,
      //   message: '탈퇴 후 1분 내에는 재가입할 수 없습니다. (테스트용)'
      // };

    } catch (error) {
      logger.error('재가입 제한 체크 중 예외', error);
      // 기타 에러는 안전하게 통과 (서비스 중단 방지)
      return { isRestricted: false };
    }
  }

  // 회원탈퇴 (완전 삭제 방식)
  static async deleteAccount(userId, userAgent = '', ipAddress = '') {
    try {
      logger.info('회원탈퇴 요청', { userId });

      const { data: user, error: userFetchError } = await supabaseAdmin
        .from('users')
        .select('email, nickname, status, school')
        .eq('id', userId)
        .single();

      if (userFetchError || !user) {
        logger.error('사용자 조회 실패', { userId, userFetchError });
        throw new DatabaseError('사용자 정보를 찾을 수 없습니다');
      }

      const userEmail = user.email;
      const deleteTime = new Date().toISOString();
      const expiresAt = HashUtils.getExpirationTime();

      const { error: restrictionError } = await supabaseAdmin
        .from('deletion_restrictions')
        .upsert({
          email_hash: HashUtils.hashEmail(userEmail),
          user_agent_hash: HashUtils.hashUserAgent(userAgent),
          ip_hash: HashUtils.hashIP(ipAddress),
          expires_at: expiresAt.toISOString(),
          deletion_reason: 'user_request'
        }, {
          onConflict: 'email_hash',
          ignoreDuplicates: false
        });

      if (restrictionError) {
        logger.error('재가입 제한 저장 실패', { restrictionError });
        throw new DatabaseError('탈퇴 처리 중 오류가 발생했습니다');
      }

      // 모든 삭제 작업 병렬 실행
      const [concernsResult, usageLogResult, usersResult, authDeleteResult] = await Promise.allSettled([
        supabaseAdmin.from('ai_answers').delete().eq('user_id', userId),
        supabaseAdmin.from('daily_usage_log').delete().eq('user_id', userId),
        supabaseAdmin.from('users').delete().eq('id', String(userId)).select(),
        supabaseAdmin.auth.admin.deleteUser(userId)
      ]);
      
      if (concernsResult.status === 'rejected' || concernsResult.value?.error) {
        logger.error('고민 기록 삭제 실패', concernsResult.reason || concernsResult.value?.error);
        throw new DatabaseError('사용자 데이터 삭제에 실패했습니다');
      }
      
      if (usersResult.status === 'rejected') {
        logger.error('사용자 정보 삭제 실패', usersResult.reason);
        throw new DatabaseError('회원탈퇴 처리에 실패했습니다');
      }

      const deletedData = usersResult.value?.data;
      const userDeleteError = usersResult.value?.error;
        
      if (userDeleteError || !deletedData || deletedData.length === 0) {
        logger.error('사용자 삭제 실패', { userId, error: userDeleteError });
        throw new DatabaseError('회원탈퇴 처리에 실패했습니다');
      }
      
      if (usageLogResult.status === 'rejected' || usageLogResult.value?.error) {
        logger.warn('사용 로그 삭제 실패', usageLogResult.reason || usageLogResult.value?.error);
      }

      if (authDeleteResult.status === 'rejected' || authDeleteResult.value?.error) {
        logger.warn('Auth 사용자 삭제 실패', authDeleteResult.reason || authDeleteResult.value?.error);
      }
      
      // === 운영용: 24시간 재가입 제한 (운영시 활성화) ===
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
      
      // === 테스트용: 1분 재가입 제한 (테스트시 주석 해제 필요) ===
      // logger.info('회원탈퇴 성공 (완전 삭제, 1분 재가입 제한, 테스트용)', { 
      //   userId, 
      //   deleteTime,
      //   expiresAt: expiresAt.toISOString()
      // });
      // 
      // return {
      //   success: true,
      //   message: '회원탈퇴가 완료되었습니다. 개인정보는 즉시 삭제되며, 1분 후 동일한 계정으로 재가입이 가능합니다. (테스트용)',
      //   data: { 
      //     userId,
      //     deleteTime,
      //     restrictionExpiresAt: expiresAt.toISOString(),
      //     personalDataDeleted: true
      //   }
      // };
      
    } catch (error) {
      logger.error('회원탈퇴 예외', error);
      throw error;
    }
  }

  /**
   * 로그인 상태 통합 체크 (재가입 제한 + 밴 상태)
   * @param {string} userId - 사용자 ID
   * @param {string} email - 사용자 이메일
   * @returns {Promise<{canLogin: boolean, status: string, isRestricted: boolean, restrictedUntil?: string}>}
   */
  static async checkLoginStatus(userId, email) {
    try {
      // 사용자 상태 조회
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('status')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        logger.error('사용자 상태 조회 실패', { userId, userError });
        // 에러 시 안전하게 통과
        return {
          canLogin: true,
          status: 'active',
          isRestricted: false
        };
      }

      const userStatus = user?.status || 'active';

      // 재가입 제한 체크
      const restriction = await this.checkDeletionRestriction(email);
      const isRestricted = restriction?.isRestricted || false;

      // 제한 만료 시간 조회
      let restrictedUntil = null;
      if (isRestricted) {
        const emailHash = HashUtils.hashEmail(email);
        const { data: restrictionData } = await supabaseAdmin
          .from('deletion_restrictions')
          .select('expires_at')
          .eq('email_hash', emailHash)
          .maybeSingle();
        
        restrictedUntil = restrictionData?.expires_at || null;
      }

      const canLogin = userStatus !== 'banned' && !isRestricted;

      return {
        canLogin,
        status: userStatus,
        isRestricted,
        restrictedUntil
      };
    } catch (error) {
      logger.error('로그인 상태 체크 중 예외', error);
      // 에러 시 안전하게 통과
      return {
        canLogin: true,
        status: 'active',
        isRestricted: false
      };
    }
  }
}

