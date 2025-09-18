import { Router } from 'express';
import { ConcernController } from '../controllers/concernController.js';

const router = Router();

// AI 답변 생성
router.post('/ai', ConcernController.generateAIAnswer);

// 고민 저장
router.post('/save', ConcernController.saveConcern);

// 고민 목록 조회
router.get('/', ConcernController.getConcerns);

// 고민 삭제
router.delete('/:id', ConcernController.deleteConcern);

export default router;
