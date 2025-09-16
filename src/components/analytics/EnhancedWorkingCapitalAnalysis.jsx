import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart, PieChart, Pie, Cell } from 'recharts';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, Calculator,
  Sliders, Target, ArrowUpDown, BarChart3, PieChart as PieChartIcon,
  Settings, RefreshCw, Download, Upload, AlertTriangle,
  CreditCard, Banknote, Package, Truck, Clock, Users,
  ChevronUp, ChevronDown, Play, Pause, RotateCcw
} from 'lucide-react';

const EnhancedWorkingCapitalAnalysis = () => {
  // Advanced Working Capital Parameters with Interactive Sliders
  const [parameters, setParameters] = useState({
    // Cash Flow Management
    cashFlow: {
      baseAmount: 500000, // Base cash amount
      variability: 15, // Cash flow variability %
      cycleTime: 30, // Cash conversion cycle (days)
      seasonality: 10 // Seasonal variation %
    },
    
    // Accounts Receivable
    accountsReceivable: {
      amount: 850000, // AR amount
      dso: 45, // Days Sales Outstanding
      collectionRate: 95, // Collection rate %
      badDebtRate: 2 // Bad debt rate %
    },
    
    // Accounts Payable  
    accountsPayable: {
      amount: 450000, // AP amount
      dpo: 35, // Days Payable Outstanding
      paymentTerms: 30, // Payment terms (days)
      earlyPayDiscount: 2 // Early payment discount %
    },
    
    // Inventory Management
    inventory: {
      rawMaterials: 320000, // Raw materials value
      workInProcess: 180000, // WIP value
      finishedGoods: 420000, // Finished goods value
      turnoverRate: 8, // Inventory turnover rate
      holdingCost: 25 // Holding cost %
    },
    
    // Production Parameters
    production: {
      capacity: 85, // Capacity utilization %
      efficiency: 92, // Production efficiency %
      overtime: 10, // Overtime hours %
      wastage: 3 // Material wastage %
    },
    
    // Financial Ratios
    ratios: {
      currentRatio: 2.1, // Current ratio
      quickRatio: 1.5, // Quick ratio
      grossMargin: 35, // Gross margin %
      operatingMargin: 18 // Operating margin %
    }
  });

  // Scenario tracking for comparison
  const [scenarios, setScenarios] = useState([]);
  const [activeScenario, setActiveScenario] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  // Calculate Working Capital Metrics
  const workingCapitalMetrics = useMemo(() => {
    const { cashFlow, accountsReceivable, accountsPayable, inventory, production, ratios } = parameters;
    
    // Working Capital = Current Assets - Current Liabilities
    const currentAssets = cashFlow.baseAmount + accountsReceivable.amount + 
                         inventory.rawMaterials + inventory.workInProcess + inventory.finishedGoods;
    const currentLiabilities = accountsPayable.amount;
    const workingCapital = currentAssets - currentLiabilities;
    
    // Cash Conversion Cycle
    const dso = accountsReceivable.dso;
    const dpo = accountsPayable.dpo;
    const dio = 365 / inventory.turnoverRate; // Days Inventory Outstanding
    const cashConversionCycle = dso + dio - dpo;
    
    // Free Cash Flow
    const operatingCashFlow = (workingCapital * ratios.operatingMargin) / 100;
    const capitalExpenditure = workingCapital * 0.05; // Assume 5% capex
    const freeCashFlow = operatingCashFlow - capitalExpenditure;
    
    // Working Capital Velocity
    const annualRevenue = workingCapital * inventory.turnoverRate;
    const workingCapitalVelocity = annualRevenue / workingCapital;
    
    // Efficiency Metrics
    const assetTurnover = annualRevenue / currentAssets;
    const receivablesEfficiency = 365 / dso;
    const payablesEfficiency = 365 / dpo;
    const inventoryEfficiency = inventory.turnoverRate;
    
    return {
      workingCapital,
      currentAssets,
      currentLiabilities,
      cashConversionCycle,
      freeCashFlow,
      workingCapitalVelocity,
      annualRevenue,
      assetTurnover,
      receivablesEfficiency,
      payablesEfficiency,
      inventoryEfficiency,
      currentRatio: currentAssets / currentLiabilities,
      quickRatio: (currentAssets - inventory.rawMaterials - inventory.workInProcess - inventory.finishedGoods) / currentLiabilities
    };
  }, [parameters]);

  // Generate time series data for projections
  const projectionData = useMemo(() => {
    const months = [];
    const baseWorkingCapital = workingCapitalMetrics.workingCapital;
    
    for (let i = 0; i <= 12; i++) {
      const seasonalityFactor = 1 + (parameters.cashFlow.seasonality / 100) * Math.sin((i * Math.PI) / 6);
      const variabilityFactor = 1 + ((0 /* REAL DATA REQUIRED */ 0.5) * parameters.cashFlow.variability) / 100;
      
      const projectedWC = baseWorkingCapital * seasonalityFactor * variabilityFactor;
      const projectedCashFlow = workingCapitalMetrics.freeCashFlow * seasonalityFactor;
      
      months.push({
        month: i,
        monthName: new Date(2024, i).toLocaleDateString('en-US', { month: 'short' }),
        workingCapital: Math.round(projectedWC),
        freeCashFlow: Math.round(projectedCashFlow),
        receivables: Math.round(parameters.accountsReceivable.amount * seasonalityFactor),
        payables: Math.round(parameters.accountsPayable.amount * seasonalityFactor),
        inventory: Math.round((parameters.inventory.rawMaterials + parameters.inventory.workInProcess + parameters.inventory.finishedGoods) * seasonalityFactor),
        efficiency: Math.round(parameters.production.efficiency * (0.9 + 0.2 * Math.random()))
      });
    }
    return months;
  }, [parameters, workingCapitalMetrics]);

  // Slider Component for Interactive Controls
  const InteractiveSlider = ({ label, value, min, max, step = 1, unit = '', onChange, color = 'blue', description }) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center space-x-2">
          <span className={`text-lg font-bold text-${color}-600`}>
            {typeof value === 'number' ? value.toLocaleString() : value}{unit}
          </span>
          <button 
            onClick={() => onChange(typeof value === 'number' ? min : 0)}
            className="text-gray-400 hover:text-gray-600"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-${color}`}
      />
      {description && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );

  // Parameter update handlers
  const updateParameter = useCallback((section, key, value) => {
    setParameters(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  }, []);

  // Scenario management
  const saveScenario = () => {
    const scenario = {
      name: `Scenario ${scenarios.length + 1}`,
      timestamp: new Date().toISOString(),
      parameters: JSON.parse(JSON.stringify(parameters)),
      metrics: workingCapitalMetrics
    };
    setScenarios([...scenarios, scenario]);
  };

  const loadScenario = (scenarioIndex) => {
    if (scenarios[scenarioIndex]) {
      setParameters(scenarios[scenarioIndex].parameters);
      setActiveScenario(scenarioIndex);
    }
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Add small random variations to simulate real-time changes
        setParameters(prev => ({
          ...prev,
          cashFlow: {
            ...prev.cashFlow,
            variability: Math.max(5, Math.min(25, prev.cashFlow.variability + (0 /* REAL DATA REQUIRED */ 0.5) * 2))
          }
        }));
      }, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Calculator className="w-8 h-8 mr-3 text-blue-600" />
                Enhanced Working Capital Analysis
              </h1>
              <p className="text-gray-600 mt-2">Interactive scenario modeling with advanced sliders and controls</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center px-4 py-2 rounded-lg ${autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
              >
                {autoRefresh ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
              </button>
              
              <button
                onClick={saveScenario}
                className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                <Download className="w-4 h-4 mr-2" />
                Save Scenario
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Working Capital</p>
                <p className="text-2xl font-bold text-green-600">
                  £{workingCapitalMetrics.workingCapital.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">Optimized</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cash Conversion Cycle</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(workingCapitalMetrics.cashConversionCycle)} days
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center">
              <Target className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-sm text-blue-600">Target: 35 days</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Free Cash Flow</p>
                <p className="text-2xl font-bold text-purple-600">
                  £{workingCapitalMetrics.freeCashFlow.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
            <div className="mt-2 flex items-center">
              <ArrowUpDown className="w-4 h-4 text-purple-500 mr-1" />
              <span className="text-sm text-purple-600">Monthly</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Ratio</p>
                <p className="text-2xl font-bold text-orange-600">
                  {workingCapitalMetrics.currentRatio.toFixed(2)}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-500" />
            </div>
            <div className="mt-2 flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">Healthy</span>
            </div>
          </div>
        </div>

        {/* Interactive Controls and Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Panel - Interactive Sliders */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <Sliders className="w-5 h-5 mr-2 text-blue-600" />
              Interactive Controls
            </h3>

            {/* Cash Flow Controls */}
            <div className="mb-8">
              <h4 className="font-medium text-gray-800 mb-4 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Cash Flow Management
              </h4>
              
              <InteractiveSlider
                label="Base Cash Amount"
                value={parameters.cashFlow.baseAmount}
                min={100000}
                max={2000000}
                step={10000}
                unit="£"
                onChange={(value) => updateParameter('cashFlow', 'baseAmount', value)}
                color="green"
                description="Core cash position for operations"
              />
              
              <InteractiveSlider
                label="Cash Flow Variability"
                value={parameters.cashFlow.variability}
                min={5}
                max={50}
                unit="%"
                onChange={(value) => updateParameter('cashFlow', 'variability', value)}
                color="yellow"
                description="Expected variation in monthly cash flow"
              />
              
              <InteractiveSlider
                label="Cycle Time"
                value={parameters.cashFlow.cycleTime}
                min={15}
                max={90}
                unit=" days"
                onChange={(value) => updateParameter('cashFlow', 'cycleTime', value)}
                color="blue"
                description="Cash conversion cycle duration"
              />
            </div>

            {/* Accounts Receivable Controls */}
            <div className="mb-8">
              <h4 className="font-medium text-gray-800 mb-4 flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Accounts Receivable
              </h4>
              
              <InteractiveSlider
                label="AR Amount"
                value={parameters.accountsReceivable.amount}
                min={200000}
                max={2000000}
                step={10000}
                unit="£"
                onChange={(value) => updateParameter('accountsReceivable', 'amount', value)}
                color="blue"
                description="Total accounts receivable balance"
              />
              
              <InteractiveSlider
                label="Days Sales Outstanding"
                value={parameters.accountsReceivable.dso}
                min={15}
                max={120}
                unit=" days"
                onChange={(value) => updateParameter('accountsReceivable', 'dso', value)}
                color="red"
                description="Average time to collect receivables"
              />
              
              <InteractiveSlider
                label="Collection Rate"
                value={parameters.accountsReceivable.collectionRate}
                min={70}
                max={100}
                unit="%"
                onChange={(value) => updateParameter('accountsReceivable', 'collectionRate', value)}
                color="green"
                description="Percentage of receivables collected"
              />
            </div>

            {/* Inventory Controls */}
            <div className="mb-8">
              <h4 className="font-medium text-gray-800 mb-4 flex items-center">
                <Package className="w-4 h-4 mr-2" />
                Inventory Management
              </h4>
              
              <InteractiveSlider
                label="Raw Materials"
                value={parameters.inventory.rawMaterials}
                min={50000}
                max={800000}
                step={10000}
                unit="£"
                onChange={(value) => updateParameter('inventory', 'rawMaterials', value)}
                color="orange"
                description="Raw materials inventory value"
              />
              
              <InteractiveSlider
                label="Finished Goods"
                value={parameters.inventory.finishedGoods}
                min={100000}
                max={1000000}
                step={10000}
                unit="£"
                onChange={(value) => updateParameter('inventory', 'finishedGoods', value)}
                color="purple"
                description="Finished goods inventory value"
              />
              
              <InteractiveSlider
                label="Turnover Rate"
                value={parameters.inventory.turnoverRate}
                min={2}
                max={20}
                unit="x/year"
                onChange={(value) => updateParameter('inventory', 'turnoverRate', value)}
                color="green"
                description="How many times inventory turns per year"
              />
            </div>

            {/* Production Controls */}
            <div className="mb-8">
              <h4 className="font-medium text-gray-800 mb-4 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Production Parameters
              </h4>
              
              <InteractiveSlider
                label="Capacity Utilization"
                value={parameters.production.capacity}
                min={50}
                max={100}
                unit="%"
                onChange={(value) => updateParameter('production', 'capacity', value)}
                color="blue"
                description="Current production capacity utilization"
              />
              
              <InteractiveSlider
                label="Production Efficiency"
                value={parameters.production.efficiency}
                min={60}
                max={100}
                unit="%"
                onChange={(value) => updateParameter('production', 'efficiency', value)}
                color="green"
                description="Overall production efficiency"
              />
              
              <InteractiveSlider
                label="Overtime Hours"
                value={parameters.production.overtime}
                min={0}
                max={40}
                unit="%"
                onChange={(value) => updateParameter('production', 'overtime', value)}
                color="yellow"
                description="Percentage of overtime hours"
              />
            </div>
          </div>

          {/* Right Panel - Charts and Analysis */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Working Capital Projection */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                12-Month Working Capital Projection
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`£${value.toLocaleString()}`, name]} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="workingCapital" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                    stroke="#3b82f6" 
                    name="Working Capital"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="freeCashFlow" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Free Cash Flow"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Cash Components Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <PieChartIcon className="w-5 h-5 mr-2 text-purple-600" />
                Cash Components Analysis
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthName" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`£${value.toLocaleString()}`, name]} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="receivables" 
                    stackId="1"
                    fill="#3b82f6" 
                    name="Receivables"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="inventory" 
                    stackId="1"
                    fill="#f59e0b" 
                    name="Inventory"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="payables" 
                    stackId="2"
                    fill="#ef4444" 
                    name="Payables"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Efficiency Metrics */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-orange-600" />
                Efficiency Metrics
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: 'Receivables Efficiency', value: workingCapitalMetrics.receivablesEfficiency, target: 12 },
                  { name: 'Payables Efficiency', value: workingCapitalMetrics.payablesEfficiency, target: 10 },
                  { name: 'Inventory Efficiency', value: workingCapitalMetrics.inventoryEfficiency, target: 8 },
                  { name: 'Asset Turnover', value: workingCapitalMetrics.assetTurnover, target: 2 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" name="Current" />
                  <Bar dataKey="target" fill="#10b981" name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>

        {/* Scenario Comparison */}
        {scenarios.length > 0 && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <RefreshCw className="w-5 h-5 mr-2 text-indigo-600" />
              Saved Scenarios ({scenarios.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios.map((scenario, index) => (
                <div 
                  key={index}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    index === activeScenario ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => loadScenario(index)}
                >
                  <h4 className="font-medium text-gray-900">{scenario.name}</h4>
                  <p className="text-sm text-gray-600">
                    Working Capital: £{scenario.metrics.workingCapital.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Cycle: {Math.round(scenario.metrics.cashConversionCycle)} days
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(scenario.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default EnhancedWorkingCapitalAnalysis;