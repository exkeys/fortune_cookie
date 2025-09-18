import React from 'react';
import Button from './common/Button';

const MainButton = ({ children, onClick, ...props }) => {
  return (
    <Button
      onClick={onClick}
      variant="primary"
      size="large"
      style={{ marginLeft: '-60px' }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default MainButton;
