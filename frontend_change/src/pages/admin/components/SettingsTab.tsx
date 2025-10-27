import React, { useState, useEffect, useMemo } from 'react';
import Card from '../../../components/base/Card';
import Button from '../../../components/base/Button';
import schoolsData from '../../../data/schools.json';

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

// schools.json이 배열 형태로 변경됨
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 학교 검색 필터링
  const filteredSchools = useMemo(() => {
    return schoolsArray.filter((school: School) => {
      const schoolName = (school.name || '').toLowerCase();
      const schoolCategory = (school.category || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase().trim();
      
      // 공백 제거된 학교명에서 검색
      const schoolNameNoSpace = schoolName.replace(/\s+/g, '');
      const searchNoSpace = searchLower.replace(/\s+/g, '');
      
      // 원본 검색 및 공백 제거 검색 모두 시도
      const matches = 
        schoolName.includes(searchLower) || 
        schoolCategory.includes(searchLower) ||
        schoolNameNoSpace.includes(searchNoSpace);
      
      return matches;
    });
  }, [searchTerm]);

  // 학교 기간 목록 조회
  const fetchSchoolPeriods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/school-periods');
      
      if (response.ok) {
        const data = await response.json();
        setSchoolPeriods(data.schoolPeriods || []);
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

  // 학교 기간 추가/수정
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

  // 학교 기간 삭제
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

  // 수정 모드 시작
  const handleEdit = (period: SchoolPeriod) => {
    setFormData({
      school_name: period.school_name,
      start_date: period.start_date,
      end_date: period.end_date
    });
    setEditingId(period.id || null);
    setSearchTerm(period.school_name);
  };

  // 학교 선택
  const handleSchoolSelect = (schoolName: string) => {
    setFormData({ ...formData, school_name: schoolName });
    setSearchTerm(schoolName);
    setShowDropdown(false);
  };

  useEffect(() => {
    fetchSchoolPeriods();
  }, []);

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">학교 이용 기간 설정</h2>
        
        {/* 학교 기간 추가/수정 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 학교 검색 */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                학교명 *
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                  if (formData.school_name !== e.target.value) {
                    setFormData({ ...formData, school_name: '' });
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="학교명을 검색하세요..."
              />
              
              {/* 학교 드롭다운 */}
              {showDropdown && searchTerm && (
                <>
                  <div 
                    className="fixed inset-0 z-5"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredSchools.length > 0 ? (
                      filteredSchools.map((school: School) => (
                        <button
                          key={school.id}
                          type="button"
                          onClick={() => handleSchoolSelect(school.name)}
                          className="w-full px-3 py-2 text-left hover:bg-amber-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">{school.name}</div>
                          <div className="text-sm text-gray-500">{school.category || ''}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-center">
                        검색 결과가 없습니다.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* 시작 날짜 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작 날짜 *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* 종료 날짜 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료 날짜 *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={loading || !formData.school_name}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {loading ? '처리중...' : editingId ? '수정' : '추가'}
            </Button>
            
            {editingId && (
              <Button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ school_name: '', start_date: '', end_date: '' });
                  setSearchTerm('');
                }}
                variant="outline"
              >
                취소
              </Button>
            )}
          </div>
        </form>

        {/* 기간 목록 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">설정된 학교 기간</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : schoolPeriods.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">설정된 학교 기간이 없습니다.</div>
            </div>
          ) : (
            <div className="grid gap-4">
              {schoolPeriods.map((period) => (
                <div key={period.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{period.school_name}</h4>
                      <p className="text-sm text-gray-600">
                        {period.start_date} ~ {period.end_date}
                      </p>
                      {period.created_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          생성: {new Date(period.created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(period)}
                      >
                        수정
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDelete(period.id!)}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* 주의사항 */}
      <Card className="p-6 bg-amber-50 border-amber-200">
        <h3 className="text-lg font-semibold text-amber-800 mb-3">
          <i className="ri-information-line mr-2"></i>
          주의사항
        </h3>
        <ul className="text-sm text-amber-700 space-y-2">
          <li>• <strong>밴된 사용자</strong>는 학교 날짜 설정과 관계없이 서비스 이용 불가</li>
          <li>• 사용자는 <strong>자신의 학교가 설정된 날짜에만</strong> 서비스 이용 가능</li>
          <li>• 일일 사용 제한은 <strong>학교별로</strong> 적용됩니다</li>
          <li>• 날짜 범위를 벗어난 경우 자동으로 서비스 이용이 차단됩니다</li>
        </ul>
      </Card>
    </div>
  );
};

export default SettingsTab;
