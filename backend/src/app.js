import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { corsMiddleware, requestLogging, responseLogging, generalRateLimit } from './middleware/index.js';
import { errorHandler } from './utils/errors.js';
import { checkDatabaseConnection } from './config/database.js';
import routes from './routes/index.js';

const app = express();

// 미들웨어 설정
app.use(compression()); // Gzip 압축 (모든 응답 압축)
app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.json());
app.use(requestLogging);
app.use(responseLogging);

// Rate Limiting 적용 (모든 API에 기본 제한) - 일시적으로 비활성화
// app.use('/api', generalRateLimit);

// 라우트 설정
app.use('/api', routes);

// 404 핸들러
app.use((req, res) => {
  return res.status(404).json({ 
    error: '요청한 리소스를 찾을 수 없습니다',
    path: req.originalUrl 
  });
});

// 에러 핸들러
app.use(errorHandler);

// 데이터베이스 연결 확인
checkDatabaseConnection();

export default app;
