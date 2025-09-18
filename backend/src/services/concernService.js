import { supabase } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { DatabaseError, ValidationError } from '../utils/errors.js';

export class ConcernService {
  // 고민 저장
  static async saveConcern(userId, persona, concern, aiAnswer) {
    try {
      logger.info('고민 저장 요청', { userId, persona, concern });
      
      const { error } = await supabase
        .from('ai_answers')
        .insert({
          user_id: userId,
          persona,
          concern,
          ai_response: aiAnswer
        });
      
      if (error) {
        logger.error('고민 저장 실패', error);
        
        if (error.code === '23505') {
          throw new ValidationError('이미 같은 고민이 저장되어 있습니다');
        }
        
        throw new DatabaseError('고민 저장에 실패했습니다');
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
        .select('id, persona, concern, ai_response, created_at');
      
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
