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
  cancelButtonText?: string; // 취소 버튼 텍스트 커스터마이징
}

export default function AccessModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  icon,
  actionButton,
  cancelButtonText = "메인으로 돌아가기 🏠"
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
          className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 transform transition-all"
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
            <div className="flex flex-row gap-4 justify-center">
              {actionButton && (
                <button
                  onClick={actionButton.onClick}
                  className="flex-1 max-w-xs px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
                >
                  {actionButton.text}
                </button>
              )}
              
              <button
                onClick={onClose}
                className="flex-1 max-w-xs px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-bold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl"
              >
                {cancelButtonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
