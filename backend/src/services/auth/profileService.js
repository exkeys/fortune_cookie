import { supabase, supabaseAdmin } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { DatabaseError } from '../../utils/errors.js';

export class ProfileService {
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

  // 사용자 프로필 조회
  static async getProfile(userId) {
    try {
      if (!userId) {
        throw new DatabaseError('사용자 ID가 필요합니다');
      }

      logger.info('사용자 프로필 조회 요청', { userId });

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, nickname, status, is_admin, school, created_at, last_login_at')
        .eq('id', userId)
        .single();

      if (error || !user) {
        logger.error('사용자 조회 실패', { userId, error });
        throw new DatabaseError('사용자를 찾을 수 없습니다');
      }

      // 밴/삭제 상태 체크
      if (user.status === 'banned') {
        logger.warn('밴된 사용자 접근 차단', { userId, email: user.email, status: user.status });
        const bannedError = new DatabaseError('계정이 차단되었습니다. 관리자에게 문의하세요.');
        bannedError.statusCode = 403;
        bannedError.code = 'ACCOUNT_BANNED';
        throw bannedError;
      }

      if (user.status === 'deleted') {
        logger.warn('삭제된 사용자 접근 차단', { userId, email: user.email, status: user.status });
        const deletedError = new DatabaseError('탈퇴한 계정입니다.');
        deletedError.statusCode = 403;
        deletedError.code = 'ACCOUNT_DELETED';
        throw deletedError;
      }

      logger.info('사용자 프로필 조회 성공', { userId });
      return { user };
    } catch (error) {
      logger.error('사용자 프로필 조회 예외', error);
      throw error;
    }
  }

  // 사용자 프로필 업데이트 (학교 정보 등)
  static async updateProfile(userId, updates) {
    try {
      if (!userId) {
        throw new DatabaseError('사용자 ID가 필요합니다');
      }

      logger.info('사용자 프로필 업데이트 요청', { userId, updates });

      // 먼저 사용자 존재 확인
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .single();

      if (fetchError || !existingUser) {
        logger.error('사용자 조회 실패', fetchError);
        throw new DatabaseError('사용자를 찾을 수 없습니다');
      }

      // 업데이트 데이터 준비 (created_at 보존)
      const updateData = {
        ...updates,
        created_at: existingUser.created_at // 기존 created_at 값 유지
      };

      // supabaseAdmin으로 관리자 권한으로 업데이트
      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error('프로필 업데이트 실패', error);
        throw new DatabaseError('프로필 업데이트에 실패했습니다');
      }

      logger.info('프로필 업데이트 성공', { userId, updates });
      return { user: data };
    } catch (error) {
      logger.error('프로필 업데이트 예외', error);
      throw error;
    }
  }
}

