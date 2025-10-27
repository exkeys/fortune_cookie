import { Router } from 'express';
import { DailyUsageLogController } from '../controllers/dailyUsageLogController.js';

const router = Router();

// 사용 로그 생성 (포춘쿠키 사용 시)
router.post('/', DailyUsageLogController.createUsageLog);

// 오늘 사용했는지 확인
router.get('/check-today', DailyUsageLogController.hasUsedToday);

// 사용 통계 조회
router.get('/stats', DailyUsageLogController.getUsageStats);

// 모든 로그 조회 (관리자용)
router.get('/', DailyUsageLogController.getAllUsageLogs);

// 특정 사용자의 로그 조회
router.get('/user/:userId', DailyUsageLogController.getUserUsageLogs);

// 오래된 로그 삭제
router.delete('/old', DailyUsageLogController.deleteOldLogs);

// 특정 로그 삭제
router.delete('/:id', DailyUsageLogController.deleteUsageLog);

export default router;



