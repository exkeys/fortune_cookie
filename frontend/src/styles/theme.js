import { COLORS, SIZES, LAYOUT } from '../constants';

// 공통 스타일 객체들
export const commonStyles = {
  fullScreen: {
    ...LAYOUT.fullScreen,
    background: COLORS.background,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  container: {
    ...LAYOUT.container,
    padding: '20px',
    maxWidth: '800px',
    width: '100%',
    
    '@media (max-width: 768px)': {
      padding: '16px',
      maxWidth: '100%',
    },
  },
  
  title: {
    fontSize: SIZES.fontSize.xxlarge,
    fontWeight: 800,
    color: COLORS.primary,
    margin: 0,
    marginBottom: SIZES.spacing.xxl,
    letterSpacing: 2,
    textShadow: `0 2px 8px ${COLORS.shadow}`,
    textAlign: 'center',
    width: '100%',
    wordBreak: 'keep-all',
    lineHeight: 1.4,
    whiteSpace: 'normal',
    overflow: 'visible',
    textOverflow: 'unset',
    padding: '0 10px',
    
    '@media (max-width: 768px)': {
      fontSize: '1.6rem',
      marginBottom: '1.5rem',
      letterSpacing: 1,
      lineHeight: 1.3,
      padding: '0 5px',
    },
    
    '@media (max-width: 480px)': {
      fontSize: '1.4rem',
      lineHeight: 1.2,
    },
  },
  
  input: {
    fontSize: SIZES.fontSize.medium,
    padding: SIZES.button.paddingInput,
    borderRadius: SIZES.borderRadius.medium,
    border: `1px solid ${COLORS.border}`,
    marginBottom: SIZES.spacing.md,
    width: '100%',
    maxWidth: '500px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '&:focus': {
      borderColor: COLORS.primary,
      boxShadow: `0 0 0 2px ${COLORS.primary}20`,
    },
    
    '@media (max-width: 768px)': {
      fontSize: '16px', // iOS 줌 방지
      padding: '12px 16px',
    },
  },
  
  errorText: {
    color: COLORS.error,
    marginBottom: SIZES.spacing.sm,
    fontSize: SIZES.fontSize.small,
    textAlign: 'center',
  },
  
  button: {
    padding: SIZES.button.padding,
    fontSize: SIZES.fontSize.large,
    borderRadius: SIZES.borderRadius.large,
    border: 'none',
    background: COLORS.white,
    color: COLORS.primaryLight,
    fontWeight: 800,
    marginTop: 0,
    cursor: 'pointer',
    boxShadow: `0 4px 16px ${COLORS.shadowLight}`,
    letterSpacing: 2,
    transition: 'background 0.2s, color 0.2s, transform 0.2s',
    minWidth: '120px',
    '&:hover': {
      background: COLORS.primaryHover,
      color: COLORS.primary,
      transform: 'translateY(-2px)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
    
    '@media (max-width: 768px)': {
      fontSize: '1rem',
      padding: '12px 20px',
      minWidth: '100px',
    },
  },
  
  buttonSmall: {
    padding: SIZES.button.paddingSmall,
    fontSize: SIZES.fontSize.medium,
    borderRadius: SIZES.borderRadius.small,
    border: 'none',
    background: COLORS.primary,
    color: COLORS.white,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: `0 2px 8px ${COLORS.shadow}`,
    transition: 'background 0.2s, transform 0.2s',
    '&:hover': {
      background: COLORS.primaryLight,
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  },
  
  header: {
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
    minWidth: 0,
  },
  
  userWelcome: {
    color: COLORS.text,
    fontWeight: 700,
    textShadow: '0 2px 8px #0008, 0 1px 0 #fff',
    background: 'transparent',
    fontSize: SIZES.fontSize.medium,
  },
};

// 반응형 스타일
export const responsiveStyles = {
  mobile: {
    title: {
      fontSize: SIZES.fontSize.xlarge,
      marginBottom: SIZES.spacing.lg,
    },
    input: {
      width: '90%',
      fontSize: SIZES.fontSize.small,
    },
    button: {
      padding: '14px 40px',
      fontSize: SIZES.fontSize.medium,
    },
  },
  tablet: {
    title: {
      fontSize: SIZES.fontSize.xxlarge * 0.8,
    },
  },
};
