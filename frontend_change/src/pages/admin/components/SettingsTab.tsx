import React, { useState, useEffect, useMemo, useRef } from 'react';
import schoolsData from '../../../data/schools.json';
import { Calendar, Search, Edit2, Trash2, Building2, Info, ChevronLeft, ChevronRight } from 'lucide-react';

interface School {
  id: number;
  name: string;
  category: string;
}

interface SchoolPeriod {
  id?: string;
  school_name: string;
  start_date: string;
  end_date: string;
  created_at?: string;
  updated_at?: string;
}

// Apple Style Calendar Component
const AppleCalendar: React.FC<{
  value: string;
  onChange: (date: string) => void;
  label: string;
  openTrigger?: boolean;
}> = ({ value, onChange, label, openTrigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const prevOpenTriggerRef = React.useRef(false);
  
  // 외부에서 달력을 열기 위한 effect
  useEffect(() => {
    if (openTrigger && !prevOpenTriggerRef.current) {
      setIsOpen(true);
    }
    if (openTrigger !== undefined) {
      prevOpenTriggerRef.current = openTrigger;
    }
  }, [openTrigger]);
  
  const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (date: Date | null) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
      setIsOpen(false);
    }
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date | null) => {
    if (!date || !value) return false;
    const selectedDate = new Date(value);
    return date.toDateString() === selectedDate.toDateString();
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="relative">
      <label className="text-sm font-medium text-gray-700 mb-2 block">{label}</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-gray-900 cursor-pointer hover:bg-gray-100 transition-all flex items-center justify-between"
      >
        <span className="text-gray-900">
          {value ? formatDate(value) : '날짜를 선택하세요'}
        </span>
        <Calendar className="w-5 h-5 text-gray-900" />
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-80">
            <div className="flex items-center justify-between mb-6">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h3 className="text-lg font-semibold text-gray-900">
                {currentMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
              </h3>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day, idx) => (
                <div
                  key={day}
                  className={`text-center text-xs font-semibold py-2 ${
                    idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-600'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((date, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDateSelect(date)}
                  disabled={!date}
                  className={`
                    aspect-square rounded-lg text-sm font-medium transition-all
                    ${!date ? 'invisible' : ''}
                    ${isSelected(date) 
                      ? 'bg-blue-500 text-white shadow-lg scale-105' 
                      : isToday(date)
                      ? 'bg-blue-50 text-blue-600 font-bold'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                    ${idx % 7 === 0 && date ? 'text-red-500' : ''}
                    ${idx % 7 === 6 && date ? 'text-blue-500' : ''}
                  `}
                >
                  {date ? date.getDate() : ''}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = String(today.getMonth() + 1).padStart(2, '0');
                  const day = String(today.getDate()).padStart(2, '0');
                  onChange(`${year}-${month}-${day}`);
                  setIsOpen(false);
                }}
                className="text-sm text-blue-500 hover:text-blue-600 font-medium"
              >
                오늘
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-600 font-medium"
              >
                닫기
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const schoolsArray = Array.isArray(schoolsData) ? (schoolsData as School[]) : (schoolsData as { schools: School[] }).schools;

const SettingsTab: React.FC = () => {
  const [schoolPeriods, setSchoolPeriods] = useState<SchoolPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SchoolPeriod>({
    school_name: '',
    start_date: '',
    end_date: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [openEndCalendar, setOpenEndCalendar] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const filteredSchools = useMemo(() => {
    if (!searchTerm) {
      return schoolsArray;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    
    const filtered = schoolsArray
      .filter((school: School) =>
        (school.name || '').toLowerCase().includes(searchLower) ||
        (school.category && school.category.toLowerCase().includes(searchLower))
      )
      .sort((a: School, b: School) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        
        // 검색어로 시작하는지 확인
        const aStartsWith = aName.startsWith(searchLower);
        const bStartsWith = bName.startsWith(searchLower);
        
        // 우선순위: 시작하는 것 > 포함된 것
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // 둘 다 시작하거나 둘 다 안 시작하는 경우, 학교 이름으로 정렬
        return aName.localeCompare(bName);
      });
    
    return filtered;
  }, [searchTerm]);

  const fetchSchoolPeriods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/school-periods');
      
      if (response.ok) {
        const data = await response.json();
        setSchoolPeriods(data.schoolPeriods || []);
        setCurrentPage(1); // 페이지를 첫 페이지로 리셋
      } else {
        const errorText = await response.text();
        console.error('API 에러 응답:', errorText);
      }
    } catch (error) {
      console.error('학교 기간 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.school_name || !formData.start_date || !formData.end_date) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      alert('종료 날짜는 시작 날짜보다 늦어야 합니다.');
      return;
    }

    try {
      setLoading(true);
      const url = editingId ? `/api/school-periods/${editingId}` : '/api/school-periods';
      const method = editingId ? 'PUT' : 'POST';
      
      const payload = {
        schoolName: formData.school_name,
        startDate: formData.start_date,
        endDate: formData.end_date
      };
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(editingId ? '수정되었습니다.' : '추가되었습니다.');
        setFormData({ school_name: '', start_date: '', end_date: '' });
        setEditingId(null);
        setSearchTerm('');
        fetchSchoolPeriods();
      } else {
        const errorData = await response.json();
        alert(errorData.error || '처리 실패');
      }
    } catch (error) {
      console.error('처리 실패:', error);
      alert('처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/school-periods/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('삭제되었습니다.');
        fetchSchoolPeriods();
      } else {
        alert('삭제 실패');
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (period: SchoolPeriod) => {
    setFormData({
      school_name: period.school_name,
      start_date: period.start_date,
      end_date: period.end_date
    });
    setEditingId(period.id || null);
    setSearchTerm(period.school_name);
    
    // 폼으로 스크롤
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSchoolSelect = (schoolName: string) => {
    setFormData({ ...formData, school_name: schoolName });
    setSearchTerm(schoolName);
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(schoolPeriods.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPeriods = schoolPeriods.slice(startIndex, endIndex);

  useEffect(() => {
    fetchSchoolPeriods();
  }, []);

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">학교 이용 기간</h1>
        <p className="text-gray-500 mt-2">서비스 이용 가능 기간을 설정합니다</p>
      </div>

        {/* Add New Card */}
        <div ref={formRef} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingId ? '기간 수정' : '새로운 기간 추가'}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* School Search */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">학교 *</label>
              <div className="bg-gray-100 rounded-xl mb-2 flex items-center px-3 py-2">
                <Search className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (formData.school_name !== e.target.value) {
                      setFormData({ ...formData, school_name: '' });
                    }
                  }}
                  placeholder="학교명을 검색하세요"
                  className="bg-transparent flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                />
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                {filteredSchools.length > 0 ? (
                  filteredSchools.map((school: School, idx: number) => (
                    <button
                      key={school.id}
                      type="button"
                      onClick={() => handleSchoolSelect(school.name)}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                        idx !== filteredSchools.length - 1 ? 'border-b border-gray-100' : ''
                      } ${
                        formData.school_name === school.name
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${
                          formData.school_name === school.name ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {school.name}
                        </div>
                        {school.category && (
                          <div className="text-xs text-gray-500 mt-0.5">{school.category}</div>
                        )}
                      </div>
                      {formData.school_name === school.name ? (
                        <div className="w-5 h-5 text-blue-600 text-lg">✓</div>
                      ) : (
                        <div className="w-5 h-5 text-gray-300 text-lg">›</div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-center">
                    검색 결과가 없습니다
                  </div>
                )}
              </div>
            </div>

            {/* Date Range with Custom Calendar */}
            <div className="grid grid-cols-2 gap-4">
              <AppleCalendar
                label="시작일 *"
                value={formData.start_date}
                onChange={(date) => {
                  setFormData({ ...formData, start_date: date });
                  // 시작일 선택 후 종료일 달력 자동으로 열기
                  setOpenEndCalendar(true);
                }}
              />
              <AppleCalendar
                label="종료일 *"
                value={formData.end_date}
                onChange={(date) => {
                  setFormData({ ...formData, end_date: date });
                  setOpenEndCalendar(false); // 종료일 선택 후 트리거 리셋
                }}
                openTrigger={openEndCalendar}
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading || !formData.school_name}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-colors shadow-sm hover:shadow-md"
              >
                {loading ? '처리중...' : editingId ? '수정하기' : '추가하기'}
              </button>
              
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ school_name: '', start_date: '', end_date: '' });
                    setSearchTerm('');
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-colors"
                >
                  취소
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">설정된 기간</h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : schoolPeriods.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">설정된 학교 기간이 없습니다.</div>
            </div>
          ) : (
            currentPeriods.map((period, idx) => (
              <div key={period.id} className={`p-6 ${idx !== currentPeriods.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition-colors`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-semibold text-gray-900">{period.school_name}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDateDisplay(period.start_date)}</span>
                      <span>~</span>
                      <span>{formatDateDisplay(period.end_date)}</span>
                    </div>
                    {period.created_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        생성: {new Date(period.created_at).toLocaleString('ko-KR')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(period)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(period.id!)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 페이지네이션 */}
        {schoolPeriods.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              이전
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              다음
            </button>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-4 bg-blue-50 rounded-2xl p-6">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 space-y-1">
              <p>• <strong>밴된 사용자</strong>는 학교 날짜 설정과 관계없이 서비스 이용 불가</p>
              <p>• 사용자는 <strong>자신의 학교가 설정된 날짜에만</strong> 서비스 이용 가능</p>
              <p>• 일일 사용 제한은 <strong>학교별로</strong> 적용됩니다</p>
              <p>• 날짜 범위를 벗어난 경우 자동으로 서비스 이용이 차단됩니다</p>
            </div>
          </div>
        </div>
    </div>
  );
};

export default SettingsTab;
