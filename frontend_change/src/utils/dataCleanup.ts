/**
 * 사용자 데이터 정리 유틸리티
 */

// 모든 사용자 관련 데이터 정리 (회원탈퇴 시)
export const clearAllUserData = (): void => {
  try {
    // 로컬 스토리지 완전 정리
    localStorage.clear();
    
    // 세션 스토리지 정리
    sessionStorage.clear();
    
    // 쿠키 정리 - 모든 도메인의 쿠키 제거
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      // 현재 도메인
      document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      // 상위 도메인
      document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      // .도메인 형태
      if (window.location.hostname.includes('.')) {
        const domain = '.' + window.location.hostname.split('.').slice(-2).join('.');
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
      }
    });
    
    // IndexedDB 정리 (가능하면)
    if ('indexedDB' in window) {
      indexedDB.databases?.().then(databases => {
        databases.forEach(db => {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
          }
        });
      }).catch(console.warn);
    }
    
    // 브라우저 캐시 정리 요청 (Service Worker가 있다면)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      }).catch(console.warn);
    }
    
    console.log('[dataCleanup] 모든 사용자 데이터 정리 완료');
  } catch (error) {
    console.error('[dataCleanup] 데이터 정리 중 오류:', error);
  }
};

// 세션 데이터만 정리 (로그아웃 시)
export const clearSessionData = (): void => {
  try {
    // 세션 스토리지 정리
    sessionStorage.clear();
    
    // 특정 로컬 스토리지 키만 정리 (사용자 세션 관련)
    const keysToRemove = [
      'supabase.auth.token',
      'sb-auth-token',
      'sb-refresh-token',
      'FC_TAB_ID', // 탭 ID도 정리
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Supabase 관련 쿠키 정리
    const supabaseCookies = ['sb-access-token', 'sb-refresh-token'];
    supabaseCookies.forEach(cookieName => {
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      if (window.location.hostname.includes('.')) {
        const domain = '.' + window.location.hostname.split('.').slice(-2).join('.');
        document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
      }
    });
    
    console.log('[dataCleanup] 세션 데이터 정리 완료');
  } catch (error) {
    console.error('[dataCleanup] 세션 데이터 정리 중 오류:', error);
  }
};

// 특정 키의 로컬 스토리지 데이터 정리
export const clearLocalStorageKey = (key: string): void => {
  try {
    localStorage.removeItem(key);
    console.log(`[dataCleanup] ${key} 정리 완료`);
  } catch (error) {
    console.error(`[dataCleanup] ${key} 정리 중 오류:`, error);
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
    
    console.log('[dataCleanup] 폼 지속성 데이터 정리 완료');
  } catch (error) {
    console.error('[dataCleanup] 폼 지속성 데이터 정리 중 오류:', error);
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
    
    console.log('[dataCleanup] 페이지 언로드 시 임시 데이터 정리 완료');
  } catch (error) {
    console.error('[dataCleanup] 페이지 언로드 정리 중 오류:', error);
  }
};