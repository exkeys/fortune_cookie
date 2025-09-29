
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
// import Button from '../../components/base/Button';
import Card from '../../components/base/Card';
import Header from '../../components/feature/Header';

interface User {
  id: string;
  email: string;
  nickname: string;
  status: 'active' | 'inactive' | 'deleted' | 'banned';
  is_admin: boolean;
  created_at: string;
  last_login_at: string | null;
  // 필요한 경우 추가 컬럼
// ...existing code...

interface FortuneStats {
  totalFortunes: number;
  todayFortunes: number;
  weeklyFortunes: number;
  monthlyFortunes: number;
  popularRoles: { name: string; count: number; color: string }[];
  userGrowth: { date: string; users: number }[];
  fortuneGrowth: { date: string; fortunes: number }[];
  schoolStats: { school: string; users: number; fortunes: number }[];
}

interface SystemHealth {
  cpu: number;
  memory: number;
  storage: number;
  uptime: string;
  responseTime: number;
  errorRate: number;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'analytics' | 'marketing' | 'settings' | 'system'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<FortuneStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserModal, setShowUserModal] = useState<User | null>(null);
  const [analyticsView, setAnalyticsView] = useState<'school' | 'individual'>('school');
  const [analyticsSearchTerm, setAnalyticsSearchTerm] = useState('');


  // 모든 데이터 로드
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        setUsers([]);
      } else {
        setUsers(data as User[]);
      }
      setIsLoading(false);
    };
    fetchUsers();
  }, []);

        {/* 마케팅 탭 */}
        {activeTab === 'marketing' && stats && (
          <div className="space-y-6">
            <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <i className="ri-megaphone-line mr-2 text-orange-500"></i>
                마케팅 대시보드
              </h2>

              {/* 마케팅 지표 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">{((users.filter(u => u.status === 'active').length / users.length) * 100).toFixed(1)}%</div>
                      <div className="text-sm opacity-90">활성 사용자율</div>
                    </div>
                    <i className="ri-user-heart-line text-3xl opacity-80"></i>
                  </div>
                </Card>
                
                <Card className="p-6 bg-gradient-to-r from-green-500 to-teal-500 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">{(stats.totalFortunes / users.length).toFixed(1)}</div>
                      <div className="text-sm opacity-90">사용자당 평균</div>
                    </div>
                    <i className="ri-trophy-line text-3xl opacity-80"></i>
                  </div>
                </Card>
                
                <Card className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">{stats.schoolStats.length}</div>
                      <div className="text-sm opacity-90">참여 학교 수</div>
                    </div>
                    <i className="ri-school-line text-3xl opacity-80"></i>
                  </div>
                </Card>
                
                <Card className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-bold">-</div>
                      <div className="text-sm opacity-90">충성 고객</div>
                    </div>
                    <i className="ri-star-line text-3xl opacity-80"></i>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 학교별 마케팅 분석 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i className="ri-building-line mr-2 text-amber-500"></i>
                    학교별 마케팅 현황
                  </h3>
                  <div className="space-y-4">
                    {stats.schoolStats.map((school, index) => {
                      const totalUsers = stats.schoolStats.reduce((sum, s) => sum + s.users, 0);
                      const marketShare = ((school.users / totalUsers) * 100).toFixed(1);
                      const avgFortunes = (school.fortunes / school.users).toFixed(1);
                      
                      return (
                        <div key={school.school} className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-bold text-gray-800">{school.school}</div>
                                <div className="text-sm text-gray-600">시장점유율 {marketShare}%</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-amber-600">{school.users}명</div>
                              <div className="text-sm text-gray-500">평균 {avgFortunes}개</div>
                            </div>
                          </div>
                          
                          {/* 마케팅 등급 */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">마케팅 등급</span>
                            <div className="flex items-center space-x-2">
                              {parseFloat(avgFortunes) >= 5 ? (
                                <span className="text-green-600 font-bold text-sm">🔥 핫</span>
                              ) : parseFloat(avgFortunes) >= 3 ? (
                                <span className="text-amber-600 font-bold text-sm">⚡ 활발</span>
                              ) : (
                                <span className="text-gray-600 font-bold text-sm">📈 성장 가능</span>
                        )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 마케팅 인사이트 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <i className="ri-lightbulb-line mr-2 text-green-500"></i>
                    마케팅 인사이트
                  </h3>
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                      <h4 className="font-bold text-gray-700 mb-3">🎯 타겟 그룹</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">최고 활성 학교</span>
                          <span className="font-bold text-green-600">
                            {stats.schoolStats.reduce((max, school) => 
                              (school.fortunes / school.users) > (max.fortunes / max.users) ? school : max
                            ).school}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">최대 규모 학교</span>
                          <span className="font-bold text-blue-600">
                            {stats.schoolStats.reduce((max, school) => 
                              school.users > max.users ? school : max
                            ).school}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">성장 잠재력</span>
                          <span className="font-bold text-amber-600">
                            {stats.schoolStats.filter(s => (s.fortunes / s.users) < 3).length}개 학교
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                      <h4 className="font-bold text-gray-700 mb-3">📊 사용자 세그먼트</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">파워 유저 (20개↑)</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-400 h-2 rounded-full"
                            style={{ width: `0%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-purple-600">
                              -명
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">활성 유저 (10-19개)</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-400 h-2 rounded-full"
                            style={{ width: `0%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-blue-600">-명</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">신규 유저 (10개↓)</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gray-400 h-2 rounded-full"
                            style={{ width: `0%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-gray-600">-명</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                      <h4 className="font-bold text-gray-700 mb-3">🚀 마케팅 액션 플랜</h4>
                      <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex items-start space-x-2">
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {[
                              { time: '14:32:15', level: 'INFO', message: '사용자 로그인 성공: user@example.com' },
                              { time: '14:31:42', level: 'INFO', message: '운세 생성 완료: Fortune ID #12847' },
                              { time: '14:30:18', level: 'WARN', message: 'API 응답 시간 증가: 234ms' },
                              { time: '14:29:55', level: 'INFO', message: '데이터베이스 백업 완료' },
                              { time: '14:28:33', level: 'ERROR', message: '외부 API 연결 실패 (재시도 중)' },
                              { time: '14:27:12', level: 'INFO', message: '새 사용자 등록: 김민수' }
                            ].map((log, index) => (
                              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                                <span className="text-xs font-mono text-gray-500 w-16">{log.time}</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full w-12 text-center ${
                                  log.level === 'ERROR' ? 'bg-red-100 text-red-600' :
                                  log.level === 'WARN' ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-green-100 text-green-600'
                                }`}>
                                  {log.level}
                                </span>
                                <span className="text-sm text-gray-700 flex-1">{log.message}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div> {/* end .space-y-2 text-xs text-gray-600 */}
                    </div> {/* end .bg-gradient-to-r from-purple-50 to-pink-50 ... */}
                  </div> {/* end .space-y-6 */}
                </div> {/* end 마케팅 인사이트 */}
              </div> {/* end .grid grid-cols-1 lg:grid-cols-2 gap-8 */}
            </Card>
        )}
      </div>
    </div>
  );
}
          </div>
        )}
      </div>
    </div>
  );
}
