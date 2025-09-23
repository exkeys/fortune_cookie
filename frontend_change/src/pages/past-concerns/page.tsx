
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Supabase에서 실제 기록 로드
  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      
      if (!uid) { 
        setHistory([]); 
        setIsLoading(false); 
        return; 
      }
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
  
  // 페이지네이션 계산
  const totalPages = Math.ceil(history.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = history.slice(startIndex, endIndex);
  
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
      localStorage.setItem('fortuneHistory', JSON.stringify(updatedHistory));
      setSelectedItem(null);
      
      // 현재 페이지에 아이템이 없으면 이전 페이지로
      const newTotalPages = Math.ceil(updatedHistory.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (error) {
      console.error('삭제 중 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };
  
  const handleClearAll = async () => {
    if (confirm('모든 기록을 삭제하시겠습니까?')) {
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
        localStorage.removeItem('fortuneHistory');
        setSelectedItem(null);
        setCurrentPage(1);
      } catch (error) {
        console.error('전체 삭제 중 오류:', error);
        alert('전체 삭제 중 오류가 발생했습니다.');
      }
    }
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedItem(null); // 페이지 변경시 선택 해제
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-200 to-orange-200">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-400 border-t-transparent mx-auto mb-4"></div>
            <p className="text-amber-600">기록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 to-orange-200">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-full">
        {/* 페이지 헤더 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 space-y-6 md:space-y-0">
          <div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-800 mb-6">과거 운세 기록</h1>
            <p className="text-xl md:text-2xl lg:text-3xl xl:text-4xl text-gray-600">지금까지 받은 운세들을 다시 확인해보세요</p>
          </div>
          
          {history.length > 0 && (
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handleClearAll}
                className="text-lg md:text-xl px-6 py-3 md:px-8 md:py-4"
              >
                전체 삭제
              </Button>
              <Button
                size="lg"
                onClick={() => navigate('/role-select')}
                className="text-lg md:text-xl px-6 py-3 md:px-8 md:py-4"
              >
                새 운세 보기
              </Button>
            </div>
          )}
        </div>
        
        {history.length === 0 ? (
          /* 빈 상태 */
          <Card className="p-16 md:p-20 text-center">
            <div className="text-8xl md:text-9xl lg:text-[10rem] mb-8">🥠</div>
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-4">아직 운세 기록이 없어요</h3>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 mb-8">첫 번째 운세를 받아보시겠어요?</p>
            <Button 
              onClick={() => navigate('/role-select')}
              size="lg"
              className="text-xl md:text-2xl px-8 py-4 md:px-12 md:py-6"
            >
              운세 받기 시작하기
            </Button>
          </Card>
        ) : (
          /* 기록 목록 */
          <div className={`transition-all duration-500 ${selectedItem ? 'grid lg:grid-cols-3 xl:grid-cols-2 gap-8 lg:gap-12' : 'flex justify-center'}`}>
            {/* 목록 */}
            <div className={`space-y-6 transition-all duration-500 ${selectedItem ? 'lg:col-span-2 xl:col-span-1' : 'max-w-4xl w-full'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-3 md:space-y-0">
                <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-800">
                  기록 목록 ({history.length}개)
                </h2>
                
                {totalPages > 1 && (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                    >
                      <i className="ri-arrow-left-s-line text-xl md:text-2xl lg:text-3xl"></i>
                    </button>
                    
                    <span className="text-lg md:text-xl lg:text-2xl xl:text-3xl text-gray-600 px-4">
                      {currentPage} / {totalPages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-white text-gray-400 hover:text-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                    >
                      <i className="ri-arrow-right-s-line text-xl md:text-2xl lg:text-3xl"></i>
                    </button>
                  </div>
                )}
              </div>
              
              {currentItems.map((item) => (
                <Card
                  key={item.id}
                  hover
                  className={`p-8 md:p-10 lg:p-12 cursor-pointer transition-all duration-300 ${
                    selectedItem?.id === item.id ? 'ring-2 ring-amber-300 shadow-lg' : ''
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex items-start space-x-5 md:space-x-6 lg:space-x-8">
                    {item.role && (
                      <div className={`w-16 h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 xl:w-24 xl:h-24 rounded-full bg-gradient-to-r ${item.role.color} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                        <i className={`${item.role.icon} text-xl md:text-2xl lg:text-3xl xl:text-4xl`}></i>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-medium text-gray-800">
                          {item.role?.name || '일반 상담'}
                        </h3>
                        <span className="text-base md:text-lg lg:text-xl xl:text-2xl text-gray-500 flex-shrink-0 ml-4">
                          {formatDate(item.date)}
                        </span>
                      </div>
                      
                      <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl text-gray-600 line-clamp-2 mb-4">
                        {item.concern || '상담 내용'}
                      </p>
                      
                      <p className="text-base md:text-lg lg:text-xl xl:text-2xl text-amber-600 line-clamp-1">
                        "{item.fortune}"
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
              
              {/* 페이지네이션 하단 */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-12">
                  <div className="flex items-center space-x-4">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-14 h-14 md:w-16 md:h-16 lg:w-18 lg:h-18 xl:w-20 xl:h-20 flex items-center justify-center rounded-full text-lg md:text-xl lg:text-2xl xl:text-3xl font-medium transition-all duration-300 ${
                          currentPage === page
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-amber-100 hover:text-amber-600'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* 상세 내용 */}
            {selectedItem && (
              <div className="sticky top-8 lg:col-span-1 xl:col-span-1 animate-fade-in">
                <Card className="p-10 md:p-12 lg:p-14">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center space-x-5">
                      {selectedItem.role && (
                        <div className={`w-18 h-18 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 rounded-full bg-gradient-to-r ${selectedItem.role.color} flex items-center justify-center text-white shadow-lg`}>
                          <i className={`${selectedItem.role.icon} text-2xl md:text-3xl lg:text-4xl xl:text-5xl`}></i>
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-800">
                          {selectedItem.role?.name || '일반 상담'}
                        </h3>
                        <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl text-gray-600">
                          {formatDate(selectedItem.date)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeleteItem(selectedItem.id)}
                        className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors duration-300"
                        title="삭제"
                      >
                        <i className="ri-delete-bin-line text-xl md:text-2xl lg:text-3xl"></i>
                      </button>
                      <button
                        onClick={() => setSelectedItem(null)}
                        className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors duration-300"
                        title="닫기"
                      >
                        <i className="ri-close-line text-xl md:text-2xl lg:text-3xl"></i>
                      </button>
                    </div>
                  </div>
                  
                  {selectedItem.concern && (
                    <div className="mb-10">
                      <h4 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-medium text-gray-800 mb-6">고민 내용</h4>
                      <div className="bg-gray-50 p-8 md:p-10 lg:p-12 rounded-lg">
                        <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl text-gray-700 leading-relaxed">
                          {selectedItem.concern}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-medium text-gray-800 mb-6">받은 조언</h4>
                    <div className="bg-gradient-to-br from-amber-200 to-orange-200 p-8 md:p-10 lg:p-12 rounded-lg border border-amber-100">
                      <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl text-gray-800 leading-relaxed font-medium">
                        "{selectedItem.fortune}"
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-10 pt-8 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="lg"
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
                      className="w-full text-xl md:text-2xl lg:text-3xl px-8 py-6"
                    >
                      비슷한 고민으로 새 운세 받기
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
