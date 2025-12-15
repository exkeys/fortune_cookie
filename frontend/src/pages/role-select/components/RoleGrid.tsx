
import Card from '../../../components/base/Card';

interface Role {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface RoleGridProps {
  roles: Role[];
  selectedRole: string;
  isAnimating: boolean;
  onRoleSelect: (roleId: string) => void;
  onRemoveRole?: (roleId: string) => void;
  onAddRole?: () => void;
}

export default function RoleGrid({ roles, selectedRole, isAnimating, onRoleSelect, onRemoveRole, onAddRole }: RoleGridProps) {
  // 항상 가운데 정렬
  return (
    <div className={
      'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 md:gap-3 lg:gap-4 mb-8 max-w-5xl mx-auto justify-center'
    }>
      {roles.map((role) => (
        <div key={role.id} className="relative">
          <Card
            hover
            className={`p-3 md:p-4 lg:p-5 text-center transition-all duration-300 ${
              selectedRole === role.id 
                ? 'ring-4 ring-amber-300 ring-opacity-50 shadow-xl scale-105' 
                : 'hover:shadow-lg'
            } ${isAnimating && selectedRole === role.id ? 'animate-pulse' : ''}`}
            onClick={() => onRoleSelect(role.id)}
          >
            <div className={`w-12 h-12 md:w-14 md:h-14 lg:w-18 lg:h-18 xl:w-20 xl:h-20 mx-auto mb-2 rounded-full flex items-center justify-center text-white text-lg md:text-xl lg:text-2xl shadow-lg bg-gradient-to-r from-indigo-400 to-indigo-600`}>
              {role.id === 'student' ? (
                <i className={role.icon}></i>
              ) : role.name === '직접 추가' ? (
                <i className="ri-user-line"></i>
              ) : /^[\p{Emoji}]+$/u.test(role.name.trim()) ? (
                <span>{role.name.trim()}</span>
              ) : (
                <i className="ri-user-line"></i>
              )}
            </div>
            <h3 className="text-xs md:text-sm lg:text-base xl:text-lg font-bold text-gray-800 mb-1">{role.name}</h3>
            <p className="text-xs md:text-xs lg:text-sm xl:text-base text-gray-600 leading-relaxed">{role.description}</p>
          </Card>
          {/* 모든 역할에 x버튼 항상 보이게 */}
          {onRemoveRole && (
            <button
              type="button"
              className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-400 text-gray-700 hover:text-white text-base font-bold shadow z-20 border border-white"
              style={{ zIndex: 20 }}
              onClick={(e) => { e.stopPropagation(); onRemoveRole(role.id); }}
              aria-label="역할 삭제"
              title="역할 삭제"
            >
              ×
            </button>
          )}
        </div>
      ))}
      {/* +카드: 8개 미만일 때만 노출 */}
      {onAddRole && roles.length < 8 && (
        <button
          type="button"
          className="flex flex-col items-center justify-center p-3 md:p-4 lg:p-5 text-center border-2 border-dashed border-gray-300 rounded-2xl bg-white hover:bg-amber-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-200 min-h-[120px]"
          onClick={onAddRole}
        >
          <div className="w-12 h-12 md:w-14 md:h-14 lg:w-18 lg:h-18 xl:w-20 xl:h-20 flex items-center justify-center rounded-full bg-gradient-to-r from-gray-200 to-gray-400 text-gray-500 text-3xl mb-2">
            <i className="ri-add-line"></i>
          </div>
          <span className="text-xs md:text-sm lg:text-base xl:text-lg font-bold text-gray-500">역할 추가</span>
        </button>
      )}
    </div>
  );
}