import React, { useState } from 'react';
import Card from '../../../components/base/Card';

interface SchoolStat {
  school: string;
  users: number;
  fortunes: number;
}

interface FortuneStats {
  totalUsers?: number;
  totalFortunes: number;
  todayFortunes: number;
  totalAdmins: number;
  schoolStats: SchoolStat[];
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
}

const DashboardTab: React.FC<DashboardTabProps> = ({ users, stats }) => {
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolPage, setSchoolPage] = useState(1);
  const [schoolSortBy, setSchoolSortBy] = useState<'users' | 'fortunes'>('users');
  const [schoolSortOrder, setSchoolSortOrder] = useState<'asc' | 'desc'>('desc');

  const SCHOOLS_PER_PAGE = 5;

  // 학교별 통계 검색 필터
  const filteredSchoolStats = schoolSearch.trim() === ''
    ? stats.schoolStats
    : stats.schoolStats.filter(s =>
        s.school.toLowerCase().includes(schoolSearch.toLowerCase())
      );

  // CSV 다운로드 함수
  const handleSchoolCSVDownload = () => {
    // 정렬된 전체 데이터 (페이징 없이)
    const sortedData = filteredSchoolStats
      .sort((a, b) => {
        let aValue, bValue;
        if (schoolSortBy === 'users') {
          aValue = a.users;
          bValue = b.users;
          
          // 사용자 수가 같으면 운세 수로 정렬 (항상 내림차순)
          if (aValue === bValue) {
            return b.fortunes - a.fortunes;
          }
        } else {
          aValue = a.fortunes;
          bValue = b.fortunes;
        }
        return schoolSortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      });

    // CSV 헤더
    const headers = ['순위', '학교명', '사용자 수', '운세 수'];
    
    // CSV 데이터 변환
    const csvData = sortedData.map((school, idx) => [
      idx + 1,
      school.school,
      school.users,
      school.fortunes
    ]);
    
    // CSV 문자열 생성
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    // BOM 추가 (한글 인코딩을 위한 UTF-8 BOM)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 다운로드 링크 생성
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `학교별_통계_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 정렬 및 페이지네이션
  const totalSchoolPages = Math.ceil(filteredSchoolStats.length / SCHOOLS_PER_PAGE);
  const pagedSchoolStats = filteredSchoolStats
    .sort((a, b) => {
      let aValue, bValue;
      if (schoolSortBy === 'users') {
        aValue = a.users;
        bValue = b.users;
        
        // 사용자 수가 같으면 운세 수로 정렬 (항상 내림차순)
        if (aValue === bValue) {
          return b.fortunes - a.fortunes;
        }
      } else {
        // schoolSortBy === 'fortunes'
        aValue = a.fortunes;
        bValue = b.fortunes;
      }
      return schoolSortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    })
    .slice((schoolPage - 1) * SCHOOLS_PER_PAGE, schoolPage * SCHOOLS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-4xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight mt-2">Report</h1>
          <button
            onClick={handleSchoolCSVDownload}
            className="self-start mt-7 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-2 transition-colors"
            title="Download"
          >
            <i className="ri-download-line"></i>
            <span>Download</span>
          </button>
        </div>
        <p className="mt-2 text-gray-500 dark:text-gray-400">서비스 주요 지표와 현황을 한눈에 확인하세요.</p>
        <div className="mt-5 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{stats.totalUsers || users.length}</div>
              <div className="text-sm opacity-90">총 사용자</div>
            </div>
            <i className="ri-user-line text-3xl opacity-80"></i>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-green-500 to-teal-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{stats.totalFortunes}</div>
              <div className="text-sm opacity-90">총 운세</div>
            </div>
            <i className="ri-star-line text-3xl opacity-80"></i>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{stats.todayFortunes}</div>
              <div className="text-sm opacity-90">오늘의 운세</div>
            </div>
            <i className="ri-calendar-line text-3xl opacity-80"></i>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-red-500 to-pink-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">
                {stats.totalAdmins}
              </div>
              <div className="text-sm opacity-90">관리자</div>
            </div>
            <i className="ri-shield-user-line text-3xl opacity-80"></i>
          </div>
        </Card>
      </div>

      {/* 학교별 사용자 수 */}
      <div className="mt-10">
        <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
                <i className="ri-school-line text-slate-700 dark:text-gray-300 text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">학교별 사용자 수</h3>
               
              </div>
            </div>
            
            {/* 검색 및 정렬 컨트롤 */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* 검색 입력 */}
              <div className="flex-1 relative max-w-xs">
              <input
                type="text"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-slate-500 dark:focus:border-slate-400"
                placeholder="학교명 검색..."
                value={schoolSearch}
                onChange={e => {
                  setSchoolSearch(e.target.value);
                  setSchoolPage(1);
                }}
              />
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-base"></i>
              </div>
              
              {/* 정렬 */}
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <select
                  value={schoolSortBy}
                  onChange={(e) => {
                    setSchoolSortBy(e.target.value as 'users' | 'fortunes');
                    setSchoolPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-slate-500 dark:focus:border-slate-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="users">사용자 수</option>
                  <option value="fortunes">운세 수</option>
                </select>
                
                <button
                  onClick={() => {
                    setSchoolSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                    setSchoolPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                  title={schoolSortOrder === 'desc' ? '내림차순' : '오름차순'}
                >
                  {schoolSortOrder === 'desc' ? '↓' : '↑'}
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-slate-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">순위</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">학교명</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">사용자 수</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">운세 수</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {filteredSchoolStats?.length ? (
                  pagedSchoolStats.map((school, idx) => (
                    <tr key={school.school} className="hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                        {(schoolPage - 1) * SCHOOLS_PER_PAGE + idx + 1}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{school.school}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{school.users}명</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{school.fortunes}개</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                      학교별 사용자 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            {totalSchoolPages > 1 && (
              <div className="flex justify-center items-center mt-6 space-x-2">
                {Array.from({ length: totalSchoolPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                      schoolPage === page
                        ? 'bg-slate-900 dark:bg-gray-600 text-white border-slate-900 dark:border-gray-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
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
      </div>
    </div>
  );
};

export default DashboardTab;
