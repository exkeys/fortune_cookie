import { useState, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import schoolsData from '../../data/schools.json';
import { Search, ChevronRight, Check } from 'lucide-react';
import { apiFetch } from '../../utils/apiClient';

interface School {
  id: number;
  name: string;
  category: string;
}

// schools.json이 배열 형태로 변경됨
const schoolsArray = Array.isArray(schoolsData) ? (schoolsData as School[]) : (schoolsData as { schools: School[] }).schools;

export default function SchoolSelectPage() {
  const [search, setSearch] = useState('');
  const [customSchool, setCustomSchool] = useState('');
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 학교 검색 필터링
  const filteredSchools = useMemo(() => {
    if (!search) {
      return schoolsArray;
    }
    
    const searchLower = search.toLowerCase();
    
    const filtered = schoolsArray
      .filter((school: School) =>
        school.name.toLowerCase().includes(searchLower) ||
        (school.category && school.category.toLowerCase().includes(searchLower))
      )
      .sort((a: School, b: School) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // 검색어로 시작하는지 확인
        const aStartsWith = aName.startsWith(searchLower);
        const bStartsWith = bName.startsWith(searchLower);
        
        // 우선순위: 시작하는 것 > 포함된 것
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // 둘 다 시작하거나 둘 다 안 시작하는 경우, 학교 이름으로 정렬
        return aName.localeCompare(bName);
      });
    
    // 커스텀 학교 추가
    if (customSchool && !schoolsArray.some((s: School) => s.name === customSchool)) {
      return [...filtered, customSchool];
    }
    
    return filtered;
  }, [search, customSchool]);

  const handleSelect = (school: string) => {
    setSelected(school);
    setCustomSchool('');
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setLoading(true);
    
    try {
      // Supabase 세션에서 사용자 ID 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      let userId: string | null = null;
      
      if (session?.user?.id) {
        userId = session.user.id;
      } else {
        // 세션이 없으면 프로필 캐시에서 사용자 ID 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
        
        // 프로필 캐시에서도 확인
        if (!userId) {
          const cachedKeys = Object.keys(localStorage).filter(key => key.startsWith('user_profile_cache_'));
          if (cachedKeys.length > 0) {
            try {
              const cachedData = localStorage.getItem(cachedKeys[0]);
              if (cachedData) {
                const cachedProfile = JSON.parse(cachedData);
                userId = cachedProfile.id;
              }
            } catch {
              // 무시
            }
          }
        }
      }
      
      if (!userId) {
        console.error('사용자 ID를 찾을 수 없습니다');
        alert('로그인이 필요합니다. 다시 로그인해주세요.');
        setLoading(false);
        navigate('/');
        return;
      }
      
      // 백엔드 API를 통해 학교 정보 저장 (JWT 토큰 사용)
      const response = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          school: selected
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '서버 오류가 발생했습니다' }));
        console.error('학교 정보 저장 실패:', errorData);
        alert(errorData.error || '학교 정보 저장에 실패했습니다.');
        setLoading(false);
        return;
      }

      await response.json();
      
      // 프로필 캐시 업데이트
      if (userId) {
        const cachedProfileKey = `user_profile_cache_${userId}`;
        const cachedData = localStorage.getItem(cachedProfileKey);
        if (cachedData) {
          try {
            const cachedProfile = JSON.parse(cachedData);
            cachedProfile.school = selected;
            cachedProfile.cachedAt = Date.now();
            localStorage.setItem(cachedProfileKey, JSON.stringify(cachedProfile));
          } catch {
            // 무시
          }
        }
      }
      
      // 홈으로 이동
      navigate('/');
    } catch (error) {
      console.error('학교 저장 중 오류:', error);
      alert('학교 정보 저장 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 via-orange-200 to-pink-200 flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="p-4 sm:p-5 md:p-6 text-center border-b border-gray-100">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-1 sm:mb-2">학교 선택</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-500">등록할 학교를 선택하세요</p>
          </div>

          <div className="p-3 sm:p-4 md:p-5">
            <div className="bg-gray-100 rounded-xl mb-3 sm:mb-4 flex items-center px-2 sm:px-3 py-1.5 sm:py-2">
              <Search className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="검색"
                className="bg-transparent flex-1 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              />
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-3 sm:mb-4">
              <div className="max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto">
                {filteredSchools.map((school: string | any, idx: number) => {
                  // school이 객체면 name 속성, 문자열이면 그대로 사용
                  const schoolName = typeof school === 'string' ? school : school.name;
                  const schoolCategory = typeof school === 'object' ? school.category : '';
                  
                  return (
                    <button
                      key={schoolName}
                      onClick={() => handleSelect(schoolName)}
                      className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between transition-colors ${
                        idx !== filteredSchools.length - 1 ? 'border-b border-gray-100' : ''
                      } ${selected === schoolName ? 'bg-blue-50' : 'hover:bg-gray-50 active:bg-gray-100'}`}
                    >
                      <div className="flex-1">
                        <div className={`text-xs sm:text-sm md:text-base font-medium ${selected === schoolName ? 'text-blue-600' : 'text-gray-900'}`}>
                          {schoolName}
                        </div>
                        {schoolCategory && (
                          <div className="text-xs sm:text-sm text-gray-500 mt-0.5">{schoolCategory}</div>
                        )}
                      </div>
                      {selected === schoolName ? (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              disabled={!selected || loading}
              onClick={handleSubmit}
              className="w-full bg-blue-500 text-white text-xs sm:text-sm md:text-base font-semibold py-2.5 sm:py-3 md:py-3.5 rounded-lg sm:rounded-xl disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              {loading ? '저장 중...' : '계속'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}