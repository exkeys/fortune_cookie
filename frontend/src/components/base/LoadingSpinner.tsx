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
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-300 border-t-amber-600 mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 bg-amber-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 animate-pulse">{message}</h2>
        {subMessage && <p className="text-gray-600 text-sm">{subMessage}</p>}
      </div>
    </div>
  );
}

