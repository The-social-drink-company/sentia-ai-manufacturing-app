import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default function ARAgingChart({ data }) {
  if (!data) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-gray-500">No receivables data available</p>
      </div>
    )
  }

  const chartData = {
    labels: ['Current', '1-30 days', '31-60 days', '61-90 days', '90+ days'],
    datasets: [
      {
        label: 'Amount Outstanding',
        data: [
          data.current,
          data['1-30'],
          data['31-60'],
          data['61-90'],
          data['90+']
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // green for current
          'rgba(59, 130, 246, 0.8)',  // blue for 1-30
          'rgba(251, 191, 36, 0.8)',  // yellow for 31-60
          'rgba(251, 146, 60, 0.8)',  // orange for 61-90
          'rgba(239, 68, 68, 0.8)'    // red for 90+
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(251, 191, 36)',
          'rgb(251, 146, 60)',
          'rgb(239, 68, 68)'
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
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y
            return `$${value.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${(value / 1000).toFixed(0)}k`
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <p className="text-sm text-gray-500">Total Outstanding</p>
          <p className="text-xl font-semibold">
            ${data.total?.toLocaleString() || '0'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Over 60 Days</p>
          <p className="text-xl font-semibold text-orange-600">
            ${((data['61-90'] || 0) + (data['90+'] || 0)).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Top Customers */}
      {data.topCustomers && data.topCustomers.length > 0 && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold mb-2">Top Outstanding Customers</h4>
          <div className="space-y-2">
            {data.topCustomers.slice(0, 3).map((customer, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{customer.name}</span>
                <div className="text-right">
                  <span className="font-medium">${customer.amount.toLocaleString()}</span>
                  <span className="text-gray-500 ml-2">({customer.daysOutstanding} days)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}