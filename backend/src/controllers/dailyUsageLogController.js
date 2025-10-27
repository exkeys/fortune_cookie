import { DailyUsageLogService } from '../services/dailyUsageLogService.js';
import { validateRequest, isUUID } from '../utils/validation.js';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

export class DailyUsageLogController {
  // 사용 로그 생성 (포춘쿠키 사용 시)
  static async createUsageLog(req, res, next) {
    try {
      const validation = validateRequest(req, ['userId']);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }
      
      const { userId } = req.body;
      
      if (!isUUID(userId)) {
        throw new ValidationError('유효한 userId가 필요합니다');
      }
      
      const result = await DailyUsageLogService.createUsageLog(userId);
      res.json(result);
    } catch (error) {
      logger.error('사용 로그 생성 컨트롤러 에러', error);
      next(error);
    }
  }
  
  // 오늘 사용했는지 확인
  static async hasUsedToday(req, res, next) {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId 쿼리 파라미터가 필요합니다' });
      }
      
      if (!isUUID(userId)) {
        return res.status(400).json({ error: '유효한 userId가 필요합니다' });
      }
      
      const result = await DailyUsageLogService.hasUsedToday(userId);
      res.json(result);
    } catch (error) {
      logger.error('오늘 사용 여부 확인 컨트롤러 에러', error);
      next(error);
    }
  }
  
  // 특정 사용자의 로그 조회
  static async getUserUsageLogs(req, res, next) {
    try {
      const { userId } = req.params;
      const { limit } = req.query;
      
      if (!userId || !isUUID(userId)) {
        return res.status(400).json({ error: '유효한 userId가 필요합니다' });
      }
      
      const result = await DailyUsageLogService.getUserUsageLogs(userId, parseInt(limit) || 100);
      res.json(result);
    } catch (error) {
      logger.error('사용자 로그 조회 컨트롤러 에러', error);
      next(error);
    }
  }
  
  // 모든 로그 조회 (관리자용)
  static async getAllUsageLogs(req, res, next) {
    try {
      const { limit } = req.query;
      const result = await DailyUsageLogService.getAllUsageLogs(parseInt(limit) || 1000);
      res.json(result);
    } catch (error) {
      logger.error('모든 로그 조회 컨트롤러 에러', error);
      next(error);
    }
  }
  
  // 사용 통계 조회
  static async getUsageStats(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate와 endDate 쿼리 파라미터가 필요합니다' });
      }
      
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return res.status(400).json({ error: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)' });
      }
      
      const result = await DailyUsageLogService.getUsageStats(startDate, endDate);
      res.json(result);
    } catch (error) {
      logger.error('사용 통계 조회 컨트롤러 에러', error);
      next(error);
    }
  }
  
  // 오래된 로그 삭제
  static async deleteOldLogs(req, res, next) {
    try {
      const { daysToKeep } = req.body;
      
      if (!daysToKeep || typeof daysToKeep !== 'number' || daysToKeep < 1) {
        return res.status(400).json({ error: 'daysToKeep는 1 이상의 숫자여야 합니다' });
      }
      
      const result = await DailyUsageLogService.deleteOldLogs(daysToKeep);
      res.json(result);
    } catch (error) {
      logger.error('오래된 로그 삭제 컨트롤러 에러', error);
      next(error);
    }
  }
  
  // 특정 로그 삭제
  static async deleteUsageLog(req, res, next) {
    try {
      const { id } = req.params;
      
      if (!id || !isUUID(id)) {
        return res.status(400).json({ error: '유효한 ID가 필요합니다' });
      }
      
      const result = await DailyUsageLogService.deleteUsageLog(id);
      res.json(result);
    } catch (error) {
      logger.error('사용 로그 삭제 컨트롤러 에러', error);
      next(error);
    }
  }
}



