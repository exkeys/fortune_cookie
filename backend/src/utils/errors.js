import { logger } from './logger.js';

// 커스텀 에러 클래스들
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message = '리소스를 찾을 수 없습니다') {
    super(message, 404);
  }
}

export class DatabaseError extends AppError {
  constructor(message = '데이터베이스 오류가 발생했습니다') {
    super(message, 500);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = '외부 서비스 오류가 발생했습니다') {
    super(message, 502);
  }
}

// 에러 핸들러
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Supabase 에러 처리
  if (err.code === '23505') {
    error = new ValidationError('이미 존재하는 데이터입니다');
  }
  
  // OpenAI 에러 처리
  if (err.response?.status === 401) {
    error = new ExternalServiceError('AI 서비스 인증 오류');
  }
  
  logger.error('Error occurred:', {
    message: error.message,
    statusCode: error.statusCode || 500,
    stack: err.stack
  });
  
  res.status(error.statusCode || 500).json({
    error: error.message || '서버 내부 오류',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
