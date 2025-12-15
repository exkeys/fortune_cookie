import { useState, useEffect } from 'react';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * 반응형 화면 크기를 감지하는 훅
 * @param mobileBreakpoint 모바일 최대 너비 (기본: 768px)
 * @param tabletBreakpoint 태블릿 최대 너비 (기본: 1024px)
 * @returns {ResponsiveState} isMobile, isTablet, isDesktop
 */
export const useResponsive = (
  mobileBreakpoint: number = 768,
  tabletBreakpoint: number = 1024
): ResponsiveState => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= mobileBreakpoint);
      setIsTablet(width > mobileBreakpoint && width <= tabletBreakpoint);
      setIsDesktop(width > tabletBreakpoint);
    };

    // 초기 체크
    checkScreenSize();

    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [mobileBreakpoint, tabletBreakpoint]);

  return { isMobile, isTablet, isDesktop };
};

