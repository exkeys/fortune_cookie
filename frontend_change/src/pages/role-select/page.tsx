
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/base/Button';
import Card from '../../components/base/Card';
import Header from '../../components/feature/Header';

interface Role {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

const roles: Role[] = [
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

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [customRole, setCustomRole] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  
  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setIsAnimating(true);
    if (roleId !== 'other') {
      setCustomRole(''); // 기타가 아닌 역할 선택시 커스텀 역할 초기화
    }
    setTimeout(() => setIsAnimating(false), 300);
  };
  
  const handleCustomRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomRole(e.target.value);
  };
  
  const handleNext = () => {
    if (selectedRole) {
      let roleData;
      
      if (selectedRole === 'other' && customRole.trim()) {
        // 사용자가 입력한 커스텀 역할
        roleData = {
          id: 'custom',
          name: customRole.trim(),
          icon: 'ri-user-line',
          description: `${customRole.trim()} 관련 조언`,
          color: 'from-gray-400 to-gray-600'
        };
      } else if (selectedRole !== 'other') {
        // 기본 역할 중 하나
        roleData = roles.find(role => role.id === selectedRole);
      }
      
      if (roleData) {
        navigate('/concern-input', { 
          state: { 
            selectedRole: roleData
          } 
        });
      }
    }
  };
  
  // 버튼 활성화 조건
  const isNextButtonEnabled = () => {
    if (!selectedRole) return false;
    if (selectedRole === 'other') {
      return customRole.trim().length > 0;
    }
    return true;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <Header />
      
      <div className="container mx-auto px-4 py-16 max-w-full">
        {/* 페이지 제목 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-800 mb-6">
            어떤 역할로 상담받고 싶으신가요?
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl text-gray-600">
            선택한 역할에 맞는 맞춤형 조언을 받을 수 있습니다
          </p>
        </div>
        
        {/* 역할 선택 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6 mb-12 max-w-6xl mx-auto">
          {roles.map((role) => (
            <Card
              key={role.id}
              hover
              className={`p-6 md:p-7 lg:p-8 text-center transition-all duration-300 ${
                selectedRole === role.id 
                  ? 'ring-4 ring-amber-300 ring-opacity-50 shadow-xl scale-105' 
                  : 'hover:shadow-lg'
              } ${isAnimating && selectedRole === role.id ? 'animate-pulse' : ''}`}
              onClick={() => handleRoleSelect(role.id)}
            >
              <div className={`w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 mx-auto mb-4 rounded-full bg-gradient-to-r ${role.color} flex items-center justify-center text-white text-2xl md:text-3xl lg:text-4xl shadow-lg`}>
                <i className={role.icon}></i>
              </div>
              <h3 className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-800 mb-3">{role.name}</h3>
              <p className="text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 leading-relaxed">{role.description}</p>
            </Card>
          ))}
        </div>
        
        {/* 기타 역할 선택시 커스텀 입력 */}
        {selectedRole === 'other' && (
          <Card className="p-8 md:p-10 lg:p-12 mb-10 bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-3">어떤 역할인가요?</h3>
              <p className="text-base md:text-lg lg:text-xl text-gray-600">예: 요리사, 간호사, 작가, 운동선수 등</p>
            </div>
            <div className="max-w-xl mx-auto">
              <input
                type="text"
                value={customRole}
                onChange={handleCustomRoleChange}
                placeholder="역할을 입력해주세요"
                className="w-full p-4 md:p-5 lg:p-6 text-lg md:text-xl lg:text-2xl border-2 border-gray-200 rounded-xl focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all duration-300 text-gray-800 placeholder-gray-400 text-center"
                maxLength={20}
                autoFocus
              />
              <div className="text-right mt-3 text-sm md:text-base lg:text-lg text-gray-400">
                {customRole.length}/20
              </div>
            </div>
          </Card>
        )}
        
        {/* 선택된 역할 표시 */}
        {selectedRole && selectedRole !== 'other' && (
          <Card className="p-8 md:p-10 mb-10 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-5 md:space-x-6">
              <div className={`w-14 h-14 md:w-16 md:h-16 lg:w-18 lg:h-18 rounded-full bg-gradient-to-r ${roles.find(r => r.id === selectedRole)?.color} flex items-center justify-center text-white shadow-lg`}>
                <i className={`${roles.find(r => r.id === selectedRole)?.icon} text-xl md:text-2xl lg:text-3xl`}></i>
              </div>
              <div>
                <h3 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-800">
                  선택된 역할: {roles.find(r => r.id === selectedRole)?.name}
                </h3>
                <p className="text-base md:text-lg lg:text-xl text-gray-600">
                  {roles.find(r => r.id === selectedRole)?.description}
                </p>
              </div>
            </div>
          </Card>
        )}
        
        {/* 커스텀 역할 선택시 표시 */}
        {selectedRole === 'other' && customRole.trim() && (
          <Card className="p-8 md:p-10 mb-10 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-5 md:space-x-6">
              <div className="w-14 h-14 md:w-16 md:h-16 lg:w-18 lg:h-18 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center text-white shadow-lg">
                <i className="ri-user-line text-xl md:text-2xl lg:text-3xl"></i>
              </div>
              <div>
                <h3 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-800">
                  선택된 역할: {customRole.trim()}
                </h3>
                <p className="text-base md:text-lg lg:text-xl text-gray-600">
                  {customRole.trim()} 관련 조언
                </p>
              </div>
            </div>
          </Card>
        )}
        
        {/* 다음 버튼 */}
        <div className="text-center">
          <Button
            size="lg"
            disabled={!isNextButtonEnabled()}
            onClick={handleNext}
            className="shadow-xl text-lg md:text-xl lg:text-2xl px-10 py-5 md:px-12 md:py-6"
          >
            <span className="flex items-center space-x-3">
              <span>다음 단계로</span>
              <i className="ri-arrow-right-line text-xl md:text-2xl lg:text-3xl"></i>
            </span>
          </Button>
          
          {selectedRole === 'other' && !customRole.trim() && (
            <p className="mt-4 text-base md:text-lg lg:text-xl text-amber-600">
              💡 역할을 입력해주세요
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
