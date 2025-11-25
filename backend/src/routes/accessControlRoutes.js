import { Router } from 'express';
import { AccessControlController } from '../controllers/accessControlController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 사용자 접근 권한 체크 - 인증 필요
router.get('/check-access', authenticateToken, AccessControlController.checkUserAccess);

// 일일 사용 제한 체크 - 인증 필요
router.get('/check-daily-usage', authenticateToken, AccessControlController.checkDailyUsage);

// 전체 접근 권한 체크 (접근 권한 + 일일 제한) - 인증 필요
router.get('/check-full-access', authenticateToken, AccessControlController.checkFullAccess);

export default router;
