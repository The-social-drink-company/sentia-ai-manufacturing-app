import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SystemStatusBadge from '../../../../src/components/layout/SystemStatusBadge'

describe('SystemStatusBadge', () => {
  describe('Status Display', () => {
    it('should display "All Systems Operational" for operational status', () => {
      render(<SystemStatusBadge status="operational" />)

      expect(screen.getByText('All Systems Operational')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'System status: All Systems Operational'
      )
    })

    it('should display "Degraded Performance" for degraded status', () => {
      render(<SystemStatusBadge status="degraded" />)

      expect(screen.getByText('Degraded Performance')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'System status: Degraded Performance'
      )
    })

    it('should display "System Issues" for issues status', () => {
      render(<SystemStatusBadge status="issues" />)

      expect(screen.getByText('System Issues')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'System status: System Issues'
      )
    })

    it('should default to operational status when no status prop provided', () => {
      render(<SystemStatusBadge />)

      expect(screen.getByText('All Systems Operational')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'System status: All Systems Operational'
      )
    })

    it('should fallback to operational for invalid status', () => {
      render(<SystemStatusBadge status="invalid" />)

      expect(screen.getByText('All Systems Operational')).toBeInTheDocument()
    })
  })

  describe('Visual Styling', () => {
    it('should apply green colors for operational status', () => {
      const { container } = render(<SystemStatusBadge status="operational" />)
      const badge = container.firstChild

      expect(badge).toHaveClass('bg-green-100')
      expect(badge).toHaveClass('text-green-700')

      // Check for green dot indicator
      const dot = badge.querySelector('span.rounded-full')
      expect(dot).toHaveClass('bg-green-500')
    })

    it('should apply yellow colors for degraded status', () => {
      const { container } = render(<SystemStatusBadge status="degraded" />)
      const badge = container.firstChild

      expect(badge).toHaveClass('bg-yellow-100')
      expect(badge).toHaveClass('text-yellow-700')

      // Check for yellow dot indicator
      const dot = badge.querySelector('span.rounded-full')
      expect(dot).toHaveClass('bg-yellow-500')
    })

    it('should apply red colors for issues status', () => {
      const { container } = render(<SystemStatusBadge status="issues" />)
      const badge = container.firstChild

      expect(badge).toHaveClass('bg-red-100')
      expect(badge).toHaveClass('text-red-700')

      // Check for red dot indicator
      const dot = badge.querySelector('span.rounded-full')
      expect(dot).toHaveClass('bg-red-500')
    })

    it('should render with pill/badge design classes', () => {
      const { container } = render(<SystemStatusBadge status="operational" />)
      const badge = container.firstChild

      expect(badge).toHaveClass('rounded-full')
      expect(badge).toHaveClass('px-3')
      expect(badge).toHaveClass('py-1.5')
      expect(badge).toHaveClass('text-xs')
      expect(badge).toHaveClass('font-medium')
    })
  })

  describe('Accessibility', () => {
    it('should have role="status" for screen readers', () => {
      render(<SystemStatusBadge status="operational" />)

      const badge = screen.getByRole('status')
      expect(badge).toBeInTheDocument()
    })

    it('should have descriptive aria-label matching the status', () => {
      const { rerender } = render(<SystemStatusBadge status="operational" />)
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'System status: All Systems Operational'
      )

      rerender(<SystemStatusBadge status="degraded" />)
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'System status: Degraded Performance'
      )

      rerender(<SystemStatusBadge status="issues" />)
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'System status: System Issues'
      )
    })

    it('should mark dot indicator as decorative (aria-hidden)', () => {
      const { container } = render(<SystemStatusBadge status="operational" />)
      const dot = container.querySelector('span.rounded-full')

      expect(dot).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Status Indicator Dot', () => {
    it('should render visual dot indicator', () => {
      const { container } = render(<SystemStatusBadge status="operational" />)

      const dot = container.querySelector('span.rounded-full')
      expect(dot).toBeInTheDocument()
      expect(dot).toHaveClass('h-2')
      expect(dot).toHaveClass('w-2')
      expect(dot).toHaveClass('rounded-full')
    })

    it('should position dot before text label', () => {
      const { container } = render(<SystemStatusBadge status="operational" />)

      const badge = container.firstChild
      const firstChild = badge.firstChild

      // Dot should be the first child (before text)
      expect(firstChild).toHaveClass('rounded-full')
    })
  })
})
