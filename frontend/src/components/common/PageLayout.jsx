import React from 'react';
import { commonStyles } from '../../styles/theme';

const PageLayout = ({ 
  children, 
  title, 
  showHeader = false,
  headerContent,
  style = {} 
}) => {
  return (
    <div style={{ ...commonStyles.fullScreen, ...style }}>
      {showHeader && (
        <div style={commonStyles.header}>
          {headerContent}
        </div>
      )}
      <div style={commonStyles.container}>
        {title && (
          <h1 style={commonStyles.title}>
            {title}
          </h1>
        )}
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
