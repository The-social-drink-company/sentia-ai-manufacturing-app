import React, { useState, useMemo, useCallback } from 'react';
import {
  CurrencyDollarIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CalculatorIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';
import { TransferCalculatorModal } from './TransferCalculatorModal';
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

interface ArbitrageOpportunity {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  from_market: string;
  to_market: string;
  from_price: number;
  to_price: number;
  price_differential: number;
  transfer_cost: number;
  net_profit: number;
  profit_margin: number;
  available_quantity: number;
  max_transfer_quantity: number;
  demand_forecast: number;
  opportunity_score: number; // 0-100
  risk_level: 'low' | 'medium' | 'high';
  execution_time: string; // ISO date
  expires_at: string; // ISO date
  market_conditions: {
    currency_volatility: number;
    demand_trend: 'increasing' | 'stable' | 'decreasing';
    supply_trend: 'tight' | 'balanced' | 'oversupply';
    competition_level: 'low' | 'medium' | 'high';
  };
  automated_recommendation: {
    action: 'execute_immediately' | 'monitor' | 'avoid' | 'partial_execute';
    confidence: number;
    reasoning: string;
    suggested_quantity?: number;
  };
}

interface CrossMarketArbitrageDetectorProps {
  markets: Market[];
}

type SortField = 'net_profit' | 'profit_margin' | 'opportunity_score' | 'expires_at';
type FilterType = 'all' | 'high_profit' | 'low_risk' | 'expires_soon' | 'automated';

export function CrossMarketArbitrageDetector({ markets }: CrossMarketArbitrageDetectorProps) {
  const [selectedOpportunity, setSelectedOpportunity] = useState<ArbitrageOpportunity | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [sortField, setSortField] = useState<SortField>('opportunity_score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);

  const queryClient = useQueryClient();

  // Fetch arbitrage opportunities
  const { data: opportunities = [], isLoading, refetch } = useQuery({
    queryKey: ['arbitrage-opportunities', selectedMarkets],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedMarkets.length > 0) {
        params.set('markets', selectedMarkets.join(','));
      }
      
      const response = await fetch(`/api/operations/arbitrage?${params}`);
      if (!response.ok) throw new Error('Failed to fetch arbitrage opportunities');
      return response.json() as ArbitrageOpportunity[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Real-time updates
  useWebSocket('/ws/arbitrage', {
    onMessage: (message) => {
      try {
        const data = JSON.parse(message.data);
        if (data.type === 'arbitrage_update' || data.type === 'price_change') {
          refetch();
        }
      } catch (error) {
        console.error('Error parsing arbitrage WebSocket message:', error);
      }
    },
  });

  // Execute transfer
  const executeTransferMutation = useMutation({
    mutationFn: async ({ opportunityId, quantity }: { opportunityId: string; quantity: number }) => {
      const response = await fetch('/api/operations/execute-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity_id: opportunityId, quantity }),
      });
      if (!response.ok) throw new Error('Failed to execute transfer');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arbitrage-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const formatCurrency = useCallback((amount: number, currencyCode: string) => {
    const market = markets.find(m => m.currency === currencyCode);
    return new Intl.NumberFormat(market?.locale || 'en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  }, [markets]);

  const getMarketByCurrency = useCallback((currencyCode: string) => {
    return markets.find(m => m.currency === currencyCode) || markets[0];
  }, [markets]);

  const getOpportunityColor = useCallback((score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  }, []);

  const getRiskColor = useCallback((riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  const getActionColor = useCallback((action: string) => {
    switch (action) {
      case 'execute_immediately': return 'text-green-600 bg-green-100';
      case 'partial_execute': return 'text-blue-600 bg-blue-100';
      case 'monitor': return 'text-yellow-600 bg-yellow-100';
      case 'avoid': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  const filteredAndSortedOpportunities = useMemo(() => {
    let filtered = opportunities;

    // Apply filters
    switch (filter) {
      case 'high_profit':
        filtered = filtered.filter(opp => opp.net_profit > 1000);
        break;
      case 'low_risk':
        filtered = filtered.filter(opp => opp.risk_level === 'low');
        break;
      case 'expires_soon':
        filtered = filtered.filter(opp => {
          const expiryDate = new Date(opp.expires_at);
          const now = new Date();
          const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          return hoursUntilExpiry <= 24;
        });
        break;
      case 'automated':
        filtered = filtered.filter(opp => 
          opp.automated_recommendation.action === 'execute_immediately' ||
          opp.automated_recommendation.action === 'partial_execute'
        );
        break;
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'expires_at') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
      }
      
      return 0;
    });

    return filtered;
  }, [opportunities, filter, sortField, sortDirection]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  const handleExecuteTransfer = useCallback((opportunity: ArbitrageOpportunity, quantity?: number) => {
    const transferQuantity = quantity || opportunity.automated_recommendation.suggested_quantity || opportunity.max_transfer_quantity;
    
    executeTransferMutation.mutate({
      opportunityId: opportunity.id,
      quantity: transferQuantity,
    });
  }, [executeTransferMutation]);

  const getTrendIcon = useCallback((trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUpIcon className="h-4 w-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="grid grid-cols-4 gap-4">
                  <div className="h-8 bg-gray-200 rounded" />
                  <div className="h-8 bg-gray-200 rounded" />
                  <div className="h-8 bg-gray-200 rounded" />
                  <div className="h-8 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
            Cross-Market Arbitrage Opportunities
          </h2>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCalculator(true)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <CalculatorIcon className="h-4 w-4" />
              Calculator
            </button>
            
            <button
              onClick={() => refetch()}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Refresh opportunities"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {(['all', 'high_profit', 'low_risk', 'expires_soon', 'automated'] as FilterType[]).map(filterType => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={cn(
                    'px-3 py-1 text-sm rounded-md transition-colors',
                    filter === filterType
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {filterType === 'all' ? 'All' :
                   filterType === 'high_profit' ? 'High Profit' :
                   filterType === 'low_risk' ? 'Low Risk' :
                   filterType === 'expires_soon' ? 'Expiring Soon' :
                   'AI Recommended'}
                </button>
              ))}
            </div>

            {/* Market Filter */}
            <select
              multiple
              value={selectedMarkets}
              onChange={(e) => setSelectedMarkets(Array.from(e.target.selectedOptions, option => option.value))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Markets</option>
              {markets.map(market => (
                <option key={market.id} value={market.id}>
                  {market.flagEmoji} {market.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-600">
            {filteredAndSortedOpportunities.length} opportunities found
          </div>
        </div>
      </div>

      {/* Opportunities List */}
      <div className="divide-y divide-gray-200">
        {filteredAndSortedOpportunities.length === 0 ? (
          <div className="text-center py-12">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No arbitrage opportunities found</p>
            <p className="text-sm text-gray-500">
              Opportunities will appear when price differentials exceed transfer costs
            </p>
          </div>
        ) : (
          filteredAndSortedOpportunities.map((opportunity) => {
            const fromMarket = markets.find(m => m.id === opportunity.from_market);
            const toMarket = markets.find(m => m.id === opportunity.to_market);
            const expiryDate = new Date(opportunity.expires_at);
            const hoursUntilExpiry = (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
            
            return (
              <div key={opportunity.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Product Info */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{opportunity.product_name}</h3>
                        <span className="text-sm text-gray-500">({opportunity.product_sku})</span>
                        <div className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium border',
                          getOpportunityColor(opportunity.opportunity_score)
                        )}>
                          {opportunity.opportunity_score}/100
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          getRiskColor(opportunity.risk_level)
                        )}>
                          {opportunity.risk_level} risk
                        </span>
                        {hoursUntilExpiry <= 24 && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Expires in {Math.round(hoursUntilExpiry)}h
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Market Transfer */}
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{fromMarket?.flagEmoji}</span>
                        <div className="text-sm">
                          <div className="font-medium">{fromMarket?.code}</div>
                          <div className="text-gray-500">
                            {formatCurrency(opportunity.from_price, fromMarket?.currency || 'USD')}
                          </div>
                        </div>
                      </div>
                      
                      <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{toMarket?.flagEmoji}</span>
                        <div className="text-sm">
                          <div className="font-medium">{toMarket?.code}</div>
                          <div className="text-gray-500">
                            {formatCurrency(opportunity.to_price, toMarket?.currency || 'USD')}
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-green-600 font-medium">
                        +{formatCurrency(opportunity.price_differential, toMarket?.currency || 'USD')} differential
                      </div>
                    </div>

                    {/* Financial Metrics */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(opportunity.net_profit, toMarket?.currency || 'USD')}
                        </div>
                        <div className="text-xs text-gray-500">Net Profit</div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-semibold text-blue-600">
                          {opportunity.profit_margin.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">Margin</div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-semibold text-purple-600">
                          {opportunity.max_transfer_quantity.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">Max Quantity</div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-semibold text-orange-600">
                          {formatCurrency(opportunity.transfer_cost, toMarket?.currency || 'USD')}
                        </div>
                        <div className="text-xs text-gray-500">Transfer Cost</div>
                      </div>
                    </div>

                    {/* Market Conditions */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(opportunity.market_conditions.demand_trend)}
                        <span className="text-gray-600">
                          Demand: {opportunity.market_conditions.demand_trend}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className={cn(
                          'h-4 w-4 rounded-full',
                          opportunity.market_conditions.supply_trend === 'tight' ? 'bg-red-400' :
                          opportunity.market_conditions.supply_trend === 'balanced' ? 'bg-green-400' :
                          'bg-blue-400'
                        )} />
                        <span className="text-gray-600">
                          Supply: {opportunity.market_conditions.supply_trend}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className={cn(
                          'h-4 w-4 rounded-full',
                          opportunity.market_conditions.competition_level === 'high' ? 'bg-red-400' :
                          opportunity.market_conditions.competition_level === 'medium' ? 'bg-yellow-400' :
                          'bg-green-400'
                        )} />
                        <span className="text-gray-600">
                          Competition: {opportunity.market_conditions.competition_level}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <ExclamationTriangleIcon className={cn(
                          'h-4 w-4',
                          opportunity.market_conditions.currency_volatility > 0.05 ? 'text-red-500' :
                          opportunity.market_conditions.currency_volatility > 0.02 ? 'text-yellow-500' :
                          'text-green-500'
                        )} />
                        <span className="text-gray-600">
                          Currency risk: {(opportunity.market_conditions.currency_volatility * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* AI Recommendation */}
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            getActionColor(opportunity.automated_recommendation.action)
                          )}>
                            {opportunity.automated_recommendation.action.replace('_', ' ')}
                          </div>
                          <div className="text-xs text-gray-600">
                            {opportunity.automated_recommendation.confidence}% confidence
                          </div>
                        </div>
                        
                        {opportunity.automated_recommendation.suggested_quantity && (
                          <div className="text-xs text-gray-600">
                            Suggested: {opportunity.automated_recommendation.suggested_quantity.toLocaleString()} units
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{opportunity.automated_recommendation.reasoning}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-6 flex flex-col space-y-2">
                    {opportunity.automated_recommendation.action === 'execute_immediately' && (
                      <button
                        onClick={() => handleExecuteTransfer(opportunity)}
                        disabled={executeTransferMutation.isPending}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Execute Now
                      </button>
                    )}
                    
                    <button
                      onClick={() => setSelectedOpportunity(opportunity)}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <CalculatorIcon className="h-4 w-4" />
                      Calculate
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Transfer Calculator Modal */}
      {showCalculator && (
        <TransferCalculatorModal
          opportunity={selectedOpportunity}
          markets={markets}
          onClose={() => {
            setShowCalculator(false);
            setSelectedOpportunity(null);
          }}
          onExecute={handleExecuteTransfer}
        />
      )}
    </div>
  );
}