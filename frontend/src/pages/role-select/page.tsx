
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import PageTitle from './components/PageTitle';
import RoleGrid from './components/RoleGrid';
import CustomRoleInput from './components/CustomRoleInput';
import NextButton from './components/NextButton';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { loadFormData, updateFormData } from '../../utils/formPersistence';
import { apiFetch } from '../../utils/apiClient';

interface Role {
  id: string;
  name: string;
  icon: string;
  description: string;
  color?: string;
}

interface CustomRoleRow {
  id: string;
  role_name: string;
}

const initialRoles: Role[] = [
  {
    id: 'student',
    name: '학생',
    icon: 'ri-book-line',
    description: '학업과 진로 상담'
  }
];



export default function RoleSelectPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [customRoles, setCustomRoles] = useState<{ [id: string]: string }>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [customRoleInputId, setCustomRoleInputId] = useState<string | null>(null);

  // 모바일에서 페이지 진입 시 스크롤을 맨 위로 이동
  useEffect(() => {
    // 화면 크기를 직접 체크하여 모바일인지 확인
    const checkAndScroll = () => {
      if (window.innerWidth <= 768) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };
    
    // 즉시 실행
    checkAndScroll();
    
    // DOM 렌더링 후에도 확인
    const timer = setTimeout(() => {
      checkAndScroll();
      requestAnimationFrame(() => {
        checkAndScroll();
      });
    }, 0);
    
    return () => clearTimeout(timer);
  }, []); // 페이지 마운트 시 한 번만 실행

  // isMobile 상태가 변경될 때도 스크롤을 맨 위로 이동
  useEffect(() => {
    if (isMobile) {
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: 'instant' });
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  // 1. 진입 시 custom_roles 불러오기
  useEffect(() => {
    // user.id 확인 (localStorage fallback)
    let userId = user?.id;
    
    // user.id가 없으면 localStorage에서 확인
    if (!userId) {
      const backendAuthData = localStorage.getItem('auth_backend_user');
      if (backendAuthData) {
        try {
          const backendUser = JSON.parse(backendAuthData);
          userId = backendUser.id;
        } catch {
          // 무시
        }
      }
    }
    
    if (!userId) return;
    
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
        
        // 2. 백엔드 API로 custom_roles 불러오기
        const response = await apiFetch(`/api/custom-roles`);
        if (response.ok) {
          const result = await response.json();
          const data = result.customRoles || [];
          const customRoleObjs: Role[] = data.map((row: CustomRoleRow) => ({
            id: row.id,
            name: row.role_name || '역할 선택',
            icon: 'ri-user-line',
            description: row.role_name?.trim() ? `${row.role_name} 관련 조언` : '역할을 선택해 주세요',
          }));
          setRoles([initialRoles[0], ...customRoleObjs]);
          const cr: { [id: string]: string } = {};
          data.forEach((row: CustomRoleRow) => { cr[row.id] = row.role_name || ''; });
          setCustomRoles(cr);
        }
      } catch (error) {
        // 에러 무시
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
    // 백엔드 API로 삭제 - user.id 확인 (localStorage fallback)
    let userId = user?.id;
    if (!userId) {
      const backendAuthData = localStorage.getItem('auth_backend_user');
      if (backendAuthData) {
        try {
          const backendUser = JSON.parse(backendAuthData);
          userId = backendUser.id;
        } catch {
          // 무시
        }
      }
    }
    if (userId) {
      try {
        await apiFetch(`/api/custom-roles/${roleId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        // 에러 무시
      }
    }
  };

  // 3. +카드 클릭 시 커스텀 역할 추가 (DB 반영)
  const handleAddRole = async () => {
    if (roles.length >= 8) return;
    
    // user.id 확인 (localStorage fallback)
    let userId = user?.id;
    if (!userId) {
      const backendAuthData = localStorage.getItem('auth_backend_user');
      if (backendAuthData) {
        try {
          const backendUser = JSON.parse(backendAuthData);
          userId = backendUser.id;
        } catch {
          // 무시
        }
      }
    }
    
    if (!userId) return;
    
    // 백엔드 API로 빈 역할 추가
    try {
      // B 구조: Supabase SDK가 자동으로 토큰 관리하므로 setAccessToken 불필요
      const response = await apiFetch('/api/custom-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleName: ''
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        const newId = result.customRole?.id;
        if (newId) {
          setRoles((prev) => [
            ...prev,
            {
              id: newId,
              name: '직접 추가',
              icon: 'ri-add-line',
              description: '새로운 역할을 추가하세요',
            },
          ]);
          setSelectedRole(newId);
          setCustomRoleInputId(newId);
        }
      }
    } catch (error) {
      // 에러 무시
    }
  };

  // 4. 역할 선택
  const handleRoleSelect = (roleId: string) => {
    setIsAnimating(true);
    
    // 이미 저장된 역할인지 확인 (이름이 '직접 추가'가 아니고, 실제 이름이 있는 역할)
    const role = roles.find(r => r.id === roleId);
    const isSavedRole = role && role.name !== '직접 추가' && role.name.trim() !== '';
    
    // 현재 선택된 역할과 클릭한 역할이 같은지 확인 (setSelectedRole 호출 전에 체크)
    const isSameRole = selectedRole === roleId;
    
    // 역할 선택
    setSelectedRole(roleId);
    
    // 학생 역할이 아니고
    if (roleId !== 'student') {
      // + 버튼으로 추가된 역할('직접 추가')인 경우: 한 번 클릭해도 저장 버튼 표시
      if (role?.name === '직접 추가') {
        setCustomRoleInputId(roleId);
      }
      // 이미 저장된 역할인 경우
      else if (isSavedRole) {
        // 같은 역할을 다시 클릭한 경우 (두 번째 클릭): 저장 버튼 표시/토글
        if (isSameRole) {
          // 이미 저장 버튼이 열려있으면 닫기, 닫혀있으면 열기
          setCustomRoleInputId(customRoleInputId === roleId ? null : roleId);
        }
        // 다른 역할을 클릭한 경우 (첫 번째 클릭): 선택만 하고 저장 버튼 안 나옴
        else {
          setCustomRoleInputId(null);
        }
      }
      // 저장되지 않은 역할인 경우 저장 버튼 표시
      else {
        setCustomRoleInputId(roleId);
      }
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
    if (!customRoleInputId) return;
    
    // user.id 확인 (localStorage fallback)
    let userId = user?.id;
    if (!userId) {
      const backendAuthData = localStorage.getItem('auth_backend_user');
      if (backendAuthData) {
        try {
          const backendUser = JSON.parse(backendAuthData);
          userId = backendUser.id;
        } catch {
          // 무시
        }
      }
    }
    
    if (!userId) return;
    
    const value = customRoles[customRoleInputId];
    if (typeof value !== 'string') return;
    
    // 백엔드 API로 업데이트
    try {
      // B 구조: Supabase SDK가 자동으로 토큰 관리하므로 setAccessToken 불필요
      const response = await apiFetch(`/api/custom-roles/${customRoleInputId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleName: value
        })
      });
      
      if (response.ok) {
        // 저장 후 custom_roles 다시 불러와서 local state 갱신
        const listResponse = await apiFetch(`/api/custom-roles`);
        if (listResponse.ok) {
          const result = await listResponse.json();
          const data = result.customRoles || [];
          const customRoleObjs: Role[] = data.map((row: CustomRoleRow) => ({
            id: row.id,
            name: row.role_name || '역할 선택',
            icon: 'ri-user-line',
            description: row.role_name?.trim() ? `${row.role_name} 관련 조언` : '역할을 선택해 주세요',
            color: 'from-gray-400 to-gray-600',
          }));
          setRoles([initialRoles[0], ...customRoleObjs]);
          const cr: { [id: string]: string } = {};
          data.forEach((row: CustomRoleRow) => { cr[row.id] = row.role_name || ''; });
          setCustomRoles(cr);
        }
      }
    } catch (error) {
      // 에러 무시
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
      if (selectedRole === 'student') {
        roleData = roles.find(role => role.id === selectedRole);
      } else if (selectedRole !== 'student') {
        // 커스텀 역할인 경우: roles 배열에서 찾아서 저장된 역할인지 확인
        const savedRole = roles.find(role => role.id === selectedRole);
        if (savedRole && savedRole.name && savedRole.name !== '역할 선택' && savedRole.name !== '직접 추가') {
          // 저장된 역할이 있으면 사용
          roleData = savedRole;
        } else {
          // 저장되지 않은 경우: 기본 메시지로 설정
          roleData = {
            id: selectedRole,
            name: '역할 선택',
            icon: 'ri-user-line',
            description: '역할을 선택해 주세요',
          };
        }
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
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 lg:py-12 max-w-full">
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
