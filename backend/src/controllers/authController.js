import { AuthService } from '../services/authService.js';
import { validateRequest } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

export class AuthController {
  // 카카오 로그인
  static async kakaoLogin(req, res, next) {
    try {
      const validation = validateRequest(req, ['accessToken']);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }
      
      const { accessToken } = req.body;
      const result = await AuthService.kakaoLogin(accessToken);
      
      res.json(result);
    } catch (error) {
      logger.error('카카오 로그인 컨트롤러 에러', error);
      next(error);
    }
  }

  // 로그아웃
  static async logout(req, res, next) {
    try {
      const validation = validateRequest(req, ['userId']);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }
      
      const { userId } = req.body;
      const result = await AuthService.logout(userId);
      
      res.json(result);
    } catch (error) {
      logger.error('로그아웃 컨트롤러 에러', error);
      next(error);
    }
  }

  // 로그인 검증 (재가입 제한 체크)
  static async validateLogin(req, res, next) {
    try {
      const validation = validateRequest(req, ['email']);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }
      
      const { email } = req.body;
      
      logger.info('로그인 검증 요청', { email });
      
      // 재가입 제한 체크만 수행
      await AuthService.checkDeletionRestriction(email);
      
      // 제한 없으면 성공 응답
      res.json({
        success: true,
        message: '로그인 가능',
        canLogin: true
      });
      
    } catch (error) {
      logger.error('로그인 검증 컨트롤러 에러', error);
      
      // 재가입 제한 에러인 경우 특별 처리
      if (error.message && error.message.includes('24시간')) {
        return res.status(403).json({
          success: false,
          error: error.message,
          canLogin: false,
          isRestricted: true
        });
      }
      
      next(error);
    }
  }

  // 회원탈퇴
  static async deleteAccount(req, res, next) {
    try {
      const validation = validateRequest(req, ['userId']);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }
      
      const { userId } = req.body;
      
      // 요청 정보 수집 (개인정보보호를 위해 해시화됨)
      const userAgent = req.get('User-Agent') || '';
      const ipAddress = req.ip || req.connection.remoteAddress || '';
      
      logger.info('회원탈퇴 요청 상세정보', { 
        userId, 
        hasUserAgent: !!userAgent,
        hasIpAddress: !!ipAddress,
        // 실제 값은 로그에 남기지 않음 (개인정보보호)
      });
      
      const result = await AuthService.deleteAccount(userId, userAgent, ipAddress);
      
      res.json(result);
    } catch (error) {
      logger.error('회원탈퇴 컨트롤러 에러', error);
      next(error);
    }
  }
}
