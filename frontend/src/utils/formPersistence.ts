// 폼 데이터 지속성을 위한 유틸리티 함수들

export interface FormData {
  selectedRole?: {
    id: string;
    name: string;
    icon: string;
    description: string;
    color?: string;
  };
  concern?: string;
  customRole?: string;
  step?: number;
}

const FORM_DATA_KEY = 'fortune_cookie_form_data';

// 폼 데이터를 localStorage에 저장
export const saveFormData = (data: FormData): void => {
  try {
    localStorage.setItem(FORM_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('폼 데이터 저장 실패:', error);
  }
};

// localStorage에서 폼 데이터 복원
export const loadFormData = (): FormData | null => {
  try {
    const savedData = localStorage.getItem(FORM_DATA_KEY);
    return savedData ? JSON.parse(savedData) : null;
  } catch (error) {
    console.error('폼 데이터 로드 실패:', error);
    return null;
  }
};

// 폼 데이터 삭제 (완료 시)
export const clearFormData = (): void => {
  try {
    localStorage.removeItem(FORM_DATA_KEY);
  } catch (error) {
    console.error('폼 데이터 삭제 실패:', error);
  }
};

// 특정 필드만 업데이트
export const updateFormData = (updates: Partial<FormData>): void => {
  const currentData = loadFormData() || {};
  const newData = { ...currentData, ...updates };
  saveFormData(newData);
};

// 폼 데이터가 유효한지 확인
export const isValidFormData = (data: FormData | null): boolean => {
  return !!(data && (data.selectedRole || data.concern));
};
