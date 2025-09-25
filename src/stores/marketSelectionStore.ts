// Active market selection store

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Market, MarketSelectionState } from './types';

// Sample markets data - in real app this would come from API
const defaultMarkets: Market[] = [
  {
    id: 'lse',
    code: 'LSE',
    name: 'London Stock Exchange',
    country: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    flagEmoji: '🇬🇧',
    timezone: 'Europe/London',
    region: 'UK'
  },
  {
    id: 'nyse',
    code: 'NYSE',
    name: 'New York Stock Exchange',
    country: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    flagEmoji: '🇺🇸',
    timezone: 'America/New_York',
    region: 'US'
  },
  {
    id: 'euronext',
    code: 'EURONEXT',
    name: 'Euronext',
    country: 'Netherlands',
    currency: 'EUR',
    currencySymbol: '€',
    flagEmoji: '🇪🇺',
    timezone: 'Europe/Amsterdam',
    region: 'EU'
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
    region: 'EU'
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
    region: 'ASIA'
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
    region: 'ASIA'
  }
];

interface MarketSelectionStore extends MarketSelectionState {}

export const useMarketSelectionStore = create<MarketSelectionStore>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        activeMarket: defaultMarkets[0], // Default to LSE
        availableMarkets: defaultMarkets,
        recentMarkets: [],
        favoriteMarkets: [],
        isLoading: false,
        error: null,

        actions: {
          selectMarket: (market: Market) => {
            set((state) => {
              const currentMarket = state.activeMarket;
              state.activeMarket = market;

              // Add previous market to recent markets if it exists and is different
              if (currentMarket && currentMarket.id !== market.id) {
                // Remove if already in recent markets
                state.recentMarkets = state.recentMarkets.filter(m => m.id !== currentMarket.id);
                // Add to beginning of recent markets
                state.recentMarkets.unshift(currentMarket);
                // Keep only last 5 recent markets
                state.recentMarkets = state.recentMarkets.slice(0, 5);
              }

              state.error = null;
            });
          },

          addToFavorites: (market: Market) => {
            set((state) => {
              const exists = state.favoriteMarkets.some(m => m.id === market.id);
              if (!exists) {
                state.favoriteMarkets.push(market);
              }
            });
          },

          removeFromFavorites: (marketId: string) => {
            set((state) => {
              state.favoriteMarkets = state.favoriteMarkets.filter(m => m.id !== marketId);
            });
          },

          clearRecentMarkets: () => {
            set((state) => {
              state.recentMarkets = [];
            });
          },

          refreshMarkets: async () => {
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              // In a real app, this would fetch from API
              const response = await fetch('/api/markets');
              
              if (!response.ok) {
                throw new Error('Failed to fetch markets');
              }

              const markets: Market[] = await response.json();

              set((state) => {
                state.availableMarkets = markets;
                
                // If current active market is not in the new list, select the first one
                const activeMarketExists = markets.some(m => m.id === state.activeMarket?.id);
                if (!activeMarketExists && markets.length > 0) {
                  state.activeMarket = markets[0];
                }

                // Remove favorites and recent markets that no longer exist
                state.favoriteMarkets = state.favoriteMarkets.filter(fav =>
                  markets.some(m => m.id === fav.id)
                );
                state.recentMarkets = state.recentMarkets.filter(recent =>
                  markets.some(m => m.id === recent.id)
                );

                state.isLoading = false;
              });
            } catch (error) {
              set((state) => {
                state.error = error instanceof Error ? error.message : 'Unknown error occurred';
                state.isLoading = false;
              });
            }
          }
        }
      })),
      {
        name: 'sentia-market-selection',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          activeMarket: state.activeMarket,
          recentMarkets: state.recentMarkets,
          favoriteMarkets: state.favoriteMarkets
        })
      }
    )
  )
);

// Convenience hooks
export const useActiveMarket = () => {
  return useMarketSelectionStore((state) => state.activeMarket);
};

export const useMarketActions = () => {
  return useMarketSelectionStore((state) => state.actions);
};

export const useMarketsByRegion = () => {
  return useMarketSelectionStore((state) => {
    const marketsByRegion = state.availableMarkets.reduce((acc, market) => {
      if (!acc[market.region]) {
        acc[market.region] = [];
      }
      acc[market.region].push(market);
      return acc;
    }, {} as Record<string, Market[]>);

    return marketsByRegion;
  });
};

export const useFavoriteMarkets = () => {
  return useMarketSelectionStore((state) => ({
    favorites: state.favoriteMarkets,
    addToFavorites: state.actions.addToFavorites,
    removeFromFavorites: state.actions.removeFromFavorites
  }));
};

export const useRecentMarkets = () => {
  return useMarketSelectionStore((state) => ({
    recent: state.recentMarkets,
    clearRecent: state.actions.clearRecentMarkets
  }));
};

// Market utilities
export const getMarketById = (marketId: string): Market | undefined => {
  const state = useMarketSelectionStore.getState();
  return state.availableMarkets.find(market => market.id === marketId);
};

export const getMarketsByRegion = (region: Market['region']): Market[] => {
  const state = useMarketSelectionStore.getState();
  return state.availableMarkets.filter(market => market.region === region);
};

export const isMarketFavorite = (marketId: string): boolean => {
  const state = useMarketSelectionStore.getState();
  return state.favoriteMarkets.some(market => market.id === marketId);
};

export const getMarketTimezone = (market: Market): string => {
  return market.timezone;
};

export const isMarketOpen = (market: Market): boolean => {
  // Simple market hours check - in real app this would be more sophisticated
  const now = new Date();
  const marketTime = new Date(now.toLocaleString('en-US', { timeZone: market.timezone }));
  const hour = marketTime.getHours();
  const day = marketTime.getDay();

  // Weekend check
  if (day === 0 || day === 6) return false;

  // Basic market hours (simplified)
  switch (market.region) {
    case 'UK':
    case 'EU':
      return hour >= 8 && hour < 17;
    case 'US':
      return hour >= 9 && hour < 16;
    case 'ASIA':
      return hour >= 9 && hour < 15;
    default:
      return hour >= 9 && hour < 17;
  }
};

// Market selection validator
export const validateMarketSelection = (market: Market): string[] => {
  const errors: string[] = [];
  const state = useMarketSelectionStore.getState();

  if (!market) {
    errors.push('Market is required');
    return errors;
  }

  if (!market.id || !market.code || !market.name) {
    errors.push('Market must have id, code, and name');
  }

  if (!['UK', 'EU', 'US', 'ASIA', 'OTHER'].includes(market.region)) {
    errors.push('Invalid market region');
  }

  if (!state.availableMarkets.some(m => m.id === market.id)) {
    errors.push('Market is not available');
  }

  return errors;
};