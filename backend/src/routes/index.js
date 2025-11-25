import { Router } from 'express';

import authRoutes from './authRoutes.js';
import concernRoutes from './concernRoutes.js';
import logRoutes from './logRoutes.js';
import schoolPeriodRoutes from './schoolPeriodRoutes.js';
import dailyUsageLogRoutes from './dailyUsageLogRoutes.js';
import accessControlRoutes from './accessControlRoutes.js';
import adminRoutes from './adminRoutes.js';
import customRoleRoutes from './customRoleRoutes.js';
import { checkDatabaseConnection } from '../config/database.js';
import { logger } from '../utils/logger.js';

const router = Router();


// API 라우트들
router.use('/auth', authRoutes);
router.use('/concerns', concernRoutes);
router.use('/log', logRoutes);
router.use('/school-periods', schoolPeriodRoutes);
router.use('/daily-usage-logs', dailyUsageLogRoutes);
router.use('/access-control', accessControlRoutes);
router.use('/admin', adminRoutes);
router.use('/custom-roles', customRoleRoutes);

// 헬스 체크
router.get('/health', async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();
    
    // 데이터베이스 연결 상태 확인
    const dbStatus = await checkDatabaseConnection();
    
    // 전체 상태 결정
    // 모든 서비스가 정상이면 OK, 일부만 실패하면 DEGRADED, 모두 실패하면 DOWN
    let overallStatus = 'OK';
    if (!dbStatus) {
      overallStatus = 'DOWN';
    }
    
    const healthData = {
      status: overallStatus,
      timestamp,
      uptime: Math.floor(uptime),
      uptimeFormatted: `${Math.floor(uptime / 60)}분 ${Math.floor(uptime % 60)}초`,
      services: {
        database: dbStatus ? 'UP' : 'DOWN',
        supabase: dbStatus ? 'UP' : 'DOWN'
      },
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    };
    
    // 서비스 상태에 따라 HTTP 상태 코드 결정
    const httpStatus = overallStatus === 'OK' ? 200 : overallStatus === 'DEGRADED' ? 200 : 503;
    
    res.status(httpStatus).json(healthData);
  } catch (error) {
    logger.error('헬스체크 에러 발생', error);
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      services: {
        database: 'UNKNOWN',
        supabase: 'UNKNOWN'
      },
      error: '헬스체크 중 에러 발생'
    });
  }
});

export default router;
