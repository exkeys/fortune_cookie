import { Router } from 'express';
import { ConcernController } from '../controllers/concernController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// AI 답변 생성 (짧은) - 현재 미사용
// router.post('/ai', ConcernController.generateAIAnswer);

// AI 답변 생성 (짧은+긴) - 공개 API (인증 불필요)
router.post('/ai/both', ConcernController.generateBothAdvices);

// 고민 저장 - 인증 필요
router.post('/save', authenticateToken, ConcernController.saveConcern);

// 고민 목록 조회 - 인증 필요
router.get('/', authenticateToken, ConcernController.getConcerns);

// 고민 저장 상태 업데이트 - 인증 필요
router.patch('/:id/save', authenticateToken, ConcernController.updateConcernSaveStatus);

// 고민 내용 업데이트 (비슷한 고민으로 새 운세 받기) - 인증 필요
router.put('/:id', authenticateToken, ConcernController.updateConcern);

// 고민 삭제 - 인증 필요
router.delete('/:id', authenticateToken, ConcernController.deleteConcern);

export default router;
