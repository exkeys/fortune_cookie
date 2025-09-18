import React from 'react';
import { COLORS } from '../../constants';

const LoadingSpinner = ({ size = 40, color = COLORS.primary }) => {
  const spinnerStyle = {
    width: size,
    height: size,
    border: `3px solid ${color}20`,
    borderTop: `3px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={spinnerStyle} />
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
