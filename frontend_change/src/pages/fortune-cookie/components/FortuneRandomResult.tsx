import { ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '../../../utils/apiClient';

interface FortuneRandomResultProps {
  fortuneMessage: string;
  user?: { id: string } | null;
  onPrevious: () => void;
  onNext: (randomFortune: string) => void;
}

export default function FortuneRandomResult({ 
  fortuneMessage,
  user,
  onPrevious,
  onNext
}: FortuneRandomResultProps) {
  const handleNextClick = async () => {
    // 다음 버튼 클릭 시 daily_usage_log에 사용 기록 추가
    if (user?.id) {
      try {
        const response = await apiFetch('/api/daily-usage-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('일일 사용 로그 기록 실패:', errorData);
        }
      } catch (error) {
        console.error('일일 사용 로그 API 호출 에러:', error);
      }
    }
    
    // 다음 페이지로 이동
    onNext(fortuneMessage);
  };

  return (
    <div className="relative bg-gradient-to-br from-white to-amber-50 rounded-3xl p-8 md:p-12 lg:p-16 shadow-2xl min-h-[600px] flex flex-col items-center justify-center transform scale-[1.04] sm:scale-[1.06] md:scale-[1.08] lg:scale-[1.1] origin-center">
      {/* 좌측 버튼 */}
      <button 
        onClick={onPrevious}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center group border border-amber-200"
        aria-label="이전"
      >
        <ChevronLeft size={24} className="text-amber-600 group-hover:text-amber-700" />
      </button>

      {/* 메인 컨텐츠 */}
      <div className="flex flex-col items-center space-y-8 max-w-2xl mx-auto text-center">
        {/* 쿠키 아이콘 */}
        <div className="text-8xl animate-bounce">🥠</div>

        {/* 제목 */}
        <div className="space-y-3">
          <h2 className="text-4xl md:text-5xl font-bold text-amber-900">당신의 운세</h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-amber-400 to-orange-400 mx-auto rounded-full"></div>
        </div>

        {/* 메시지 카드 */}
        <div className="w-full bg-white rounded-2xl p-8 md:p-10 shadow-xl border-2 border-amber-200">
          <p className="text-base sm:text-lg md:text-xl text-gray-800 leading-relaxed font-medium">
            {fortuneMessage}
          </p>
        </div>

        {/* 날짜 */}
        <p className="text-lg text-amber-700">
          {new Date().toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}
        </p>
      </div>

      {/* 우측 버튼 */}
      <button 
        onClick={handleNextClick}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center group"
        aria-label="다음"
      >
        <ChevronRight size={24} className="text-white" />
      </button>

      {/* 좌우 클릭 영역 힌트 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-amber-600 text-sm">
        <span>←</span>
        <span>클릭하여 이동</span>
        <span>→</span>
      </div>
    </div>
  );
}
