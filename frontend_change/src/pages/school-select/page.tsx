import { useState, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import schoolsData from '../../data/schools.json';
import { Search, ChevronRight, Check } from 'lucide-react';

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
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    await supabase.from('users').update({ school: selected }).eq('id', user.id);
    // users 테이블에서 school 값이 실제로 반영될 때까지 polling
    let tries = 0;
    let updated = false;
    while (tries < 5 && !updated) {
      const { data: userRow } = await supabase.from('users').select('school').eq('id', user.id).single();
      if (userRow && userRow.school === selected) {
        updated = true;
        break;
      }
      await new Promise(res => setTimeout(res, 300));
      tries++;
    }
    setLoading(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-200 via-orange-200 to-pink-200 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="p-6 text-center border-b border-gray-100">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">학교 선택</h1>
            <p className="text-sm text-gray-500">등록할 학교를 선택하세요</p>
          </div>

          <div className="p-4">
            <div className="bg-gray-100 rounded-xl mb-4 flex items-center px-3 py-2">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="검색"
                className="bg-transparent flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              />
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-4">
              <div className="max-h-80 overflow-y-auto">
                {filteredSchools.map((school: string | any, idx: number) => {
                  // school이 객체면 name 속성, 문자열이면 그대로 사용
                  const schoolName = typeof school === 'string' ? school : school.name;
                  const schoolCategory = typeof school === 'object' ? school.category : '';
                  
                  return (
                    <button
                      key={schoolName}
                      onClick={() => handleSelect(schoolName)}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                        idx !== filteredSchools.length - 1 ? 'border-b border-gray-100' : ''
                      } ${selected === schoolName ? 'bg-blue-50' : 'hover:bg-gray-50 active:bg-gray-100'}`}
                    >
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${selected === schoolName ? 'text-blue-600' : 'text-gray-900'}`}>
                          {schoolName}
                        </div>
                        {schoolCategory && (
                          <div className="text-xs text-gray-500 mt-0.5">{schoolCategory}</div>
                        )}
                      </div>
                      {selected === schoolName ? (
                        <Check className="w-5 h-5 text-blue-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              disabled={!selected || loading}
              onClick={handleSubmit}
              className="w-full bg-blue-500 text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              {loading ? '저장 중...' : '계속'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}