// Interactive What-If Analysis System for Working Capital Optimization
// Provides slider-based scenario modeling for enterprise decision making

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, Truck, Calendar, 
  AlertCircle, CheckCircle, Sliders, Calculator, Target, Percent,
  ArrowUpDown, BarChart3, PieChart
} from 'lucide-react';

const WhatIfAnalysis = () => {
  // Core scenario parameters with realistic defaults
  const [scenarios, setScenarios] = useState({
    rawMaterials: {
      availability: 85, // % availability
      deliveryTime: 14, // days
      costVariation: 0, // % cost change
      bufferStock: 20 // % buffer
    },
    manufacturing: {
      capacity: 80, // % capacity utilization
      efficiency: 92, // % efficiency
      overtime: 0, // % overtime hours
      downtime: 5 // % planned downtime
    },
    inventory: {
      finishedGoods: 30, // days of inventory
      rawMaterials: 21, // days of inventory
      workInProcess: 7, // days of inventory
      safetyStock: 15 // % safety stock
    },
    sales: {
      ukGrowth: 8, // % growth
      usGrowth: 12, // % growth
      euGrowth: 5, // % growth
      seasonality: 15, // % seasonal variation
      newProducts: 0 // % from new products
    },
    finance: {
      interestRate: 4.5, // % borrowing rate
      paymentTerms: 30, // days
      collectionPeriod: 45, // days
      payablesPeriod: 60, // days
      cashReserve: 10 // % of revenue
    }
  });

  // Market-specific parameters
  const [marketData] = useState({
    uk: { revenue: 12500000, growth: 8, margin: 22, risk: 'Low' },
    us: { revenue: 18200000, growth: 12, margin: 25, risk: 'Medium' },
    eu: { revenue: 9800000, growth: 5, margin: 18, risk: 'Low' }
  });

  // Calculated results based on current scenario
  const calculations = useMemo(() => {
    const { rawMaterials, manufacturing, inventory, sales, finance } = scenarios;
    
    // Base revenue calculation
    const baseRevenue = marketData.uk.revenue + marketData.us.revenue + marketData.eu.revenue;
    
    // Apply growth rates by market
    const projectedRevenue = 
      marketData.uk.revenue * (1 + sales.ukGrowth / 100) +
      marketData.us.revenue * (1 + sales.usGrowth / 100) +
      marketData.eu.revenue * (1 + sales.euGrowth / 100);
    
    // Manufacturing capacity impact
    const capacityConstraint = manufacturing.capacity / 100;
    const efficiencyFactor = manufacturing.efficiency / 100;
    const actualCapacity = Math.min(1, capacityConstraint * efficiencyFactor);
    
    // Revenue adjusted for capacity constraints
    const capacityAdjustedRevenue = projectedRevenue * actualCapacity;
    
    // Working capital components
    const avgInventoryDays = (inventory.finishedGoods + inventory.rawMaterials + inventory.workInProcess) / 3;
    const inventoryValue = (capacityAdjustedRevenue * 0.6) * (avgInventoryDays / 365); // 60% COGS assumption
    
    const receivablesValue = capacityAdjustedRevenue * (finance.collectionPeriod / 365);
    const payablesValue = (capacityAdjustedRevenue * 0.4) * (finance.payablesPeriod / 365); // 40% of COGS
    
    const workingCapital = inventoryValue + receivablesValue - payablesValue;
    
    // Raw materials impact
    const rawMaterialRisk = (100 - rawMaterials.availability) / 100;
    const deliveryRisk = Math.max(0, (rawMaterials.deliveryTime - 10) / 20); // Risk increases with delivery time
    const rawMaterialCostImpact = rawMaterials.costVariation / 100;
    
    // Cost of capital
    const interestCost = workingCapital * (finance.interestRate / 100);
    
    // Seasonal working capital requirements
    const seasonalPeak = workingCapital * (1 + sales.seasonality / 100);
    const seasonalTrough = workingCapital * (1 - sales.seasonality / 200);
    
    // Risk assessment
    const overallRisk = calculateRisk(rawMaterialRisk, deliveryRisk, actualCapacity);
    
    return {
      projectedRevenue: Math.round(capacityAdjustedRevenue),
      workingCapital: Math.round(workingCapital),
      seasonalPeak: Math.round(seasonalPeak),
      seasonalTrough: Math.round(seasonalTrough),
      interestCost: Math.round(interestCost),
      inventoryValue: Math.round(inventoryValue),
      receivablesValue: Math.round(receivablesValue),
      payablesValue: Math.round(payablesValue),
      actualCapacity: Math.round(actualCapacity * 100),
      rawMaterialRisk: Math.round(rawMaterialRisk * 100),
      overallRisk,
      recommendations: generateRecommendations(scenarios, {
        workingCapital,
        actualCapacity,
        rawMaterialRisk
      })
    };
  }, [scenarios, marketData]);

  // Generate time series data for charts
  const chartData = useMemo(() => {
    const months = [];
    const baseWC = calculations.workingCapital;
    
    for (let i = 0; i < 12; i++) {
      const seasonalFactor = 1 + (scenarios.sales.seasonality / 100) * 
        Math.sin((i * Math.PI * 2) / 12 + Math.PI / 2);
      
      months.push({
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        workingCapital: Math.round(baseWC * seasonalFactor),
        cashFlow: Math.round((calculations.projectedRevenue / 12) * seasonalFactor - 
                            (calculations.interestCost / 12) * seasonalFactor),
        inventory: Math.round(calculations.inventoryValue * seasonalFactor),
        receivables: Math.round(calculations.receivablesValue * seasonalFactor)
      });
    }
    
    return months;
  }, [calculations, scenarios]);

  // Update scenario parameter
  const updateScenario = useCallback((category, key, value) => {
    setScenarios(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Sliders className="w-8 h-8 mr-3 text-blue-600" />
                What-If Analysis
              </h1>
              <p className="mt-2 text-gray-600">
                Interactive working capital optimization for UK, US, and EU markets
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">Total Working Capital</div>
                <div className="text-2xl font-bold text-gray-900">
                  ${(calculations.workingCapital / 1000000).toFixed(1)}M
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Projected Revenue"
            value={`$${(calculations.projectedRevenue / 1000000).toFixed(1)}M`}
            change="vs current year"
            trend="up"
            icon={<DollarSign className="w-6 h-6" />}
            color="green"
          />
          <MetricCard
            title="Seasonal Peak WC"
            value={`$${(calculations.seasonalPeak / 1000000).toFixed(1)}M`}
            change={`+${scenarios.sales.seasonality}% seasonal`}
            trend="up"
            icon={<TrendingUp className="w-6 h-6" />}
            color="orange"
          />
          <MetricCard
            title="Interest Cost"
            value={`$${(calculations.interestCost / 1000).toFixed(0)}K`}
            change={`@ ${scenarios.finance.interestRate}% rate`}
            trend="neutral"
            icon={<Percent className="w-6 h-6" />}
            color="blue"
          />
          <MetricCard
            title="Capacity Utilization"
            value={`${calculations.actualCapacity}%`}
            change="effective capacity"
            trend={calculations.actualCapacity > 95 ? "up" : "neutral"}
            icon={<Target className="w-6 h-6" />}
            color={calculations.actualCapacity > 95 ? "red" : "blue"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Control Panels */}
          <div className="lg:col-span-2 space-y-6">
            {/* Raw Materials Controls */}
            <ControlPanel
              title="Raw Materials & Supply Chain"
              icon={<Package className="w-5 h-5" />}
            >
              <SliderControl
                label="Material Availability"
                value={scenarios.rawMaterials.availability}
                onChange={(value) => updateScenario('rawMaterials', 'availability', value)}
                min={50}
                max={100}
                suffix="%"
                description="Supplier reliability and material availability"
              />
              <SliderControl
                label="Delivery Lead Time"
                value={scenarios.rawMaterials.deliveryTime}
                onChange={(value) => updateScenario('rawMaterials', 'deliveryTime', value)}
                min={7}
                max={60}
                suffix=" days"
                description="Average delivery time from suppliers"
              />
              <SliderControl
                label="Cost Variation"
                value={scenarios.rawMaterials.costVariation}
                onChange={(value) => updateScenario('rawMaterials', 'costVariation', value)}
                min={-20}
                max={30}
                suffix="%"
                description="Expected change in raw material costs"
              />
              <SliderControl
                label="Buffer Stock Level"
                value={scenarios.rawMaterials.bufferStock}
                onChange={(value) => updateScenario('rawMaterials', 'bufferStock', value)}
                min={0}
                max={50}
                suffix="%"
                description="Safety stock as % of normal inventory"
              />
            </ControlPanel>

            {/* Manufacturing Controls */}
            <ControlPanel
              title="Manufacturing Operations"
              icon={<BarChart3 className="w-5 h-5" />}
            >
              <SliderControl
                label="Capacity Utilization"
                value={scenarios.manufacturing.capacity}
                onChange={(value) => updateScenario('manufacturing', 'capacity', value)}
                min={50}
                max={100}
                suffix="%"
                description="Percentage of maximum production capacity"
              />
              <SliderControl
                label="Manufacturing Efficiency"
                value={scenarios.manufacturing.efficiency}
                onChange={(value) => updateScenario('manufacturing', 'efficiency', value)}
                min={70}
                max={100}
                suffix="%"
                description="Overall equipment effectiveness (OEE)"
              />
              <SliderControl
                label="Overtime Hours"
                value={scenarios.manufacturing.overtime}
                onChange={(value) => updateScenario('manufacturing', 'overtime', value)}
                min={0}
                max={40}
                suffix="%"
                description="Overtime as % of regular hours"
              />
            </ControlPanel>

            {/* Inventory Controls */}
            <ControlPanel
              title="Inventory Management"
              icon={<Package className="w-5 h-5" />}
            >
              <SliderControl
                label="Finished Goods Inventory"
                value={scenarios.inventory.finishedGoods}
                onChange={(value) => updateScenario('inventory', 'finishedGoods', value)}
                min={7}
                max={90}
                suffix=" days"
                description="Days of finished goods inventory"
              />
              <SliderControl
                label="Raw Materials Inventory"
                value={scenarios.inventory.rawMaterials}
                onChange={(value) => updateScenario('inventory', 'rawMaterials', value)}
                min={7}
                max={60}
                suffix=" days"
                description="Days of raw materials inventory"
              />
              <SliderControl
                label="Safety Stock Level"
                value={scenarios.inventory.safetyStock}
                onChange={(value) => updateScenario('inventory', 'safetyStock', value)}
                min={5}
                max={40}
                suffix="%"
                description="Safety stock as % of normal inventory"
              />
            </ControlPanel>

            {/* Sales Forecast Controls */}
            <ControlPanel
              title="Sales Projections by Market"
              icon={<TrendingUp className="w-5 h-5" />}
            >
              <SliderControl
                label="UK Market Growth"
                value={scenarios.sales.ukGrowth}
                onChange={(value) => updateScenario('sales', 'ukGrowth', value)}
                min={-10}
                max={25}
                suffix="%"
                description="Expected growth in UK market"
              />
              <SliderControl
                label="US Market Growth"
                value={scenarios.sales.usGrowth}
                onChange={(value) => updateScenario('sales', 'usGrowth', value)}
                min={-10}
                max={30}
                suffix="%"
                description="Expected growth in US market"
              />
              <SliderControl
                label="EU Market Growth"
                value={scenarios.sales.euGrowth}
                onChange={(value) => updateScenario('sales', 'euGrowth', value)}
                min={-15}
                max={20}
                suffix="%"
                description="Expected growth in EU market"
              />
              <SliderControl
                label="Seasonal Variation"
                value={scenarios.sales.seasonality}
                onChange={(value) => updateScenario('sales', 'seasonality', value)}
                min={0}
                max={50}
                suffix="%"
                description="Peak season vs. normal sales"
              />
            </ControlPanel>

            {/* Financial Controls */}
            <ControlPanel
              title="Financial Parameters"
              icon={<DollarSign className="w-5 h-5" />}
            >
              <SliderControl
                label="Borrowing Interest Rate"
                value={scenarios.finance.interestRate}
                onChange={(value) => updateScenario('finance', 'interestRate', value)}
                min={1}
                max={12}
                suffix="%"
                step={0.1}
                description="Cost of borrowing working capital"
              />
              <SliderControl
                label="Customer Payment Terms"
                value={scenarios.finance.collectionPeriod}
                onChange={(value) => updateScenario('finance', 'collectionPeriod', value)}
                min={15}
                max={90}
                suffix=" days"
                description="Average customer payment period"
              />
              <SliderControl
                label="Supplier Payment Terms"
                value={scenarios.finance.payablesPeriod}
                onChange={(value) => updateScenario('finance', 'payablesPeriod', value)}
                min={15}
                max={120}
                suffix=" days"
                description="Payment terms with suppliers"
              />
            </ControlPanel>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {/* Working Capital Breakdown */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <PieChart className="w-5 h-5 mr-2 text-blue-600" />
                Working Capital Components
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-900">Inventory</span>
                  <span className="text-lg font-bold text-green-900">
                    ${(calculations.inventoryValue / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-blue-900">Receivables</span>
                  <span className="text-lg font-bold text-blue-900">
                    ${(calculations.receivablesValue / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium text-red-900">Payables</span>
                  <span className="text-lg font-bold text-red-900">
                    -${(calculations.payablesValue / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-bold text-gray-900">Net Working Capital</span>
                    <span className="text-xl font-bold text-gray-900">
                      ${(calculations.workingCapital / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
                Risk Assessment
              </h3>
              <RiskIndicator 
                label="Overall Risk"
                level={calculations.overallRisk}
              />
              <RiskIndicator 
                label="Supply Chain Risk"
                level={calculations.rawMaterialRisk}
              />
              <RiskIndicator 
                label="Capacity Risk"
                level={calculations.actualCapacity > 95 ? 85 : 25}
              />
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Recommendations
              </h3>
              <div className="space-y-3">
                {calculations.recommendations.map((rec, index) => (
                  <div key={index} className={`p-3 rounded-lg text-sm ${
                    rec.priority === 'high' ? 'bg-red-50 border border-red-200' :
                    rec.priority === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="font-medium mb-1">{rec.title}</div>
                    <div className="text-gray-600">{rec.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Working Capital Over Time */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Seasonal Working Capital Requirements</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value) => [`$${(value / 1000000).toFixed(1)}M`, 'Working Capital']} />
                <Area 
                  type="monotone" 
                  dataKey="workingCapital" 
                  stroke="#3B82F6" 
                  fill="#93C5FD" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Cash Flow Projection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Monthly Cash Flow Projection</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value) => [`$${(value / 1000000).toFixed(1)}M`]} />
                <Line 
                  type="monotone" 
                  dataKey="cashFlow" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Components
const MetricCard = ({ title, value, change, trend, icon, color }) => {
  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="flex items-center mt-1">
            {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
            <span className="text-sm text-gray-500 ml-1">{change}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ControlPanel = ({ title, icon, children }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
      <span className="text-blue-600 mr-2">{icon}</span>
      {title}
    </h3>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const SliderControl = ({ label, value, onChange, min, max, suffix = '', step = 1, description }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <span className="text-sm font-bold text-blue-600">
        {value}{suffix}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
    />
    <p className="text-xs text-gray-500">{description}</p>
  </div>
);

const RiskIndicator = ({ label, level }) => {
  const getRiskColor = (level) => {
    if (level <= 30) return 'bg-green-500';
    if (level <= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRiskLabel = (level) => {
    if (level <= 30) return 'Low';
    if (level <= 60) return 'Medium';
    return 'High';
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
        <span>{label}</span>
        <span>{getRiskLabel(level)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${getRiskColor(level)}`}
          style={{ width: `${level}%` }}
        ></div>
      </div>
    </div>
  );
};

// Helper Functions
const calculateRisk = (rawMaterialRisk, deliveryRisk, capacity) => {
  const capacityRisk = capacity < 0.8 ? 0.2 : capacity > 0.95 ? 0.8 : 0.1;
  const overallRisk = (rawMaterialRisk * 0.4 + deliveryRisk * 0.3 + capacityRisk * 0.3) * 100;
  return Math.min(100, Math.max(0, overallRisk));
};

const generateRecommendations = (scenarios, calculations) => {
  const recommendations = [];

  // Working capital recommendations
  if (calculations.workingCapital > 20000000) {
    recommendations.push({
      title: 'High Working Capital Alert',
      description: 'Consider reducing inventory levels or improving collection terms to lower working capital requirements.',
      priority: 'high'
    });
  }

  // Capacity recommendations
  if (calculations.actualCapacity > 95) {
    recommendations.push({
      title: 'Capacity Constraint Risk',
      description: 'Operating near maximum capacity. Consider increasing manufacturing capacity or overtime planning.',
      priority: 'high'
    });
  }

  // Raw material recommendations
  if (calculations.rawMaterialRisk > 50) {
    recommendations.push({
      title: 'Supply Chain Risk',
      description: 'High raw material supply risk detected. Consider diversifying suppliers or increasing buffer stock.',
      priority: 'medium'
    });
  }

  // Interest rate recommendations
  if (scenarios.finance.interestRate > 6) {
    recommendations.push({
      title: 'High Borrowing Costs',
      description: 'Interest rates above 6%. Focus on minimizing working capital through improved cash management.',
      priority: 'medium'
    });
  }

  // Seasonal recommendations
  if (scenarios.sales.seasonality > 25) {
    recommendations.push({
      title: 'High Seasonality Impact',
      description: 'Consider seasonal credit facilities or inventory management strategies to handle peak periods.',
      priority: 'low'
    });
  }

  return recommendations.length > 0 ? recommendations : [
    {
      title: 'Optimal Configuration',
      description: 'Current settings appear well-balanced for your working capital requirements.',
      priority: 'low'
    }
  ];
};

export default WhatIfAnalysis;