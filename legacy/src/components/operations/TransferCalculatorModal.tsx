import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  XMarkIcon,
  CurrencyDollarIcon,
  CalculatorIcon,
  TruckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useMutation } from '@tanstack/react-query';
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
  opportunity_score: number;
  risk_level: 'low' | 'medium' | 'high';
  execution_time: string;
  expires_at: string;
}

interface TransferCalculation {
  quantity: number;
  base_transfer_cost: number;
  additional_costs: {
    customs_duty: number;
    insurance: number;
    handling_fees: number;
    currency_hedge: number;
  };
  total_transfer_cost: number;
  gross_revenue: number;
  net_profit: number;
  profit_margin: number;
  break_even_quantity: number;
  estimated_delivery_time: string;
  risk_factors: {
    currency_risk: number;
    demand_risk: number;
    competition_risk: number;
    regulatory_risk: number;
  };
}

interface TransferCalculatorModalProps {
  opportunity: ArbitrageOpportunity | null;
  markets: Market[];
  onClose: () => void;
  onExecute: (opportunity: ArbitrageOpportunity, quantity: number) => void;
}

export function TransferCalculatorModal({ 
  opportunity, 
  markets, 
  onClose, 
  onExecute 
}: TransferCalculatorModalProps) {
  const [quantity, setQuantity] = useState<number>(0);
  const [customTransferCost, setCustomTransferCost] = useState<number | null>(null);
  const [calculation, setCalculation] = useState<TransferCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate transfer details
  const calculateTransferMutation = useMutation({
    mutationFn: async (params: {
      opportunityId: string;
      quantity: number;
      customTransferCost?: number;
    }) => {
      const response = await fetch('/api/operations/calculate-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!response.ok) throw new Error('Failed to calculate transfer');
      return response.json() as TransferCalculation;
    },
    onSuccess: (data) => {
      setCalculation(data);
      setIsCalculating(false);
    },
    onError: () => {
      setIsCalculating(false);
    },
  });

  const fromMarket = useMemo(() => {
    return opportunity ? markets.find(m => m.id === opportunity.from_market) : null;
  }, [opportunity, markets]);

  const toMarket = useMemo(() => {
    return opportunity ? markets.find(m => m.id === opportunity.to_market) : null;
  }, [opportunity, markets]);

  const formatCurrency = useCallback((amount: number, currencyCode: string) => {
    const market = markets.find(m => m.currency === currencyCode);
    return new Intl.NumberFormat(market?.locale || 'en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  }, [markets]);

  const handleCalculate = useCallback(() => {
    if (!opportunity || quantity <= 0) return;
    
    setIsCalculating(true);
    calculateTransferMutation.mutate({
      opportunityId: opportunity.id,
      quantity,
      ...(customTransferCost && { customTransferCost }),
    });
  }, [opportunity, quantity, customTransferCost, calculateTransferMutation]);

  const handleExecute = useCallback(() => {
    if (!opportunity || !calculation) return;
    onExecute(opportunity, quantity);
    onClose();
  }, [opportunity, calculation, quantity, onExecute, onClose]);

  // Auto-calculate when quantity changes
  useEffect(() => {
    if (opportunity && quantity > 0) {
      const timeoutId = setTimeout(() => {
        handleCalculate();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [opportunity, quantity, handleCalculate]);

  // Initialize quantity
  useEffect(() => {
    if (opportunity) {
      setQuantity(Math.min(opportunity.max_transfer_quantity, Math.floor(opportunity.max_transfer_quantity / 2)));
    }
  }, [opportunity]);

  if (!opportunity) return null;

  const isProfitable = calculation ? calculation.net_profit > 0 : false;
  const isViable = quantity > 0 && quantity <= opportunity.max_transfer_quantity;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CalculatorIcon className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Transfer Calculator
                  </h3>
                  <p className="text-sm text-gray-500">
                    {opportunity.product_name} ({opportunity.product_sku})
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Input Parameters */}
              <div className="space-y-6">
                {/* Transfer Route */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Transfer Route</h4>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{fromMarket?.flagEmoji}</span>
                      <div>
                        <div className="font-medium text-gray-900">{fromMarket?.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(opportunity.from_price, fromMarket?.currency || 'USD')}
                        </div>
                      </div>
                    </div>
                    
                    <TruckIcon className="h-6 w-6 text-gray-400" />
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{toMarket?.flagEmoji}</span>
                      <div>
                        <div className="font-medium text-gray-900">{toMarket?.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(opportunity.to_price, toMarket?.currency || 'USD')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quantity Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transfer Quantity
                  </label>
                  <div className="space-y-2">
                    <input
                      type="number"
                      min="1"
                      max={opportunity.max_transfer_quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter quantity"
                    />
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Available: {opportunity.available_quantity.toLocaleString()}</span>
                      <span>Max transfer: {opportunity.max_transfer_quantity.toLocaleString()}</span>
                    </div>
                    
                    {/* Quick quantity buttons */}
                    <div className="flex space-x-2">
                      {[0.25, 0.5, 0.75, 1].map(ratio => (
                        <button
                          key={ratio}
                          onClick={() => setQuantity(Math.floor(opportunity.max_transfer_quantity * ratio))}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          {Math.floor(ratio * 100)}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Custom Transfer Cost */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Transfer Cost (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={customTransferCost || ''}
                    onChange={(e) => setCustomTransferCost(parseFloat(e.target.value) || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Default: ${formatCurrency(opportunity.transfer_cost, toMarket?.currency || 'USD')}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use default calculation
                  </p>
                </div>

                {/* Opportunity Summary */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Opportunity Details</h5>
                  <div className="space-y-1 text-sm text-blue-800">
                    <div className="flex justify-between">
                      <span>Risk Level:</span>
                      <span className="font-medium">{opportunity.risk_level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Opportunity Score:</span>
                      <span className="font-medium">{opportunity.opportunity_score}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Demand Forecast:</span>
                      <span className="font-medium">{opportunity.demand_forecast.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Calculations */}
              <div className="space-y-6">
                {/* Calculation Results */}
                {isCalculating ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : calculation ? (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Calculation Results</h4>
                    
                    {/* Profit Summary */}
                    <div className={cn(
                      'p-4 rounded-lg border-2',
                      isProfitable 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Net Profit</span>
                        {isProfitable ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div className={cn(
                        'text-2xl font-bold',
                        isProfitable ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatCurrency(calculation.net_profit, toMarket?.currency || 'USD')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {calculation.profit_margin.toFixed(2)}% margin
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">Cost Breakdown</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Gross Revenue:</span>
                          <span className="font-medium">
                            {formatCurrency(calculation.gross_revenue, toMarket?.currency || 'USD')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Base Transfer:</span>
                          <span className="text-red-600">
                            -{formatCurrency(calculation.base_transfer_cost, toMarket?.currency || 'USD')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Customs Duty:</span>
                          <span className="text-red-600">
                            -{formatCurrency(calculation.additional_costs.customs_duty, toMarket?.currency || 'USD')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Insurance:</span>
                          <span className="text-red-600">
                            -{formatCurrency(calculation.additional_costs.insurance, toMarket?.currency || 'USD')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Handling Fees:</span>
                          <span className="text-red-600">
                            -{formatCurrency(calculation.additional_costs.handling_fees, toMarket?.currency || 'USD')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Currency Hedge:</span>
                          <span className="text-red-600">
                            -{formatCurrency(calculation.additional_costs.currency_hedge, toMarket?.currency || 'USD')}
                          </span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-medium">
                          <span>Total Cost:</span>
                          <span className="text-red-600">
                            -{formatCurrency(calculation.total_transfer_cost, toMarket?.currency || 'USD')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {calculation.break_even_quantity.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">Break-even Qty</div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-semibold text-purple-600 flex items-center justify-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          {calculation.estimated_delivery_time}
                        </div>
                        <div className="text-xs text-gray-500">Est. Delivery</div>
                      </div>
                    </div>

                    {/* Risk Assessment */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h5 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        Risk Assessment
                      </h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span>Currency Risk:</span>
                          <span className="font-medium">
                            {(calculation.risk_factors.currency_risk * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Demand Risk:</span>
                          <span className="font-medium">
                            {(calculation.risk_factors.demand_risk * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Competition Risk:</span>
                          <span className="font-medium">
                            {(calculation.risk_factors.competition_risk * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Regulatory Risk:</span>
                          <span className="font-medium">
                            {(calculation.risk_factors.regulatory_risk * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CalculatorIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Enter a quantity to see calculations</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {calculation && (
                <span>
                  Transfer of {quantity.toLocaleString()} units • 
                  {isProfitable ? (
                    <span className="text-green-600 ml-1">Profitable</span>
                  ) : (
                    <span className="text-red-600 ml-1">Not Profitable</span>
                  )}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleExecute}
                disabled={!calculation || !isProfitable || !isViable}
                className={cn(
                  'px-4 py-2 text-sm rounded-lg transition-colors',
                  calculation && isProfitable && isViable
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                Execute Transfer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}