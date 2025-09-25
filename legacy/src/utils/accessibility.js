/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 */

// Check if user prefers reduced motion
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Check if user prefers high contrast
export const prefersHighContrast = () => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

// Check if user prefers dark mode
export const prefersDarkMode = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Announce message to screen readers
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  
  announcement.textContent = message;
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Trap focus within a modal or dialog
export class FocusTrap {
  constructor(element) {
    this.element = element;
    this.focusableElements = null;
    this.firstFocusableElement = null;
    this.lastFocusableElement = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }
  
  activate() {
    this.focusableElements = this.element.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );
    
    if (this.focusableElements.length === 0) return;
    
    this.firstFocusableElement = this.focusableElements[0];
    this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];
    
    this.element.addEventListener('keydown', this.handleKeyDown);
    this.firstFocusableElement.focus();
  }
  
  deactivate() {
    this.element.removeEventListener('keydown', this.handleKeyDown);
  }
  
  handleKeyDown(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === this.firstFocusableElement) {
          this.lastFocusableElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === this.lastFocusableElement) {
          this.firstFocusableElement.focus();
          e.preventDefault();
        }
      }
    }
    
    if (e.key === 'Escape') {
      this.deactivate();
      this.element.dispatchEvent(new CustomEvent('focustrap:escape'));
    }
  }
}

// Skip to main content link
export const createSkipLink = () => {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Skip to main content';
  skipLink.style.cssText = `
    position: absolute;
    left: -10000px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
    z-index: 999999;
  `;
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      z-index: 999999;
      padding: 8px 16px;
      background: #000;
      color: #fff;
      text-decoration: none;
      border-radius: 4px;
    `;
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.cssText = `
      position: absolute;
      left: -10000px;
      top: auto;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
  });
  
  document.body.insertBefore(skipLink, document.body.firstChild);
  return skipLink;
};

// Manage focus for route changes
export const manageFocusOnRouteChange = (targetSelector = 'h1, [role="heading"][aria-level="1"]') => {
  setTimeout(() => {
    const target = document.querySelector(targetSelector);
    if (target) {
      target.tabIndex = -1;
      target.focus();
      target.removeAttribute('tabindex');
    }
  }, 100);
};

// Check color contrast ratio
export const checkColorContrast = (foreground, background) => {
  const getLuminance = (color) => {
    const rgb = color.match(/\d+/g);
    if (!rgb) return 0;
    
    const [r, g, b] = rgb.map(val => {
      const sRGB = parseInt(val) / 255;
      return sRGB <= 0.03928
        ? sRGB / 12.92
        : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

// Add keyboard navigation hints
export const addKeyboardHints = () => {
  const shortcuts = {
    '/': 'Focus search',
    'g h': 'Go to home',
    'g d': 'Go to dashboard',
    'g s': 'Go to settings',
    '?': 'Show keyboard shortcuts',
    'Escape': 'Close modal/dialog'
  };
  
  const container = document.createElement('div');
  container.id = 'keyboard-shortcuts';
  container.setAttribute('role', 'dialog');
  container.setAttribute('aria-label', 'Keyboard shortcuts');
  container.style.display = 'none';
  
  const list = document.createElement('dl');
  Object.entries(shortcuts).forEach(([key, description]) => {
    const dt = document.createElement('dt');
    dt.textContent = key;
    const dd = document.createElement('dd');
    dd.textContent = description;
    list.appendChild(dt);
    list.appendChild(dd);
  });
  
  container.appendChild(list);
  document.body.appendChild(container);
  
  // Toggle on ? key
  document.addEventListener('keydown', (e) => {
    if (e.key === '?' && !e.target.matches('input, textarea')) {
      container.style.display = container.style.display === 'none' ? 'block' : 'none';
    }
  });
  
  return container;
};

// ARIA live region for dynamic updates
export class LiveRegion {
  constructor(priority = 'polite') {
    this.region = document.createElement('div');
    this.region.setAttribute('role', 'status');
    this.region.setAttribute('aria-live', priority);
    this.region.setAttribute('aria-atomic', 'true');
    this.region.className = 'sr-only';
    this.region.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(this.region);
  }
  
  announce(message) {
    this.region.textContent = '';
    setTimeout(() => {
      this.region.textContent = message;
    }, 100);
  }
  
  destroy() {
    document.body.removeChild(this.region);
  }
}

// Form validation with accessible error messages
export const accessibleFormValidation = (form) => {
  const errors = {};
  const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
  
  inputs.forEach(input => {
    if (!input.value.trim()) {
      const label = form.querySelector(`label[for="${input.id}"]`);
      const fieldName = label ? label.textContent : input.name;
      errors[input.id] = `${fieldName} is required`;
      
      // Add ARIA attributes
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', `${input.id}-error`);
      
      // Create error message element
      let errorEl = form.querySelector(`#${input.id}-error`);
      if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.id = `${input.id}-error`;
        errorEl.className = 'error-message';
        errorEl.setAttribute('role', 'alert');
        input.parentNode.insertBefore(errorEl, input.nextSibling);
      }
      errorEl.textContent = errors[input.id];
    } else {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
      const errorEl = form.querySelector(`#${input.id}-error`);
      if (errorEl) {
        errorEl.remove();
      }
    }
  });
  
  return Object.keys(errors).length === 0 ? null : errors;
};

// Table accessibility enhancements
export const enhanceTableAccessibility = (table) => {
  // Add scope to headers
  const headers = table.querySelectorAll('th');
  headers.forEach(th => {
    if (!th.hasAttribute('scope')) {
      th.setAttribute('scope', th.parentElement.parentElement.tagName === 'THEAD' ? 'col' : 'row');
    }
  });
  
  // Add caption if missing
  if (!table.querySelector('caption')) {
    const caption = document.createElement('caption');
    caption.className = 'sr-only';
    caption.textContent = 'Data table';
    table.insertBefore(caption, table.firstChild);
  }
  
  // Add summary
  if (!table.hasAttribute('summary')) {
    table.setAttribute('summary', 'Data table with sortable columns');
  }
};

// Check and report accessibility issues
export const auditAccessibility = () => {
  const issues = [];
  
  // Check for images without alt text
  document.querySelectorAll('img:not([alt])').forEach(img => {
    issues.push({
      element: img,
      issue: 'Image missing alt text',
      severity: 'error'
    });
  });
  
  // Check for links without text
  document.querySelectorAll('a').forEach(link => {
    if (!link.textContent.trim() && !link.querySelector('img[alt]')) {
      issues.push({
        element: link,
        issue: 'Link has no accessible text',
        severity: 'error'
      });
    }
  });
  
  // Check for form inputs without labels
  document.querySelectorAll('input, textarea, select').forEach(input => {
    if (!input.getAttribute('aria-label') && !document.querySelector(`label[for="${input.id}"]`)) {
      issues.push({
        element: input,
        issue: 'Form input missing label',
        severity: 'error'
      });
    }
  });
  
  // Check heading hierarchy
  let lastLevel = 0;
  document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1));
    if (level - lastLevel > 1) {
      issues.push({
        element: heading,
        issue: `Heading level skipped (h${lastLevel} to h${level})`,
        severity: 'warning'
      });
    }
    lastLevel = level;
  });
  
  // Check color contrast
  const elements = document.querySelectorAll('*');
  elements.forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.color && style.backgroundColor) {
      const contrast = checkColorContrast(style.color, style.backgroundColor);
      if (contrast < 4.5) {
        issues.push({
          element: el,
          issue: `Low color contrast ratio: ${contrast.toFixed(2)}`,
          severity: 'warning'
        });
      }
    }
  });
  
  return issues;
};

export default {
  prefersReducedMotion,
  prefersHighContrast,
  prefersDarkMode,
  announceToScreenReader,
  FocusTrap,
  createSkipLink,
  manageFocusOnRouteChange,
  checkColorContrast,
  addKeyboardHints,
  LiveRegion,
  accessibleFormValidation,
  enhanceTableAccessibility,
  auditAccessibility
};
