// 로깅 유틸리티
export const logger = {
  info: (message, data = {}) => {
    console.log(`[INFO] ${message}`, data);
  },
  
  error: (message, error = {}) => {
    console.error(`[ERROR] ${message}`, error);
  },
  
  warn: (message, data = {}) => {
    console.warn(`[WARN] ${message}`, data);
  },
  
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data);
    }
  }
};

/**
 * 민감한 정보를 필터링하는 함수
 * password, token, accessToken, authorization 등 민감한 정보를 마스킹
 */
const filterSensitiveData = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => filterSensitiveData(item));
  }

  const sensitiveKeys = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'authorization',
    'apiKey',
    'secret',
    'secretKey',
    'access_token',
    'refresh_token'
  ];

  const filtered = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // 민감한 키는 마스킹
    if (sensitiveKeys.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
      filtered[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      // 중첩된 객체도 재귀적으로 필터링
      filtered[key] = filterSensitiveData(value);
    } else {
      filtered[key] = value;
    }
  }

  return filtered;
};

/**
 * 헤더에서 민감한 정보 제거
 */
const sanitizeHeaders = (headers) => {
  if (!headers || typeof headers !== 'object') {
    return headers;
  }

  const sanitized = { ...headers };
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token'
  ];

  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '***REDACTED***';
    }
    // 대소문자 구분 없이 체크
    const lowerHeader = header.toLowerCase();
    Object.keys(sanitized).forEach(key => {
      if (key.toLowerCase() === lowerHeader) {
        sanitized[key] = '***REDACTED***';
      }
    });
  });

  return sanitized;
};

// API 요청 로깅
export const logRequest = (req, res, next) => {
  // 요청 시작 시간 기록
  req.startTime = Date.now();
  
  const logData = {
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')?.substring(0, 100), // 100자로 제한
    headers: sanitizeHeaders(req.headers)
  };

  // POST, PUT, PATCH 요청만 body 로깅 (민감 정보 필터링)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    logData.body = filterSensitiveData(req.body);
  }

  logger.info(`[REQUEST] ${req.method} ${req.url}`, logData);
  next();
};

// API 응답 로깅
export const logResponse = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // 응답 시간 계산
    const responseTime = req.startTime ? Date.now() - req.startTime : null;
    
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: responseTime ? `${responseTime}ms` : 'N/A'
    };

    // 에러 응답인 경우에만 데이터 로깅 (민감 정보 필터링)
    if (res.statusCode >= 400) {
      try {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        logData.error = filterSensitiveData(parsedData);
      } catch (e) {
        // 파싱 실패 시 원본 데이터의 일부만 표시
        logData.error = typeof data === 'string' ? data.substring(0, 200) : data;
      }
    }

    logger.info(`[RESPONSE] ${req.method} ${req.url}`, logData);
    originalSend.call(this, data);
  };
  
  next();
};
