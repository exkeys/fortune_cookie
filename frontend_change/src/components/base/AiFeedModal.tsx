import Card from '../base/Card';

interface AiFeedModalProps {
  content: string; // aiFeed 또는 message를 통일
  onClose: () => void;
  isOpen?: boolean; // open prop과 호환을 위해 optional로
  title?: string; // 제목 커스터마이징 (기본: "AI의 자세한 조언")
  variant?: 'default' | 'simple'; // 스타일 변형
}

/**
 * AI 피드/조언을 표시하는 공통 모달 컴포넌트
 */
export default function AiFeedModal({ 
  content, 
  onClose, 
  isOpen = true,
  title = "AI의 자세한 조언",
  variant = 'default'
}: AiFeedModalProps) {
  if (!isOpen) return null;

  // simple variant (fortune-cookie 스타일)
  if (variant === 'simple') {
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
              {content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // default variant (past-concerns 스타일 - 더 스타일이 있음)
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={(e) => {
        e.stopPropagation(); // 상위 모달로 이벤트 전파 방지
        onClose();
      }}
    >
      <Card 
        className="max-w-lg w-full max-h-[80vh] overflow-y-auto bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="text-2xl mr-2">🤖</div>
              <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          </div>
          
          {/* AI 피드 내용 */}
          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 p-6 rounded-xl border-l-4 border-blue-400">
            <div className="text-base text-gray-700 whitespace-pre-line text-left w-full leading-relaxed">
              {content}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

