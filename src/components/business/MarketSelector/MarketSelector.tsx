// Market Selector with flags, currency display, and quick switch functionality

import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Globe, 
  Search,
  Check,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import { cn } from '@/lib/utils';

export interface MarketData {
  id: string;
  code: string;
  name: string;
  country: string;
  currency: string;
  currencySymbol: string;
  flagEmoji: string;
  timezone: string;
  isOpen?: boolean;
  nextSession?: string;
  lastPrice?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
}

export interface MarketGroup {
  id: string;
  name: string;
  markets: MarketData[];
}

export interface MarketSelectorProps {
  markets: MarketData[];
  marketGroups?: MarketGroup[];
  selectedMarket: MarketData;
  onMarketChange: (market: MarketData) => void;
  showQuickSwitch?: boolean;
  showMarketStatus?: boolean;
  showPriceData?: boolean;
  recentMarkets?: MarketData[];
  favoriteMarkets?: MarketData[];
  onAddToFavorites?: (market: MarketData) => void;
  onRemoveFromFavorites?: (market: MarketData) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'detailed';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  'data-testid'?: string;
}

const MarketSelector: React.FC<MarketSelectorProps> = ({
  markets,
  marketGroups,
  selectedMarket,
  onMarketChange,
  showQuickSwitch = true,
  showMarketStatus = true,
  showPriceData = false,
  recentMarkets = [],
  favoriteMarkets = [],
  onAddToFavorites,
  onRemoveFromFavorites,
  size = 'md',
  variant = 'default',
  disabled = false,
  loading = false,
  className,
  'data-testid': testId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'favorites'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Filter markets based on search query
  const filteredMarkets = markets.filter(market =>
    market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    market.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    market.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get markets for current tab
  const getMarketsForTab = () => {
    switch (activeTab) {
      case 'recent':
        return recentMarkets.filter(market =>
          market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          market.code.toLowerCase().includes(searchQuery.toLowerCase())
        );
      case 'favorites':
        return favoriteMarkets.filter(market =>
          market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          market.code.toLowerCase().includes(searchQuery.toLowerCase())
        );
      default:
        return filteredMarkets;
    }
  };

  const displayMarkets = getMarketsForTab();

  // Format price change
  const formatChange = (change: number, changePercent: number) => {
    const isPositive = change > 0;
    const isNegative = change < 0;
    
    return {
      color: isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500',
      icon: isPositive ? TrendingUp : isNegative ? TrendingDown : null,
      text: `${isPositive ? '+' : ''}${change.toFixed(2)} (${isPositive ? '+' : ''}${changePercent.toFixed(2)}%)`
    };
  };

  // Get market status
  const getMarketStatus = (market: MarketData) => {
    if (market.isOpen) {
      return {
        color: 'text-green-600',
        bg: 'bg-green-50',
        text: 'Open',
        icon: Zap
      };
    }
    
    return {
      color: 'text-gray-600',
      bg: 'bg-gray-50',
      text: market.nextSession || 'Closed',
      icon: Clock
    };
  };

  // Handle market selection
  const handleMarketSelect = (market: MarketData) => {
    onMarketChange(market);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 px-2 text-xs';
      case 'lg':
        return 'h-12 px-4 text-base';
      default:
        return 'h-10 px-3 text-sm';
    }
  };

  const isFavorite = (market: MarketData) => 
    favoriteMarkets.some(fav => fav.id === market.id);

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Main Trigger Button */}
      <Button
        variant="outline"
        className={cn(
          'justify-between w-full',
          getSizeClasses(),
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        data-testid={testId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Selected market: ${selectedMarket.name}`}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <span className="text-lg flex-shrink-0" role="img" aria-label={selectedMarket.country}>
            {selectedMarket.flagEmoji}
          </span>
          
          {variant === 'minimal' ? (
            <span className="font-medium truncate">{selectedMarket.code}</span>
          ) : (
            <div className="flex flex-col items-start flex-1 min-w-0">
              <div className="flex items-center space-x-2 w-full">
                <span className="font-medium text-left truncate">{selectedMarket.name}</span>
                {showMarketStatus && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    getMarketStatus(selectedMarket).color,
                    getMarketStatus(selectedMarket).bg
                  )}>
                    {getMarketStatus(selectedMarket).text}
                  </span>
                )}
              </div>
              
              {variant === 'detailed' && (
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{selectedMarket.code}</span>
                  <span>•</span>
                  <span>{selectedMarket.currencySymbol}</span>
                  {showPriceData && selectedMarket.lastPrice && (
                    <>
                      <span>•</span>
                      <span>{selectedMarket.currencySymbol}{selectedMarket.lastPrice.toFixed(2)}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        <ChevronDown className={cn(
          'h-4 w-4 flex-shrink-0 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-96 overflow-hidden">
          {/* Search and Tabs */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 space-y-3">
            <Input
              leftIcon={<Search className="h-4 w-4" />}
              placeholder="Search markets..."
              value={searchQuery}
              onChange={setSearchQuery}
              size="sm"
              data-testid={`${testId}-search`}
            />
            
            {(recentMarkets.length > 0 || favoriteMarkets.length > 0) && (
              <div className="flex space-x-1">
                <Button
                  variant={activeTab === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('all')}
                  className="text-xs h-7"
                >
                  All
                </Button>
                {recentMarkets.length > 0 && (
                  <Button
                    variant={activeTab === 'recent' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('recent')}
                    className="text-xs h-7"
                  >
                    Recent
                  </Button>
                )}
                {favoriteMarkets.length > 0 && (
                  <Button
                    variant={activeTab === 'favorites' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('favorites')}
                    className="text-xs h-7"
                  >
                    Favorites
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Markets List */}
          <div className="max-h-64 overflow-y-auto">
            {displayMarkets.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No markets found</p>
              </div>
            ) : (
              displayMarkets.map((market) => {
                const status = getMarketStatus(market);
                const isSelected = market.id === selectedMarket.id;
                const isFav = isFavorite(market);
                
                return (
                  <div
                    key={market.id}
                    className={cn(
                      'flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors',
                      isSelected && 'bg-blue-50 dark:bg-blue-900/20'
                    )}
                    onClick={() => handleMarketSelect(market)}
                    data-testid={`${testId}-market-${market.code}`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <span className="text-lg flex-shrink-0" role="img" aria-label={market.country}>
                        {market.flagEmoji}
                      </span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm truncate">{market.name}</span>
                          {isSelected && <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{market.code}</span>
                          <span>•</span>
                          <span>{market.currencySymbol}</span>
                          {showMarketStatus && (
                            <>
                              <span>•</span>
                              <span className={status.color}>{status.text}</span>
                            </>
                          )}
                        </div>
                        
                        {showPriceData && market.lastPrice && market.change !== undefined && (
                          <div className="flex items-center space-x-2 text-xs mt-1">
                            <span>{market.currencySymbol}{market.lastPrice.toFixed(2)}</span>
                            {market.changePercent !== undefined && (
                              <span className={formatChange(market.change, market.changePercent).color}>
                                {formatChange(market.change, market.changePercent).text}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Favorite Toggle */}
                    {(onAddToFavorites || onRemoveFromFavorites) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isFav && onRemoveFromFavorites) {
                            onRemoveFromFavorites(market);
                          } else if (!isFav && onAddToFavorites) {
                            onAddToFavorites(market);
                          }
                        }}
                        aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <svg 
                          className={cn(
                            'h-3 w-3',
                            isFav ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                          )} 
                          fill={isFav ? 'currentColor' : 'none'} 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
                          />
                        </svg>
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Switch Footer */}
          {showQuickSwitch && recentMarkets.length > 0 && activeTab === 'all' && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">Quick Switch</div>
              <div className="flex flex-wrap gap-1">
                {recentMarkets.slice(0, 4).map((market) => (
                  <Button
                    key={market.id}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleMarketSelect(market)}
                    data-testid={`${testId}-quick-${market.code}`}
                  >
                    <span className="mr-1">{market.flagEmoji}</span>
                    {market.code}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { MarketSelector };
export type { MarketSelectorProps, MarketData, MarketGroup };