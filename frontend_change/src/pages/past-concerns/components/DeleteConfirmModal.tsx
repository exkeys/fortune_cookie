import Button from '../../../components/base/Button';
import Card from '../../../components/base/Card';

interface DeleteConfirmModalProps {
  isDeleteAll: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  isDeleteAll,
  onConfirm,
  onCancel
}: DeleteConfirmModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <Card 
        className="p-8 max-w-md w-full bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-delete-bin-line text-2xl text-red-500"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            {isDeleteAll ? '모든 기록을 삭제하시겠습니까?' : '이 기록을 삭제하시겠습니까?'}
          </h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {isDeleteAll 
              ? '모든 운세 기록이 영구적으로 삭제되며, 이 작업은 되돌릴 수 없습니다.' 
              : '선택한 운세 기록이 영구적으로 삭제되며, 이 작업은 되돌릴 수 없습니다.'
            }
          </p>
          
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 bg-white hover:bg-gray-50"
            >
              취소
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-red-500 hover:bg-red-600 focus:ring-red-200"
            >
              <i className="ri-delete-bin-line mr-2"></i>
              삭제
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}