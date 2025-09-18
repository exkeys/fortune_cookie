import { Router } from 'express';
import authRoutes from './authRoutes.js';
import concernRoutes from './concernRoutes.js';

const router = Router();

// API 라우트들
router.use('/auth', authRoutes);
router.use('/concerns', concernRoutes);

// 헬스 체크
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
