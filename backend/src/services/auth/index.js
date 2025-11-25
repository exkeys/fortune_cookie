/**
 * Auth 서비스 모듈 통합 export
 * 기존 AuthService를 사용하던 곳에서 호환성을 위해 제공
 */
export { KakaoAuthService } from './kakaoAuthService.js';
export { AccountService } from './accountService.js';
export { ProfileService } from './profileService.js';

// 기존 AuthService 호환성을 위한 통합 클래스
import { KakaoAuthService } from './kakaoAuthService.js';
import { AccountService } from './accountService.js';
import { ProfileService } from './profileService.js';

/**
 * @deprecated 이 클래스는 호환성을 위해 유지됩니다.
 * 새로운 코드에서는 KakaoAuthService, AccountService, ProfileService를 직접 사용하세요.
 */
export class AuthService {
  static async getKakaoAccessToken(code, redirectUri) {
    return KakaoAuthService.getKakaoAccessToken(code, redirectUri);
  }

  static async kakaoLogin(accessToken) {
    return KakaoAuthService.kakaoLogin(accessToken);
  }

  static async logout(userId) {
    return ProfileService.logout(userId);
  }

  static async deleteAccount(userId, userAgent, ipAddress) {
    return AccountService.deleteAccount(userId, userAgent, ipAddress);
  }

  static async checkDeletionRestriction(email) {
    return AccountService.checkDeletionRestriction(email);
  }

  static async updateProfile(userId, updates) {
    return ProfileService.updateProfile(userId, updates);
  }
}

