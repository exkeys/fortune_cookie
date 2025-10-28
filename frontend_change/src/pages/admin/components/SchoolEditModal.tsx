import React, { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import schoolsData from '../../../data/schools.json';

interface School {
  id: number;
  name: string;
  category: string;
}

interface User {
  id: string;
  email: string;
  nickname: string;
  school?: string;
  status: 'active' | 'inactive' | 'deleted' | 'banned';
  is_admin: boolean;
  created_at: string;
  last_login_at: string | null;
  last_logout_at?: string | null;
}

interface SchoolEditModalProps {
  user: User | null;
  onClose: () => void;
  onUpdate: () => void;
}

const schoolsArray = Array.isArray(schoolsData) ? (schoolsData as School[]) : (schoolsData as { schools: School[] }).schools;

const SchoolEditModal: React.FC<SchoolEditModalProps> = ({ user, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');

  useEffect(() => {
    if (user) {
      setSelectedSchool(user.school || '');
      setSearchTerm(user.school || '');
    }
  }, [user]);

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

  const handleSchoolSelect = (schoolName: string) => {
    setSelectedSchool(schoolName);
    setSearchTerm(schoolName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSchool) {
      alert('학교를 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, field: 'school', value: selectedSchool })
      });

      if (response.ok) {
        alert('학교 정보가 수정되었습니다.');
        onUpdate();
        onClose();
      } else {
        const errorData = await response.json();
        alert(errorData.error || '수정 실패');
      }
    } catch (error) {
      console.error('학교 정보 수정 실패:', error);
      alert('수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[998]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 pointer-events-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">학교 정보 수정</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">사용자:</span> {user.nickname} ({user.email})
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">현재 학교:</span> {user.school || '없음'}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">새 학교 선택 *</label>
              <div className="bg-gray-100 rounded-xl mb-2 flex items-center px-3 py-2">
                <Search className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (selectedSchool !== e.target.value) {
                      setSelectedSchool('');
                    }
                  }}
                  placeholder="학교명을 검색하세요"
                  className="bg-transparent flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                />
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {filteredSchools.length > 0 ? (
                  filteredSchools.map((school: School, idx: number) => (
                    <button
                      key={school.id}
                      type="button"
                      onClick={() => handleSchoolSelect(school.name)}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                        idx !== filteredSchools.length - 1 ? 'border-b border-gray-100' : ''
                      } ${
                        selectedSchool === school.name
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${
                          selectedSchool === school.name ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {school.name}
                        </div>
                        {school.category && (
                          <div className="text-xs text-gray-500 mt-0.5">{school.category}</div>
                        )}
                      </div>
                      {selectedSchool === school.name ? (
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

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading || !selectedSchool}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                {loading ? '수정 중...' : '수정하기'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default SchoolEditModal;
