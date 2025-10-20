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
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts'
import {
  Calculator,
  Brain,
  Target,
  Settings,
  Download,
  RefreshCw,
  Play,
  Pause,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Sliders,
  Zap,
  Calendar,
  Filter,
  Search,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  DollarSign,
  Percent,
  Users,
  Package,
  Factory,
  Truck,
  ShoppingCart,
  PieChart as PieChartIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  BookOpen,
  FileText,
  Share2,
  Copy,
  ExternalLink,
} from 'lucide-react'
import { FeatureGate } from '@/components/features'

const WhatIfAnalysisComprehensive = () => {
  const [scenarios, setScenarios] = useState({
    // Financial Parameters
    revenueGrowth: 15,
    marginImprovement: 2.5,
    costReduction: 5,
    priceIncrease: 3,

    // Operational Parameters
    productionCapacity: 100,
    efficiencyGain: 8,
    qualityImprovement: 12,
    leadTimeReduction: 20,

    // Market Parameters
    marketShare: 18,
    customerRetention: 85,
    newCustomerAcquisition: 25,
    averageOrderValue: 10,

    // Investment Parameters
    capexInvestment: 500000,
    technologyUpgrade: 200000,
    staffingIncrease: 15,
    marketingSpend: 150000,

    // Risk Parameters
    economicDownturn: 0,
    supplyChainDisruption: 0,
    competitorAction: 0,
    regulatoryChange: 0,
  })

  const [analysisResults, setAnalysisResults] = useState(null)
  // eslint-disable-next-line no-unused-vars
  const [activeScenario, setActiveScenario] = useState('base')
  const [savedScenarios, setSavedScenarios] = useState([])
  const [calculating, setCalculating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [timeHorizon, setTimeHorizon] = useState(12) // months
  const [confidenceLevel, setConfidenceLevel] = useState(80)

  useEffect(() => {
    calculateScenarioImpact()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarios, timeHorizon, confidenceLevel])

  const calculateScenarioImpact = async () => {
    setCalculating(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      const baseRevenue = 3170000
      const baseMargin = 25
      const baseCosts = baseRevenue * (1 - baseMargin / 100)

      // Calculate financial impact
      const newRevenue = baseRevenue * (1 + scenarios.revenueGrowth / 100)
      const newMargin = baseMargin + scenarios.marginImprovement
      // eslint-disable-next-line no-unused-vars
      const newCosts = baseCosts * (1 - scenarios.costReduction / 100) // TODO: Use in detailed cost breakdown
      const newGrossProfit = newRevenue * (newMargin / 100)

      // Calculate operational impact (TODO: Use in operational metrics section)
      // eslint-disable-next-line no-unused-vars
      const productionImpact = scenarios.productionCapacity / 100
      // eslint-disable-next-line no-unused-vars
      const efficiencyImpact = 1 + scenarios.efficiencyGain / 100
      // eslint-disable-next-line no-unused-vars
      const qualityImpact = 1 + scenarios.qualityImprovement / 100

      // Calculate market impact (TODO: Use in market analysis section)
      // eslint-disable-next-line no-unused-vars
      const marketImpact = scenarios.marketShare / 18 // Base market share 18%
      // eslint-disable-next-line no-unused-vars
      const customerImpact = scenarios.customerRetention / 85 // Base retention 85%

      // Calculate investment impact
      const totalInvestment =
        scenarios.capexInvestment + scenarios.technologyUpgrade + scenarios.marketingSpend
      const roi = ((newGrossProfit - (baseCosts + totalInvestment)) / totalInvestment) * 100

      // Calculate risk-adjusted results
      const riskFactor =
        1 -
        (scenarios.economicDownturn +
          scenarios.supplyChainDisruption +
          scenarios.competitorAction +
          scenarios.regulatoryChange) /
          400

      const results = {
        financial: {
          revenue: newRevenue * riskFactor,
          revenueChange: (newRevenue - baseRevenue) * riskFactor,
          grossProfit: newGrossProfit * riskFactor,
          grossProfitChange: (newGrossProfit - (baseRevenue * baseMargin) / 100) * riskFactor,
          margin: newMargin * riskFactor,
          roi: roi * riskFactor,
          paybackPeriod: totalInvestment / (newGrossProfit / 12),
          npv: calculateNPV(newGrossProfit, totalInvestment, timeHorizon),
        },
        operational: {
          productionCapacity: scenarios.productionCapacity,
          efficiency: scenarios.efficiencyGain,
          quality: scenarios.qualityImprovement,
          leadTime: scenarios.leadTimeReduction,
          overallScore:
            (scenarios.productionCapacity +
              scenarios.efficiencyGain +
              scenarios.qualityImprovement +
              scenarios.leadTimeReduction) /
            4,
        },
        market: {
          marketShare: scenarios.marketShare,
          customerRetention: scenarios.customerRetention,
          newCustomers: scenarios.newCustomerAcquisition,
          orderValue: scenarios.averageOrderValue,
          marketScore:
            (scenarios.marketShare +
              scenarios.customerRetention +
              scenarios.newCustomerAcquisition +
              scenarios.averageOrderValue) /
            4,
        },
        risks: {
          economic: scenarios.economicDownturn,
          supplyChain: scenarios.supplyChainDisruption,
          competitive: scenarios.competitorAction,
          regulatory: scenarios.regulatoryChange,
          overallRisk:
            (scenarios.economicDownturn +
              scenarios.supplyChainDisruption +
              scenarios.competitorAction +
              scenarios.regulatoryChange) /
            4,
        },
        timeline: generateTimelineData(newRevenue, newGrossProfit, totalInvestment, timeHorizon),
        sensitivity: generateSensitivityAnalysis(),
        monteCarlo: generateMonteCarloResults(),
      }

      setAnalysisResults(results)
    } catch (error) {
      console.error('Failed to calculate scenario impact:', error)
    } finally {
      setCalculating(false)
    }
  }

  const calculateNPV = (annualCashFlow, initialInvestment, periods) => {
    const discountRate = 0.1 // 10% discount rate
    let npv = -initialInvestment

    for (let i = 1; i <= periods; i++) {
      npv += annualCashFlow / 12 / Math.pow(1 + discountRate / 12, i)
    }

    return npv
  }

  const generateTimelineData = (revenue, grossProfit, investment, months) => {
    const data = []
    const monthlyRevenue = revenue / 12
    const monthlyProfit = grossProfit / 12
    const monthlyInvestment = investment / 12

    let cumulativeProfit = 0
    let cumulativeInvestment = 0

    for (let i = 0; i < months; i++) {
      cumulativeProfit += monthlyProfit
      cumulativeInvestment += monthlyInvestment

      data.push({
        month: i + 1,
        revenue: monthlyRevenue * (1 + i * 0.01), // Growth over time
        profit: monthlyProfit * (1 + i * 0.01),
        cumulativeProfit: cumulativeProfit,
        cumulativeInvestment: cumulativeInvestment,
        netPosition: cumulativeProfit - cumulativeInvestment,
        breakeven: cumulativeProfit >= cumulativeInvestment,
      })
    }

    return data
  }

  const generateSensitivityAnalysis = () => {
    const baseValue = 100
    const parameters = [
      'Revenue Growth',
      'Margin Improvement',
      'Cost Reduction',
      'Production Capacity',
      'Market Share',
      'Customer Retention',
    ]

    return parameters.map(param => ({
      parameter: param,
      low: baseValue - 20 + Math.random() * 10,
      base: baseValue,
      high: baseValue + 20 + Math.random() * 10,
      impact: (Math.random() - 0.5) * 40,
    }))
  }

  const generateMonteCarloResults = () => {
    const results = []
    for (let i = 0; i < 1000; i++) {
      const randomFactor = 0.8 + Math.random() * 0.4 // 80% to 120%
      results.push({
        scenario: i,
        revenue: 3170000 * (1 + scenarios.revenueGrowth / 100) * randomFactor,
        profit: 3170000 * 0.25 * (1 + scenarios.marginImprovement / 100) * randomFactor,
        roi: Math.random() * 50 - 10, // -10% to 40% ROI
      })
    }
    return results
  }

  const saveScenario = () => {
    const scenarioName = prompt('Enter scenario name:')
    if (scenarioName) {
      const newScenario = {
        id: Date.now(),
        name: scenarioName,
        parameters: { ...scenarios },
        results: { ...analysisResults },
        createdAt: new Date().toISOString(),
      }
      setSavedScenarios(prev => [...prev, newScenario])
    }
  }

  const loadScenario = scenario => {
    setScenarios(scenario.parameters)
    setActiveScenario(scenario.name)
  }

  const resetScenarios = () => {
    setScenarios({
      revenueGrowth: 15,
      marginImprovement: 2.5,
      costReduction: 5,
      priceIncrease: 3,
      productionCapacity: 100,
      efficiencyGain: 8,
      qualityImprovement: 12,
      leadTimeReduction: 20,
      marketShare: 18,
      customerRetention: 85,
      newCustomerAcquisition: 25,
      averageOrderValue: 10,
      capexInvestment: 500000,
      technologyUpgrade: 200000,
      staffingIncrease: 15,
      marketingSpend: 150000,
      economicDownturn: 0,
      supplyChainDisruption: 0,
      competitorAction: 0,
      regulatoryChange: 0,
    })
    setActiveScenario('base')
  }

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

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  return (
    <FeatureGate feature="whatIfAnalysis" mode="overlay">
      <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">What-If Analysis Center</h1>
            <p className="text-gray-600">Advanced scenario modeling and strategic planning</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeHorizon}
              onChange={e => setTimeHorizon(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={6}>6 Months</option>
              <option value={12}>12 Months</option>
              <option value={24}>24 Months</option>
              <option value={36}>36 Months</option>
            </select>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
            </button>
            <button
              onClick={saveScenario}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Save className="h-4 w-4" />
              <span>Save</span>
            </button>
            <button
              onClick={resetScenarios}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Interactive Scenario Parameters</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Confidence Level:</span>
              <input
                type="range"
                min="50"
                max="95"
                value={confidenceLevel}
                onChange={e => setConfidenceLevel(parseInt(e.target.value))}
                className="w-20"
              />
              <span className="text-sm font-medium text-gray-900">{confidenceLevel}%</span>
            </div>
            {calculating && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Calculating...</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Financial Parameters */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 border-b pb-2 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Financial Parameters
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Revenue Growth: {scenarios.revenueGrowth}%
              </label>
              <input
                type="range"
                min="-20"
                max="50"
                value={scenarios.revenueGrowth}
                onChange={e =>
                  setScenarios(prev => ({ ...prev, revenueGrowth: parseInt(e.target.value) }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-20%</span>
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
                max="15"
                step="0.5"
                value={scenarios.marginImprovement}
                onChange={e =>
                  setScenarios(prev => ({ ...prev, marginImprovement: parseFloat(e.target.value) }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-5%</span>
                <span>15%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost Reduction: {scenarios.costReduction}%
              </label>
              <input
                type="range"
                min="0"
                max="25"
                value={scenarios.costReduction}
                onChange={e =>
                  setScenarios(prev => ({ ...prev, costReduction: parseInt(e.target.value) }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>25%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Increase: {scenarios.priceIncrease}%
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={scenarios.priceIncrease}
                onChange={e =>
                  setScenarios(prev => ({ ...prev, priceIncrease: parseInt(e.target.value) }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>20%</span>
              </div>
            </div>
          </div>

          {/* Operational Parameters */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 border-b pb-2 flex items-center">
              <Factory className="h-4 w-4 mr-2" />
              Operational Parameters
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Production Capacity: {scenarios.productionCapacity}%
              </label>
              <input
                type="range"
                min="50"
                max="200"
                value={scenarios.productionCapacity}
                onChange={e =>
                  setScenarios(prev => ({ ...prev, productionCapacity: parseInt(e.target.value) }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>50%</span>
                <span>200%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Efficiency Gain: {scenarios.efficiencyGain}%
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={scenarios.efficiencyGain}
                onChange={e =>
                  setScenarios(prev => ({ ...prev, efficiencyGain: parseInt(e.target.value) }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>30%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality Improvement: {scenarios.qualityImprovement}%
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={scenarios.qualityImprovement}
                onChange={e =>
                  setScenarios(prev => ({ ...prev, qualityImprovement: parseInt(e.target.value) }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lead Time Reduction: {scenarios.leadTimeReduction}%
              </label>
              <input
                type="range"
                min="0"
                max="60"
                value={scenarios.leadTimeReduction}
                onChange={e =>
                  setScenarios(prev => ({ ...prev, leadTimeReduction: parseInt(e.target.value) }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>60%</span>
              </div>
            </div>
          </div>

          {/* Market Parameters */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 border-b pb-2 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Market Parameters
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Market Share: {scenarios.marketShare}%
              </label>
              <input
                type="range"
                min="5"
                max="40"
                value={scenarios.marketShare}
                onChange={e =>
                  setScenarios(prev => ({ ...prev, marketShare: parseInt(e.target.value) }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5%</span>
                <span>40%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Retention: {scenarios.customerRetention}%
              </label>
              <input
                type="range"
                min="60"
                max="98"
                value={scenarios.customerRetention}
                onChange={e =>
                  setScenarios(prev => ({ ...prev, customerRetention: parseInt(e.target.value) }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>60%</span>
                <span>98%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Customer Acquisition: {scenarios.newCustomerAcquisition}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={scenarios.newCustomerAcquisition}
                onChange={e =>
                  setScenarios(prev => ({
                    ...prev,
                    newCustomerAcquisition: parseInt(e.target.value),
                  }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average Order Value: +{scenarios.averageOrderValue}%
              </label>
              <input
                type="range"
                min="-20"
                max="50"
                value={scenarios.averageOrderValue}
                onChange={e =>
                  setScenarios(prev => ({ ...prev, averageOrderValue: parseInt(e.target.value) }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-20%</span>
                <span>50%</span>
              </div>
            </div>
          </div>

          {/* Investment Parameters */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 border-b pb-2 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Investment Parameters
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CapEx Investment: £{(scenarios.capexInvestment / 1000).toFixed(0)}K
              </label>
              <input
                type="range"
                min="0"
                max="2000000"
                step="50000"
                value={scenarios.capexInvestment}
                onChange={e =>
                  setScenarios(prev => ({ ...prev, capexInvestment: parseInt(e.target.value) }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>£0</span>
                <span>£2M</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technology Upgrade: £{(scenarios.technologyUpgrade / 1000).toFixed(0)}K
              </label>
              <input
                type="range"
                min="0"
                max="1000000"
                step="25000"
                value={scenarios.technologyUpgrade}
                onChange={e =>
                  setScenarios(prev => ({ ...prev, technologyUpgrade: parseInt(e.target.value) }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>£0</span>
                <span>£1M</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Staffing Increase: {scenarios.staffingIncrease}%
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={scenarios.staffingIncrease}
                onChange={e =>
                  setScenarios(prev => ({ ...prev, staffingIncrease: parseInt(e.target.value) }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marketing Spend: £{(scenarios.marketingSpend / 1000).toFixed(0)}K
              </label>
              <input
                type="range"
                min="0"
                max="500000"
                step="10000"
                value={scenarios.marketingSpend}
                onChange={e =>
                  setScenarios(prev => ({ ...prev, marketingSpend: parseInt(e.target.value) }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>£0</span>
                <span>£500K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Parameters (Advanced) */}
        {showAdvanced && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
              Risk Parameters
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Economic Downturn Risk: {scenarios.economicDownturn}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={scenarios.economicDownturn}
                  onChange={e =>
                    setScenarios(prev => ({ ...prev, economicDownturn: parseInt(e.target.value) }))
                  }
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supply Chain Disruption: {scenarios.supplyChainDisruption}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={scenarios.supplyChainDisruption}
                  onChange={e =>
                    setScenarios(prev => ({
                      ...prev,
                      supplyChainDisruption: parseInt(e.target.value),
                    }))
                  }
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competitor Action: {scenarios.competitorAction}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={scenarios.competitorAction}
                  onChange={e =>
                    setScenarios(prev => ({ ...prev, competitorAction: parseInt(e.target.value) }))
                  }
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Regulatory Change: {scenarios.regulatoryChange}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={scenarios.regulatoryChange}
                  onChange={e =>
                    setScenarios(prev => ({ ...prev, regulatoryChange: parseInt(e.target.value) }))
                  }
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Dashboard */}
      {analysisResults && (
        <>
          {/* Key Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Revenue Impact</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {formatCurrency(analysisResults.financial.revenueChange)}
                  </p>
                  <div className="flex items-center mt-2">
                    {analysisResults.financial.revenueChange > 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={`text-sm ml-1 ${
                        analysisResults.financial.revenueChange > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatPercent((analysisResults.financial.revenueChange / 3170000) * 100)}
                    </span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">ROI</p>
                  <p className="text-3xl font-bold text-green-900">
                    {formatPercent(analysisResults.financial.roi)}
                  </p>
                  <div className="flex items-center mt-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 ml-1">
                      {analysisResults.financial.paybackPeriod.toFixed(1)} months payback
                    </span>
                  </div>
                </div>
                <Calculator className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">NPV</p>
                  <p className="text-3xl font-bold text-orange-900">
                    {formatCurrency(analysisResults.financial.npv)}
                  </p>
                  <div className="flex items-center mt-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 ml-1">{timeHorizon} month horizon</span>
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Risk Score</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {analysisResults.risks.overallRisk.toFixed(1)}%
                  </p>
                  <div className="flex items-center mt-2">
                    <AlertTriangle
                      className={`h-4 w-4 ${
                        analysisResults.risks.overallRisk < 10
                          ? 'text-green-500'
                          : analysisResults.risks.overallRisk < 25
                            ? 'text-yellow-500'
                            : 'text-red-500'
                      }`}
                    />
                    <span
                      className={`text-sm ml-1 ${
                        analysisResults.risks.overallRisk < 10
                          ? 'text-green-600'
                          : analysisResults.risks.overallRisk < 25
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {analysisResults.risks.overallRisk < 10
                        ? 'Low Risk'
                        : analysisResults.risks.overallRisk < 25
                          ? 'Medium Risk'
                          : 'High Risk'}
                    </span>
                  </div>
                </div>
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Timeline Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Timeline Analysis ({timeHorizon} Months)
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={analysisResults.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={value => formatCurrency(value)} />
                <Tooltip formatter={value => formatCurrency(value)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cumulativeProfit"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                  name="Cumulative Profit"
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeInvestment"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.3}
                  name="Cumulative Investment"
                />
                <Line
                  type="monotone"
                  dataKey="netPosition"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  name="Net Position"
                />
                <Bar dataKey="revenue" fill="#8B5CF6" name="Monthly Revenue" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Sensitivity Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sensitivity Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analysisResults.sensitivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="parameter" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="low" fill="#EF4444" name="Low Case" />
                  <Bar dataKey="base" fill="#6B7280" name="Base Case" />
                  <Bar dataKey="high" fill="#10B981" name="High Case" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart
                  data={[
                    { risk: 'Economic', value: analysisResults.risks.economic },
                    { risk: 'Supply Chain', value: analysisResults.risks.supplyChain },
                    { risk: 'Competitive', value: analysisResults.risks.competitive },
                    { risk: 'Regulatory', value: analysisResults.risks.regulatory },
                  ]}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="risk" />
                  <PolarRadiusAxis angle={90} domain={[0, 50]} />
                  <Radar
                    name="Risk Level"
                    dataKey="value"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monte Carlo Results */}
          {showAdvanced && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Monte Carlo Simulation (1,000 scenarios)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={analysisResults.monteCarlo.slice(0, 200)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="revenue"
                    name="Revenue"
                    tickFormatter={value => formatCurrency(value)}
                  />
                  <YAxis dataKey="roi" name="ROI" tickFormatter={value => formatPercent(value)} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'Revenue' ? formatCurrency(value) : formatPercent(value),
                      name,
                    ]}
                  />
                  <Scatter
                    name="Scenarios"
                    data={analysisResults.monteCarlo.slice(0, 200)}
                    fill="#3B82F6"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* Saved Scenarios */}
      {savedScenarios.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Scenarios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedScenarios.map(scenario => (
              <div
                key={scenario.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{scenario.name}</h4>
                  <button
                    onClick={() => loadScenario(scenario)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Load
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Created: {new Date(scenario.createdAt).toLocaleDateString()}
                </p>
                <div className="mt-2 text-sm">
                  <p className="text-gray-600">
                    Revenue Impact: {formatCurrency(scenario.results.financial.revenueChange)}
                  </p>
                  <p className="text-gray-600">
                    ROI: {formatPercent(scenario.results.financial.roi)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </FeatureGate>
  )
}

export default WhatIfAnalysisComprehensive
