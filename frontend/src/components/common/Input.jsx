import React, { forwardRef } from 'react';
import { commonStyles } from '../../styles/theme';

const Input = forwardRef(({ 
  value, 
  onChange, 
  placeholder, 
  error, 
  disabled = false,
  style = {},
  ...props 
}, ref) => {
  const inputStyle = {
    ...commonStyles.input,
    ...(error && { borderColor: '#ff0000' }),
    ...(disabled && { 
      backgroundColor: '#f5f5f5', 
      cursor: 'not-allowed',
      opacity: 0.6 
    }),
    ...style,
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <input
        ref={ref}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={inputStyle}
        {...props}
      />
      {error && (
        <div style={commonStyles.errorText}>
          {error}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
