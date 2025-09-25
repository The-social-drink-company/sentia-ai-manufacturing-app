import { useState, useEffect } from 'react';

const getDevice = () => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

const getOrientation = () => {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

export const useResponsive = () => {
  const [device, setDevice] = useState(getDevice());
  const [orientation, setOrientation] = useState(getOrientation());
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setDevice(getDevice());
      setOrientation(getOrientation());
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Debounce resize events
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return {
    isMobile: device === 'mobile',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    device,
    orientation,
    dimensions,
    isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  };
};
