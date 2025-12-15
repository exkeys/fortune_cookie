import Card from '../../../components/base/Card';

interface LoadingStateProps {}

export default function LoadingState({}: LoadingStateProps) {
  return (
    <div className="container mx-auto px-8 py-12 max-w-4xl">
      <Card className="p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-300 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">로딩 중...</p>
      </Card>
    </div>
  );
}