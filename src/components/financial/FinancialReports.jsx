import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyPoundIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  PrinterIcon,
  ShareIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

const FinancialReports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('current-month')
  const [selectedReport, setSelectedReport] = useState('profit-loss')
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Mock financial data
  const mockData = {
    'profit-loss': {
      revenue: 2450000,
      cogs: 1470000,
      grossProfit: 980000,
      operatingExpenses: 650000,
      netIncome: 330000,
      previousPeriod: {
        revenue: 2280000,
        netIncome: 290000
      }
    },
    'balance-sheet': {
      assets: {
        current: 1850000,
        fixed: 3200000,
        total: 5050000
      },
      liabilities: {
        current: 890000,
        longTerm: 1200000,
        total: 2090000
      },
      equity: 2960000
    },
    'cash-flow': {
      operating: 420000,
      investing: -180000,
      financing: -95000,
      netChange: 145000,
      endingBalance: 680000
    }
  }

  const reports = [
    { id: 'profit-loss', name: 'Profit & Loss', icon: ChartBarIcon, description: 'Income statement and profitability' },
    { id: 'balance-sheet', name: 'Balance Sheet', icon: DocumentTextIcon, description: 'Assets, liabilities, and equity' },
    { id: 'cash-flow', name: 'Cash Flow', icon: CurrencyPoundIcon, description: 'Cash movements and liquidity' },
    { id: 'working-capital', name: 'Working Capital', icon: ArrowTrendingUpIcon, description: 'Current assets vs liabilities' }
  ]

  const periods = [
    { id: 'current-month', name: 'Current Month', value: 'August 2025' },
    { id: 'last-month', name: 'Last Month', value: 'July 2025' },
    { id: 'current-quarter', name: 'Current Quarter', value: 'Q3 2025' },
    { id: 'current-year', name: 'Current Year', value: '2025' },
    { id: 'last-year', name: 'Last Year', value: '2024' }
  ]

  useEffect(() => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setReportData(mockData[selectedReport])
      setLoading(false)
    }, 800)
  }, [selectedReport])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const calculateChange = (current, previous) => {
    if (!previous) return 0
    return ((current - previous) / previous * 100).toFixed(1)
  }

  const renderProfitLoss = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.revenue)}</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">
                  +{calculateChange(reportData.revenue, reportData.previousPeriod.revenue)}%
                </span>
              </div>
            </div>
            <ChartBarIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gross Profit</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.grossProfit)}</p>
              <p className="text-sm text-gray-500 mt-2">
                {((reportData.grossProfit / reportData.revenue) * 100).toFixed(1)}% margin
              </p>
            </div>
            <CurrencyPoundIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Income</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.netIncome)}</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">
                  +{calculateChange(reportData.netIncome, reportData.previousPeriod.netIncome)}%
                </span>
              </div>
            </div>
            <ArrowTrendingUpIcon className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Profit Margin</p>
              <p className="text-2xl font-bold text-gray-900">
                {((reportData.netIncome / reportData.revenue) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500 mt-2">Net profit margin</p>
            </div>
            <DocumentTextIcon className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Detailed P&L Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Profit & Loss</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr className="bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Revenue</td>
                <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                  {formatCurrency(reportData.revenue)}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-600 pl-10">Cost of Goods Sold</td>
                <td className="px-6 py-4 text-sm text-right text-gray-600">
                  ({formatCurrency(reportData.cogs)})
                </td>
              </tr>
              <tr className="bg-blue-50">
                <td className="px-6 py-4 text-sm font-medium text-blue-900">Gross Profit</td>
                <td className="px-6 py-4 text-sm text-right font-medium text-blue-900">
                  {formatCurrency(reportData.grossProfit)}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-600 pl-10">Operating Expenses</td>
                <td className="px-6 py-4 text-sm text-right text-gray-600">
                  ({formatCurrency(reportData.operatingExpenses)})
                </td>
              </tr>
              <tr className="bg-green-50">
                <td className="px-6 py-4 text-sm font-bold text-green-900">Net Income</td>
                <td className="px-6 py-4 text-sm text-right font-bold text-green-900">
                  {formatCurrency(reportData.netIncome)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-2">Comprehensive financial analysis and reporting</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <ShareIcon className="w-4 h-4 mr-2" />
            Export
          </button>
          <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <PrinterIcon className="w-4 h-4 mr-2" />
            Print
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {reports.map(report => (
                <option key={report.id} value={report.id}>{report.name}</option>
              ))}
            </select>
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {periods.map(period => (
                <option key={period.id} value={period.id}>{period.name}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
            <div className="flex space-x-2">
              <button className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filter
              </button>
              <button className="flex-1 flex items-center justify-center px-4 py-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                <CalendarDaysIcon className="w-4 h-4 mr-2" />
                Compare
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <motion.div
        key={selectedReport}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading financial report...</p>
          </div>
        ) : (
          <>
            {selectedReport === 'profit-loss' && reportData && renderProfitLoss()}
            {selectedReport === 'balance-sheet' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Balance Sheet</h3>
                <p className="text-gray-600">Balance sheet report will be displayed here.</p>
              </div>
            )}
            {selectedReport === 'cash-flow' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Cash Flow Statement</h3>
                <p className="text-gray-600">Cash flow report will be displayed here.</p>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}

export default FinancialReports