import { SchoolPeriodService } from '../services/schoolPeriodService.js';
import { validateRequest, isUUID } from '../utils/validation.js';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

export class SchoolPeriodController {
  // 학교 기간 생성
  static async createSchoolPeriod(req, res, next) {
    try {
      const validation = validateRequest(req, ['schoolName', 'startDate', 'endDate']);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }
      
      const { schoolName, startDate, endDate } = req.body;
      
      // 날짜 형식 검증
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        throw new ValidationError('날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)');
      }
      
      const result = await SchoolPeriodService.createSchoolPeriod(schoolName, startDate, endDate);
      res.json(result);
    } catch (error) {
      logger.error('학교 기간 생성 컨트롤러 에러', error);
      next(error);
    }
  }
  
  // 모든 학교 기간 조회
  static async getAllSchoolPeriods(req, res, next) {
    try {
      const result = await SchoolPeriodService.getAllSchoolPeriods();
      res.json(result);
    } catch (error) {
      logger.error('학교 기간 조회 컨트롤러 에러', error);
      next(error);
    }
  }
  
  // 특정 날짜에 활성화된 학교 기간 조회
  static async getActiveSchoolPeriods(req, res, next) {
    try {
      const { targetDate } = req.query;
      
      if (!targetDate) {
        throw new ValidationError('targetDate 쿼리 파라미터가 필요합니다');
      }
      
      if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
        throw new ValidationError('날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)');
      }
      
      const result = await SchoolPeriodService.getActiveSchoolPeriods(targetDate);
      res.json(result);
    } catch (error) {
      logger.error('활성화된 학교 기간 조회 컨트롤러 에러', error);
      next(error);
    }
  }
  
  // 특정 학교 기간 조회
  static async getSchoolPeriod(req, res, next) {
    try {
      const { id } = req.params;
      
      if (!id || !isUUID(id)) {
        return res.status(400).json({ error: '유효한 ID가 필요합니다' });
      }
      
      const result = await SchoolPeriodService.getSchoolPeriod(id);
      res.json(result);
    } catch (error) {
      logger.error('학교 기간 조회 컨트롤러 에러', error);
      next(error);
    }
  }
  
  // 학교 기간 수정
  static async updateSchoolPeriod(req, res, next) {
    try {
      const { id } = req.params;
      const { schoolName, startDate, endDate } = req.body;
      
      if (!id || !isUUID(id)) {
        return res.status(400).json({ error: '유효한 ID가 필요합니다' });
      }
      
      // 최소 하나의 업데이트 필드는 필요
      if (!schoolName && !startDate && !endDate) {
        return res.status(400).json({ error: '수정할 필드가 필요합니다' });
      }
      
      // 날짜 형식 검증
      if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        throw new ValidationError('시작일 형식이 올바르지 않습니다 (YYYY-MM-DD)');
      }
      if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        throw new ValidationError('종료일 형식이 올바르지 않습니다 (YYYY-MM-DD)');
      }
      
      const result = await SchoolPeriodService.updateSchoolPeriod(id, schoolName, startDate, endDate);
      res.json(result);
    } catch (error) {
      logger.error('학교 기간 수정 컨트롤러 에러', error);
      next(error);
    }
  }
  
  // 학교 기간 삭제
  static async deleteSchoolPeriod(req, res, next) {
    try {
      const { id } = req.params;
      
      if (!id || !isUUID(id)) {
        return res.status(400).json({ error: '유효한 ID가 필요합니다' });
      }
      
      const result = await SchoolPeriodService.deleteSchoolPeriod(id);
      res.json(result);
    } catch (error) {
      logger.error('학교 기간 삭제 컨트롤러 에러', error);
      next(error);
    }
  }
}



