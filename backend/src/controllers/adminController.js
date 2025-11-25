import { supabase, supabaseAdmin } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../utils/controllerWrapper.js';
import { successResponse, errorResponse, validationErrorResponse } from '../utils/responseHelper.js';

export class AdminController {
  /**
   * 모든 사용자 목록 조회
   */
  static getAllUsers = asyncHandler(async (req, res) => {
    logger.info('모든 사용자 목록 조회 요청');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, nickname, status, is_admin, created_at, last_login_at, last_logout_at, school, oauth_provider')
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error('사용자 목록 조회 실패', error);
      return errorResponse(res, '사용자 목록 조회에 실패했습니다', 500);
    }
    
    // users가 null이면 비정상적인 상황 (Supabase는 정상적으로 빈 배열 []을 반환)
    if (!users || !Array.isArray(users)) {
      logger.error('사용자 목록이 null이거나 배열이 아님', { users, error: '데이터 형식 오류' });
      return errorResponse(res, '사용자 목록 조회에 실패했습니다', 500);
    }
    
    // 각 사용자의 운세 수 계산 (배치 처리로 최적화)
    // 1단계: 모든 운세 데이터를 한 번에 가져오기
    const { data: allFortunes, error: fortunesError } = await supabase
      .from('ai_answers')
      .select('user_id');
    
    if (fortunesError) {
      logger.error('운세 데이터 조회 실패', fortunesError);
      return errorResponse(res, '운세 데이터 조회에 실패했습니다', 500);
    }
    
    // 2단계: user_id별로 운세 수 집계 (단일 루프)
    const fortuneCountMap = new Map();
    if (Array.isArray(allFortunes)) {
      allFortunes.forEach((fortune) => {
        const userId = fortune.user_id;
        fortuneCountMap.set(userId, (fortuneCountMap.get(userId) || 0) + 1);
      });
    }
    
    // 3단계: 사용자 목록과 운세 수 결합
    const usersWithFortuneCount = users.map((user) => ({
      ...user,
      fortune_count: fortuneCountMap.get(user.id) || 0
    }));
    
    // 4단계: 정렬 - 관리자 우선, 관리자는 오래된 순, 일반 사용자는 최신순
    const sortedUsers = usersWithFortuneCount.sort((a, b) => {
      // 관리자 우선 정렬
      if (a.is_admin && !b.is_admin) return -1; // a가 관리자면 앞으로
      if (!a.is_admin && b.is_admin) return 1;  // b가 관리자면 앞으로
      
      // 둘 다 관리자인 경우, 생성일 기준 오름차순 (오래된 순)
      if (a.is_admin && b.is_admin) {
        const aDate = new Date(a.created_at).getTime();
        const bDate = new Date(b.created_at).getTime();
        return aDate - bDate; // 오름차순 (오래된 순)
      }
      
      // 둘 다 일반 사용자인 경우, 생성일 기준 내림차순 (최신순)
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return bDate - aDate; // 내림차순 (최신순)
    });
    
    logger.info('사용자 목록 조회 성공', { count: sortedUsers.length });
    
    return successResponse(res, { users: sortedUsers });
  });

  /**
   * 사용자 상태 업데이트
   */
  static updateUser = asyncHandler(async (req, res) => {
    const { userId, field, value } = req.body;
    
    if (!userId || !field || value === undefined) {
      return validationErrorResponse(res, 'userId, field, value가 필요합니다');
    }

    logger.info('사용자 업데이트 요청', { userId, field, value });
    
    // 먼저 기존 사용자 정보 조회 (created_at 보존을 위해)
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('created_at')
      .eq('id', userId)
      .single();
    
    if (fetchError) {
      logger.error('기존 사용자 정보 조회 실패', fetchError);
      return errorResponse(res, '사용자 정보 조회에 실패했습니다', 500);
    }
    
    // existingUser가 null일 수 있음 (.single() 사용 시)
    if (!existingUser) {
      logger.error('사용자를 찾을 수 없음', { userId });
      return errorResponse(res, '사용자를 찾을 수 없습니다', 404);
    }
    
    // 업데이트 데이터 준비 (created_at 보존)
    const updateData = {
      [field]: value,
      created_at: existingUser.created_at // 기존 created_at 값 유지
    };
    
    // supabaseAdmin으로 관리자 권한으로 업데이트
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      logger.error('사용자 업데이트 실패', error);
      return errorResponse(res, '사용자 업데이트에 실패했습니다', 500);
    }
    
    // .single() 사용 시 정상적으로 업데이트되면 data가 반환되어야 함
    // data가 null이면 비정상적인 상황 (업데이트 실패 또는 사용자 없음)
    if (!data) {
      logger.error('사용자 업데이트 후 데이터가 없음 (비정상)', { userId, field, value });
      return errorResponse(res, '사용자 업데이트에 실패했습니다', 500);
    }
    
    logger.info('사용자 업데이트 성공', { userId, field, value, preservedCreatedAt: existingUser.created_at });
    return successResponse(res, { user: data });
  });

  /**
   * 모든 운세 데이터 조회 (관리자용)
   */
  static getAllFortunes = asyncHandler(async (req, res) => {
    logger.info('모든 운세 데이터 조회 요청');
    
    // supabaseAdmin을 사용하여 RLS 정책 우회
    const { data: allFortunes, error } = await supabaseAdmin
      .from('ai_answers')
      .select('id, user_id, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error('운세 데이터 조회 실패', error);
      return errorResponse(res, '운세 데이터 조회에 실패했습니다', 500);
    }
    
    logger.info('운세 데이터 조회 성공', { count: allFortunes?.length || 0 });
    return successResponse(res, { fortunes: allFortunes || [] });
  });

  /**
   * 학교별 통계 조회 (관리자용)
   */
  static getSchoolStats = asyncHandler(async (req, res) => {
    logger.info('학교별 통계 조회 요청');
    
    try {
      // 1단계: 모든 사용자 데이터 가져오기
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, school');
      
      if (usersError) {
        logger.error('사용자 데이터 조회 실패', usersError);
        return errorResponse(res, '사용자 데이터 조회에 실패했습니다', 500);
      }
      
      // 2단계: 모든 운세 데이터 가져오기
      const { data: allFortunes, error: fortunesError } = await supabaseAdmin
        .from('ai_answers')
        .select('id, user_id');
      
      if (fortunesError) {
        logger.error('운세 데이터 조회 실패', fortunesError);
        return errorResponse(res, '운세 데이터 조회에 실패했습니다', 500);
      }
      
      // 3단계: userId -> school 맵 생성
      const userIdToSchoolMap = new Map();
      const schoolMap = {};
      
      if (Array.isArray(users)) {
        users.forEach((user) => {
          const school = user.school || '미입력';
          userIdToSchoolMap.set(user.id, school);
          
          // 학교별 사용자 수 집계
          if (!schoolMap[school]) {
            schoolMap[school] = { users: 0, fortunes: 0 };
          }
          schoolMap[school].users += 1;
        });
      }
      
      // 4단계: 운세 데이터 집계
      if (Array.isArray(allFortunes)) {
        allFortunes.forEach((fortune) => {
          if (fortune.user_id) {
            const school = userIdToSchoolMap.get(fortune.user_id) || '미입력';
            if (schoolMap[school]) {
              schoolMap[school].fortunes += 1;
            } else {
              // 학교 정보가 없는 사용자의 운세는 '미입력'으로 집계
              if (!schoolMap['미입력']) {
                schoolMap['미입력'] = { users: 0, fortunes: 0 };
              }
              schoolMap['미입력'].fortunes += 1;
            }
          }
        });
      }
      
      // 5단계: 결과 변환
      const schoolStats = Object.entries(schoolMap).map(([school, obj]) => ({
        school,
        users: obj.users,
        fortunes: obj.fortunes
      }));
      
      logger.info('학교별 통계 조회 성공', { count: schoolStats.length });
      return successResponse(res, { schoolStats });
    } catch (error) {
      logger.error('학교별 통계 조회 예외', error);
      return errorResponse(res, '학교별 통계 조회에 실패했습니다', 500);
    }
  });

  /**
   * 대시보드 통계 조회 (관리자용) - 모든 통계를 한 번에 반환
   */
  static getDashboard = asyncHandler(async (req, res) => {
    logger.info('대시보드 통계 조회 요청');
    
    try {
      // 1단계: 기본 통계 계산 (COUNT 쿼리로 최적화)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      
      // 총 사용자 수
      const { count: totalUsers, error: usersCountError } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (usersCountError) {
        logger.error('사용자 수 조회 실패', usersCountError);
        return errorResponse(res, '사용자 데이터 조회에 실패했습니다', 500);
      }
      
      // 총 관리자 수
      const { count: totalAdmins, error: adminsCountError } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_admin', true);
      
      if (adminsCountError) {
        logger.error('관리자 수 조회 실패', adminsCountError);
        return errorResponse(res, '관리자 데이터 조회에 실패했습니다', 500);
      }
      
      // 총 운세 수
      const { count: totalFortunes, error: fortunesCountError } = await supabaseAdmin
        .from('ai_answers')
        .select('*', { count: 'exact', head: true });
      
      if (fortunesCountError) {
        logger.error('운세 수 조회 실패', fortunesCountError);
        return errorResponse(res, '운세 데이터 조회에 실패했습니다', 500);
      }
      
      // 오늘의 운세 수
      const { count: todayFortunes, error: todayFortunesError } = await supabaseAdmin
        .from('ai_answers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayISO);
      
      if (todayFortunesError) {
        logger.error('오늘의 운세 수 조회 실패', todayFortunesError);
        return errorResponse(res, '오늘의 운세 데이터 조회에 실패했습니다', 500);
      }
      
      // 5단계: 학교별 통계 집계
      // 1단계: 모든 사용자 데이터 가져오기
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, school');
      
      if (usersError) {
        logger.error('사용자 데이터 조회 실패', usersError);
        return errorResponse(res, '사용자 데이터 조회에 실패했습니다', 500);
      }
      
      // 2단계: 모든 운세 데이터 가져오기
      const { data: allFortunes, error: fortunesError } = await supabaseAdmin
        .from('ai_answers')
        .select('id, user_id');
      
      if (fortunesError) {
        logger.error('운세 데이터 조회 실패', fortunesError);
        return errorResponse(res, '운세 데이터 조회에 실패했습니다', 500);
      }
      
      // 3단계: userId -> school 맵 생성
      const userIdToSchoolMap = new Map();
      const schoolMap = {};
      
      if (Array.isArray(users)) {
        users.forEach((user) => {
          const school = user.school || '미입력';
          userIdToSchoolMap.set(user.id, school);
          
          // 학교별 사용자 수 집계
          if (!schoolMap[school]) {
            schoolMap[school] = { users: 0, fortunes: 0 };
          }
          schoolMap[school].users += 1;
        });
      }
      
      // 4단계: 운세 데이터 집계
      if (Array.isArray(allFortunes)) {
        allFortunes.forEach((fortune) => {
          if (fortune.user_id) {
            const school = userIdToSchoolMap.get(fortune.user_id) || '미입력';
            if (schoolMap[school]) {
              schoolMap[school].fortunes += 1;
            } else {
              // 학교 정보가 없는 사용자의 운세는 '미입력'으로 집계
              if (!schoolMap['미입력']) {
                schoolMap['미입력'] = { users: 0, fortunes: 0 };
              }
              schoolMap['미입력'].fortunes += 1;
            }
          }
        });
      }
      
      // 5단계: 결과 변환
      const schoolStats = Object.entries(schoolMap).map(([school, obj]) => ({
        school,
        users: obj.users,
        fortunes: obj.fortunes
      }));
      
      const dashboardData = {
        totalUsers: totalUsers || 0,
        totalFortunes: totalFortunes || 0,
        todayFortunes: todayFortunes || 0,
        totalAdmins: totalAdmins || 0,
        schoolStats
      };
      
      logger.info('대시보드 통계 조회 성공', dashboardData);
      return successResponse(res, dashboardData);
    } catch (error) {
      logger.error('대시보드 통계 조회 예외', error);
      return errorResponse(res, '대시보드 통계 조회에 실패했습니다', 500);
    }
  });
}
