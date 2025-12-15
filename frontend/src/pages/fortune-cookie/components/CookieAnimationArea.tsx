import Card from '../../../components/base/Card';
import FortuneCookie from './FortuneCookie';

interface CookieAnimationAreaProps {
  isLoadingFortune: boolean;
  isOpened: boolean;
  isOpening: boolean;
  onCookieClick: () => void;
}

export default function CookieAnimationArea({ 
  isLoadingFortune, 
  isOpened, 
  isOpening, 
  onCookieClick 
}: CookieAnimationAreaProps) {
  return (
    <Card className="p-16 md:p-20 lg:p-24 xl:p-28 bg-gradient-to-br from-white to-amber-50 max-w-4xl mx-auto transform scale-[1.04] sm:scale-[1.06] md:scale-[1.08] lg:scale-[1.1] origin-center mt-16 sm:mt-0">
      <div className="mb-12 flex justify-center">
        <div className="inline-flex px-8 py-3 bg-white/80 rounded-2xl shadow-md ring-1 ring-amber-50/60 transform scale-105 sm:scale-110 md:scale-115 lg:scale-120 origin-center">
          <h2 className={`font-bold text-gray-800 text-center whitespace-nowrap ${
            isOpened 
              ? 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl' 
              : 'text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl'
          }`}>
            {isLoadingFortune ? '포춘쿠키를 준비하고 있어요...' : !isOpened ? '포춘쿠키가 준비되었습니다!' : '운세를 확인하는 중...'}
          </h2>
        </div>
      </div>
      
      <div className="mb-16 transform scale-150 md:scale-175 lg:scale-200 xl:scale-225">
        <FortuneCookie 
          isOpening={isOpening}
          isOpened={isOpened}
          onCookieClick={onCookieClick}
        />
      </div>
      
      {isOpening && (
        <div className="flex justify-center items-center space-x-3 text-amber-600">
          <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-2 border-amber-600 border-t-transparent" style={{ animationDuration: '0.5  s' }}></div>
          <span className="text-sm sm:text-base md:text-lg lg:text-xl">마법의 조언을 준비하고 있어요...</span>
        </div>
      )}
    </Card>
  );
}