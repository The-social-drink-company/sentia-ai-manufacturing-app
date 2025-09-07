import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Target,
  Zap,
  Globe,
  RotateCcw,
  Calculator,
  Lightbulb
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

const InventoryOptimizer = ({ data, onOptimize, loading = false }) => {
  const [selectedProduct, setSelectedProduct] = useState('SENSIO_RED');
  const [selectedMarket, setSelectedMarket] = useState('UK');
  const [optimizationMode, setOptimizationMode] = useState('working_capital');
  const [constraints, setConstraints] = useState({
    maxWorkingCapital: 2500000,
    serviceLevel: 95,
    maxLeadTime: 42
  });

  // FinanceFlo inventory optimization data
  const inventoryData = data || {
    products: {
      'SENSIO_RED': {
        name: 'Sensio Red',
        markets: {
          'UK': { stock: 1250, optimalStock: 950, reorderPoint: 320, safetyStock: 180, leadTimeDays: 21 },
          'EU': { stock: 890, optimalStock: 720, reorderPoint: 280, safetyStock: 150, leadTimeDays: 28 },
          'US': { stock: 1450, optimalStock: 1100, reorderPoint: 420, safetyStock: 250, leadTimeDays: 42 }
        },
        unitCost: 12.50,
        annualDemand: 15600,
        demandVariability: 0.25
      },
      'SENSIO_BLACK': {
        name: 'Sensio Black',
        markets: {
          'UK': { stock: 980, optimalStock: 800, reorderPoint: 280, safetyStock: 160, leadTimeDays: 21 },
          'EU': { stock: 720, optimalStock: 650, reorderPoint: 240, safetyStock: 130, leadTimeDays: 28 },
          'US': { stock: 1200, optimalStock: 950, reorderPoint: 380, safetyStock: 220, leadTimeDays: 42 }
        },
        unitCost: 15.75,
        annualDemand: 12800,
        demandVariability: 0.30
      },
      'SENSIO_GOLD': {
        name: 'Sensio Gold',
        markets: {
          'UK': { stock: 450, optimalStock: 380, reorderPoint: 140, safetyStock: 80, leadTimeDays: 21 },
          'EU': { stock: 320, optimalStock: 280, reorderPoint: 110, safetyStock: 65, leadTimeDays: 28 },
          'US': { stock: 580, optimalStock: 420, reorderPoint: 170, safetyStock: 95, leadTimeDays: 42 }
        },
        unitCost: 22.90,
        annualDemand: 6400,
        demandVariability: 0.35
      }
    },
    recommendations: [
      {
        product: 'SENSIO_RED',
        market: 'UK',
        action: 'reduce_stock',
        currentStock: 1250,
        recommendedStock: 950,
        savingsGBP: 3750,
        reason: 'Overstock - demand stable, lead times improved'
      },
      {
        product: 'SENSIO_BLACK',
        market: 'US',
        action: 'increase_safety_stock',
        currentSafetyStock: 200,
        recommendedSafetyStock: 220,
        impact: 'reduced_stockout_risk',
        reason: 'Lead time variability increased 15% vs baseline'
      },
      {
        product: 'SENSIO_GOLD',
        market: 'EU',
        action: 'optimize_reorder_point',
        currentReorderPoint: 120,
        recommendedReorderPoint: 110,
        impact: 'improved_cash_flow',
        reason: 'Demand pattern more predictable - can reduce buffer'
      }
    ],
    workingCapitalImpact: {
      current: 2840000,
      optimized: 2250000,
      savings: 590000,
      roi: 0.32
    },
    aiInsights: {
      confidenceLevel: 0.91,
      lastOptimized: new Date().toISOString(),
      modelAccuracy: 0.87
    }
  };

  const selectedProductData = inventoryData.products[selectedProduct];
  const selectedMarketData = selectedProductData?.markets[selectedMarket];

  const getStockStatus = (current, optimal) => {
    const ratio = current / optimal;
    if (ratio > 1.2) return { status: 'overstock', color: 'text-red-600 bg-red-50', icon: TrendingDown };
    if (ratio < 0.8) return { status: 'understock', color: 'text-yellow-600 bg-yellow-50', icon: AlertTriangle };
    return { status: 'optimal', color: 'text-green-600 bg-green-50', icon: CheckCircle };
  };

  const formatCurrency = (amount, currency = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateWorkingCapitalTied = (stock, unitCost) => {
    return stock * unitCost;
  };

  const optimizationScenarios = [
    { name: 'Conservative', wcReduction: 15, stockoutRisk: 1, description: 'Minimal risk, steady optimization' },
    { name: 'Balanced', wcReduction: 25, stockoutRisk: 3, description: 'Optimal risk-reward balance' },
    { name: 'Aggressive', wcReduction: 35, stockoutRisk: 8, description: 'Maximum capital efficiency' }
  ];

  const marketLeadTimes = [
    { market: 'UK', leadTime: 21, variability: 'Low' },
    { market: 'EU', leadTime: 28, variability: 'Medium' },
    { market: 'US', leadTime: 42, variability: 'High' }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Optimizer</h1>
          <p className="text-gray-500">AI-Powered Multi-Market Inventory Optimization</p>
        </div>
        <div className="flex space-x-3">
          <select 
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white"
          >
            {Object.entries(inventoryData.products).map(([key, product]) => (
              <option key={key} value={key}>{product.name}</option>
            ))}
          </select>
          <select 
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white"
          >
            <option value="UK">UK</option>
            <option value="EU">EU</option>
            <option value="US">US</option>
          </select>
          <Button 
            onClick={onOptimize}
            disabled={loading}
            variant="default"
            size="sm"
          >
            <Zap className={`w-4 h-4 mr-2 ${loading ? 'animate-pulse' : ''}`} />
            Optimize
          </Button>
        </div>
      </div>

      {/* Working Capital Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Working Capital Impact
          </h3>
          <Badge variant="outline" className="text-green-600">
            AI Confidence: {(inventoryData.aiInsights.confidenceLevel * 100).toFixed(0)}%
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Current WC</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(inventoryData.workingCapitalImpact.current)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Optimized WC</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(inventoryData.workingCapitalImpact.optimized)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Potential Savings</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(inventoryData.workingCapitalImpact.savings)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Expected ROI</p>
            <p className="text-2xl font-bold text-purple-600">
              {(inventoryData.workingCapitalImpact.roi * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Product Analysis */}
      {selectedProductData && selectedMarketData && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Package className="w-5 h-5 mr-2" />
              {selectedProductData.name} - {selectedMarket} Market
            </h3>
            <div className="flex items-center space-x-2">
              {(() => {
                const statusInfo = getStockStatus(selectedMarketData.stock, selectedMarketData.optimalStock);
                const StatusIcon = statusInfo.icon;
                return (
                  <>
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.status}
                    </Badge>
                    <Badge variant="outline">
                      Lead Time: {selectedMarketData.leadTimeDays} days
                    </Badge>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current vs Optimal Stock */}
            <div className="space-y-4">
              <h4 className="font-semibold">Stock Levels</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Stock:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{selectedMarketData.stock.toLocaleString()}</span>
                    <Badge variant="outline">
                      WC: {formatCurrency(calculateWorkingCapitalTied(selectedMarketData.stock, selectedProductData.unitCost))}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Optimal Stock:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-green-600">{selectedMarketData.optimalStock.toLocaleString()}</span>
                    <Badge variant="outline" className="text-green-600">
                      WC: {formatCurrency(calculateWorkingCapitalTied(selectedMarketData.optimalStock, selectedProductData.unitCost))}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Safety Stock:</span>
                  <span className="font-semibold">{selectedMarketData.safetyStock.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Reorder Point:</span>
                  <span className="font-semibold">{selectedMarketData.reorderPoint.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-4">
              <h4 className="font-semibold">Product Economics</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Unit Cost:</span>
                  <span className="font-semibold">{formatCurrency(selectedProductData.unitCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Annual Demand:</span>
                  <span className="font-semibold">{selectedProductData.annualDemand.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Demand Variability:</span>
                  <Badge variant={selectedProductData.demandVariability > 0.3 ? 'destructive' : 'secondary'}>
                    {(selectedProductData.demandVariability * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Turnover Rate:</span>
                  <span className="font-semibold">
                    {(selectedProductData.annualDemand / selectedMarketData.stock).toFixed(1)}x
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Optimization Recommendations */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Lightbulb className="w-5 h-5 mr-2" />
            AI Recommendations
          </h3>
          <Badge variant="outline" className="text-blue-600">
            Model Accuracy: {(inventoryData.aiInsights.modelAccuracy * 100).toFixed(0)}%
          </Badge>
        </div>

        <div className="space-y-4">
          {inventoryData.recommendations.map((rec, index) => (
            <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge variant="outline">{rec.product.replace('_', ' ')}</Badge>
                    <Badge variant="outline">{rec.market}</Badge>
                    <Badge 
                      className={
                        rec.action === 'reduce_stock' ? 'text-green-600 bg-green-50' :
                        rec.action === 'increase_safety_stock' ? 'text-yellow-600 bg-yellow-50' :
                        'text-blue-600 bg-blue-50'
                      }
                    >
                      {rec.action.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                  {rec.savingsGBP && (
                    <p className="text-sm font-semibold text-green-600">
                      Potential savings: {formatCurrency(rec.savingsGBP)}
                    </p>
                  )}
                  {rec.impact && (
                    <p className="text-sm font-semibold text-blue-600">
                      Impact: {rec.impact.replace('_', ' ')}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm">
                  Apply
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Lead Time Analysis */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Multi-Market Lead Time Analysis
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marketLeadTimes.map((market) => (
            <Card key={market.market} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{market.market}</span>
                <Badge variant={market.variability === 'High' ? 'destructive' : market.variability === 'Medium' ? 'secondary' : 'default'}>
                  {market.variability}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-gray-900">{market.leadTime} days</p>
              <p className="text-sm text-gray-600">Average lead time</p>
            </Card>
          ))}
        </div>

        <div className="mt-6 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={marketLeadTimes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="market" />
              <YAxis tickFormatter={(value) => `${value}d`} />
              <Tooltip formatter={(value) => `${value} days`} />
              <Bar dataKey="leadTime" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Optimization Scenarios */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Optimization Scenarios</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {optimizationScenarios.map((scenario, index) => (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <h4 className="font-semibold mb-2">{scenario.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">WC Reduction:</span>
                  <Badge variant="default">{scenario.wcReduction}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Stockout Risk:</span>
                  <Badge variant={scenario.stockoutRisk > 5 ? 'destructive' : 'secondary'}>
                    {scenario.stockoutRisk}%
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default InventoryOptimizer;