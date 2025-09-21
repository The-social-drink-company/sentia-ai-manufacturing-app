import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BanknotesIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CalculatorIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  BuildingLibraryIcon,
  CurrencyPoundIcon
} from '@heroicons/react/24/outline'

const WorkingCapitalExpert = () => {
  const [loading, setLoading] = useState(false)
  const [calculations, setCalculations] = useState(null)
  const [error, setError] = useState(null)

  // Core Input Parameters
  const [inputs, setInputs] = useState({
    // Required Core Metrics
    annualRevenue: 5000000,  // GBP
    averageDebtorDays: 45,   // DSO
    averageCreditorDays: 30,  // DPO
    currentDebtors: 616000,
    currentCreditors: 411000,
    grossMargin: 42.5,
    netMargin: 23.1,
    currentCashOnHand: 250000,
    averageBankBalance: 180000,

    // Industry & Operations
    industry: 'manufacturing',
    numberOfEmployees: 50,
    inventoryTurnsPerYear: 8,
    currentInventory: 312500,

    // Growth & Scenario Parameters
    expectedGrowthRate: 15,  // Percentage
    debtorDaysReduction: 5,  // Days to improve
    creditorDaysExtension: 5, // Days to extend

    // Operating Expenses (Monthly)
    monthlyFixedCosts: 250000,
    monthlyVariableCosts: 150000,
    seasonalityFactor: 1.0
  })

  // Industry Benchmarks (would come from AI/LLM analysis)
  const industryBenchmarks = {
    manufacturing: {
      avgDebtorDays: 48,
      avgCreditorDays: 35,
      avgInventoryTurns: 7.5,
      avgGrossMargin: 38,
      avgNetMargin: 18,
      revenuePerEmployee: 120000,
      cashConversionCycle: 55
    },
    retail: {
      avgDebtorDays: 15,
      avgCreditorDays: 40,
      avgInventoryTurns: 12,
      avgGrossMargin: 45,
      avgNetMargin: 15,
      revenuePerEmployee: 180000,
      cashConversionCycle: 25
    },
    services: {
      avgDebtorDays: 30,
      avgCreditorDays: 25,
      avgInventoryTurns: 0,
      avgGrossMargin: 60,
      avgNetMargin: 25,
      revenuePerEmployee: 250000,
      cashConversionCycle: 30
    }
  }

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }))
  }

  const calculateWorkingCapital = () => {
    setLoading(true)
    setError(null)

    try {
      const {
        annualRevenue,
        averageDebtorDays,
        averageCreditorDays,
        currentDebtors,
        currentCreditors,
        currentInventory,
        grossMargin,
        netMargin,
        currentCashOnHand,
        monthlyFixedCosts,
        monthlyVariableCosts,
        expectedGrowthRate,
        debtorDaysReduction,
        creditorDaysExtension,
        inventoryTurnsPerYear,
        numberOfEmployees
      } = inputs

      const dailyRevenue = annualRevenue / 365
      const monthlyRevenue = annualRevenue / 12
      const benchmark = industryBenchmarks[inputs.industry]

      // Core Question 1: Cash Requirements (30-180 days)
      const calculateCashRequirements = (days) => {
        const periods = days / 30
        const totalExpenses = (monthlyFixedCosts + monthlyVariableCosts) * periods
        const expectedInflows = dailyRevenue * (days - averageDebtorDays)
        const expectedOutflows = totalExpenses * (averageCreditorDays / 30)
        const netCashRequired = totalExpenses - expectedInflows + expectedOutflows
        const bufferRequired = netCashRequired * 0.15 // 15% safety buffer

        return {
          totalExpenses,
          expectedInflows,
          expectedOutflows,
          netCashRequired: Math.max(0, netCashRequired),
          recommendedCash: Math.max(0, netCashRequired + bufferRequired),
          currentSurplus: currentCashOnHand - Math.max(0, netCashRequired)
        }
      }

      // Core Question 2: Current Operations Cash Injection
      const currentWorkingCapital = currentDebtors + currentInventory + currentCashOnHand - currentCreditors
      const optimalWorkingCapital = (annualRevenue * 0.15) // 15% of revenue as optimal WC
      const cashInjectionNeeded = Math.max(0, optimalWorkingCapital - currentWorkingCapital)

      // Core Question 3: Growth Funding Requirements
      const calculateGrowthFunding = () => {
        const targetRevenue = annualRevenue * (1 + expectedGrowthRate / 100)
        const revenueIncrease = targetRevenue - annualRevenue

        // Additional working capital needed for growth
        const additionalDebtors = (revenueIncrease / 365) * averageDebtorDays
        const additionalInventory = (revenueIncrease * (1 - grossMargin / 100)) / inventoryTurnsPerYear
        const additionalCreditors = (revenueIncrease * (1 - grossMargin / 100) / 365) * averageCreditorDays
        const growthWorkingCapital = additionalDebtors + additionalInventory - additionalCreditors

        // Operating cash needed during ramp-up (3 months)
        const rampUpCosts = (monthlyFixedCosts + monthlyVariableCosts * 1.2) * 3

        return {
          targetRevenue,
          revenueIncrease,
          additionalDebtors,
          additionalInventory,
          additionalCreditors,
          growthWorkingCapital,
          rampUpCosts,
          totalGrowthFunding: growthWorkingCapital + rampUpCosts
        }
      }

      // Working Capital Optimization Levers
      const calculateOptimization = () => {
        // Debtor Days Reduction Impact
        const debtorImprovement = dailyRevenue * debtorDaysReduction

        // Creditor Days Extension Impact
        const creditorImprovement = (dailyRevenue * (1 - grossMargin / 100)) * creditorDaysExtension

        // Inventory Optimization (10% reduction)
        const inventoryReduction = currentInventory * 0.1

        // Total Cash Unlock Potential
        const totalCashUnlock = debtorImprovement + creditorImprovement + inventoryReduction

        // Timeline for improvements
        const unlock90Days = totalCashUnlock * 0.4  // 40% in 90 days
        const unlock180Days = totalCashUnlock * 0.7  // 70% in 180 days
        const unlock365Days = totalCashUnlock        // 100% in 365 days

        return {
          debtorImprovement,
          creditorImprovement,
          inventoryReduction,
          totalCashUnlock,
          unlock90Days,
          unlock180Days,
          unlock365Days,
          cashConversionCycleCurrent: averageDebtorDays + (365 / inventoryTurnsPerYear) - averageCreditorDays,
          cashConversionCycleOptimized: (averageDebtorDays - debtorDaysReduction) + (365 / inventoryTurnsPerYear * 0.9) - (averageCreditorDays + creditorDaysExtension)
        }
      }

      // Benchmark Analysis
      const benchmarkAnalysis = {
        debtorDaysVsBenchmark: averageDebtorDays - benchmark.avgDebtorDays,
        creditorDaysVsBenchmark: averageCreditorDays - benchmark.avgCreditorDays,
        marginVsBenchmark: netMargin - benchmark.avgNetMargin,
        revenuePerEmployee: annualRevenue / numberOfEmployees,
        revenuePerEmployeeVsBenchmark: (annualRevenue / numberOfEmployees) - benchmark.revenuePerEmployee,
        performanceScore: Math.round(
          ((benchmark.avgDebtorDays / averageDebtorDays) * 25) +
          ((averageCreditorDays / benchmark.avgCreditorDays) * 25) +
          ((netMargin / benchmark.avgNetMargin) * 25) +
          ((annualRevenue / numberOfEmployees / benchmark.revenuePerEmployee) * 25)
        )
      }

      // Board-Ready Talking Points
      const talkingPoints = []
      const optimization = calculateOptimization()
      const growthFunding = calculateGrowthFunding()

      if (optimization.unlock90Days > 50000) {
        talkingPoints.push({
          type: 'opportunity',
          title: 'Quick Win Cash Unlock',
          message: `Potential to unlock £${(optimization.unlock90Days / 1000).toFixed(0)}K in working capital within 90 days`,
          impact: optimization.unlock90Days
        })
      }

      if (optimization.unlock365Days > 200000) {
        talkingPoints.push({
          type: 'strategic',
          title: '12-Month Improvement Opportunity',
          message: `12-month cash flow improvement of £${(optimization.unlock365Days / 1000).toFixed(0)}K without new debt`,
          impact: optimization.unlock365Days
        })
      }

      if (benchmarkAnalysis.debtorDaysVsBenchmark > 5) {
        talkingPoints.push({
          type: 'improvement',
          title: 'Collection Process Enhancement',
          message: `Debtor days ${Math.round(benchmarkAnalysis.debtorDaysVsBenchmark)} days above industry average - opportunity to improve collections`,
          impact: dailyRevenue * benchmarkAnalysis.debtorDaysVsBenchmark
        })
      }

      if (growthFunding.totalGrowthFunding > 0) {
        talkingPoints.push({
          type: 'planning',
          title: 'Growth Funding Requirement',
          message: `£${(growthFunding.totalGrowthFunding / 1000).toFixed(0)}K funding needed to support ${expectedGrowthRate}% growth target`,
          impact: growthFunding.totalGrowthFunding
        })
      }

      // Compile all calculations
      const results = {
        cashRequirements: {
          days30: calculateCashRequirements(30),
          days60: calculateCashRequirements(60),
          days90: calculateCashRequirements(90),
          days120: calculateCashRequirements(120),
          days180: calculateCashRequirements(180)
        },
        currentOperations: {
          currentWorkingCapital,
          optimalWorkingCapital,
          cashInjectionNeeded,
          workingCapitalRatio: (currentWorkingCapital / annualRevenue * 100).toFixed(1),
          liquidityStatus: currentCashOnHand > cashInjectionNeeded ? 'healthy' : 'needs_attention'
        },
        growthFunding,
        optimization,
        benchmarkAnalysis,
        talkingPoints,
        keyMetrics: {
          currentRatio: ((currentDebtors + currentInventory + currentCashOnHand) / currentCreditors).toFixed(2),
          quickRatio: ((currentDebtors + currentCashOnHand) / currentCreditors).toFixed(2),
          workingCapitalTurnover: (annualRevenue / currentWorkingCapital).toFixed(2),
          daysWorkingCapital: (currentWorkingCapital / dailyRevenue).toFixed(0)
        }
      }

      setCalculations(results)

    } catch (err) {
      setError('Failed to calculate working capital metrics')
      console.error('Calculation error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    calculateWorkingCapital()
  }, []) // Calculate on mount

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `£${(value / 1000000).toFixed(2)}M`
    } else if (value >= 1000) {
      return `£${(value / 1000).toFixed(0)}K`
    }
    return `£${value.toFixed(0)}`
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <CalculatorIcon className="w-8 h-8 mr-3" />
              Working Capital & Cash Flow Expert
            </h1>
            <p className="mt-2 text-blue-100">
              Answer your three core cash management questions with real-time data
            </p>
          </div>
          <button
            onClick={calculateWorkingCapital}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 flex items-center"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Recalculate
          </button>
        </div>
      </div>

      {/* Input Parameters Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Input Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Annual Revenue (£)
            </label>
            <input
              type="number"
              value={inputs.annualRevenue}
              onChange={(e) => handleInputChange('annualRevenue', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Debtor Days (DSO)
            </label>
            <input
              type="number"
              value={inputs.averageDebtorDays}
              onChange={(e) => handleInputChange('averageDebtorDays', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Creditor Days (DPO)
            </label>
            <input
              type="number"
              value={inputs.averageCreditorDays}
              onChange={(e) => handleInputChange('averageCreditorDays', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Debtors (£)
            </label>
            <input
              type="number"
              value={inputs.currentDebtors}
              onChange={(e) => handleInputChange('currentDebtors', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Creditors (£)
            </label>
            <input
              type="number"
              value={inputs.currentCreditors}
              onChange={(e) => handleInputChange('currentCreditors', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Gross Margin (%)
            </label>
            <input
              type="number"
              value={inputs.grossMargin}
              onChange={(e) => handleInputChange('grossMargin', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Net Margin (%)
            </label>
            <input
              type="number"
              value={inputs.netMargin}
              onChange={(e) => handleInputChange('netMargin', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Cash (£)
            </label>
            <input
              type="number"
              value={inputs.currentCashOnHand}
              onChange={(e) => handleInputChange('currentCashOnHand', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Industry
            </label>
            <select
              value={inputs.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="manufacturing">Manufacturing</option>
              <option value="retail">Retail</option>
              <option value="services">Services</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Growth Rate (%)
            </label>
            <input
              type="number"
              value={inputs.expectedGrowthRate}
              onChange={(e) => handleInputChange('expectedGrowthRate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {calculations && (
        <>
          {/* Core Question 1: Cash Requirements */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <BanknotesIcon className="w-6 h-6 mr-2 text-blue-600" />
              Core Question 1: How much cash do I need to cover expenses?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(calculations.cashRequirements).map(([key, data]) => {
                const days = key.replace('days', '')
                const isHealthy = data.currentSurplus > 0

                return (
                  <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      {days} Days
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(data.recommendedCash)}
                    </div>
                    <div className={`text-sm mt-2 flex items-center ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                      {isHealthy ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Surplus: {formatCurrency(data.currentSurplus)}
                        </>
                      ) : (
                        <>
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                          Shortfall: {formatCurrency(Math.abs(data.currentSurplus))}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Core Question 2: Current Operations Funding */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <BuildingLibraryIcon className="w-6 h-6 mr-2 text-purple-600" />
              Core Question 2: Do I need cash injection for current operations?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Current Working Capital
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(calculations.currentOperations.currentWorkingCapital)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {calculations.currentOperations.workingCapitalRatio}% of revenue
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Optimal Working Capital
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(calculations.currentOperations.optimalWorkingCapital)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  15% of annual revenue
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Cash Injection Needed
                </div>
                <div className={`text-3xl font-bold ${calculations.currentOperations.cashInjectionNeeded > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(calculations.currentOperations.cashInjectionNeeded)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Status: {calculations.currentOperations.liquidityStatus === 'healthy' ? 'Healthy' : 'Needs Attention'}
                </div>
              </div>
            </div>
          </div>

          {/* Core Question 3: Growth Funding */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <ArrowTrendingUpIcon className="w-6 h-6 mr-2 text-green-600" />
              Core Question 3: How much funding for {inputs.expectedGrowthRate}% growth?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Target Revenue
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(calculations.growthFunding.targetRevenue)}
                </div>
                <div className="text-sm text-green-600 mt-1">
                  +{formatCurrency(calculations.growthFunding.revenueIncrease)}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Working Capital Need
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(calculations.growthFunding.growthWorkingCapital)}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Ramp-up Costs
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(calculations.growthFunding.rampUpCosts)}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Total Growth Funding
                </div>
                <div className="text-3xl font-bold text-purple-600">
                  {formatCurrency(calculations.growthFunding.totalGrowthFunding)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Investment required
                </div>
              </div>
            </div>
          </div>

          {/* Working Capital Optimization Levers */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <ScaleIcon className="w-6 h-6 mr-2 text-green-600" />
              Working Capital Optimization Levers
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Cash Unlock Timeline</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg p-3">
                    <span className="text-gray-700 dark:text-gray-300">90 Days</span>
                    <span className="font-bold text-green-600">{formatCurrency(calculations.optimization.unlock90Days)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg p-3">
                    <span className="text-gray-700 dark:text-gray-300">180 Days</span>
                    <span className="font-bold text-green-600">{formatCurrency(calculations.optimization.unlock180Days)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg p-3">
                    <span className="text-gray-700 dark:text-gray-300">365 Days</span>
                    <span className="font-bold text-green-600">{formatCurrency(calculations.optimization.unlock365Days)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Improvement Actions</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg p-3">
                    <span className="text-gray-700 dark:text-gray-300">Reduce Debtor Days</span>
                    <span className="font-bold text-blue-600">{formatCurrency(calculations.optimization.debtorImprovement)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg p-3">
                    <span className="text-gray-700 dark:text-gray-300">Extend Creditor Days</span>
                    <span className="font-bold text-blue-600">{formatCurrency(calculations.optimization.creditorImprovement)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg p-3">
                    <span className="text-gray-700 dark:text-gray-300">Optimize Inventory</span>
                    <span className="font-bold text-blue-600">{formatCurrency(calculations.optimization.inventoryReduction)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Cash Conversion Cycle</div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    Current: {Math.round(calculations.optimization.cashConversionCycleCurrent)} days
                  </div>
                </div>
                <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Optimized</div>
                  <div className="font-bold text-green-600">
                    {Math.round(calculations.optimization.cashConversionCycleOptimized)} days
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Board-Ready Talking Points */}
          {calculations.talkingPoints && calculations.talkingPoints.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <ChartBarIcon className="w-6 h-6 mr-2 text-purple-600" />
                Board-Ready Talking Points
              </h2>

              <div className="space-y-3">
                {calculations.talkingPoints.map((point, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      point.type === 'opportunity' ? 'bg-green-50 border-green-500 dark:bg-green-900' :
                      point.type === 'strategic' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900' :
                      point.type === 'improvement' ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900' :
                      'bg-purple-50 border-purple-500 dark:bg-purple-900'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {point.title}
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 mt-1">
                          {point.message}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Impact</div>
                        <div className="font-bold text-gray-900 dark:text-white">
                          {formatCurrency(point.impact)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Performance Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Key Performance Metrics</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Current Ratio</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {calculations.keyMetrics.currentRatio}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Quick Ratio</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {calculations.keyMetrics.quickRatio}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">WC Turnover</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {calculations.keyMetrics.workingCapitalTurnover}x
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Days WC</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {calculations.keyMetrics.daysWorkingCapital}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkingCapitalExpert