import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';

const router = Router();

// 카카오 로그인
router.post('/kakao', AuthController.kakaoLogin);

// 로그아웃
router.post('/logout', AuthController.logout);

// 회원탈퇴
router.post('/delete-account', AuthController.deleteAccount);

export default router;
