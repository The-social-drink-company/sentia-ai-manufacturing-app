import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import KPIWidget from '../../../../src/components/widgets/KPIWidget'

// Mock Card components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
}))

describe('KPIWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Default Props', () => {
    it('should render with default values when no props provided', () => {
      render(<KPIWidget />)

      expect(screen.getByText('Metric')).toBeInTheDocument()
      expect(screen.getByText('—')).toBeInTheDocument()
      expect(screen.getByText('Awaiting data')).toBeInTheDocument()
    })

    it('should use em dash (—) as default value placeholder', () => {
      render(<KPIWidget />)

      const valueElement = screen.getByText('—')
      expect(valueElement).toHaveClass('text-2xl', 'font-bold')
    })
  })

  describe('Custom Props', () => {
    it('should display custom label', () => {
      render(<KPIWidget label="Total Sales" value="$45,230" helper="Last 30 days" />)

      expect(screen.getByText('Total Sales')).toBeInTheDocument()
    })

    it('should display custom value', () => {
      render(<KPIWidget label="Revenue" value="$123,456" helper="This month" />)

      expect(screen.getByText('$123,456')).toBeInTheDocument()
    })

    it('should display custom helper text', () => {
      render(<KPIWidget label="Orders" value="342" helper="Up 15% from last week" />)

      expect(screen.getByText('Up 15% from last week')).toBeInTheDocument()
    })

    it('should handle numeric values', () => {
      render(<KPIWidget label="Items" value={1234} helper="In stock" />)

      expect(screen.getByText('1234')).toBeInTheDocument()
    })

    it('should handle zero value', () => {
      render(<KPIWidget label="Errors" value={0} helper="No errors" />)

      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should apply correct text styles to label', () => {
      render(<KPIWidget label="Revenue" value="$1000" helper="Today" />)

      const label = screen.getByText('Revenue')
      expect(label).toHaveClass('text-xs', 'text-muted-foreground', 'uppercase', 'tracking-wide', 'font-medium')
    })

    it('should apply correct text styles to value', () => {
      render(<KPIWidget label="Sales" value="$500" helper="This week" />)

      const value = screen.getByText('$500')
      expect(value).toHaveClass('text-2xl', 'font-bold', 'text-foreground')
    })

    it('should apply correct text styles to helper', () => {
      render(<KPIWidget label="Orders" value="42" helper="Pending" />)

      const helper = screen.getByText('Pending')
      expect(helper).toHaveClass('text-xs', 'text-muted-foreground')
    })

    it('should apply Card border and background styles', () => {
      const { container } = render(<KPIWidget label="Test" value="123" helper="Helper" />)

      const card = screen.getByTestId('card')
      expect(card).toHaveClass('border', 'border-border', 'bg-muted/30')
    })

    it('should apply CardContent spacing and padding', () => {
      const { container } = render(<KPIWidget label="Test" value="123" helper="Helper" />)

      const cardContent = screen.getByTestId('card-content')
      expect(cardContent).toHaveClass('space-y-2', 'p-4')
    })
  })

  describe('Layout and Structure', () => {
    it('should render all three text elements', () => {
      render(<KPIWidget label="Revenue" value="$1,234" helper="YTD" />)

      expect(screen.getByText('Revenue')).toBeInTheDocument()
      expect(screen.getByText('$1,234')).toBeInTheDocument()
      expect(screen.getByText('YTD')).toBeInTheDocument()
    })

    it('should render elements in correct order (label, value, helper)', () => {
      const { container } = render(<KPIWidget label="Sales" value="$500" helper="This month" />)

      const cardContent = screen.getByTestId('card-content')
      const paragraphs = cardContent.querySelectorAll('p')

      expect(paragraphs[0]).toHaveTextContent('Sales')
      expect(paragraphs[1]).toHaveTextContent('$500')
      expect(paragraphs[2]).toHaveTextContent('This month')
    })

    it('should use semantic HTML with paragraph tags', () => {
      const { container } = render(<KPIWidget label="Test" value="123" helper="Info" />)

      const paragraphs = container.querySelectorAll('p')
      expect(paragraphs.length).toBe(3)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string values', () => {
      render(<KPIWidget label="" value="" helper="" />)

      const paragraphs = screen.getByTestId('card-content').querySelectorAll('p')
      expect(paragraphs.length).toBe(3)
    })

    it('should handle long text values', () => {
      const longValue = '$1,234,567,890.12'
      render(<KPIWidget label="Large Amount" value={longValue} helper="Very large number" />)

      expect(screen.getByText(longValue)).toBeInTheDocument()
    })

    it('should handle special characters in text', () => {
      render(<KPIWidget label="P&L" value="$1,234 (±5%)" helper="Q1 2025" />)

      expect(screen.getByText('P&L')).toBeInTheDocument()
      expect(screen.getByText('$1,234 (±5%)')).toBeInTheDocument()
    })

    it('should handle percentage values', () => {
      render(<KPIWidget label="Growth Rate" value="15.7%" helper="Month over month" />)

      expect(screen.getByText('15.7%')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should render all text content as accessible text', () => {
      render(<KPIWidget label="Revenue" value="$1,234" helper="This quarter" />)

      // All text should be accessible without special aria attributes
      expect(screen.getByText('Revenue')).toBeVisible()
      expect(screen.getByText('$1,234')).toBeVisible()
      expect(screen.getByText('This quarter')).toBeVisible()
    })
  })
})
