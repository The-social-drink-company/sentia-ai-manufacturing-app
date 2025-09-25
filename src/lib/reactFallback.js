import { logDebug, logInfo, logWarn, logError } from '../utils/logger';

/**
 * React Fallback System
 * Provides fallback implementations for React methods when they're not available
 * This prevents the "Cannot read properties of undefined (reading 'createContext')" error
 */

// Enhanced React fallback implementation
const ReactFallback = {
  createContext: function(defaultValue) {
    const context = {
      Provider: function(props) { 
        return props.children; 
      },
      Consumer: function(props) { 
        return props.children; 
      },
      _currentValue: defaultValue,
      displayName: 'ReactContext'
    };
    return context;
  },
  
  createElement: function(type, props, ...children) {
    return { 
      type, 
      props: { 
        ...props, 
        children: children.length === 1 ? children[0] : children 
      } 
    };
  },
  
  useContext: function(context) {
    return context._currentValue;
  },
  
  useState: function(initialState) {
    return [initialState, function() {}];
  },
  
  useEffect: function(effect, deps) {
    // No-op fallback
  },
  
  useMemo: function(factory, deps) {
    return factory();
  },
  
  useCallback: function(callback, deps) {
    return callback;
  },
  
  Suspense: function(props) {
    return props.fallback || null;
  },
  
  StrictMode: function(props) {
    return props.children;
  },
  
  Fragment: function(props) {
    return props.children;
  },
  
  // Additional methods that might be needed
  useRef: function(initialValue) {
    return { current: initialValue };
  },
  
  useLayoutEffect: function(effect, deps) {
    // No-op fallback
  },
  
  useReducer: function(reducer, initialState, init) {
    return [initialState, function() {}];
  },
  
  useImperativeHandle: function(ref, createHandle, deps) {
    // No-op fallback
  },
  
  useDebugValue: function(value, formatter) {
    // No-op fallback
  }
};

// Ensure React is available globally with better error handling
if (typeof window !== 'undefined') {
  try {
    // If React is not available, use fallback
    if (!window.React) {
      logWarn('[React Fallback] React not available, using fallback implementation');
      window.React = ReactFallback;
    } else {
      // If React is available but createContext is missing, patch it
      if (!window.React.createContext) {
        logWarn('[React Fallback] React.createContext missing, patching with fallback');
        window.React.createContext = ReactFallback.createContext;
      }
      
      // Ensure all React methods are available
      Object.keys(ReactFallback).forEach(method => {
        if (!window.React[method]) {
          window.React[method] = ReactFallback[method];
        }
      });
    }
    
    // Also ensure React is available on the global object for modules
    if (typeof global !== 'undefined' && !global.React) {
      global.React = window.React;
    }
    
    // Ensure React is available for ES modules
    if (typeof globalThis !== 'undefined' && !globalThis.React) {
      globalThis.React = window.React;
    }
    
  } catch (error) {
    logError('[React Fallback] Error setting up React fallback:', error);
    // Force set React even if there's an error
    window.React = ReactFallback;
  }
}

export default ReactFallback;
