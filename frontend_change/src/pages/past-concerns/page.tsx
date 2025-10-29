import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/feature/Header';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
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
import AccessModal from '../../components/feature/AccessModal';


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
  aiFeed?: string; // AI 피드 추가
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
  const { user } = useAuth();
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
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [accessModal, setAccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    icon: string;
    actionButton?: {
      text: string;
      onClick: () => void;
    };
    cancelButtonText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    icon: ''
  });
  const itemsPerPage = 9;
  
  // 모달 헬퍼 함수들
  const showAccessModal = (title: string, message: string, icon: string, actionButton?: { text: string; onClick: () => void }, cancelButtonText?: string) => {
    setAccessModal({
      isOpen: true,
      title,
      message,
      icon,
      actionButton,
      cancelButtonText
    });
  };

  const closeAccessModal = () => {
    setAccessModal(prev => ({ ...prev, isOpen: false }));
  };

  // 접근 권한 체크 함수 (IntroMainContent와 동일)
  const checkAccessPermission = async (userId: string) => {
    if (!userId) return false;
    
    // 중복 요청 방지
    if (isCheckingAccess) {
      console.log('접근 권한 체크 중복 요청 방지');
      return false;
    }
    
    setIsCheckingAccess(true);
    
    try {
      console.log('과거 고민에서 접근 권한 체크 시작...', { userId });
      const response = await fetch(`/api/access-control/check-full-access?userId=${userId}`);
      
      console.log('API 응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 응답 에러:', { status: response.status, text: errorText });
        
        showAccessModal(
          'API 연결 오류',
          `서버와의 연결에 문제가 있습니다.\n\n응답 코드: ${response.status}\n오류 내용: ${errorText || '알 수 없는 오류'}\n\n잠시 후 다시 시도해주세요.`,
          '🔌'
        );
        return false;
      }
      
      const data = await response.json();
      console.log('접근 권한 체크 결과:', data);
      
      // 접근 불가능한 경우
      if (!data.canAccess) {
        let icon = '🚫';
        let title = '서비스 이용 제한';
        let message = data.reason || '서비스 이용이 제한되었습니다.';
        let actionButton = undefined;
        
        if (data.reason?.includes('차단된')) {
          icon = '🚫';
          title = '계정 차단';
          message = '죄송합니다. 현재 계정이 차단된 상태입니다.\n\n서비스 이용에 문제가 있어 관리자에 의해 차단되었습니다. 자세한 내용은 관리자에게 문의해 주세요.';
          
        } else if (data.reason?.includes('학교 정보가 설정되지')) {
          icon = '🏫';
          title = '학교 선택 필요';
          message = '포춘쿠키 서비스를 이용하려면 먼저 학교를 선택해야 합니다.\n\n"학교 선택하기" 버튼을 눌러 소속 학교를 등록해 주세요.';
          actionButton = {
            text: '학교 선택하기',
            onClick: () => {
              closeAccessModal();
              navigate('/school-select');
            }
          };
          
        } else if (data.reason?.includes('이용 기간이 설정되지')) {
          const schoolMatch = data.reason.match(/(.+)의 이용 기간이/);
          const schoolName = schoolMatch ? schoolMatch[1] : '해당 학교';
          
          icon = '📅';
          title = '이용 기간 미설정';
          message = `${schoolName}의 포춘쿠키 서비스 이용 기간이 아직 설정되지 않았습니다.\n\n관리자가 이용 기간을 설정하면 서비스를 이용하실 수 있습니다. 관리자에게 문의해 주세요.`;
          
        } else if (data.reason?.includes('이용 기간(') && data.reason.includes('이 아닙니다')) {
          const periodMatch = data.reason.match(/(.+)의 이용 기간\((.+) ~ (.+)\)이 아닙니다/);
          const schoolName = periodMatch ? periodMatch[1] : '해당 학교';
          const startDate = periodMatch ? periodMatch[2] : '';
          const endDate = periodMatch ? periodMatch[3] : '';
          
          const currentDate = new Date();
          const startDateObj = new Date(startDate);
          const endDateObj = new Date(endDate);
          
          let statusMessage = '';
          if (currentDate < startDateObj) {
            statusMessage = '아직 이용 기간이 시작되지 않았습니다.';
          } else if (currentDate > endDateObj) {
            statusMessage = '이용 기간이 종료되었습니다.';
          }
          
          icon = '📅';
          title = '이용 기간 종료';
          message = `${schoolName}의 포춘쿠키 서비스 이용 기간이 아닙니다.\n\n📅 이용 기간: ${startDate} ~ ${endDate}\n${statusMessage}\n\n새로운 이용 기간에 대해서는 관리자에게 문의해 주세요.`;
          
        } else {
          message = `서비스 이용이 일시적으로 제한되었습니다.\n\n상세 내용: ${data.reason}\n\n문제가 지속되면 관리자에게 문의해 주세요.`;
        }
        
        showAccessModal(title, message, icon, actionButton);
        return false;
      }
      
      // 일일 사용 제한에 걸린 경우
      if (!data.canUse) {
        const message = `하루에 하나씩만 받을 수 있어요.\n\n내일 다시 찾아와 주세요! 🌅`;
        
        showAccessModal(
          '오늘의 포춘쿠키를 이미 받으셨어요!',
          message,
          '🍪',
          {
            text: '지난 고민 보기 📝',
            onClick: () => {
              closeAccessModal();
              // 이미 지난 고민 페이지에 있으므로 모달만 닫기
            }
          }
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('접근 권한 체크 실패:', error);
      
      let errorMessage = '접근 권한 확인 중 오류가 발생했습니다.';
      let icon = '⚠️';
      let title = '연결 오류';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        title = '서버 연결 실패';
        errorMessage = '서버에 연결할 수 없습니다.\n\n네트워크 연결을 확인하고 다시 시도해주세요.';
        icon = '🌐';
      } else if (error instanceof SyntaxError) {
        title = '응답 처리 오류';
        errorMessage = '서버 응답을 처리하는 중 오류가 발생했습니다.\n\n잠시 후 다시 시도해주세요.';
        icon = '🔧';
      }
      
      showAccessModal(title, errorMessage, icon);
      return false;
    } finally {
      setIsCheckingAccess(false);
    }
  };
  
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
        .select('id, created_at, persona, concern, ai_response, ai_feed')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const mapped: HistoryItem[] = (data || []).map((row: any) => ({
        id: row.id,
        date: row.created_at,
        role: row.persona ? getRoleFromPersona(row.persona) : undefined,
        concern: row.concern,
        fortune: row.ai_response,
        aiFeed: row.ai_feed, // AI 피드 매핑 추가
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

  // 마우스 뒤로가기(XButton1) / 앞으로가기(XButton2) 차단
  useEffect(() => {
    const isBrowserSideButton = (ev: any) => {
      // 일부 브라우저는 button 3/4, 일부는 buttons 비트마스크 8/16 사용
      const button: number = typeof ev.button === 'number' ? ev.button : -1;
      const buttons: number = typeof ev.buttons === 'number' ? ev.buttons : 0;
      const sideButtonByButton = button === 3 || button === 4;
      const sideButtonByMask = (buttons & 8) === 8 || (buttons & 16) === 16; // X1/X2
      return sideButtonByButton || sideButtonByMask;
    };

    const handlePointerEvent = (e: PointerEvent | MouseEvent) => {
      if (isBrowserSideButton(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // 마우스 사이드 버튼 이벤트 캡처 (최대한 이른 단계에서 차단)
    window.addEventListener('auxclick', handlePointerEvent as any, { capture: true } as any);
    window.addEventListener('pointerdown', handlePointerEvent as any, { capture: true } as any);
    window.addEventListener('pointerup', handlePointerEvent as any, { capture: true } as any);
    window.addEventListener('mousedown', handlePointerEvent as any, { capture: true } as any);
    window.addEventListener('mouseup', handlePointerEvent as any, { capture: true } as any);

    return () => {
      window.removeEventListener('auxclick', handlePointerEvent as any, { capture: true } as any);
      window.removeEventListener('pointerdown', handlePointerEvent as any, { capture: true } as any);
      window.removeEventListener('pointerup', handlePointerEvent as any, { capture: true } as any);
      window.removeEventListener('mousedown', handlePointerEvent as any, { capture: true } as any);
      window.removeEventListener('mouseup', handlePointerEvent as any, { capture: true } as any);
    };
  }, []);

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
              onNewFortune={async () => {
                if (!isLoggedIn) {
                  showAccessModal('로그인 필요', '로그인 후 이용해 주세요.', '🔑');
                  return;
                }
                
                if (!user?.id) {
                  showAccessModal('사용자 정보 오류', '사용자 정보를 확인할 수 없습니다.\n\n다시 로그인해 주세요.', '👤');
                  return;
                }
                
                console.log('새 운세 - 접근 권한 체크 시작:', { userId: user.id, isAdmin: user.is_admin });
                
                // 접근 권한 체크 (학교 밴 > 일일 사용 제한 순서)
                const canAccess = await checkAccessPermission(user.id);
                
                if (!canAccess) {
                  return; // 이미 모달이 표시됨
                }
                
                // 관리자는 바로 이동 (일일 제한 없음)
                if (user.is_admin) {
                  console.log('관리자 - 바로 포춘쿠키 페이지로 이동');
                  navigate('/role-select');
                  return;
                }
                
                // 일반 사용자는 사전 안내 모달 표시
                showAccessModal(
                  '포춘쿠키 이용 안내',
                  '하루에 한 번만 사용 가능합니다.\n\n포춘쿠키를 받으시겠어요? 🍪',
                  '💡',
                  {
                    text: '확인',
                    onClick: () => {
                      closeAccessModal();
                      navigate('/role-select');
                    }
                  },
                  '취소'
                );
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
            onNavigateHome={async () => {
              if (!user?.id) {
                console.error('사용자 정보를 가져올 수 없습니다.');
                return;
              }
              
              // 접근 권한 체크 (학교 밴 > 일일 사용 제한 순서)
              const canAccess = await checkAccessPermission(user.id);
              
              if (!canAccess) {
                return; // 이미 모달이 표시됨
              }
              
              // 관리자는 바로 이동 (일일 제한 없음)
              if (user.is_admin) {
                console.log('관리자 - 바로 포춘쿠키 페이지로 이동');
                navigate('/role-select');
                return;
              }
              
              // 일반 사용자는 사전 안내 모달 표시
              showAccessModal(
                '포춘쿠키 이용 안내',
                '하루에 한 번만 사용 가능합니다.\n\n포춘쿠키를 받으시겠어요? 🍪',
                '💡',
                {
                  text: '확인',
                  onClick: () => {
                    closeAccessModal();
                    navigate('/role-select');
                  }
                },
                '취소'
              );
            }}
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

              {/* 그리드/리스트 뷰 - 높이 제한 및 스크롤 제거 */}
              <PastConcernGrid
                items={currentItems}
                startIndex={startIndex}
                viewMode={viewMode}
                formatDate={formatDate}
                onItemClick={setSelectedItem}
                onShareClick={(item, e) => {
                  e.stopPropagation();
                  const shareText =  
                  `🥠 오늘의 포춘쿠키!

                  "${item.fortune}"

                  ✨ 내 오늘 운세 한 줄 요약이에요.
                  #오늘의운세 #포춘쿠키 #AI운세 #하루한줄 #자기계발

                  👇 지금 너의 쿠키도 열어봐`;
                  navigator.clipboard.writeText(shareText);
                  setShowCopyModal(true);
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
          onNewFortune={async () => {
            if (!user?.id) {
              showAccessModal('사용자 정보 오류', '사용자 정보를 확인할 수 없습니다.\n\n다시 로그인해 주세요.', '👤');
              return;
            }
            
            console.log('비슷한 고민으로 새 운세 - 접근 권한 체크 시작:', { userId: user.id, isAdmin: user.is_admin });
            
            // 접근 권한 체크 (학교 밴 > 일일 사용 제한 순서)
            const canAccess = await checkAccessPermission(user.id);
            
            if (!canAccess) {
              return; // 이미 모달이 표시됨
            }
            
            // 관리자는 바로 이동 (일일 제한 없음)
            if (user.is_admin) {
              console.log('관리자 - 바로 포춘쿠키 페이지로 이동');
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
              return;
            }
            
            // 일반 사용자는 사전 안내 모달 표시
            showAccessModal(
              '포춘쿠키 이용 안내',
              '하루에 한 번만 사용 가능합니다.\n\n포춘쿠키를 받으시겠어요? 🍪',
              '💡',
              {
                text: '확인',
                onClick: () => {
                  closeAccessModal();
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
                }
              },
              '취소'
            );
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

      {/* 접근 제한 안내 모달 */}
      <AccessModal
        isOpen={accessModal.isOpen}
        onClose={closeAccessModal}
        title={accessModal.title}
        message={accessModal.message}
        icon={accessModal.icon}
        actionButton={accessModal.actionButton}
        cancelButtonText={accessModal.cancelButtonText}
      />

      {/* 복사 완료 모달 */}
      {showCopyModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[998]"
            onClick={() => setShowCopyModal(false)}
          />
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 pointer-events-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">복사 완료!</h3>
                <p className="text-sm text-gray-600 mb-6">
                  클립보드에 복사되었습니다.<br />
                  다른 곳에 붙여넣기하여 운세를 공유해보세요.
                </p>
                <button
                  onClick={() => setShowCopyModal(false)}
                  className="w-full px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
