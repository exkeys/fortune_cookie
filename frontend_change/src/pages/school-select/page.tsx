import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/base/Card';
import Button from '../../components/base/Button';

const SCHOOL_LIST = [
  '서울대학교', '연세대학교', '고려대학교', '부산대학교', '동아대학교', '성균관대학교', '한양대학교', '경희대학교', '중앙대학교', '기타'
];

export default function SchoolSelectPage() {
  const [search, setSearch] = useState('');
  const [customSchool, setCustomSchool] = useState('');
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const filteredSchools = SCHOOL_LIST.filter(s => s.includes(search)).concat(
    customSchool && !SCHOOL_LIST.includes(customSchool) ? [customSchool] : []
  );

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
          {filteredSchools.map(school => (
            <button
              key={school}
              className={`block w-full text-left px-4 py-2 rounded-lg mb-1 ${selected === school ? 'bg-amber-200 font-bold' : 'hover:bg-amber-50'}`}
              onClick={() => handleSelect(school)}
            >
              {school}
            </button>
          ))}
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
