import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/base/Button';
import Card from '../../components/base/Card';
import Header from '../../components/feature/Header';
import { supabase } from '../../supabaseClient';

interface HistoryItem {
  id: string;
  date: string;
  role?: {
    id: string;
    name: string;
    icon: string;
    description: string;
    color: string;
  };
  concern?: string;
  fortune: string;
}

// 역할 데이터 (role-select 페이지와 동일)
const roles = [
  {
    id: 'ceo',
    name: 'CEO/리더',
    icon: 'ri-crown-line',
    description: '리더십과 경영 관련 조언',
    color: 'from-purple-400 to-purple-600'
  },
  {
    id: 'designer',
    name: '디자이너',
    icon: 'ri-palette-line',
    description: '창작과 디자인 영감',
    color: 'from-pink-400 to-pink-600'
  },
  {
    id: 'developer',
    name: '개발자',
    icon: 'ri-code-line',
    description: '기술과 개발 관련 통찰',
    color: 'from-blue-400 to-blue-600'
  },
  {
    id: 'marketer',
    name: '마케터',
    icon: 'ri-megaphone-line',
    description: '마케팅과 브랜딩 전략',
    color: 'from-green-400 to-green-600'
  },
  {
    id: 'student',
    name: '학생',
    icon: 'ri-book-line',
    description: '학업과 진로 상담',
    color: 'from-indigo-400 to-indigo-600'
  },
  {
    id: 'freelancer',
    name: '프리랜서',
    icon: 'ri-briefcase-line',
    description: '독립적인 일과 자유로운 삶',
    color: 'from-amber-400 to-amber-600'
  },
  {
    id: 'parent',
    name: '부모',
    icon: 'ri-heart-line',
    description: '육아와 가족 관계',
    color: 'from-rose-400 to-rose-600'
  },
  {
    id: 'other',
    name: '기타',
    icon: 'ri-user-line',
    description: '직접 역할을 입력해보세요',
    color: 'from-gray-400 to-gray-600'
  }
];

// persona 이름으로부터 역할 정보를 복원하는 함수
const getRoleFromPersona = (persona: string) => {
  const foundRole = roles.find(role => role.name === persona);
  if (foundRole) {
    return foundRole;
  }
  // 일치하는 역할이 없으면 커스텀 역할로 처리
  return {
    id: 'custom',
    name: persona,
    icon: 'ri-user-line',
    description: `${persona} 관련 조언`,
    color: 'from-gray-400 to-gray-600'
  };
};

export default function PastConcernsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const itemsPerPage = 12;
  
  // Supabase에서 실제 기록 로드
  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      
      if (!uid) { 
        setHistory([]);
        setIsLoggedIn(false);
        setIsLoading(false); 
        return; 
      }
      
      setIsLoggedIn(true);
      const { data, error } = await supabase
        .from('ai_answers')
        .select('id, created_at, persona, concern, ai_response')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const mapped: HistoryItem[] = (data || []).map((row: any) => ({
        id: row.id,
        date: row.created_at,
        role: row.persona ? getRoleFromPersona(row.persona) : undefined,
        concern: row.concern,
        fortune: row.ai_response,
      }));
      
      setHistory(mapped);
    } catch (err) {
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [location]); // location이 변경될 때마다 데이터 새로고침

  // 필터링 및 검색된 데이터
  const filteredHistory = history
    .filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.concern?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fortune.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.role?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = filterRole === 'all' || item.role?.id === filterRole;
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredHistory.slice(startIndex, endIndex);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // 실제 날짜 기준으로 비교 (시간 무시)
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = nowOnly.getTime() - dateOnly.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays === 2) return '그저께';
    if (diffDays <= 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', { 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  const handleDeleteItem = async (id: string) => {
    try {
      // Supabase에서 삭제
      const { error } = await supabase
        .from('ai_answers')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('삭제 실패:', error);
        alert('삭제에 실패했습니다. 다시 시도해주세요.');
        return;
      }
      
      // 로컬 상태 업데이트
      const updatedHistory = history.filter(item => item.id !== id);
      setHistory(updatedHistory);
      setSelectedItem(null);
      setShowDeleteConfirm(null);
      
      // 현재 페이지에 아이템이 없으면 이전 페이지로
      const newFilteredHistory = updatedHistory.filter(item => {
        const matchesSearch = searchTerm === '' || 
          item.concern?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.fortune.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.role?.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesRole = filterRole === 'all' || item.role?.id === filterRole;
        
        return matchesSearch && matchesRole;
      });
      
      const newTotalPages = Math.ceil(newFilteredHistory.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (error) {
      console.error('삭제 중 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };
  
  const handleClearAll = async () => {
    try {
      // 현재 사용자의 모든 기록을 Supabase에서 삭제
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      
      if (uid) {
        const { error } = await supabase
          .from('ai_answers')
          .delete()
          .eq('user_id', uid);
        
        if (error) {
          console.error('전체 삭제 실패:', error);
          alert('전체 삭제에 실패했습니다. 다시 시도해주세요.');
          return;
        }
      }
      
      // 로컬 상태 업데이트
      setHistory([]);
      setSelectedItem(null);
      setCurrentPage(1);
      setSearchTerm('');
      setFilterRole('all');
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('전체 삭제 중 오류:', error);
      alert('전체 삭제 중 오류가 발생했습니다.');
    }
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedItem(null);
  };

  // 고유 역할 목록 추출
  const uniqueRoles = Array.from(new Set(history.map(item => item.role?.id).filter(Boolean)))
    .map(roleId => history.find(item => item.role?.id === roleId)?.role)
    .filter(Boolean);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            </div>
            <div className="space-y-3">
              <div className="h-6 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-lg animate-pulse w-40 mx-auto"></div>
              <div className="h-4 bg-gradient-to-r from-slate-200 to-blue-200 rounded-lg animate-pulse w-32 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <Header />
      
      <div className="container mx-auto px-7 py-14 max-w-full">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 mb-6">
              운세 기록 보관함
            </h1>
            <p className="text-xl lg:text-2xl xl:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              지금까지 받은 <span className="font-bold text-amber-600">{history.length}개</span>의 소중한 운세를 체계적으로 관리하고 언제든 다시 확인하세요
            </p>
            <div className="flex items-center justify-center space-x-2 mt-4">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>

          {/* 통계 카드 */}
          {isLoggedIn && history.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="p-7 lg:p-9 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center">
                <div className="text-3xl lg:text-4xl xl:text-5xl font-bold">{history.length}</div>
                <div className="text-base lg:text-lg xl:text-xl opacity-90 mt-2">총 운세</div>
              </Card>
              <Card className="p-7 lg:p-9 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-center">
                <div className="text-3xl lg:text-4xl xl:text-5xl font-bold">{uniqueRoles.length}</div>
                <div className="text-base lg:text-lg xl:text-xl opacity-90 mt-2">상담 역할</div>
              </Card>
              <Card className="p-7 lg:p-9 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-center">
                <div className="text-3xl lg:text-4xl xl:text-5xl font-bold">{history.filter(item => {
                  const date = new Date(item.date);
                  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  return date > weekAgo;
                }).length}</div>
                <div className="text-base lg:text-lg xl:text-xl opacity-90 mt-2">최근 7일</div>
              </Card>
              <Card className="p-7 lg:p-9 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-center">
                <div className="text-3xl lg:text-4xl xl:text-5xl font-bold">{Math.ceil(history.length / 7)}</div>
                <div className="text-base lg:text-lg xl:text-xl opacity-90 mt-2">주 평균</div>
              </Card>
            </div>
          )}

          {/* 액션 바 */}
          {isLoggedIn && history.length > 0 && (
            <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* 검색창 */}
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="ri-search-line text-gray-400 text-lg"></i>
                    </div>
                    <input
                      type="text"
                      placeholder="운세 내용, 역할, 고민으로 검색..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-400 transition-all duration-300 text-gray-800 placeholder-gray-500 shadow-sm"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setCurrentPage(1);
                        }}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <i className="ri-close-line text-lg"></i>
                      </button>
                    )}
                  </div>
                </div>

                {                /* 필터 및 정렬 옵션 */}
                <div className="flex flex-wrap gap-3">
                  {/* 역할 필터 */}
                  <div className="relative">
                    <select
                      value={filterRole}
                      onChange={(e) => {
                        setFilterRole(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3.5 pr-10 text-gray-700 focus:ring-4 focus:ring-amber-100 focus:border-amber-400 transition-all duration-300 shadow-sm min-w-32"
                    >
                      <option value="all">모든 역할</option>
                      {uniqueRoles.map((role) => role && (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    <i className="ri-arrow-down-s-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                  </div>

                  {/* 정렬 옵션 */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                      className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3.5 pr-10 text-gray-700 focus:ring-4 focus:ring-amber-100 focus:border-amber-400 transition-all duration-300 shadow-sm min-w-32"
                    >
                      <option value="newest">최신순</option>
                      <option value="oldest">오래된 순</option>
                    </select>
                    <i className="ri-arrow-down-s-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                  </div>

                  {/* 보기 모드 토글 */}
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-4 py-2.5 rounded-lg transition-all duration-300 ${
                        viewMode === 'grid'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <i className="ri-grid-line"></i>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-2.5 rounded-lg transition-all duration-300 ${
                        viewMode === 'list'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <i className="ri-list-unordered"></i>
                    </button>
                  </div>

                  {/* 새 운세 및 전체 삭제 버튼 */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm('all')}
                      className="whitespace-nowrap bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                    >
                      <i className="ri-delete-bin-line mr-2"></i>
                      전체 삭제
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (isLoggedIn) {
                          navigate('/role-select');
                        } else {
                          alert('로그인 후 이용해 주세요');
                        }
                      }}
                      className="whitespace-nowrap bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    >
                      <i className="ri-add-line mr-2"></i>
                      새 운세
                    </Button>
                  </div>
                </div>
              </div>

              {/* 활성 필터 표시 */}
              {(searchTerm || filterRole !== 'all') && (
                <div className="flex items-center flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-600">활성 필터:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      <i className="ri-search-line mr-1.5"></i>
                      "{searchTerm}"
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setCurrentPage(1);
                        }}
                        className="ml-2 hover:text-blue-900"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </span>
                  )}
                  {filterRole !== 'all' && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      <i className="ri-user-line mr-1.5"></i>
                      {uniqueRoles.find(r => r && r.id === filterRole)?.name}
                      <button
                        onClick={() => {
                          setFilterRole('all');
                          setCurrentPage(1);
                        }}
                        className="ml-2 hover:text-purple-900"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </span>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
        
        {!isLoggedIn ? (
          /* 로그인 안내 */
          <Card className="p-20 md:p-24 lg:p-28 text-center bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <div className="text-9xl md:text-[12rem] lg:text-[15rem] xl:text-[18rem] mb-12">🔐</div>
            <h3 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-800 mb-6">로그인이 필요해요</h3>
            <p className="text-xl md:text-2xl lg:text-3xl xl:text-4xl text-gray-600 mb-12 leading-relaxed">과거 운세 기록을 보려면 먼저 로그인해주세요</p>
            <Button 
              onClick={async () => {
                const { error } = await supabase.auth.signInWithOAuth({ provider: 'kakao' });
                if (error) console.error('로그인 에러:', error);
              }}
              size="lg"
              className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl px-12 py-6 md:px-16 md:py-8 lg:px-20 lg:py-10 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              카카오로 로그인하기
            </Button>
          </Card>
        ) : filteredHistory.length === 0 ? (
          /* 빈 상태 */
          <Card className="p-20 md:p-24 lg:p-28 text-center bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <div className="max-w-2xl mx-auto">
              <div className="text-8xl md:text-9xl lg:text-[12rem] xl:text-[15rem] mb-12">
                {history.length === 0 ? '🥠' : '🔍'}
              </div>
              <h3 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-800 mb-6">
                {history.length === 0 ? '아직 운세 기록이 없어요' : '검색 결과가 없어요'}
              </h3>
              <p className="text-xl md:text-2xl lg:text-3xl xl:text-4xl text-gray-600 mb-12 leading-relaxed">
                {history.length === 0 
                  ? '첫 번째 운세를 받아보시겠어요? 당신만의 특별한 조언이 기다리고 있어요!' 
                  : '다른 검색어나 필터를 시도해보세요. 원하는 운세를 찾을 수 있을 거예요.'
                }
              </p>
              <div className="space-y-6">
                {history.length === 0 ? (
                  <Button
                    size="lg"
                    onClick={() => {
                      if (isLoggedIn) {
                        navigate('/role-select');
                      } else {
                        alert('로그인 후 이용해 주세요');
                      }
                    }}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-2xl md:text-3xl lg:text-4xl xl:text-5xl px-12 py-6 md:px-16 md:py-8 lg:px-20 lg:py-10"
                  >
                    <i className="ri-magic-line mr-3 text-2xl md:text-3xl lg:text-4xl xl:text-5xl"></i>
                    운세 받기 시작하기
                  </Button>
                ) : (
                  <div className="flex justify-center space-x-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setFilterRole('all');
                        setCurrentPage(1);
                      }}
                      className="text-xl md:text-2xl lg:text-3xl xl:text-4xl px-8 py-4 md:px-12 md:py-6 lg:px-16 lg:py-8"
                    >
                      <i className="ri-refresh-line mr-3 text-xl md:text-2xl lg:text-3xl xl:text-4xl"></i>
                      필터 초기화
                    </Button>
                    <Button
                      onClick={() => {
                        if (isLoggedIn) {
                          navigate('/role-select');
                        } else {
                          alert('로그인 후 이용해 주세요');
                        }
                      }}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-xl md:text-2xl lg:text-3xl xl:text-4xl px-8 py-4 md:px-12 md:py-6 lg:px-16 lg:py-8"
                    >
                      <i className="ri-add-line mr-3 text-xl md:text-2xl lg:text-3xl xl:text-4xl"></i>
                      새 운세 받기
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ) : (
          /* 메인 콘텐츠 */
          <div className="space-y-8">
            {/* 결과 헤더 */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-6">
                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-800">
                  {filteredHistory.length}개의 기록
                </h2>
                {filteredHistory.length !== history.length && (
                  <span className="text-base lg:text-lg xl:text-xl text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                    전체 {history.length}개 중
                  </span>
                )}
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-12 h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 flex items-center justify-center rounded-xl bg-white border-2 border-gray-200 text-gray-400 hover:text-amber-500 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm"
                  >
                    <i className="ri-arrow-left-s-line text-lg lg:text-xl xl:text-2xl"></i>
                  </button>
                  
                  <span className="text-base lg:text-lg xl:text-xl font-medium text-gray-600 px-6 py-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
                    {currentPage} / {totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-12 h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 flex items-center justify-center rounded-xl bg-white border-2 border-gray-200 text-gray-400 hover:text-amber-500 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm"
                  >
                    <i className="ri-arrow-right-s-line text-lg lg:text-xl xl:text-2xl"></i>
                  </button>
                </div>
              )}
            </div>
            
            {/* 그리드/리스트 뷰 */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 xl:gap-12">
                {currentItems.map((item, index) => (
                  <Card
                    key={item.id}
                    hover
                    className="group p-8 lg:p-10 xl:p-12 bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden"
                    onClick={() => setSelectedItem(item)}
                  >
                    {/* 배경 그라데이션 */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.role?.color || 'from-gray-200 to-gray-300'} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    
                    {/* 순서 번호 */}
                    <div className="absolute top-6 right-6 w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-sm lg:text-base xl:text-lg font-bold shadow-lg">
                      {startIndex + index + 1}
                    </div>

                    <div className="relative z-10">
                      {/* 역할 섹션 */}
                      <div className="flex items-center space-x-4 lg:space-x-5 xl:space-x-6 mb-6">
                        {item.role && (
                          <div className={`w-16 h-16 lg:w-18 lg:h-18 xl:w-20 xl:h-20 rounded-xl bg-gradient-to-r ${item.role.color} flex items-center justify-center text-white shadow-lg`}>
                            <i className={`${item.role.icon} text-xl lg:text-2xl xl:text-3xl`}></i>
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-gray-800 text-xl lg:text-2xl xl:text-3xl">
                            {item.role?.name || '일반 상담'}
                          </h3>
                          <span className="text-base lg:text-lg xl:text-xl text-gray-500">
                            {formatDate(item.date)}
                          </span>
                        </div>
                      </div>
                      
                      {/* 고민 내용 */}
                      {item.concern && (
                        <div className="mb-6">
                          <p className="text-base lg:text-lg xl:text-xl text-gray-600 line-clamp-2 bg-gray-50 p-4 lg:p-5 xl:p-6 rounded-xl border border-gray-100">
                            💭 {item.concern}
                          </p>
                        </div>
                      )}
                      
                      {/* 운세 내용 */}
                      <div className="mb-6">
                        <p className="text-base lg:text-lg xl:text-xl text-gray-700 line-clamp-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 lg:p-5 xl:p-6 rounded-xl border-l-4 border-blue-400">
                          "✨ {item.fortune}"
                        </p>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <div className="flex space-x-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const shareText = `🥠 운세쿠키 결과\n\n"${item.fortune}"\n\n받은 조언이에요!`;
                              navigator.clipboard.writeText(shareText);
                              alert('클립보드에 복사되었습니다!');
                            }}
                            className="w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors duration-300"
                          >
                            <i className="ri-share-line text-base lg:text-lg xl:text-xl"></i>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                            }}
                            className="w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 flex items-center justify-center rounded-lg bg-green-50 text-green-500 hover:bg-green-100 transition-colors duration-300"
                          >
                            <i className="ri-eye-line text-base lg:text-lg xl:text-xl"></i>
                          </button>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(item.id);
                          }}
                          className="w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors duration-300 opacity-0 group-hover:opacity-100"
                        >
                          <i className="ri-delete-bin-line text-base lg:text-lg xl:text-xl"></i>
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              /* 리스트 뷰 */
              <div className="space-y-6 lg:space-y-8 xl:space-y-10">
                {currentItems.map((item, index) => (
                  <Card
                    key={item.id}
                    hover
                    className="group p-8 lg:p-10 xl:p-12 bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex items-start space-x-6 lg:space-x-8 xl:space-x-10">
                      {/* 순서 번호 */}
                      <div className="flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl flex items-center justify-center font-bold shadow-lg text-base lg:text-lg xl:text-xl">
                        {startIndex + index + 1}
                      </div>

                      {/* 역할 아이콘 */}
                      {item.role && (
                        <div className={`w-16 h-16 lg:w-18 lg:h-18 xl:w-20 xl:h-20 rounded-xl bg-gradient-to-r ${item.role.color} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                          <i className={`${item.role.icon} text-xl lg:text-2xl xl:text-3xl`}></i>
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        {/* 헤더 */}
                        <div className="flex justify-between items-start mb-5">
                          <div>
                            <h3 className="font-bold text-gray-800 text-2xl lg:text-3xl xl:text-4xl mb-2">
                              {item.role?.name || '일반 상담'}
                            </h3>
                            <span className="text-base lg:text-lg xl:text-xl text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                              {formatDate(item.date)}
                            </span>
                          </div>
                          
                          <div className="flex space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const shareText = `🥠 운세쿠키 결과\n\n"${item.fortune}"\n\n받은 조언이에요!`;
                                navigator.clipboard.writeText(shareText);
                                alert('클립보드에 복사되었습니다!');
                              }}
                              className="w-12 h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors duration-300"
                            >
                              <i className="ri-share-line text-lg lg:text-xl xl:text-2xl"></i>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(item.id);
                              }}
                              className="w-12 h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors duration-300"
                            >
                              <i className="ri-delete-bin-line text-lg lg:text-xl xl:text-2xl"></i>
                            </button>
                          </div>
                        </div>
                        
                        {/* 고민 내용 */}
                        {item.concern && (
                          <div className="mb-5">
                            <p className="text-base lg:text-lg xl:text-xl text-gray-600 line-clamp-1 bg-gray-50 p-4 lg:p-5 xl:p-6 rounded-xl border border-gray-100">
                              💭 {item.concern}
                            </p>
                          </div>
                        )}
                        
                        {/* 운세 미리보기 */}
                        <p className="text-lg lg:text-xl xl:text-2xl text-gray-700 line-clamp-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 lg:p-6 xl:p-8 rounded-xl border-l-4 border-blue-400">
                          "✨ {item.fortune}"
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            
            {/* 페이지네이션 하단 */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-16 lg:mt-20 xl:mt-24">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="w-14 h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 flex items-center justify-center rounded-xl bg-white border-2 border-gray-200 text-gray-400 hover:text-amber-500 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm"
                  >
                    <i className="ri-arrow-left-s-line text-lg lg:text-xl xl:text-2xl"></i>
                  </button>
                  
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-14 h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 flex items-center justify-center rounded-xl font-bold transition-all duration-300 text-lg lg:text-xl xl:text-2xl ${
                          currentPage === page
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg scale-110'
                            : 'bg-white border-2 border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600 shadow-sm'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="w-14 h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 flex items-center justify-center rounded-xl bg-white border-2 border-gray-200 text-gray-400 hover:text-amber-500 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm"
                  >
                    <i className="ri-arrow-right-s-line text-lg lg:text-xl xl:text-2xl"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 상세보기 모달 */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white">
            <div className="p-8">
              {/* 모달 헤더 */}
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center space-x-4">
                  {selectedItem.role && (
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${selectedItem.role.color} flex items-center justify-center text-white shadow-lg`}>
                      <i className={`${selectedItem.role.icon} text-xl`}></i>
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-800 text-2xl mb-1">
                      {selectedItem.role?.name || '일반 상담'}
                    </h3>
                    <p className="text-gray-500">
                      {formatDate(selectedItem.date)}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors duration-300"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
              
              {/* 고민 내용 */}
              {selectedItem.concern && (
                <div className="mb-8">
                  <h4 className="font-bold text-gray-800 mb-4 text-lg flex items-center">
                    <i className="ri-question-line mr-2 text-blue-500"></i>
                    나눈 고민
                  </h4>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-l-4 border-blue-400">
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {selectedItem.concern}
                    </p>
                  </div>
                </div>
              )}
              
              {/* 운세 내용 */}
              <div className="mb-8">
                <h4 className="font-bold text-gray-800 mb-4 text-lg flex items-center">
                  <i className="ri-magic-line mr-2 text-purple-500"></i>
                  받은 조언
                </h4>
                <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6 rounded-xl border-l-4 border-purple-400 shadow-inner">
                  <p className="text-gray-800 leading-relaxed font-medium text-lg">
                    "✨ {selectedItem.fortune}"
                  </p>
                </div>
              </div>
              
              {/* 액션 버튼들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const shareText = `🥠 운세쿠키 결과\n\n"${selectedItem.fortune}"\n\n받은 조언이에요!`;
                    navigator.clipboard.writeText(shareText);
                    alert('클립보드에 복사되었습니다!');
                  }}
                  className="bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                >
                  <i className="ri-share-line mr-2"></i>
                  운세 공유하기
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedItem?.role && selectedItem?.concern) {
                      // 기존 역할과 고민 정보를 그대로 가져가서 포춘 쿠키 페이지로 이동
                      navigate('/fortune-cookie', {
                        state: {
                          selectedRole: selectedItem.role,
                          concern: selectedItem.concern
                        }
                      });
                    } else {
                      // 역할이나 고민 정보가 없으면 역할 선택 페이지로
                      navigate('/role-select');
                    }
                  }}
                  className="bg-white hover:bg-green-50 hover:border-green-300 hover:text-green-600"
                >
                  <i className="ri-refresh-line mr-2"></i>
                  비슷한 고민으로 새 운세 받기
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(selectedItem.id)}
                  className="bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-600 md:col-span-2"
                >
                  <i className="ri-delete-bin-line mr-2"></i>
                  이 기록 삭제하기
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="p-8 max-w-md w-full bg-white">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-delete-bin-line text-2xl text-red-500"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {showDeleteConfirm === 'all' ? '모든 기록을 삭제하시겠습니까?' : '이 기록을 삭제하시겠습니까?'}
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {showDeleteConfirm === 'all' 
                  ? '모든 운세 기록이 영구적으로 삭제되며, 이 작업은 되돌릴 수 없습니다.' 
                  : '선택한 운세 기록이 영구적으로 삭제되며, 이 작업은 되돌릴 수 없습니다.'
                }
              </p>
              
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-white hover:bg-gray-50"
                >
                  취소
                </Button>
                <Button
                  onClick={() => {
                    if (showDeleteConfirm === 'all') {
                      handleClearAll();
                    } else {
                      handleDeleteItem(showDeleteConfirm);
                    }
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 focus:ring-red-200"
                >
                  <i className="ri-delete-bin-line mr-2"></i>
                  삭제
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}