import React from 'react';
import MainButton from './MainButton';
import PageLayout from './common/PageLayout';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '../hooks/useNavigation';
import { MESSAGES } from '../constants';

const UserHeader = () => {
  const { user } = useAuth();

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      right: 32,
      zIndex: 201,
      background: 'transparent',
      padding: 0,
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      minWidth: 0
    }}>
      {user && (
        <span style={{ 
          color: '#111', 
          fontWeight: 700, 
          textShadow: '0 2px 8px #0008, 0 1px 0 #fff', 
          background: 'transparent', 
          fontSize: 18 
        }}>
          {user.user_metadata?.name || user.email || '사용자'}님, 환영합니다 🎉
        </span>
      )}
    </div>
  );
};

const IntroPage = ({ onMenuClick }) => {
  const { user, isLoggedIn, saveUserToDB } = useAuth();
  const { goTo } = useNavigation();

  const handleNext = async () => {
    if (!isLoggedIn) {
      alert(MESSAGES.validation.loginRequired);
      return;
    }
    
    try {
      const { error } = await saveUserToDB();
      if (error) {
        alert(MESSAGES.error.userSaveFailed);
        return;
      }
      
      goTo.main();
    } catch (err) {
      console.error('DB 저장 예외:', err);
      alert(MESSAGES.error.userSaveFailed);
    }
  };

  return (
    <>
      <UserHeader />
      <PageLayout
        title="오늘의 해답"
        showHeader={false}
        style={{ paddingTop: 80 }}
      >
        <div style={{ position: 'absolute', top: 16, right: 32, zIndex: 200 }}>
          <button
            aria-label="메뉴"
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: 36, 
              cursor: 'pointer', 
              color: '#ff9800', 
              padding: 8 
            }}
            onClick={onMenuClick}
          >
            &#9776;
          </button>
        </div>
        <div style={{ width: '100vw', display: 'flex', justifyContent: 'center' }}>
          <MainButton onClick={handleNext}>
            다음
          </MainButton>
        </div>
      </PageLayout>
    </>
  );
}

export default IntroPage;