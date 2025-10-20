import SalesPerformanceChart from './SalesPerformanceChart'
import MarketDistributionChart from './MarketDistributionChart'
import StockLevelsChartEnhanced from './StockLevelsChartEnhanced'
import PLAnalysisChartEnhanced from './PLAnalysisChartEnhanced'

/**
 * FinancialAnalysisSection - Comprehensive financial visualization section
 * Groups all enhanced charts in a responsive grid layout
 * Displays Sales, Market Distribution, Stock Levels, and P&L Analysis
 */
const FinancialAnalysisSection = () => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <span className="text-3xl" role="img" aria-label="Charts">
            📊
          </span>
          Comprehensive Financial Analysis
        </h2>
        <p className="text-gray-600 mt-2 leading-relaxed">
          Integrated Sales, Stock, and P&L visualizations with real tenant Spirits data
        </p>
      </div>

      {/* Charts Grid - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Performance - Top Left */}
        <SalesPerformanceChart />

        {/* Market Distribution - Top Right */}
        <MarketDistributionChart />

        {/* Stock Levels - Bottom Left */}
        <StockLevelsChartEnhanced />

        {/* P&L Analysis - Bottom Right */}
        <PLAnalysisChartEnhanced />
      </div>

      {/* Footer Note */}
      <div className="text-center text-sm text-gray-500 mt-4">
        <p>
          Data refreshes in real-time • Last updated:{' '}
          {new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  )
}

export default FinancialAnalysisSection
