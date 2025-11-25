import Button from '../../../components/base/Button';

interface NextButtonProps {
  selectedRole: string;
  customRole: string;
  onNext: () => void;
}

export default function NextButton({ selectedRole, customRole, onNext }: NextButtonProps) {
  const isNextButtonEnabled = () => {
    if (!selectedRole) return false;
    if (selectedRole === 'other') {
      return customRole.trim().length > 0;
    }
    return true;
  };

  return (
    <div className="text-center">
      <Button
        size="lg"
        disabled={!isNextButtonEnabled()}
        onClick={onNext}
        className="shadow-xl text-lg md:text-xl lg:text-2xl px-10 py-5 md:px-12 md:py-6"
      >
        <span className="flex items-center space-x-3">
          <span>다음 단계로</span>
          <i className="ri-arrow-right-line text-xl md:text-2xl lg:text-3xl"></i>
        </span>
      </Button>
      
      {selectedRole === 'other' && !customRole.trim() && (
        <p className="mt-4 text-base md:text-lg lg:text-xl text-amber-600">
          💡 역할을 입력해주세요
        </p>
      )}
    </div>
  );
}