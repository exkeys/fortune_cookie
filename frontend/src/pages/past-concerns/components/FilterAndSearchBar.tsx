import { memo } from 'react';
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

function FilterAndSearchBar({
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
    <Card className="p-2 sm:p-3 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <div className="flex flex-col lg:flex-row gap-2 sm:gap-3">
        {/* 검색창 */}
        <div className="flex-1 min-w-0 w-full lg:w-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
              <i className="ri-search-line text-gray-400 text-xs sm:text-sm"></i>
            </div>
            <input
              type="text"
              placeholder="운세 내용, 역할, 고민으로 검색..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-6 sm:pl-8 pr-8 sm:pr-10 py-2 sm:py-3 md:py-4 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all duration-300 text-gray-800 placeholder-gray-500 shadow-sm text-xs sm:text-sm"
            />
            {searchTerm && (
              <button
                onClick={onClearSearch}
                className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xs sm:text-sm"></i>
              </button>
            )}
          </div>
        </div>

        {/* 필터 및 정렬 옵션 - 모바일에서 2줄로 고정 */}
        <div className="flex flex-nowrap md:flex-wrap gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0 overflow-x-auto md:overflow-visible justify-center md:justify-start">
          {/* 역할 필터 */}
          <div className="relative flex-shrink-0">
            <select
              value={filterRole}
              onChange={(e) => onFilterRoleChange(e.target.value)}
              className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-1.5 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-3.5 pr-6 sm:pr-8 md:pr-10 text-gray-700 focus:ring-4 focus:ring-amber-100 focus:border-amber-400 transition-all duration-300 shadow-sm text-xs sm:text-sm w-auto min-w-[65px] max-w-[100px] sm:min-w-[85px] sm:max-w-[130px] md:min-w-[110px] md:max-w-[150px] lg:min-w-32"
            >
              <option value="all">모든 역할</option>
              {uniqueRoles.map((role) => role && (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <i className="ri-arrow-down-s-line absolute right-1 sm:right-2 md:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs sm:text-sm"></i>
          </div>

          {/* 정렬 옵션 */}
          <div className="relative flex-shrink-0">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as 'newest' | 'oldest')}
              className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-1.5 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-3.5 pr-6 sm:pr-8 md:pr-10 text-gray-700 focus:ring-4 focus:ring-amber-100 focus:border-amber-400 transition-all duration-300 shadow-sm text-xs sm:text-sm w-auto min-w-[55px] max-w-[80px] sm:min-w-[65px] sm:max-w-[100px] md:min-w-[90px] md:max-w-[120px] lg:min-w-32"
            >
              <option value="newest">최신순</option>
              <option value="oldest">오래된 순</option>
            </select>
            <i className="ri-arrow-down-s-line absolute right-1 sm:right-2 md:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-xs sm:text-sm"></i>
          </div>

          {/* 보기 모드 토글 */}
          <div className="hidden md:flex bg-gray-100 rounded-xl p-0.5 sm:p-1 flex-shrink-0">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 rounded-lg transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <i className="ri-grid-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 rounded-lg transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <i className="ri-list-unordered text-sm sm:text-base"></i>
            </button>
          </div>

          {/* 새 운세 및 전체 삭제 버튼 */}
          <div className="flex space-x-1 sm:space-x-1.5 md:space-x-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-600 px-1.5 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 text-xs sm:text-sm md:text-sm whitespace-nowrap w-auto min-w-[50px] max-w-[70px] sm:min-w-[60px] sm:max-w-[90px] md:min-w-0 md:max-w-none"
            >
              <i className="ri-delete-bin-line sm:mr-1 md:mr-2 text-xs sm:text-sm"></i>
              <span className="hidden sm:inline md:inline">전체 삭제</span>
              <span className="sm:hidden">삭제</span>
            </Button>
            <Button
              size="sm"
              onClick={onNewFortune}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-1.5 sm:px-2 md:px-3 lg:px-4 py-1.5 sm:py-2 md:py-2.5 lg:py-2 text-xs sm:text-sm md:text-sm whitespace-nowrap w-auto min-w-[50px] max-w-[70px] sm:min-w-[60px] sm:max-w-[90px] md:min-w-0 md:max-w-none"
            >
              <i className="ri-add-line sm:mr-1 md:mr-2 text-xs sm:text-sm"></i>
              <span className="text-xs sm:text-sm">새 운세</span>
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

export default memo(FilterAndSearchBar);