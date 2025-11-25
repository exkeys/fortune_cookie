import { DailyUsageLogService } from '../services/dailyUsageLogService.js';
import { validateUserId, validateUUID } from '../utils/validation.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../utils/controllerWrapper.js';
import { successResponse, validationErrorResponse } from '../utils/responseHelper.js';

export class DailyUsageLogController {
  // 사용 로그 생성 (포춘쿠키 사용 시)
  static createUsageLog = asyncHandler(async (req, res) => {
    // userId는 인증 미들웨어에서 설정됨
    const userId = req.userId;
    
    const result = await DailyUsageLogService.createUsageLog(userId);
    return successResponse(res, result);
  });
  
  // 오늘 사용했는지 확인
  static hasUsedToday = asyncHandler(async (req, res) => {
    // userId는 인증 미들웨어에서 설정됨
    const userId = req.userId;
    
    logger.info('일일 사용 여부 체크 요청', { userId });
    
    const result = await DailyUsageLogService.hasUsedToday(userId);
    
    logger.info('일일 사용 여부 체크 응답', { 
      userId, 
      hasUsedToday: result.hasUsedToday,
      count: result.count
    });
    
    return successResponse(res, result);
  });
  
  // 특정 사용자의 로그 조회
  static getUserUsageLogs = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { limit } = req.query;
    
    validateUserId(userId);
    
    const result = await DailyUsageLogService.getUserUsageLogs(userId, parseInt(limit) || 100);
    return successResponse(res, result);
  });
  
  // 모든 로그 조회 (관리자용)
  static getAllUsageLogs = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const result = await DailyUsageLogService.getAllUsageLogs(parseInt(limit) || 1000);
    return successResponse(res, result);
  });
  
  // 사용 통계 조회
  static getUsageStats = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return validationErrorResponse(res, 'startDate와 endDate 쿼리 파라미터가 필요합니다');
    }
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return validationErrorResponse(res, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)');
    }
    
    const result = await DailyUsageLogService.getUsageStats(startDate, endDate);
    return successResponse(res, result);
  });
  
  // 오래된 로그 삭제
  static deleteOldLogs = asyncHandler(async (req, res) => {
    const { daysToKeep } = req.body;
    
    if (!daysToKeep || typeof daysToKeep !== 'number' || daysToKeep < 1) {
      return validationErrorResponse(res, 'daysToKeep는 1 이상의 숫자여야 합니다');
    }
    
    const result = await DailyUsageLogService.deleteOldLogs(daysToKeep);
    return successResponse(res, result);
  });
  
  // 특정 로그 삭제
  static deleteUsageLog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateUUID(id);
    
    const result = await DailyUsageLogService.deleteUsageLog(id);
    return successResponse(res, result);
  });

}
