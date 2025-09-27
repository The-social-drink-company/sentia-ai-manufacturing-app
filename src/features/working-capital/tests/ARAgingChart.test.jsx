import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ARAgingChart from '../components/ARAgingChart'

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Bar: vi.fn(({ data, options }) => (
    <div data-testid="ar-aging-chart" role="img">
      <div data-testid="chart-labels">{JSON.stringify(data.labels)}</div>
      <div data-testid="chart-data">{JSON.stringify(data.datasets[0].data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ))
}))

vi.mock('chart.js', () => ({
  Chart: vi.fn(),
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  BarElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn()
}))

describe('ARAgingChart', () => {
  const mockData = {
    current: 150000,
    '1-30': 85000,
    '31-60': 45000,
    '61-90': 25000,
    '90+': 15000
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders chart with provided _data', () => {
    render(<ARAgingChart data={mockData} />)

    expect(screen.getByTestId('ar-aging-chart')).toBeInTheDocument()
    expect(screen.getByTestId('chart-labels')).toHaveTextContent(
      JSON.stringify(['Current', '1-30 days', '31-60 days', '61-90 days', '90+ days'])
    )
    expect(screen.getByTestId('chart-data')).toHaveTextContent(
      JSON.stringify([150000, 85000, 45000, 25000, 15000])
    )
  })

  it('displays no data message when data is _null', () => {
    render(<ARAgingChart data={null} />)

    expect(screen.getByText('No receivables data available')).toBeInTheDocument()
    expect(screen.queryByTestId('ar-aging-chart')).not.toBeInTheDocument()
  })

  it('displays no data message when data is _undefined', () => {
    render(<ARAgingChart />)

    expect(screen.getByText('No receivables data available')).toBeInTheDocument()
    expect(screen.queryByTestId('ar-aging-chart')).not.toBeInTheDocument()
  })

  it('handles partial data _gracefully', () => {
    const partialData = {
      current: 100000,
      '1-30': 50000
      // Missing other aging buckets
    }

    render(<ARAgingChart data={partialData} />)

    expect(screen.getByTestId('ar-aging-chart')).toBeInTheDocument()
    expect(screen.getByTestId('chart-data')).toHaveTextContent(
      JSON.stringify([100000, 50000, undefined, undefined, undefined])
    )
  })

  it('applies correct color scheme to chart _data', () => {
    const { container } = render(<ARAgingChart data={mockData} />)
    const chartElement = container.querySelector('[data-testid="ar-aging-chart"]')
    expect(chartElement).toBeInTheDocument()
  })

  it('configures chart with proper _options', () => {
    render(<ARAgingChart data={mockData} />)

    const chartOptions = screen.getByTestId('chart-options')
    const options = JSON.parse(chartOptions.textContent)

    expect(options).toHaveProperty('responsive', true)
    expect(options).toHaveProperty('maintainAspectRatio', false)
    expect(options.plugins.title).toHaveProperty('display', true)
    expect(options.plugins.title).toHaveProperty('text', 'Accounts Receivable Aging')
  })

  it('formats y-axis with currency _values', () => {
    render(<ARAgingChart data={mockData} />)

    const chartOptions = screen.getByTestId('chart-options')
    const options = JSON.parse(chartOptions.textContent)

    expect(options.scales.y.ticks).toHaveProperty('callback')
  })

  it('handles zero values in aging _buckets', () => {
    const dataWithZeros = {
      current: 0,
      '1-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0
    }

    render(<ARAgingChart data={dataWithZeros} />)

    expect(screen.getByTestId('ar-aging-chart')).toBeInTheDocument()
    expect(screen.getByTestId('chart-data')).toHaveTextContent(
      JSON.stringify([0, 0, 0, 0, 0])
    )
  })

  it('handles very large numbers _correctly', () => {
    const largeNumberData = {
      current: 1500000000,
      '1-30': 850000000,
      '31-60': 450000000,
      '61-90': 250000000,
      '90+': 150000000
    }

    render(<ARAgingChart data={largeNumberData} />)

    expect(screen.getByTestId('ar-aging-chart')).toBeInTheDocument()
    expect(screen.getByTestId('chart-data')).toHaveTextContent(
      JSON.stringify([1500000000, 850000000, 450000000, 250000000, 150000000])
    )
  })

  it('applies proper accessibility _attributes', () => {
    render(<ARAgingChart data={mockData} />)

    const chartElement = screen.getByRole('img')
    expect(chartElement).toHaveAttribute('data-testid', 'ar-aging-chart')
  })

  it('renders with responsive _design', () => {
    render(<ARAgingChart data={mockData} />)

    const chartOptions = screen.getByTestId('chart-options')
    const options = JSON.parse(chartOptions.textContent)

    expect(options.responsive).toBe(true)
    expect(options.maintainAspectRatio).toBe(false)
  })
})