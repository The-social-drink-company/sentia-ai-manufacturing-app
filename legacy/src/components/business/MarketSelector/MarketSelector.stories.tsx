// MarketSelector Storybook stories

import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { MarketSelector } from './MarketSelector';
import type { MarketData } from './MarketSelector';

const meta: Meta<typeof MarketSelector> = {
  title: 'Business/MarketSelector',
  component: MarketSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A market selector with flags, currency display, and quick switch functionality. Supports recent markets, favorites, and real-time market status.'
      }
    }
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the selector'
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'minimal', 'detailed'],
      description: 'Visual variant of the selector'
    },
    showQuickSwitch: {
      control: { type: 'boolean' },
      description: 'Show quick switch buttons for recent markets'
    },
    showMarketStatus: {
      control: { type: 'boolean' },
      description: 'Display market open/closed status'
    },
    showPriceData: {
      control: { type: 'boolean' },
      description: 'Show current price and change data'
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample market data
const sampleMarkets: MarketData[] = [
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
    changePercent: 0.28,
    volume: 2547891
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
    changePercent: -0.32,
    volume: 1234567
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
    nextSession: 'Opens in 14h 30m',
    lastPrice: 28456.78,
    change: 145.23,
    changePercent: 0.51,
    volume: 3456789
  },
  {
    id: 'dax',
    code: 'DAX',
    name: 'Deutsche Börse',
    country: 'Germany',
    currency: 'EUR',
    currencySymbol: '€',
    flagEmoji: '🇩🇪',
    timezone: 'Europe/Berlin',
    isOpen: true,
    lastPrice: 15678.90,
    change: -45.67,
    changePercent: -0.29,
    volume: 987654
  },
  {
    id: 'hkex',
    code: 'HKEX',
    name: 'Hong Kong Exchange',
    country: 'Hong Kong',
    currency: 'HKD',
    currencySymbol: 'HK$',
    flagEmoji: '🇭🇰',
    timezone: 'Asia/Hong_Kong',
    isOpen: false,
    nextSession: 'Opens in 12h 15m',
    lastPrice: 18234.56,
    change: 78.90,
    changePercent: 0.43,
    volume: 2345678
  }
];

export const Default: Story = {
  args: {
    markets: sampleMarkets,
    selectedMarket: sampleMarkets[0],
    onMarketChange: action('market-changed'),
    showQuickSwitch: true,
    showMarketStatus: true,
    showPriceData: false
  }
};

export const WithPriceData: Story = {
  args: {
    markets: sampleMarkets,
    selectedMarket: sampleMarkets[0],
    onMarketChange: action('market-changed'),
    showQuickSwitch: true,
    showMarketStatus: true,
    showPriceData: true
  }
};

export const MinimalVariant: Story = {
  args: {
    markets: sampleMarkets,
    selectedMarket: sampleMarkets[0],
    onMarketChange: action('market-changed'),
    variant: 'minimal',
    showQuickSwitch: false,
    showMarketStatus: false,
    showPriceData: false
  }
};

export const DetailedVariant: Story = {
  args: {
    markets: sampleMarkets,
    selectedMarket: sampleMarkets[0],
    onMarketChange: action('market-changed'),
    variant: 'detailed',
    showQuickSwitch: true,
    showMarketStatus: true,
    showPriceData: true
  }
};

export const WithFavorites: Story = {
  args: {
    markets: sampleMarkets,
    selectedMarket: sampleMarkets[0],
    onMarketChange: action('market-changed'),
    recentMarkets: [sampleMarkets[0], sampleMarkets[1], sampleMarkets[2]],
    favoriteMarkets: [sampleMarkets[1], sampleMarkets[3]],
    onAddToFavorites: action('add-to-favorites'),
    onRemoveFromFavorites: action('remove-from-favorites'),
    showQuickSwitch: true,
    showMarketStatus: true,
    showPriceData: true
  }
};

export const SmallSize: Story = {
  args: {
    markets: sampleMarkets,
    selectedMarket: sampleMarkets[0],
    onMarketChange: action('market-changed'),
    size: 'sm',
    showQuickSwitch: true,
    showMarketStatus: true
  }
};

export const LargeSize: Story = {
  args: {
    markets: sampleMarkets,
    selectedMarket: sampleMarkets[0],
    onMarketChange: action('market-changed'),
    size: 'lg',
    variant: 'detailed',
    showQuickSwitch: true,
    showMarketStatus: true,
    showPriceData: true
  }
};

export const Loading: Story = {
  args: {
    markets: sampleMarkets,
    selectedMarket: sampleMarkets[0],
    onMarketChange: action('market-changed'),
    loading: true
  }
};

export const Disabled: Story = {
  args: {
    markets: sampleMarkets,
    selectedMarket: sampleMarkets[0],
    onMarketChange: action('market-changed'),
    disabled: true
  }
};

// Interactive demo
export const InteractiveDemo: Story = {
  args: {
    markets: sampleMarkets,
    selectedMarket: sampleMarkets[0],
    onMarketChange: action('market-changed'),
    recentMarkets: [sampleMarkets[0], sampleMarkets[1], sampleMarkets[2], sampleMarkets[3]],
    favoriteMarkets: [sampleMarkets[1], sampleMarkets[3]],
    onAddToFavorites: action('add-to-favorites'),
    onRemoveFromFavorites: action('remove-from-favorites'),
    variant: 'detailed',
    showQuickSwitch: true,
    showMarketStatus: true,
    showPriceData: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo with all features enabled. Try clicking on different markets, adding/removing favorites, and using the quick switch buttons.'
      }
    }
  }
};