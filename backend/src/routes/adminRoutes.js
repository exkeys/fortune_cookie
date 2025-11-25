import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';

const router = Router();

// 모든 사용자 목록 조회
router.get('/users', AdminController.getAllUsers);

// 사용자 정보 업데이트
router.put('/users', AdminController.updateUser);

// 대시보드 통계 조회 (관리자용) - 모든 통계를 한 번에 반환
router.get('/dashboard', AdminController.getDashboard);

// 모든 운세 데이터 조회 (관리자용)
router.get('/fortunes', AdminController.getAllFortunes);

// 학교별 통계 조회 (관리자용)
router.get('/school-stats', AdminController.getSchoolStats);

export default router;
