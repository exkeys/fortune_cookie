
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/base/Button';
import Card from '../../components/base/Card';
import Header from '../../components/feature/Header';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState({
    type: 'suggestion',
    rating: 5,
    message: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 실제로는 API로 피드백 전송
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // 3초 후 자동으로 홈으로 이동
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }, 1500);
  };

  const handleRatingClick = (rating: number) => {
    setFeedback(prev => ({ ...prev, rating }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="p-12 text-center">
            <div className="text-6xl mb-6">✨</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              소중한 의견 감사합니다!
            </h2>
            <p className="text-gray-600 mb-6">
              더 나은 운세쿠키 서비스를 만들기 위해<br />
              소중히 활용하겠습니다.
            </p>
            <Button onClick={() => navigate('/')}>
              홈으로 돌아가기
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">피드백</h1>
          <p className="text-gray-600">
            운세쿠키를 더 좋게 만들어주세요
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 피드백 유형 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                피드백 유형
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'suggestion', label: '개선 제안', icon: 'ri-lightbulb-line' },
                  { value: 'bug', label: '버그 신고', icon: 'ri-bug-line' },
                  { value: 'compliment', label: '칭찬', icon: 'ri-heart-line' },
                  { value: 'other', label: '기타', icon: 'ri-chat-1-line' }
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFeedback(prev => ({ ...prev, type: type.value }))}
                    className={`p-3 rounded-lg border transition-all duration-300 flex items-center space-x-2 ${
                      feedback.type === type.value
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <i className={`${type.icon} w-5 h-5 flex items-center justify-center`}></i>
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 만족도 평가 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                전체적인 만족도
              </label>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleRatingClick(rating)}
                    className={`w-10 h-10 rounded-full transition-all duration-300 ${
                      rating <= feedback.rating
                        ? 'text-amber-400 hover:text-amber-500'
                        : 'text-gray-300 hover:text-gray-400'
                    }`}
                  >
                    <i className="ri-star-fill text-2xl"></i>
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">
                {feedback.rating}점 / 5점
              </p>
            </div>

            {/* 상세 메시지 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                자세한 의견 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={feedback.message}
                onChange={(e) => setFeedback(prev => ({ ...prev, message: e.target.value }))}
                placeholder="운세쿠키에 대한 솔직한 의견을 들려주세요..."
                rows={5}
                required
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {feedback.message.length}/500자
              </p>
            </div>

            {/* 이메일 (선택) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                이메일 (선택사항)
              </label>
              <input
                type="email"
                value={feedback.email}
                onChange={(e) => setFeedback(prev => ({ ...prev, email: e.target.value }))}
                placeholder="답변이 필요한 경우 이메일을 입력해주세요"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent"
              />
            </div>

            {/* 제출 버튼 */}
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || !feedback.message.trim()}
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
          </form>
        </Card>
      </div>
    </div>
  );
}
