import Button from '../../../components/base/Button';

interface SubmitButtonsProps {
  isSubmitting: boolean;
  message: string;
  onCancel: () => void;
}

export default function SubmitButtons({ isSubmitting, message, onCancel }: SubmitButtonsProps) {
  return (
    <div className="flex space-x-3">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="flex-1"
        disabled={isSubmitting}
      >
        취소
      </Button>
      <Button
        type="submit"
        className="flex-1"
        disabled={isSubmitting || !message.trim()}
      >
        {isSubmitting ? (
          <span className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>전송 중...</span>
          </span>
        ) : (
          '피드백 보내기'
        )}
      </Button>
    </div>
  );
}