import Card from '../../../components/base/Card';

interface Role {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

interface HistoryItem {
  id: string;
  date: string;
  role?: Role;
  concern?: string;
  fortune: string;
}

interface PastConcernCardProps {
  item: HistoryItem;
  index: number;
  startIndex: number;
  viewMode: 'grid' | 'list';
  formatDate: (dateString: string) => string;
  onItemClick: (item: HistoryItem) => void;
  onShareClick: (item: HistoryItem, e: React.MouseEvent) => void;
  onDeleteClick: (id: string, e: React.MouseEvent) => void;
}

export default function PastConcernCard({
  item,
  index,
  startIndex,
  viewMode,
  formatDate,
  onItemClick,
  onShareClick,
  onDeleteClick
}: PastConcernCardProps) {
  if (viewMode === 'grid') {
    return (
      <Card
        hover
        className="group p-3 lg:p-4 xl:p-5 bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden"
        onClick={() => onItemClick(item)}
      >
        {/* 배경 그라데이션 */}
        <div className={`absolute inset-0 bg-gradient-to-br ${item.role?.color || 'from-gray-200 to-gray-300'} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
        
        {/* 순서 번호 */}
        <div className="absolute top-2 right-2 w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-xs lg:text-sm xl:text-base font-bold shadow-lg">
          {startIndex + index + 1}
        </div>

        <div className="relative z-10">
          {/* 역할 섹션 */}
          <div className="flex items-center space-x-1 lg:space-x-2 xl:space-x-2 mb-2">
            {item.role && (
              <div className={`w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 rounded bg-gradient-to-r ${item.role.color} flex items-center justify-center text-white shadow-lg`}>
                {item.role.id === 'ceo' ? (
                  <span className="text-sm lg:text-base xl:text-lg">👑</span>
                ) : (
                  <i className={`${item.role.icon} text-sm lg:text-base xl:text-lg`}></i>
                )}
              </div>
            )}
            <div>
              <h3 className="font-bold text-gray-800 text-sm lg:text-base xl:text-lg">
                {item.role?.name || '일반 상담'}
              </h3>
              <span className="text-xs lg:text-sm xl:text-base text-gray-500">
                {formatDate(item.date)}
              </span>
            </div>
          </div>
          
          {/* 고민 내용 */}
          {item.concern && (
            <div className="mb-2">
              <p className="text-xs lg:text-sm xl:text-base text-gray-600 line-clamp-2 bg-gray-50 p-1 lg:p-2 xl:p-2 rounded border border-gray-100">
                💭 {item.concern}
              </p>
            </div>
          )}
          
          {/* 운세 내용 */}
          <div className="mb-2">
            <p className="text-xs lg:text-sm xl:text-base text-gray-700 line-clamp-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-1 lg:p-2 xl:p-2 rounded border-l-2 border-blue-400">
              "✨ {item.fortune}"
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-between items-center pt-1 border-t border-gray-100">
            <div className="flex space-x-1">
              <button
                onClick={(e) => onShareClick(item, e)}
                className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 flex items-center justify-center rounded bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors duration-300"
              >
                <i className="ri-share-line text-xs lg:text-sm xl:text-base"></i>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onItemClick(item);
                }}
                className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 flex items-center justify-center rounded bg-green-50 text-green-500 hover:bg-green-100 transition-colors duration-300"
              >
                <i className="ri-eye-line text-xs lg:text-sm xl:text-base"></i>
              </button>
            </div>
            
            <button
              onClick={(e) => onDeleteClick(item.id, e)}
              className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 flex items-center justify-center rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors duration-300 opacity-0 group-hover:opacity-100"
            >
              <i className="ri-delete-bin-line text-xs lg:text-sm xl:text-base"></i>
            </button>
          </div>
        </div>
      </Card>
    );
  }

  // 리스트 뷰
  return (
    <Card
      hover
      className="group p-3 lg:p-4 xl:p-5 bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
      onClick={() => onItemClick(item)}
    >
      <div className="flex items-start space-x-2 lg:space-x-3 xl:space-x-4">
        {/* 순서 번호 */}
        <div className="flex-shrink-0 w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded flex items-center justify-center font-bold shadow-lg text-xs lg:text-sm xl:text-base">
          {startIndex + index + 1}
        </div>

        {/* 역할 아이콘 */}
        {item.role && (
          <div className={`w-7 h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9 rounded bg-gradient-to-r ${item.role.color} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
            {item.role.id === 'ceo' ? (
              <span className="text-sm lg:text-base xl:text-lg">👑</span>
            ) : (
              <i className={`${item.role.icon} text-sm lg:text-base xl:text-lg`}></i>
            )}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {/* 헤더 */}
          <div className="flex justify-between items-start mb-1">
            <div>
              <h3 className="font-bold text-gray-800 text-sm lg:text-base xl:text-lg mb-1">
                {item.role?.name || '일반 상담'}
              </h3>
              <span className="text-xs lg:text-sm xl:text-base text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {formatDate(item.date)}
              </span>
            </div>
            
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={(e) => onShareClick(item, e)}
                className="w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 flex items-center justify-center rounded bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors duration-300"
              >
                <i className="ri-share-line text-xs lg:text-sm xl:text-base"></i>
              </button>
              <button
                onClick={(e) => onDeleteClick(item.id, e)}
                className="w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 flex items-center justify-center rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors duration-300"
              >
                <i className="ri-delete-bin-line text-xs lg:text-sm xl:text-base"></i>
              </button>
            </div>
          </div>
          
          {/* 고민 내용 */}
          {item.concern && (
            <div className="mb-1">
              <p className="text-xs lg:text-sm xl:text-base text-gray-600 line-clamp-1 bg-gray-50 p-1 lg:p-2 xl:p-2 rounded border border-gray-100">
                💭 {item.concern}
              </p>
            </div>
          )}
          
          {/* 운세 미리보기 */}
          <p className="text-xs lg:text-sm xl:text-base text-gray-700 line-clamp-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-1 lg:p-2 xl:p-2 rounded border-l-2 border-blue-400">
            "✨ {item.fortune}"
          </p>
        </div>
      </div>
    </Card>
  );
}