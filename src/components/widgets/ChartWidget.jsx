import { useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2'
import { ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const ChartWidget = ({
  title,
  type = 'line', // 'line', 'bar', 'doughnut', 'pie'
  data,
  options = {},
  height = 300,
  loading = false,
  className = '',
  fullscreenable = true
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Default chart options
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          font: {
            size: 11
          },
          color: '#6B7280'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 12,
          weight: 'bold'
        },
        bodyFont: {
          size: 11
        }
      }
    },
    scales: type === 'line' || type === 'bar' ? {
      x: {
        grid: {
          display: false,
          borderColor: '#E5E7EB'
        },
        ticks: {
          font: {
            size: 10
          },
          color: '#6B7280'
        }
      },
      y: {
        grid: {
          color: '#F3F4F6',
          borderColor: '#E5E7EB'
        },
        ticks: {
          font: {
            size: 10
          },
          color: '#6B7280'
        }
      }
    } : undefined
  }

  const mergedOptions = {
    ...defaultOptions,
    ...options
  }

  // Sample data structure if no data provided
  const sampleData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Dataset 1',
        data: [12, 19, 3, 5, 2, 3],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: type === 'line' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.5)',
        tension: 0.3
      }
    ]
  }

  const chartData = data || sampleData

  const ChartComponent = {
    line: Line,
    bar: Bar,
    doughnut: Doughnut,
    pie: Pie
  }[type] || Line

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (loading) {
    return (
      <div className={cn(
        'bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6',
        className
      )}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200',
        isFullscreen && 'fixed inset-4 z-50 shadow-2xl',
        className
      )}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {fullscreenable && (
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <ArrowsPointingOutIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          )}
        </div>

        <div style={{ height: isFullscreen ? 'calc(100vh - 200px)' : height }}>
          <ChartComponent data={chartData} options={mergedOptions} />
        </div>
      </div>
    </div>
  )
}

export default ChartWidget