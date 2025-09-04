/**
 * Keyboard Navigation Hook for PROMPT 8 Dashboard Overlay
 * WCAG 2.1 AA compliant keyboard navigation for dashboard components
 */

import { useEffect, useCallback, useRef } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

// Arrow key navigation for grid components
export const useArrowNavigation = (containerRef, options = {}) => {
  const {
    gridColumns = 1,
    enableWrap = true,
    selector = '[tabindex="0"], button, [href], input, select, textarea, [data-navigable="true"]',
    onNavigate = null
  } = options
  
  const currentIndex = useRef(0)
  const elements = useRef([])
  
  const updateElements = useCallback(() => {
    if (!containerRef.current) return
    elements.current = Array.from(containerRef.current.querySelectorAll(selector))
  }, [selector])
  
  const focusElement = useCallback((index) => {
    if (!elements.current[index]) return
    
    elements.current[index].focus()
    currentIndex.current = index
    onNavigate?.(index, elements.current[index])
  }, [onNavigate])
  
  const handleArrowKey = useCallback((direction) => {
    updateElements()
    if (elements.current.length === 0) return
    
    let newIndex = currentIndex.current
    
    switch (direction) {
      case 'up':
        newIndex = currentIndex.current - gridColumns
        break
      case 'down':
        newIndex = currentIndex.current + gridColumns
        break
      case 'left':
        newIndex = currentIndex.current - 1
        break
      case 'right':
        newIndex = currentIndex.current + 1
        break
      default:
        return
    }
    
    // Handle wrapping
    if (enableWrap) {
      if (newIndex < 0) {
        newIndex = elements.current.length - 1
      } else if (newIndex >= elements.current.length) {
        newIndex = 0
      }
    } else {
      newIndex = Math.max(0, Math.min(newIndex, elements.current.length - 1))
    }
    
    focusElement(newIndex)
  }, [gridColumns, enableWrap, updateElements, focusElement])
  
  // Register hotkeys
  useHotkeys('up', () => handleArrowKey('up'), { preventDefault: true })
  useHotkeys('down', () => handleArrowKey('down'), { preventDefault: true })
  useHotkeys('left', () => handleArrowKey('left'), { preventDefault: true })
  useHotkeys('right', () => handleArrowKey('right'), { preventDefault: true })
  
  // Track focus changes
  useEffect(() => {
    const handleFocusChange = (event) => {
      updateElements()
      const focusedIndex = elements.current.findIndex(el => el === event.target)
      if (focusedIndex !== -1) {
        currentIndex.current = focusedIndex
      }
    }
    
    document.addEventListener('focusin', handleFocusChange)
    return () => document.removeEventListener('focusin', handleFocusChange)
  }, [updateElements])
  
  return {
    currentIndex: currentIndex.current,
    totalElements: elements.current.length,
    focusElement,
    updateElements
  }
}

// Skip links for main navigation
export const useSkipLinks = () => {
  useEffect(() => {
    // Create skip links container if it doesn't exist
    let skipLinksContainer = document.getElementById('skip-links')
    if (!skipLinksContainer) {
      skipLinksContainer = document.createElement('div')
      skipLinksContainer.id = 'skip-links'
      skipLinksContainer.className = 'sr-only focus-within:not-sr-only'
      skipLinksContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        z-index: 9999;
        background: white;
        padding: 8px;
        border: 2px solid #000;
        border-radius: 4px;
      `
      
      // Add skip links
      const skipLinks = [
        { href: '#main-content', text: 'Skip to main content' },
        { href: '#navigation', text: 'Skip to navigation' },
        { href: '#search', text: 'Skip to search' }
      ]
      
      skipLinks.forEach(link => {
        const a = document.createElement('a')
        a.href = link.href
        a.textContent = link.text
        a.className = 'block p-2 text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500'
        skipLinksContainer.appendChild(a)
      })
      
      document.body.insertBefore(skipLinksContainer, document.body.firstChild)
    }
    
    return () => {
      const container = document.getElementById('skip-links')
      if (container) {
        container.remove()
      }
    }
  }, [])
}

// Focus management for dynamic content
export const useFocusManagement = () => {
  const announcementRef = useRef(null)
  
  // Create announcement region for screen readers
  useEffect(() => {
    if (!announcementRef.current) {
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', 'polite')
      announcement.setAttribute('aria-atomic', 'true')
      announcement.className = 'sr-only'
      announcement.id = 'announcement-region'
      document.body.appendChild(announcement)
      announcementRef.current = announcement
    }
    
    return () => {
      if (announcementRef.current) {
        announcementRef.current.remove()
        announcementRef.current = null
      }
    }
  }, [])
  
  const announce = useCallback((message, priority = 'polite') => {
    if (!announcementRef.current) return
    
    announcementRef.current.setAttribute('aria-live', priority)
    announcementRef.current.textContent = message
    
    // Clear after announcement to allow repeated messages
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = ''
      }
    }, 1000)
  }, [])
  
  const focusFirst = useCallback((container, selector = '[tabindex="0"], button, [href], input, select, textarea') => {
    if (!container) return false
    
    const firstFocusable = container.querySelector(selector)
    if (firstFocusable) {
      firstFocusable.focus()
      return true
    }
    return false
  }, [])
  
  const moveFocus = useCallback((targetElement, announcement = null) => {
    if (!targetElement) return false
    
    requestAnimationFrame(() => {
      targetElement.focus()
      if (announcement) {
        announce(announcement)
      }
    })
    return true
  }, [announce])
  
  return {
    announce,
    focusFirst,
    moveFocus
  }
}

// Roving tabindex for complex widgets
export const useRovingTabindex = (containerRef, options = {}) => {
  const {
    selector = '[data-navigable="true"]',
    initialIndex = 0,
    orientation = 'both', // 'horizontal', 'vertical', 'both'
    onSelectionChange = null
  } = options
  
  const currentIndex = useRef(initialIndex)
  const elements = useRef([])
  
  const updateTabindex = useCallback((activeIndex) => {
    elements.current.forEach((element, index) => {
      if (index === activeIndex) {
        element.setAttribute('tabindex', '0')
        element.focus()
      } else {
        element.setAttribute('tabindex', '-1')
      }
    })
    currentIndex.current = activeIndex
    onSelectionChange?.(activeIndex, elements.current[activeIndex])
  }, [onSelectionChange])
  
  const refreshElements = useCallback(() => {
    if (!containerRef.current) return
    elements.current = Array.from(containerRef.current.querySelectorAll(selector))
    
    // Set initial tabindex values
    elements.current.forEach((element, index) => {
      element.setAttribute('tabindex', index === currentIndex.current ? '0' : '-1')
    })
  }, [selector])
  
  const handleKeyDown = useCallback((event) => {
    if (elements.current.length === 0) return
    
    let newIndex = currentIndex.current
    let handled = false
    
    switch (event.key) {
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = Math.max(0, currentIndex.current - 1)
          handled = true
        }
        break
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = Math.min(elements.current.length - 1, currentIndex.current + 1)
          handled = true
        }
        break
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = Math.max(0, currentIndex.current - 1)
          handled = true
        }
        break
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = Math.min(elements.current.length - 1, currentIndex.current + 1)
          handled = true
        }
        break
      case 'Home':
        newIndex = 0
        handled = true
        break
      case 'End':
        newIndex = elements.current.length - 1
        handled = true
        break
      default:
        break
    }
    
    if (handled) {
      event.preventDefault()
      updateTabindex(newIndex)
    }
  }, [orientation, updateTabindex])
  
  useEffect(() => {
    refreshElements()
    
    const container = containerRef.current
    if (container) {
      container.addEventListener('keydown', handleKeyDown)
      return () => container.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, refreshElements])
  
  return {
    currentIndex: currentIndex.current,
    setActiveIndex: updateTabindex,
    refreshElements
  }
}

export default {
  useArrowNavigation,
  useSkipLinks,
  useFocusManagement,
  useRovingTabindex
}