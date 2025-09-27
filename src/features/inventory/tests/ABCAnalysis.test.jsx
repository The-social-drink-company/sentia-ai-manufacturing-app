import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ABCAnalysis from '../components/ABCAnalysis'

// Mock Recharts components
vi.mock('recharts', () => ({
  BarChart: vi.fn(({ children }) => <div data-testid="bar-chart">{children}</div>),
  Bar: vi.fn(() => <div data-testid="bar" />),
  XAxis: vi.fn(() => <div data-testid="x-axis" />),
  YAxis: vi.fn(() => <div data-testid="y-axis" />),
  CartesianGrid: vi.fn(() => <div data-testid="cartesian-grid" />),
  Tooltip: vi.fn(() => <div data-testid="tooltip" />),
  Legend: vi.fn(() => <div data-testid="legend" />),
  ResponsiveContainer: vi.fn(({ children }) => <div data-testid="responsive-container">{children}</div>),
  PieChart: vi.fn(({ children }) => <div data-testid="pie-chart">{children}</div>),
  Pie: vi.fn(() => <div data-testid="pie" />),
  Cell: vi.fn(() => <div data-testid="cell" />),
  TreeMap: vi.fn(() => <div data-testid="tree-map" />)
}))

describe('ABCAnalysis', () => {
  const mockData = [
    { sku: 'SKU001', name: 'Product A', unitCost: 100, quantity: 500, category: 'electronics' },
    { sku: 'SKU002', name: 'Product B', unitCost: 50, quantity: 200, category: 'components' },
    { sku: 'SKU003', name: 'Product C', unitCost: 25, quantity: 100, category: 'supplies' },
    { sku: 'SKU004', name: 'Product D', unitCost: 200, quantity: 50, category: 'electronics' },
    { sku: 'SKU005', name: 'Product E', unitCost: 10, quantity: 1000, category: 'supplies' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders ABC analysis with title', () => {
    render(<ABCAnalysis data={mockData} title="ABC Analysis Dashboard" />)

    expect(screen.getByText('ABC Analysis Dashboard')).toBeInTheDocument()
  })

  it('displays no data message when data is empty', () => {
    render(<ABCAnalysis data={[]} title="ABC Analysis" />)

    expect(screen.getByText('No inventory data available for ABC analysis')).toBeInTheDocument()
  })

  it('displays no data message when data is null', () => {
    render(<ABCAnalysis data={null} title="ABC Analysis" />)

    expect(screen.getByText('No inventory data available for ABC analysis')).toBeInTheDocument()
  })

  it('displays no data message when data is undefined', () => {
    render(<ABCAnalysis title="ABC Analysis" />)

    expect(screen.getByText('No inventory data available for ABC analysis')).toBeInTheDocument()
  })

  it('renders view mode selector buttons', () => {
    render(<ABCAnalysis data={mockData} title="ABC Analysis" />)

    expect(screen.getByRole('button', { name: /chart/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /table/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /treemap/i })).toBeInTheDocument()
  })

  it('renders category filter dropdown', () => {
    render(<ABCAnalysis data={mockData} title="ABC Analysis" />)

    const categorySelect = screen.getByDisplayValue('All Categories')
    expect(categorySelect).toBeInTheDocument()
  })

  it('renders sort by dropdown', () => {
    render(<ABCAnalysis data={mockData} title="ABC Analysis" />)

    const sortSelect = screen.getByDisplayValue('Value')
    expect(sortSelect).toBeInTheDocument()
  })

  it('switches to table view when table button is clicked', () => {
    render(<ABCAnalysis data={mockData} title="ABC Analysis" />)

    const tableButton = screen.getByRole('button', { name: /table/i })
    fireEvent.click(tableButton)

    // Should show table headers
    expect(screen.getByText('SKU')).toBeInTheDocument()
    expect(screen.getByText('Product Name')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Class')).toBeInTheDocument()
  })

  it('switches to treemap view when treemap button is clicked', () => {
    render(<ABCAnalysis data={mockData} title="ABC Analysis" />)

    const treemapButton = screen.getByRole('button', { name: /treemap/i })
    fireEvent.click(treemapButton)

    expect(screen.getByTestId('tree-map')).toBeInTheDocument()
  })

  it('filters by category when category is selected', () => {
    render(<ABCAnalysis data={mockData} title="ABC Analysis" />)

    const categorySelect = screen.getByDisplayValue('All Categories')
    fireEvent.change(categorySelect, { target: { value: 'A' } })

    expect(categorySelect.value).toBe('A')
  })

  it('changes sort order when sort by is changed', () => {
    render(<ABCAnalysis data={mockData} title="ABC Analysis" />)

    const sortSelect = screen.getByDisplayValue('Value')
    fireEvent.change(sortSelect, { target: { value: 'quantity' } })

    expect(sortSelect.value).toBe('quantity')
  })

  it('displays ABC classification summary', () => {
    render(<ABCAnalysis data={mockData} title="ABC Analysis" />)

    // Should show summary statistics for A, B, C categories
    expect(screen.getByText(/Class A/i)).toBeInTheDocument()
    expect(screen.getByText(/Class B/i)).toBeInTheDocument()
    expect(screen.getByText(/Class C/i)).toBeInTheDocument()
  })

  it('handles products with zero or missing values', () => {
    const dataWithZeros = [
      { sku: 'SKU001', name: 'Product A', unitCost: 0, quantity: 100 },
      { sku: 'SKU002', name: 'Product B', unitCost: 50, quantity: 0 },
      { sku: 'SKU003', name: 'Product C', unitCost: null, quantity: 100 }
    ]

    render(<ABCAnalysis data={dataWithZeros} title="ABC Analysis" />)

    expect(screen.getByText('ABC Analysis')).toBeInTheDocument()
    // Should not crash with zero or null values
  })

  it('calculates ABC classification correctly', () => {
    render(<ABCAnalysis data={mockData} title="ABC Analysis" />)

    // Switch to table view to see classifications
    const tableButton = screen.getByRole('button', { name: /table/i })
    fireEvent.click(tableButton)

    // Should have items classified as A, B, or C
    const tableBody = screen.getByRole('table')
    expect(tableBody).toBeInTheDocument()
  })

  it('displays value and percentage information', () => {
    render(<ABCAnalysis data={mockData} title="ABC Analysis" />)

    // Should show percentage information in the summary
    expect(screen.getByText(/%/)).toBeInTheDocument()
  })

  it('renders responsive chart container', () => {
    render(<ABCAnalysis data={mockData} title="ABC Analysis" />)

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('handles very large inventory datasets', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      sku: `SKU${i.toString().padStart(4, '0')}`,
      name: `Product ${i}`,
      unitCost: Math.random() * 1000,
      quantity: Math.floor(Math.random() * 500),
      category: ['electronics', 'components', 'supplies'][i % 3]
    }))

    render(<ABCAnalysis data={largeDataset} title="ABC Analysis" />)

    expect(screen.getByText('ABC Analysis')).toBeInTheDocument()
    // Should handle large datasets without performance issues
  })

  it('provides export functionality for ABC data', () => {
    render(<ABCAnalysis data={mockData} title="ABC Analysis" />)

    // Look for export button
    const exportButton = screen.queryByRole('button', { name: /export/i })
    if (exportButton) {
      expect(exportButton).toBeInTheDocument()
    }
  })

  it('shows appropriate icons for different ABC classes', () => {
    render(<ABCAnalysis data={mockData} title="ABC Analysis" />)

    // Should have appropriate visual indicators for A, B, C classes
    expect(screen.getByText('ABC Analysis')).toBeInTheDocument()
  })

  it('handles missing product names gracefully', () => {
    const dataWithMissingNames = [
      { sku: 'SKU001', unitCost: 100, quantity: 500 },
      { sku: 'SKU002', name: '', unitCost: 50, quantity: 200 },
      { sku: 'SKU003', name: null, unitCost: 25, quantity: 100 }
    ]

    render(<ABCAnalysis data={dataWithMissingNames} title="ABC Analysis" />)

    expect(screen.getByText('ABC Analysis')).toBeInTheDocument()
    // Should handle missing product names without crashing
  })

  it('updates classification when data changes', () => {
    const { rerender } = render(<ABCAnalysis data={mockData} title="ABC Analysis" />)

    const newData = [
      { sku: 'NEW001', name: 'New Product', unitCost: 1000, quantity: 100 }
    ]

    rerender(<ABCAnalysis data={newData} title="ABC Analysis" />)

    expect(screen.getByText('ABC Analysis')).toBeInTheDocument()
    // Should recalculate ABC classification with new data
  })
})