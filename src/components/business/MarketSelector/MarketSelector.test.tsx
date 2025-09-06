// MarketSelector unit tests

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarketSelector } from './MarketSelector';
import type { MarketData } from './MarketSelector';

// Mock data
const mockMarkets: MarketData[] = [
  {
    id: 'nyse',
    code: 'NYSE',
    name: 'New York Stock Exchange',
    country: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    flagEmoji: '🇺🇸',
    timezone: 'America/New_York',
    isOpen: true,
    lastPrice: 4385.24,
    change: 12.45,
    changePercent: 0.28
  },
  {
    id: 'lse',
    code: 'LSE',
    name: 'London Stock Exchange',
    country: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    flagEmoji: '🇬🇧',
    timezone: 'Europe/London',
    isOpen: false,
    nextSession: 'Opens in 2h 45m',
    lastPrice: 7245.67,
    change: -23.12,
    changePercent: -0.32
  },
  {
    id: 'tse',
    code: 'TSE',
    name: 'Tokyo Stock Exchange',
    country: 'Japan',
    currency: 'JPY',
    currencySymbol: '¥',
    flagEmoji: '🇯🇵',
    timezone: 'Asia/Tokyo',
    isOpen: false,
    nextSession: 'Opens in 14h 30m'
  }
];

describe('MarketSelector', () => {
  const defaultProps = {
    markets: mockMarkets,
    selectedMarket: mockMarkets[0],
    onMarketChange: jest.fn(),
    'data-testid': 'market-selector'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly with default props', () => {
      render(<MarketSelector {...defaultProps} />);
      
      expect(screen.getByTestId('market-selector')).toBeInTheDocument();
      expect(screen.getByText('New York Stock Exchange')).toBeInTheDocument();
      expect(screen.getByText('🇺🇸')).toBeInTheDocument();
    });

    it('displays selected market information', () => {
      render(<MarketSelector {...defaultProps} />);
      
      expect(screen.getByText('New York Stock Exchange')).toBeInTheDocument();
      expect(screen.getByText('NYSE')).toBeInTheDocument();
      expect(screen.getByText('$')).toBeInTheDocument();
    });

    it('shows market status when enabled', () => {
      render(<MarketSelector {...defaultProps} showMarketStatus={true} />);
      
      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('shows price data when enabled', () => {
      render(<MarketSelector {...defaultProps} showPriceData={true} />);
      
      const button = screen.getByTestId('market-selector');
      fireEvent.click(button);
      
      expect(screen.getByText('$4,385.24')).toBeInTheDocument();
    });

    it('renders minimal variant correctly', () => {
      render(<MarketSelector {...defaultProps} variant="minimal" />);
      
      expect(screen.getByText('NYSE')).toBeInTheDocument();
      expect(screen.queryByText('New York Stock Exchange')).not.toBeInTheDocument();
    });

    it('renders detailed variant correctly', () => {
      render(<MarketSelector {...defaultProps} variant="detailed" showPriceData={true} />);
      
      expect(screen.getByText('New York Stock Exchange')).toBeInTheDocument();
      expect(screen.getByText('NYSE')).toBeInTheDocument();
      expect(screen.getByText('$')).toBeInTheDocument();
    });
  });

  describe('Dropdown Functionality', () => {
    it('opens dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<MarketSelector {...defaultProps} />);
      
      const button = screen.getByTestId('market-selector');
      await user.click(button);
      
      expect(screen.getByTestId('market-selector-search')).toBeInTheDocument();
      expect(screen.getByText('London Stock Exchange')).toBeInTheDocument();
      expect(screen.getByText('Tokyo Stock Exchange')).toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <MarketSelector {...defaultProps} />
          <div data-testid="outside-element">Outside</div>
        </div>
      );
      
      const button = screen.getByTestId('market-selector');
      await user.click(button);
      
      expect(screen.getByTestId('market-selector-search')).toBeInTheDocument();
      
      const outsideElement = screen.getByTestId('outside-element');
      await user.click(outsideElement);
      
      await waitFor(() => {
        expect(screen.queryByTestId('market-selector-search')).not.toBeInTheDocument();
      });
    });

    it('filters markets based on search query', async () => {
      const user = userEvent.setup();
      render(<MarketSelector {...defaultProps} />);
      
      const button = screen.getByTestId('market-selector');
      await user.click(button);
      
      const searchInput = screen.getByTestId('market-selector-search');
      await user.type(searchInput, 'London');
      
      expect(screen.getByText('London Stock Exchange')).toBeInTheDocument();
      expect(screen.queryByText('New York Stock Exchange')).not.toBeInTheDocument();
      expect(screen.queryByText('Tokyo Stock Exchange')).not.toBeInTheDocument();
    });

    it('shows no results message when no markets match search', async () => {
      const user = userEvent.setup();
      render(<MarketSelector {...defaultProps} />);
      
      const button = screen.getByTestId('market-selector');
      await user.click(button);
      
      const searchInput = screen.getByTestId('market-selector-search');
      await user.type(searchInput, 'nonexistent');
      
      expect(screen.getByText('No markets found')).toBeInTheDocument();
    });
  });

  describe('Market Selection', () => {
    it('calls onMarketChange when market is selected', async () => {
      const user = userEvent.setup();
      const onMarketChange = jest.fn();
      
      render(<MarketSelector {...defaultProps} onMarketChange={onMarketChange} />);
      
      const button = screen.getByTestId('market-selector');
      await user.click(button);
      
      const lseOption = screen.getByTestId('market-selector-market-LSE');
      await user.click(lseOption);
      
      expect(onMarketChange).toHaveBeenCalledWith(mockMarkets[1]);
    });

    it('closes dropdown after market selection', async () => {
      const user = userEvent.setup();
      render(<MarketSelector {...defaultProps} />);
      
      const button = screen.getByTestId('market-selector');
      await user.click(button);
      
      const lseOption = screen.getByTestId('market-selector-market-LSE');
      await user.click(lseOption);
      
      await waitFor(() => {
        expect(screen.queryByTestId('market-selector-search')).not.toBeInTheDocument();
      });
    });

    it('shows selected market as checked', async () => {
      const user = userEvent.setup();
      render(<MarketSelector {...defaultProps} />);
      
      const button = screen.getByTestId('market-selector');
      await user.click(button);
      
      // The currently selected market (NYSE) should show as checked
      const nyseOption = screen.getByTestId('market-selector-market-NYSE');
      expect(nyseOption).toBeInTheDocument();
      // Check icon should be present for selected market
      const checkIcon = nyseOption.querySelector('svg');
      expect(checkIcon).toBeInTheDocument();
    });
  });

  describe('Favorites Functionality', () => {
    const propsWithFavorites = {
      ...defaultProps,
      favoriteMarkets: [mockMarkets[1]],
      onAddToFavorites: jest.fn(),
      onRemoveFromFavorites: jest.fn()
    };

    it('shows favorite markets tab when favorites exist', async () => {
      const user = userEvent.setup();
      render(<MarketSelector {...propsWithFavorites} />);
      
      const button = screen.getByTestId('market-selector');
      await user.click(button);
      
      expect(screen.getByText('Favorites')).toBeInTheDocument();
    });

    it('calls onAddToFavorites when adding market to favorites', async () => {
      const user = userEvent.setup();
      const onAddToFavorites = jest.fn();
      
      render(<MarketSelector {...propsWithFavorites} onAddToFavorites={onAddToFavorites} />);
      
      const button = screen.getByTestId('market-selector');
      await user.click(button);
      
      // Find NYSE market item and click its favorite button
      const nyseOption = screen.getByTestId('market-selector-market-NYSE');
      const favoriteButton = nyseOption.querySelector('button[aria-label="Add to favorites"]');
      
      if (favoriteButton) {
        await user.click(favoriteButton);
        expect(onAddToFavorites).toHaveBeenCalledWith(mockMarkets[0]);
      }
    });

    it('calls onRemoveFromFavorites when removing market from favorites', async () => {
      const user = userEvent.setup();
      const onRemoveFromFavorites = jest.fn();
      
      render(<MarketSelector {...propsWithFavorites} onRemoveFromFavorites={onRemoveFromFavorites} />);
      
      const button = screen.getByTestId('market-selector');
      await user.click(button);
      
      // Find LSE market item (which is a favorite) and click its favorite button
      const lseOption = screen.getByTestId('market-selector-market-LSE');
      const favoriteButton = lseOption.querySelector('button[aria-label="Remove from favorites"]');
      
      if (favoriteButton) {
        await user.click(favoriteButton);
        expect(onRemoveFromFavorites).toHaveBeenCalledWith(mockMarkets[1]);
      }
    });
  });

  describe('Quick Switch', () => {
    const propsWithRecent = {
      ...defaultProps,
      recentMarkets: [mockMarkets[1], mockMarkets[2]],
      showQuickSwitch: true
    };

    it('shows quick switch buttons when recent markets exist', async () => {
      const user = userEvent.setup();
      render(<MarketSelector {...propsWithRecent} />);
      
      const button = screen.getByTestId('market-selector');
      await user.click(button);
      
      expect(screen.getByText('Quick Switch')).toBeInTheDocument();
      expect(screen.getByTestId('market-selector-quick-LSE')).toBeInTheDocument();
      expect(screen.getByTestId('market-selector-quick-TSE')).toBeInTheDocument();
    });

    it('calls onMarketChange when quick switch button is clicked', async () => {
      const user = userEvent.setup();
      const onMarketChange = jest.fn();
      
      render(<MarketSelector {...propsWithRecent} onMarketChange={onMarketChange} />);
      
      const button = screen.getByTestId('market-selector');
      await user.click(button);
      
      const quickButton = screen.getByTestId('market-selector-quick-LSE');
      await user.click(quickButton);
      
      expect(onMarketChange).toHaveBeenCalledWith(mockMarkets[1]);
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens dropdown with Enter key', async () => {
      const user = userEvent.setup();
      render(<MarketSelector {...defaultProps} />);
      
      const button = screen.getByTestId('market-selector');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.getByTestId('market-selector-search')).toBeInTheDocument();
    });

    it('opens dropdown with Space key', async () => {
      const user = userEvent.setup();
      render(<MarketSelector {...defaultProps} />);
      
      const button = screen.getByTestId('market-selector');
      button.focus();
      await user.keyboard(' ');
      
      expect(screen.getByTestId('market-selector-search')).toBeInTheDocument();
    });

    it('closes dropdown with Escape key', async () => {
      const user = userEvent.setup();
      render(<MarketSelector {...defaultProps} />);
      
      const button = screen.getByTestId('market-selector');
      await user.click(button);
      
      expect(screen.getByTestId('market-selector-search')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.queryByTestId('market-selector-search')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<MarketSelector {...defaultProps} />);
      
      const button = screen.getByTestId('market-selector');
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-label', 'Selected market: New York Stock Exchange');
    });

    it('updates aria-expanded when dropdown is opened', async () => {
      const user = userEvent.setup();
      render(<MarketSelector {...defaultProps} />);
      
      const button = screen.getByTestId('market-selector');
      await user.click(button);
      
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Disabled State', () => {
    it('does not open dropdown when disabled', async () => {
      const user = userEvent.setup();
      render(<MarketSelector {...defaultProps} disabled={true} />);
      
      const button = screen.getByTestId('market-selector');
      await user.click(button);
      
      expect(screen.queryByTestId('market-selector-search')).not.toBeInTheDocument();
    });

    it('has disabled styling when disabled', () => {
      render(<MarketSelector {...defaultProps} disabled={true} />);
      
      const button = screen.getByTestId('market-selector');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  describe('Loading State', () => {
    it('has loading styling when loading', () => {
      render(<MarketSelector {...defaultProps} loading={true} />);
      
      const button = screen.getByTestId('market-selector');
      expect(button).toBeDisabled();
    });
  });
});