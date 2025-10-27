import express from 'express';
const router = express.Router();

router.post('/', (req, res) => {
  const { message, data } = req.body;
  // 서버 터미널에 로그 출력
  console.log('[CLIENT LOG]', message, data);
  res.status(200).json({ ok: true });
});

export default router;
