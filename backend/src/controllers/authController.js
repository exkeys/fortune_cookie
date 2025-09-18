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
}
