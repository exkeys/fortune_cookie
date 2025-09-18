/**
 * 엔터프라이즈급 에러 핸들링 시스템
 * 구글/넷플릭스 수준의 에러 모니터링 및 복구 시스템
 */

class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 1000;
    this.isOnline = navigator.onLine;
    
    this.setupGlobalErrorHandlers();
    this.setupNetworkMonitoring();
  }

  /**
   * 전역 에러 핸들러 설정
   */
  setupGlobalErrorHandlers() {
    // JavaScript 에러 캐치
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
      });
    });

    // Promise rejection 에러 캐치
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
      });
    });

    // React 에러 바운더리용 에러 핸들러
    window.addEventListener('react-error', (event) => {
      this.handleError({
        type: 'react',
        message: event.detail.message,
        stack: event.detail.stack,
        componentStack: event.detail.componentStack,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * 네트워크 상태 모니터링
   */
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorLog();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * 에러 처리 및 로깅
   */
  handleError(errorInfo) {
    // 에러 정보 정규화
    const normalizedError = this.normalizeError(errorInfo);
    
    // 로컬 로그에 추가
    this.addToLog(normalizedError);
    
    // 즉시 전송 (온라인인 경우)
    if (this.isOnline) {
      this.sendErrorToServer(normalizedError);
    }
    
    // 사용자에게 친화적인 에러 메시지 표시
    this.showUserFriendlyError(normalizedError);
    
    // 개발 환경에서는 콘솔에 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', normalizedError);
    }
  }

  /**
   * 에러 정보 정규화
   */
  normalizeError(errorInfo) {
    return {
      id: this.generateErrorId(),
      type: errorInfo.type || 'unknown',
      message: errorInfo.message || 'Unknown error',
      stack: errorInfo.stack || '',
      componentStack: errorInfo.componentStack || '',
      filename: errorInfo.filename || '',
      lineno: errorInfo.lineno || 0,
      colno: errorInfo.colno || 0,
      timestamp: errorInfo.timestamp || new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
    };
  }

  /**
   * 에러 ID 생성
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 로그에 에러 추가
   */
  addToLog(error) {
    this.errorLog.push(error);
    
    // 로그 크기 제한
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }
    
    // 로컬 스토리지에 저장
    try {
      localStorage.setItem('errorLog', JSON.stringify(this.errorLog));
    } catch (e) {
      console.warn('Failed to save error log to localStorage:', e);
    }
  }

  /**
   * 서버로 에러 전송
   */
  async sendErrorToServer(error) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
      });
    } catch (e) {
      console.warn('Failed to send error to server:', e);
    }
  }

  /**
   * 사용자 친화적 에러 메시지 표시
   */
  showUserFriendlyError(error) {
    // 에러 타입에 따른 사용자 메시지
    const userMessages = {
      javascript: '앱에서 오류가 발생했습니다. 페이지를 새로고침해 주세요.',
      promise: '네트워크 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      react: '화면을 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해 주세요.',
      network: '인터넷 연결을 확인해 주세요.',
    };

    const message = userMessages[error.type] || '예상치 못한 오류가 발생했습니다.';
    
    // 토스트 알림 또는 모달로 표시
    this.showNotification(message, 'error');
  }

  /**
   * 알림 표시
   */
  showNotification(message, type = 'info') {
    // 간단한 토스트 알림 구현
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'error' ? '#ff4444' : '#4CAF50'};
      color: white;
      border-radius: 4px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    // 5초 후 자동 제거
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  /**
   * 현재 사용자 ID 가져오기
   */
  getCurrentUserId() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      return user?.id || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  /**
   * 세션 ID 가져오기
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * 오프라인 로그 전송
   */
  async flushErrorLog() {
    if (!this.isOnline || this.errorLog.length === 0) return;
    
    try {
      await Promise.all(
        this.errorLog.map(error => this.sendErrorToServer(error))
      );
      
      // 전송 성공 시 로그 클리어
      this.errorLog = [];
      localStorage.removeItem('errorLog');
    } catch (e) {
      console.warn('Failed to flush error log:', e);
    }
  }

  /**
   * 에러 통계 가져오기
   */
  getErrorStats() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentErrors = this.errorLog.filter(
      error => new Date(error.timestamp) > last24h
    );
    
    return {
      total: this.errorLog.length,
      last24h: recentErrors.length,
      byType: this.errorLog.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {}),
    };
  }
}

// 싱글톤 인스턴스 생성
const errorHandler = new ErrorHandler();

export default errorHandler;
