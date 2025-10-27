interface AccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon: string;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
}

export default function AccessModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  icon,
  actionButton 
}: AccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* 모달 컨테이너 */}
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div 
          className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 모달 헤더 */}
          <div className="text-center pt-8 pb-4">
            <div className="text-6xl mb-4">{icon}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {title}
            </h3>
          </div>
          
          {/* 모달 내용 */}
          <div className="px-6 pb-6">
            <div className="text-gray-600 text-center leading-relaxed mb-6 whitespace-pre-line">
              {message}
            </div>
            
            {/* 버튼 영역 */}
            <div className="flex flex-col space-y-3">
              {actionButton && (
                <button
                  onClick={actionButton.onClick}
                  className="w-full px-4 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
                >
                  {actionButton.text}
                </button>
              )}
              
              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
