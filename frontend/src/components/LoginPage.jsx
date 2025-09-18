

import PageLayout from './common/PageLayout';
import Button from './common/Button';
import { useAuth } from '../hooks/useAuth';
import { MESSAGES } from '../constants';

const LoginPage = () => {
  const { user, isLoggedIn, login } = useAuth();

  const handleKakaoLogin = async () => {
    try {
      await login('kakao');
    } catch (error) {
      console.error('로그인 에러:', error);
    }
  };

  return (
    <PageLayout 
      title="로그인"
      style={{ background: '#f5f5f5' }}
    >
      {isLoggedIn ? (
        <div style={{ 
          marginTop: 32, 
          fontSize: 20, 
          color: '#009688', 
          fontWeight: 700, 
          textAlign: 'center' 
        }}>
          {user?.email || '로그인 완료!'}<br />
          <span style={{ fontSize: 24 }}>🎉</span> {MESSAGES.success.welcome}
        </div>
      ) : (
        <Button
          onClick={handleKakaoLogin}
          variant="secondary"
          size="small"
          style={{
            marginTop: 32,
            background: '#fee500',
            color: '#181600',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <span style={{ fontSize: 24 }}>🐤</span> 카카오로 로그인
        </Button>
      )}
    </PageLayout>
  );
}

export default LoginPage;
