import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AlertWidget from './AlertWidget';

describe('AlertWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders the widget title correctly', () => {
    render(<AlertWidget />);
    expect(screen.getByText('System Alerts')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<AlertWidget />);
    expect(screen.getByText('System Alerts')).toBeInTheDocument();

    // Check for loading skeletons
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('displays mock alerts when no alerts prop provided', async () => {
    render(<AlertWidget />);

    vi.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByText('Production Line Stopped')).toBeInTheDocument();
    });

    expect(screen.getByText('Line 3 has stopped due to equipment failure. Immediate attention required.')).toBeInTheDocument();
    expect(screen.getByText('Low Inventory Alert')).toBeInTheDocument();
    expect(screen.getByText('Raw material stock for Product A is below reorder point.')).toBeInTheDocument();
  });

  it('displays provided alerts when alerts prop is passed', async () => {
    const customAlerts = [
      {
        id: 'test-alert-1',
        severity: 'warning',
        title: 'Test Alert',
        message: 'This is a test alert message',
        timestamp: new Date().toISOString()
      }
    ];

    render(<AlertWidget alerts={customAlerts} />);

    vi.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByText('Test Alert')).toBeInTheDocument();
    });

    expect(screen.getByText('This is a test alert message')).toBeInTheDocument();
  });

  it('respects maxAlerts prop', async () => {
    const manyAlerts = Array.from({ length: 10 }, (_, i) => ({
      id: `alert-${i}`,
      severity: 'info',
      title: `Alert ${i}`,
      message: `Message ${i}`,
      timestamp: new Date().toISOString()
    }));

    render(<AlertWidget alerts={manyAlerts} maxAlerts={3} />);

    vi.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByText('Alert 0')).toBeInTheDocument();
    });

    expect(screen.getByText('Alert 1')).toBeInTheDocument();
    expect(screen.getByText('Alert 2')).toBeInTheDocument();
    expect(screen.queryByText('Alert 3')).not.toBeInTheDocument();
  });

  it('displays different severity levels correctly', async () => {
    const alerts = [
      {
        id: 'critical-1',
        severity: 'critical',
        title: 'Critical Alert',
        message: 'Critical issue',
        timestamp: new Date().toISOString()
      },
      {
        id: 'warning-1',
        severity: 'warning',
        title: 'Warning Alert',
        message: 'Warning issue',
        timestamp: new Date().toISOString()
      },
      {
        id: 'info-1',
        severity: 'info',
        title: 'Info Alert',
        message: 'Info message',
        timestamp: new Date().toISOString()
      },
      {
        id: 'success-1',
        severity: 'success',
        title: 'Success Alert',
        message: 'Success message',
        timestamp: new Date().toISOString()
      }
    ];

    render(<AlertWidget alerts={alerts} />);

    vi.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByText('Critical Alert')).toBeInTheDocument();
    });

    expect(screen.getByText('Warning Alert')).toBeInTheDocument();
    expect(screen.getByText('Info Alert')).toBeInTheDocument();
    expect(screen.getByText('Success Alert')).toBeInTheDocument();
  });

  it('allows dismissing alerts when showDismiss is true', async () => {
    const alerts = [
      {
        id: 'dismissible-alert',
        severity: 'info',
        title: 'Dismissible Alert',
        message: 'This alert can be dismissed',
        timestamp: new Date().toISOString()
      }
    ];

    const onDismiss = vi.fn();

    render(<AlertWidget alerts={alerts} showDismiss={true} onDismiss={onDismiss} />);

    vi.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByText('Dismissible Alert')).toBeInTheDocument();
    });

    // Find and click dismiss button
    const dismissButton = screen.getByLabelText('Dismiss alert');
    fireEvent.click(dismissButton);

    // Alert should be removed from display
    expect(screen.queryByText('Dismissible Alert')).not.toBeInTheDocument();
    expect(onDismiss).toHaveBeenCalledWith('dismissible-alert');
  });

  it('shows no alerts message when all alerts are dismissed', async () => {
    const alerts = [
      {
        id: 'only-alert',
        severity: 'info',
        title: 'Only Alert',
        message: 'The only alert',
        timestamp: new Date().toISOString()
      }
    ];

    render(<AlertWidget alerts={alerts} showDismiss={true} />);

    vi.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByText('Only Alert')).toBeInTheDocument();
    });

    // Dismiss the alert
    const dismissButton = screen.getByLabelText('Dismiss alert');
    fireEvent.click(dismissButton);

    // Should show no alerts state
    expect(screen.getByText('No active alerts')).toBeInTheDocument();
    expect(screen.getByText('System operating normally')).toBeInTheDocument();
  });

  it('shows active alert count', async () => {
    const alerts = Array.from({ length: 3 }, (_, i) => ({
      id: `alert-${i}`,
      severity: 'info',
      title: `Alert ${i}`,
      message: `Message ${i}`,
      timestamp: new Date().toISOString()
    }));

    render(<AlertWidget alerts={alerts} />);

    vi.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByText('3 Active')).toBeInTheDocument();
    });
  });

  it('displays action buttons when alerts have actions', async () => {
    const alerts = [
      {
        id: 'actionable-alert',
        severity: 'warning',
        title: 'Actionable Alert',
        message: 'This alert has an action',
        timestamp: new Date().toISOString(),
        action: {
          label: 'Fix Issue',
          url: '/fix-issue'
        }
      }
    ];

    render(<AlertWidget alerts={alerts} />);

    vi.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByText('Fix Issue →')).toBeInTheDocument();
    });
  });

  it('formats timestamps correctly', async () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);

    const alerts = [
      {
        id: 'timed-alert',
        severity: 'info',
        title: 'Timed Alert',
        message: 'Alert with timestamp',
        timestamp: fiveMinutesAgo.toISOString()
      }
    ];

    render(<AlertWidget alerts={alerts} />);

    vi.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
    });
  });

  it('shows "View all alerts" link when there are alerts', async () => {
    const alerts = [
      {
        id: 'single-alert',
        severity: 'info',
        title: 'Single Alert',
        message: 'One alert',
        timestamp: new Date().toISOString()
      }
    ];

    render(<AlertWidget alerts={alerts} />);

    vi.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByText('View all alerts →')).toBeInTheDocument();
    });
  });

  it('handles auto-hide functionality', async () => {
    const alerts = [
      {
        id: 'auto-hide-alert',
        severity: 'info',
        title: 'Auto Hide Alert',
        message: 'This alert will auto-hide',
        timestamp: new Date().toISOString()
      }
    ];

    render(<AlertWidget alerts={alerts} autoHide={true} autoHideDelay={1000} />);

    vi.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByText('Auto Hide Alert')).toBeInTheDocument();
    });

    // Fast forward past auto-hide delay
    vi.advanceTimersByTime(1100);

    await waitFor(() => {
      expect(screen.queryByText('Auto Hide Alert')).not.toBeInTheDocument();
    });
  });
});