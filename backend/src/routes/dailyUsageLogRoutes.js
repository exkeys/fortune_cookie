import { Router } from 'express';
import { DailyUsageLogController } from '../controllers/dailyUsageLogController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 사용 로그 생성 (포춘쿠키 사용 시) - 인증 필요
router.post('/', authenticateToken, DailyUsageLogController.createUsageLog);

// 오늘 사용했는지 확인 - 인증 필요
router.get('/check-today', authenticateToken, DailyUsageLogController.hasUsedToday);

// 사용 통계 조회 - 인증 필요
router.get('/stats', authenticateToken, DailyUsageLogController.getUsageStats);

// 모든 로그 조회 (관리자용) - 인증 필요
router.get('/', authenticateToken, DailyUsageLogController.getAllUsageLogs);

// 특정 사용자의 로그 조회 - 인증 필요
router.get('/user/:userId', authenticateToken, DailyUsageLogController.getUserUsageLogs);

// 오래된 로그 삭제 - 인증 필요
router.delete('/old', authenticateToken, DailyUsageLogController.deleteOldLogs);

// 특정 로그 삭제 - 인증 필요
router.delete('/:id', authenticateToken, DailyUsageLogController.deleteUsageLog);

export default router;



