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
    <Card className="p-16 md:p-20 lg:p-24 xl:p-28 bg-gradient-to-br from-white to-amber-50 max-w-4xl mx-auto">
      <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-800 mb-12">
        {isLoadingFortune ? 'AI가 운세를 생성하고 있어요...' : !isOpened ? '당신의 운세쿠키가 준비되었습니다!' : '운세를 확인하는 중...'}
      </h2>
      
      <div className="mb-16 transform scale-150 md:scale-175 lg:scale-200 xl:scale-225">
        <FortuneCookie 
          isOpening={isOpening}
          isOpened={isOpened}
          onCookieClick={onCookieClick}
        />
      </div>
      
      {isOpening && (
        <div className="flex justify-center items-center space-x-3 text-amber-600">
          <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-2 border-amber-600 border-t-transparent"></div>
          <span className="text-lg md:text-xl lg:text-2xl">마법의 조언을 준비하고 있어요...</span>
        </div>
      )}
    </Card>
  );
}