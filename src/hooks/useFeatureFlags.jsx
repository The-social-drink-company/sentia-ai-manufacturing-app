/**
 * Feature Flags Hook for PROMPT 8 Dashboard Overlay
 * Centralized feature flag management for UI enhancements
 */

import { useMemo } from 'react'

// Client-readable feature flags from environment
const FEATURE_FLAGS = {
  CFO_PRESET: import.meta.env.VITE_FEATURE_CFO_PRESET === 'true',
  GLOBAL_TABS: import.meta.env.VITE_FEATURE_GLOBAL_TABS === 'true',
  BOARD_EXPORT: import.meta.env.VITE_FEATURE_BOARD_EXPORT === 'true',
  TRUST_BADGES: import.meta.env.VITE_FEATURE_TRUST_BADGES === 'true',
  BENCHMARKS: import.meta.env.VITE_FEATURE_BENCHMARKS === 'true',
  
  // Performance features (always enabled for development)
  VIRTUALIZATION: true,
  MEMOIZATION: true,
  CODE_SPLITTING: true,
  
  // Accessibility features (always enabled)
  A11Y_ENHANCEMENTS: true,
  KEYBOARD_NAVIGATION: true,
  SCREEN_READER: true
}

// Share link TTL configuration
const SHARE_LINK_TTL_MINUTES = parseInt(
  import.meta.env.VITE_SHARE_LINK_TTL_MINUTES || '60', 
  10
)

/**
 * Hook to manage feature flags throughout the application
 */
export const useFeatureFlags = () => {
  const flags = useMemo(() => FEATURE_FLAGS, [])
  
  // Helper function to check if a feature is enabled
  const isEnabled = (featureName) => {
    return flags[featureName] === true
  }
  
  // Helper function to check multiple features at once
  const areEnabled = (featureNames) => {
    return featureNames.every(name => flags[name] === true)
  }
  
  // Helper function to get enabled features from a list
  const getEnabledFeatures = (featureNames) => {
    return featureNames.filter(name => flags[name] === true)
  }
  
  // Feature flag groups for easier management
  const groups = {
    cfoFeatures: ['CFO_PRESET', 'BOARD_EXPORT', 'BENCHMARKS'],
    globalFeatures: ['GLOBAL_TABS', 'TRUST_BADGES'],
    performanceFeatures: ['VIRTUALIZATION', 'MEMOIZATION', 'CODE_SPLITTING'],
    accessibilityFeatures: ['A11Y_ENHANCEMENTS', 'KEYBOARD_NAVIGATION', 'SCREEN_READER']
  }
  
  return {
    // Individual flags
    flags,
    
    // Helper functions
    isEnabled,
    areEnabled,
    getEnabledFeatures,
    
    // Feature groups
    groups,
    
    // Configuration values
    shareLinkTTL: SHARE_LINK_TTL_MINUTES,
    
    // Convenience getters for common feature checks
    get hasCFOPreset() { return flags.CFO_PRESET },
    get hasGlobalTabs() { return flags.GLOBAL_TABS },
    get hasBoardExport() { return flags.BOARD_EXPORT },
    get hasTrustBadges() { return flags.TRUST_BADGES },
    get hasBenchmarks() { return flags.BENCHMARKS },
    
    // Performance feature checks
    get hasVirtualization() { return flags.VIRTUALIZATION },
    get hasMemoization() { return flags.MEMOIZATION },
    get hasCodeSplitting() { return flags.CODE_SPLITTING },
    
    // Accessibility feature checks  
    get hasA11yEnhancements() { return flags.A11Y_ENHANCEMENTS },
    get hasKeyboardNavigation() { return flags.KEYBOARD_NAVIGATION },
    get hasScreenReader() { return flags.SCREEN_READER },
    
    // Combined feature checks
    get hasCFOFeatures() {
      return areEnabled(['CFO_PRESET', 'BOARD_EXPORT'])
    },
    
    get hasGlobalFeatures() {
      return areEnabled(['GLOBAL_TABS', 'TRUST_BADGES'])
    },
    
    get hasAdvancedFeatures() {
      return areEnabled(['CFO_PRESET', 'GLOBAL_TABS', 'BOARD_EXPORT'])
    }
  }
}

/**
 * Feature Flag Context for debugging and admin interfaces
 */
export const getFeatureFlagContext = () => {
  return {
    flags: FEATURE_FLAGS,
    environment: {
      NODE_ENV: import.meta.env.NODE_ENV,
      VITE_ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT
    },
    buildTime: new Date().toISOString(),
    version: import.meta.env.VITE_APP_VERSION || '1.0.0'
  }
}

/**
 * Feature Flag Component for conditional rendering
 */
export const FeatureFlag = ({ 
  feature, 
  features = [], 
  requireAll = false,
  children, 
  fallback = null 
}) => {
  const { isEnabled, areEnabled } = useFeatureFlags()
  
  let shouldRender = false
  
  if (feature) {
    shouldRender = isEnabled(feature)
  } else if (features.length > 0) {
    if (requireAll) {
      shouldRender = areEnabled(features)
    } else {
      shouldRender = features.some(f => isEnabled(f))
    }
  }
  
  return shouldRender ? children : fallback
}

/**
 * Higher-order component for feature flag wrapping
 */
export const withFeatureFlag = (feature, fallbackComponent = null) => {
  return (Component) => {
    const WrappedComponent = (props) => {
      const { isEnabled } = useFeatureFlags()
      
      if (!isEnabled(feature)) {
        return fallbackComponent ? React.createElement(fallbackComponent, props) : null
      }
      
      return <Component {...props} />
    }
    
    WrappedComponent.displayName = `withFeatureFlag(${Component.displayName || Component.name})`
    
    return WrappedComponent
  }
}

export default useFeatureFlags