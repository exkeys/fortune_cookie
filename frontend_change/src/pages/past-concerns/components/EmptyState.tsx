 

interface EmptyStateProps {
  isLoggedIn: boolean;
  onNavigateHome: () => void;
}

export default function EmptyState({ isLoggedIn, onNavigateHome }: EmptyStateProps) {
  if (!isLoggedIn) return null;

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* 이미지 영역 (상단) */}
        <div className="bg-gradient-to-br from-yellow-200 to-yellow-300 px-10 py-12 md:px-12 md:py-14 flex items-center justify-center">
          <div className="text-center">
            <div className="text-7xl md:text-8xl mb-4 animate-bounce-slow">🥠</div>
            <div className="space-x-2">
              <span className="inline-block px-3 py-1 bg-white/80 rounded-full text-xs md:text-sm font-semibold text-gray-700">
                ✨ AI 조언
              </span>
              <span className="inline-block px-3 py-1 bg-white/80 rounded-full text-xs md:text-sm font-semibold text-gray-700">
                🎯 맞춤 운세
              </span>
            </div>
          </div>
        </div>

        {/* 텍스트 영역 (하단) */}
        <div className="p-8 md:p-10 text-center">
          <div className="inline-block px-3 py-1 bg-yellow-100 rounded-full text-xs md:text-sm font-semibold text-yellow-700 mb-3">
            NEW
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            첫 운세쿠키를 열어보세요
          </h3>
          <p className="text-gray-600 mb-6 text-base md:text-lg leading-relaxed">
            오늘 당신을 위한 특별한 메시지가 준비되어 있어요
          </p>
          <button
            onClick={onNavigateHome}
            className="w-full md:w-auto px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-lg transition-colors"
          >
            지금 바로 시작하기 →
          </button>
        </div>
      </div>
    </div>
  );
}