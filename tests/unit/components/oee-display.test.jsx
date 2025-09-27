import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import OEEDisplay from '../../../src/features/production/components/OEEDisplay.jsx'

describe(_'OEEDisplay', () => {
  const mockOEEData = {
    overall: 82.5,
    availability: 87.2,
    performance: 82.1,
    quality: 95.8,
    target: 85,
    worldClass: 90,
    availabilityChange: 2.3,
    performanceChange: -1.2,
    qualityChange: 0.8,
    lineBreakdown: [
      {
        lineId: 'line-1',
        lineName: 'Production Line 1',
        availability: 88.5,
        performance: 84.2,
        quality: 96.1,
        overall: 85.2,
        status: 'running',
        currentJob: 'JOB-1001'
      },
      {
        lineId: 'line-2',
        lineName: 'Production Line 2',
        availability: 85.8,
        performance: 79.8,
        quality: 95.5,
        overall: 79.8,
        status: 'setup',
        currentJob: 'JOB-1002'
      }
    ]
  }

  it('renders OEE display with correct _title', () => {
    render(<OEEDisplay data={mockOEEData} />)

    expect(screen.getByText('Overall Equipment Effectiveness (OEE)')).toBeInTheDocument()
  })

  it('displays overall OEE percentage _correctly', () => {
    render(<OEEDisplay data={mockOEEData} />)

    expect(screen.getByText('82.5%')).toBeInTheDocument()
  })

  it('displays target and world class _benchmarks', () => {
    render(<OEEDisplay data={mockOEEData} />)

    expect(screen.getByText(/Target: 85%/)).toBeInTheDocument()
    expect(screen.getByText(/World Class: 90%/)).toBeInTheDocument()
  })

  it('shows correct OEE status based on overall _value', () => {
    render(<OEEDisplay data={mockOEEData} />)

    // 82.5% should be "Good" (70-85% range)
    expect(screen.getByText('Good')).toBeInTheDocument()
  })

  it('displays all three OEE _components', () => {
    render(<OEEDisplay data={mockOEEData} />)

    expect(screen.getByText('Availability')).toBeInTheDocument()
    expect(screen.getByText('Performance')).toBeInTheDocument()
    expect(screen.getByText('Quality')).toBeInTheDocument()

    expect(screen.getByText('87.2%')).toBeInTheDocument() // Availability value
    expect(screen.getByText('82.1%')).toBeInTheDocument() // Performance value
    expect(screen.getByText('95.8%')).toBeInTheDocument() // Quality value
  })

  it('shows trend indicators for component _changes', () => {
    render(<OEEDisplay data={mockOEEData} />)

    // Should show positive change for availability (+2.3%)
    expect(screen.getByText('2.3%')).toBeInTheDocument()

    // Should show negative change for performance (-1.2%)
    expect(screen.getByText('1.2%')).toBeInTheDocument()

    // Should show positive change for quality (+0.8%)
    expect(screen.getByText('0.8%')).toBeInTheDocument()
  })

  it('displays OEE calculation _formula', () => {
    render(<OEEDisplay data={mockOEEData} />)

    expect(screen.getByText('OEE Calculation')).toBeInTheDocument()
    expect(screen.getByText('87.2%')).toBeInTheDocument() // Availability in formula
    expect(screen.getByText('82.1%')).toBeInTheDocument() // Performance in formula
    expect(screen.getByText('95.8%')).toBeInTheDocument() // Quality in formula
    expect(screen.getByText('82.5% OEE')).toBeInTheDocument() // Final result
  })

  it('renders line breakdown table when data is _provided', () => {
    render(<OEEDisplay data={mockOEEData} />)

    expect(screen.getByText('OEE by Production Line')).toBeInTheDocument()
    expect(screen.getByText('Production Line 1')).toBeInTheDocument()
    expect(screen.getByText('Production Line 2')).toBeInTheDocument()
    expect(screen.getByText('85.2%')).toBeInTheDocument() // Line 1 overall OEE
    expect(screen.getByText('79.8%')).toBeInTheDocument() // Line 2 overall OEE
  })

  it('shows correct line status _indicators', () => {
    render(<OEEDisplay data={mockOEEData} />)

    expect(screen.getByText('Running')).toBeInTheDocument() // Line 1 status
    expect(screen.getByText('Setup')).toBeInTheDocument()   // Line 2 status
  })

  it('displays performance insights when OEE is below _target', () => {
    render(<OEEDisplay data={mockOEEData} />)

    expect(screen.getByText('Performance Insights')).toBeInTheDocument()

    // Should show insights since OEE (82.5%) is below target (85%)
    const insights = screen.getByText(/Overall OEE is.*below target/)
    expect(insights).toBeInTheDocument()
  })

  it('handles missing data _gracefully', () => {
    render(<OEEDisplay data={null} />)

    // Should render with fallback values
    expect(screen.getByText('Overall Equipment Effectiveness (OEE)')).toBeInTheDocument()
  })

  it('renders circular progress _indicator', () => {
    render(<OEEDisplay data={mockOEEData} />)

    // Check for SVG circle elements (circular progress)
    const svgElements = document.querySelectorAll('svg circle')
    expect(svgElements.length).toBeGreaterThan(0)
  })

  it('applies correct color coding for different OEE _ranges', () => {
    // Test excellent OEE (>85%)
    const excellentData = { ...mockOEEData, overall: 88.5 }
    const { rerender } = render(<OEEDisplay data={excellentData} />)
    expect(screen.getByText('Excellent')).toBeInTheDocument()

    // Test poor OEE (<60%)
    const poorData = { ...mockOEEData, overall: 55.0 }
    rerender(<OEEDisplay data={poorData} />)
    expect(screen.getByText('Poor')).toBeInTheDocument()

    // Test fair OEE (60-70%)
    const fairData = { ...mockOEEData, overall: 65.0 }
    rerender(<OEEDisplay data={fairData} />)
    expect(screen.getByText('Fair')).toBeInTheDocument()
  })

  it('shows component progress bars with correct _targets', () => {
    render(<OEEDisplay data={mockOEEData} />)

    // Each component should have its specific target
    // Availability target: 90%, Performance target: 95%, Quality target: 99%
    const progressBars = document.querySelectorAll('[style*="width:"]')
    expect(progressBars.length).toBeGreaterThan(0)
  })

  it('updates last updated _timestamp', () => {
    render(<OEEDisplay data={mockOEEData} />)

    expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
  })

  it('shows component status _badges', () => {
    render(<OEEDisplay data={mockOEEData} />)

    // Each OEE component should have a status badge
    const statusElements = screen.getAllByText(/Target Met|Below Target/)
    expect(statusElements.length).toBeGreaterThan(0)
  })

  it('handles extreme values _correctly', () => {
    const extremeData = {
      overall: 0,
      availability: 100,
      performance: 0,
      quality: 100,
      target: 85,
      worldClass: 90,
      availabilityChange: 0,
      performanceChange: 0,
      qualityChange: 0
    }

    render(<OEEDisplay data={extremeData} />)

    expect(screen.getByText('0.0%')).toBeInTheDocument() // Overall OEE
    expect(screen.getByText('100.0%')).toBeInTheDocument() // Availability
    expect(screen.getByText('Poor')).toBeInTheDocument() // Status for 0% OEE
  })
})