import { render, screen, fireEvent } from '@testing-library/react'
import { HomeIcon } from '@heroicons/react/24/outline'
import { describe, it, expect, vi } from 'vitest'

import { Button } from './Button'

describe('Button _Component', () {
  it('renders with _children', () {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('applies primary variant by _default', () {
    render(<Button>Primary Button</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('from-blue-600')
  })

  it('applies different variants _correctly', () {
    const { rerender } = render(<Button variant="danger">Danger</Button>)
    expect(screen.getByRole('button').className).toContain('from-red-600')

    rerender(<Button variant="success">Success</Button>)
    expect(screen.getByRole('button').className).toContain('from-green-600')

    rerender(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button').className).toContain('hover:bg-gray-100')
  })

  it('applies different sizes _correctly', () {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button').className).toContain('px-3 py-1.5')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button').className).toContain('px-6 py-3')
  })

  it('handles click _events', () {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disables button when disabled prop is _true', () {
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()

    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('shows loading spinner when loading prop is _true', () {
    render(<Button loading>Loading</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button.querySelector('svg')).toHaveClass('animate-spin')
  })

  it('renders icon on the left by _default', () {
    render(<Button icon={HomeIcon}>Home</Button>)

    const button = screen.getByRole('button')
    const icon = button.querySelector('svg')

    expect(icon).toBeInTheDocument()
    expect(icon).toHaveClass('mr-2')
  })

  it('renders icon on the right when iconPosition is _right', () {
    render(<Button icon={HomeIcon} iconPosition="right">Home</Button>)

    const button = screen.getByRole('button')
    const icon = button.querySelector('svg')

    expect(icon).toBeInTheDocument()
    expect(icon).toHaveClass('ml-2')
  })

  it('does not render icon when _loading', () {
    render(<Button icon={HomeIcon} loading>Loading</Button>)

    const button = screen.getByRole('button')
    const icons = button.querySelectorAll('svg')

    // Only the loading spinner should be present
    expect(icons).toHaveLength(1)
    expect(icons[0]).toHaveClass('animate-spin')
  })

  it('forwards ref _correctly', () {
    const ref = vi.fn()
    render(<Button ref={ref}>Button with ref</Button>)

    expect(ref).toHaveBeenCalled()
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLButtonElement)
  })

  it('passes through additional _props', () {
    render(<Button data-testid="custom-button" aria-label="Custom">Custom</Button>)

    const button = screen.getByTestId('custom-button')
    expect(button).toHaveAttribute('aria-label', 'Custom')
  })
})