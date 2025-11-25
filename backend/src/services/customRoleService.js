import { supabaseAdmin } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { DatabaseError, ValidationError } from '../utils/errors.js';

export class CustomRoleService {
  // 사용자의 커스텀 역할 목록 조회
  static async getCustomRoles(userId) {
    try {
      logger.info('커스텀 역할 목록 조회 요청', { userId });
      
      const { data, error } = await supabaseAdmin
        .from('custom_roles')
        .select('id, role_name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      
      if (error) {
        logger.error('커스텀 역할 목록 조회 실패', error);
        throw new DatabaseError('커스텀 역할 목록 조회에 실패했습니다');
      }
      
      logger.info('커스텀 역할 목록 조회 성공', { count: data?.length || 0 });
      return { customRoles: data || [] };
    } catch (error) {
      logger.error('커스텀 역할 목록 조회 예외', error);
      throw error;
    }
  }

  // 커스텀 역할 생성
  static async createCustomRole(userId, roleName) {
    try {
      logger.info('커스텀 역할 생성 요청', { userId, roleName });
      
      const { data, error } = await supabaseAdmin
        .from('custom_roles')
        .insert({
          user_id: userId,
          role_name: roleName || ''
        })
        .select('id')
        .single();
      
      if (error) {
        logger.error('커스텀 역할 생성 실패', error);
        throw new DatabaseError('커스텀 역할 생성에 실패했습니다');
      }
      
      logger.info('커스텀 역할 생성 성공', { roleId: data.id });
      return { customRole: data };
    } catch (error) {
      logger.error('커스텀 역할 생성 예외', error);
      throw error;
    }
  }

  // 커스텀 역할 수정
  static async updateCustomRole(roleId, userId, roleName) {
    try {
      logger.info('커스텀 역할 수정 요청', { roleId, userId, roleName });
      
      // 먼저 해당 역할이 사용자의 것인지 확인
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('custom_roles')
        .select('id, user_id')
        .eq('id', roleId)
        .single();
      
      if (fetchError || !existing) {
        logger.error('커스텀 역할을 찾을 수 없음', { roleId, error: fetchError });
        throw new ValidationError('커스텀 역할을 찾을 수 없습니다');
      }
      
      if (existing.user_id !== userId) {
        logger.error('권한 없음: 다른 사용자의 역할', { roleId, userId, ownerId: existing.user_id });
        throw new ValidationError('이 역할을 수정할 권한이 없습니다');
      }
      
      const { data, error } = await supabaseAdmin
        .from('custom_roles')
        .update({ role_name: roleName })
        .eq('id', roleId)
        .eq('user_id', userId)
        .select('id, role_name')
        .single();
      
      if (error) {
        logger.error('커스텀 역할 수정 실패', error);
        throw new DatabaseError('커스텀 역할 수정에 실패했습니다');
      }
      
      logger.info('커스텀 역할 수정 성공', { roleId });
      return { customRole: data };
    } catch (error) {
      logger.error('커스텀 역할 수정 예외', error);
      throw error;
    }
  }

  // 커스텀 역할 삭제
  static async deleteCustomRole(roleId, userId) {
    try {
      logger.info('커스텀 역할 삭제 요청', { roleId, userId });
      
      // 먼저 해당 역할이 사용자의 것인지 확인
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('custom_roles')
        .select('id, user_id')
        .eq('id', roleId)
        .single();
      
      if (fetchError || !existing) {
        logger.error('커스텀 역할을 찾을 수 없음', { roleId, error: fetchError });
        throw new ValidationError('커스텀 역할을 찾을 수 없습니다');
      }
      
      if (existing.user_id !== userId) {
        logger.error('권한 없음: 다른 사용자의 역할', { roleId, userId, ownerId: existing.user_id });
        throw new ValidationError('이 역할을 삭제할 권한이 없습니다');
      }
      
      const { error } = await supabaseAdmin
        .from('custom_roles')
        .delete()
        .eq('id', roleId)
        .eq('user_id', userId);
      
      if (error) {
        logger.error('커스텀 역할 삭제 실패', error);
        throw new DatabaseError('커스텀 역할 삭제에 실패했습니다');
      }
      
      logger.info('커스텀 역할 삭제 성공', { roleId });
      return { success: true };
    } catch (error) {
      logger.error('커스텀 역할 삭제 예외', error);
      throw error;
    }
  }
}

