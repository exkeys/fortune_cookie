import Card from '../../../components/base/Card';

interface SelectedRoleDisplayProps {
  selectedRole?: {
    id: string;
    name: string;
    icon: string;
    description: string;
    color: string;
  };
}

export default function SelectedRoleDisplay({ selectedRole }: SelectedRoleDisplayProps) {
  if (!selectedRole) return null;

  return (
    <Card className="p-3 md:p-4 mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 max-w-2xl mx-auto">
      <div className="flex items-center space-x-2 md:space-x-3">
        <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 flex items-center justify-center text-white shadow-lg">
          {selectedRole.id === 'ceo' ? (
            <span className="text-sm md:text-base lg:text-lg">👑</span>
          ) : (
            <i className={`${selectedRole.icon} text-sm md:text-base lg:text-lg`}></i>
          )}
        </div>
        <div>
          <h3 className="text-sm md:text-base lg:text-lg font-bold text-gray-800">{selectedRole.name}</h3>
          <p className="text-xs md:text-sm lg:text-base text-gray-600">{selectedRole.description}</p>
        </div>
      </div>
    </Card>
  );
}