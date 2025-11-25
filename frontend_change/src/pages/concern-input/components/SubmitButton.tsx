import Button from '../../../components/base/Button';

interface SubmitButtonProps {
  concern: string;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export default function SubmitButton({ concern, isSubmitting, onSubmit }: SubmitButtonProps) {
  return (
    <div className="text-center">
      <Button
        size="md"
        disabled={!concern.trim() || isSubmitting}
        loading={isSubmitting}
        onClick={onSubmit}
        className="shadow-lg text-sm md:text-base lg:text-lg px-6 py-3 md:px-8 md:py-4"
      >
        {isSubmitting ? (
          <span>포춘쿠키 생성 중...</span>
        ) : (
          <span className="flex items-center space-x-2">
            <span>포춘쿠키 받기</span>
            <span className="text-lg md:text-xl lg:text-2xl">🥠</span>
          </span>
        )}
      </Button>
      
      {concern.trim() && (
        <p className="mt-3 text-xs md:text-sm lg:text-base text-amber-600">
          💡 팁: 구체적인 상황일수록 더 정확한 조언을 받을 수 있어요
        </p>
      )}
    </div>
  );
}