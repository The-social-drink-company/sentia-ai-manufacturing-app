import React, { useState, useMemo, useCallback } from 'react';
import {
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  StarIcon,
  UserPlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShieldCheckIcon,
  DocumentTextIcon
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

interface SupplierPerformance {
  supplier_id: string;
  supplier_name: string;
  supplier_code: string;
  market_id: string;
  reliability_score: number; // 0-100
  on_time_delivery_percentage: number;
  quality_score: number; // 0-100
  cost_competitiveness_rank: number;
  total_suppliers_in_market: number;
  metrics: {
    total_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    average_lead_time: number;
    lead_time_variance: number;
    defect_rate: number;
    return_rate: number;
    communication_score: number;
  };
  cost_analysis: {
    average_unit_cost: number;
    cost_trend: 'increasing' | 'stable' | 'decreasing';
    cost_change_percentage: number;
    payment_terms: string;
    volume_discounts: boolean;
  };
  recent_performance: {
    date: string;
    orders: number;
    on_time_deliveries: number;
    quality_issues: number;
    cost_per_unit: number;
  }[];
  alternative_suppliers: {
    supplier_id: string;
    supplier_name: string;
    reliability_score: number;
    cost_comparison: number; // percentage difference
    estimated_switch_cost: number;
    availability: 'available' | 'limited' | 'unavailable';
  }[];
  certifications: string[];
  risk_factors: {
    financial_risk: 'low' | 'medium' | 'high';
    geographic_risk: 'low' | 'medium' | 'high';
    capacity_risk: 'low' | 'medium' | 'high';
    regulatory_risk: 'low' | 'medium' | 'high';
  };
  last_updated: string;
}

type ViewMode = 'tabs' | 'split' | 'unified';
type MetricType = 'reliability' | 'delivery' | 'quality' | 'cost';

interface SupplierPerformanceDashboardProps {
  viewMode: ViewMode;
  activeMarket?: string;
  selectedMarkets?: string[];
  markets: Market[];
}

export function SupplierPerformanceDashboard({ 
  viewMode, 
  activeMarket, 
  selectedMarkets, 
  markets 
}: SupplierPerformanceDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('reliability');
  const [sortBy, setSortBy] = useState<'performance' | 'cost' | 'name'>('performance');
  const [showAlternatives, setShowAlternatives] = useState<string | null>(null);

  // Get relevant markets based on view mode
  const relevantMarkets = useMemo(() => {
    if (viewMode === 'tabs' && activeMarket) {
      return markets.filter(m => m.id === activeMarket);
    } else if (viewMode === 'split' && selectedMarkets) {
      return markets.filter(m => selectedMarkets.includes(m.id));
    }
    return markets;
  }, [viewMode, activeMarket, selectedMarkets, markets]);

  // Fetch supplier performance data
  const { data: supplierData = [], isLoading, refetch } = useQuery({
    queryKey: ['supplier-performance', relevantMarkets.map(m => m.id)],
    queryFn: async () => {
      const marketIds = relevantMarkets.map(m => m.id).join(',');
      const response = await fetch(`/api/operations/supplier-performance?markets=${marketIds}`);
      if (!response.ok) throw new Error('Failed to fetch supplier performance data');
      return response.json() as SupplierPerformance[];
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Real-time updates
  useWebSocket('/ws/supplier-performance', {
    onMessage: (message) => {
      try {
        const data = JSON.parse(message.data);
        if (data.type === 'supplier_update' || data.type === 'performance_update') {
          refetch();
        }
      } catch (error) {
        console.error('Error parsing supplier WebSocket message:', error);
      }
    },
  });

  const formatCurrency = useCallback((amount: number, currencyCode: string) => {
    const market = markets.find(m => m.currency === currencyCode);
    return new Intl.NumberFormat(market?.locale || 'en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  }, [markets]);

  const getScoreColor = useCallback((score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  }, []);

  const getRiskColor = useCallback((risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  const getTrendIcon = useCallback((trend: string, change: number) => {
    if (trend === 'increasing' || change > 0) {
      return <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />;
    } else if (trend === 'decreasing' || change < 0) {
      return <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />;
    }
    return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
  }, []);

  const sortedSuppliers = useMemo(() => {
    return [...supplierData].sort((a, b) => {
      switch (sortBy) {
        case 'performance':
          return b.reliability_score - a.reliability_score;
        case 'cost':
          return a.cost_competitiveness_rank - b.cost_competitiveness_rank;
        case 'name':
          return a.supplier_name.localeCompare(b.supplier_name);
        default:
          return 0;
      }
    });
  }, [supplierData, sortBy]);

  const renderSupplierCard = useCallback((supplier: SupplierPerformance, market: Market) => {
    return (
      <div key={`${supplier.supplier_id}-${market.id}`} className="bg-white border border-gray-200 rounded-lg p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <TruckIcon className="h-6 w-6 text-gray-600" />
              <div>
                <h3 className="font-semibold text-gray-900">{supplier.supplier_name}</h3>
                <p className="text-sm text-gray-500">{supplier.supplier_code}</p>
              </div>
            </div>
            
            {viewMode !== 'tabs' && (
              <div className="flex items-center space-x-1">
                <span className="text-lg">{market.flagEmoji}</span>
                <span className="text-sm text-gray-600">{market.code}</span>
              </div>
            )}
          </div>

          <div className="text-right">
            <div className={cn(
              'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
              getScoreColor(supplier.reliability_score)
            )}>
              <StarIcon className="h-4 w-4 mr-1" />
              {supplier.reliability_score}/100
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Rank #{supplier.cost_competitiveness_rank} of {supplier.total_suppliers_in_market}
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-green-600">
              {supplier.on_time_delivery_percentage.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">On-Time Delivery</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-blue-600">
              {supplier.quality_score}/100
            </div>
            <div className="text-xs text-gray-500">Quality Score</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-purple-600">
              {supplier.metrics.average_lead_time}d
            </div>
            <div className="text-xs text-gray-500">Avg Lead Time</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-orange-600 flex items-center justify-center gap-1">
              {getTrendIcon(supplier.cost_analysis.cost_trend, supplier.cost_analysis.cost_change_percentage)}
              {formatCurrency(supplier.cost_analysis.average_unit_cost, market.currency)}
            </div>
            <div className="text-xs text-gray-500">Avg Unit Cost</div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Performance Metrics</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Orders:</span>
                <span className="font-medium">{supplier.metrics.total_orders.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Completion Rate:</span>
                <span className="font-medium">
                  {((supplier.metrics.completed_orders / supplier.metrics.total_orders) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Defect Rate:</span>
                <span className={cn(
                  'font-medium',
                  supplier.metrics.defect_rate > 0.05 ? 'text-red-600' : 
                  supplier.metrics.defect_rate > 0.02 ? 'text-yellow-600' : 'text-green-600'
                )}>
                  {(supplier.metrics.defect_rate * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Communication:</span>
                <div className="flex items-center">
                  <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                    <div 
                      className="h-2 bg-blue-500 rounded-full" 
                      style={{ width: `${supplier.metrics.communication_score}%` }}
                    />
                  </div>
                  <span className="text-xs">{supplier.metrics.communication_score}/100</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Cost Analysis</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Cost Trend:</span>
                <span className="flex items-center gap-1">
                  {getTrendIcon(supplier.cost_analysis.cost_trend, supplier.cost_analysis.cost_change_percentage)}
                  <span className={cn(
                    'font-medium',
                    supplier.cost_analysis.cost_change_percentage > 0 ? 'text-red-600' : 
                    supplier.cost_analysis.cost_change_percentage < 0 ? 'text-green-600' : 'text-gray-600'
                  )}>
                    {supplier.cost_analysis.cost_change_percentage > 0 ? '+' : ''}
                    {supplier.cost_analysis.cost_change_percentage.toFixed(1)}%
                  </span>
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment Terms:</span>
                <span className="font-medium">{supplier.cost_analysis.payment_terms}</span>
              </div>
              <div className="flex justify-between">
                <span>Volume Discounts:</span>
                <span className={cn(
                  'font-medium',
                  supplier.cost_analysis.volume_discounts ? 'text-green-600' : 'text-gray-600'
                )}>
                  {supplier.cost_analysis.volume_discounts ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <ShieldCheckIcon className="h-4 w-4" />
            Risk Assessment
          </h5>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {Object.entries(supplier.risk_factors).map(([risk, level]) => (
              <div key={risk} className="text-center">
                <div className={cn(
                  'px-2 py-1 rounded text-xs font-medium',
                  getRiskColor(level)
                )}>
                  {risk.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        {supplier.certifications.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <DocumentTextIcon className="h-4 w-4" />
              Certifications
            </h5>
            <div className="flex flex-wrap gap-2">
              {supplier.certifications.map((cert, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Updated {new Date(supplier.last_updated).toLocaleDateString()}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAlternatives(
                showAlternatives === supplier.supplier_id ? null : supplier.supplier_id
              )}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1"
            >
              <UserPlusIcon className="h-3 w-3" />
              Alternatives ({supplier.alternative_suppliers.length})
            </button>
            
            <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors">
              View Details
            </button>
          </div>
        </div>

        {/* Alternative Suppliers */}
        {showAlternatives === supplier.supplier_id && supplier.alternative_suppliers.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h6 className="text-sm font-medium text-gray-800 mb-3">Alternative Suppliers</h6>
            <div className="space-y-2">
              {supplier.alternative_suppliers.map((alt, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{alt.supplier_name}</span>
                    <div className={cn(
                      'px-2 py-0.5 rounded text-xs',
                      getScoreColor(alt.reliability_score)
                    )}>
                      {alt.reliability_score}/100
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs">
                    <span className={cn(
                      alt.cost_comparison > 0 ? 'text-red-600' : 'text-green-600'
                    )}>
                      {alt.cost_comparison > 0 ? '+' : ''}{alt.cost_comparison.toFixed(1)}% cost
                    </span>
                    <span className="text-gray-500">
                      Switch: {formatCurrency(alt.estimated_switch_cost, market.currency)}
                    </span>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded',
                      alt.availability === 'available' ? 'bg-green-100 text-green-800' :
                      alt.availability === 'limited' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    )}>
                      {alt.availability}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }, [viewMode, getScoreColor, getRiskColor, getTrendIcon, formatCurrency, showAlternatives]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="grid gap-6">
            {[1, 2].map(i => (
              <div key={i} className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-8 bg-gray-200 rounded w-20" />
                </div>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="h-16 bg-gray-200 rounded" />
                  ))}
                </div>
                <div className="h-24 bg-gray-200 rounded" />
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
            <ChartBarIcon className="h-5 w-5 text-blue-600" />
            Supplier Performance Dashboard
          </h2>
          
          <div className="flex items-center space-x-3">
            {/* Sort Options */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {(['performance', 'cost', 'name'] as const).map(sort => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  className={cn(
                    'px-3 py-1 text-sm rounded-md transition-colors capitalize',
                    sortBy === sort
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {sort}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {supplierData.length === 0 ? (
          <div className="text-center py-8">
            <TruckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No supplier data available</p>
            <p className="text-sm text-gray-500">
              Supplier performance data will appear here as orders are processed
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {relevantMarkets.map(market => {
              const marketSuppliers = sortedSuppliers.filter(s => s.market_id === market.id);
              
              if (marketSuppliers.length === 0) return null;
              
              return (
                <div key={market.id}>
                  {viewMode !== 'tabs' && (
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-lg">{market.flagEmoji}</span>
                      <h3 className="font-medium text-gray-900">{market.name}</h3>
                      <span className="text-sm text-gray-500">
                        ({marketSuppliers.length} suppliers)
                      </span>
                    </div>
                  )}
                  
                  <div className="grid gap-6">
                    {marketSuppliers.map(supplier => renderSupplierCard(supplier, market))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}