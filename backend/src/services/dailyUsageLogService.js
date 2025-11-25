import {  supabaseAdmin } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { DatabaseError  } from '../utils/errors.js';

export class DailyUsageLogService {
  // 사용 로그 생성 (포춘쿠키 사용 시)
  static async createUsageLog(userId) {
    try {
      logger.info('사용 로그 생성 요청', { userId });
      
      // RLS 정책 우회를 위해 supabaseAdmin 사용
      const { data, error } = await supabaseAdmin
        .from('daily_usage_log')
        .insert({
          user_id: String(userId),
          used_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        logger.error('사용 로그 생성 실패', error);
        throw new DatabaseError('사용 로그 생성에 실패했습니다');
      }
      
      logger.info('사용 로그 생성 성공', { id: data[0]?.id });
      return { usageLog: data[0] };
    } catch (error) {
      logger.error('사용 로그 생성 예외', error);
      throw error;
    }
  }
  
  // 오늘 사용했는지 확인
  static async hasUsedToday(userId) {
    try {
      logger.info('오늘 사용 여부 확인 요청', { userId });
      
      // 관리자는 일일 제한 우회 (RLS 정책 우회를 위해 supabaseAdmin 사용)
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('is_admin')
        .eq('id', String(userId))
        .single();

      if (user?.is_admin) {
        logger.info('관리자 일일 제한 우회', { userId });
        return { hasUsedToday: false, count: 0 }; // 관리자는 항상 사용 가능
      }
      
      // === 테스트용: 1분 제한 (테스트시 주석 해제 필요) ===
      // const now = new Date();
      // const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000); // 1분 전
      // 
      // const { data, error, count } = await supabase
      //   .from('daily_usage_log')
      //   .select('*', { count: 'exact' })
      //   .eq('user_id', String(userId))
      //   .gte('used_at', oneMinuteAgo.toISOString());
      
      // === 운영용: 24시간 제한 (운영시 활성화) ===
      // 오늘 날짜의 시작 (00:00:00)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      
      // 오늘 날짜의 끝 (23:59:59)
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const todayEndStr = todayEnd.toISOString();
      
      // RLS 정책 우회를 위해 supabaseAdmin 사용
      const { data, error, count } = await supabaseAdmin
        .from('daily_usage_log')
        .select('*', { count: 'exact' })
        .eq('user_id', String(userId))
        .gte('used_at', todayStart)
        .lte('used_at', todayEndStr);
      
      if (error) {
        logger.error('오늘 사용 여부 확인 실패', error);
        throw new DatabaseError('사용 여부 확인에 실패했습니다');
      }
      
      const hasUsed = count > 0;
      logger.info('오늘 사용 여부 확인 완료', { userId, hasUsed, count });
      return { hasUsedToday: hasUsed, count };
    } catch (error) {
      logger.error('오늘 사용 여부 확인 예외', error);
      throw error;
    }
  }
  
  // 특정 사용자의 모든 로그 조회
  static async getUserUsageLogs(userId, limit = 100) {
    try {
      logger.info('사용자 로그 조회 요청', { userId, limit });
      
      // RLS 정책 우회를 위해 supabaseAdmin 사용
      const { data, error } = await supabaseAdmin
        .from('daily_usage_log')
        .select('*')
        .eq('user_id', String(userId))
        .order('used_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        logger.error('사용자 로그 조회 실패', error);
        throw new DatabaseError('사용자 로그 조회에 실패했습니다');
      }
      
      logger.info('사용자 로그 조회 성공', { userId, count: data?.length || 0 });
      return { logs: data || [] };
    } catch (error) {
      logger.error('사용자 로그 조회 예외', error);
      throw error;
    }
  }
  
  // 모든 로그 조회 (관리자용)
  static async getAllUsageLogs(limit = 1000) {
    try {
      logger.info('모든 로그 조회 요청', { limit });
      
      // RLS 정책 우회를 위해 supabaseAdmin 사용
      const { data, error } = await supabaseAdmin
        .from('daily_usage_log')
        .select('*')
        .order('used_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        logger.error('모든 로그 조회 실패', error);
        throw new DatabaseError('로그 조회에 실패했습니다');
      }
      
      logger.info('모든 로그 조회 성공', { count: data?.length || 0 });
      return { logs: data || [] };
    } catch (error) {
      logger.error('모든 로그 조회 예외', error);
      throw error;
    }
  }
  
  // 특정 기간의 사용 통계
  static async getUsageStats(startDate, endDate) {
    try {
      logger.info('사용 통계 조회 요청', { startDate, endDate });
      
      // 최적화: 필요한 필드만 선택 (user_id, used_at만)
      // RLS 정책 우회를 위해 supabaseAdmin 사용
      const { data, error } = await supabaseAdmin
        .from('daily_usage_log')
        .select('user_id, used_at')
        .gte('used_at', startDate)
        .lte('used_at', endDate)
        .order('used_at', { ascending: true });
      
      if (error) {
        logger.error('사용 통계 조회 실패', error);
        throw new DatabaseError('사용 통계 조회에 실패했습니다');
      }
      
      // 통계 계산
      const stats = {
        totalUsages: data?.length || 0,
        uniqueUsers: new Set(data?.map(log => log.user_id) || []).size,
        byDate: {}
      };
      
      // 날짜별 집계
      data?.forEach(log => {
        const date = log.used_at.split('T')[0];
        stats.byDate[date] = (stats.byDate[date] || 0) + 1;
      });
      
      logger.info('사용 통계 조회 성공', stats);
      return { stats };
    } catch (error) {
      logger.error('사용 통계 조회 예외', error);
      throw error;
    }
  }
  
  // 오래된 로그 삭제 (자동 삭제용)
  static async deleteOldLogs(daysToKeep) {
    try {
      logger.info('오래된 로그 삭제 요청', { daysToKeep });
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffDateStr = cutoffDate.toISOString();
      
      // RLS 정책 우회를 위해 supabaseAdmin 사용
      const { data, error } = await supabaseAdmin
        .from('daily_usage_log')
        .delete()
        .lt('created_at', cutoffDateStr)
        .select();
      
      if (error) {
        logger.error('오래된 로그 삭제 실패', error);
        throw new DatabaseError('오래된 로그 삭제에 실패했습니다');
      }
      
      const deletedCount = data?.length || 0;
      logger.info('오래된 로그 삭제 성공', { deletedCount, daysToKeep });
      return { deletedCount, success: true };
    } catch (error) {
      logger.error('오래된 로그 삭제 예외', error);
      throw error;
    }
  }
  
  // 특정 로그 삭제
  static async deleteUsageLog(logId) {
    try {
      logger.info('사용 로그 삭제 요청', { logId });
      
      // RLS 정책 우회를 위해 supabaseAdmin 사용
      const { error } = await supabaseAdmin
        .from('daily_usage_log')
        .delete()
        .eq('id', logId);
      
      if (error) {
        logger.error('사용 로그 삭제 실패', error);
        throw new DatabaseError('사용 로그 삭제에 실패했습니다');
      }
      
      logger.info('사용 로그 삭제 성공', { logId });
      return { success: true };
    } catch (error) {
      logger.error('사용 로그 삭제 예외', error);
      throw error;
    }
  }

}



