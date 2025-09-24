import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/feature/Header';
import { supabase } from '../../supabaseClient';
import PageHeader from './components/PageHeader';
import LoadingState from './components/LoadingState';
import EmptyState from './components/EmptyState';
import LoginPrompt from './components/LoginPrompt';
import StatisticsCards from './components/StatisticsCards';
import FilterAndSearchBar from './components/FilterAndSearchBar';
import PastConcernGrid from './components/PastConcernGrid';
import DetailModal from './components/DetailModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import Pagination from './components/Pagination';


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

interface Role {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

// 역할 데이터 (role-select 페이지와 동일)
const roles = [
  {
    id: 'ceo',
    name: 'CEO/리더',
    icon: 'ri-crown-line',
    description: '리더십과 경영 관련 조언',
    color: 'from-gray-900 to-gray-800'
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
    .filter(Boolean) as Role[];
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <Header />
        <LoadingState />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <Header />
      
      {/* 65% 본문 영역 with 17.5% 양쪽 여백 */}
      <div className="w-full">
        <div className="w-[90%] md:w-[80%] lg:w-[70%] xl:w-[65%] mx-auto py-4">
          {/* 페이지 헤더 */}
          <PageHeader totalCount={history.length} />

          {/* 통계 카드 */}
          {isLoggedIn && history.length > 0 && (
            <StatisticsCards
              totalCount={history.length}
              uniqueRolesCount={uniqueRoles.length}
              recentWeekCount={history.filter(item => {
                const date = new Date(item.date);
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return date > weekAgo;
              }).length}
              weeklyAverage={Math.ceil(history.length / 7)}
            />
          )}

          {/* 액션 바 */}
          {isLoggedIn && history.length > 0 && (
            <FilterAndSearchBar
              searchTerm={searchTerm}
              filterRole={filterRole}
              sortBy={sortBy}
              viewMode={viewMode}
              uniqueRoles={uniqueRoles}
              onSearchChange={(value) => {
                setSearchTerm(value);
                setCurrentPage(1);
              }}
              onFilterRoleChange={(value) => {
                setFilterRole(value);
                setCurrentPage(1);
              }}
              onSortByChange={setSortBy}
              onViewModeChange={setViewMode}
              onClearAll={() => setShowDeleteConfirm('all')}
              onNewFortune={() => {
                if (isLoggedIn) {
                  navigate('/role-select');
                } else {
                  alert('로그인 후 이용해 주세요');
                }
              }}
              onClearSearch={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              onClearRoleFilter={() => {
                setFilterRole('all');
                setCurrentPage(1);
              }}
            />
          )}
        </div>
        
        {!isLoggedIn ? (
          /* 로그인 안내 */
          <LoginPrompt />
        ) : filteredHistory.length === 0 ? (
          /* 빈 상태 */
          <EmptyState
            isLoggedIn={isLoggedIn}
            onNavigateHome={() => navigate('/')}
            onLogin={async () => {
              const { error } = await supabase.auth.signInWithOAuth({ provider: 'kakao' });
              if (error) console.error('로그인 에러:', error);
            }}
          />
        ) : (
          /* 메인 콘텐츠 */
          <div className="w-[90%] md:w-[80%] lg:w-[70%] xl:w-[65%] mx-auto">
            <div className="space-y-8">
              {/* 결과 헤더 */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm lg:text-base xl:text-lg font-bold text-gray-800">
                    {filteredHistory.length}개의 기록
                  </h2>
                  {filteredHistory.length !== history.length && (
                    <span className="text-xs lg:text-sm xl:text-base text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      전체 {history.length}개 중
                    </span>
                  )}
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-6 h-6 lg:w-8 lg:h-8 xl:w-10 xl:h-10 flex items-center justify-center rounded bg-white border border-gray-200 text-gray-400 hover:text-amber-500 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm"
                  >
                    <i className="ri-arrow-left-s-line text-sm lg:text-base xl:text-lg"></i>
                  </button>
                  
                  <span className="text-xs lg:text-sm xl:text-base font-medium text-gray-600 px-2 py-1 bg-white rounded border border-gray-200 shadow-sm">
                    {currentPage} / {totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-6 h-6 lg:w-8 lg:h-8 xl:w-10 xl:h-10 flex items-center justify-center rounded bg-white border border-gray-200 text-gray-400 hover:text-amber-500 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm"
                  >
                    <i className="ri-arrow-right-s-line text-sm lg:text-base xl:text-lg"></i>
                  </button>
                </div>
              )}
            </div>
            
            {/* 그리드/리스트 뷰 */}
            <PastConcernGrid
              items={currentItems}
              startIndex={startIndex}
              viewMode={viewMode}
              formatDate={formatDate}
              onItemClick={setSelectedItem}
              onShareClick={(item, e) => {
                e.stopPropagation();
                const shareText = `🥠 운세쿠키 결과\n\n"${item.fortune}"\n\n받은 조언이에요!`;
                navigator.clipboard.writeText(shareText);
                alert('클립보드에 복사되었습니다!');
              }}
              onDeleteClick={(id, e) => {
                e.stopPropagation();
                setShowDeleteConfirm(id);
              }}
            />
            
            {/* 페이지네이션 하단 */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
            </div>
          </div>
        )}
      </div>

      {/* 상세보기 모달 */}
      {selectedItem && (
        <DetailModal
          item={selectedItem}
          formatDate={formatDate}
          onClose={() => setSelectedItem(null)}
          onShare={() => {
            const shareText = `🥠 운세쿠키 결과\n\n"${selectedItem.fortune}"\n\n받은 조언이에요!`;
            navigator.clipboard.writeText(shareText);
            alert('클립보드에 복사되었습니다!');
          }}
          onNewFortune={() => {
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
          onDelete={() => setShowDeleteConfirm(selectedItem.id)}
        />
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          isDeleteAll={showDeleteConfirm === 'all'}
          onConfirm={() => {
            if (showDeleteConfirm === 'all') {
              handleClearAll();
            } else {
              handleDeleteItem(showDeleteConfirm);
            }
          }}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
