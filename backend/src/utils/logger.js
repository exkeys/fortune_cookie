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

// API 요청 로깅
export const logRequest = (req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    headers: req.headers,
    body: req.method !== 'GET' ? req.body : undefined
  });
  next();
};

// API 응답 로깅
export const logResponse = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    logger.info(`Response ${res.statusCode}`, {
      url: req.url,
      statusCode: res.statusCode
    });
    originalSend.call(this, data);
  };
  
  next();
};
