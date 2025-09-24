
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import PageTitle from './components/PageTitle';
import RoleGrid from './components/RoleGrid';
import CustomRoleInput from './components/CustomRoleInput';
import SelectedRoleDisplay from './components/SelectedRoleDisplay';
import NextButton from './components/NextButton';

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
    color: 'from-amber-400 to-yellow-500'
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
  

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12 max-w-full">
        <PageTitle />
        
        <RoleGrid
          roles={roles}
          selectedRole={selectedRole}
          isAnimating={isAnimating}
          onRoleSelect={handleRoleSelect}
        />
        
        {selectedRole === 'other' && (
          <CustomRoleInput
            customRole={customRole}
            onCustomRoleChange={handleCustomRoleChange}
          />
        )}
        
        <SelectedRoleDisplay
          selectedRole={selectedRole}
          roles={roles}
          customRole={customRole}
        />
        
        <NextButton
          selectedRole={selectedRole}
          customRole={customRole}
          onNext={handleNext}
        />
      </div>
    </div>
  );
}
