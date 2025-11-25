import app from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { startScheduler } from './utils/scheduler.js';
import { validateEnvVars, validateOptionalEnvVars } from './utils/envValidator.js';

const startServer = async () => {
  try {
    // 환경 변수 검증 (서버 시작 전)
    validateEnvVars();
    validateOptionalEnvVars();
    
    app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`🌍 Environment: ${config.env}`);
      logger.info(`📡 CORS enabled for: ${config.cors.origin}`);
      
      // 스케줄러 시작
      startScheduler();
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

