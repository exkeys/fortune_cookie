import Card from '../../../components/base/Card';

interface AiFeedModalProps {
  aiFeed: string;
  onClose: () => void;
}

export default function AiFeedModal({ aiFeed, onClose }: AiFeedModalProps) {
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
              <h3 className="text-lg font-bold text-gray-800">AI의 자세한 조언</h3>
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
              {aiFeed}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
