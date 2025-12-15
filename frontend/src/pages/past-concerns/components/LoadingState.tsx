import Card from '../../../components/base/Card';

interface LoadingStateProps {}

export default function LoadingState({}: LoadingStateProps) {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <Card className="p-12 md:p-16 lg:p-20 text-center bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <div className="animate-spin rounded-full h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 border-4 border-amber-300 border-t-transparent mx-auto mb-6"></div>
        <p className="text-base md:text-lg lg:text-xl text-gray-600">운세 기록을 불러오고 있어요...</p>
      </Card>
    </div>
  );
}