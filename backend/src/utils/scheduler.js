import { DailyUsageLogService } from '../services/dailyUsageLogService.js';
import { supabase } from '../config/database.js';
import { logger } from './logger.js';

// === 24시간 후 재가입 제한 정리 (운영용) ===
export const cleanupExpiredDeletionRestrictions = async () => {
  try {
    logger.info('만료된 재가입 제한 정리 시작');
    
    const currentTime = new Date();
    
    const { data, error } = await supabase
      .from('deletion_restrictions')
      .delete()
      .lt('expires_at', currentTime.toISOString())
      .select();
    
    if (error) {
      logger.error('재가입 제한 정리 실패', error);
      throw error;
    }
    
    const deletedCount = data?.length || 0;
    logger.info('만료된 재가입 제한 정리 완료', { 
      deletedCount,
      currentTime: currentTime.toISOString(),
      note: '24시간 경과한 재가입 제한 해제됨'
    });
    
    return { deletedCount, success: true };
  } catch (error) {
    logger.error('재가입 제한 정리 실패', error);
    throw error;
  }
};

// === 테스트용: 1분 이전 로그 삭제 (테스트시 주석 해제 필요) ===
// export const cleanupOldUsageLogs = async () => {
//   try {
//     logger.info('오래된 일일 사용 로그 정리 시작 (테스트용)');
//     
//     // 테스트용: 1분 이전 로그 삭제 (회원탈퇴한 사용자 포함)
//     const minutesToKeep = 1;
//     const cutoffTime = new Date();
//     cutoffTime.setMinutes(cutoffTime.getMinutes() - minutesToKeep);
//     
//     const { data, error } = await supabase
//       .from('daily_usage_log')
//       .delete()
//       .lt('created_at', cutoffTime.toISOString())
//       .select();
//     
//     const deletedCount = data?.length || 0;
//     logger.info('일일 사용 로그 정리 완료 (테스트용)', { 
//       deletedCount,
//       minutesToKeep,
//       cutoffTime: cutoffTime.toISOString(),
//       note: '회원탈퇴한 사용자의 로그도 포함하여 삭제'
//     });
//     
//     return { deletedCount, success: true };
//   } catch (error) {
//     logger.error('일일 사용 로그 정리 실패', error);
//     throw error;
//   }
// };

// === 운영용: 24시간 이전 로그 삭제 (기본값) ===
export const cleanupOldUsageLogs = async () => {
  try {
    logger.info('오래된 일일 사용 로그 정리 시작 (운영용)');
    
    // 운영용: 24시간(1일) 이전 로그 삭제 (회원탈퇴한 사용자 포함)
    const hoursToKeep = 24;
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursToKeep);
    
    const { data, error } = await supabase
      .from('daily_usage_log')
      .delete()
      .lt('created_at', cutoffTime.toISOString())
      .select();
    
    const deletedCount = data?.length || 0;
    logger.info('일일 사용 로그 정리 완료 (운영용)', { 
      deletedCount,
      hoursToKeep,
      cutoffTime: cutoffTime.toISOString(),
      note: '회원탈퇴한 사용자의 로그도 24시간 보존 후 삭제'
    });
    
    return { deletedCount, success: true };
  } catch (error) {
    logger.error('일일 사용 로그 정리 실패', error);
    throw error;
  }
};

// === 통합 정리 함수 (운영용) ===
export const cleanupExpiredData = async () => {
  try {
    logger.info('만료된 데이터 통합 정리 시작');
    
    // 1. 만료된 재가입 제한 정리
    const restrictionResult = await cleanupExpiredDeletionRestrictions();
    
    // 2. 테스트용: 1분 이전 로그 삭제
    const logResult = await cleanupOldUsageLogs();
    
    logger.info('만료된 데이터 통합 정리 완료', {
      restrictionsDeleted: restrictionResult.deletedCount,
      logsDeleted: logResult.deletedCount,
      totalOperations: 2
    });
    
    return {
      success: true,
      results: {
        deletionRestrictions: restrictionResult.deletedCount,
        logs: logResult.deletedCount
      }
    };
    
  } catch (error) {
    logger.error('만료된 데이터 정리 실패', error);
    throw error;
  }
};

// === 스케줄러 시작 함수 (테스트용) ===
// export const startScheduler = () => {
//   logger.info('스케줄러 시작 (테스트용)');
//   
//   // 30초마다 로그 정리 + 재가입 제한 정리
//   setInterval(async () => {
//     try {
//       await cleanupExpiredData();
//     } catch (error) {
//       logger.error('스케줄러 실행 실패', error);
//     }
//   }, 30000); // 30초마다 실행
//   
//   // 서버 시작 시 즉시 한 번 실행
//   setTimeout(async () => {
//     try {
//       await cleanupExpiredData();
//     } catch (error) {
//       logger.error('초기 정리 작업 실패', error);
//     }
//   }, 5000); // 서버 시작 5초 후 실행
//   
//   logger.info('스케줄러 등록 완료 (테스트용) - 30초마다 1분 이전 로그 정리');
// };


// === 운영용: 1시간마다 실행 (기본값) ===
export const startScheduler = () => {
  logger.info('스케줄러 시작 (운영용)');
  
  // 1시간마다 24시간 이전 로그 삭제 + 재가입 제한 정리
  setInterval(async () => {
    try {
      await cleanupExpiredData();
    } catch (error) {
      logger.error('스케줄러 실행 실패', error);
    }
  }, 60 * 60 * 1000); // 1시간마다 실행
  
  // 서버 시작 시 즉시 한 번 실행
  setTimeout(async () => {
    try {
      await cleanupExpiredData();
    } catch (error) {
      logger.error('초기 정리 작업 실패', error);
    }
  }, 5000); // 서버 시작 5초 후 실행
  
  logger.info('스케줄러 등록 완료 (운영용) - 1시간마다 24시간 이전 로그 정리');
};
