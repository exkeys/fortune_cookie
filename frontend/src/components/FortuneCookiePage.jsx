
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import FortuneCookie from './FortuneCookie';
import PageLayout from './common/PageLayout';
import Button from './common/Button';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { useNavigation } from '../hooks/useNavigation';
import { MESSAGES } from '../constants';


const FortuneCookiePage = () => {
  const location = useLocation();
  const { role, concern, answer } = location.state || {};
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'success', 'error'
  const [saved, setSaved] = useState(false);
  
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

  const handleFinish = () => {
    goTo.home();
  };

  return (
    <PageLayout style={{ justifyContent: 'center' }}>
      <FortuneCookie answer={answer} />
      <div style={{ 
        marginTop: 40, 
        display: 'flex', 
        gap: 24, 
        justifyContent: 'center',
        width: '100%'
      }}>
        <Button
          onClick={handleSave}
          disabled={saved || saveStatus === 'saving'}
          variant="secondary"
          size="small"
          style={{
            background: saved ? '#4caf50' : undefined,
            color: saved ? '#fff' : undefined,
            cursor: saved ? 'default' : 'pointer',
          }}
        >
          {saveStatus === 'saving' ? MESSAGES.loading.saving : 
           saved ? '✅ ' + MESSAGES.success.saved : '저장하기'}
        </Button>
        <Button
          onClick={handleFinish}
          variant="secondary"
          size="small"
        >
          마침
        </Button>
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
    </PageLayout>
  );
}

export default FortuneCookiePage;
