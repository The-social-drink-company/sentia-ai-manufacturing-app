// Touch Gesture Hook for Mobile Optimization
// Provides comprehensive touch gesture support for drag-and-drop widgets

import { useEffect, useRef, useCallback, useState } from 'react'

const useTouchGestures = (options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    onLongPress,
    onPinch,
    onRotate,
    onDragStart,
    onDragMove,
    onDragEnd,
    threshold = 50,
    longPressDelay = 500,
    doubleTapDelay = 300
  } = options

  const [isGesturing, setIsGesturing] = useState(false)
  const touchRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    lastTapTime: 0,
    longPressTimer: null,
    isDragging: false,
    initialDistance: 0,
    initialAngle: 0
  })

  const elementRef = useRef(null)

  // Calculate distance between two touch points
  const getTouchDistance = useCallback((touches) => {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // Calculate angle between two touch points
  const getTouchAngle = useCallback((touches) => {
    if (touches.length < 2) return 0
    const dx = touches[1].clientX - touches[0].clientX
    const dy = touches[1].clientY - touches[0].clientY
    return Math.atan2(dy, dx) * (180 / Math.PI)
  }, [])

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    const current = touchRef.current

    current.startX = touch.clientX
    current.startY = touch.clientY
    current.startTime = Date.now()
    current.isDragging = false

    setIsGesturing(true)

    // Handle multi-touch for pinch/rotate
    if (e.touches.length === 2) {
      current.initialDistance = getTouchDistance(e.touches)
      current.initialAngle = getTouchAngle(e.touches)
    }

    // Setup long press detection
    if (onLongPress) {
      current.longPressTimer = setTimeout(() => {
        onLongPress({
          x: touch.clientX,
          y: touch.clientY,
          target: e.target
        })
        current.longPressTimer = null
      }, longPressDelay)
    }

    // Trigger drag start
    if (onDragStart) {
      onDragStart({
        x: touch.clientX,
        y: touch.clientY,
        target: e.target
      })
    }
  }, [onLongPress, onDragStart, longPressDelay, getTouchDistance, getTouchAngle])

  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    const current = touchRef.current
    
    // Clear long press timer on move
    if (current.longPressTimer) {
      clearTimeout(current.longPressTimer)
      current.longPressTimer = null
    }

    // Handle pinch gesture
    if (e.touches.length === 2 && onPinch) {
      const currentDistance = getTouchDistance(e.touches)
      const scale = currentDistance / current.initialDistance
      
      onPinch({
        scale,
        center: {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        }
      })
    }

    // Handle rotate gesture
    if (e.touches.length === 2 && onRotate) {
      const currentAngle = getTouchAngle(e.touches)
      const rotation = currentAngle - current.initialAngle
      
      onRotate({
        angle: rotation,
        center: {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        }
      })
    }

    // Handle single touch drag
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const deltaX = touch.clientX - current.startX
      const deltaY = touch.clientY - current.startY

      // Mark as dragging if moved beyond threshold
      if (!current.isDragging && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
        current.isDragging = true
      }

      // Trigger drag move
      if (current.isDragging && onDragMove) {
        onDragMove({
          x: touch.clientX,
          y: touch.clientY,
          deltaX,
          deltaY,
          target: e.target
        })
      }
    }
  }, [onPinch, onRotate, onDragMove, getTouchDistance, getTouchAngle])

  // Handle touch end
  const handleTouchEnd = useCallback((e) => {
    const current = touchRef.current
    const endTime = Date.now()
    const duration = endTime - current.startTime

    // Clear long press timer
    if (current.longPressTimer) {
      clearTimeout(current.longPressTimer)
      current.longPressTimer = null
    }

    setIsGesturing(false)

    // Get the last touch point
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - current.startX
    const deltaY = touch.clientY - current.startY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Trigger drag end
    if (current.isDragging && onDragEnd) {
      onDragEnd({
        x: touch.clientX,
        y: touch.clientY,
        deltaX,
        deltaY,
        target: e.target
      })
    }

    // Detect swipe gestures
    if (!current.isDragging && duration < 300 && distance > threshold) {
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight({ velocity: distance / duration })
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft({ velocity: distance / duration })
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown({ velocity: distance / duration })
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp({ velocity: distance / duration })
        }
      }
    }

    // Detect tap and double tap
    if (!current.isDragging && distance < 10 && duration < 200) {
      const timeSinceLastTap = endTime - current.lastTapTime

      if (timeSinceLastTap < doubleTapDelay && onDoubleTap) {
        onDoubleTap({
          x: touch.clientX,
          y: touch.clientY,
          target: e.target
        })
        current.lastTapTime = 0
      } else {
        if (onTap) {
          onTap({
            x: touch.clientX,
            y: touch.clientY,
            target: e.target
          })
        }
        current.lastTapTime = endTime
      }
    }

    // Reset drag state
    current.isDragging = false
  }, [
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    onDragEnd,
    threshold,
    doubleTapDelay
  ])

  // Handle touch cancel
  const handleTouchCancel = useCallback(() => {
    const current = touchRef.current
    
    if (current.longPressTimer) {
      clearTimeout(current.longPressTimer)
      current.longPressTimer = null
    }

    current.isDragging = false
    setIsGesturing(false)
  }, [])

  // Prevent default touch behaviors
  const handleTouchPrevent = useCallback((e) => {
    // Prevent scrolling while gesturing
    if (isGesturing) {
      e.preventDefault()
    }
  }, [isGesturing])

  // Setup and cleanup event listeners
  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Touch event options for better performance
    const options = { passive: false }

    element.addEventListener('touchstart', handleTouchStart, options)
    element.addEventListener('touchmove', handleTouchMove, options)
    element.addEventListener('touchend', handleTouchEnd, options)
    element.addEventListener('touchcancel', handleTouchCancel, options)
    
    // Prevent default touch behaviors
    element.addEventListener('touchmove', handleTouchPrevent, options)

    // Add CSS for better touch handling
    element.style.touchAction = 'none'
    element.style.userSelect = 'none'
    element.style.webkitUserSelect = 'none'
    element.style.webkitTouchCallout = 'none'

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchCancel)
      element.removeEventListener('touchmove', handleTouchPrevent)
    }
  }, [
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    handleTouchPrevent
  ])

  return {
    ref: elementRef,
    isGesturing,
    bind: {
      ref: elementRef,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel
    }
  }
}

// Specific gesture hooks
export const useSwipe = (onSwipe, options = {}) => {
  return useTouchGestures({
    onSwipeLeft: () => onSwipe('left'),
    onSwipeRight: () => onSwipe('right'),
    onSwipeUp: () => onSwipe('up'),
    onSwipeDown: () => onSwipe('down'),
    ...options
  })
}

export const usePinch = (onPinch, options = {}) => {
  return useTouchGestures({
    onPinch,
    ...options
  })
}

export const useDrag = (onDrag, options = {}) => {
  return useTouchGestures({
    onDragStart: onDrag.start,
    onDragMove: onDrag.move,
    onDragEnd: onDrag.end,
    ...options
  })
}

export default useTouchGestures