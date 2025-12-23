
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import PageTitle from './components/PageTitle';
import RoleGrid from './components/RoleGrid';
import CustomRoleInput from './components/CustomRoleInput';
import NextButton from './components/NextButton';
import LoadingSpinner from '../../components/base/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { useResponsive } from '../../hooks/useResponsive';
import { loadFormData, updateFormData } from '../../utils/formPersistence';
import { useCustomRoles, useCreateCustomRole, useUpdateCustomRole, useDeleteCustomRole } from '../../hooks/useCustomRoles';

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
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [customRoles, setCustomRoles] = useState<{ [id: string]: string }>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [customRoleInputId, setCustomRoleInputId] = useState<string | null>(null);

  // userId 가져오기 (localStorage fallback 포함)
  const userId = useMemo(() => {
    if (user?.id) return user.id;
    const backendAuthData = localStorage.getItem('auth_backend_user');
    if (backendAuthData) {
      try {
        const backendUser = JSON.parse(backendAuthData);
        return backendUser.id;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }, [user?.id]);

  // React Query로 커스텀 역할 목록 가져오기
  const { data: customRolesData = [], isLoading: isLoadingRoles } = useCustomRoles(userId);
  const createCustomRoleMutation = useCreateCustomRole();
  const updateCustomRoleMutation = useUpdateCustomRole();
  const deleteCustomRoleMutation = useDeleteCustomRole();

  // 커스텀 역할 데이터를 Role 형식으로 변환
  const customRoleObjs: Role[] = useMemo(() => {
    return customRolesData.map((row: CustomRoleRow) => ({
      id: row.id,
      name: row.role_name || '역할 선택',
      icon: 'ri-user-line',
      description: row.role_name?.trim() ? `${row.role_name} 관련 조언` : '역할을 선택해 주세요',
    }));
  }, [customRolesData]);

  // 전체 역할 목록 (학생 + 커스텀 역할)
  const roles: Role[] = useMemo(() => {
    return [initialRoles[0], ...customRoleObjs];
  }, [customRoleObjs]);

  // customRoles state 동기화
  useEffect(() => {
    const cr: { [id: string]: string } = {};
    customRolesData.forEach((row: CustomRoleRow) => {
      cr[row.id] = row.role_name || '';
    });
    setCustomRoles(cr);
  }, [customRolesData]);

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

  // 1. 진입 시 저장된 폼 데이터 복원 (로딩 완료 후에만 실행)
  useEffect(() => {
    // 커스텀 역할 데이터 로딩이 완료된 후에만 복원
    if (isLoadingRoles) return;
    
    const savedData = loadFormData();
    const savedRole = savedData?.selectedRole;
    if (savedRole) {
      // roles 배열에 해당 역할이 있는지 확인
      const roleExists = roles.some(r => r.id === savedRole.id);
      if (roleExists) {
        setSelectedRole(savedRole.id);
      }
    }
    if (savedData?.customRole) {
      setCustomRoles(prev => ({ ...prev, [savedData.customRole!]: savedData.customRole! }));
    }
  }, [isLoadingRoles, roles]);

  // 2. 역할 삭제 (DB 반영)
  const handleRemoveRole = async (roleId: string) => {
    // 학생 역할은 DB에 없음
    if (roleId === 'student') {
      if (selectedRole === roleId) setSelectedRole('');
      if (customRoleInputId === roleId) setCustomRoleInputId(null);
      return;
    }

    // UI 즉시 업데이트
    if (selectedRole === roleId) setSelectedRole('');
    if (customRoleInputId === roleId) setCustomRoleInputId(null);

    // React Query mutation으로 삭제 (Optimistic Update 적용됨)
    if (userId) {
      try {
        await deleteCustomRoleMutation.mutateAsync({ roleId, userId });
      } catch (error) {
        // 에러 무시 (이미 Optimistic Update로 UI는 업데이트됨)
      }
    }
  };

  // 3. +카드 클릭 시 커스텀 역할 추가 (DB 반영)
  const handleAddRole = async () => {
    if (roles.length >= 8) return;
    
    if (!userId) return;
    
    try {
      // React Query mutation으로 생성 (Optimistic Update로 즉시 반영됨)
      const result = await createCustomRoleMutation.mutateAsync(userId);
      if (result?.customRole?.id) {
        setSelectedRole(result.customRole.id);
        setCustomRoleInputId(result.customRole.id);
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

  // 저장하기 버튼 클릭 시 DB update (Optimistic Update 적용됨)
  const handleCustomRoleSave = async () => {
    if (!customRoleInputId || !userId) return;
    
    const value = customRoles[customRoleInputId];
    if (typeof value !== 'string') return;
    
    try {
      // React Query mutation으로 업데이트 (Optimistic Update로 즉시 반영됨)
      await updateCustomRoleMutation.mutateAsync({
        roleId: customRoleInputId,
        roleName: value,
        userId
      });
    } catch (error) {
      // 에러 무시 (Optimistic Update로 UI는 이미 업데이트됨)
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
  

  // 로딩 중일 때는 스피너만 표시
  if (isLoadingRoles) {
    return <LoadingSpinner message="역할 목록을 불러오는 중..." />;
  }

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
