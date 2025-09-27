import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BanknotesIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';
import MetricCard from './MetricCard';

describe('MetricCard', () => {
  const defaultProps = {
    title: 'Working Capital',
    value: 1500000,
    format: 'currency',
    icon: BanknotesIcon,
    color: 'blue'
  };

  describe('Basic Rendering', () => {
    it('renders title correctly', () => {
      render(<MetricCard {...defaultProps} />);
      expect(screen.getByText('Working Capital')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      render(<MetricCard {...defaultProps} />);
      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('applies correct color classes', () => {
      const { container } = render(<MetricCard {...defaultProps} color="blue" />);
      expect(container.firstChild).toHaveClass('border-blue-200');
    });
  });

  describe('Value Formatting', () => {
    it('formats currency values correctly', () => {
      render(<MetricCard {...defaultProps} value={1500000} format="currency" />);
      expect(screen.getByText('$1,500,000')).toBeInTheDocument();
    });

    it('formats percentage values correctly', () => {
      render(<MetricCard {...defaultProps} value={85.5} format="percentage" />);
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });

    it('formats ratio values correctly', () => {
      render(<MetricCard {...defaultProps} value={2.15} format="ratio" />);
      expect(screen.getByText('2.15:1')).toBeInTheDocument();
    });

    it('formats days values correctly', () => {
      render(<MetricCard {...defaultProps} value={45} format="days" />);
      expect(screen.getByText('45 days')).toBeInTheDocument();
    });

    it('formats number values correctly', () => {
      render(<MetricCard {...defaultProps} value={12345.67} format="number" />);
      expect(screen.getByText('12,345.67')).toBeInTheDocument();
    });

    it('handles null/undefined values gracefully', () => {
      render(<MetricCard {...defaultProps} value={null} />);
      expect(screen.getByText('--')).toBeInTheDocument();
    });

    it('handles zero values', () => {
      render(<MetricCard {...defaultProps} value={0} format="currency" />);
      expect(screen.getByText('$0')).toBeInTheDocument();
    });
  });

  describe('Change Indicators', () => {
    it('displays positive change with up arrow', () => {
      render(<MetricCard {...defaultProps} change={5.2} />);
      expect(screen.getByText('5.2%')).toBeInTheDocument();
      expect(screen.getByText('5.2%').closest('div')).toHaveClass('text-green-600');
    });

    it('displays negative change with down arrow', () => {
      render(<MetricCard {...defaultProps} change={-3.1} />);
      expect(screen.getByText('3.1%')).toBeInTheDocument();
      expect(screen.getByText('3.1%').closest('div')).toHaveClass('text-red-600');
    });

    it('displays zero change correctly', () => {
      render(<MetricCard {...defaultProps} change={0} />);
      expect(screen.getByText('0.0%')).toBeInTheDocument();
      expect(screen.getByText('0.0%').closest('div')).toHaveClass('text-gray-500');
    });

    it('hides change indicator when change is not provided', () => {
      render(<MetricCard {...defaultProps} />);
      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });
  });

  describe('Target Comparison', () => {
    it('displays target information when provided', () => {
      render(<MetricCard {...defaultProps} value={1500000} target={2000000} format="currency" />);
      expect(screen.getByText('Target: $2,000,000')).toBeInTheDocument();
      expect(screen.getByText('75% of target')).toBeInTheDocument();
    });

    it('shows achievement status when target is met', () => {
      render(<MetricCard {...defaultProps} value={2100000} target={2000000} format="currency" />);
      expect(screen.getByText(' Target Achieved')).toBeInTheDocument();
    });

    it('hides target information when not provided', () => {
      render(<MetricCard {...defaultProps} />);
      expect(screen.queryByText('Target:')).not.toBeInTheDocument();
      expect(screen.queryByText('of target')).not.toBeInTheDocument();
    });

    it('handles zero target gracefully', () => {
      render(<MetricCard {...defaultProps} value={1500000} target={0} />);
      expect(screen.queryByText('of target')).not.toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('displays progress bar when target is provided', () => {
      render(<MetricCard {...defaultProps} value={750000} target={1000000} />);
      const progressBar = document.querySelector('[style*="width: 75%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('caps progress at 100%', () => {
      render(<MetricCard {...defaultProps} value={1200000} target={1000000} />);
      const progressBar = document.querySelector('[style*="width: 100%"]');
      expect(progressBar).toBeInTheDocument();
    });

    it('handles zero progress', () => {
      render(<MetricCard {...defaultProps} value={0} target={1000000} />);
      const progressBar = document.querySelector('[style*="width: 0%"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Color Variants', () => {
    const colors = ['blue', 'green', 'red', 'purple', 'orange', 'gray'];

    colors.forEach(color => {
      it(`applies ${color} color classes correctly`, () => {
        const { container } = render(<MetricCard {...defaultProps} color={color} />);
        expect(container.firstChild).toHaveClass(`border-${color}-200`);
      });
    });

    it('defaults to blue color when not specified', () => {
      const { container } = render(<MetricCard {...defaultProps} color={undefined} />);
      expect(container.firstChild).toHaveClass('border-blue-200');
    });
  });

  describe('Click Functionality', () => {
    it('calls onClick when card is clicked and onClick is provided', () => {
      const mockOnClick = vi.fn();
      render(<MetricCard {...defaultProps} onClick={mockOnClick} />);

      const card = screen.getByRole('button');
      fireEvent.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('makes card clickable when onClick is provided', () => {
      const mockOnClick = vi.fn();
      render(<MetricCard {...defaultProps} onClick={mockOnClick} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveClass('cursor-pointer');
    });

    it('does not make card clickable when onClick is not provided', () => {
      const { container } = render(<MetricCard {...defaultProps} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(container.firstChild).not.toHaveClass('cursor-pointer');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA label when clickable', () => {
      const mockOnClick = vi.fn();
      render(<MetricCard {...defaultProps} onClick={mockOnClick} />);

      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Working Capital')
      );
    });

    it('has proper keyboard navigation when clickable', () => {
      const mockOnClick = vi.fn();
      render(<MetricCard {...defaultProps} onClick={mockOnClick} />);

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Dark Mode', () => {
    it('applies dark mode classes', () => {
      const { container } = render(<MetricCard {...defaultProps} />);
      expect(container.firstChild).toHaveClass('dark:bg-gray-800');
      expect(container.firstChild).toHaveClass('dark:border-gray-700');
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading prop is true', () => {
      render(<MetricCard {...defaultProps} loading={true} />);
      expect(screen.getByText('Working Capital')).toBeInTheDocument();
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('shows actual data when loading is false', () => {
      render(<MetricCard {...defaultProps} loading={false} />);
      expect(screen.getByText('$1,500,000')).toBeInTheDocument();
      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very large numbers', () => {
      render(<MetricCard {...defaultProps} value={1000000000} format="currency" />);
      expect(screen.getByText('$1,000,000,000')).toBeInTheDocument();
    });

    it('handles very small numbers', () => {
      render(<MetricCard {...defaultProps} value={0.01} format="currency" />);
      expect(screen.getByText('$0.01')).toBeInTheDocument();
    });

    it('handles negative values', () => {
      render(<MetricCard {...defaultProps} value={-500000} format="currency" />);
      expect(screen.getByText('-$500,000')).toBeInTheDocument();
    });

    it('handles decimal ratios', () => {
      render(<MetricCard {...defaultProps} value={1.234567} format="ratio" />);
      expect(screen.getByText('1.23:1')).toBeInTheDocument();
    });
  });
});