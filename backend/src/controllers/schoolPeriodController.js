import { SchoolPeriodService } from '../services/schoolPeriodService.js';
import { validateRequest, validateUUID } from '../utils/validation.js';
import { ValidationError } from '../utils/errors.js';
import { asyncHandler } from '../utils/controllerWrapper.js';
import { successResponse, validationErrorResponse } from '../utils/responseHelper.js';

export class SchoolPeriodController {
  // 학교 기간 생성
  static createSchoolPeriod = asyncHandler(async (req, res) => {
    const validation = validateRequest(req, ['schoolName', 'startDate', 'endDate']);
    if (!validation.isValid) {
      return validationErrorResponse(res, validation.error);
    }
    
    const { schoolName, startDate, endDate } = req.body;
    
    // 날짜 형식 검증
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      throw new ValidationError('날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)');
    }
    
    const result = await SchoolPeriodService.createSchoolPeriod(schoolName, startDate, endDate);
    return successResponse(res, result);
  });
  
  // 모든 학교 기간 조회
  static getAllSchoolPeriods = asyncHandler(async (req, res) => {
    const result = await SchoolPeriodService.getAllSchoolPeriods();
    return successResponse(res, result);
  });
  
  // 특정 날짜에 활성화된 학교 기간 조회
  static getActiveSchoolPeriods = asyncHandler(async (req, res) => {
    const { targetDate } = req.query;
    
    if (!targetDate) {
      throw new ValidationError('targetDate 쿼리 파라미터가 필요합니다');
    }
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      throw new ValidationError('날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)');
    }
    
    const result = await SchoolPeriodService.getActiveSchoolPeriods(targetDate);
    return successResponse(res, result);
  });
  
  // 특정 학교 기간 조회
  static getSchoolPeriod = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateUUID(id);
    
    const result = await SchoolPeriodService.getSchoolPeriod(id);
    return successResponse(res, result);
  });
  
  // 학교 기간 수정
  static updateSchoolPeriod = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { schoolName, startDate, endDate } = req.body;
    
    validateUUID(id);
    
    // 최소 하나의 업데이트 필드는 필요
    if (!schoolName && !startDate && !endDate) {
      return validationErrorResponse(res, '수정할 필드가 필요합니다');
    }
    
    // 날짜 형식 검증
    if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      throw new ValidationError('시작일 형식이 올바르지 않습니다 (YYYY-MM-DD)');
    }
    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      throw new ValidationError('종료일 형식이 올바르지 않습니다 (YYYY-MM-DD)');
    }
    
    const result = await SchoolPeriodService.updateSchoolPeriod(id, schoolName, startDate, endDate);
    return successResponse(res, result);
  });
  
  // 학교 기간 삭제
  static deleteSchoolPeriod = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateUUID(id);
    
    const result = await SchoolPeriodService.deleteSchoolPeriod(id);
    return successResponse(res, result);
  });
}
