import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authRateLimit, authenticatedRateLimit } from '../middleware/rateLimit.js';

const router = Router();

// 카카오 로그인 통합 API (토큰 교환 + 로그인 한 번에) - 공개 API (엄격한 rate limiting) - 일시적으로 비활성화
router.post('/kakao/login-direct', AuthController.kakaoLoginDirect);

// CSRF 토큰 발급 - 공개 API (쿠키 필요)
router.get('/csrf-token', AuthController.getCsrfToken);

// 세션 쿠키 설정 - 공개 API (로그인 완료 후 호출)
router.post('/session', AuthController.createSessionFromToken);

// 액세스 토큰 갱신 - 공개 API (쿠키 + CSRF 필요)
router.post('/token', AuthController.refreshAccessToken);

// 사용자 정보 동기화 (Supabase OAuth 로그인 후) - 인증 필요
router.post('/sync-user', authenticateToken, AuthController.syncUser);

// 로그인 검증 (재가입 제한 체크) - 공개 API (엄격한 rate limiting) - 일시적으로 비활성화
router.post('/validate-login', AuthController.validateLogin);

// 로그인 상태 통합 체크 (재가입 제한 + 밴 상태) - 공개 API
router.post('/check-login-status', AuthController.checkLoginStatus);

// 로그아웃 - 인증 필요
router.post('/logout', authenticateToken, AuthController.logout);

// 회원탈퇴 - 인증 필요
router.post('/delete-account', authenticateToken, AuthController.deleteAccount);

// 사용자 프로필 조회 - 인증 필요 (인증된 사용자용 rate limit 적용) - 일시적으로 비활성화
router.get('/profile', authenticateToken, AuthController.getProfile);

// 사용자 프로필 업데이트 - 인증 필요 (인증된 사용자용 rate limit 적용) - 일시적으로 비활성화
router.put('/profile', authenticateToken, AuthController.updateProfile);

export default router;
