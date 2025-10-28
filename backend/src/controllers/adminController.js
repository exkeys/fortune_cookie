import { supabase, supabaseAdmin } from '../config/database.js';
import { logger } from '../utils/logger.js';

export class AdminController {
  /**
   * 모든 사용자 목록 조회
   */
  static async getAllUsers(req, res, next) {
    try {
      logger.info('모든 사용자 목록 조회 요청');
      
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, nickname, status, is_admin, created_at, last_login_at, last_logout_at, school, login_count, oauth_provider')
        .order('created_at', { ascending: false });
      
      if (error) {
        logger.error('사용자 목록 조회 실패', error);
        return res.status(500).json({ error: '사용자 목록 조회에 실패했습니다' });
      }
      
      // 각 사용자의 운세 수 계산
      const usersWithFortuneCount = await Promise.all(
        users.map(async (user) => {
          const { count } = await supabase
            .from('ai_answers')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          
          return {
            ...user,
            fortune_count: count ?? 0
          };
        })
      );
      
      logger.info('사용자 목록 조회 성공', { count: usersWithFortuneCount.length });
      
      res.json({ users: usersWithFortuneCount });
    } catch (error) {
      logger.error('사용자 목록 조회 예외', error);
      next(error);
    }
  }

  /**
   * 사용자 상태 업데이트
   */
  static async updateUser(req, res, next) {
    try {
      const { userId, field, value } = req.body;
      
      if (!userId || !field || value === undefined) {
        return res.status(400).json({ error: 'userId, field, value가 필요합니다' });
      }

      logger.info('사용자 업데이트 요청', { userId, field, value });
      
      // 먼저 기존 사용자 정보 조회 (created_at 보존을 위해)
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .single();
      
      if (fetchError) {
        logger.error('기존 사용자 정보 조회 실패', fetchError);
        return res.status(500).json({ error: '사용자 정보 조회에 실패했습니다' });
      }
      
      // 업데이트 데이터 준비 (created_at 보존)
      const updateData = {
        [field]: value,
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
        logger.error('사용자 업데이트 실패', error);
        return res.status(500).json({ error: '사용자 업데이트에 실패했습니다' });
      }
      
      logger.info('사용자 업데이트 성공', { userId, field, value, preservedCreatedAt: existingUser.created_at });
      res.json({ user: data });
    } catch (error) {
      logger.error('사용자 업데이트 예외', error);
      next(error);
    }
  }

}
