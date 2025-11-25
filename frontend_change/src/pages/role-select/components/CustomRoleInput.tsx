
import Card from '../../../components/base/Card';

interface CustomRoleInputProps {
  customRole: string;
  onCustomRoleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave?: () => void;
  onClose?: () => void;
}

export default function CustomRoleInput({ customRole, onCustomRoleChange, onSave, onClose }: CustomRoleInputProps) {
  return (
  <Card className="p-3 md:p-4 lg:p-5 pb-10 md:pb-12 lg:pb-14 mb-6 bg-white border-gray-100 max-w-md mx-auto relative">
      {/* 닫기 버튼: 오른쪽 위 */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors duration-200 z-10"
          aria-label="닫기"
          title="닫기"
        >
          <i className="ri-close-line text-base md:text-lg"></i>
        </button>
      )}
      <div className="flex flex-col items-center mb-3">
        {/* 이모지/아이콘 영역 */}
        <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-2xl md:text-3xl lg:text-4xl mb-2 shadow-lg">
          <i className="ri-user-line"></i>
        </div>
        <h3 className="text-base md:text-lg lg:text-xl font-bold text-gray-800 mb-1">어떤 역할인가요?</h3>
        <p className="text-xs md:text-sm lg:text-base text-gray-600">예: 요리사, 간호사, 작가, 운동선수 등</p>
      </div>
      <div className="max-w-xs mx-auto">
        <input
          type="text"
          value={customRole}
          onChange={onCustomRoleChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSave) {
              e.preventDefault();
              onSave();
            }
          }}
          placeholder="역할을 입력해주세요"
          className="w-full p-2 md:p-3 lg:p-4 text-sm md:text-base lg:text-lg border-2 border-gray-200 rounded-xl focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all duration-300 text-gray-800 placeholder-gray-400 text-center"
          maxLength={20}
          autoFocus
        />
      </div>
      {/* 저장 버튼: 오른쪽 하단 */}
      <button
        type="button"
        className="absolute bottom-0 md:bottom-1 lg:bottom-2 right-3 px-3 py-1 text-xs md:text-sm rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-bold shadow border-none hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-1"
        style={{ minWidth: 56 }}
        onClick={() => {
          if (onSave) {
            onSave();
          }
        }}
        aria-label="역할 저장"
        title="역할 저장"
      >
        <i className="ri-save-line text-base"></i>
        저장
      </button>
    </Card>
  );
}