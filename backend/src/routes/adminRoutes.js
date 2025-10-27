import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';

const router = Router();

// 모든 사용자 목록 조회
router.get('/users', AdminController.getAllUsers);

// 사용자 정보 업데이트
router.put('/users', AdminController.updateUser);

export default router;
