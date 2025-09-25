// Animation tokens for the Sentia Manufacturing Dashboard design system

export interface AnimationDuration {
  instant: string;
  fast: string;
  normal: string;
  slow: string;
  slower: string;
}

export interface AnimationEasing {
  linear: string;
  ease: string;
  easeIn: string;
  easeOut: string;
  easeInOut: string;
  // Custom easing curves
  bounce: string;
  elastic: string;
  sharp: string;
  standard: string;
  decelerated: string;
  accelerated: string;
}

export interface AnimationKeyframes {
  fadeIn: Record<string, Record<string, string>>;
  fadeOut: Record<string, Record<string, string>>;
  slideInUp: Record<string, Record<string, string>>;
  slideInDown: Record<string, Record<string, string>>;
  slideInLeft: Record<string, Record<string, string>>;
  slideInRight: Record<string, Record<string, string>>;
  slideOutUp: Record<string, Record<string, string>>;
  slideOutDown: Record<string, Record<string, string>>;
  slideOutLeft: Record<string, Record<string, string>>;
  slideOutRight: Record<string, Record<string, string>>;
  scaleIn: Record<string, Record<string, string>>;
  scaleOut: Record<string, Record<string, string>>;
  spin: Record<string, Record<string, string>>;
  pulse: Record<string, Record<string, string>>;
  bounce: Record<string, Record<string, string>>;
  shake: Record<string, Record<string, string>>;
  wiggle: Record<string, Record<string, string>>;
  float: Record<string, Record<string, string>>;
  glow: Record<string, Record<string, string>>;
}

// Duration tokens
export const duration: AnimationDuration = {
  instant: '0ms',
  fast: '150ms',
  normal: '250ms',
  slow: '400ms',
  slower: '600ms'
};

// Easing curve tokens
export const easing: AnimationEasing = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  // Material Design curves
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  decelerated: 'cubic-bezier(0, 0, 0.2, 1)',
  accelerated: 'cubic-bezier(0.4, 0, 1, 1)',
  // Custom curves
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
};

// Animation keyframes
export const keyframes: AnimationKeyframes = {
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' }
  },
  fadeOut: {
    '0%': { opacity: '1' },
    '100%': { opacity: '0' }
  },
  slideInUp: {
    '0%': { 
      opacity: '0',
      transform: 'translateY(100%)'
    },
    '100%': { 
      opacity: '1',
      transform: 'translateY(0)'
    }
  },
  slideInDown: {
    '0%': { 
      opacity: '0',
      transform: 'translateY(-100%)'
    },
    '100%': { 
      opacity: '1',
      transform: 'translateY(0)'
    }
  },
  slideInLeft: {
    '0%': { 
      opacity: '0',
      transform: 'translateX(-100%)'
    },
    '100%': { 
      opacity: '1',
      transform: 'translateX(0)'
    }
  },
  slideInRight: {
    '0%': { 
      opacity: '0',
      transform: 'translateX(100%)'
    },
    '100%': { 
      opacity: '1',
      transform: 'translateX(0)'
    }
  },
  slideOutUp: {
    '0%': { 
      opacity: '1',
      transform: 'translateY(0)'
    },
    '100%': { 
      opacity: '0',
      transform: 'translateY(-100%)'
    }
  },
  slideOutDown: {
    '0%': { 
      opacity: '1',
      transform: 'translateY(0)'
    },
    '100%': { 
      opacity: '0',
      transform: 'translateY(100%)'
    }
  },
  slideOutLeft: {
    '0%': { 
      opacity: '1',
      transform: 'translateX(0)'
    },
    '100%': { 
      opacity: '0',
      transform: 'translateX(-100%)'
    }
  },
  slideOutRight: {
    '0%': { 
      opacity: '1',
      transform: 'translateX(0)'
    },
    '100%': { 
      opacity: '0',
      transform: 'translateX(100%)'
    }
  },
  scaleIn: {
    '0%': { 
      opacity: '0',
      transform: 'scale(0.5)'
    },
    '100%': { 
      opacity: '1',
      transform: 'scale(1)'
    }
  },
  scaleOut: {
    '0%': { 
      opacity: '1',
      transform: 'scale(1)'
    },
    '100%': { 
      opacity: '0',
      transform: 'scale(0.5)'
    }
  },
  spin: {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  },
  pulse: {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.5' }
  },
  bounce: {
    '0%, 20%, 53%, 80%, 100%': {
      transform: 'translate3d(0, 0, 0)'
    },
    '40%, 43%': {
      transform: 'translate3d(0, -30px, 0)'
    },
    '70%': {
      transform: 'translate3d(0, -15px, 0)'
    },
    '90%': {
      transform: 'translate3d(0, -4px, 0)'
    }
  },
  shake: {
    '0%, 100%': { transform: 'translateX(0)' },
    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
    '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' }
  },
  wiggle: {
    '0%, 7%': { transform: 'rotateZ(0)' },
    '15%': { transform: 'rotateZ(-15deg)' },
    '20%': { transform: 'rotateZ(10deg)' },
    '25%': { transform: 'rotateZ(-10deg)' },
    '30%': { transform: 'rotateZ(6deg)' },
    '35%': { transform: 'rotateZ(-4deg)' },
    '40%, 100%': { transform: 'rotateZ(0)' }
  },
  float: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-20px)' }
  },
  glow: {
    '0%, 100%': { filter: 'brightness(1)' },
    '50%': { filter: 'brightness(1.2)' }
  }
};

// Semantic animation presets
export interface SemanticAnimations {
  enter: {
    duration: string;
    easing: string;
    keyframes: string;
  };
  exit: {
    duration: string;
    easing: string;
    keyframes: string;
  };
  loading: {
    duration: string;
    easing: string;
    keyframes: string;
    iterationCount: string;
  };
  interaction: {
    duration: string;
    easing: string;
    property: string;
  };
  feedback: {
    duration: string;
    easing: string;
    keyframes: string;
  };
}

export const semanticAnimations: SemanticAnimations = {
  enter: {
    duration: duration.normal,
    easing: easing.decelerated,
    keyframes: 'slideInUp'
  },
  exit: {
    duration: duration.fast,
    easing: easing.accelerated,
    keyframes: 'slideOutDown'
  },
  loading: {
    duration: duration.slower,
    easing: easing.linear,
    keyframes: 'spin',
    iterationCount: 'infinite'
  },
  interaction: {
    duration: duration.fast,
    easing: easing.standard,
    property: 'transform, box-shadow, background-color, border-color, opacity'
  },
  feedback: {
    duration: duration.normal,
    easing: easing.bounce,
    keyframes: 'shake'
  }
};

// Dashboard-specific animations
export interface DashboardAnimations {
  widget: {
    enter: {
      duration: string;
      easing: string;
      delay: string;
    };
    hover: {
      duration: string;
      easing: string;
      transform: string;
    };
    loading: {
      duration: string;
      easing: string;
      keyframes: string;
    };
  };
  chart: {
    draw: {
      duration: string;
      easing: string;
    };
    update: {
      duration: string;
      easing: string;
    };
    hover: {
      duration: string;
      easing: string;
    };
  };
  modal: {
    backdrop: {
      duration: string;
      easing: string;
    };
    content: {
      duration: string;
      easing: string;
      keyframes: string;
    };
  };
  notification: {
    slideIn: {
      duration: string;
      easing: string;
      keyframes: string;
    };
    slideOut: {
      duration: string;
      easing: string;
      keyframes: string;
    };
  };
}

export const dashboardAnimations: DashboardAnimations = {
  widget: {
    enter: {
      duration: duration.normal,
      easing: easing.decelerated,
      delay: '50ms'
    },
    hover: {
      duration: duration.fast,
      easing: easing.standard,
      transform: 'translateY(-2px) scale(1.02)'
    },
    loading: {
      duration: duration.slower,
      easing: easing.linear,
      keyframes: 'pulse'
    }
  },
  chart: {
    draw: {
      duration: '800ms',
      easing: easing.decelerated
    },
    update: {
      duration: duration.slow,
      easing: easing.standard
    },
    hover: {
      duration: duration.fast,
      easing: easing.standard
    }
  },
  modal: {
    backdrop: {
      duration: duration.normal,
      easing: easing.standard
    },
    content: {
      duration: duration.normal,
      easing: easing.decelerated,
      keyframes: 'scaleIn'
    }
  },
  notification: {
    slideIn: {
      duration: duration.normal,
      easing: easing.decelerated,
      keyframes: 'slideInRight'
    },
    slideOut: {
      duration: duration.fast,
      easing: easing.accelerated,
      keyframes: 'slideOutRight'
    }
  }
};

// Micro-interaction animations
export interface MicroInteractions {
  button: {
    press: string;
    release: string;
  };
  input: {
    focus: string;
    blur: string;
  };
  checkbox: {
    check: string;
    uncheck: string;
  };
  toggle: {
    on: string;
    off: string;
  };
  dropdown: {
    open: string;
    close: string;
  };
}

export const microInteractions: MicroInteractions = {
  button: {
    press: `transform ${duration.fast} ${easing.sharp}`,
    release: `transform ${duration.fast} ${easing.decelerated}`
  },
  input: {
    focus: `border-color ${duration.fast} ${easing.standard}, box-shadow ${duration.fast} ${easing.standard}`,
    blur: `border-color ${duration.fast} ${easing.standard}, box-shadow ${duration.fast} ${easing.standard}`
  },
  checkbox: {
    check: `transform ${duration.fast} ${easing.bounce}`,
    uncheck: `transform ${duration.fast} ${easing.standard}`
  },
  toggle: {
    on: `transform ${duration.normal} ${easing.decelerated}`,
    off: `transform ${duration.normal} ${easing.accelerated}`
  },
  dropdown: {
    open: `opacity ${duration.fast} ${easing.decelerated}, transform ${duration.fast} ${easing.decelerated}`,
    close: `opacity ${duration.fast} ${easing.accelerated}, transform ${duration.fast} ${easing.accelerated}`
  }
};

// Generate CSS keyframes
export const generateKeyframes = () => {
  const cssKeyframes: Record<string, string> = {};
  
  Object.entries(keyframes).forEach(([name, frames]) => {
    const frameStrings = Object.entries(frames)
      .map(([percentage, styles]) => {
        const styleString = Object.entries(styles)
          .map(([property, value]) => `${property}: ${value}`)
          .join('; ');
        return `${percentage} { ${styleString} }`;
      })
      .join(' ');
    
    cssKeyframes[name] = `@keyframes ${name} { ${frameStrings} }`;
  });
  
  return cssKeyframes;
};

// Generate CSS variables for animations
export const generateAnimationVariables = () => {
  const cssVariables: Record<string, string> = {};
  
  // Duration variables
  Object.entries(duration).forEach(([key, value]) => {
    cssVariables[`--duration-${key}`] = value;
  });
  
  // Easing variables
  Object.entries(easing).forEach(([key, value]) => {
    cssVariables[`--easing-${key}`] = value;
  });
  
  return cssVariables;
};

// Animation utility functions
export const createAnimation = (
  keyframeName: keyof AnimationKeyframes,
  animationDuration: keyof AnimationDuration = 'normal',
  animationEasing: keyof AnimationEasing = 'standard',
  options?: {
    delay?: string;
    iterationCount?: string | number;
    direction?: string;
    fillMode?: string;
  }
) => {
  const animationOptions = {
    delay: options?.delay || '0s',
    iterationCount: options?.iterationCount || '1',
    direction: options?.direction || 'normal',
    fillMode: options?.fillMode || 'forwards'
  };
  
  return {
    animationName: keyframeName,
    animationDuration: duration[animationDuration],
    animationTimingFunction: easing[animationEasing],
    animationDelay: animationOptions.delay,
    animationIterationCount: animationOptions.iterationCount.toString(),
    animationDirection: animationOptions.direction,
    animationFillMode: animationOptions.fillMode
  };
};

export const createTransition = (
  properties: string | string[],
  animationDuration: keyof AnimationDuration = 'normal',
  animationEasing: keyof AnimationEasing = 'standard',
  delay?: string
) => {
  const props = Array.isArray(properties) ? properties : [properties];
  const transitions = props.map(prop => 
    `${prop} ${duration[animationDuration]} ${easing[animationEasing]}${delay ? ` ${delay}` : ''}`
  );
  
  return {
    transition: transitions.join(', ')
  };
};

// Reduced motion utilities
export const reducedMotionStyles = {
  // Disable animations for users who prefer reduced motion
  respectReducedMotion: {
    '@media (prefers-reduced-motion: reduce)': {
      animationDuration: '0.01ms !important',
      animationIterationCount: '1 !important',
      transitionDuration: '0.01ms !important',
      scrollBehavior: 'auto !important'
    }
  }
};

// Performance optimization utilities
export const performanceOptimizations = {
  // Enable hardware acceleration for transform animations
  willChange: (properties: string[]) => ({
    willChange: properties.join(', ')
  }),
  
  // Force hardware acceleration
  forceHardwareAcceleration: {
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden',
    perspective: '1000px'
  },
  
  // Contain layout shifts during animations
  containLayout: {
    contain: 'layout style paint'
  }
};