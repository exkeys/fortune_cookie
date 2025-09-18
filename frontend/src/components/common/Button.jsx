import React from 'react';
import { commonStyles } from '../../styles/theme';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  loading = false,
  style = {},
  ...props 
}) => {
  const getButtonStyle = () => {
    const baseStyle = size === 'small' ? commonStyles.buttonSmall : commonStyles.button;
    
    const variantStyles = {
      primary: {
        background: disabled ? '#bdbdbd' : commonStyles.button.background,
        color: disabled ? '#666' : commonStyles.button.color,
        cursor: disabled ? 'not-allowed' : 'pointer',
      },
      secondary: {
        background: disabled ? '#bdbdbd' : '#ff9800',
        color: '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...style,
    };
  };

  return (
    <button
      style={getButtonStyle()}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? '로딩 중...' : children}
    </button>
  );
};

export default Button;
