import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '../../../../src/components/debug/ErrorBoundary'

// Test component that throws an error when shouldThrow is true
const ThrowError = ({ shouldThrow, message = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(message)
  }
  return <div>Child component</div>
}

describe('ErrorBoundary', () => {
  // Suppress console.error for cleaner test output
  let consoleErrorSpy

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('Normal Rendering (No Errors)', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Child component</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Child component')).toBeInTheDocument()
    })

    it('should render multiple children without errors', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Child 1')).toBeInTheDocument()
      expect(screen.getByText('Child 2')).toBeInTheDocument()
    })
  })

  describe('Error Catching', () => {
    it('should catch component errors and display fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Test error" />
        </ErrorBoundary>
      )

      // Should display error UI instead of child
      expect(screen.queryByText('Child component')).not.toBeInTheDocument()

      // Should show error message
      expect(screen.getByText(/Something went wrong while loading this component/i)).toBeInTheDocument()
    })

    it('should display error boundary name in error message', () => {
      render(
        <ErrorBoundary name="Dashboard Widget">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Dashboard Widget Error')).toBeInTheDocument()
    })

    it('should default to "Component Error" when no name provided', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Component Error')).toBeInTheDocument()
    })

    it('should log error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Test error message" />
        </ErrorBoundary>
      )

      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled()

      // Check that the error was logged with correct structure
      const errorLog = consoleErrorSpy.mock.calls.find(call =>
        call[0] === '[ErrorBoundary] Component error caught:'
      )
      expect(errorLog).toBeDefined()
    })
  })

  describe('Error Details Display', () => {
    it('should hide error details by default (showDetails=false)', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} message="Test error" />
        </ErrorBoundary>
      )

      // Details should not be visible
      expect(screen.queryByText('Error Details')).not.toBeInTheDocument()
      expect(screen.queryByText(/Test error/i)).not.toBeInTheDocument()
    })

    it('should show error details when showDetails=true', () => {
      render(
        <ErrorBoundary showDetails={true}>
          <ThrowError shouldThrow={true} message="Test error message" />
        </ErrorBoundary>
      )

      // Details summary should be visible
      expect(screen.getByText('Error Details')).toBeInTheDocument()

      // Error message should be in details (multiple occurrences in error message + stack trace)
      const errorMessages = screen.getAllByText(/Test error message/i)
      expect(errorMessages.length).toBeGreaterThan(0)
    })

    it('should display error stack trace when showDetails=true', () => {
      render(
        <ErrorBoundary showDetails={true}>
          <ThrowError shouldThrow={true} message="Stack trace test" />
        </ErrorBoundary>
      )

      // Stack trace should be present (contains "at" keyword typically)
      const detailsSection = screen.getByText(/Stack:/i).parentElement
      expect(detailsSection).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should display "Reload Page" button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const reloadButton = screen.getByRole('button', { name: /Reload Page/i })
      expect(reloadButton).toBeInTheDocument()
    })

    it('should display "Go Back" button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const goBackButton = screen.getByRole('button', { name: /Go Back/i })
      expect(goBackButton).toBeInTheDocument()
    })

    it('should call window.location.reload when "Reload Page" clicked', () => {
      const reloadMock = vi.fn()

      // Mock window.location.reload using Object.defineProperty
      Object.defineProperty(window, 'location', {
        value: { ...window.location, reload: reloadMock },
        writable: true,
      })

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const reloadButton = screen.getByRole('button', { name: /Reload Page/i })
      fireEvent.click(reloadButton)

      expect(reloadMock).toHaveBeenCalledTimes(1)
    })

    it('should call window.history.back when "Go Back" clicked', () => {
      const backMock = vi.fn()

      // Mock window.history.back using Object.defineProperty
      Object.defineProperty(window, 'history', {
        value: { ...window.history, back: backMock },
        writable: true,
      })

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const goBackButton = screen.getByRole('button', { name: /Go Back/i })
      fireEvent.click(goBackButton)

      expect(backMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Callback', () => {
    it('should call onError callback when error is caught', () => {
      const onErrorMock = vi.fn()

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowError shouldThrow={true} message="Callback test" />
        </ErrorBoundary>
      )

      // onError should be called with error and errorInfo
      expect(onErrorMock).toHaveBeenCalledTimes(1)

      const [error, errorInfo] = onErrorMock.mock.calls[0]
      expect(error.message).toBe('Callback test')
      expect(errorInfo).toBeDefined()
      expect(errorInfo.componentStack).toBeDefined()
    })

    it('should not throw if onError callback is not provided', () => {
      // Should not throw when onError is undefined
      expect(() => {
        render(
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        )
      }).not.toThrow()
    })
  })

  describe('Visual Design', () => {
    it('should display error icon', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // ExclamationTriangleIcon should be present
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass('w-6')
      expect(icon).toHaveClass('h-6')
      expect(icon).toHaveClass('text-red-600')
    })

    it('should apply red-themed styling for error state', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // Check for red background
      const errorBox = container.querySelector('.bg-red-50')
      expect(errorBox).toBeInTheDocument()
      expect(errorBox).toHaveClass('border-red-200')
    })
  })
})
