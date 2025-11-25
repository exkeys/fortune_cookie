
export interface SelectedRoleDisplayProps {
  selectedRole: string | null;
  customRole?: string;
}

// 이 파일은 page.tsx에서 import되어 사용되고 있으므로, 선언만 warning이 뜨는 경우는 없습니다.
// 만약 IDE에서만 경고가 뜬다면 무시해도 무방합니다.
export default function SelectedRoleDisplay({ selectedRole, customRole }: SelectedRoleDisplayProps) {
  if (!selectedRole) return null;
  if (selectedRole === 'other' && !customRole?.trim()) return null;
  return (
    <div className="p-4 md:p-6 mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 max-w-md mx-auto rounded-2xl shadow">
      <div className="flex flex-col items-center space-y-2">
        <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 flex items-center justify-center text-white shadow-lg mb-2">
          {selectedRole === 'student' ? (
            <i className="ri-book-line text-xl md:text-2xl lg:text-3xl"></i>
          ) : customRole?.trim() ? (
            <span className="text-2xl md:text-3xl lg:text-4xl">{customRole.trim()}</span>
          ) : (
            <i className="ri-user-line text-xl md:text-2xl lg:text-3xl"></i>
          )}
        </div>
        <h3 className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-800">
          {customRole?.trim() || selectedRole}
        </h3>
        <p className="text-sm md:text-base lg:text-lg text-gray-600">
          {customRole?.trim() ? `${customRole.trim()} 관련 조언` : ''}
        </p>
      </div>
    </div>
  );
}