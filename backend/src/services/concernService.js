import { supabase } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { DatabaseError, ValidationError } from '../utils/errors.js';

export class ConcernService {
  // 고민 저장
  static async saveConcern(userId, persona, concern, aiAnswer) {
    try {
      logger.info('고민 저장 요청', { userId, persona, concern });
      
      // 먼저 사용자가 존재하는지 확인하고, 없으면 생성
      if (userId && userId !== 'null' && userId !== '') {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .single();
        
        if (userError || !user) {
          logger.warn('사용자를 찾을 수 없음, 사용자 생성 시도', { userId, userError });
          
          // 사용자가 없으면 기본 사용자 정보로 생성 시도
          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email: `user_${userId}@temp.com`, // 임시 이메일
              nickname: '사용자',
              oauth_provider: 'temp',
              status: 'active',
              login_count: 0
            });
          
          if (createError) {
            logger.warn('사용자 생성 실패, user_id를 null로 설정', { createError });
            userId = null;
          } else {
            logger.info('사용자 생성 성공', { userId });
          }
        }
      } else {
        userId = null;
      }
      
      const { error } = await supabase
        .from('ai_answers')
        .insert({
          user_id: userId,
          persona,
          concern,
          ai_response: aiAnswer,
          is_saved: false
        });
      
      if (error) {
        logger.error('고민 저장 실패', error);
        
        if (error.code === '23505') {
          throw new ValidationError('이미 같은 고민이 저장되어 있습니다');
        }
        
        if (error.code === '23503') {
          logger.warn('외래키 제약 조건 위반, user_id를 null로 재시도');
          // user_id를 null로 다시 시도
          const { error: retryError } = await supabase
            .from('ai_answers')
            .insert({
              user_id: null,
              persona,
              concern,
              ai_response: aiAnswer,
              is_saved: false
            });
          
          if (retryError) {
            logger.error('고민 저장 재시도 실패', retryError);
            throw new DatabaseError('고민 저장에 실패했습니다');
          }
        } else {
          throw new DatabaseError('고민 저장에 실패했습니다');
        }
      }
      
      logger.info('고민 저장 성공', { userId });
      return { success: true };
    } catch (error) {
      logger.error('고민 저장 예외', error);
      throw error;
    }
  }
  
  // 고민 목록 조회
  static async getConcerns(userId) {
    try {
      logger.info('고민 목록 조회 요청', { userId });
      
      let query = supabase
        .from('ai_answers')
        .select('id, persona, concern, ai_response, is_saved, created_at');
      
      if (!userId || userId === 'null' || userId === '') {
        query = query.is('user_id', null);
      } else {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        logger.error('고민 목록 조회 실패', error);
        throw new DatabaseError('고민 목록 조회에 실패했습니다');
      }
      
      logger.info('고민 목록 조회 성공', { count: data?.length || 0 });
      return { concerns: data || [] };
    } catch (error) {
      logger.error('고민 목록 조회 예외', error);
      throw error;
    }
  }
  
  // 고민 저장 상태 업데이트
  static async updateConcernSaveStatus(concernId, isSaved) {
    try {
      logger.info('고민 저장 상태 업데이트 요청', { concernId, isSaved });
      
      const { error } = await supabase
        .from('ai_answers')
        .update({ is_saved: isSaved })
        .eq('id', concernId);
      
      if (error) {
        logger.error('고민 저장 상태 업데이트 실패', error);
        throw new DatabaseError('고민 저장 상태 업데이트에 실패했습니다');
      }
      
      logger.info('고민 저장 상태 업데이트 성공', { concernId, isSaved });
      return { success: true };
    } catch (error) {
      logger.error('고민 저장 상태 업데이트 예외', error);
      throw error;
    }
  }

  // 고민 삭제
  static async deleteConcern(concernId) {
    try {
      logger.info('고민 삭제 요청', { concernId });
      
      const { error } = await supabase
        .from('ai_answers')
        .delete()
        .eq('id', concernId);
      
      if (error) {
        logger.error('고민 삭제 실패', error);
        throw new DatabaseError('고민 삭제에 실패했습니다');
      }
      
      logger.info('고민 삭제 성공', { concernId });
      return { success: true };
    } catch (error) {
      logger.error('고민 삭제 예외', error);
      throw error;
    }
  }
}
