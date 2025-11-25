import crypto from 'crypto';
import { logger } from './logger.js';

/**
 * 개인정보 보호를 위한 해시 유틸리티
 * 모든 개인정보는 복구 불가능한 해시로 변환
 */
export class HashUtils {
  
  /**
   * 이메일을 SHA-256으로 해시화
   * @param {string} email - 원본 이메일
   * @returns {string} SHA-256 해시값 (64자)
   */
  static hashEmail(email) {
    if (!email || typeof email !== 'string') {
      logger.error('유효하지 않은 이메일', { email, type: typeof email });
      throw new Error('유효하지 않은 이메일입니다');
    }
    
    // 소문자 변환 후 해시 (대소문자 구분 방지)
    const normalizedEmail = email.toLowerCase().trim();
    const hash = crypto
      .createHash('sha256')
      .update(normalizedEmail)
      .digest('hex');
    
    logger.info('이메일 해시 생성', { 
      originalLength: email.length,
      hashLength: hash.length,
      // 보안: 원본 이메일과 해시값은 로그에 남기지 않음
    });
    
    return hash;
  }

  /**
   * User-Agent를 해시화
   * @param {string} userAgent - 브라우저 정보
   * @returns {string} SHA-256 해시값
   */
  static hashUserAgent(userAgent) {
    if (!userAgent) return null;
    
    return crypto
      .createHash('sha256')
      .update(userAgent)
      .digest('hex');
  }

  /**
   * IP 주소를 해시화
   * @param {string} ipAddress - IP 주소
   * @returns {string} SHA-256 해시값
   */
  static hashIP(ipAddress) {
    if (!ipAddress) return null;
    
    return crypto
      .createHash('sha256')
      .update(ipAddress)
      .digest('hex');
  }

  /**
   * 복합 식별자 생성 (이메일 + User-Agent + IP)
   * 더 강력한 중복 가입 방지를 위함
   */
  static createCompositeHash(email, userAgent = '', ipAddress = '') {
    const composite = `${email.toLowerCase()}|${userAgent}|${ipAddress}`;
    
    return crypto
      .createHash('sha256')
      .update(composite)
      .digest('hex');
  }

  /**
   * 만료 시점 계산
   * @returns {Date} 만료 시점
   */
  static getExpirationTime() {
    // === 운영용: 24시간 후 만료 (운영시 활성화) ===
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // === 테스트용: 1분 후 만료 (테스트시 주석 해제 필요) ===
    // return new Date(Date.now() + 1 * 60 * 1000); // 테스트용: 1분
  }

  /**
   * 현재 시간이 만료 시간을 지났는지 확인
   * @param {Date|string} expiresAt - 만료 시점
   * @returns {boolean} 만료 여부
   */
  static isExpired(expiresAt) {
    if (!expiresAt) return false;
    return new Date() > new Date(expiresAt);
  }
}
