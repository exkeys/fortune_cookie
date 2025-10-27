import { DailyUsageLogService } from '../services/dailyUsageLogService.js';
import { supabase } from '../config/database.js';
import { logger } from './logger.js';

// === 테스트용: 2분 이후 로그 삭제 (운영시 주석 해제 필요) ===
export const cleanupOldUsageLogs = async () => {
  try {
    logger.info('오래된 일일 사용 로그 정리 시작 (테스트용)');
    
    // 테스트용: 1분 이전 로그 삭제 (회원탈퇴한 사용자 포함)
    const minutesToKeep = 1;
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutesToKeep);
    
    const { data, error } = await supabase
      .from('daily_usage_log')
      .delete()
      .lt('created_at', cutoffTime.toISOString())
      .select();
    
    const deletedCount = data?.length || 0;
    logger.info('일일 사용 로그 정리 완료 (테스트용)', { 
      deletedCount,
      minutesToKeep,
      cutoffTime: cutoffTime.toISOString(),
      note: '회원탈퇴한 사용자의 로그도 포함하여 삭제'
    });
    
    return { deletedCount, success: true };
  } catch (error) {
    logger.error('일일 사용 로그 정리 실패', error);
    throw error;
  }
};

// === 운영용: 24시간(1일) 이후 로그 삭제 (현재 주석 처리됨) ===
// export const cleanupOldUsageLogs = async () => {
//   try {
//     logger.info('오래된 일일 사용 로그 정리 시작 (운영용)');
//     
//     // 운영용: 24시간(1일) 이전 로그 삭제 (회원탈퇴한 사용자 포함)
//     const hoursToKeep = 24;
//     const cutoffTime = new Date();
//     cutoffTime.setHours(cutoffTime.getHours() - hoursToKeep);
//     
//     const { data, error } = await supabase
//       .from('daily_usage_log')
//       .delete()
//       .lt('created_at', cutoffTime.toISOString())
//       .select();
//     
//     if (error) {
//       throw error;
//     }
//     
//     const deletedCount = data?.length || 0;
//     logger.info('일일 사용 로그 정리 완료 (운영용)', { 
//       deletedCount,
//       hoursToKeep,
//       cutoffTime: cutoffTime.toISOString(),
//       note: '회원탈퇴한 사용자의 로그도 24시간 보존 후 삭제'
//     });
//     
//     return { deletedCount, success: true };
//   } catch (error) {
//     logger.error('일일 사용 로그 정리 실패', error);
//     throw error;
//   }
// };

// === 테스트용: 30초마다 로그 정리 실행 (운영시 주석 해제 필요) ===
export const startScheduler = () => {
  // 30초마다 오래된 로그 정리 (테스트용)
  setInterval(() => {
    cleanupOldUsageLogs();
  }, 30000); // 30초마다 실행
  
  logger.info('스케줄러 시작됨 (테스트용) - 30초마다 2분 이전 로그 정리');
};

// === 운영용: 1시간마다 실행 (현재 주석 처리됨) ===
// export const startScheduler = () => {
//   // 1시간마다 24시간 이전 로그 삭제
//   setInterval(() => {
//     cleanupOldUsageLogs();
//   }, 60 * 60 * 1000); // 1시간마다 실행
//   
//   logger.info('스케줄러 시작됨 (운영용) - 1시간마다 24시간 이전 로그 정리');
// };
