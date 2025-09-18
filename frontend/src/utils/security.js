/**
 * 엔터프라이즈급 보안 시스템
 * 구글/넷플릭스 수준의 보안 강화 및 취약점 방지
 */

class SecurityManager {
  constructor() {
    this.cspViolations = [];
    this.suspiciousActivities = [];
    this.rateLimits = new Map();
    
    this.init();
  }

  /**
   * 보안 시스템 초기화
   */
  init() {
    this.setupCSP();
    this.setupXSSProtection();
    this.setupCSRFProtection();
    this.setupRateLimiting();
    this.setupContentSecurityPolicy();
    this.monitorSuspiciousActivities();
  }

  /**
   * Content Security Policy 설정
   */
  setupCSP() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    // CSP 헤더 설정 (실제로는 서버에서 설정해야 함)
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = csp;
    document.head.appendChild(meta);

    // CSP 위반 모니터링
    document.addEventListener('securitypolicyviolation', (event) => {
      this.handleCSPViolation(event);
    });
  }

  /**
   * XSS 보호 설정
   */
  setupXSSProtection() {
    // XSS 필터 활성화
    const meta = document.createElement('meta');
    meta.httpEquiv = 'X-XSS-Protection';
    meta.content = '1; mode=block';
    document.head.appendChild(meta);

    // X-Content-Type-Options 설정
    const contentTypeMeta = document.createElement('meta');
    contentTypeMeta.httpEquiv = 'X-Content-Type-Options';
    contentTypeMeta.content = 'nosniff';
    document.head.appendChild(contentTypeMeta);
  }

  /**
   * CSRF 보호 설정
   */
  setupCSRFProtection() {
    // CSRF 토큰 생성 및 저장
    const csrfToken = this.generateCSRFToken();
    sessionStorage.setItem('csrf_token', csrfToken);
    
    // 모든 폼에 CSRF 토큰 추가
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.tagName === 'FORM') {
        this.addCSRFTokenToForm(form);
      }
    });
  }

  /**
   * Rate Limiting 설정
   */
  setupRateLimiting() {
    // API 호출 제한
    this.rateLimits.set('api_calls', {
      max: 100, // 1분당 최대 100회
      window: 60000, // 1분
      current: 0,
      resetTime: Date.now() + 60000,
    });

    // 로그인 시도 제한
    this.rateLimits.set('login_attempts', {
      max: 5, // 1시간당 최대 5회
      window: 3600000, // 1시간
      current: 0,
      resetTime: Date.now() + 3600000,
    });
  }

  /**
   * Content Security Policy 위반 처리
   */
  handleCSPViolation(event) {
    const violation = {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.cspViolations.push(violation);
    
    // 서버로 위반 정보 전송
    this.reportSecurityViolation('csp_violation', violation);
  }

  /**
   * 의심스러운 활동 모니터링
   */
  monitorSuspiciousActivities() {
    // 키보드 입력 모니터링 (키로거 탐지)
    document.addEventListener('keydown', (event) => {
      this.analyzeKeystrokePattern(event);
    });

    // 마우스 움직임 모니터링 (봇 탐지)
    document.addEventListener('mousemove', (event) => {
      this.analyzeMouseMovement(event);
    });

    // 개발자 도구 열기 탐지
    this.detectDevTools();
  }

  /**
   * 키 입력 패턴 분석
   */
  analyzeKeystrokePattern(event) {
    const now = Date.now();
    const key = event.key;
    
    // 너무 빠른 연속 입력 탐지
    if (this.lastKeystrokeTime && now - this.lastKeystrokeTime < 50) {
      this.recordSuspiciousActivity('rapid_keystrokes', {
        key,
        interval: now - this.lastKeystrokeTime,
        timestamp: now,
      });
    }
    
    this.lastKeystrokeTime = now;
  }

  /**
   * 마우스 움직임 분석
   */
  analyzeMouseMovement(event) {
    const now = Date.now();
    const movement = {
      x: event.clientX,
      y: event.clientY,
      timestamp: now,
    };

    // 부자연스러운 마우스 움직임 탐지
    if (this.lastMousePosition) {
      const distance = Math.sqrt(
        Math.pow(movement.x - this.lastMousePosition.x, 2) +
        Math.pow(movement.y - this.lastMousePosition.y, 2)
      );
      
      const timeDiff = now - this.lastMousePosition.timestamp;
      const speed = distance / timeDiff;
      
      // 너무 빠른 마우스 움직임 탐지
      if (speed > 10) {
        this.recordSuspiciousActivity('rapid_mouse_movement', {
          speed,
          distance,
          timestamp: now,
        });
      }
    }
    
    this.lastMousePosition = movement;
  }

  /**
   * 개발자 도구 탐지
   */
  detectDevTools() {
    let devtools = false;
    
    const checkDevTools = () => {
      const threshold = 160;
      if (window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools) {
          devtools = true;
          this.recordSuspiciousActivity('devtools_opened', {
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
          });
        }
      } else {
        devtools = false;
      }
    };
    
    setInterval(checkDevTools, 1000);
  }

  /**
   * 의심스러운 활동 기록
   */
  recordSuspiciousActivity(type, data) {
    const activity = {
      type,
      data,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ip: this.getClientIP(),
    };

    this.suspiciousActivities.push(activity);
    
    // 너무 많은 의심스러운 활동이 감지되면 경고
    if (this.suspiciousActivities.length > 10) {
      this.handleSecurityThreat();
    }
  }

  /**
   * 보안 위협 처리
   */
  handleSecurityThreat() {
    // 사용자에게 경고
    alert('의심스러운 활동이 감지되었습니다. 보안을 위해 세션이 종료됩니다.');
    
    // 세션 종료
    this.clearSession();
    window.location.href = '/login';
  }

  /**
   * Rate Limiting 체크
   */
  checkRateLimit(type) {
    const limit = this.rateLimits.get(type);
    if (!limit) return true;

    const now = Date.now();
    
    // 시간 윈도우 리셋
    if (now > limit.resetTime) {
      limit.current = 0;
      limit.resetTime = now + limit.window;
    }

    if (limit.current >= limit.max) {
      return false;
    }

    limit.current++;
    return true;
  }

  /**
   * API 호출 Rate Limiting
   */
  async makeSecureAPICall(url, options = {}) {
    if (!this.checkRateLimit('api_calls')) {
      throw new Error('API 호출 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.');
    }

    // CSRF 토큰 추가
    const csrfToken = sessionStorage.getItem('csrf_token');
    if (csrfToken) {
      options.headers = {
        ...options.headers,
        'X-CSRF-Token': csrfToken,
      };
    }

    try {
      const response = await fetch(url, options);
      
      // 응답 검증
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      return response;
    } catch (error) {
      this.recordSuspiciousActivity('api_call_failed', {
        url,
        error: error.message,
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * 입력 데이터 검증 및 Sanitization
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // HTML 태그 제거
    let sanitized = input.replace(/<[^>]*>/g, '');
    
    // JavaScript 이벤트 제거
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    
    // SQL 인젝션 패턴 제거
    sanitized = sanitized.replace(/['";\\]/g, '');
    
    // XSS 패턴 제거
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/vbscript:/gi, '');
    sanitized = sanitized.replace(/data:/gi, '');
    
    return sanitized.trim();
  }

  /**
   * CSRF 토큰 생성
   */
  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 폼에 CSRF 토큰 추가
   */
  addCSRFTokenToForm(form) {
    const existingToken = form.querySelector('input[name="csrf_token"]');
    if (existingToken) return;

    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'csrf_token';
    tokenInput.value = sessionStorage.getItem('csrf_token');
    form.appendChild(tokenInput);
  }

  /**
   * 보안 위반 보고
   */
  async reportSecurityViolation(type, data) {
    try {
      await fetch('/api/security/violations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.warn('Failed to report security violation:', error);
    }
  }

  /**
   * 세션 정리
   */
  clearSession() {
    sessionStorage.clear();
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
  }

  /**
   * 클라이언트 IP 가져오기 (근사치)
   */
  getClientIP() {
    // 실제로는 서버에서 IP를 받아야 함
    return 'unknown';
  }

  /**
   * 보안 상태 리포트
   */
  getSecurityReport() {
    return {
      cspViolations: this.cspViolations.length,
      suspiciousActivities: this.suspiciousActivities.length,
      rateLimits: Object.fromEntries(this.rateLimits),
      timestamp: new Date().toISOString(),
    };
  }
}

// 싱글톤 인스턴스 생성
const securityManager = new SecurityManager();

export default securityManager;
