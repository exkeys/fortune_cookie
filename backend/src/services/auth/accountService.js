import { supabase, supabaseAdmin } from '../../config/database.js';
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
      logger.info('재가입 제한 체크 시작');
      
      const emailHash = HashUtils.hashEmail(email);
      
      // deletion_restrictions 테이블에서 해시 확인 (RLS 우회를 위해 supabaseAdmin 사용)
      const { data: restriction, error: restrictionError } = await supabaseAdmin
        .from('deletion_restrictions')
        .select('expires_at, created_at')
        .eq('email_hash', emailHash)
        .maybeSingle();

      if (restrictionError) {
        logger.error('재가입 제한 체크 실패', { restrictionError });
        // 에러 시 안전하게 통과 (서비스 중단 방지)
        return { isRestricted: false };
      }

      if (!restriction) {
        logger.info('제한 없음 - 재가입 가능');
        return { isRestricted: false };
      }

      // 만료 시간 체크
      if (HashUtils.isExpired(restriction.expires_at)) {
        // 만료된 제한은 즉시 정리 (RLS 우회를 위해 supabaseAdmin 사용)
        await supabaseAdmin
          .from('deletion_restrictions')
          .delete()
          .eq('email_hash', emailHash);
        
        logger.info('만료된 재가입 제한 정리', { emailHash });
        return { isRestricted: false };
      }

      // === 운영용: 24시간 내 재가입 시도 차단 (운영시 활성화) ===
      logger.warn('24시간 내 재가입 시도 차단', { 
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
      logger.info('회원탈퇴 요청 (완전 삭제 방식)', { userId });

      // 1. 사용자 정보 조회 (삭제 전 이메일, 학교 정보 확보) - RLS 정책 우회를 위해 supabaseAdmin 사용
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

      // 2. 재가입 제한을 위한 해시 정보 저장 (개인정보 없음)
      // === 운영용: 24시간 재가입 제한 (운영시 활성화) ===
      // 24시간 재가입 제한을 위한 해시 정보 저장
      // === 테스트용: 1분 재가입 제한 (테스트시 주석 해제 필요) ===
      // // 1분 재가입 제한을 위한 해시 정보 저장
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

      // RLS 정책 우회를 위해 supabaseAdmin 사용
      // UNIQUE 제약조건 충돌 시 기존 레코드 업데이트 (upsert)
      const { data: insertedData, error: restrictionError } = await supabaseAdmin
        .from('deletion_restrictions')
        .upsert(restrictionData, {
          onConflict: 'email_hash',
          ignoreDuplicates: false
        })
        .select();

      if (restrictionError) {
        logger.error('재가입 제한 정보 저장 실패', { 
          restrictionError,
          errorCode: restrictionError.code,
          errorMessage: restrictionError.message,
          errorDetails: restrictionError.details,
          emailHash: emailHash.substring(0, 8) + '...' // 로그용 (일부만 표시)
        });
        throw new DatabaseError('탈퇴 처리 중 오류가 발생했습니다');
      }

      logger.info('재가입 제한 정보 저장 성공', { 
        expiresAt: expiresAt.toISOString(),
        insertedCount: insertedData?.length || 0,
        emailHash: emailHash.substring(0, 8) + '...' // 로그용 (일부만 표시)
      });

      // 3. 사용자의 모든 관련 데이터 삭제 (배치 처리로 최적화) - RLS 정책 우회를 위해 supabaseAdmin 사용
      const [concernsResult, usageLogResult] = await Promise.allSettled([
        supabaseAdmin
          .from('ai_answers')
          .delete()
          .eq('user_id', userId),
        supabaseAdmin
          .from('daily_usage_log')
          .delete()
          .eq('user_id', userId)
      ]);
      
      // ai_answers 삭제 결과 확인
      if (concernsResult.status === 'rejected') {
        logger.error('고민 기록 삭제 실패', concernsResult.reason);
        throw new DatabaseError('사용자 데이터 삭제에 실패했습니다');
      }
      if (concernsResult.value.error) {
        logger.error('고민 기록 삭제 실패', concernsResult.value.error);
        throw new DatabaseError('사용자 데이터 삭제에 실패했습니다');
      }
      
      // daily_usage_log 삭제 결과 확인 (치명적이지 않으므로 경고만)
      if (usageLogResult.status === 'rejected') {
        logger.warn('사용 로그 삭제 실패 (계속 진행)', usageLogResult.reason);
      } else if (usageLogResult.value.error) {
        logger.warn('사용 로그 삭제 실패 (계속 진행)', usageLogResult.value.error);
      }

      // 5. users 테이블에서 완전 삭제 - RLS 정책 우회를 위해 supabaseAdmin 사용
      let deletedData = null;
      let userDeleteError = null;
      
      try {
        const result = await supabaseAdmin
          .from('users')
          .delete()
          .eq('id', String(userId))
          .select();
        
        deletedData = result.data;
        userDeleteError = result.error;
        
        if (userDeleteError) {
          logger.error('users 테이블 삭제 실패', { 
            userId, 
            error: userDeleteError,
            errorCode: userDeleteError.code,
            errorMessage: userDeleteError.message,
            errorDetails: userDeleteError.details
          });
        }
      } catch (deleteError) {
        logger.error('users 테이블 삭제 중 예외', { userId, deleteError });
        userDeleteError = deleteError;
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
}

