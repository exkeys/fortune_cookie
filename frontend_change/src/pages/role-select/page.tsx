
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import PageTitle from './components/PageTitle';
import RoleGrid from './components/RoleGrid';
import CustomRoleInput from './components/CustomRoleInput';
import NextButton from './components/NextButton';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { loadFormData, updateFormData } from '../../utils/formPersistence';

interface Role {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

const initialRoles: Role[] = [
  {
    id: 'student',
    name: '학생',
    icon: 'ri-book-line',
    description: '학업과 진로 상담',
    color: 'from-indigo-400 to-indigo-600'
  }
];



export default function RoleSelectPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [customRoles, setCustomRoles] = useState<{ [id: string]: string }>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [customRoleInputId, setCustomRoleInputId] = useState<string | null>(null);

  // 1. 진입 시 custom_roles 불러오기
  useEffect(() => {
    if (!user?.id) return;
    
    const initializePage = async () => {
      try {
        // 1. 저장된 폼 데이터 복원
        const savedData = loadFormData();
        if (savedData?.selectedRole) {
          setSelectedRole(savedData.selectedRole.id);
        }
        if (savedData?.customRole) {
          setCustomRoles(prev => ({ ...prev, [savedData.customRole!]: savedData.customRole! }));
        }
        
        // 2. custom_roles 불러오기
        const { data, error } = await supabase
          .from('custom_roles')
          .select('id, role_name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        if (!error && data) {
          const customRoleObjs: Role[] = data.map((row: any) => ({
            id: row.id,
            name: row.role_name,
            icon: 'ri-user-line',
            description: `${row.role_name} 관련 조언`,
            color: 'from-gray-400 to-gray-600',
          }));
          setRoles([initialRoles[0], ...customRoleObjs]);
          const cr: { [id: string]: string } = {};
          data.forEach((row: any) => { cr[row.id] = row.role_name; });
          setCustomRoles(cr);
        }
      } catch (error) {
        console.error('페이지 초기화 에러:', error);
      }
    };

    initializePage();
  }, [user?.id]);

  // 2. 역할 삭제 (DB 반영)
  const handleRemoveRole = async (roleId: string) => {
    // 학생 역할은 DB에 없음
    if (roleId === 'student') {
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
      if (selectedRole === roleId) setSelectedRole('');
      if (customRoleInputId === roleId) setCustomRoleInputId(null);
      return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    setCustomRoles((prev) => {
      const copy = { ...prev };
      delete copy[roleId];
      return copy;
    });
    if (selectedRole === roleId) setSelectedRole('');
    if (customRoleInputId === roleId) setCustomRoleInputId(null);
    // DB 삭제
    if (user?.id) {
      await supabase.from('custom_roles').delete().eq('id', roleId).eq('user_id', user.id);
    }
  };

  // 3. +카드 클릭 시 커스텀 역할 추가 (DB 반영)
  const handleAddRole = async () => {
    if (roles.length >= 8 || !user?.id) return;
    // DB에 빈 역할 추가
    const { data, error } = await supabase
      .from('custom_roles')
      .insert([{ user_id: user.id, role_name: '' }])
      .select('id');
    if (!error && data && data[0]?.id) {
      const newId = data[0].id;
      setRoles((prev) => [
        ...prev,
        {
          id: newId,
          name: '직접 추가',
          icon: 'ri-add-line',
          description: '새로운 역할을 추가하세요',
          color: 'from-gray-200 to-gray-400',
        },
      ]);
      setSelectedRole(newId);
      setCustomRoleInputId(newId);
    }
  };

  // 4. 역할 선택
  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setIsAnimating(true);
    if (roleId !== 'student') {
      setCustomRoleInputId(roleId);
    } else {
      setCustomRoleInputId(null);
    }
    
    // 선택된 역할을 localStorage에 저장
    const selectedRoleData = roles.find(role => role.id === roleId);
    if (selectedRoleData) {
      updateFormData({ selectedRole: selectedRoleData });
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  };


  // 5. 커스텀 역할 입력 (local state만)
  const handleCustomRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!customRoleInputId) return;
    const value = e.target.value;
    setCustomRoles((prev) => ({ ...prev, [customRoleInputId]: value }));
  };

  // 저장하기 버튼 클릭 시 DB update 후 custom_roles 다시 불러오기
  const handleCustomRoleSave = async () => {
    if (!customRoleInputId || !user?.id) return;
    const value = customRoles[customRoleInputId];
    if (typeof value !== 'string') return;
    await supabase
      .from('custom_roles')
      .update({ role_name: value })
      .eq('id', customRoleInputId)
      .eq('user_id', user.id);
    // 저장 후 custom_roles 다시 불러와서 local state 갱신
    const { data, error } = await supabase
      .from('custom_roles')
      .select('id, role_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    if (!error && data) {
      const customRoleObjs: Role[] = data.map((row: any) => ({
        id: row.id,
        name: row.role_name,
        icon: 'ri-user-line',
        description: `${row.role_name} 관련 조언`,
        color: 'from-gray-400 to-gray-600',
      }));
      setRoles([initialRoles[0], ...customRoleObjs]);
      const cr: { [id: string]: string } = {};
      data.forEach((row: any) => { cr[row.id] = row.role_name; });
      setCustomRoles(cr);
    }
    // 입력창 닫기
    setCustomRoleInputId(null);
  };

  // 커스텀 역할 입력창 닫기
  const handleCloseCustomRoleInput = () => {
    setCustomRoleInputId(null);
  };

  // 6. 다음 버튼 (포춘 쿠키 받기)
  const handleNext = async () => {
    if (selectedRole) {
      let roleData;
      if (selectedRole !== 'student' && customRoles[selectedRole]?.trim()) {
        roleData = {
          id: selectedRole,
          name: customRoles[selectedRole].trim(),
          icon: 'ri-user-line',
          description: `${customRoles[selectedRole].trim()} 관련 조언`,
          color: 'from-gray-400 to-gray-600',
        };
      } else if (selectedRole === 'student') {
        roleData = roles.find(role => role.id === selectedRole);
      }
      if (roleData) {
        // 폼 데이터에 선택된 역할 저장
        updateFormData({ selectedRole: roleData });
        
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
          onRemoveRole={handleRemoveRole}
          onAddRole={handleAddRole}
        />
        {customRoleInputId && (
          <CustomRoleInput
            customRole={customRoles[customRoleInputId] || ''}
            onCustomRoleChange={handleCustomRoleChange}
            onSave={handleCustomRoleSave}
            onClose={handleCloseCustomRoleInput}
          />
        )}
        <NextButton
          selectedRole={selectedRole}
          customRole={customRoles[selectedRole] || ''}
          onNext={handleNext}
        />
      </div>
    </div>
  );
}
