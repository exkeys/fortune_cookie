interface Role {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

interface ActiveFiltersProps {
  searchTerm: string;
  filterRole: string;
  uniqueRoles: (Role | null)[];
  onClearSearch: () => void;
  onClearRoleFilter: () => void;
}

export default function ActiveFilters({ 
  searchTerm, 
  filterRole, 
  uniqueRoles, 
  onClearSearch, 
  onClearRoleFilter 
}: ActiveFiltersProps) {
  if (!searchTerm && filterRole === 'all') return null;

  return (
    <div className="flex items-center flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
      <span className="text-sm font-medium text-gray-600">활성 필터:</span>
      {searchTerm && (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          <i className="ri-search-line mr-1.5"></i>
          "{searchTerm}"
          <button
            onClick={onClearSearch}
            className="ml-2 hover:text-blue-900"
          >
            <i className="ri-close-line"></i>
          </button>
        </span>
      )}
      {filterRole !== 'all' && (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
          <i className="ri-user-line mr-1.5"></i>
          {uniqueRoles.find(r => r && r.id === filterRole)?.name}
          <button
            onClick={onClearRoleFilter}
            className="ml-2 hover:text-purple-900"
          >
            <i className="ri-close-line"></i>
          </button>
        </span>
      )}
    </div>
  );
}