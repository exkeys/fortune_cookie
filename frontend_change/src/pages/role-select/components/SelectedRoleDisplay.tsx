import Card from '../../../components/base/Card';

interface Role {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

interface SelectedRoleDisplayProps {
  selectedRole: string;
  roles: Role[];
  customRole?: string;
}

export default function SelectedRoleDisplay({ selectedRole, roles, customRole }: SelectedRoleDisplayProps) {
  if (!selectedRole) return null;

  const isCustom = selectedRole === 'other' && customRole?.trim();
  const role = roles.find(r => r.id === selectedRole);

  if (selectedRole === 'other' && !customRole?.trim()) return null;

  return (
    <Card className="p-6 md:p-8 mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 max-w-3xl mx-auto">
      <div className="flex items-center justify-center space-x-4 md:space-x-5">
        <div className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-r ${
          isCustom ? 'from-gray-400 to-gray-600' : role?.color
        } flex items-center justify-center text-white shadow-lg`}>
          {isCustom ? (
            <i className="ri-user-line text-lg md:text-xl lg:text-2xl"></i>
          ) : role?.id === 'ceo' ? (
            <span className="text-lg md:text-xl lg:text-2xl">👑</span>
          ) : (
            <i className={`${role?.icon} text-lg md:text-xl lg:text-2xl`}></i>
          )}
        </div>
        <div>
          <h3 className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-800">
            선택된 역할: {isCustom ? customRole?.trim() : role?.name}
          </h3>
          <p className="text-sm md:text-base lg:text-lg text-gray-600">
            {isCustom ? `${customRole?.trim()} 관련 조언` : role?.description}
          </p>
        </div>
      </div>
    </Card>
  );
}