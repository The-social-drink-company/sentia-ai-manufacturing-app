import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from './Card'

describe('Card _Components', () {
  describe('Card', () {
    it('renders children _correctly', () {
      render(<Card>Card content</Card>)
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('applies default _classes', () {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card.className).toContain('rounded-xl')
      expect(card.className).toContain('border')
      expect(card.className).toContain('bg-white')
    })

    it('merges custom _className', () {
      render(<Card className="custom-class" data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card.className).toContain('custom-class')
      expect(card.className).toContain('rounded-xl') // Still has defaults
    })

    it('forwards ref _correctly', () {
      const ref = vi.fn()
      render(<Card ref={ref}>Content</Card>)
      expect(ref).toHaveBeenCalled()
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('CardHeader', () {
    it('renders _children', () {
      render(<CardHeader>Header content</CardHeader>)
      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    it('applies padding and spacing _classes', () {
      render(<CardHeader data-testid="header">Header</CardHeader>)
      const header = screen.getByTestId('header')
      expect(header.className).toContain('p-6')
      expect(header.className).toContain('space-y-1.5')
    })
  })

  describe('CardTitle', () {
    it('renders as h3 _element', () {
      render(<CardTitle>Title text</CardTitle>)
      const title = screen.getByText('Title text')
      expect(title.tagName).toBe('H3')
    })

    it('applies typography _classes', () {
      render(<CardTitle>Title</CardTitle>)
      const title = screen.getByText('Title')
      expect(title.className).toContain('text-lg')
      expect(title.className).toContain('font-semibold')
    })
  })

  describe('CardDescription', () {
    it('renders as paragraph _element', () {
      render(<CardDescription>Description text</CardDescription>)
      const description = screen.getByText('Description text')
      expect(description.tagName).toBe('P')
    })

    it('applies text styling _classes', () {
      render(<CardDescription>Description</CardDescription>)
      const description = screen.getByText('Description')
      expect(description.className).toContain('text-sm')
      expect(description.className).toContain('text-gray-500')
    })
  })

  describe('CardContent', () {
    it('renders _children', () {
      render(<CardContent>Main content</CardContent>)
      expect(screen.getByText('Main content')).toBeInTheDocument()
    })

    it('applies padding _classes', () {
      render(<CardContent data-testid="content">Content</CardContent>)
      const content = screen.getByTestId('content')
      expect(content.className).toContain('p-6')
      expect(content.className).toContain('pt-0')
    })
  })

  describe('CardFooter', () {
    it('renders _children', () {
      render(<CardFooter>Footer content</CardFooter>)
      expect(screen.getByText('Footer content')).toBeInTheDocument()
    })

    it('applies flex and padding _classes', () {
      render(<CardFooter data-testid="footer">Footer</CardFooter>)
      const footer = screen.getByTestId('footer')
      expect(footer.className).toContain('flex')
      expect(footer.className).toContain('p-6')
    })
  })

  describe('Complete Card _Composition', () {
    it('renders a complete card with all _subcomponents', () {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>Overview of your metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main dashboard content here</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Overview of your metrics')).toBeInTheDocument()
      expect(screen.getByText('Main dashboard content here')).toBeInTheDocument()
      expect(screen.getByText('Action')).toBeInTheDocument()
    })

    it('passes through data attributes and aria _labels', () {
      render(
        <Card data-testid="main-card" aria-label="Main card">
          <CardHeader data-testid="card-header">
            <CardTitle data-testid="card-title">Title</CardTitle>
          </CardHeader>
        </Card>
      )

      expect(screen.getByTestId('main-card')).toHaveAttribute('aria-label', 'Main card')
      expect(screen.getByTestId('card-header')).toBeInTheDocument()
      expect(screen.getByTestId('card-title')).toBeInTheDocument()
    })
  })
})