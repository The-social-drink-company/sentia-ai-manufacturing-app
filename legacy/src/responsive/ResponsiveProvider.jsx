// Enterprise Responsive Design Provider
// Advanced responsive design system with breakpoint management and device adaptation

import React, { createContext, useContext, useState, useEffect } from 'react';
import { logInfo } from '../services/observability/structuredLogger.js';

// Breakpoint definitions (mobile-first approach)
export const breakpoints = {
  xs: 0,      // Extra small devices (phones)
  sm: 640,    // Small devices (large phones) 
  md: 768,    // Medium devices (tablets)
  lg: 1024,   // Large devices (laptops)
  xl: 1280,   // Extra large devices (desktops)
  '2xl': 1536 // 2X Large devices (large desktops)
};

// Device type detection
const getDeviceType = (width) => {
  if (width < breakpoints.sm) return 'mobile';
  if (width < breakpoints.lg) return 'tablet';
  return 'desktop';
};

// Orientation detection
const getOrientation = () => {
  if (typeof window === 'undefined') return 'landscape';
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

// Touch capability detection
const getTouchCapability = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Responsive Context
const ResponsiveContext = createContext({
  // Current state
  breakpoint: 'lg',
  width: 1024,
  height: 768,
  deviceType: 'desktop',
  orientation: 'landscape',
  isTouch: false,
  pixelRatio: 1,
  
  // Breakpoint helpers
  isXs: false,
  isSm: false,
  isMd: false,
  isLg: false,
  isXl: false,
  is2Xl: false,
  
  // Device helpers
  isMobile: false,
  isTablet: false,
  isDesktop: false,
  isPortrait: false,
  isLandscape: true,
  
  // Grid system
  columns: 12,
  gutters: {
    xs: 16,
    sm: 16, 
    md: 24,
    lg: 32,
    xl: 32,
    '2xl': 32
  },
  
  // Container sizes
  containers: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  }
});

// Responsive Provider Component
export const ResponsiveProvider = ({ children }) => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  const [deviceInfo, setDeviceInfo] = useState({
    deviceType: 'desktop',
    orientation: 'landscape',
    isTouch: false,
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1
  });

  // Determine current breakpoint
  const getCurrentBreakpoint = (width) => {
    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'xs';
  };

  const currentBreakpoint = getCurrentBreakpoint(dimensions.width);

  // Update dimensions and device info
  useEffect(() => {
    const updateDimensions = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      const newOrientation = getOrientation();
      const newDeviceType = getDeviceType(newWidth);
      
      setDimensions({
        width: newWidth,
        height: newHeight
      });

      setDeviceInfo({
        deviceType: newDeviceType,
        orientation: newOrientation,
        isTouch: getTouchCapability(),
        pixelRatio: window.devicePixelRatio || 1
      });

      logInfo('Responsive breakpoint changed', {
        breakpoint: getCurrentBreakpoint(newWidth),
        width: newWidth,
        height: newHeight,
        deviceType: newDeviceType,
        orientation: newOrientation
      });
    };

    // Debounced resize handler
    let timeoutId;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDimensions, 100);
    };

    // Initial update
    updateDimensions();

    // Add event listeners
    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', () => {
      // Delay after orientation change to get correct dimensions
      setTimeout(updateDimensions, 150);
    });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, []);

  // Context value
  const contextValue = {
    // Current state
    breakpoint: currentBreakpoint,
    width: dimensions.width,
    height: dimensions.height,
    deviceType: deviceInfo.deviceType,
    orientation: deviceInfo.orientation,
    isTouch: deviceInfo.isTouch,
    pixelRatio: deviceInfo.pixelRatio,
    
    // Breakpoint helpers
    isXs: currentBreakpoint === 'xs',
    isSm: currentBreakpoint === 'sm',
    isMd: currentBreakpoint === 'md',
    isLg: currentBreakpoint === 'lg',
    isXl: currentBreakpoint === 'xl',
    is2Xl: currentBreakpoint === '2xl',
    
    // Breakpoint ranges
    isSmUp: dimensions.width >= breakpoints.sm,
    isMdUp: dimensions.width >= breakpoints.md,
    isLgUp: dimensions.width >= breakpoints.lg,
    isXlUp: dimensions.width >= breakpoints.xl,
    is2XlUp: dimensions.width >= breakpoints['2xl'],
    
    isSmDown: dimensions.width < breakpoints.md,
    isMdDown: dimensions.width < breakpoints.lg,
    isLgDown: dimensions.width < breakpoints.xl,
    isXlDown: dimensions.width < breakpoints['2xl'],
    
    // Device helpers
    isMobile: deviceInfo.deviceType === 'mobile',
    isTablet: deviceInfo.deviceType === 'tablet',
    isDesktop: deviceInfo.deviceType === 'desktop',
    isPortrait: deviceInfo.orientation === 'portrait',
    isLandscape: deviceInfo.orientation === 'landscape',
    
    // Grid system
    columns: 12,
    gutters: {
      xs: 16,
      sm: 16,
      md: 24,
      lg: 32,
      xl: 32,
      '2xl': 32
    },
    
    // Container sizes
    containers: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536
    },
    
    // Utility functions
    getCurrentGutter: () => {
      return contextValue.gutters[currentBreakpoint] 0;
    },
    
    getCurrentContainer: () => {
      return contextValue.containers[currentBreakpoint] || dimensions.width;
    },
    
    isBreakpoint: (bp) => currentBreakpoint === bp,
    isBreakpointUp: (bp) => dimensions.width >= breakpoints[bp],
    isBreakpointDown: (bp) => {
      const nextBp = Object.keys(breakpoints).find(
        key => breakpoints[key] > breakpoints[bp]
      );
      return nextBp ? dimensions.width < breakpoints[nextBp] : true;
    }
  };

  return (
    <ResponsiveContext.Provider value={contextValue}>
      {children}
    </ResponsiveContext.Provider>
  );
};

// Hook to use responsive context
export const useResponsive = () => {
  const context = useContext(ResponsiveContext);
  
  if (!context) {
    throw new Error('useResponsive must be used within ResponsiveProvider');
  }
  
  return context;
};

// Hook for specific breakpoint detection
export const useBreakpoint = (breakpoint) => {
  const { isBreakpoint, isBreakpointUp, isBreakpointDown } = useResponsive();
  
  return {
    is: isBreakpoint(breakpoint),
    up: isBreakpointUp(breakpoint),
    down: isBreakpointDown(breakpoint)
  };
};

// Hook for device type detection
export const useDevice = () => {
  const { deviceType, isMobile, isTablet, isDesktop, isTouch, orientation } = useResponsive();
  
  return {
    type: deviceType,
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape'
  };
};

// Hook for media queries in JavaScript
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (e) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
};

// Responsive Grid Components
export const Container = ({ 
  children, 
  maxWidth = 'xl', 
  className = '',
  fluid = false,
  ...props 
}) => {
  const { containers, width } = useResponsive();
  
  const maxWidthValue = fluid ? '100%' : `${containers[maxWidth] || containers.xl}px`;
  
  return (
    <div 
      className={`mx-auto px-4 sm:px-6 lg:px-8 ${className}`}
      style={{ maxWidth: maxWidthValue }}
      {...props}
    >
      {children}
    </div>
  );
};

export const Row = ({ 
  children, 
  className = '', 
  gutter = true,
  align = 'stretch',
  justify = 'start',
  ...props 
}) => {
  const { getCurrentGutter } = useResponsive();
  
  const gutterClass = gutter ? `gap-${getCurrentGutter() / 4}` : '';
  const alignClass = `items-${align}`;
  const justifyClass = `justify-${justify}`;
  
  return (
    <div 
      className={`flex flex-wrap ${gutterClass} ${alignClass} ${justifyClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const Col = ({ 
  children, 
  xs, sm, md, lg, xl, xl2,
  offset = {},
  className = '',
  ...props 
}) => {
  const { breakpoint } = useResponsive();
  
  // Determine column span for current breakpoint
  const getColumnSpan = () => {
    const spans = { xs, sm, md, lg, xl, '2xl': xl2 };
    
    // Find the appropriate span for current breakpoint
    const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);
    
    for (let i = currentIndex; i >= 0; i--) {
      const bp = breakpointOrder[i];
      if (spans[bp]) return spans[bp];
    }
    
    return xs 0; // Default to full width
  };
  
  const span = getColumnSpan();
  const widthPercentage = (span / 12) * 100;
  
  return (
    <div 
      className={`flex-shrink-0 px-2 ${className}`}
      style={{ 
        width: `${widthPercentage}%`,
        maxWidth: `${widthPercentage}%`
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// Responsive utility components
export const Show = ({ breakpoint, up = false, down = false, children }) => {
  const responsive = useResponsive();
  
  let shouldShow = false;
  
  if (up) {
    shouldShow = responsive.isBreakpointUp(breakpoint);
  } else if (down) {
    shouldShow = responsive.isBreakpointDown(breakpoint);
  } else {
    shouldShow = responsive.isBreakpoint(breakpoint);
  }
  
  return shouldShow ? children : null;
};

export const Hide = ({ breakpoint, up = false, down = false, children }) => {
  const responsive = useResponsive();
  
  let shouldHide = false;
  
  if (up) {
    shouldHide = responsive.isBreakpointUp(breakpoint);
  } else if (down) {
    shouldHide = responsive.isBreakpointDown(breakpoint);
  } else {
    shouldHide = responsive.isBreakpoint(breakpoint);
  }
  
  return shouldHide ? null : children;
};

export default ResponsiveProvider;
