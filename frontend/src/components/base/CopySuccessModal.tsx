interface CopySuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string; // 커스텀 메시지 (선택)
}

/**
 * 복사 완료를 알리는 공통 모달 컴포넌트
 */
export default function CopySuccessModal({ 
  isOpen, 
  onClose,
  message 
}: CopySuccessModalProps) {
  if (!isOpen) return null;

  const defaultMessage = (
    <>
      클립보드에 복사되었습니다.<br />
      다른 곳에 붙여넣기하여 운세를 공유해보세요.
    </>
  );

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-[998]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 pointer-events-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">복사 완료!</h3>
            <p className="text-sm text-gray-600 mb-6">
              {message || defaultMessage}
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium text-sm"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

