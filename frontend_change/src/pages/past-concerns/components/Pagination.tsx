interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center mt-10 lg:mt-14 xl:mt-16">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-amber-500 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
        >
          <i className="ri-arrow-left-s-line text-base"></i>
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
              className={`w-12 h-12 flex items-center justify-center rounded-full font-bold transition-all duration-200 text-base shadow-sm border ${
                currentPage === page
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white border-amber-400 scale-105 shadow-lg'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600'
              }`}
              style={{ minWidth: '3rem', minHeight: '3rem' }}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-amber-500 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
        >
          <i className="ri-arrow-right-s-line text-base"></i>
        </button>
      </div>
    </div>
  );
}