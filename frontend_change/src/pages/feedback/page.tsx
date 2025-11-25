import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import Card from '../../components/base/Card';
import Header from '../../components/feature/Header';
import { supabase } from '../../supabaseClient';
import PageTitle from './components/PageTitle';
import LoadingState from './components/LoadingState';
import LoginRequired from './components/LoginRequired';
import SubmissionSuccess from './components/SubmissionSuccess';
import FeedbackType from './components/FeedbackType';
import Rating from './components/Rating';
import MessageInput from './components/MessageInput';
import EmailInput from './components/EmailInput';
import SubmitButtons from './components/SubmitButtons';

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 로그인 상태 체크
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Supabase 세션 확인
        const { data: auth } = await supabase.auth.getUser();
        let userId = auth?.user?.id;
        
        // Supabase 세션이 없으면 localStorage의 백엔드 로그인 정보 확인
        if (!userId) {
          const backendAuthData = localStorage.getItem('auth_backend_user');
          if (backendAuthData) {
            try {
              const backendUser = JSON.parse(backendAuthData);
              userId = backendUser.id;
            } catch (e) {
              console.error('[Feedback] localStorage 파싱 실패:', e);
            }
          }
        }
        
        setIsLoggedIn(!!userId);
      } catch (error) {
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // EmailJS로 피드백 전송 (임시로 직접 값 사용)
      await emailjs.send(
        'service_sr0er1a',
        'template_ymik2rf',
        {
          feedback_type: feedback.type,
          rating: feedback.rating,
          message: feedback.message,
          user_email: feedback.email || '미제공',
          timestamp: new Date().toLocaleString('ko-KR')
        },
        'lnlCJFmsv00sk7C0l'
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



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <Header />
        <LoadingState />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <Header />
        <LoginRequired />
      </div>
    );
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