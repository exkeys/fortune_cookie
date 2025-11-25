import { AccessControlService } from '../services/accessControlService.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../utils/controllerWrapper.js';
import { successResponse, validationErrorResponse } from '../utils/responseHelper.js';

export class AccessControlController {
  /**
   * 사용자 접근 권한 체크
   */
  static checkUserAccess = asyncHandler(async (req, res) => {
    // userId는 인증 미들웨어에서 설정됨
    const userId = req.userId;
    
    const result = await AccessControlService.checkUserAccess(userId);
    return successResponse(res, result);
  });

  /**
   * 일일 사용 제한 체크
   */
  static checkDailyUsage = asyncHandler(async (req, res) => {
    // userId는 인증 미들웨어에서 설정됨
    const userId = req.userId;
    const { userSchool } = req.query;
    
    if (!userSchool) {
      return validationErrorResponse(res, '학교 정보가 필요합니다');
    }
    
    const result = await AccessControlService.checkDailyUsageLimit(userId, userSchool);
    return successResponse(res, result);
  });

  /**
   * 전체 접근 권한 체크 (접근 권한 + 일일 제한)
   */
  static checkFullAccess = asyncHandler(async (req, res) => {
    const startTime = Date.now();
    // userId는 인증 미들웨어에서 설정됨
    const userId = req.userId;
    const clientIP = req.ip || req.connection.remoteAddress;
    
    logger.info('전체 접근 권한 체크 요청', { 
      userId, 
      clientIP,
      userAgent: req.get('User-Agent')?.substring(0, 100) // 100자로 제한
    });
    
    const result = await AccessControlService.checkFullAccess(userId);
    const responseTime = Date.now() - startTime;
    
    logger.info('전체 접근 권한 체크 응답', { 
      userId, 
      canAccess: result.canAccess,
      canUse: result.canUse,
      responseTime: `${responseTime}ms`,
      hasReason: !!result.reason
    });
    
    return successResponse(res, result);
  });
}
