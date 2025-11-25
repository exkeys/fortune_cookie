import { supabase, supabaseAdmin } from '../config/database.js';
import { SchoolPeriodService } from './schoolPeriodService.js';
import { logger } from '../utils/logger.js';

export class AccessControlService {
  /**
   * 사용자의 서비스 접근 권한을 종합적으로 체크
   * @param {string} userId - 사용자 ID
   * @returns {Promise<{canAccess: boolean, reason?: string, schoolPeriod?: object}>}
   */
  static async checkUserAccess(userId) {
    try {
      logger.info('사용자 접근 권한 체크 시작', { 
        userId, 
        userIdType: typeof userId,
        userIdLength: userId?.length 
      });

      // userId 유효성 체크
      if (!userId || typeof userId !== 'string') {
        logger.error('유효하지 않은 userId', { userId, type: typeof userId });
        return {
          canAccess: false,
          reason: '유효하지 않은 사용자 ID입니다'
        };
      }

      // UUID 형식 체크 (간단한 형식 검증)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        logger.error('잘못된 UUID 형식', { userId });
        return {
          canAccess: false,
          reason: '잘못된 사용자 ID 형식입니다'
        };
      }

      // 1. 사용자 정보 조회 - UUID를 명시적으로 string으로 처리
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, status, school, nickname, email, is_admin, created_at')
        .eq('id', String(userId))
        .single();

      if (userError || !user) {
        logger.error('사용자 조회 실패', { userId, error: userError });
        return {
          canAccess: false,
          reason: '사용자를 찾을 수 없습니다'
        };
      }

      // 2. 밴된 사용자 체크 (최우선 - 관리자 포함 모든 사용자 차단)
      if (user.status === 'banned') {
        logger.info('밴된 사용자 접근 차단', { userId, userStatus: user.status, isAdmin: user.is_admin });
        return {
          canAccess: false,
          reason: '차단된 계정입니다. 관리자에게 문의하세요.'
        };
      }

      // 3. 탈퇴한 사용자 체크 (완전 삭제)
      if (user.status === 'deleted') {
        logger.info('삭제된 사용자 접근 차단', { userId, userStatus: user.status });
        return {
          canAccess: false,
          reason: '탈퇴한 계정입니다.'
        };
      }


      // 4. 관리자는 학교 기간 체크 우회
      if (user.is_admin) {
        logger.info('관리자 접근 - 학교 기간 체크 우회', { userId });
        return {
          canAccess: true,
          user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            school: user.school,
            is_admin: user.is_admin,
            status: user.status,
            created_at: user.created_at
          }
        };
      }

      // 5. 학교 정보가 없는 경우 (사용자 정보는 반환)
      if (!user.school) {
        logger.info('학교 정보 없음', { userId });
        return {
          canAccess: false,
          reason: '학교 정보가 설정되지 않았습니다. 학교를 선택해주세요.',
          user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            school: user.school,
            is_admin: user.is_admin,
            status: user.status,
            created_at: user.created_at
          }
        };
      }

      // 6. 학교 기간 설정 확인
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
      const activeSchoolPeriods = await SchoolPeriodService.getActiveSchoolPeriods(today);
      const userSchoolPeriod = activeSchoolPeriods.schoolPeriods.find(
        period => period.school_name === user.school
      );

      if (!userSchoolPeriod) {
        logger.info('사용자 학교의 이용 기간 설정 없음', { 
          userId, 
          userSchool: user.school,
          availableSchools: activeSchoolPeriods.schoolPeriods.map(p => p.school_name)
        });
        return {
          canAccess: false,
          reason: `${user.school}의 이용 기간이 설정되지 않았습니다. 관리자에게 문의하세요.`,
          user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            school: user.school,
            is_admin: user.is_admin,
            status: user.status,
            created_at: user.created_at
          }
        };
      }

      // 7. 현재 날짜가 허용 기간 내인지 확인
      const currentDate = new Date();
      const startDate = new Date(userSchoolPeriod.start_date);
      const endDate = new Date(userSchoolPeriod.end_date + 'T23:59:59'); // 종료일 포함

      if (currentDate < startDate || currentDate > endDate) {
        logger.info('사용자 학교의 이용 기간 외 접근', { 
          userId, 
          userSchool: user.school,
          currentDate: currentDate.toISOString(),
          allowedPeriod: {
            start: userSchoolPeriod.start_date,
            end: userSchoolPeriod.end_date
          }
        });
        return {
          canAccess: false,
          reason: `${user.school}의 이용 기간(${userSchoolPeriod.start_date} ~ ${userSchoolPeriod.end_date})이 아닙니다.`,
          user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            school: user.school,
            is_admin: user.is_admin,
            status: user.status,
            created_at: user.created_at
          },
          schoolPeriod: userSchoolPeriod
        };
      }

      // 8. 모든 검사를 통과한 경우
      logger.info('사용자 접근 승인', { 
        userId, 
        userSchool: user.school,
        schoolPeriod: userSchoolPeriod 
      });

      return {
        canAccess: true,
        user: user,
        schoolPeriod: userSchoolPeriod
      };

    } catch (error) {
      logger.error('사용자 접근 권한 체크 예외', { userId, error });
      return {
        canAccess: false,
        reason: '접근 권한 확인 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 학교별 일일 사용 제한 체크
   * @param {string} userId - 사용자 ID
   * @param {string} userSchool - 사용자 학교
   * @returns {Promise<{canUse: boolean, reason?: string}>}
   */
  static async checkDailyUsageLimit(userId, userSchool) {
    try {
      logger.info('학교별 일일 사용 제한 체크', { userId, userSchool });

      // userId 유효성 재검증
      if (!userId || typeof userId !== 'string') {
        logger.error('유효하지 않은 userId', { userId, type: typeof userId });
        return { canUse: false, reason: '사용자 정보가 올바르지 않습니다.' };
      }

      // 관리자는 일일 제한 체크 우회 (에러 처리 강화)
      try {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', String(userId))
          .single();

        if (userError) {
          logger.error('사용자 조회 실패 (일일 제한 체크)', { userId, userError });
          // 조회 실패 시 안전하게 제한 적용
          return { canUse: false, reason: '사용자 정보 확인에 실패했습니다.' };
        }

        if (user?.is_admin) {
          logger.info('관리자 일일 제한 체크 우회', { userId });
          return { canUse: true };
        }
      } catch (adminCheckError) {
        logger.error('관리자 체크 중 예외', { userId, adminCheckError });
        // 관리자 체크 실패 시에도 일반 사용자로 처리 계속
      }

      // === 테스트용: 1분 제한 (테스트시 주석 해제 필요) ===
      // let latestUsage, error;
      // 
      // try {
      //   const now = new Date();
      //   const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000); // 1분 전
      // 
      //   // 최적화: 1분 내 사용한 로그 중 최신 1개만 가져오기
      //   const result = await supabase
      //     .from('daily_usage_log')
      //     .select('used_at')  // 필요한 필드만 선택
      //     .eq('user_id', String(userId))
      //     .gte('used_at', oneMinuteAgo.toISOString())
      //     .order('used_at', { ascending: false })  // 최신순 정렬
      //     .limit(1);  // 1개만 가져오기
      //   
      //   latestUsage = result.data?.[0] || null;
      //   error = result.error;

      //   logger.info('일일 사용 로그 조회 결과 (최적화)', { 
      //     userId, 
      //     hasUsedToday: !!latestUsage,
      //     hasError: !!error,
      //     oneMinuteAgo: oneMinuteAgo.toISOString()
      //   });
      // } catch (queryError) {
      //   logger.error('일일 사용 로그 조회 중 예외', { userId, queryError });
      //   // 쿼리 실패 시 안전하게 사용 허용 (서비스 중단 방지)
      //   return { canUse: true };
      // }

      // === 운영용: 24시간 제한 (운영시 활성화) ===
      let latestUsage, error;
      
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.toISOString();
        
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const todayEndStr = todayEnd.toISOString();
        
        // 최적화: 오늘 사용한 로그 중 최신 1개만 가져오기 (RLS 정책 우회를 위해 supabaseAdmin 사용)
        const result = await supabaseAdmin
          .from('daily_usage_log')
          .select('used_at')  // 필요한 필드만 선택
          .eq('user_id', String(userId))
          .gte('used_at', todayStart)
          .lte('used_at', todayEndStr)
          .order('used_at', { ascending: false })  // 최신순 정렬
          .limit(1);  // 1개만 가져오기
        
        latestUsage = result.data?.[0] || null;
        error = result.error;

        logger.info('일일 사용 로그 조회 결과 (최적화)', { 
          userId, 
          hasUsedToday: !!latestUsage,
          hasError: !!error,
          todayStart,
          todayEnd: todayEndStr
        });
      } catch (queryError) {
        logger.error('일일 사용 로그 조회 중 예외', { userId, queryError });
        // 쿼리 실패 시 안전하게 사용 허용 (서비스 중단 방지)
        return { canUse: true };
      }

      if (error) {
        logger.error('일일 사용 제한 체크 실패', { userId, userSchool, error });
        // DB 오류 시 안전하게 사용 허용 (서비스 중단 방지)
        return { canUse: true };
      }

      const hasUsedToday = !!latestUsage;

      // 다음 이용 가능 시간 계산 (used_at 기준)
      let nextAvailableAt = null;
      if (hasUsedToday && latestUsage) {
        const lastUsedAt = new Date(latestUsage.used_at);
        const now = new Date();
        
        // === 테스트용: 1분 후 시간 계산 (테스트시 주석 해제 필요) ===
        // const oneMinuteAfter = new Date(lastUsedAt.getTime() + 1 * 60 * 1000); // 마지막 사용 시간 + 1분
        // // 이미 지나갔으면 현재 시간 + 1분으로 설정 (항상 최소 1분 남도록 보장)
        // if (oneMinuteAfter <= now) {
        //   // 이미 1분이 지났으면 현재 시간 + 1분으로 설정
        //   nextAvailableAt = new Date(now.getTime() + 1 * 60 * 1000).toISOString();
        //   logger.info('다음 이용 시간 재계산 (이미 지남)', { 
        //     lastUsedAt: lastUsedAt.toISOString(), 
        //     originalNext: oneMinuteAfter.toISOString(),
        //     newNext: nextAvailableAt,
        //     now: now.toISOString()
        //   });
        // } else {
        //   // 아직 1분이 안 지났으면 원래 계산값 사용
        //   nextAvailableAt = oneMinuteAfter.toISOString();
        //   logger.info('다음 이용 시간 (원래 계산값)', { 
        //     lastUsedAt: lastUsedAt.toISOString(),
        //     nextAvailableAt,
        //     now: now.toISOString(),
        //     diffSeconds: Math.floor((oneMinuteAfter - now) / 1000)
        //   });
        // }
        
        // === 운영용: 24시간 후 시간 계산 (운영시 활성화) ===
        // 자정(00:00:00)까지 남은 시간 계산
        const tomorrow = new Date(lastUsedAt);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        // 자정이 이미 지났으면 다음 날 자정으로 설정
        if (tomorrow <= now) {
          const nextDay = new Date(now);
          nextDay.setDate(nextDay.getDate() + 1);
          nextDay.setHours(0, 0, 0, 0);
          nextAvailableAt = nextDay.toISOString();
          logger.info('다음 이용 시간 (다음 날 자정)', { 
            lastUsedAt: lastUsedAt.toISOString(),
            nextAvailableAt,
            now: now.toISOString()
          });
        } else {
          nextAvailableAt = tomorrow.toISOString();
          logger.info('다음 이용 시간 (오늘 자정)', { 
            lastUsedAt: lastUsedAt.toISOString(),
            nextAvailableAt,
            now: now.toISOString(),
            diffHours: Math.floor((tomorrow - now) / (1000 * 60 * 60))
          });
        }
        
        logger.info('다음 이용 가능 시간 계산', { 
          lastUsedAt: lastUsedAt.toISOString(),
          nextAvailableAt,
          now: now.toISOString()
        });
      }

      if (hasUsedToday) {
        logger.info('일일 사용 제한 적용', { 
          userId, 
          userSchool, 
          lastUsedAt: latestUsage.used_at,
          nextAvailableAt,
          note: '운영용 24시간 제한 적용됨 (매일 자정까지 대기)'
        });
        return {
          canUse: false,
          reason: `${userSchool} 학생은 하루에 한 번만 이용할 수 있습니다.`,
          nextAvailableAt // 다음 이용 가능 시간 추가
        };
      }

      logger.info('일일 사용 제한 통과', { userId, userSchool });
      return { canUse: true, nextAvailableAt: null };

    } catch (error) {
      logger.error('일일 사용 제한 체크 예외', { userId, userSchool, error });
      throw error;
    }
  }

  /**
   * 사용자의 전체 접근 가능 여부 체크 (접근 권한 + 일일 제한)
   * @param {string} userId - 사용자 ID
   * @returns {Promise<{canAccess: boolean, canUse?: boolean, reason?: string, user?: object, schoolPeriod?: object}>}
   */
  static async checkFullAccess(userId) {
    try {
      logger.info('전체 접근 권한 체크', { userId });

      // 1. 기본 접근 권한 체크
      const accessResult = await this.checkUserAccess(userId);
      
      if (!accessResult.canAccess) {
        return accessResult;
      }

      // 2. 관리자는 일일 사용 제한 우회
      if (accessResult.user.is_admin) {
        logger.info('관리자 - 일일 사용 제한 우회', { userId });
        return {
          canAccess: true,
          canUse: true, // 관리자는 항상 사용 가능
          nextAvailableAt: null,
          user: accessResult.user,
          schoolPeriod: accessResult.schoolPeriod
        };
      }

      // 3. 일일 사용 제한 체크 (일반 사용자만)
      const usageResult = await this.checkDailyUsageLimit(userId, accessResult.user.school);

      if (!usageResult.canUse) {
        return {
          canAccess: true,
          canUse: false,
          reason: usageResult.reason,
          nextAvailableAt: usageResult.nextAvailableAt || null, // 다음 이용 가능 시간 전달
          user: accessResult.user,
          schoolPeriod: accessResult.schoolPeriod
        };
      }

      // 4. 모든 체크 통과
      return {
        canAccess: true,
        canUse: true,
        nextAvailableAt: null,
        user: accessResult.user,
        schoolPeriod: accessResult.schoolPeriod
      };

    } catch (error) {
      logger.error('전체 접근 권한 체크 예외', { userId, error });
      throw error;
    }
  }
}
