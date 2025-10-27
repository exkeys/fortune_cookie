import { AccessControlService } from '../services/accessControlService.js';
import { validateRequest, isUUID } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

export class AccessControlController {
  /**
   * 사용자 접근 권한 체크
   */
  static async checkUserAccess(req, res, next) {
    try {
      const { userId } = req.query;
      
      if (!userId || !isUUID(userId)) {
        return res.status(400).json({ error: '유효한 사용자 ID가 필요합니다' });
      }
      
      const result = await AccessControlService.checkUserAccess(userId);
      res.json(result);
    } catch (error) {
      logger.error('접근 권한 체크 컨트롤러 에러', error);
      next(error);
    }
  }

  /**
   * 일일 사용 제한 체크
   */
  static async checkDailyUsage(req, res, next) {
    try {
      const { userId, userSchool } = req.query;
      
      if (!userId || !isUUID(userId)) {
        return res.status(400).json({ error: '유효한 사용자 ID가 필요합니다' });
      }
      
      if (!userSchool) {
        return res.status(400).json({ error: '학교 정보가 필요합니다' });
      }
      
      const result = await AccessControlService.checkDailyUsageLimit(userId, userSchool);
      res.json(result);
    } catch (error) {
      logger.error('일일 사용 제한 체크 컨트롤러 에러', error);
      next(error);
    }
  }

  /**
   * 전체 접근 권한 체크 (접근 권한 + 일일 제한)
   */
  static async checkFullAccess(req, res, next) {
    try {
      const { userId } = req.query;
      
      if (!userId || !isUUID(userId)) {
        return res.status(400).json({ error: '유효한 사용자 ID가 필요합니다' });
      }
      
      const result = await AccessControlService.checkFullAccess(userId);
      res.json(result);
    } catch (error) {
      logger.error('전체 접근 권한 체크 컨트롤러 에러', error);
      next(error);
    }
  }
}
