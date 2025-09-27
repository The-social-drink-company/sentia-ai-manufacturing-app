import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function InventoryTurnover({ data }) {
  if (!data) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">No inventory data available</p>
      </div>
    )
  }

  const chartData = {
    labels: data.categories?.map(c => c.name) || ['Raw Materials', 'Work in Progress', 'Finished Goods'],
    datasets: [
      {
        label: 'Inventory Value',
        data: data.categories?.map(c => c.value) || [0, 0, 0],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',  // blue
          'rgba(251, 191, 36, 0.8)',  // yellow
          'rgba(34, 197, 94, 0.8)',   // green
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(251, 191, 36)',
          'rgb(34, 197, 94)',
        ],
        borderWidth: 1
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || ''
            const value = context.parsed
            const percentage = ((value / data.totalValue) * 100).toFixed(1)
            return `${label}: $${value.toLocaleString()} (${percentage}%)`
          }
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 pb-4 border-b">
        <div>
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-xl font-semibold">${data.totalValue?.toLocaleString() || '0'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Turnover Ratio</p>
          <p className="text-xl font-semibold">{data.turnoverRatio?.toFixed(1) || '0'}x</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48">
        <Doughnut data={chartData} options={options} />
      </div>

      {/* Categories Breakdown */}
      {data.categories && data.categories.length > 0 && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold mb-2">Category Breakdown</h4>
          <div className="space-y-2">
            {data.categories.map((category, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{category.name}</span>
                <div className="text-right">
                  <span className="font-medium">${category.value.toLocaleString()}</span>
                  <span className="text-gray-500 ml-2">({category.turnover.toFixed(1)}x)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slow Moving Items Alert */}
      {data.slowMoving && data.slowMoving.length > 0 && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold mb-2 text-orange-600">Slow-Moving Items</h4>
          <div className="space-y-2">
            {data.slowMoving.slice(0, 3).map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div>
                  <span className="text-gray-800 font-medium">{item.sku}</span>
                  <span className="text-gray-500 ml-2">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-orange-600">{item.daysOnHand} days</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}