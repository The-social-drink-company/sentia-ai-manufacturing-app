import React, { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  Treemap,
} from 'recharts'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  Brain,
  Target,
  Settings,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Play,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Save,
  RotateCcw,
  Sliders,
  Zap,
  Calendar,
  Filter,
  Search,
  Eye,
  EyeOff,
} from 'lucide-react'

const WorkingCapitalComprehensive = () => {
  const [scenarios, setScenarios] = useState({
    receivablesDays: 45,
    payablesDays: 30,
    inventoryDays: 60,
    salesGrowth: 15,
    marginImprovement: 2,
    seasonalityFactor: 1.0,
    creditTerms: 30,
    supplierTerms: 45,
    inventoryTurnover: 6.1,
    cashConversionCycle: 75,
  })

  const [analysisData, setAnalysisData] = useState(null)
  const [activeView, setActiveView] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    loadWorkingCapitalData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (analysisData) {
      calculateScenarioImpact()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarios, analysisData])

  const loadWorkingCapitalData = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      const data = {
        current: {
          cash: 285000,
          receivables: 420000,
          inventory: 680000,
          payables: 315000,
          workingCapital: 1070000,
          cashConversionCycle: 75,
          currentRatio: 2.1,
          quickRatio: 1.4,
        },
        historical: generateHistoricalData(),
        benchmarks: generateBenchmarkData(),
        cashFlow: generateCashFlowData(),
        components: generateComponentAnalysis(),
        forecasts: generateForecastData(),
        risks: generateRiskAnalysis(),
      }

      setAnalysisData(data)
    } catch (error) {
      console.error('Failed to load working capital data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateScenarioImpact = async () => {
    setCalculating(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 300))

      const current = analysisData.current
      const dailySales = 3170000 / 365 // Annual revenue / 365

      // Calculate new working capital components
      const newReceivables = dailySales * scenarios.receivablesDays
      const newInventory = dailySales * scenarios.inventoryDays * 0.7 // Cost of goods
      const newPayables = dailySales * scenarios.payablesDays * 0.7

      const newWorkingCapital = newReceivables + newInventory - newPayables
      const workingCapitalChange = newWorkingCapital - current.workingCapital

      const newCashConversionCycle =
        scenarios.receivablesDays + scenarios.inventoryDays - scenarios.payablesDays

      setAnalysisData(prev => ({
        ...prev,
        scenario: {
          receivables: newReceivables,
          inventory: newInventory,
          payables: newPayables,
          workingCapital: newWorkingCapital,
          workingCapitalChange: workingCapitalChange,
          cashConversionCycle: newCashConversionCycle,
          cashImpact: -workingCapitalChange, // Negative WC change = positive cash impact
          roi: (workingCapitalChange / current.workingCapital) * 100,
        },
      }))
    } catch (error) {
      console.error('Failed to calculate scenario impact:', error)
    } finally {
      setCalculating(false)
    }
  }

  const generateHistoricalData = () => {
    const months = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)

      const baseWC = 1000000
      const seasonal = Math.sin((date.getMonth() / 12) * 2 * Math.PI) * 100000
      const trend = i * 5000
      const noise = (Math.random() - 0.5) * 50000

      months.push({
        month: date.toLocaleString('default', { month: 'short' }),
        workingCapital: baseWC + seasonal + trend + noise,
        receivables: 400000 + seasonal * 0.4 + noise * 0.3,
        inventory: 650000 + seasonal * 0.6 + noise * 0.4,
        payables: 300000 + seasonal * 0.2 + noise * 0.2,
        cashConversionCycle: 70 + seasonal / 10000 + noise / 20000,
        currentRatio: 2.0 + seasonal / 500000 + noise / 1000000,
      })
    }
    return months
  }

  const generateBenchmarkData = () => [
    { metric: 'Working Capital Ratio', current: 2.1, industry: 1.8, best: 2.5 },
    { metric: 'Cash Conversion Cycle', current: 75, industry: 85, best: 60 },
    { metric: 'Receivables Days', current: 45, industry: 50, best: 35 },
    { metric: 'Inventory Days', current: 60, industry: 70, best: 45 },
    { metric: 'Payables Days', current: 30, industry: 35, best: 45 },
  ]

  const generateCashFlowData = () => {
    const data = []
    for (let i = 0; i < 12; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() + i)

      data.push({
        month: date.toLocaleString('default', { month: 'short' }),
        operatingCashFlow: 180000 + (Math.random() - 0.5) * 40000,
        freeCashFlow: 120000 + (Math.random() - 0.5) * 30000,
        workingCapitalChange: (Math.random() - 0.5) * 50000,
        capex: -45000 + (Math.random() - 0.5) * 20000,
      })
    }
    return data
  }

  const generateComponentAnalysis = () => [
    {
      component: 'Accounts Receivable',
      current: 420000,
      optimal: 350000,
      opportunity: 70000,
      days: 45,
      optimalDays: 35,
      trend: 'stable',
    },
    {
      component: 'Inventory',
      current: 680000,
      optimal: 580000,
      opportunity: 100000,
      days: 60,
      optimalDays: 45,
      trend: 'increasing',
    },
    {
      component: 'Accounts Payable',
      current: 315000,
      optimal: 420000,
      opportunity: -105000,
      days: 30,
      optimalDays: 40,
      trend: 'stable',
    },
  ]

  const generateForecastData = () => {
    const data = []
    for (let i = 0; i < 6; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() + i)

      data.push({
        month: date.toLocaleString('default', { month: 'short' }),
        baseline: 1070000 + i * 15000,
        optimistic: 1070000 + i * 25000,
        pessimistic: 1070000 + i * 5000,
        target: 1000000,
      })
    }
    return data
  }

  const generateRiskAnalysis = () => [
    {
      risk: 'Customer Concentration',
      level: 'Medium',
      impact: 'High',
      probability: 'Low',
      mitigation: 'Diversify customer base',
    },
    {
      risk: 'Seasonal Demand',
      level: 'High',
      impact: 'Medium',
      probability: 'High',
      mitigation: 'Build inventory buffer',
    },
    {
      risk: 'Supplier Delays',
      level: 'Medium',
      impact: 'Medium',
      probability: 'Medium',
      mitigation: 'Multiple supplier strategy',
    },
  ]

  const formatCurrency = value => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = value => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const resetScenarios = () => {
    setScenarios({
      receivablesDays: 45,
      payablesDays: 30,
      inventoryDays: 60,
      salesGrowth: 15,
      marginImprovement: 2,
      seasonalityFactor: 1.0,
      creditTerms: 30,
      supplierTerms: 45,
      inventoryTurnover: 6.1,
      cashConversionCycle: 75,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Working Capital Intelligence...</p>
        </div>
      </div>
    )
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Working Capital Intelligence</h1>
            <p className="text-gray-600">Advanced cash flow optimization and scenario analysis</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
            </button>
            <button
              onClick={resetScenarios}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'scenarios', label: 'Scenario Analysis', icon: Sliders },
              { id: 'forecasting', label: 'Cash Flow Forecast', icon: TrendingUp },
              { id: 'optimization', label: 'Optimization', icon: Target },
              { id: 'benchmarks', label: 'Benchmarks', icon: Activity },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Working Capital</p>
              <p className="text-3xl font-bold text-blue-900">
                {formatCurrency(analysisData?.current?.workingCapital || 0)}
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+15.5%</span>
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Cash Conversion Cycle</p>
              <p className="text-3xl font-bold text-green-900">
                {analysisData?.current?.cashConversionCycle || 75} days
              </p>
              <div className="flex items-center mt-2">
                <Target className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">Target: 60 days</span>
              </div>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Current Ratio</p>
              <p className="text-3xl font-bold text-orange-900">
                {analysisData?.current?.currentRatio || 2.1}
              </p>
              <div className="flex items-center mt-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">Healthy</span>
              </div>
            </div>
            <Activity className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">
                {analysisData?.scenario ? 'Scenario Impact' : 'Free Cash Flow'}
              </p>
              <p className="text-3xl font-bold text-purple-900">
                {analysisData?.scenario
                  ? formatCurrency(analysisData.scenario.cashImpact)
                  : formatCurrency(120000)}
              </p>
              <div className="flex items-center mt-2">
                {analysisData?.scenario?.cashImpact > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm ml-1 ${
                    analysisData?.scenario?.cashImpact > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {analysisData?.scenario
                    ? analysisData.scenario.cashImpact > 0
                      ? 'Cash Positive'
                      : 'Cash Negative'
                    : 'Monthly'}
                </span>
              </div>
            </div>
            <Calculator className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Main Content Based on Active View */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Working Capital Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={analysisData?.historical || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={value => formatCurrency(value)} />
                <Tooltip formatter={value => formatCurrency(value)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="workingCapital"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  name="Working Capital"
                />
                <Line
                  type="monotone"
                  dataKey="receivables"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Receivables"
                />
                <Line
                  type="monotone"
                  dataKey="inventory"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="Inventory"
                />
                <Line
                  type="monotone"
                  dataKey="payables"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Payables"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Component Analysis</h3>
            <div className="space-y-4">
              {(analysisData?.components || []).map(component => (
                <div key={component.component} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{component.component}</h4>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        component.trend === 'increasing'
                          ? 'bg-red-100 text-red-800'
                          : component.trend === 'decreasing'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {component.trend}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Current</p>
                      <p className="font-semibold">{formatCurrency(component.current)}</p>
                      <p className="text-xs text-gray-500">{component.days} days</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Optimal</p>
                      <p className="font-semibold">{formatCurrency(component.optimal)}</p>
                      <p className="text-xs text-gray-500">{component.optimalDays} days</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-600">Opportunity</p>
                    <p
                      className={`font-semibold ${
                        component.opportunity > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(Math.abs(component.opportunity))}
                      {component.opportunity > 0 ? ' savings' : ' investment'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'scenarios' && (
        <div className="space-y-6">
          {/* Scenario Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Interactive Scenario Analysis</h3>
              <div className="flex items-center space-x-2">
                {calculating && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Calculating...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Working Capital Components */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">
                  Working Capital Components
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receivables Days: {scenarios.receivablesDays}
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="90"
                    value={scenarios.receivablesDays}
                    onChange={e =>
                      setScenarios(prev => ({ ...prev, receivablesDays: parseInt(e.target.value) }))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>20</span>
                    <span>90</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inventory Days: {scenarios.inventoryDays}
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="120"
                    value={scenarios.inventoryDays}
                    onChange={e =>
                      setScenarios(prev => ({ ...prev, inventoryDays: parseInt(e.target.value) }))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>30</span>
                    <span>120</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payables Days: {scenarios.payablesDays}
                  </label>
                  <input
                    type="range"
                    min="15"
                    max="60"
                    value={scenarios.payablesDays}
                    onChange={e =>
                      setScenarios(prev => ({ ...prev, payablesDays: parseInt(e.target.value) }))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>15</span>
                    <span>60</span>
                  </div>
                </div>
              </div>

              {/* Business Parameters */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">Business Parameters</h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sales Growth: {scenarios.salesGrowth}%
                  </label>
                  <input
                    type="range"
                    min="-10"
                    max="50"
                    value={scenarios.salesGrowth}
                    onChange={e =>
                      setScenarios(prev => ({ ...prev, salesGrowth: parseInt(e.target.value) }))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>-10%</span>
                    <span>50%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Margin Improvement: {scenarios.marginImprovement}%
                  </label>
                  <input
                    type="range"
                    min="-5"
                    max="10"
                    value={scenarios.marginImprovement}
                    onChange={e =>
                      setScenarios(prev => ({
                        ...prev,
                        marginImprovement: parseInt(e.target.value),
                      }))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>-5%</span>
                    <span>10%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seasonality Factor: {scenarios.seasonalityFactor.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={scenarios.seasonalityFactor}
                    onChange={e =>
                      setScenarios(prev => ({
                        ...prev,
                        seasonalityFactor: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.5x</span>
                    <span>2.0x</span>
                  </div>
                </div>
              </div>

              {/* Advanced Parameters */}
              {showAdvanced && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">Advanced Parameters</h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Credit Terms: {scenarios.creditTerms} days
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="90"
                      value={scenarios.creditTerms}
                      onChange={e =>
                        setScenarios(prev => ({ ...prev, creditTerms: parseInt(e.target.value) }))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier Terms: {scenarios.supplierTerms} days
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="90"
                      value={scenarios.supplierTerms}
                      onChange={e =>
                        setScenarios(prev => ({ ...prev, supplierTerms: parseInt(e.target.value) }))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inventory Turnover: {scenarios.inventoryTurnover.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="12"
                      step="0.1"
                      value={scenarios.inventoryTurnover}
                      onChange={e =>
                        setScenarios(prev => ({
                          ...prev,
                          inventoryTurnover: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scenario Results */}
          {analysisData?.scenario && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scenario Impact Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium">Working Capital Change</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(analysisData.scenario.workingCapitalChange)}
                  </p>
                  <p className="text-sm text-blue-600">
                    {formatPercent(
                      (analysisData.scenario.workingCapitalChange /
                        analysisData.current.workingCapital) *
                        100
                    )}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600 font-medium">Cash Impact</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(analysisData.scenario.cashImpact)}
                  </p>
                  <p className="text-sm text-green-600">
                    {analysisData.scenario.cashImpact > 0 ? 'Cash Positive' : 'Cash Negative'}
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-600 font-medium">New Cash Cycle</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {analysisData.scenario.cashConversionCycle} days
                  </p>
                  <p className="text-sm text-orange-600">
                    {analysisData.scenario.cashConversionCycle -
                      analysisData.current.cashConversionCycle >
                    0
                      ? '+'
                      : ''}
                    {analysisData.scenario.cashConversionCycle -
                      analysisData.current.cashConversionCycle}{' '}
                    days
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-600 font-medium">ROI Impact</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatPercent(analysisData.scenario.roi)}
                  </p>
                  <p className="text-sm text-purple-600">
                    {analysisData.scenario.roi > 0 ? 'Positive' : 'Negative'} Return
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'forecasting' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Forecast</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={analysisData?.cashFlow || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={value => formatCurrency(value)} />
              <Tooltip formatter={value => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="operatingCashFlow" fill="#3B82F6" name="Operating Cash Flow" />
              <Bar dataKey="capex" fill="#EF4444" name="Capital Expenditure" />
              <Line
                type="monotone"
                dataKey="freeCashFlow"
                stroke="#10B981"
                strokeWidth={3}
                name="Free Cash Flow"
              />
              <Area
                type="monotone"
                dataKey="workingCapitalChange"
                stroke="#F59E0B"
                fill="#F59E0B"
                fillOpacity={0.3}
                name="Working Capital Change"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeView === 'optimization' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Opportunities</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analysisData?.components || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="component" />
              <YAxis tickFormatter={value => formatCurrency(value)} />
              <Tooltip formatter={value => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="current" fill="#94A3B8" name="Current" />
              <Bar dataKey="optimal" fill="#3B82F6" name="Optimal" />
              <Bar dataKey="opportunity" fill="#10B981" name="Opportunity" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeView === 'benchmarks' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry Benchmarks</h3>
          <div className="space-y-4">
            {(analysisData?.benchmarks || []).map((benchmark, index) => (
              <div
                key={benchmark.metric}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium text-gray-900">{benchmark.metric}</span>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">Current</p>
                    <p className="font-semibold text-gray-900">{benchmark.current}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Industry</p>
                    <p className="font-semibold text-gray-900">{benchmark.industry}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Best in Class</p>
                    <p className="font-semibold text-green-600">{benchmark.best}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkingCapitalComprehensive
