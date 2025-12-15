/**
 * 사용자 데이터 정리 유틸리티
 */

import { logger } from './logger';

/**
 * 쿠키 삭제 헬퍼 함수 (중복 코드 제거)
 */
const deleteCookie = (name: string, domain?: string): void => {
  try {
    const expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
    const path = '/';
    
    if (domain) {
      document.cookie = `${name}=;expires=${expires};path=${path};domain=${domain}`;
    } else {
      document.cookie = `${name}=;expires=${expires};path=${path}`;
    }
  } catch (error) {
    logger.warn(`[dataCleanup] 쿠키 삭제 실패: ${name}`, error);
  }
};

/**
 * 특정 쿠키를 모든 가능한 도메인에서 삭제
 */
const deleteCookieFromAllDomains = (cookieName: string): void => {
  try {
    // 현재 도메인
    deleteCookie(cookieName);
    
    // 상위 도메인
    if (window.location.hostname) {
      deleteCookie(cookieName, window.location.hostname);
      
      // .도메인 형태 (서브도메인 포함)
      if (window.location.hostname.includes('.')) {
        const domain = '.' + window.location.hostname.split('.').slice(-2).join('.');
        deleteCookie(cookieName, domain);
      }
    }
  } catch (error) {
    logger.warn(`[dataCleanup] 쿠키 전체 도메인 삭제 실패: ${cookieName}`, error);
  }
};

/**
 * 모든 쿠키 삭제
 */
const clearAllCookies = (): void => {
  try {
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.slice(0, eqPos).trim() : c.trim();
      if (name) {
        deleteCookieFromAllDomains(name);
      }
    });
  } catch (error) {
    logger.warn('[dataCleanup] 모든 쿠키 삭제 실패', error);
  }
};

// 모든 사용자 관련 데이터 정리 (회원탈퇴 시)
export const clearAllUserData = (): void => {
  try {
    // 로컬 스토리지 완전 정리
    localStorage.clear();
    
    // 세션 스토리지 정리
    sessionStorage.clear();
    
    // 쿠키 정리 - 모든 도메인의 쿠키 제거
    clearAllCookies();
    
    // IndexedDB 정리 (가능하면)
    if ('indexedDB' in window) {
      indexedDB.databases?.().then(databases => {
        databases.forEach(db => {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
          }
        });
      }).catch((error) => logger.warn('[dataCleanup] IndexedDB 정리 실패:', error));
    }
    
    // 브라우저 캐시 정리 요청 (Service Worker가 있다면)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      }).catch((error) => logger.warn('[dataCleanup] Service Worker 정리 실패:', error));
    }
  } catch (error) {
    logger.error('[dataCleanup] 데이터 정리 중 오류:', error);
  }
};

// 세션 데이터만 정리 (로그아웃 시)
export const clearSessionData = (options?: { full?: boolean }): void => {
  try {
    const { full = true } = options || {};
    
    // 세션 스토리지 정리
    sessionStorage.clear();
    
    // 항상 제거할 키 (프론트엔드 캐시)
    const baseKeys: string[] = [
      'auth_backend_user', // 백엔드 로그인 정보
      'FC_TAB_ID', // 탭 ID
      'user_email', // 설정 페이지 캐시
      'user_school', // 설정 페이지 캐시
      'user_created_at', // 설정 페이지 캐시
    ];
    
    // user_profile_cache_* 패턴의 모든 키 찾기
    const allLocalStorageKeys = Object.keys(localStorage);
    allLocalStorageKeys.forEach(key => {
      if (key.startsWith('user_profile_cache_')) {
        baseKeys.push(key);
      }
    });
    
    // full=true일 때만 Supabase 키까지 제거 (즉 로그아웃 시)
    if (full) {
      // Supabase가 사용하는 모든 키 찾기 (동적으로)
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || 
        key.includes('sb-') ||
        key.startsWith('sb-')
      );
      
      baseKeys.push(
        'supabase.auth.token',
        'sb-auth-token',
        'sb-refresh-token',
        ...supabaseKeys
      );
      
      // Supabase 관련 쿠키 정리
      const supabaseCookies = ['sb-access-token', 'sb-refresh-token'];
      supabaseCookies.forEach(cookieName => {
        deleteCookieFromAllDomains(cookieName);
      });
      
      // Kakao OAuth 관련 쿠키 정리 (자동 로그인 방지)
      const kakaoCookies = [
        'kauth',
        'kakao',
        'kakao_account',
        'kakao_token',
        'kakao_access_token',
        'kakao_refresh_token'
      ];
      
      const domains = [
        window.location.hostname,
        '.kakao.com',
        '.kakao.co.kr',
        '.kauth.kakao.com'
      ];
      
      kakaoCookies.forEach(cookieName => {
        domains.forEach(domain => {
          if (domain.startsWith('.')) {
            deleteCookie(cookieName, domain);
          } else {
            deleteCookie(cookieName, domain);
          }
        });
      });
      
      // Kakao 관련 localStorage 키 정리
      const allLocalStorageKeys = Object.keys(localStorage);
      allLocalStorageKeys.forEach(key => {
        if (key.toLowerCase().includes('kakao') || key.toLowerCase().includes('kauth')) {
          localStorage.removeItem(key);
        }
      });
    }
    
    // 최종 키 목록 제거
    baseKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    logger.error('[dataCleanup] 세션 데이터 정리 중 오류:', error);
  }
};

// 특정 키의 로컬 스토리지 데이터 정리
export const clearLocalStorageKey = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    logger.error(`[dataCleanup] ${key} 정리 중 오류:`, error);
  }
};

// 폼 데이터 정리 (폼 지속성 관련)
export const clearFormPersistence = (): void => {
  try {
    const formKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('form_') || 
      key.startsWith('concern_') || 
      key.startsWith('role_')
    );
    
    formKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    logger.error('[dataCleanup] 폼 지속성 데이터 정리 중 오류:', error);
  }
};

// 페이지 언로드 시 임시 데이터 정리
export const handlePageUnload = (): void => {
  try {
    // 임시 세션 데이터만 정리 (사용자 데이터는 유지)
    const tempKeys = Object.keys(sessionStorage).filter(key => 
      key.startsWith('temp_') || 
      key.startsWith('draft_') ||
      key.startsWith('cache_')
    );
    
    tempKeys.forEach(key => {
      sessionStorage.removeItem(key);
    });
    
    // 임시 로컬 스토리지 데이터 정리
    const tempLocalKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('temp_') || 
      key.startsWith('draft_') ||
      key.includes('_temp')
    );
    
    tempLocalKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    logger.error('[dataCleanup] 페이지 언로드 정리 중 오류:', error);
  }
};