import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Breadcrumb from '../../../../src/components/layout/Breadcrumb'

// Mock react-router-dom with actual MemoryRouter and Link
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    MemoryRouter: actual.MemoryRouter,
    Link: actual.Link,
  }
})

describe('Breadcrumb', () => {
  afterEach(() => {
    cleanup() // Clean up DOM after each test
    vi.clearAllMocks()
  })
  describe('Rendering', () => {
    it('should render breadcrumb trail correctly for multi-level path', () => {
      render(
        <MemoryRouter initialEntries={['/app/working-capital']}>
          <Breadcrumb />
        </MemoryRouter>
      )

      // Should show Home link
      expect(screen.getByLabelText('Navigate to Home')).toBeInTheDocument()

      // Should show Working Capital as current page (no link)
      expect(screen.getByText('Working Capital')).toBeInTheDocument()
      expect(screen.getByText('Working Capital')).toHaveAttribute('aria-current', 'page')

      // Should have breadcrumb navigation landmark
      expect(screen.getByLabelText('Breadcrumb navigation')).toBeInTheDocument()
    })

    it('should render home link with icon', () => {
      render(
        <MemoryRouter initialEntries={['/app/dashboard']}>
          <Breadcrumb />
        </MemoryRouter>
      )

      const homeLink = screen.getByLabelText('Navigate to Home')
      expect(homeLink).toBeInTheDocument()
      expect(homeLink).toHaveAttribute('href', '/dashboard')

      // Check for HomeIcon SVG (Heroicons renders as <svg>)
      const svg = homeLink.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle nested paths with multiple segments', () => {
      render(
        <MemoryRouter initialEntries={['/app/admin/import']}>
          <Breadcrumb />
        </MemoryRouter>
      )

      // Should show all three levels
      expect(screen.getByLabelText('Navigate to Home')).toBeInTheDocument()
      expect(screen.getByLabelText('Navigate to Admin')).toBeInTheDocument()
      expect(screen.getByText('Import')).toBeInTheDocument()

      // Last item should be current page
      expect(screen.getByText('Import')).toHaveAttribute('aria-current', 'page')
    })

    it('should return null for root path (no breadcrumbs)', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/']}>
          <Breadcrumb />
        </MemoryRouter>
      )

      // Should render nothing (null)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Label Formatting', () => {
    it('should format special case labels correctly', () => {
      render(
        <MemoryRouter initialEntries={['/app/working-capital']}>
          <Breadcrumb />
        </MemoryRouter>
      )

      // Should use special case mapping
      expect(screen.getByText('Working Capital')).toBeInTheDocument()
    })

    it('should format standard labels with proper capitalization', () => {
      render(
        <MemoryRouter initialEntries={['/app/forecasting']}>
          <Breadcrumb />
        </MemoryRouter>
      )

      // Should capitalize first letter
      expect(screen.getByText('Forecasting')).toBeInTheDocument()
    })

    it('should handle hyphenated labels correctly', () => {
      render(
        <MemoryRouter initialEntries={['/app/data-import']}>
          <Breadcrumb />
        </MemoryRouter>
      )

      // Should use special case mapping
      expect(screen.getByText('Data Import')).toBeInTheDocument()
    })
  })

  describe('Separators & Structure', () => {
    it('should render chevron separators between breadcrumb items', () => {
      render(
        <MemoryRouter initialEntries={['/app/admin/import']}>
          <Breadcrumb />
        </MemoryRouter>
      )

      // Should have ChevronRightIcon SVGs (one for each separator)
      const nav = screen.getByLabelText('Breadcrumb navigation')
      const chevrons = nav.querySelectorAll('svg.h-4.w-4.mx-2')

      // Should have 2 separators (Home › Admin › Import)
      expect(chevrons.length).toBeGreaterThanOrEqual(2)
    })

    it('should display current page with bold styling (not as link)', () => {
      render(
        <MemoryRouter initialEntries={['/app/dashboard']}>
          <Breadcrumb />
        </MemoryRouter>
      )

      const currentPage = screen.getByText('Dashboard')

      // Should be a span, not a link
      expect(currentPage.tagName).toBe('SPAN')

      // Should have aria-current="page"
      expect(currentPage).toHaveAttribute('aria-current', 'page')

      // Should have font-medium class
      expect(currentPage).toHaveClass('font-medium')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for navigation landmark', () => {
      render(
        <MemoryRouter initialEntries={['/app/dashboard']}>
          <Breadcrumb />
        </MemoryRouter>
      )

      const nav = screen.getByLabelText('Breadcrumb navigation')
      expect(nav.tagName).toBe('NAV')
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb navigation')
    })

    it('should have semantic HTML structure (nav > ol > li)', () => {
      render(
        <MemoryRouter initialEntries={['/app/dashboard']}>
          <Breadcrumb />
        </MemoryRouter>
      )

      const nav = screen.getByLabelText('Breadcrumb navigation')
      const ol = nav.querySelector('ol')
      const li = nav.querySelector('li')

      expect(ol).toBeInTheDocument()
      expect(li).toBeInTheDocument()
    })
  })
})
