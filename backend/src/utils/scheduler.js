import { supabase, supabaseAdmin } from '../config/database.js';
import { logger } from './logger.js';

// === 재가입 제한 정리 ===
export const cleanupExpiredDeletionRestrictions = async () => {
  try {
    logger.info('만료된 재가입 제한 정리 시작');
    
    const currentTime = new Date();
    
    // 먼저 만료된 항목들을 조회해서 로그에 남기기 (RLS 우회를 위해 supabaseAdmin 사용)
    const { data: expiredItems, error: queryError } = await supabaseAdmin
      .from('deletion_restrictions')
      .select('id, created_at, expires_at')
      .lt('expires_at', currentTime.toISOString());
    
    if (queryError) {
      logger.error('만료된 재가입 제한 조회 실패', { 
        error: queryError,
        errorCode: queryError.code,
        errorMessage: queryError.message 
      });
      throw queryError;
    }
    
    const expiredCount = expiredItems?.length || 0;
    logger.info('만료된 재가입 제한 조회 완료', { 
      expiredCount,
      currentTime: currentTime.toISOString(),
      expiredItems: expiredItems?.map(item => ({
        id: item.id,
        created_at: item.created_at,
        expires_at: item.expires_at
      })) || []
    });
    
    // 만료된 항목이 없으면 삭제하지 않음
    if (expiredCount === 0) {
      logger.info('만료된 재가입 제한 없음 - 삭제 건너뜀');
      return { deletedCount: 0, success: true };
    }
    
    // 만료된 항목 삭제 (RLS 우회를 위해 supabaseAdmin 사용)
    const { data, error } = await supabaseAdmin
      .from('deletion_restrictions')
      .delete()
      .lt('expires_at', currentTime.toISOString())
      .select();
    
    if (error) {
      logger.error('재가입 제한 정리 실패', { 
        error,
        errorCode: error.code,
        errorMessage: error.message 
      });
      throw error;
    }
    
    const deletedCount = data?.length || 0;
    // === 운영용: 24시간 경과한 재가입 제한 해제됨 (운영시 활성화) ===
    logger.info('만료된 재가입 제한 정리 완료', { 
      deletedCount,
      expiredCount,
      currentTime: currentTime.toISOString(),
      note: '24시간 경과한 재가입 제한 해제됨'
    });
    
    // === 테스트용: 1분 경과한 재가입 제한 해제됨 (테스트시 주석 해제 필요) ===
    // logger.info('만료된 재가입 제한 정리 완료', { 
    //   deletedCount,
    //   expiredCount,
    //   currentTime: currentTime.toISOString(),
    //   note: '1분 경과한 재가입 제한 해제됨 (테스트용)'
    // });
    
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
//       .lt('used_at', cutoffTime.toISOString()) // used_at 기준으로 변경
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

// === 운영용: 어제 이전 모든 로그 삭제 (운영시 활성화) ===
export const cleanupOldUsageLogs = async () => {
  try {
    logger.info('오래된 일일 사용 로그 정리 시작 (운영용)');
    
    // 어제 이전의 모든 로그 삭제 (서버 재시작 시 누락된 로그도 정리)
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    const yesterdayEndStr = yesterday.toISOString();
    
    const { data } = await supabase
      .from('daily_usage_log')
      .delete()
      .lte('used_at', yesterdayEndStr)
      .select();
    
    const deletedCount = data?.length || 0;
    logger.info('일일 사용 로그 정리 완료 (운영용)', { 
      deletedCount,
      cutoffTime: yesterdayEndStr,
      note: '어제 이전의 모든 로그 삭제 (서버 재시작 시 누락된 로그도 정리)'
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
    
    // 1. 만료된 재가입 제한 정리만 실행 (로그 삭제는 별도 스케줄러에서)
    const restrictionResult = await cleanupExpiredDeletionRestrictions();
    
    logger.info('만료된 데이터 통합 정리 완료', {
      restrictionsDeleted: restrictionResult.deletedCount,
      totalOperations: 1
    });
    
    return {
      success: true,
      results: {
        deletionRestrictions: restrictionResult.deletedCount
      }
    };
    
  } catch (error) {
    logger.error('만료된 데이터 정리 실패', error);
    throw error;
  }
};

// === 매일 00:02에 로그 삭제 스케줄러 ===
const scheduleDailyLogCleanup = () => {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 2, 0, 0); // 오늘 00:02
  
  let msUntilCleanup;
  
  // 오늘 00:02가 이미 지났다면 어제 로그를 즉시 삭제하고, 다음날 00:02부터 정기 실행
  if (now >= today) {
    // 오늘 00:02가 이미 지났으므로 어제 로그 즉시 삭제
    cleanupOldUsageLogs();
    
    // 다음날 00:02까지 대기
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 2, 0, 0);
    msUntilCleanup = tomorrow.getTime() - now.getTime();
  } else {
    // 오늘 00:02가 아직 안 지났으면 오늘 00:02까지 대기
    msUntilCleanup = today.getTime() - now.getTime();
  }
  
  setTimeout(() => {
    // 첫 실행 (다음날 00:02 또는 오늘 00:02)
    cleanupOldUsageLogs();
    
    // 이후 매일 00:02에 실행
    setInterval(cleanupOldUsageLogs, 24 * 60 * 60 * 1000);
    
    logger.info('로그 삭제 스케줄러 등록 완료 - 매일 00:02 실행');
  }, msUntilCleanup);
};


// === 테스트용: 30초마다 실행 (테스트시 주석 해제 필요) ===
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

// === 운영용: 스케줄러 시작 (운영시 활성화) ===
export const startScheduler = () => {
  logger.info('스케줄러 시작 (운영용)');
  
  // 매일 00:02에 어제 날짜 로그 삭제
  scheduleDailyLogCleanup();
  
  // 1시간마다 재가입 제한 정리만 실행
  setInterval(async () => {
    try {
      await cleanupExpiredDeletionRestrictions();
    } catch (error) {
      logger.error('스케줄러 실행 실패', error);
    }
  }, 60 * 60 * 1000); // 1시간마다 실행
  
  // 서버 시작 시 즉시 한 번 실행
  setTimeout(async () => {
    try {
      await cleanupExpiredDeletionRestrictions();
    } catch (error) {
      logger.error('초기 정리 작업 실패', error);
    }
  }, 5000); // 서버 시작 5초 후 실행
  
  logger.info('스케줄러 등록 완료 (운영용) - 매일 00:02에 로그 삭제, 1시간마다 재가입 제한 정리');
};

// === 테스트용: 30초마다 실행 (테스트시 주석 해제 필요) ===
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
//   logger.info('스케줄러 등록 완료 (테스트용) - 30초마다 1분 이전 재가입 제한 정리');
// };
