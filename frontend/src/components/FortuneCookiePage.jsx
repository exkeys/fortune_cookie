
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import FortuneCookie from './FortuneCookie';
import PageLayout from './common/PageLayout';
import Button from './common/Button';
import ShareModal from './ShareModal';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { useNavigation } from '../hooks/useNavigation';
import { MESSAGES } from '../constants';


const FortuneCookiePage = () => {
  const location = useLocation();
  const { role, concern, answer } = location.state || {};
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'success', 'error'
  const [saved, setSaved] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const { user } = useAuth();
  const { saveConcern } = useApi();
  const { goTo } = useNavigation();

  const handleSave = async () => {
    if (saved || !user) return;
    
    setSaveStatus('saving');
    try {
      const { error } = await saveConcern(role, concern, answer, user.id);
      
      if (error) {
        setSaveStatus('error');
      } else {
        setSaveStatus('success');
        setSaved(true);
      }
    } catch (e) {
      setSaveStatus('error');
    }
  };

  const handleRetry = () => {
    goTo.role();
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleFinish = () => {
    goTo.home();
  };

  return (
    <PageLayout style={{ justifyContent: 'center' }}>
      <FortuneCookie answer={answer} />
      <div
        style={{
          marginTop: 350,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          alignItems: 'center',
          width: '100%',
          maxWidth: 900,
        }}
      >
        {/* 첫 번째 줄: 다시 질문하기, 저장하기 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 16,
            width: '100%',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Button
            onClick={handleRetry}
            variant="primary"
            size="medium"
            style={{
              minWidth: '180px',
              height: '60px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 12,
              padding: '8px 24px',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            🔄 다시 질문하기
          </Button>
          <Button
            onClick={handleSave}
            disabled={saved || saveStatus === 'saving'}
            variant="secondary"
            size="medium"
            style={{
              minWidth: '150px',
              height: '60px',
              background: saved
                ? '#4caf50'
                : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '8px 24px',
              fontWeight: 700,
              boxShadow: saved
                ? '0 4px 15px rgba(76, 175, 80, 0.3)'
                : '0 4px 15px rgba(240, 147, 251, 0.3)',
              transition: 'all 0.3s ease',
              cursor: saved ? 'default' : 'pointer',
              flexShrink: 0,
            }}
          >
            {saveStatus === 'saving'
              ? '⏳ 저장 중...'
              : saved
              ? '✅ 저장됨'
              : '💾 저장하기'}
          </Button>
        </div>
        {/* 두 번째 줄: 공유하기, 마침 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 16,
            width: '100%',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Button
            onClick={handleShare}
            variant="secondary"
            size="medium"
            style={{
              minWidth: '150px',
              height: '60px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)',
              transition: 'all 0.3s ease',
              flexShrink: 0,
            }}
          >
            📤 공유하기
          </Button>
          <Button
            onClick={handleFinish}
            variant="secondary"
            size="medium"
            style={{
              minWidth: '150px',
              height: '60px',
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              color: '#333',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(168, 237, 234, 0.3)',
              transition: 'all 0.3s ease',
              flexShrink: 0,
            }}
          >
            🏠 마침
          </Button>
        </div>
      </div>
      {saveStatus === 'error' && (
        <div style={{ 
          color: 'red', 
          marginTop: 16, 
          fontWeight: 600,
          textAlign: 'center'
        }}>
          {MESSAGES.error.saveFailed}
        </div>
      )}
      
      {/* 공유 모달 */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareData={{ role, concern, answer }}
      />
    </PageLayout>
  );
}

export default FortuneCookiePage;
