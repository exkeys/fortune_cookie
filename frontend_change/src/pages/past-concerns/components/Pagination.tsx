interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center mt-16 lg:mt-20 xl:mt-24">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-14 h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 flex items-center justify-center rounded-xl bg-white border-2 border-gray-200 text-gray-400 hover:text-amber-500 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm"
        >
          <i className="ri-arrow-left-s-line text-lg lg:text-xl xl:text-2xl"></i>
        </button>
        
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let page;
          if (totalPages <= 5) {
            page = i + 1;
          } else if (currentPage <= 3) {
            page = i + 1;
          } else if (currentPage >= totalPages - 2) {
            page = totalPages - 4 + i;
          } else {
            page = currentPage - 2 + i;
          }
          
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-14 h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 flex items-center justify-center rounded-xl font-bold transition-all duration-300 text-lg lg:text-xl xl:text-2xl ${
                currentPage === page
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg scale-110'
                  : 'bg-white border-2 border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600 shadow-sm'
              }`}
            >
              {page}
            </button>
          );
        })}
        
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="w-14 h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 flex items-center justify-center rounded-xl bg-white border-2 border-gray-200 text-gray-400 hover:text-amber-500 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm"
        >
          <i className="ri-arrow-right-s-line text-lg lg:text-xl xl:text-2xl"></i>
        </button>
      </div>
    </div>
  );
}