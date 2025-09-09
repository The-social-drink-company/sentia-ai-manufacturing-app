// Interactive What-If Analysis System for Working Capital Optimization
// Provides slider-based scenario modeling for enterprise decision making

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, Truck, Calendar, 
  AlertCircle, CheckCircle, Sliders, Calculator, Target, Percent,
  ArrowUpDown, BarChart3, PieChart
} from 'lucide-react';
import DateContextEngine from '../../services/DateContextEngine';
import CashConversionCycleEngine from '../../services/CashConversionCycleEngine';

const WhatIfAnalysis = () => {
  // Calendar-aware engines for realistic calculations
  const [dateEngine] = useState(() => new DateContextEngine());
  const [cccEngine] = useState(() => new CashConversionCycleEngine());
  
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

  // Calendar-aware calculations based on current scenario
  const calculations = useMemo(() => {
    const { rawMaterials, manufacturing, inventory, sales, finance } = scenarios;
    
    try {
      // Get current business context
      const context = dateEngine.getCurrentContext();
      
      // Calculate realistic Cash Conversion Cycle based on scenarios
      const cccOptions = {
        targetDSO: finance.collectionPeriod,
        targetDPO: finance.payablesPeriod,
        targetDIO: (inventory.finishedGoods + inventory.rawMaterials + inventory.workInProcess) / 3,
        creditTerms: {
          net15: 0.1,
          net30: finance.collectionPeriod <= 30 ? 0.6 : 0.4,
          net45: finance.collectionPeriod > 30 ? 0.4 : 0.2,
          net60: finance.collectionPeriod > 45 ? 0.3 : 0.1
        }
      };
      
      const cccEngine = new CashConversionCycleEngine(cccOptions);
      const cccResults = cccEngine.calculateCashConversionCycle({
        annualRevenue: marketData.uk.revenue + marketData.us.revenue + marketData.eu.revenue,
        annualCOGS: (marketData.uk.revenue + marketData.us.revenue + marketData.eu.revenue) * 0.65
      });

      // Apply growth rates by market with seasonal adjustments
      const seasonalMultiplier = dateEngine.seasonalPatterns.getBusinessSeasonality(
        context.currentMonth, 
        context.currentQuarter
      );
      
      const projectedRevenue = 
        marketData.uk.revenue * (1 + sales.ukGrowth / 100) * seasonalMultiplier +
        marketData.us.revenue * (1 + sales.usGrowth / 100) * seasonalMultiplier +
        marketData.eu.revenue * (1 + sales.euGrowth / 100) * seasonalMultiplier;
      
      // Manufacturing capacity with realistic constraints
      const capacityConstraint = manufacturing.capacity / 100;
      const efficiencyFactor = manufacturing.efficiency / 100;
      const downtimeImpact = (100 - manufacturing.downtime) / 100;
      const actualCapacity = Math.min(1, capacityConstraint * efficiencyFactor * downtimeImpact);
      
      // Revenue adjusted for capacity and seasonal constraints
      const capacityAdjustedRevenue = projectedRevenue * actualCapacity;
      
      // Working capital components based on CCC calculations
      const workingCapital = cccResults.balanceSheetItems.receivables + 
                            cccResults.balanceSheetItems.inventory - 
                            cccResults.balanceSheetItems.payables;
      
      // Raw materials supply chain risk assessment
      const rawMaterialRisk = (100 - rawMaterials.availability) / 100;
      const deliveryRisk = Math.max(0, (rawMaterials.deliveryTime - 7) / 30); // Risk increases with delivery time
      const supplychainRisk = (rawMaterialRisk + deliveryRisk) / 2;
      
      // Cost of capital based on working capital requirements
      const interestCost = workingCapital * (finance.interestRate / 100);
      
      // Calendar-aware seasonal working capital requirements
      const seasonalVariation = sales.seasonality / 100;
      const isHighSeason = [10, 11, 12].includes(context.currentMonth); // Q4 high season
      const seasonalPeak = workingCapital * (1 + seasonalVariation);
      const seasonalTrough = workingCapital * (1 - seasonalVariation / 2);
      
      // Overall risk assessment with business calendar context
      const operationalRisk = actualCapacity > 0.95 ? 0.8 : actualCapacity < 0.7 ? 0.6 : 0.3;
      const overallRisk = Math.min(100, (supplychainRisk * 40 + operationalRisk * 30 + (finance.interestRate / 12) * 30) * 100);
      
      return {
        projectedRevenue: Math.round(capacityAdjustedRevenue),
        workingCapital: Math.round(workingCapital),
        seasonalPeak: Math.round(seasonalPeak),
        seasonalTrough: Math.round(seasonalTrough),
        interestCost: Math.round(interestCost),
        inventoryValue: Math.round(cccResults.balanceSheetItems.inventory),
        receivablesValue: Math.round(cccResults.balanceSheetItems.receivables),
        payablesValue: Math.round(cccResults.balanceSheetItems.payables),
        actualCapacity: Math.round(actualCapacity * 100),
        rawMaterialRisk: Math.round(supplychainRisk * 100),
        overallRisk: Math.round(overallRisk),
        cashConversionCycle: cccResults.cashConversionCycle,
        cccComponents: cccResults.components,
        seasonalMultiplier: Math.round(seasonalMultiplier * 100) / 100,
        businessContext: context,
        recommendations: generateCalendarAwareRecommendations(scenarios, {
          workingCapital,
          actualCapacity,
          supplychainRisk,
          cccResults,
          context
        })
      };
      
    } catch (error) {
      console.error('What-If Analysis calculation error:', error);
      // Fallback to basic calculations if calendar engine fails
      return generateFallbackCalculations(scenarios, marketData);
    }
  }, [scenarios, marketData, dateEngine, cccEngine]);

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

// Helper functions for calendar-aware calculations
const generateCalendarAwareRecommendations = (scenarios, calculations) => {
  const { workingCapital, actualCapacity, supplychainRisk, cccResults, context } = calculations;
  const recommendations = [];
  
  // Working capital optimization based on Cash Conversion Cycle
  if (cccResults && cccResults.cashConversionCycle > (cccResults.benchmarks?.targetCCC || 45) + 10) {
    recommendations.push({
      type: 'cash-conversion',
      priority: 'high',
      message: `CCC of ${cccResults.cashConversionCycle.toFixed(1)} days exceeds target`,
      impact: `Potential cash release: £${Math.round((cccResults.cashConversionCycle - 45) * 40000000 / 365).toLocaleString()}`
    });
  }
  
  // Seasonal working capital planning
  if (context && [9, 10].includes(context.currentMonth)) {
    recommendations.push({
      type: 'seasonal',
      priority: 'medium',
      message: 'Q4 peak season approaching. Ensure adequate credit facilities.',
      impact: `Additional WC needed: £${Math.round(workingCapital * 0.2).toLocaleString()}`
    });
  }
  
  // Capacity utilization based on current month
  if (actualCapacity > 95 && context && [10, 11, 12].includes(context.currentMonth)) {
    recommendations.push({
      type: 'capacity',
      priority: 'high',
      message: 'Peak season capacity constraint detected.',
      impact: 'Revenue at risk during peak demand period'
    });
  }
  
  return recommendations;
};

const generateFallbackCalculations = (scenarios, marketData) => {
  // Basic fallback calculations if calendar engine fails
  const { rawMaterials, manufacturing, inventory, sales, finance } = scenarios;
  const baseRevenue = marketData.uk.revenue + marketData.us.revenue + marketData.eu.revenue;
  
  const projectedRevenue = baseRevenue * (1 + sales.ukGrowth / 200);
  const actualCapacity = Math.min(100, (manufacturing.capacity * manufacturing.efficiency) / 100);
  const workingCapital = projectedRevenue * 0.25;
  
  return {
    projectedRevenue: Math.round(projectedRevenue),
    workingCapital: Math.round(workingCapital),
    seasonalPeak: Math.round(workingCapital * 1.2),
    seasonalTrough: Math.round(workingCapital * 0.8),
    interestCost: Math.round(workingCapital * finance.interestRate / 100),
    inventoryValue: Math.round(workingCapital * 0.4),
    receivablesValue: Math.round(workingCapital * 0.35),
    payablesValue: Math.round(workingCapital * 0.25),
    actualCapacity: Math.round(actualCapacity),
    rawMaterialRisk: Math.round((100 - rawMaterials.availability)),
    overallRisk: 50,
    cashConversionCycle: 45,
    cccComponents: { dso: 30, dio: 35, dpo: 20 },
    seasonalMultiplier: 1.0,
    businessContext: { currentDate: new Date().toISOString().split('T')[0] },
    recommendations: [
      {
        type: 'fallback',
        priority: 'medium',
        message: 'Using simplified calculations. Full calendar analysis unavailable.',
        impact: 'Limited scenario accuracy'
      }
    ]
  };
};

export default WhatIfAnalysis;