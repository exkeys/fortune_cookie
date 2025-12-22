import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/feature/Header';
import { useAuth } from '../../hooks/useAuth';
import { useAccessControl } from '../../hooks/useAccessControl';
import { useConcerns, useDeleteConcern } from '../../hooks/useConcerns';
import { apiFetch } from '../../utils/apiClient';
import { logger } from '../../utils/logger';
import AccessModal from '../../components/feature/AccessModal';
import CopySuccessModal from '../../components/base/CopySuccessModal';
import PageHeader from './components/PageHeader';
import LoadingState from './components/LoadingState';
import EmptyState from './components/EmptyState';
import StatisticsCards from './components/StatisticsCards';
import FilterAndSearchBar from './components/FilterAndSearchBar';
import PastConcernGrid from './components/PastConcernGrid';
import DetailModal from './components/DetailModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import Pagination from './components/Pagination';


interface HistoryItem {
  id: string;
  date: string; // 표시용 날짜 (updated_at || created_at)
  created_at: string;
  updated_at?: string | null;
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

// 역할 데이터 (role-select 페이지와 동일 - 학생만 유지)
const roles = [
  {
    id: 'student',
    name: '학생',
    icon: 'ri-book-line',
    description: '학업과 진로 상담',
    color: 'from-indigo-400 to-indigo-600'
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
    icon: 'ri-user-3-line',
    description: `${persona} 관련 조언`,
    color: 'from-indigo-400 to-indigo-600'
  };
};

export default function PastConcernsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  
  // 로그인되지 않은 사용자는 자동으로 홈으로 리다이렉트 (Route Guard)
  useEffect(() => {
    if (!authLoading && !user?.id) {
      navigate('/', { replace: true });
    }
  }, [authLoading, user?.id, navigate]);
  
  // React Query로 고민 목록 관리 (인증 완료 후에만 활성화)
  const { data: concernsData = [], isLoading: concernsLoading, refetch: refetchConcerns } = useConcerns(
    user?.id, 
    !authLoading && !!user?.id
  );
  const deleteConcernMutation = useDeleteConcern();
  
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [accessModal, setAccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionButton?: {
      text: string;
      onClick: () => void;
    };
    cancelButtonText?: string;
    variant?: 'default' | 'dailyLimit'; // 모달 스타일 변형: dailyLimit은 일일 사용 제한 카운트다운 모달
    nextAvailableAt?: string | null; // 다음 이용 가능 시간 (ISO string, used_at 기준)
  }>({
    isOpen: false,
    title: '',
    message: ''
  });
  const itemsPerPage = 9;
  
  // concernsData를 history 형식으로 변환
  const history = useMemo(() => {
    return concernsData.map((concern) => ({
      id: concern.id,
      date: concern.created_at,
      created_at: concern.created_at,
      updated_at: null,
      role: getRoleFromPersona(concern.persona),
      concern: concern.concern,
      fortune: concern.ai_response,
      aiFeed: concern.ai_feed
    }));
  }, [concernsData]);
  
  // 로딩 상태: 인증 로딩 또는 데이터 로딩 중
  const isLoading = authLoading || concernsLoading;
  
  // 모달 헬퍼 함수들
  const showAccessModal = useCallback((title: string, message: string, actionButton?: { text: string; onClick: () => void }, cancelButtonText?: string, variant?: 'default' | 'dailyLimit', nextAvailableAt?: string | null) => {
    setAccessModal({
      isOpen: true,
      title,
      message,
      actionButton,
      cancelButtonText,
      variant,
      nextAvailableAt
    });
  }, []);

  const closeAccessModal = useCallback(() => {
    setAccessModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // 전역 접근 권한 체크 훅 사용
  const { checkAccessPermission } = useAccessControl({
    userId: user?.id,
    navigate,
    onShowModal: (config) => {
      showAccessModal(
        config.title,
        config.message,
        config.actionButton,
        config.cancelButtonText,
        config.variant,
        config.nextAvailableAt
      );
    },
    onCloseModal: closeAccessModal
  });
  

  // URL의 refresh 파라미터 감지하여 데이터 새로고침
  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    if (refreshParam && user?.id) {
      // refresh 파라미터가 있으면 즉시 데이터 새로고침
      refetchConcerns();
      // refresh 파라미터 제거 (중복 새로고침 방지)
      searchParams.delete('refresh');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, user?.id, refetchConcerns, setSearchParams]);

  // 저장 후 운세보관함으로 온 경우 히스토리 조작 (포춘 쿠키 페이지 제거하고 INTRO를 이전 페이지로 설정)
  useEffect(() => {
    const fromFortune = sessionStorage.getItem('pastConcernsFromFortune') === 'true';
    
    if (fromFortune) {
      try {
        // 1. 먼저 INTRO 페이지를 히스토리에 추가 (pushState)
        window.history.pushState({ pastConcernsFromFortune: true, introPage: true }, '', '/');
        
        // 2. 그 다음 현재 운세보관함 페이지로 교체 (replaceState)
        // 이렇게 하면 히스토리 스택이 [..., INTRO, 운세보관함]이 되어서 뒤로 가기를 누르면 INTRO로 이동
        const currentUrl = window.location.pathname + window.location.search + window.location.hash;
        window.history.replaceState({ pastConcernsFromFortune: true }, '', currentUrl);
      } catch {}
    }
  }, []);

  // 모바일에서 뒤로 가기 버튼 처리 (저장 후 운세보관함으로 온 경우 INTRO로 이동)
  useEffect(() => {
    // 모바일 기기 감지
    const isLikelyMobileDevice = () => {
      if (typeof window === 'undefined') return false;
      try {
        const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
        const hasTouchPoints = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        const isTouchUA = /Android|iPhone|iPad|iPod|Samsung/i.test(ua);
        return hasCoarsePointer || hasTouchPoints || isTouchUA;
      } catch {
        return false;
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      // 저장 후 운세보관함으로 온 경우에만 처리
      const fromFortune = sessionStorage.getItem('pastConcernsFromFortune') === 'true';
      
      if (fromFortune) {
        const isMobileBack = event.isTrusted && isLikelyMobileDevice();
        
        if (isMobileBack) {
          event.preventDefault?.();
          try {
            sessionStorage.removeItem('pastConcernsFromFortune');
            sessionStorage.setItem('intro_exit_override', 'true');
          } catch {}
          navigate('/', { replace: true });
          return;
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  // 마우스 뒤로가기(XButton1) / 앞으로가기(XButton2) 차단
  useEffect(() => {
    const isBrowserSideButton = (ev: PointerEvent | MouseEvent) => {
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

  // 필터링 및 검색된 데이터 (메모이제이션)
  const filteredHistory = useMemo(() => {
    return history
      .filter(item => {
        const matchesSearch = searchTerm === '' || 
          item.concern?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.fortune.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.role?.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesRole = filterRole === 'all' || item.role?.id === filterRole;
        
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        // updated_at 우선, 없으면 created_at 기준으로 정렬
        const dateA = new Date(a.updated_at || a.created_at).getTime();
        const dateB = new Date(b.updated_at || b.created_at).getTime();
        return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [history, searchTerm, filterRole, sortBy]);

  // 페이지네이션 계산 (메모이제이션)
  const { totalPages, startIndex, currentItems } = useMemo(() => {
    const total = Math.ceil(filteredHistory.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const items = filteredHistory.slice(start, start + itemsPerPage);
    return { totalPages: total, startIndex: start, currentItems: items };
  }, [filteredHistory, currentPage, itemsPerPage]);
  
  const formatDate = useCallback((dateString: string) => {
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
  }, []);
  
  const handleDeleteItem = useCallback(async (id: string) => {
    try {
      // React Query Mutation으로 삭제
      await deleteConcernMutation.mutateAsync(id);
      
      // 모달 닫기
      setSelectedItem(null);
      setShowDeleteConfirm(null);
      
      // 현재 페이지에 아이템이 없으면 이전 페이지로
      const updatedHistory = history.filter(item => item.id !== id);
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
      alert('삭제 중 오류가 발생했습니다.');
    }
  }, [deleteConcernMutation, history, searchTerm, filterRole, currentPage, itemsPerPage]);
  
  const handleClearAll = useCallback(async () => {
    if (!user?.id) {
      alert('로그인이 필요합니다. 다시 로그인해주세요.');
      return;
    }
    
    try {
      
      // 현재 사용자의 모든 기록을 백엔드 API로 삭제
      // 백엔드에서 userId로 모든 기록을 삭제하는 엔드포인트가 없으므로
      // 각 항목을 개별적으로 삭제
      const deletePromises = history.map(item => 
        apiFetch(`/api/concerns/${item.id}`, { method: 'DELETE' })
          .then(res => res.ok)
          .catch(() => false)
      );
      
      const results = await Promise.all(deletePromises);
      const successCount = results.filter(Boolean).length;
      
      if (successCount === 0 && history.length > 0) {
        alert('전체 삭제에 실패했습니다. 다시 시도해주세요.');
        return;
      }
      
      // 데이터 재조회 및 상태 초기화
      await refetchConcerns();
      setSelectedItem(null);
      setCurrentPage(1);
      setSearchTerm('');
      setFilterRole('all');
      setShowDeleteConfirm(null);
    } catch (error: unknown) {
      logger.error('전체 삭제 실패:', error);
      alert('전체 삭제 중 오류가 발생했습니다.');
    }
  }, [user, history, refetchConcerns]);
  
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setSelectedItem(null);
  }, []);

  const handleItemClick = useCallback((item: HistoryItem) => {
    setSelectedItem(item);
  }, []);

  const handleShareClick = useCallback((item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `🥠 오늘의 포춘쿠키!

"${item.fortune}"

✨ 내 오늘 운세 한 줄 요약이에요.
#오늘의운세 #포춘쿠키 #AI운세 #하루한줄 #자기계발

👇 지금 너의 쿠키도 열어봐`;
    navigator.clipboard.writeText(shareText);
    setShowCopyModal(true);
  }, []);

  const handleDeleteClick = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(id);
  }, []);

  // 고유 역할 목록 추출 (메모이제이션)
  const uniqueRoles = useMemo(() => {
    return Array.from(new Set(history.map(item => item.role?.id).filter(Boolean)))
      .map(roleId => history.find(item => item.role?.id === roleId)?.role)
      .filter(Boolean) as Role[];
  }, [history]);

  // 통계 계산 (메모이제이션)
  const statistics = useMemo(() => {
    const recentWeekCount = history.filter(item => {
      const date = new Date(item.date);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return date > weekAgo;
    }).length;
    
    const weeklyAverage = Math.ceil(history.length / 7);
    
    return {
      totalCount: history.length,
      uniqueRolesCount: uniqueRoles.length,
      recentWeekCount,
      weeklyAverage
    };
  }, [history, uniqueRoles.length]);
  
  // 로딩 중이거나 로그인되지 않은 사용자는 리다이렉트되므로 여기서는 처리 불필요
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <Header />
        <LoadingState />
      </div>
    );
  }

  // 로그인되지 않은 사용자는 이미 리다이렉트되었으므로 여기서는 처리 불필요
  if (!user?.id) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <Header />
      
      {/* 65% 본문 영역 with 17.5% 양쪽 여백 */}
      <div className="w-full">
        <div className="w-[90%] md:w-[80%] lg:w-[70%] xl:w-[65%] mx-auto py-4">
          {/* 페이지 헤더 */}
          {history.length > 0 && (
            <PageHeader totalCount={history.length} />
          )}

          {/* 통계 카드 */}
          {history.length > 0 && (
            <StatisticsCards
              totalCount={statistics.totalCount}
              uniqueRolesCount={statistics.uniqueRolesCount}
              recentWeekCount={statistics.recentWeekCount}
              weeklyAverage={statistics.weeklyAverage}
            />
          )}

          {/* 액션 바 */}
          {history.length > 0 && (
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
                if (!user?.id) {
                  showAccessModal('사용자 정보 오류', '');
                  return;
                }
                
                // 접근 권한 체크 (학교 밴 > 일일 사용 제한 순서)
                const canAccess = await checkAccessPermission();
                
                if (!canAccess) {
                  return; // 이미 모달이 표시됨
                }
                
                // 관리자는 바로 이동 (일일 제한 없음)
                if (user.is_admin) {
                  navigate('/role-select');
                  return;
                }
                
                // 일반 사용자는 사전 안내 모달 표시
                showAccessModal(
                  '포춘쿠키 이용 안내',
                  '', // AccessModal에서 하드코딩된 메시지 사용
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
        
        {filteredHistory.length === 0 ? (
          /* 빈 상태 */
          <EmptyState
            isLoggedIn={true}
            hasNoRecords={history.length === 0}
            onNavigateHome={async () => {
              if (!user?.id) {
                return;
              }
              
              // 접근 권한 체크 (학교 밴 > 일일 사용 제한 순서)
              const canAccess = await checkAccessPermission();
              
              if (!canAccess) {
                return; // 이미 모달이 표시됨
              }
              
              // 관리자는 바로 이동 (일일 제한 없음)
              if (user.is_admin) {
                navigate('/role-select');
                return;
              }
              
              // 일반 사용자는 사전 안내 모달 표시
              showAccessModal(
                '포춘쿠키 이용 안내',
                '', // AccessModal에서 하드코딩된 메시지 사용
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
                onItemClick={handleItemClick}
                onShareClick={handleShareClick}
                onDeleteClick={handleDeleteClick}
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
              showAccessModal('사용자 정보 오류', '');
              return;
            }
            
            // 접근 권한 체크 (학교 밴 > 일일 사용 제한 순서)
            const canAccess = await checkAccessPermission();
            
            if (!canAccess) {
              return; // 이미 모달이 표시됨
            }
            
            // 관리자는 바로 이동 (일일 제한 없음)
            if (user.is_admin) {
              if (selectedItem?.role && selectedItem?.concern) {
                // 기존 역할과 고민 정보를 그대로 가져가서 포춘 쿠키 페이지로 이동
                // updateId도 전달하여 업데이트 모드로 동작
                navigate('/fortune-cookie', {
                  state: {
                    selectedRole: selectedItem.role,
                    concern: selectedItem.concern,
                    updateId: selectedItem.id // 기존 레코드 ID 전달
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
              '', // AccessModal에서 하드코딩된 메시지 사용
              {
                text: '확인',
                onClick: () => {
                  closeAccessModal();
                  if (selectedItem?.role && selectedItem?.concern) {
                    // 기존 역할과 고민 정보를 그대로 가져가서 포춘 쿠키 페이지로 이동
                    // updateId도 전달하여 업데이트 모드로 동작
                    navigate('/fortune-cookie', {
                      state: {
                        selectedRole: selectedItem.role,
                        concern: selectedItem.concern,
                        updateId: selectedItem.id // 기존 레코드 ID 전달
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
        actionButton={accessModal.actionButton}
        cancelButtonText={accessModal.cancelButtonText}
        variant={accessModal.variant}
        nextAvailableAt={accessModal.nextAvailableAt}
      />

      {/* 복사 완료 모달 */}
      <CopySuccessModal 
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
      />
    </div>
  );
}
