import { useState, useEffect, useCallback } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  isTouchDevice: boolean;
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  deviceType: 'mobile' | 'tablet' | 'desktop';
  breakpoint: number;
  width: number;
  height: number;
}

interface AdaptiveConfig {
  mobileBreakpoint?: number;
  tabletBreakpoint?: number;
  enableAutoRotate?: boolean;
  debounceDelay?: number;
}

const defaultConfig: AdaptiveConfig = {
  mobileBreakpoint: 640,
  tabletBreakpoint: 1024,
  enableAutoRotate: true,
  debounceDelay: 150
};

export const useAdaptiveLayout = (config: AdaptiveConfig = {}) => {
  const mergedConfig = { ...defaultConfig, ...config };
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(getDeviceInfo());
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  function getDeviceInfo(): DeviceInfo {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = height > width;
    const isLandscape = !isPortrait;
    
    // Check for touch device
    const isTouchDevice = 
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0;

    // Determine screen size
    let screenSize: DeviceInfo['screenSize'];
    if (width < 640) screenSize = 'xs';
    else if (width < 768) screenSize = 'sm';
    else if (width < 1024) screenSize = 'md';
    else if (width < 1280) screenSize = 'lg';
    else if (width < 1536) screenSize = 'xl';
    else screenSize = '2xl';

    // Determine device type
    const isMobile = width < mergedConfig.mobileBreakpoint!;
    const isTablet = width >= mergedConfig.mobileBreakpoint! && width < mergedConfig.tabletBreakpoint!;
    const isDesktop = width >= mergedConfig.tabletBreakpoint!;
    
    let deviceType: DeviceInfo['deviceType'];
    if (isMobile) deviceType = 'mobile';
    else if (isTablet) deviceType = 'tablet';
    else deviceType = 'desktop';

    return {
      isMobile,
      isTablet,
      isDesktop,
      isPortrait,
      isLandscape,
      isTouchDevice,
      screenSize,
      deviceType,
      breakpoint: width,
      width,
      height
    };
  }

  // Debounced resize handler
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDeviceInfo(getDeviceInfo());
      }, mergedConfig.debounceDelay);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [mergedConfig.debounceDelay]);

  // Detect virtual keyboard on mobile
  useEffect(() => {
    if (!deviceInfo.isTouchDevice) return;

    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const threshold = 100; // Keyboard is likely visible if viewport shrinks by more than 100px
      
      if (viewportHeight - currentHeight > threshold) {
        setIsKeyboardVisible(true);
      } else {
        setIsKeyboardVisible(false);
      }
      
      setViewportHeight(currentHeight);
    };

    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', handleViewportChange);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
      };
    }
  }, [viewportHeight, deviceInfo.isTouchDevice]);

  // Utility functions
  const getColumns = useCallback(() => {
    switch (deviceInfo.screenSize) {
      case 'xs': return 1;
      case 'sm': return 2;
      case 'md': return 3;
      case 'lg': return 4;
      case 'xl': return 5;
      case '2xl': return 6;
      default: return 4;
    }
  }, [deviceInfo.screenSize]);

  const getGridCols = useCallback(() => {
    switch (deviceInfo.screenSize) {
      case 'xs': return 4;
      case 'sm': return 6;
      case 'md': return 8;
      case 'lg': return 12;
      case 'xl': return 12;
      case '2xl': return 12;
      default: return 12;
    }
  }, [deviceInfo.screenSize]);

  const getFontScale = useCallback(() => {
    if (deviceInfo.isMobile) return 0.875;
    if (deviceInfo.isTablet) return 0.9375;
    return 1;
  }, [deviceInfo.isMobile, deviceInfo.isTablet]);

  const getSpacing = useCallback(() => {
    if (deviceInfo.isMobile) return { xs: 8, sm: 12, md: 16, lg: 20, xl: 24 };
    if (deviceInfo.isTablet) return { xs: 12, sm: 16, md: 20, lg: 24, xl: 32 };
    return { xs: 16, sm: 20, md: 24, lg: 32, xl: 40 };
  }, [deviceInfo.isMobile, deviceInfo.isTablet]);

  const shouldShowSidebar = useCallback(() => {
    return deviceInfo.isDesktop || (deviceInfo.isTablet && deviceInfo.isLandscape);
  }, [deviceInfo.isDesktop, deviceInfo.isTablet, deviceInfo.isLandscape]);

  const shouldUseBottomNav = useCallback(() => {
    return deviceInfo.isMobile || (deviceInfo.isTablet && deviceInfo.isPortrait);
  }, [deviceInfo.isMobile, deviceInfo.isTablet, deviceInfo.isPortrait]);

  const getMaxContentWidth = useCallback(() => {
    switch (deviceInfo.screenSize) {
      case 'xs': return '100%';
      case 'sm': return '640px';
      case 'md': return '768px';
      case 'lg': return '1024px';
      case 'xl': return '1280px';
      case '2xl': return '1536px';
      default: return '1280px';
    }
  }, [deviceInfo.screenSize]);

  const getModalSize = useCallback(() => {
    if (deviceInfo.isMobile) {
      return {
        width: '100%',
        height: '100%',
        maxWidth: '100vw',
        maxHeight: '100vh',
        padding: '0',
        borderRadius: '0'
      };
    }
    if (deviceInfo.isTablet) {
      return {
        width: '90%',
        height: 'auto',
        maxWidth: '600px',
        maxHeight: '80vh',
        padding: '1.5rem',
        borderRadius: '0.75rem'
      };
    }
    return {
      width: '80%',
      height: 'auto',
      maxWidth: '800px',
      maxHeight: '80vh',
      padding: '2rem',
      borderRadius: '1rem'
    };
  }, [deviceInfo.isMobile, deviceInfo.isTablet]);

  return {
    ...deviceInfo,
    isKeyboardVisible,
    viewportHeight,
    getColumns,
    getGridCols,
    getFontScale,
    getSpacing,
    shouldShowSidebar,
    shouldUseBottomNav,
    getMaxContentWidth,
    getModalSize
  };
};