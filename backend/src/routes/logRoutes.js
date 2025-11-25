import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.post('/', (req, res) => {
  try {
  const { message, data } = req.body;
  // 서버 터미널에 로그 출력
  logger.info('[CLIENT LOG]', { message, data });
  res.status(200).json({ ok: true });
  } catch (error) {
    // 에러가 발생해도 조용히 처리
    logger.error('[LOG ROUTE] 에러:', error);
    res.status(200).json({ ok: true }); // 클라이언트에는 성공으로 응답
  }
});

export default router;
