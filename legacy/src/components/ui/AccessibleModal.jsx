/**
 * Accessible Modal Component for PROMPT 8 Dashboard Overlay
 * WCAG 2.1 AA compliant modal with focus management and keyboard navigation
 */

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useHotkeys } from 'react-hotkeys-hook'
import { cn } from '../../lib/utils'

const AccessibleModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  initialFocus = null,
  returnFocus = true,
  ariaDescribedBy = null
}) => {
  const modalRef = useRef(null)
  const overlayRef = useRef(null)
  const previousActiveElement = useRef(null)
  const titleId = `modal-title-${crypto.randomUUID().substr(2, 9)}`
  
  // Size variants
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full mx-4'
  }
  
  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement
      
      // Focus the modal or initial focus element
      requestAnimationFrame(() => {
        const focusElement = initialFocus?.current || modalRef.current?.querySelector('[tabindex="0"], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (focusElement) {
          focusElement.focus()
        } else {
          modalRef.current?.focus()
        }
      })
      
      // Disable body scroll
      document.body.style.overflow = 'hidden'
      
      // Add aria-hidden to other elements
      const siblingElements = document.body.children
      for (let element of siblingElements) {
        if (element !== modalRef.current?.closest('[data-modal-portal]') && !element.contains(modalRef.current)) {
          element.setAttribute('aria-hidden', 'true')
        }
      }
      
    } else if (returnFocus && previousActiveElement.current) {
      // Restore focus to previous element
      previousActiveElement.current.focus()
      previousActiveElement.current = null
      
      // Re-enable body scroll
      document.body.style.overflow = ''
      
      // Remove aria-hidden from other elements
      const elementsWithAriaHidden = document.querySelectorAll('[aria-hidden="true"]')
      elementsWithAriaHidden.forEach(element => {
        element.removeAttribute('aria-hidden')
      })
    }
    
    return () => {
      if (isOpen) {
        document.body.style.overflow = ''
        const elementsWithAriaHidden = document.querySelectorAll('[aria-hidden="true"]')
        elementsWithAriaHidden.forEach(element => {
          element.removeAttribute('aria-hidden')
        })
      }
    }
  }, [isOpen, initialFocus, returnFocus])
  
  // Keyboard navigation
  useHotkeys(
    'escape',
    () => {
      if (closeOnEscape && isOpen) {
        onClose()
      }
    },
    { 
      enabled: isOpen,
      enableOnContentEditable: false,
      preventDefault: true 
    }
  )
  
  // Focus trap
  const handleKeyDown = (event) => {
    if (!isOpen || event.key !== 'Tab') return
    
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    if (!focusableElements || focusableElements.length === 0) return
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }
  
  // Handle overlay click
  const handleOverlayClick = (event) => {
    if (closeOnOverlayClick && event.target === overlayRef.current) {
      onClose()
    }
  }
  
  if (!isOpen) return null
  
  const modalContent = (
    <div
      data-modal-portal
      className="fixed inset-0 z-50 overflow-y-auto"
      onKeyDown={handleKeyDown}
    >
      <div 
        ref={overlayRef}
        className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
        onClick={handleOverlayClick}
        aria-hidden="true"
      >
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          aria-hidden="true"
        />
        
        {/* Modal panel */}
        <div
          ref={modalRef}
          className={cn(
            "inline-block w-full p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg",
            sizeClasses[size],
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={ariaDescribedBy}
          tabIndex="-1"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 
              id={titleId}
              className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
            >
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1"
              aria-label="Close dialog"
            >
              <XMarkIcon className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>
          
          {/* Content */}
          <div className="modal-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
  
  // Render modal in portal
  const modalRoot = document.getElementById('modal-root') || document.body
  return createPortal(modalContent, modalRoot)
}

// Hook for managing modal state
export const useAccessibleModal = (initialOpen = false) => {
  const [isOpen, setIsOpen] = React.useState(initialOpen)
  
  const openModal = React.useCallback(() => setIsOpen(true), [])
  const closeModal = React.useCallback(() => setIsOpen(false), [])
  const toggleModal = React.useCallback(() => setIsOpen(prev => !prev), [])
  
  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
    setIsOpen
  }
}

// Accessible dialog button component
export const AccessibleDialogButton = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  ariaLabel = null,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200"
  
  const variants = {
    primary: "text-white bg-blue-600 border border-transparent hover:bg-blue-700 focus:ring-blue-500",
    secondary: "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 dark:text-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700",
    danger: "text-white bg-red-600 border border-transparent hover:bg-red-700 focus:ring-red-500",
    success: "text-white bg-green-600 border border-transparent hover:bg-green-700 focus:ring-green-500"
  }
  
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-4 py-2 text-base"
  }
  
  const disabledClasses = "opacity-50 cursor-not-allowed"
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        disabled && disabledClasses,
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export default AccessibleModal
