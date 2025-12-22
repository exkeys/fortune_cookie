import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import Card from '../../components/base/Card';
import Header from '../../components/feature/Header';
import { useAuth } from '../../hooks/useAuth';
import PageTitle from './components/PageTitle';
import LoadingState from './components/LoadingState';
import SubmissionSuccess from './components/SubmissionSuccess';
import FeedbackType from './components/FeedbackType';
import Rating from './components/Rating';
import MessageInput from './components/MessageInput';
import EmailInput from './components/EmailInput';
import SubmitButtons from './components/SubmitButtons';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [feedback, setFeedback] = useState({
    type: 'suggestion',
    rating: 5,
    message: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 로그인되지 않은 사용자는 자동으로 홈으로 리다이렉트
  useEffect(() => {
    if (!authLoading && !user?.id) {
      navigate('/', { replace: true });
    }
  }, [authLoading, user?.id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // EmailJS로 피드백 전송
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        throw new Error('EmailJS 환경 변수가 설정되지 않았습니다.');
      }

      await emailjs.send(
        serviceId,
        templateId,
        {
          feedback_type: feedback.type,
          rating: feedback.rating,
          message: feedback.message,
          user_email: feedback.email || '미제공',
          timestamp: new Date().toLocaleString('ko-KR')
        },
        publicKey
      );

      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // 3초 후 자동으로 홈으로 이동
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('피드백 전송 실패:', error);
      setIsSubmitting(false);
      alert('피드백 전송에 실패했습니다. 다시 시도해주세요.');
    }
  };



  // 로딩 중이거나 로그인되지 않은 사용자는 리다이렉트되므로 여기서는 처리 불필요
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <Header />
        <LoadingState />
      </div>
    );
  }

  // 로그인되지 않은 사용자는 이미 리다이렉트되었으므로 여기서는 처리 불필요
  if (!user?.id) {
    return null;
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <Header />
        <SubmissionSuccess onNavigateHome={() => navigate('/')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <Header />
      
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 lg:py-12 max-w-4xl">
        <PageTitle />

        <Card className="p-4 sm:p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
            <FeedbackType 
              feedbackType={feedback.type}
              onTypeChange={(type) => setFeedback(prev => ({ ...prev, type }))}
            />

            <Rating 
              rating={feedback.rating}
              onRatingChange={(rating) => setFeedback(prev => ({ ...prev, rating }))}
            />

            <MessageInput 
              message={feedback.message}
              onMessageChange={(message) => setFeedback(prev => ({ ...prev, message }))}
            />

            <EmailInput 
              email={feedback.email}
              onEmailChange={(email) => setFeedback(prev => ({ ...prev, email }))}
            />

            <SubmitButtons 
              isSubmitting={isSubmitting}
              message={feedback.message}
              onCancel={() => navigate('/')}
            />
          </form>
        </Card>
      </div>
    </div>
  );
}