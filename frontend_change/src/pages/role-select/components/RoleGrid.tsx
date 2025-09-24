import Card from '../../../components/base/Card';

interface Role {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

interface RoleGridProps {
  roles: Role[];
  selectedRole: string;
  isAnimating: boolean;
  onRoleSelect: (roleId: string) => void;
}

export default function RoleGrid({ roles, selectedRole, isAnimating, onRoleSelect }: RoleGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 md:gap-3 lg:gap-4 mb-8 max-w-5xl mx-auto">
      {roles.map((role) => (
        <Card
          key={role.id}
          hover
          className={`p-3 md:p-4 lg:p-5 text-center transition-all duration-300 ${
            selectedRole === role.id 
              ? 'ring-4 ring-amber-300 ring-opacity-50 shadow-xl scale-105' 
              : 'hover:shadow-lg'
          } ${isAnimating && selectedRole === role.id ? 'animate-pulse' : ''}`}
          onClick={() => onRoleSelect(role.id)}
        >
          <div className={`w-12 h-12 md:w-14 md:h-14 lg:w-18 lg:h-18 xl:w-20 xl:h-20 mx-auto mb-2 rounded-full bg-gradient-to-r ${role.color} flex items-center justify-center text-white text-lg md:text-xl lg:text-2xl shadow-lg`}>
            {role.id === 'ceo' ? (
              <span className="text-xl md:text-2xl lg:text-3xl">👑</span>
            ) : (
              <i className={role.icon}></i>
            )}
          </div>
          <h3 className="text-xs md:text-sm lg:text-base xl:text-lg font-bold text-gray-800 mb-1">{role.name}</h3>
          <p className="text-xs md:text-xs lg:text-sm xl:text-base text-gray-600 leading-relaxed">{role.description}</p>
        </Card>
      ))}
    </div>
  );
}