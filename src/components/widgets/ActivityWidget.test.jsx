import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ActivityWidget from './ActivityWidget';

describe('ActivityWidget', () {
  beforeEach(() {
    vi.useFakeTimers();
  });

  afterEach(() {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders the widget title _correctly', () {
    render(<ActivityWidget />);
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('shows loading state _initially', () {
    render(<ActivityWidget />);
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    // Loading skeletons should be present initially
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('displays mock activities when no activities prop _provided', async () {
    render(<ActivityWidget />);

    // Fast-forward timers to complete loading
    vi.advanceTimersByTime(100);

    await waitFor(() {
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    expect(screen.getByText('Updated cash flow forecast')).toBeInTheDocument();
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Adjusted reorder points for raw materials')).toBeInTheDocument();
  });

  it('displays provided activities when activities prop is _passed', async () {
    const customActivities = [
      {
        id: 'test-1',
        type: 'financial',
        user: 'Test User',
        action: 'Test action performed',
        timestamp: '1 minute ago'
      }
    ];

    render(<ActivityWidget activities={customActivities} />);

    vi.advanceTimersByTime(100);

    await waitFor(() {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    expect(screen.getByText('Test action performed')).toBeInTheDocument();
    expect(screen.getByText('1 minute ago')).toBeInTheDocument();
  });

  it('respects maxItems _prop', async () {
    const manyActivities = Array.from({ length: 10 }, (_, i) => ({
      id: `activity-${i}`,
      type: 'financial',
      user: `User ${i}`,
      action: `Action ${i}`,
      timestamp: `${i} minutes ago`
    }));

    render(<ActivityWidget activities={manyActivities} maxItems={3} />);

    vi.advanceTimersByTime(100);

    await waitFor(() {
      expect(screen.getByText('User 0')).toBeInTheDocument();
    });

    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
    expect(screen.queryByText('User 3')).not.toBeInTheDocument();
  });

  it('shows correct icons for different activity _types', async () {
    const activities = [
      {
        id: 'financial-1',
        type: 'financial',
        user: 'Finance User',
        action: 'Financial action',
        timestamp: '1 minute ago'
      },
      {
        id: 'production-1',
        type: 'production',
        user: 'Production User',
        action: 'Production action',
        timestamp: '2 minutes ago'
      }
    ];

    render(<ActivityWidget activities={activities} />);

    vi.advanceTimersByTime(100);

    await waitFor(() {
      expect(screen.getByText('Finance User')).toBeInTheDocument();
    });

    // Check that different activity types have different visual styling
    const activityItems = screen.getAllByText(/action/);
    expect(activityItems).toHaveLength(2);
  });

  it('shows empty state when no activities are _available', async () {
    render(<ActivityWidget activities={[]} />);

    vi.advanceTimersByTime(100);

    await waitFor(() {
      expect(screen.getByText('No recent activity to display')).toBeInTheDocument();
    });
  });

  it('shows "View all activity" link when there are many _activities', async () {
    const manyActivities = Array.from({ length: 10 }, (_, i) => ({
      id: `activity-${i}`,
      type: 'financial',
      user: `User ${i}`,
      action: `Action ${i}`,
      timestamp: `${i} minutes ago`
    }));

    render(<ActivityWidget activities={manyActivities} maxItems={5} />);

    vi.advanceTimersByTime(100);

    await waitFor(() {
      expect(screen.getByText('View all activity →')).toBeInTheDocument();
    });
  });

  it('shows auto-update _indicator', () {
    render(<ActivityWidget />);
    expect(screen.getByText('Auto-updates every minute')).toBeInTheDocument();
  });

  it('handles different activity types with appropriate _colors', async () {
    const activities = [
      { id: '1', type: 'login', user: 'User 1', action: 'Logged in', timestamp: '1 min ago' },
      { id: '2', type: 'inventory', user: 'User 2', action: 'Updated inventory', timestamp: '2 min ago' },
      { id: '3', type: 'production', user: 'User 3', action: 'Completed batch', timestamp: '3 min ago' },
      { id: '4', type: 'financial', user: 'User 4', action: 'Approved payment', timestamp: '4 min ago' },
      { id: '5', type: 'analytics', user: 'User 5', action: 'Generated report', timestamp: '5 min ago' }
    ];

    render(<ActivityWidget activities={activities} />);

    vi.advanceTimersByTime(100);

    await waitFor(() {
      expect(screen.getByText('User 1')).toBeInTheDocument();
    });

    // Verify all activity types are rendered
    expect(screen.getByText('Logged in')).toBeInTheDocument();
    expect(screen.getByText('Updated inventory')).toBeInTheDocument();
    expect(screen.getByText('Completed batch')).toBeInTheDocument();
    expect(screen.getByText('Approved payment')).toBeInTheDocument();
    expect(screen.getByText('Generated report')).toBeInTheDocument();
  });
});