

interface AiFeedModalProps {
  open: boolean;
  onClose: () => void;
  message: string;
}

export default function AiFeedModal({ open, onClose, message }: AiFeedModalProps) {
  if (!open) return null;
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>
        <div className="flex flex-col items-center">
          <div className="text-3xl mb-2">🤖</div>
          <h3 className="text-lg font-bold mb-2 text-gray-800">AI의 조언</h3>
          <div className="text-base text-gray-700 whitespace-pre-line text-left w-full">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}
