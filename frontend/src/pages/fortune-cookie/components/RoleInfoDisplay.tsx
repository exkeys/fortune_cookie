import Card from '../../../components/base/Card';

interface RoleInfoDisplayProps {
  selectedRole?: {
    id: string;
    name: string;
    icon: string;
    description: string;
    color: string;
  };
  concern?: string;
}

export default function RoleInfoDisplay({ selectedRole, concern }: RoleInfoDisplayProps) {
  if (!selectedRole) return null;

  return (
    <Card className="p-6 md:p-8 mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4 md:space-x-5">
        <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 flex items-center justify-center text-white shadow-lg">
          {selectedRole.id === 'ceo' ? (
            <span className="text-xl md:text-2xl lg:text-3xl">👑</span>
          ) : (
            <i className={`${selectedRole.icon} text-xl md:text-2xl lg:text-3xl`}></i>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800">{selectedRole.name} 상담</h3>
          <p className="text-sm md:text-base lg:text-lg text-gray-600 mt-2">{concern}</p>
        </div>
      </div>
    </Card>
  );
}