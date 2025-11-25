import { supabase } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { DatabaseError, ValidationError } from '../utils/errors.js';

export class SchoolPeriodService {
  // 학교 기간 생성
  static async createSchoolPeriod(schoolName, startDate, endDate) {
    try {
      logger.info('학교 기간 생성 요청', { schoolName, startDate, endDate });
      
      // 날짜 유효성 검증
      if (startDate >= endDate) {
        throw new ValidationError('시작일은 종료일보다 이전이어야 합니다');
      }
      
      const { data, error } = await supabase
        .from('school_periods')
        .insert({
          school_name: schoolName,
          start_date: startDate,
          end_date: endDate
        })
        .select();
      
      if (error) {
        logger.error('학교 기간 생성 실패', error);
        throw new DatabaseError('학교 기간 생성에 실패했습니다');
      }
      
      logger.info('학교 기간 생성 성공', { id: data[0]?.id });
      return { schoolPeriod: data[0] };
    } catch (error) {
      logger.error('학교 기간 생성 예외', error);
      throw error;
    }
  }
  
  // 모든 학교 기간 조회
  static async getAllSchoolPeriods() {
    try {
      logger.info('모든 학교 기간 조회 요청');
      
      const { data, error } = await supabase
        .from('school_periods')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        // 테이블이 존재하지 않거나 접근 권한이 없는 경우
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          logger.warn('school_periods 테이블이 존재하지 않음 - 빈 배열 반환', {
            error: error.message,
            code: error.code
          });
          return { schoolPeriods: [] };
        }
        
        logger.error('학교 기간 조회 실패', {
          error: error,
          message: error.message,
          code: error.code,
          details: error.details
        });
        
        // 다른 종류의 에러도 빈 배열 반환
        logger.warn('데이터베이스 에러로 인해 빈 배열 반환', { errorCode: error.code });
        return { schoolPeriods: [] };
      }
      
      logger.info('학교 기간 조회 성공', { count: data?.length || 0 });
      return { schoolPeriods: data || [] };
    } catch (error) {
      logger.error('학교 기간 조회 예외', error);
      // 예외가 발생해도 빈 배열 반환 (사용자에게는 "설정되지 않음"으로 표시)
      logger.warn('예외 발생으로 인해 빈 배열 반환');
      return { schoolPeriods: [] };
    }
  }
  
  // 특정 날짜에 활성화된 학교 기간 조회
  static async getActiveSchoolPeriods(targetDate) {
    try {
      logger.info('활성화된 학교 기간 조회 요청', { targetDate });
      
      const { data, error } = await supabase
        .from('school_periods')
        .select('*')
        .lte('start_date', targetDate)
        .gte('end_date', targetDate)
        .order('school_name', { ascending: true });
      
      if (error) {
        // 테이블이 존재하지 않거나 접근 권한이 없는 경우
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          logger.warn('school_periods 테이블이 존재하지 않음 - 빈 배열 반환', {
            error: error.message,
            code: error.code
          });
          return { schoolPeriods: [] };
        }
        
        logger.error('활성화된 학교 기간 조회 실패', {
          error: error,
          message: error.message,
          code: error.code,
          details: error.details,
          targetDate
        });
        
        // 다른 종류의 에러는 빈 배열 반환 (사용자에게는 "설정되지 않음"으로 표시)
        logger.warn('데이터베이스 에러로 인해 빈 배열 반환', { errorCode: error.code });
        return { schoolPeriods: [] };
      }
      
      logger.info('활성화된 학교 기간 조회 성공', { count: data?.length || 0 });
      return { schoolPeriods: data || [] };
    } catch (error) {
      logger.error('활성화된 학교 기간 조회 예외', error);
      // 예외가 발생해도 빈 배열 반환 (사용자에게는 "설정되지 않음"으로 표시)
      logger.warn('예외 발생으로 인해 빈 배열 반환');
      return { schoolPeriods: [] };
    }
  }
  
  // 특정 학교 기간 조회
  static async getSchoolPeriod(schoolPeriodId) {
    try {
      logger.info('특정 학교 기간 조회 요청', { schoolPeriodId });
      
      const { data, error } = await supabase
        .from('school_periods')
        .select('*')
        .eq('id', schoolPeriodId)
        .single();
      
      if (error) {
        
        logger.error('학교 기간 조회 실패', error);
        throw new DatabaseError('학교 기간을 찾을 수 없습니다');
      }
      
      logger.info('학교 기간 조회 성공', { schoolPeriodId });
      return { schoolPeriod: data };
    } catch (error) {
      logger.error('학교 기간 조회 예외', error);
      throw error;
    }
  }
  
  // 학교 기간 수정
  static async updateSchoolPeriod(schoolPeriodId, schoolName, startDate, endDate) {
    try {
      logger.info('학교 기간 수정 요청', { schoolPeriodId, schoolName, startDate, endDate });
      
      // 날짜 유효성 검증
      if (startDate && endDate && startDate >= endDate) {
        throw new ValidationError('시작일은 종료일보다 이전이어야 합니다');
      }
      
      const updateData = {};
      if (schoolName) updateData.school_name = schoolName;
      if (startDate) updateData.start_date = startDate;
      if (endDate) updateData.end_date = endDate;
      updateData.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('school_periods')
        .update(updateData)
        .eq('id', schoolPeriodId)
        .select();
      
      if (error) {
        logger.error('학교 기간 수정 실패', error);
        throw new DatabaseError('학교 기간 수정에 실패했습니다');
      }
      
      logger.info('학교 기간 수정 성공', { schoolPeriodId });
      return { schoolPeriod: data[0] };
    } catch (error) {
      logger.error('학교 기간 수정 예외', error);
      throw error;
    }
  }
  
  // 학교 기간 삭제
  static async deleteSchoolPeriod(schoolPeriodId) {
    try {
      logger.info('학교 기간 삭제 요청', { schoolPeriodId });
      
      const { error } = await supabase
        .from('school_periods')
        .delete()
        .eq('id', schoolPeriodId);
      
      if (error) {
        logger.error('학교 기간 삭제 실패', error);
        throw new DatabaseError('학교 기간 삭제에 실패했습니다');
      }
      
      logger.info('학교 기간 삭제 성공', { schoolPeriodId });
      return { success: true };
    } catch (error) {
      logger.error('학교 기간 삭제 예외', error);
      throw error;
    }
  }
}



