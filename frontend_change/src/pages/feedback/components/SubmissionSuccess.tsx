import Button from '../../../components/base/Button';
import Card from '../../../components/base/Card';

interface SubmissionSuccessProps {
  onNavigateHome: () => void;
}

export default function SubmissionSuccess({ onNavigateHome }: SubmissionSuccessProps) {
  return (
    <div className="container mx-auto px-6 py-10 max-w-4xl">
      <Card className="p-12 text-center">
        <div className="text-6xl mb-6">✨</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          소중한 의견 감사합니다!
        </h2>
        <p className="text-base text-gray-600 mb-6">
          더 나은 포춘춘쿠키 서비스를 만들기 위해<br />
          소중히 활용하겠습니다.
        </p>
        <Button onClick={onNavigateHome}>
          홈으로 돌아가기
        </Button>
      </Card>
    </div>
  );
}