import { ConcernService } from '../services/concernService.js';
import { AIService } from '../services/aiService.js';
import { validateRequest, validateUUIDs } from '../utils/validation.js';
import { asyncHandler } from '../utils/controllerWrapper.js';
import { successResponse, validationErrorResponse } from '../utils/responseHelper.js';

export class ConcernController {
  // 짧은/긴 AI 조언 모두 생성 (포춘+AI피드)
  static generateBothAdvices = asyncHandler(async (req, res) => {
    const validation = validateRequest(req, ['persona', 'concern']);
    if (!validation.isValid) {
      return validationErrorResponse(res, validation.error);
    }
    const { persona, concern, randomFortune } = req.body;
    // const { shortAdvice, longAdvice } = await AIService.generateBothAdvices(persona, concern, randomFortune); // [비활성화됨] shortAdvice는 사용하지 않습니다.
    const { longAdvice } = await AIService.generateBothAdvices(persona, concern, randomFortune);
    // return successResponse(res, { shortAdvice, longAdvice }); // [비활성화됨] shortAdvice는 사용하지 않습니다.
    return successResponse(res, { longAdvice });
  });
  // AI 답변 생성
  static generateAIAnswer = asyncHandler(async (req, res) => {
    const validation = validateRequest(req, ['persona', 'concern']);
    if (!validation.isValid) {
      return validationErrorResponse(res, validation.error);
    }
    
    const { persona, concern } = req.body;
    const result = await AIService.generateAnswer(persona, concern);
    
    return successResponse(res, result);
  });
  
  // 고민 저장
  static saveConcern = asyncHandler(async (req, res) => {
    // userId는 인증 미들웨어에서 설정됨
    const userId = req.userId;
    
    const validation = validateRequest(req, ['persona', 'concern', 'aiAnswer', 'aiFeed']);
    if (!validation.isValid) {
      return validationErrorResponse(res, validation.error);
    }
    const { persona, concern, aiAnswer, aiFeed } = req.body;
    const result = await ConcernService.saveConcern(userId, persona, concern, aiAnswer, aiFeed);
    return successResponse(res, result);
  });
  
  // 고민 목록 조회
  static getConcerns = asyncHandler(async (req, res) => {
    // userId는 인증 미들웨어에서 설정됨
    const userId = req.userId;
    
    const result = await ConcernService.getConcerns(userId);
    return successResponse(res, result);
  });
  
  // 고민 저장 상태 업데이트
  static updateConcernSaveStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isSaved } = req.body;
    
    if (!id) {
      return validationErrorResponse(res, 'id가 필요합니다');
    }
    
    if (typeof isSaved !== 'boolean') {
      return validationErrorResponse(res, 'isSaved는 boolean 값이어야 합니다');
    }
    
    const result = await ConcernService.updateConcernSaveStatus(id, isSaved);
    return successResponse(res, result);
  });

  // 고민 내용 업데이트 (비슷한 고민으로 새 운세 받기)
  static updateConcern = asyncHandler(async (req, res) => {
    const { id } = req.params;
    // userId는 인증 미들웨어에서 설정됨
    const userId = req.userId;
    
    const validation = validateRequest(req, ['aiAnswer', 'aiFeed']);
    if (!validation.isValid) {
      return validationErrorResponse(res, validation.error);
    }
    
    const { aiAnswer, aiFeed } = req.body;
    
    if (!id) {
      return validationErrorResponse(res, 'id가 필요합니다');
    }
    
    validateUUIDs({ id });
    
    const result = await ConcernService.updateConcern(id, userId, aiAnswer, aiFeed);
    return successResponse(res, result);
  });

  // 고민 삭제
  static deleteConcern = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
      return validationErrorResponse(res, 'id가 필요합니다');
    }
    
    const result = await ConcernService.deleteConcern(id);
    return successResponse(res, result);
  });
}
