import { supabase, supabaseAdmin } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { DatabaseError, ValidationError } from '../utils/errors.js';
import { isValidUserId } from '../utils/validation.js';

export class ConcernService {
  // 고민 저장
  static async saveConcern(userId, persona, concern, aiAnswer, aiFeed) {
    try {
      logger.info('고민 저장 요청', { userId, persona, concern });
      
      // 먼저 사용자가 존재하는지 확인하고, 없으면 생성
      if (isValidUserId(userId)) {
        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', String(userId))
          .single();
        
        if (userError || !user) {
          logger.warn('사용자를 찾을 수 없음, 사용자 생성 시도', { userId, userError });
          
          // 사용자가 없으면 기본 사용자 정보로 생성 시도
          const currentTime = new Date().toISOString();
          const { error: createError } = await supabaseAdmin
            .from('users')
            .insert({
              id: String(userId),
              email: `user_${userId}@temp.com`, // 임시 이메일
              nickname: '사용자',
              oauth_provider: 'temp',
              status: 'active',
              created_at: currentTime, // 새 사용자이므로 현재 시간이 생성일
              last_login_at: currentTime,
              last_logout_at: null
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
      
      // supabaseAdmin을 사용하여 RLS 정책 우회
      const { error } = await supabaseAdmin
        .from('ai_answers')
        .insert({
          user_id: userId ? String(userId) : null,
          persona,
          concern,
          ai_response: aiAnswer,
          ai_feed: aiFeed,
          is_saved: true // 저장하기 버튼을 눌렀으므로 true
        });
      
      if (error) {
        logger.error('고민 저장 실패', error);
        
        if (error.code === '23505') {
          throw new ValidationError('이미 같은 고민이 저장되어 있습니다');
        }
        
        if (error.code === '23503') {
          logger.warn('외래키 제약 조건 위반, user_id를 null로 재시도');
          // user_id를 null로 다시 시도
          const { error: retryError } = await supabaseAdmin
            .from('ai_answers')
            .insert({
              user_id: null,
              persona,
              concern,
              ai_response: aiAnswer,
              ai_feed: aiFeed,
              is_saved: true
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
      
      // supabaseAdmin을 사용하여 RLS 정책 우회
      let query = supabaseAdmin
        .from('ai_answers')
        .select('id, persona, concern, ai_response, ai_feed, is_saved, created_at, updated_at');
      
      if (!isValidUserId(userId)) {
        query = query.is('user_id', null);
      } else {
        query = query.eq('user_id', String(userId));
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

  // 고민 내용 업데이트 (비슷한 고민으로 새 운세 받기)
  static async updateConcern(concernId, userId, aiAnswer, aiFeed) {
    try {
      logger.info('고민 내용 업데이트 요청', { concernId, userId });
      
      // 먼저 레코드가 존재하고 해당 사용자의 것인지 확인 (RLS 우회를 위해 supabaseAdmin 사용)
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('ai_answers')
        .select('id, user_id')
        .eq('id', concernId)
        .single();
      
      if (fetchError || !existing) {
        logger.error('고민을 찾을 수 없음', { concernId, error: fetchError });
        throw new ValidationError('고민을 찾을 수 없습니다');
      }
      
      if (existing.user_id !== userId) {
        logger.error('권한 없음: 다른 사용자의 고민', { concernId, userId, ownerId: existing.user_id });
        throw new ValidationError('이 고민을 수정할 권한이 없습니다');
      }
      
      // 업데이트 실행 (RLS 우회를 위해 supabaseAdmin 사용)
      const { error } = await supabaseAdmin
        .from('ai_answers')
        .update({
          ai_response: aiAnswer,
          ai_feed: aiFeed,
          updated_at: new Date().toISOString(),
          is_saved: true
        })
        .eq('id', concernId)
        .eq('user_id', userId); // 이중 체크로 보안 강화
      
      if (error) {
        logger.error('고민 내용 업데이트 실패', error);
        throw new DatabaseError('고민 내용 업데이트에 실패했습니다');
      }
      
      logger.info('고민 내용 업데이트 성공', { concernId, userId });
      return { success: true };
    } catch (error) {
      logger.error('고민 내용 업데이트 예외', error);
      throw error;
    }
  }

  // 고민 삭제
  static async deleteConcern(concernId) {
    try {
      logger.info('고민 삭제 요청', { concernId });
      
      // supabaseAdmin을 사용하여 RLS 정책 우회
      const { error } = await supabaseAdmin
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
