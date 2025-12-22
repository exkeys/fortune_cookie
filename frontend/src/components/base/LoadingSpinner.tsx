interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
}

export default function LoadingSpinner({ 
  message = '로딩 중...', 
  subMessage = '잠시만 기다려주세요'
}: LoadingSpinnerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="text-center">
        <div className="relative mb-6 flex justify-center">
          {/* iOS 스타일 스피너 - 노란색 */}
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-yellow-200 border-t-yellow-500"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{message}</h2>
        {subMessage && <p className="text-gray-600 text-sm">{subMessage}</p>}
      </div>
    </div>
  );
}

