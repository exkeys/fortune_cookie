import { Router } from 'express';
import { AccessControlController } from '../controllers/accessControlController.js';

const router = Router();

// 사용자 접근 권한 체크
router.get('/check-access', AccessControlController.checkUserAccess);

// 일일 사용 제한 체크
router.get('/check-daily-usage', AccessControlController.checkDailyUsage);

// 전체 접근 권한 체크 (접근 권한 + 일일 제한)
router.get('/check-full-access', AccessControlController.checkFullAccess);

export default router;
