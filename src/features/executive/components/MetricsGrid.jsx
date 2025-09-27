import KPICard from './KPICard'

export default function MetricsGrid({ metrics, period }) {
  if (!metrics) return null

  return (
    <div className="space-y-6">
      {/* Working Capital Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Working Capital Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Days Sales Outstanding (DSO)"
            value={metrics.dso}
            format="days"
            target={45}
            trend={metrics.dso > 45 ? 'down' : 'up'}
            description="Average collection period"
          />
          <KPICard
            title="Days Inventory Outstanding (DIO)"
            value={metrics.dio}
            format="days"
            target={30}
            trend={metrics.dio > 30 ? 'down' : 'up'}
            description="Inventory holding period"
          />
          <KPICard
            title="Days Payable Outstanding (DPO)"
            value={metrics.dpo}
            format="days"
            target={45}
            trend={metrics.dpo < 45 ? 'down' : 'up'}
            description="Average payment period"
          />
        </div>
      </div>

      {/* Financial Performance */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Financial Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard
            title="Revenue"
            value={metrics.revenue}
            format="currency"
            trend="up"
            description={`${period} revenue`}
          />
          <KPICard
            title="Gross Margin"
            value={metrics.grossMargin}
            format="percentage"
            target={0.40}
            trend={metrics.grossMargin > 0.40 ? 'up' : 'down'}
          />
          <KPICard
            title="EBITDA"
            value={metrics.ebitda}
            format="currency"
            trend="up"
            description="Earnings before interest, taxes, depreciation"
          />
          <KPICard
            title="Net Profit"
            value={metrics.netProfit}
            format="currency"
            trend="up"
            description={`${period} net profit`}
          />
        </div>
      </div>

      {/* Cash Flow Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Cash Flow Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Operating Cash Flow"
            value={metrics.operatingCashFlow}
            format="currency"
            trend="up"
            description="Cash from operations"
          />
          <KPICard
            title="Free Cash Flow"
            value={metrics.freeCashFlow}
            format="currency"
            trend="up"
            description="After capital expenditures"
          />
          <KPICard
            title="Cash Balance"
            value={metrics.cashBalance}
            format="currency"
            description="Current cash position"
          />
        </div>
      </div>

      {/* Operational Efficiency */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Operational Efficiency
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard
            title="OEE"
            value={metrics.oee}
            format="percentage"
            target={0.85}
            trend={metrics.oee > 0.80 ? 'up' : 'down'}
            description="Overall Equipment Effectiveness"
          />
          <KPICard
            title="Inventory Turnover"
            value={metrics.inventoryTurnover}
            format="ratio"
            target={10}
            trend={metrics.inventoryTurnover > 8 ? 'up' : 'down'}
            description="Times per year"
          />
          <KPICard
            title="On-Time Delivery"
            value={metrics.onTimeDelivery}
            format="percentage"
            target={0.95}
            trend={metrics.onTimeDelivery > 0.92 ? 'up' : 'down'}
          />
          <KPICard
            title="Customer Satisfaction"
            value={metrics.customerSatisfaction}
            format="percentage"
            target={0.90}
            trend={metrics.customerSatisfaction > 0.88 ? 'up' : 'down'}
          />
        </div>
      </div>
    </div>
  )
}