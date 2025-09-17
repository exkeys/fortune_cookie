import React from 'react';
import { useLocation } from 'react-router-dom';
import FortuneCookie from './FortuneCookie';

function FortuneCookiePage() {
  const location = useLocation();
  const { role, concern, answer } = location.state || {};

  return (
    <div
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        height: '100vh',
        width: '100vw',
        background: '#fffbe6',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden',
      }}
    >
      <FortuneCookie answer={answer} />
    </div>
  );
}

export default FortuneCookiePage;
