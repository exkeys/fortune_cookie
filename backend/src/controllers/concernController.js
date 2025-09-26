import { ConcernService } from '../services/concernService.js';
import { AIService } from '../services/aiService.js';
import { validateRequest, isUUID } from '../utils/validation.js';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

export class ConcernController {
  // 짧은/긴 AI 조언 모두 생성 (포춘+AI피드)
  static async generateBothAdvices(req, res, next) {
    try {
      const validation = validateRequest(req, ['persona', 'concern']);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }
      const { persona, concern } = req.body;
      const { shortAdvice, longAdvice } = await AIService.generateBothAdvices(persona, concern);
      res.json({ shortAdvice, longAdvice });
    } catch (error) {
      logger.error('AI 짧은/긴 조언 생성 컨트롤러 에러', error);
      next(error);
    }
  }
  // AI 답변 생성
  static async generateAIAnswer(req, res, next) {
    try {
      const validation = validateRequest(req, ['persona', 'concern']);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }
      
      const { persona, concern } = req.body;
      const result = await AIService.generateAnswer(persona, concern);
      
      res.json(result);
    } catch (error) {
      logger.error('AI 답변 생성 컨트롤러 에러', error);
      next(error);
    }
  }
  
  // 고민 저장
  static async saveConcern(req, res, next) {
    try {
      const validation = validateRequest(req, ['persona', 'concern', 'aiAnswer', 'aiFeed', 'userId']);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }
      const { persona, concern, aiAnswer, aiFeed, userId } = req.body;
      if (!isUUID(userId)) {
        throw new ValidationError('유효한 userId가 필요합니다');
      }
      const result = await ConcernService.saveConcern(userId, persona, concern, aiAnswer, aiFeed);
      res.json(result);
    } catch (error) {
      logger.error('고민 저장 컨트롤러 에러', error);
      next(error);
    }
  }
  
  // 고민 목록 조회
  static async getConcerns(req, res, next) {
    try {
      const { userId } = req.query;
      
      if (userId && !isUUID(userId)) {
        return res.status(400).json({ error: '유효한 userId가 필요합니다' });
      }
      
      const result = await ConcernService.getConcerns(userId);
      res.json(result);
    } catch (error) {
      logger.error('고민 목록 조회 컨트롤러 에러', error);
      next(error);
    }
  }
  
  // 고민 저장 상태 업데이트
  static async updateConcernSaveStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isSaved } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'id가 필요합니다' });
      }
      
      if (typeof isSaved !== 'boolean') {
        return res.status(400).json({ error: 'isSaved는 boolean 값이어야 합니다' });
      }
      
      const result = await ConcernService.updateConcernSaveStatus(id, isSaved);
      res.json(result);
    } catch (error) {
      logger.error('고민 저장 상태 업데이트 컨트롤러 에러', error);
      next(error);
    }
  }

  // 고민 삭제
  static async deleteConcern(req, res, next) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'id가 필요합니다' });
      }
      
      const result = await ConcernService.deleteConcern(id);
      res.json(result);
    } catch (error) {
      logger.error('고민 삭제 컨트롤러 에러', error);
      next(error);
    }
  }
}
