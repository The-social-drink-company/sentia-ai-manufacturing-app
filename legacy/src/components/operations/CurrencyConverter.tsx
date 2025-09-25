import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  XMarkIcon,
  CurrencyDollarIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';
import { cn } from '@/lib/utils';

interface Market {
  id: string;
  name: string;
  code: string;
  flagEmoji: string;
  currency: string;
  timezone: string;
  locale: string;
}

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  change_24h: number;
  change_percentage_24h: number;
  last_updated: string;
  bid: number;
  ask: number;
  spread: number;
  volatility: number;
  trend: 'up' | 'down' | 'stable';
}

interface CurrencyConverterProps {
  markets: Market[];
  onClose: () => void;
}

export function CurrencyConverter({ markets, onClose }: CurrencyConverterProps) {
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('GBP');
  const [amount, setAmount] = useState<string>('1000');
  const [isMinimized, setIsMinimized] = useState(false);

  // Fetch exchange rates
  const { data: exchangeRates = [], isLoading } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      const response = await fetch('/api/operations/exchange-rates');
      if (!response.ok) throw new Error('Failed to fetch exchange rates');
      return response.json() as ExchangeRate[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Real-time currency updates
  useWebSocket('/ws/currency-rates', {
    onMessage: (message) => {
      try {
        const data = JSON.parse(message.data);
        if (data.type === 'rate_update') {
          // Rates are automatically refetched by React Query
        }
      } catch (error) {
        console.error('Error parsing currency WebSocket message:', error);
      }
    },
  });

  const availableCurrencies = useMemo(() => {
    return markets.map(market => market.currency);
  }, [markets]);

  const currentRate = useMemo(() => {
    return exchangeRates.find(rate => 
      rate.from === fromCurrency && rate.to === toCurrency
    );
  }, [exchangeRates, fromCurrency, toCurrency]);

  const reverseRate = useMemo(() => {
    return exchangeRates.find(rate => 
      rate.from === toCurrency && rate.to === fromCurrency
    );
  }, [exchangeRates, toCurrency, fromCurrency]);

  const convertedAmount = useMemo(() => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || !currentRate) return 0;
    return numAmount * currentRate.rate;
  }, [amount, currentRate]);

  const reverseConvertedAmount = useMemo(() => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || !reverseRate) return 0;
    return numAmount * reverseRate.rate;
  }, [amount, reverseRate]);

  const getMarketByCurrency = useCallback((currency: string) => {
    return markets.find(m => m.currency === currency);
  }, [markets]);

  const formatCurrency = useCallback((amount: number, currency: string) => {
    const market = getMarketByCurrency(currency);
    return new Intl.NumberFormat(market?.locale || 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  }, [getMarketByCurrency]);

  const swapCurrencies = useCallback(() => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  }, [fromCurrency, toCurrency]);

  const getRateColor = useCallback((change: number) => {
    if (change > 0) return 'text-green-600 bg-green-50';
    if (change < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  }, []);

  const getVolatilityColor = useCallback((volatility: number) => {
    if (volatility > 0.02) return 'text-red-600';
    if (volatility > 0.01) return 'text-yellow-600';
    return 'text-green-600';
  }, []);

  if (isMinimized) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-3 w-80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CurrencyDollarIcon className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Currency Converter</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Expand"
            >
              <TrendingUpIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Close"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {currentRate && (
          <div className="mt-2 text-sm">
            <span className="text-gray-600">1 {fromCurrency} = </span>
            <span className="font-medium">{currentRate.rate.toFixed(4)} {toCurrency}</span>
            <span className={cn(
              'ml-2 px-1.5 py-0.5 rounded text-xs',
              getRateColor(currentRate.change_percentage_24h)
            )}>
              {currentRate.change_percentage_24h > 0 ? '+' : ''}
              {currentRate.change_percentage_24h.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-6 w-96">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Currency Converter</h3>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Minimize"
          >
            <TrendingDownIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter amount"
        />
      </div>

      {/* Currency Selection */}
      <div className="mb-6">
        <div className="grid grid-cols-7 gap-2 items-center">
          <div className="col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableCurrencies.map(currency => {
                const market = getMarketByCurrency(currency);
                return (
                  <option key={currency} value={currency}>
                    {market?.flagEmoji} {currency}
                  </option>
                );
              })}
            </select>
          </div>
          
          <div className="col-span-1 flex justify-center">
            <button
              onClick={swapCurrencies}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Swap currencies"
            >
              <ArrowsRightLeftIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableCurrencies.map(currency => {
                const market = getMarketByCurrency(currency);
                return (
                  <option key={currency} value={currency}>
                    {market?.flagEmoji} {currency}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Conversion Result */}
      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : currentRate ? (
        <div className="space-y-4">
          {/* Main Conversion */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(convertedAmount, toCurrency)}
              </div>
              <div className="text-sm text-blue-700 mt-1">
                {formatCurrency(parseFloat(amount) || 0, fromCurrency)} = {formatCurrency(convertedAmount, toCurrency)}
              </div>
            </div>
          </div>

          {/* Rate Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Exchange Rate</div>
              <div className="font-medium text-gray-900">
                1 {fromCurrency} = {currentRate.rate.toFixed(4)} {toCurrency}
              </div>
              <div className={cn(
                'text-xs px-2 py-1 rounded mt-1 inline-flex items-center gap-1',
                getRateColor(currentRate.change_percentage_24h)
              )}>
                {currentRate.trend === 'up' ? (
                  <TrendingUpIcon className="h-3 w-3" />
                ) : currentRate.trend === 'down' ? (
                  <TrendingDownIcon className="h-3 w-3" />
                ) : (
                  <div className="w-3 h-3 bg-gray-400 rounded-full" />
                )}
                {currentRate.change_percentage_24h > 0 ? '+' : ''}
                {currentRate.change_percentage_24h.toFixed(2)}% (24h)
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Reverse Rate</div>
              <div className="font-medium text-gray-900">
                1 {toCurrency} = {reverseRate ? reverseRate.rate.toFixed(4) : (1/currentRate.rate).toFixed(4)} {fromCurrency}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Spread: {currentRate.spread.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Market Details */}
          <div className="p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Market Details</span>
              <div className="flex items-center text-xs text-gray-500">
                <ClockIcon className="h-3 w-3 mr-1" />
                Updated {new Date(currentRate.last_updated).toLocaleTimeString()}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Bid/Ask</div>
                <div className="font-medium">
                  {currentRate.bid.toFixed(4)} / {currentRate.ask.toFixed(4)}
                </div>
              </div>
              
              <div>
                <div className="text-gray-600">Volatility (24h)</div>
                <div className={cn('font-medium', getVolatilityColor(currentRate.volatility))}>
                  {(currentRate.volatility * 100).toFixed(2)}%
                  {currentRate.volatility > 0.02 && (
                    <ExclamationTriangleIcon className="h-3 w-3 inline ml-1" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Amounts */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Quick Conversions</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[100, 500, 1000, 5000].map(quickAmount => (
                <button
                  key={quickAmount}
                  onClick={() => setAmount(quickAmount.toString())}
                  className="p-2 text-left bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                >
                  <div className="font-medium">
                    {formatCurrency(quickAmount, fromCurrency)}
                  </div>
                  <div className="text-gray-600">
                    = {formatCurrency(quickAmount * currentRate.rate, toCurrency)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Exchange rate not available</p>
          <p className="text-xs">Please select different currencies</p>
        </div>
      )}
    </div>
  );
}