import React from 'react';
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
}

interface DashboardTabProps {
  users: User[];
  stats: FortuneStats;
  systemHealth: SystemHealth | null;
}

import { useState } from 'react';

const DashboardTab: React.FC<DashboardTabProps> = ({ users, stats, systemHealth }) => {
  const [search, setSearch] = useState('');
  // 이름, 학교, 이메일 포함 검색
  const filteredUsers = search.trim() === ''
    ? users
    : users.filter(u =>
        u.nickname?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.school?.toLowerCase().includes(search.toLowerCase())
      );
  // 학교별 통계도 검색어 반영
  const filteredSchoolStats = search.trim() === ''
    ? stats.schoolStats
    : stats.schoolStats.filter(s =>
        s.school.toLowerCase().includes(search.toLowerCase())
      );
  return (
    <div className="space-y-6">
      {/* 검색 입력 */}
      <div className="flex justify-end mb-2">
        <input
          type="text"
          className="border border-amber-200 rounded-lg px-4 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="이름, 학교, 이메일로 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{filteredUsers.length}</div>
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
              <div className="text-3xl font-bold">{filteredUsers.filter(u => u.is_admin).length}</div>
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
      {/* 학교별 사용자 수 & 사용자 증가 추이 (반응형 2열) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* 학교별 사용자 수 표 (절반 크기) */}
        <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <i className="ri-school-line mr-2 text-amber-500"></i>
            학교별 사용자 수
          </h3>
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
                  filteredSchoolStats
                    .sort((a, b) => b.users - a.users)
                    .map((school, idx) => (
                      <tr key={school.school}>
                        <td className="px-4 py-2 font-bold text-amber-600">{idx + 1}</td>
                        <td className="px-4 py-2 text-gray-800">{school.school}</td>
                        <td className="px-4 py-2 text-gray-700">{school.users}명</td>
                        <td className="px-4 py-2 text-gray-700">{school.fortunes}개</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">학교별 사용자 데이터가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        {/* 사용자 증가 추이 리스트 (절반 크기) */}
        <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg flex flex-col items-center justify-center">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <i className="ri-line-chart-line mr-2 text-blue-500"></i>
            사용자 증가 추이
          </h3>
          {stats.userGrowth && stats.userGrowth.length > 0 ? (
            <div className="w-full">
              <ul className="divide-y divide-amber-100">
                {(() => {
                  const weeks: { label: string; users: number; diff: number | null }[] = [];
                  let weekMap: { [key: string]: number } = {};
                  stats.userGrowth.forEach(({ date, users }) => {
                    const d = new Date(date);
                    const month = d.getMonth() + 1;
                    const week = Math.ceil((d.getDate() + (new Date(d.getFullYear(), d.getMonth(), 1).getDay())) / 7);
                    const label = `${month}월 ${week}주`;
                    weekMap[label] = users;
                  });
                  const weekLabels = Object.keys(weekMap).sort((a, b) => {
                    const [am, aw] = a.split('월 ').map((v, i) => i === 0 ? parseInt(v) : parseInt(v.replace('주', '')));
                    const [bm, bw] = b.split('월 ').map((v, i) => i === 0 ? parseInt(v) : parseInt(v.replace('주', '')));
                    return am === bm ? aw - bw : am - bm;
                  });
                  weekLabels.forEach((label, idx) => {
                    const users = weekMap[label];
                    const prevUsers = idx === 0 ? null : weekMap[weekLabels[idx - 1]];
                    const diff = prevUsers !== null ? ((users - prevUsers) / prevUsers) * 100 : null;
                    weeks.push({ label, users, diff });
                  });
                  return weeks.map((w) => (
                    <li key={w.label} className="flex items-center justify-between py-3">
                      <div className="font-semibold text-gray-800">{w.label}</div>
                      <div className="flex items-center space-x-4">
                        <span className="text-lg font-bold text-blue-600">{w.users.toLocaleString()}명</span>
                        {w.diff !== null && (
                          <span className={`text-sm font-semibold ${w.diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>{w.diff >= 0 ? '+' : ''}{w.diff.toFixed(1)}%</span>
                        )}
                      </div>
                    </li>
                  ));
                })()}
              </ul>
            </div>
          ) : (
            <div className="text-gray-500">데이터가 없습니다.</div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardTab;
