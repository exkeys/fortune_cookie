import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';

const router = Router();

// 카카오 로그인
router.post('/kakao', AuthController.kakaoLogin);

// 로그인 검증 (재가입 제한 체크)
router.post('/validate-login', AuthController.validateLogin);

// 로그아웃
router.post('/logout', AuthController.logout);

// 회원탈퇴
router.post('/delete-account', AuthController.deleteAccount);

export default router;
