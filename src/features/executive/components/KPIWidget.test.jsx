import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrendingUpIcon } from '@heroicons/react/24/outline';
import KPIWidget from './KPIWidget';

describe('KPIWidget', () => {
  const mockProps = {
    id: 'test-kpi',
    title: 'Revenue',
    value: 1250000,
    target: 1500000,
    trend: 8.5,
    icon: TrendingUpIcon,
    formatter: (val) => `$${(val / 1000000).toFixed(1)}M`,
    color: 'blue',
    onClick: vi.fn()
  };

  it('renders KPI widget with correct data', () => {
    render(<KPIWidget {...mockProps} />);

    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$1.3M')).toBeInTheDocument();
    expect(screen.getByText('Target:')).toBeInTheDocument();
    expect(screen.getByText('$1.5M')).toBeInTheDocument();
    expect(screen.getByText('8.5%')).toBeInTheDocument();
  });

  it('shows positive trend indicator', () => {
    render(<KPIWidget {...mockProps} />);

    const trendElement = screen.getByText('8.5%');
    expect(trendElement.closest('.text-green-600')).toBeInTheDocument();
  });

  it('shows negative trend indicator', () => {
    const negativeProps = { ...mockProps, trend: -3.2 };
    render(<KPIWidget {...negativeProps} />);

    const trendElement = screen.getByText('3.2%');
    expect(trendElement.closest('.text-red-600')).toBeInTheDocument();
  });

  it('displays target achievement status', () => {
    render(<KPIWidget {...mockProps} />);

    expect(screen.getByText('83% of target')).toBeInTheDocument();
  });

  it('shows met status when value exceeds target', () => {
    const metTargetProps = { ...mockProps, value: 1600000 };
    render(<KPIWidget {...metTargetProps} />);

    expect(screen.getByText('✓ Met')).toBeInTheDocument();
  });

  it('handles click events', () => {
    render(<KPIWidget {...mockProps} />);

    const widget = screen.getByRole('button', { name: /revenue/i });
    fireEvent.click(widget);

    expect(mockProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('renders with different color themes', () => {
    const greenProps = { ...mockProps, color: 'green' };
    const { container } = render(<KPIWidget {...greenProps} />);

    expect(container.firstChild).toHaveClass('bg-green-50');
  });

  it('shows performance bar with correct width', () => {
    const { container } = render(<KPIWidget {...mockProps} />);

    const performanceBar = container.querySelector('.h-2.rounded-full');
    expect(performanceBar).toHaveStyle({ width: '83%' });
  });

  it('handles zero target gracefully', () => {
    const zeroTargetProps = { ...mockProps, target: 0 };
    render(<KPIWidget {...zeroTargetProps} />);

    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('applies correct color classes', () => {
    const purpleProps = { ...mockProps, color: 'purple' };
    const { container } = render(<KPIWidget {...purpleProps} />);

    expect(container.firstChild).toHaveClass('bg-purple-50', 'text-purple-700', 'border-purple-200');
  });
});