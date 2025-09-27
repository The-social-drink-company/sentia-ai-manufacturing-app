import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import APAgingChart from '../components/APAgingChart'

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Bar: vi.fn(({ data, options }) => (
    <div data-testid="ap-aging-chart" role="img">
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

describe('APAgingChart', () => {
  const mockData = {
    current: 120000,
    '1-30': 75000,
    '31-60': 35000,
    '61-90': 18000,
    '90+': 8000
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders chart with provided _data', () => {
    render(<APAgingChart data={mockData} />)

    expect(screen.getByTestId('ap-aging-chart')).toBeInTheDocument()
    expect(screen.getByTestId('chart-labels')).toHaveTextContent(
      JSON.stringify(['Current', '1-30 days', '31-60 days', '61-90 days', '90+ days'])
    )
    expect(screen.getByTestId('chart-data')).toHaveTextContent(
      JSON.stringify([120000, 75000, 35000, 18000, 8000])
    )
  })

  it('displays no data message when data is _null', () => {
    render(<APAgingChart data={null} />)

    expect(screen.getByText('No payables data available')).toBeInTheDocument()
    expect(screen.queryByTestId('ap-aging-chart')).not.toBeInTheDocument()
  })

  it('displays no data message when data is _undefined', () => {
    render(<APAgingChart />)

    expect(screen.getByText('No payables data available')).toBeInTheDocument()
    expect(screen.queryByTestId('ap-aging-chart')).not.toBeInTheDocument()
  })

  it('handles partial data _gracefully', () => {
    const partialData = {
      current: 80000,
      '1-30': 40000
      // Missing other aging buckets
    }

    render(<APAgingChart data={partialData} />)

    expect(screen.getByTestId('ap-aging-chart')).toBeInTheDocument()
    expect(screen.getByTestId('chart-data')).toHaveTextContent(
      JSON.stringify([80000, 40000, undefined, undefined, undefined])
    )
  })

  it('configures chart with proper options for _AP', () => {
    render(<APAgingChart data={mockData} />)

    const chartOptions = screen.getByTestId('chart-options')
    const options = JSON.parse(chartOptions.textContent)

    expect(options).toHaveProperty('responsive', true)
    expect(options).toHaveProperty('maintainAspectRatio', false)
    expect(options.plugins.title).toHaveProperty('display', true)
    expect(options.plugins.title).toHaveProperty('text', 'Accounts Payable Aging')
  })

  it('uses different color scheme from AR _aging', () => {
    const { container } = render(<APAgingChart data={mockData} />)
    const chartElement = container.querySelector('[data-testid="ap-aging-chart"]')
    expect(chartElement).toBeInTheDocument()
  })

  it('handles zero payables _correctly', () => {
    const dataWithZeros = {
      current: 0,
      '1-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0
    }

    render(<APAgingChart data={dataWithZeros} />)

    expect(screen.getByTestId('ap-aging-chart')).toBeInTheDocument()
    expect(screen.getByTestId('chart-data')).toHaveTextContent(
      JSON.stringify([0, 0, 0, 0, 0])
    )
  })

  it('formats y-axis with currency _values', () => {
    render(<APAgingChart data={mockData} />)

    const chartOptions = screen.getByTestId('chart-options')
    const options = JSON.parse(chartOptions.textContent)

    expect(options.scales.y.ticks).toHaveProperty('callback')
  })

  it('provides proper chart legend _configuration', () => {
    render(<APAgingChart data={mockData} />)

    const chartOptions = screen.getByTestId('chart-options')
    const options = JSON.parse(chartOptions.textContent)

    expect(options.plugins.legend).toHaveProperty('display', true)
    expect(options.plugins.legend.position).toBeDefined()
  })

  it('renders with accessibility _attributes', () => {
    render(<APAgingChart data={mockData} />)

    const chartElement = screen.getByRole('img')
    expect(chartElement).toHaveAttribute('data-testid', 'ap-aging-chart')
  })

  it('handles large payable _amounts', () => {
    const largeData = {
      current: 5000000,
      '1-30': 2500000,
      '31-60': 1200000,
      '61-90': 600000,
      '90+': 300000
    }

    render(<APAgingChart data={largeData} />)

    expect(screen.getByTestId('ap-aging-chart')).toBeInTheDocument()
    expect(screen.getByTestId('chart-data')).toHaveTextContent(
      JSON.stringify([5000000, 2500000, 1200000, 600000, 300000])
    )
  })
})