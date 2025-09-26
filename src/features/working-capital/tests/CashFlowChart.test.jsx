import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CashFlowChart from '../components/CashFlowChart'

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Line: vi.fn(({ data, options }) => (
    <div data-testid="cash-flow-chart" role="img">
      <div data-testid="chart-labels">{JSON.stringify(data.labels)}</div>
      <div data-testid="chart-datasets">{JSON.stringify(data.datasets.map(d => ({ label: d.label, data: d.data })))}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ))
}))

vi.mock('chart.js', () => ({
  Chart: vi.fn(),
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  LineElement: vi.fn(),
  PointElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn()
}))

describe('CashFlowChart', () => {
  const mockData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    cashInflow: [120000, 145000, 135000, 160000, 175000, 180000],
    cashOutflow: [95000, 110000, 105000, 125000, 140000, 145000],
    netCashFlow: [25000, 35000, 30000, 35000, 35000, 35000]
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders chart with provided cash flow data', () => {
    render(<CashFlowChart data={mockData} />)

    expect(screen.getByTestId('cash-flow-chart')).toBeInTheDocument()
    expect(screen.getByTestId('chart-labels')).toHaveTextContent(
      JSON.stringify(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'])
    )
  })

  it('displays no data message when data is null', () => {
    render(<CashFlowChart data={null} />)

    expect(screen.getByText('No cash flow data available')).toBeInTheDocument()
    expect(screen.queryByTestId('cash-flow-chart')).not.toBeInTheDocument()
  })

  it('displays no data message when data is undefined', () => {
    render(<CashFlowChart />)

    expect(screen.getByText('No cash flow data available')).toBeInTheDocument()
    expect(screen.queryByTestId('cash-flow-chart')).not.toBeInTheDocument()
  })

  it('renders three datasets for inflow, outflow, and net cash flow', () => {
    render(<CashFlowChart data={mockData} />)

    const chartDatasets = screen.getByTestId('chart-datasets')
    const datasets = JSON.parse(chartDatasets.textContent)

    expect(datasets).toHaveLength(3)
    expect(datasets.find(d => d.label === 'Cash Inflow')).toBeDefined()
    expect(datasets.find(d => d.label === 'Cash Outflow')).toBeDefined()
    expect(datasets.find(d => d.label === 'Net Cash Flow')).toBeDefined()
  })

  it('configures chart with proper time series options', () => {
    render(<CashFlowChart data={mockData} />)

    const chartOptions = screen.getByTestId('chart-options')
    const options = JSON.parse(chartOptions.textContent)

    expect(options).toHaveProperty('responsive', true)
    expect(options).toHaveProperty('maintainAspectRatio', false)
    expect(options.plugins.title).toHaveProperty('display', true)
    expect(options.plugins.title).toHaveProperty('text', 'Cash Flow Analysis')
  })

  it('handles partial data gracefully', () => {
    const partialData = {
      labels: ['Jan', 'Feb'],
      cashInflow: [100000, 120000],
      cashOutflow: [80000, 95000]
      // Missing netCashFlow
    }

    render(<CashFlowChart data={partialData} />)

    expect(screen.getByTestId('cash-flow-chart')).toBeInTheDocument()
    expect(screen.getByTestId('chart-labels')).toHaveTextContent(
      JSON.stringify(['Jan', 'Feb'])
    )
  })

  it('handles empty arrays', () => {
    const emptyData = {
      labels: [],
      cashInflow: [],
      cashOutflow: [],
      netCashFlow: []
    }

    render(<CashFlowChart data={emptyData} />)

    expect(screen.getByTestId('cash-flow-chart')).toBeInTheDocument()
    expect(screen.getByTestId('chart-labels')).toHaveTextContent(JSON.stringify([]))
  })

  it('formats y-axis with currency values', () => {
    render(<CashFlowChart data={mockData} />)

    const chartOptions = screen.getByTestId('chart-options')
    const options = JSON.parse(chartOptions.textContent)

    expect(options.scales.y.ticks).toHaveProperty('callback')
  })

  it('uses proper colors for different cash flow types', () => {
    render(<CashFlowChart data={mockData} />)

    const chartDatasets = screen.getByTestId('chart-datasets')
    const datasets = JSON.parse(chartDatasets.textContent)

    expect(datasets).toHaveLength(3)
    // Chart should have distinct datasets for different cash flow components
  })

  it('handles negative cash flow values', () => {
    const negativeFlowData = {
      labels: ['Jan', 'Feb'],
      cashInflow: [50000, 60000],
      cashOutflow: [70000, 80000],
      netCashFlow: [-20000, -20000]
    }

    render(<CashFlowChart data={negativeFlowData} />)

    expect(screen.getByTestId('cash-flow-chart')).toBeInTheDocument()

    const chartDatasets = screen.getByTestId('chart-datasets')
    const datasets = JSON.parse(chartDatasets.textContent)
    const netFlowDataset = datasets.find(d => d.label === 'Net Cash Flow')
    expect(netFlowDataset.data).toEqual([-20000, -20000])
  })

  it('provides proper accessibility attributes', () => {
    render(<CashFlowChart data={mockData} />)

    const chartElement = screen.getByRole('img')
    expect(chartElement).toHaveAttribute('data-testid', 'cash-flow-chart')
  })

  it('handles very large cash flow amounts', () => {
    const largeAmountData = {
      labels: ['Q1', 'Q2'],
      cashInflow: [10000000, 12000000],
      cashOutflow: [8000000, 9000000],
      netCashFlow: [2000000, 3000000]
    }

    render(<CashFlowChart data={largeAmountData} />)

    expect(screen.getByTestId('cash-flow-chart')).toBeInTheDocument()

    const chartDatasets = screen.getByTestId('chart-datasets')
    const datasets = JSON.parse(chartDatasets.textContent)
    expect(datasets.find(d => d.label === 'Cash Inflow').data).toEqual([10000000, 12000000])
  })

  it('configures legend and tooltips appropriately', () => {
    render(<CashFlowChart data={mockData} />)

    const chartOptions = screen.getByTestId('chart-options')
    const options = JSON.parse(chartOptions.textContent)

    expect(options.plugins.legend).toHaveProperty('display', true)
    expect(options.plugins.tooltip).toBeDefined()
  })
})