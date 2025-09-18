/**
 * 엔터프라이즈급 성능 모니터링 시스템
 * 구글/넷플릭스 수준의 성능 최적화 및 모니터링
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: null,
      firstContentfulPaint: null,
      largestContentfulPaint: null,
      firstInputDelay: null,
      cumulativeLayoutShift: null,
      timeToInteractive: null,
    };
    
    this.observers = new Map();
    this.customMetrics = new Map();
    
    this.init();
  }

  /**
   * 성능 모니터링 초기화
   */
  init() {
    // 페이지 로드 완료 후 메트릭 수집
    if (document.readyState === 'complete') {
      this.collectMetrics();
    } else {
      window.addEventListener('load', () => {
        this.collectMetrics();
      });
    }

    // Core Web Vitals 모니터링
    this.observeCoreWebVitals();
    
    // 사용자 상호작용 모니터링
    this.observeUserInteractions();
    
    // 메모리 사용량 모니터링
    this.observeMemoryUsage();
  }

  /**
   * 기본 성능 메트릭 수집
   */
  collectMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];
    
    if (navigation) {
      this.metrics.pageLoad = navigation.loadEventEnd - navigation.loadEventStart;
      this.metrics.timeToInteractive = this.calculateTimeToInteractive();
    }

    // First Contentful Paint
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    if (fcpEntry) {
      this.metrics.firstContentfulPaint = fcpEntry.startTime;
    }
  }

  /**
   * Core Web Vitals 모니터링
   */
  observeCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    this.observeLCP();
    
    // First Input Delay (FID)
    this.observeFID();
    
    // Cumulative Layout Shift (CLS)
    this.observeCLS();
  }

  /**
   * LCP 모니터링
   */
  observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.largestContentfulPaint = lastEntry.startTime;
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.set('lcp', observer);
  }

  /**
   * FID 모니터링
   */
  observeFID() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
      });
    });
    
    observer.observe({ entryTypes: ['first-input'] });
    this.observers.set('fid', observer);
  }

  /**
   * CLS 모니터링
   */
  observeCLS() {
    let clsValue = 0;
    let lastSessionValue = 0;
    let sessionCount = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          const firstSessionEntry = entry.sources[0];
          const lastSessionEntry = entry.sources[entry.sources.length - 1];
          
          if (sessionCount && entry.sessionValue !== lastSessionValue) {
            clsValue += lastSessionValue;
            sessionCount++;
          }
          
          lastSessionValue = entry.sessionValue;
          sessionCount++;
        }
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.set('cls', observer);
    
    // 페이지 언로드 시 최종 CLS 값 저장
    window.addEventListener('beforeunload', () => {
      this.metrics.cumulativeLayoutShift = clsValue + lastSessionValue;
    });
  }

  /**
   * 사용자 상호작용 모니터링
   */
  observeUserInteractions() {
    const interactionTypes = ['click', 'keydown', 'scroll', 'touchstart'];
    
    interactionTypes.forEach(type => {
      document.addEventListener(type, (event) => {
        this.recordCustomMetric(`user_interaction_${type}`, {
          timestamp: Date.now(),
          target: event.target.tagName,
          x: event.clientX,
          y: event.clientY,
        });
      }, { passive: true });
    });
  }

  /**
   * 메모리 사용량 모니터링
   */
  observeMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.recordCustomMetric('memory_usage', {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          timestamp: Date.now(),
        });
      }, 30000); // 30초마다 체크
    }
  }

  /**
   * 커스텀 메트릭 기록
   */
  recordCustomMetric(name, value) {
    if (!this.customMetrics.has(name)) {
      this.customMetrics.set(name, []);
    }
    
    const metrics = this.customMetrics.get(name);
    metrics.push(value);
    
    // 최대 100개까지만 저장
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * Time to Interactive 계산
   */
  calculateTimeToInteractive() {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (!navigation) return null;
    
    // DOMContentLoaded 이후 5초 또는 load 이벤트 중 더 빠른 것
    const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
    const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
    
    return Math.min(domContentLoaded + 5000, loadTime);
  }

  /**
   * 성능 점수 계산
   */
  calculatePerformanceScore() {
    const scores = {
      lcp: this.scoreLCP(this.metrics.largestContentfulPaint),
      fid: this.scoreFID(this.metrics.firstInputDelay),
      cls: this.scoreCLS(this.metrics.cumulativeLayoutShift),
    };
    
    const validScores = Object.values(scores).filter(score => score !== null);
    const averageScore = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
    
    return {
      overall: Math.round(averageScore),
      breakdown: scores,
      metrics: this.metrics,
    };
  }

  /**
   * LCP 점수 계산 (0-100)
   */
  scoreLCP(lcp) {
    if (!lcp) return null;
    if (lcp <= 2500) return 100;
    if (lcp <= 4000) return 75;
    if (lcp <= 6000) return 50;
    return 25;
  }

  /**
   * FID 점수 계산 (0-100)
   */
  scoreFID(fid) {
    if (!fid) return null;
    if (fid <= 100) return 100;
    if (fid <= 300) return 75;
    if (fid <= 500) return 50;
    return 25;
  }

  /**
   * CLS 점수 계산 (0-100)
   */
  scoreCLS(cls) {
    if (!cls) return null;
    if (cls <= 0.1) return 100;
    if (cls <= 0.25) return 75;
    if (cls <= 0.4) return 50;
    return 25;
  }

  /**
   * 성능 데이터 전송
   */
  async sendPerformanceData() {
    const performanceData = {
      metrics: this.metrics,
      customMetrics: Object.fromEntries(this.customMetrics),
      score: this.calculatePerformanceScore(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    try {
      await fetch('/api/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(performanceData),
      });
    } catch (error) {
      console.warn('Failed to send performance data:', error);
    }
  }

  /**
   * 성능 최적화 제안
   */
  getOptimizationSuggestions() {
    const suggestions = [];
    const score = this.calculatePerformanceScore();
    
    if (score.breakdown.lcp < 75) {
      suggestions.push({
        type: 'lcp',
        message: 'LCP 개선: 이미지 최적화, 서버 응답 시간 개선, 렌더링 차단 리소스 제거',
        priority: 'high',
      });
    }
    
    if (score.breakdown.fid < 75) {
      suggestions.push({
        type: 'fid',
        message: 'FID 개선: JavaScript 번들 크기 줄이기, 코드 분할, 메인 스레드 블로킹 제거',
        priority: 'high',
      });
    }
    
    if (score.breakdown.cls < 75) {
      suggestions.push({
        type: 'cls',
        message: 'CLS 개선: 이미지/광고 크기 지정, 동적 콘텐츠 로딩 최적화',
        priority: 'medium',
      });
    }
    
    return suggestions;
  }

  /**
   * 정리
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// 싱글톤 인스턴스 생성
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
