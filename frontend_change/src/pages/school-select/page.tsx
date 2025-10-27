import { useState, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';
import schoolsData from '../../data/schools.json';

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
    const filtered = schoolsArray.filter((school: School) =>
      school.name.toLowerCase().includes(search.toLowerCase()) ||
      (school.category && school.category.toLowerCase().includes(search.toLowerCase()))
    );
    
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
      <Card className="max-w-lg w-full p-8 text-center">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">학교를 선택해 주세요</h2>
        <input
          type="text"
          className="w-full border rounded-lg px-4 py-2 mb-4 focus:ring-amber-400 focus:outline-none"
          placeholder="학교명 검색 또는 직접 입력"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input
          type="text"
          className="w-full border rounded-lg px-4 py-2 mb-4 focus:ring-amber-400 focus:outline-none"
          placeholder="직접 입력 (선택)"
          value={customSchool}
          onChange={e => {
            setCustomSchool(e.target.value);
            setSelected(e.target.value);
          }}
        />
        <div className="max-h-48 overflow-y-auto mb-4">
          {filteredSchools.map((school: string | any) => {
            // school이 객체면 name 속성, 문자열이면 그대로 사용
            const schoolName = typeof school === 'string' ? school : school.name;
            const schoolCategory = typeof school === 'object' ? school.category : '';
            
            return (
              <button
                key={schoolName}
                className={`block w-full text-left px-4 py-2 rounded-lg mb-1 ${selected === schoolName ? 'bg-amber-200 font-bold' : 'hover:bg-amber-50'}`}
                onClick={() => handleSelect(schoolName)}
              >
                <div className="font-medium">{schoolName}</div>
                {schoolCategory && (
                  <div className="text-sm text-gray-500">{schoolCategory}</div>
                )}
              </button>
            );
          })}
        </div>
        <Button
          size="lg"
          className="w-full mt-4"
          onClick={handleSubmit}
          disabled={!selected || loading}
        >
          {loading ? '저장 중...' : '저장하고 시작하기'}
        </Button>
      </Card>
    </div>
  );
}
