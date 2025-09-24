import Button from '../../../components/base/Button';
import { useNavigate } from 'react-router-dom';

interface NavigationButtonsProps {}

export default function NavigationButtons({}: NavigationButtonsProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <Button
        onClick={() => navigate('/')}
        size="lg"
        className="text-xl md:text-2xl px-8 py-4 md:px-10 md:py-5"
      >
        🏠 홈으로 돌아가기
      </Button>
      
      <Button
        onClick={() => navigate(-1)}
        variant="outline"
        size="lg"
        className="text-xl md:text-2xl px-8 py-4 md:px-10 md:py-5"
      >
        ⬅️ 이전 페이지로
      </Button>
    </div>
  );
}