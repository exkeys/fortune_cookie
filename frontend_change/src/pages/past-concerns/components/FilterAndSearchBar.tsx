import Button from '../../../components/base/Button';
import Card from '../../../components/base/Card';
import ActiveFilters from './ActiveFilters';

interface Role {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

interface FilterAndSearchBarProps {
  searchTerm: string;
  filterRole: string;
  sortBy: 'newest' | 'oldest';
  viewMode: 'grid' | 'list';
  uniqueRoles: (Role | null)[];
  onSearchChange: (value: string) => void;
  onFilterRoleChange: (value: string) => void;
  onSortByChange: (value: 'newest' | 'oldest') => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onClearAll: () => void;
  onNewFortune: () => void;
  onClearSearch: () => void;
  onClearRoleFilter: () => void;
}

export default function FilterAndSearchBar({
  searchTerm,
  filterRole,
  sortBy,
  viewMode,
  uniqueRoles,
  onSearchChange,
  onFilterRoleChange,
  onSortByChange,
  onViewModeChange,
  onClearAll,
  onNewFortune,
  onClearSearch,
  onClearRoleFilter
}: FilterAndSearchBarProps) {
  return (
    <Card className="p-3 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <div className="flex flex-col lg:flex-row gap-2">
        {/* 검색창 */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <i className="ri-search-line text-gray-400 text-sm"></i>
            </div>
            <input
              type="text"
              placeholder="운세 내용, 역할, 고민으로 검색..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-6 pr-2 py-4 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all duration-300 text-gray-800 placeholder-gray-500 shadow-sm text-sm"
            />
            {searchTerm && (
              <button
                onClick={onClearSearch}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-sm"></i>
              </button>
            )}
          </div>
        </div>

        {/* 필터 및 정렬 옵션 */}
        <div className="flex flex-wrap gap-3">
          {/* 역할 필터 */}
          <div className="relative">
            <select
              value={filterRole}
              onChange={(e) => onFilterRoleChange(e.target.value)}
              className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3.5 pr-10 text-gray-700 focus:ring-4 focus:ring-amber-100 focus:border-amber-400 transition-all duration-300 shadow-sm min-w-32"
            >
              <option value="all">모든 역할</option>
              {uniqueRoles.map((role) => role && (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <i className="ri-arrow-down-s-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
          </div>

          {/* 정렬 옵션 */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as 'newest' | 'oldest')}
              className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3.5 pr-10 text-gray-700 focus:ring-4 focus:ring-amber-100 focus:border-amber-400 transition-all duration-300 shadow-sm min-w-32"
            >
              <option value="newest">최신순</option>
              <option value="oldest">오래된 순</option>
            </select>
            <i className="ri-arrow-down-s-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
          </div>

          {/* 보기 모드 토글 */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`px-4 py-2.5 rounded-lg transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <i className="ri-grid-line"></i>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`px-4 py-2.5 rounded-lg transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <i className="ri-list-unordered"></i>
            </button>
          </div>

          {/* 새 운세 및 전체 삭제 버튼 */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="whitespace-nowrap bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-600"
            >
              <i className="ri-delete-bin-line mr-2"></i>
              전체 삭제
            </Button>
            <Button
              size="sm"
              onClick={onNewFortune}
              className="whitespace-nowrap bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <i className="ri-add-line mr-2"></i>
              새 운세
            </Button>
          </div>
        </div>
      </div>

      <ActiveFilters
        searchTerm={searchTerm}
        filterRole={filterRole}
        uniqueRoles={uniqueRoles}
        onClearSearch={onClearSearch}
        onClearRoleFilter={onClearRoleFilter}
      />
    </Card>
  );
}