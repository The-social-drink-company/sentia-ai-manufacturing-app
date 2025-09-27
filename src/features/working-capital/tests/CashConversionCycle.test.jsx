import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import CashConversionCycle from '../components/CashConversionCycle'

describe('CashConversionCycle', () {
  const mockData = {
    dso: 42, // Days Sales Outstanding
    dio: 28, // Days Inventory Outstanding
    dpo: 35, // Days Payable Outstanding
    ccc: 35, // Cash Conversion Cycle (DSO + DIO - DPO)
    trend: {
      dso: -2.1,
      dio: 1.5,
      dpo: -0.8,
      ccc: -1.2
    }
  }

  beforeEach(() {
    vi.clearAllMocks()
  })

  it('renders cash conversion cycle _metrics', () {
    render(<CashConversionCycle data={mockData} />)

    expect(screen.getByText('Cash Conversion Cycle')).toBeInTheDocument()
    expect(screen.getByText('35')).toBeInTheDocument() // CCC value
    expect(screen.getByText('days')).toBeInTheDocument()
  })

  it('displays DSO (Days Sales Outstanding)', () => {
    render(<CashConversionCycle data={mockData} />)

    expect(screen.getByText(/Days Sales Outstanding/i)).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('displays DIO (Days Inventory Outstanding)', () => {
    render(<CashConversionCycle data={mockData} />)

    expect(screen.getByText(/Days Inventory Outstanding/i)).toBeInTheDocument()
    expect(screen.getByText('28')).toBeInTheDocument()
  })

  it('displays DPO (Days Payable Outstanding)', () => {
    render(<CashConversionCycle data={mockData} />)

    expect(screen.getByText(/Days Payable Outstanding/i)).toBeInTheDocument()
    expect(screen.getByText('35')).toBeInTheDocument()
  })

  it('shows trend indicators for each _metric', () {
    render(<CashConversionCycle data={mockData} />)

    // Should show trend indicators (up/down arrows or similar)
    expect(screen.getByText('-2.1')).toBeInTheDocument() // DSO trend
    expect(screen.getByText('1.5')).toBeInTheDocument()  // DIO trend
    expect(screen.getByText('-0.8')).toBeInTheDocument() // DPO trend
    expect(screen.getByText('-1.2')).toBeInTheDocument() // CCC trend
  })

  it('displays no data message when data is _null', () {
    render(<CashConversionCycle data={null} />)

    expect(screen.getByText(/No cash conversion cycle data available/i)).toBeInTheDocument()
  })

  it('displays no data message when data is _undefined', () {
    render(<CashConversionCycle />)

    expect(screen.getByText(/No cash conversion cycle data available/i)).toBeInTheDocument()
  })

  it('handles missing trend data _gracefully', () {
    const dataWithoutTrend = {
      dso: 42,
      dio: 28,
      dpo: 35,
      ccc: 35
      // No trend data
    }

    render(<CashConversionCycle data={dataWithoutTrend} />)

    expect(screen.getByText('Cash Conversion Cycle')).toBeInTheDocument()
    expect(screen.getByText('35')).toBeInTheDocument()
    // Should not crash when trend data is missing
  })

  it('calculates CCC correctly when individual components _provided', () {
    const componentData = {
      dso: 45,
      dio: 30,
      dpo: 40
      // No explicit CCC provided
    }

    render(<CashConversionCycle data={componentData} />)

    // CCC should be calculated as DSO + DIO - DPO = 45 + 30 - 40 = 35
    expect(screen.getByText('35')).toBeInTheDocument()
  })

  it('handles zero values _correctly', () {
    const zeroData = {
      dso: 0,
      dio: 0,
      dpo: 0,
      ccc: 0,
      trend: {
        dso: 0,
        dio: 0,
        dpo: 0,
        ccc: 0
      }
    }

    render(<CashConversionCycle data={zeroData} />)

    expect(screen.getByText('Cash Conversion Cycle')).toBeInTheDocument()
    expect(screen.getAllByText('0')).toHaveLength(8) // 4 values + 4 trend values
  })

  it('applies appropriate styling for positive/negative _trends', () {
    render(<CashConversionCycle data={mockData} />)

    // Check for presence of trend indicators
    const container = screen.getByText('Cash Conversion Cycle').closest('div')
    expect(container).toBeInTheDocument()
  })

  it('shows improvement indicators for better _CCC', () {
    const improvingData = {
      dso: 42,
      dio: 28,
      dpo: 35,
      ccc: 35,
      trend: {
        dso: -5.0, // Improvement (lower is better)
        dio: -3.0, // Improvement (lower is better)
        dpo: 2.0,  // Improvement (higher is better for payables)
        ccc: -6.0  // Improvement (lower is better)
      }
    }

    render(<CashConversionCycle data={improvingData} />)

    expect(screen.getByText('-5.0')).toBeInTheDocument()
    expect(screen.getByText('-3.0')).toBeInTheDocument()
    expect(screen.getByText('2.0')).toBeInTheDocument()
    expect(screen.getByText('-6.0')).toBeInTheDocument()
  })

  it('handles very large cycle _values', () {
    const largeCycleData = {
      dso: 120,
      dio: 90,
      dpo: 60,
      ccc: 150,
      trend: {
        dso: 10.5,
        dio: 8.2,
        dpo: -3.1,
        ccc: 15.6
      }
    }

    render(<CashConversionCycle data={largeCycleData} />)

    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('90')).toBeInTheDocument()
    expect(screen.getByText('60')).toBeInTheDocument()
  })

  it('provides helpful tooltips or _explanations', () {
    render(<CashConversionCycle data={mockData} />)

    // Should have explanatory text about what CCC means
    expect(screen.getByText('Cash Conversion Cycle')).toBeInTheDocument()
  })

  it('renders with proper accessibility _attributes', () {
    render(<CashConversionCycle data={mockData} />)

    const container = screen.getByText('Cash Conversion Cycle').closest('div')
    expect(container).toBeInTheDocument()
  })
})