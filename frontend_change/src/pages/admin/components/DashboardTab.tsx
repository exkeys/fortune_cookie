import React, { useState } from 'react';
import Card from '../../../components/base/Card';

interface SchoolStat {
  school: string;
  users: number;
  fortunes: number;
}

interface UserGrowth {
  date: string;
  users: number;
}

interface FortuneStats {
  totalFortunes: number;
  todayFortunes: number;
  weeklyFortunes: number;
  monthlyFortunes: number;
  popularRoles: { name: string; count: number; color: string }[];
  userGrowth: UserGrowth[];
  fortuneGrowth: { date: string; fortunes: number }[];
  schoolStats: SchoolStat[];
}

interface SystemHealth {
  cpu: number;
  memory: number;
  storage: number;
  uptime: string;
  responseTime: number;
  errorRate: number;
}

interface User {
  id: string;
  email: string;
  nickname: string;
  school?: string;
  status: 'active' | 'inactive' | 'deleted' | 'banned';
  is_admin: boolean;
  created_at: string;
  last_login_at: string | null;
  last_logout_at?: string | null;
}

interface DashboardTabProps {
  users: User[];
  stats: FortuneStats;
  systemHealth: SystemHealth | null;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ users, stats, systemHealth }) => {
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolPage, setSchoolPage] = useState(1);
  const [userGrowthPage, setUserGrowthPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [schoolSortBy, setSchoolSortBy] = useState<'users' | 'fortunes'>('users');
  const [schoolSortOrder, setSchoolSortOrder] = useState<'asc' | 'desc'>('desc');

  const SCHOOLS_PER_PAGE = 4;
  const USER_GROWTH_PER_PAGE = 4;

  // 학교별 통계 검색 필터
  const filteredSchoolStats = schoolSearch.trim() === ''
    ? stats.schoolStats
    : stats.schoolStats.filter(s =>
        s.school.toLowerCase().includes(schoolSearch.toLowerCase())
      );

  // 정렬 및 페이지네이션
  const totalSchoolPages = Math.ceil(filteredSchoolStats.length / SCHOOLS_PER_PAGE);
  const pagedSchoolStats = filteredSchoolStats
    .sort((a, b) => {
      const aValue = schoolSortBy === 'users' ? a.users : a.fortunes;
      const bValue = schoolSortBy === 'users' ? b.users : b.fortunes;
      return schoolSortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    })
    .slice((schoolPage - 1) * SCHOOLS_PER_PAGE, schoolPage * SCHOOLS_PER_PAGE);

  // 사용자 증가 추이 페이지네이션
  const userGrowthData = stats.userGrowth && stats.userGrowth.length > 0 ? (() => {
    // ISO 주차 계산 함수
    const getISOWeek = (date: Date) => {
      const target = new Date(date.valueOf());
      const dayNr = (date.getDay() + 6) % 7;
      target.setDate(target.getDate() - dayNr + 3);
      const firstThursday = target.valueOf();
      target.setMonth(0, 1);
      if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
      }
      return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    };

    const yearGroups: { [year: string]: { [week: string]: number } } = {};
    const yearWeekMap: { [year: string]: { [week: string]: { users: number; date: string } } } = {};

    stats.userGrowth.forEach(({ date, users }) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const week = getISOWeek(d);
      
      // 주차가 5를 넘지 않도록 제한
      const validWeek = Math.min(week, 4);
      
      const label = `${year}년 ${month}월 ${validWeek}주`;
      
      if (!yearGroups[year]) {
        yearGroups[year] = {};
        yearWeekMap[year] = {};
      }
      
      yearGroups[year][label] = users;
      yearWeekMap[year][label] = { users, date };
    });

    // 년도별로 정렬하고 주차별로 정렬
    const sortedYears = Object.keys(yearGroups).sort((a, b) => parseInt(a) - parseInt(b));
    const weeks: { label: string; users: number; diff: number | null; year: string }[] = [];

    sortedYears.forEach(year => {
      const yearData = yearGroups[year];
      const weekLabels = Object.keys(yearData).sort((a, b) => {
        const [am, aw] = a.split('월 ').map((v, i) =>
          i === 0 ? parseInt(v) : parseInt(v.replace('주', ''))
        );
        const [bm, bw] = b.split('월 ').map((v, i) =>
          i === 0 ? parseInt(v) : parseInt(v.replace('주', ''))
        );
        return am === bm ? aw - bw : am - bm;
      });

      weekLabels.forEach((label, idx) => {
        const users = yearData[label];
        const prevUsers = idx === 0 ? null : yearData[weekLabels[idx - 1]];
        const diff = prevUsers !== null ? ((users - prevUsers) / prevUsers) * 100 : null;
        weeks.push({ label, users, diff, year });
      });
    });

    return weeks;
  })() : [];

  // 사용 가능한 년도 목록 추출
  const availableYears = userGrowthData.length > 0 
    ? [...new Set(userGrowthData.map(item => item.year))].sort((a, b) => parseInt(a) - parseInt(b))
    : [];

  // 년도 필터링된 데이터
  const filteredUserGrowthData = selectedYear === 'all' 
    ? userGrowthData 
    : userGrowthData.filter(item => item.year === selectedYear);

  const totalUserGrowthPages = Math.ceil(filteredUserGrowthData.length / USER_GROWTH_PER_PAGE);
  const pagedUserGrowthData = filteredUserGrowthData.slice(
    (userGrowthPage - 1) * USER_GROWTH_PER_PAGE, 
    userGrowthPage * USER_GROWTH_PER_PAGE
  );

  return (
    <div className="space-y-6">

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{users.length}</div>
              <div className="text-sm opacity-90">총 사용자</div>
            </div>
            <i className="ri-user-line text-3xl opacity-80"></i>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-green-500 to-teal-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{stats.totalFortunes}</div>
              <div className="text-sm opacity-90">총 운세</div>
            </div>
            <i className="ri-star-line text-3xl opacity-80"></i>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{stats.todayFortunes}</div>
              <div className="text-sm opacity-90">오늘의 운세</div>
            </div>
            <i className="ri-calendar-line text-3xl opacity-80"></i>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-red-500 to-pink-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">
                {users.filter(u => u.is_admin).length}
              </div>
              <div className="text-sm opacity-90">관리자</div>
            </div>
            <i className="ri-shield-user-line text-3xl opacity-80"></i>
          </div>
        </Card>
      </div>

      {/* 시스템 상태 */}
      {systemHealth && (
        <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <i className="ri-pulse-line mr-2 text-green-500"></i>
            시스템 상태
          </h2>
          {/* ...system health content... */}
        </Card>
      )}

      {/* 학교별 사용자 수 & 사용자 증가 추이 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* 학교별 사용자 수 */}
        <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center mb-4 md:mb-0">
              <i className="ri-school-line mr-2 text-amber-500"></i>
              학교별 사용자 수
            </h3>
            
            {/* 검색 및 정렬 컨트롤 */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* 검색 입력 */}
              <input
                type="text"
                className="px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-full sm:w-48"
                placeholder="학교명 검색..."
                value={schoolSearch}
                onChange={e => {
                  setSchoolSearch(e.target.value);
                  setSchoolPage(1);
                }}
              />
              
              {/* 정렬 컨트롤 */}
              <div className="flex gap-1">
                <select
                  value={schoolSortBy}
                  onChange={(e) => {
                    setSchoolSortBy(e.target.value as 'users' | 'fortunes');
                    setSchoolPage(1);
                  }}
                  className="px-2 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                  <option value="users">사용자 수</option>
                  <option value="fortunes">운세 수</option>
                </select>
                
                <button
                  onClick={() => {
                    setSchoolSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                    setSchoolPage(1);
                  }}
                  className="px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white hover:bg-amber-50 transition-colors"
                  title={schoolSortOrder === 'desc' ? '내림차순' : '오름차순'}
                >
                  {schoolSortOrder === 'desc' ? '↓' : '↑'}
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-amber-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순위</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학교명</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자 수</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">운세 수</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-amber-100">
                {filteredSchoolStats?.length ? (
                  pagedSchoolStats.map((school, idx) => (
                    <tr key={school.school}>
                      <td className="px-4 py-2 font-bold text-amber-600">
                        {(schoolPage - 1) * SCHOOLS_PER_PAGE + idx + 1}
                      </td>
                      <td className="px-4 py-2 text-gray-800">{school.school}</td>
                      <td className="px-4 py-2 text-gray-700">{school.users}명</td>
                      <td className="px-4 py-2 text-gray-700">{school.fortunes}개</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      학교별 사용자 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            {totalSchoolPages > 1 && (
              <div className="flex justify-center items-center mt-4 space-x-2">
                {Array.from({ length: totalSchoolPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`px-3 py-1 rounded border text-sm font-semibold ${
                      schoolPage === page
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                    }`}
                    onClick={() => setSchoolPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* 사용자 증가 추이 */}
        <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center mb-4 md:mb-0">
              <i className="ri-line-chart-line mr-2 text-blue-500"></i>
              사용자 증가 추이
            </h3>
            
            {/* 년도 선택 필터 */}
            {availableYears.length > 0 && (
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">년도:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setUserGrowthPage(1); // 년도 변경 시 첫 페이지로
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                >
                  <option value="all">전체</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}년</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {filteredUserGrowthData.length > 0 ? (
            <div className="w-full">
              <div className="space-y-4">
                {(() => {
                  // 년도별로 그룹핑 (선택된 년도가 'all'이 아닌 경우에는 그룹핑하지 않음)
                  if (selectedYear !== 'all') {
                    return (
                      <ul className="space-y-2">
                        {pagedUserGrowthData.map(w => (
                          <li key={w.label} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                            <div className="font-semibold text-gray-800">{w.label}</div>
                            <div className="flex items-center space-x-4">
                              <span className="text-lg font-bold text-blue-600">
                                {w.users.toLocaleString()}명
                              </span>
                              {w.diff !== null && (
                                <span
                                  className={`text-sm font-semibold px-2 py-1 rounded-full ${
                                    w.diff >= 0 
                                      ? 'text-green-700 bg-green-100' 
                                      : 'text-red-700 bg-red-100'
                                  }`}
                                >
                                  {w.diff >= 0 ? '↗' : '↘'} {w.diff >= 0 ? '+' : ''}
                                  {w.diff.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    );
                  }

                  // 전체 년도 표시 시 그룹핑
                  const groupedByYear = pagedUserGrowthData.reduce((acc, item) => {
                    if (!acc[item.year]) {
                      acc[item.year] = [];
                    }
                    acc[item.year].push(item);
                    return acc;
                  }, {} as { [year: string]: typeof pagedUserGrowthData });

                  return Object.keys(groupedByYear).map(year => (
                    <div key={year} className="space-y-2">
                      {/* 년도 헤더 */}
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent flex-1"></div>
                        <h4 className="text-lg font-bold text-amber-700 bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
                          {year}년
                        </h4>
                        <div className="h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent flex-1"></div>
                      </div>
                      
                      {/* 해당 년도의 데이터 */}
                      <ul className="space-y-2">
                        {groupedByYear[year].map(w => (
                          <li key={w.label} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                            <div className="font-semibold text-gray-800">{w.label}</div>
                            <div className="flex items-center space-x-4">
                              <span className="text-lg font-bold text-blue-600">
                                {w.users.toLocaleString()}명
                              </span>
                              {w.diff !== null && (
                                <span
                                  className={`text-sm font-semibold px-2 py-1 rounded-full ${
                                    w.diff >= 0 
                                      ? 'text-green-700 bg-green-100' 
                                      : 'text-red-700 bg-red-100'
                                  }`}
                                >
                                  {w.diff >= 0 ? '↗' : '↘'} {w.diff >= 0 ? '+' : ''}
                                  {w.diff.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ));
                })()}
              </div>

              {/* 사용자 증가 추이 페이지네이션 */}
              {totalUserGrowthPages > 1 && (
                <div className="flex justify-center items-center mt-4 space-x-2">
                  {Array.from({ length: totalUserGrowthPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`px-3 py-1 rounded border text-sm font-semibold ${
                        userGrowthPage === page
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                      }`}
                      onClick={() => setUserGrowthPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">
                {selectedYear === 'all' ? '사용자 증가 추이 데이터가 없습니다.' : `${selectedYear}년 데이터가 없습니다.`}
              </div>
              {selectedYear !== 'all' && (
                <button
                  onClick={() => setSelectedYear('all')}
                  className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                >
                  전체 보기
                </button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardTab;
