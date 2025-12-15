import Button from '../../../components/base/Button';

interface ActionButtonsProps {
  onSaveAndViewHistory: () => void;
  onFinish: () => void;
}

export default function ActionButtons({ onSaveAndViewHistory, onFinish }: ActionButtonsProps) {
  return (
    <div className="flex justify-center space-x-4">
      <Button
        variant="outline"
        size="lg"
        onClick={onSaveAndViewHistory}
        className="text-base md:text-lg lg:text-xl px-6 py-3 md:px-8 md:py-4 bg-black text-white hover:bg-gray-800 border-black"
      >
        저장하기
      </Button>
      
      <Button
        size="lg"
        onClick={onFinish}
        className="text-base md:text-lg lg:text-xl px-6 py-3 md:px-8 md:py-4"
      >
        마침
      </Button>
    </div>
  );
}