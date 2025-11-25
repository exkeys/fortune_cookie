 
 
import { Search } from 'lucide-react';

interface EmptyStateProps {
  isLoggedIn: boolean;
  onNavigateHome: () => void;
  hasNoRecords?: boolean; // 실제 기록이 없는지 여부 (검색 결과가 없는 경우와 구분)
}

export default function EmptyState({ isLoggedIn, onNavigateHome, hasNoRecords = true }: EmptyStateProps) {
  if (!isLoggedIn) return null;

  // 검색 결과가 없는 경우
  if (!hasNoRecords) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100">
          <div className="px-10 py-20 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
                No results found
              </h3>
              <p className="text-gray-500 text-base leading-relaxed max-w-md mx-auto">
                검색어나 필터를 조정하여 다시 시도해보세요
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 실제 기록이 없는 경우
  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-yellow-100">
        {/* 이미지 영역 (상단) */}
        <div className="bg-gradient-to-br from-yellow-200 via-amber-200 to-yellow-300 px-12 py-16 md:px-16 md:py-20 flex items-center justify-center">
          <div className="text-center">
            <div className="text-7xl md:text-9xl mb-6 animate-bounce-slow">🥠</div>
            <div className="space-x-3">
              <span className="inline-block px-4 py-1.5 bg-white/80 rounded-full text-sm md:text-base font-semibold text-gray-700">
                ✨ AI 조언
              </span>
              <span className="inline-block px-4 py-1.5 bg-white/80 rounded-full text-sm md:text-base font-semibold text-gray-700">
                🎯 맞춤 운세
              </span>
            </div>
          </div>
        </div>

        {/* 텍스트 영역 (하단) */}
        <div className="p-10 md:p-14 text-center space-y-4">
          <div className="inline-block px-4 py-1.5 bg-yellow-100 rounded-full text-sm md:text-base font-semibold text-yellow-700 uppercase tracking-widest mb-2">
            NEW
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            첫 운세쿠키를 열어보세요
          </h3>
          <p className="text-gray-600 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
            오늘 당신을 위한 특별한 메시지가 준비되어 있어요
          </p>
          <button
            onClick={onNavigateHome}
            className="w-full md:w-auto px-12 py-5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-xl text-lg transition-colors shadow-lg"
          >
            지금 바로 시작하기 →
          </button>
        </div>
      </div>
    </div>
  );
}