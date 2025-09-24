import Button from '../../../components/base/Button';
import Card from '../../../components/base/Card';

interface Role {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

interface HistoryItem {
  id: string;
  date: string;
  role?: Role;
  concern?: string;
  fortune: string;
}

interface DetailModalProps {
  item: HistoryItem;
  formatDate: (dateString: string) => string;
  onClose: () => void;
  onShare: () => void;
  onNewFortune: () => void;
  onDelete: () => void;
}

export default function DetailModal({
  item,
  formatDate,
  onClose,
  onShare,
  onNewFortune,
  onDelete
}: DetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white">
        <div className="p-8">
          {/* 모달 헤더 */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center space-x-4">
              {item.role && (
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${item.role.color} flex items-center justify-center text-white shadow-lg`}>
                  {item.role.id === 'ceo' ? (
                    <span className="text-xl">👑</span>
                  ) : (
                    <i className={`${item.role.icon} text-xl`}></i>
                  )}
                </div>
              )}
              <div>
                <h3 className="font-bold text-gray-800 text-2xl mb-1">
                  {item.role?.name || '일반 상담'}
                </h3>
                <p className="text-gray-500">
                  {formatDate(item.date)}
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors duration-300"
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          </div>
          
          {/* 고민 내용 */}
          {item.concern && (
            <div className="mb-8">
              <h4 className="font-bold text-gray-800 mb-4 text-lg flex items-center">
                <i className="ri-question-line mr-2 text-blue-500"></i>
                나눈 고민
              </h4>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-l-4 border-blue-400">
                <p className="text-gray-700 leading-relaxed text-lg">
                  {item.concern}
                </p>
              </div>
            </div>
          )}
          
          {/* 운세 내용 */}
          <div className="mb-8">
            <h4 className="font-bold text-gray-800 mb-4 text-lg flex items-center">
              <i className="ri-magic-line mr-2 text-purple-500"></i>
              받은 조언
            </h4>
            <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6 rounded-xl border-l-4 border-purple-400 shadow-inner">
              <p className="text-gray-800 leading-relaxed font-medium text-lg">
                "✨ {item.fortune}"
              </p>
            </div>
          </div>
          
          {/* 액션 버튼들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={onShare}
              className="bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
            >
              <i className="ri-share-line mr-2"></i>
              운세 공유하기
            </Button>
            
            <Button
              variant="outline"
              onClick={onNewFortune}
              className="bg-white hover:bg-green-50 hover:border-green-300 hover:text-green-600"
            >
              <i className="ri-refresh-line mr-2"></i>
              비슷한 고민으로 새 운세 받기
            </Button>
            
            <Button
              variant="outline"
              onClick={onDelete}
              className="bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-600 md:col-span-2"
            >
              <i className="ri-delete-bin-line mr-2"></i>
              이 기록 삭제하기
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}