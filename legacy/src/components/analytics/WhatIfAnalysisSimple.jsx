import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { Button } from '../ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Package, Truck, Building2 } from 'lucide-react';

const WhatIfAnalysisSimple = () => {
  // Scenario parameters with default values
  const [parameters, setParameters] = useState({
    salesGrowth: 10,
    priceIncrease: 5,
    costReduction: 8,
    inventoryTurnover: 12,
    daysPayable: 45,
    daysReceivable: 30,
    marketShare: 25,
    productionCapacity: 75
  });

  // Calculate impact based on parameters
  const calculateImpact = () => {
    const baseRevenue = 2800000; // Â£2.8M base
    const baseCost = 1960000; // Â£1.96M base (70% of revenue)
    
    const revenueImpact = baseRevenue * (1 + parameters.salesGrowth / 100) * (1 + parameters.priceIncrease / 100);
    const costImpact = baseCost * (1 - parameters.costReduction / 100);
    const profitImpact = revenueImpact - costImpact;
    const marginPercent = (profitImpact / revenueImpact) * 100;
    
    const workingCapital = (revenueImpact / 365) * (parameters.daysReceivable - parameters.daysPayable);
    const cashFlow = profitImpact - workingCapital;
    
    return {
      revenue: revenueImpact,
      cost: costImpact,
      profit: profitImpact,
      margin: marginPercent,
      workingCapital: workingCapital,
      cashFlow: cashFlow,
      roi: (profitImpact / baseRevenue) * 100
    };
  };

  const impact = calculateImpact();

  // Chart data for visualization
  const chartData = [
    {
      metric: 'Revenue',
      current: 2800000,
      projected: impact.revenue,
      change: ((impact.revenue - 2800000) / 2800000) * 100
    },
    {
      metric: 'Costs',
      current: 1960000,
      projected: impact.cost,
      change: ((impact.cost - 1960000) / 1960000) * 100
    },
    {
      metric: 'Profit',
      current: 840000,
      projected: impact.profit,
      change: ((impact.profit - 840000) / 840000) * 100
    },
    {
      metric: 'Working Capital',
      current: 230000,
      projected: Math.abs(impact.workingCapital),
      change: ((Math.abs(impact.workingCapital) - 230000) / 230000) * 100
    }
  ];

  const timeSeriesData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    revenue: impact.revenue / 12 * (1 + (i * 0.02)),
    profit: impact.profit / 12 * (1 + (i * 0.03))
  }));

  const handleSliderChange = (param, value) => {
    setParameters(prev => ({
      ...prev,
      [param]: value[0]
    }));
  };

  const resetScenario = () => {
    setParameters({
      salesGrowth: 10,
      priceIncrease: 5,
      costReduction: 8,
      inventoryTurnover: 12,
      daysPayable: 45,
      daysReceivable: 30,
      marketShare: 25,
      productionCapacity: 75
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">What-If Analysis</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Adjust parameters to see projected business impact
            </p>
          </div>
          <Button onClick={resetScenario} variant="outline">
            Reset Scenario
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Projected Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(impact.revenue)}
                </p>
                <p className={`text-sm mt-1 ${impact.revenue > 2800000 ? 'text-green-600' : 'text-red-600'}`}>
                  {impact.revenue > 2800000 ? 'â†‘' : 'â†“'} {formatPercent(((impact.revenue - 2800000) / 2800000) * 100)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Projected Profit</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(impact.profit)}
                </p>
                <p className={`text-sm mt-1 ${impact.profit > 840000 ? 'text-green-600' : 'text-red-600'}`}>
                  {impact.profit > 840000 ? 'â†‘' : 'â†“'} {formatPercent(((impact.profit - 840000) / 840000) * 100)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Profit Margin</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPercent(impact.margin)}
                </p>
                <p className={`text-sm mt-1 ${impact.margin > 30 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {impact.margin > 30 ? 'Excellent' : 'Good'}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cash Flow</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(impact.cashFlow)}
                </p>
                <p className={`text-sm mt-1 ${impact.cashFlow > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {impact.cashFlow > 0 ? 'Positive' : 'Negative'}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parameter Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Sales Growth</label>
                <span className="text-sm font-bold">{parameters.salesGrowth}%</span>
              </div>
              <Slider
                value={[parameters.salesGrowth]}
                onValueChange={(value) => handleSliderChange('salesGrowth', value)}
                min={-20}
                max={50}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Price Increase</label>
                <span className="text-sm font-bold">{parameters.priceIncrease}%</span>
              </div>
              <Slider
                value={[parameters.priceIncrease]}
                onValueChange={(value) => handleSliderChange('priceIncrease', value)}
                min={-10}
                max={30}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Market Share</label>
                <span className="text-sm font-bold">{parameters.marketShare}%</span>
              </div>
              <Slider
                value={[parameters.marketShare]}
                onValueChange={(value) => handleSliderChange('marketShare', value)}
                min={5}
                max={50}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Production Capacity</label>
                <span className="text-sm font-bold">{parameters.productionCapacity}%</span>
              </div>
              <Slider
                value={[parameters.productionCapacity]}
                onValueChange={(value) => handleSliderChange('productionCapacity', value)}
                min={50}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost & Working Capital Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Cost Reduction</label>
                <span className="text-sm font-bold">{parameters.costReduction}%</span>
              </div>
              <Slider
                value={[parameters.costReduction]}
                onValueChange={(value) => handleSliderChange('costReduction', value)}
                min={0}
                max={25}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Inventory Turnover</label>
                <span className="text-sm font-bold">{parameters.inventoryTurnover}x</span>
              </div>
              <Slider
                value={[parameters.inventoryTurnover]}
                onValueChange={(value) => handleSliderChange('inventoryTurnover', value)}
                min={4}
                max={24}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Days Payable</label>
                <span className="text-sm font-bold">{parameters.daysPayable} days</span>
              </div>
              <Slider
                value={[parameters.daysPayable]}
                onValueChange={(value) => handleSliderChange('daysPayable', value)}
                min={15}
                max={90}
                step={5}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Days Receivable</label>
                <span className="text-sm font-bold">{parameters.daysReceivable} days</span>
              </div>
              <Slider
                value={[parameters.daysReceivable]}
                onValueChange={(value) => handleSliderChange('daysReceivable', value)}
                min={15}
                max={90}
                step={5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current vs Projected Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis tickFormatter={(value) => `Â£${(value / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="current" fill="#8884d8" name="Current" />
                <Bar dataKey="projected" fill="#82ca9d" name="Projected" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Projection</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `Â£${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" strokeWidth={2} />
                <Line type="monotone" dataKey="profit" stroke="#82ca9d" name="Profit" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Revenue Impact</p>
              <p className="text-lg font-bold">{formatCurrency(impact.revenue - 2800000)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Profit Impact</p>
              <p className="text-lg font-bold">{formatCurrency(impact.profit - 840000)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ROI</p>
              <p className="text-lg font-bold">{formatPercent(impact.roi)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Working Capital</p>
              <p className="text-lg font-bold">{formatCurrency(Math.abs(impact.workingCapital))}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatIfAnalysisSimple;
