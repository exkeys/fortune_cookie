import express from 'express';
import cookieParser from 'cookie-parser';
import { corsMiddleware, requestLogging, responseLogging } from './middleware/index.js';
import { errorHandler } from './utils/errors.js';
import { checkDatabaseConnection } from './config/database.js';
import routes from './routes/index.js';

const app = express();

// 미들웨어 설정
app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.json());
app.use(requestLogging);
app.use(responseLogging);

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
