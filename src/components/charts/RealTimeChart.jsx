import React, { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Sentia branded color palette
const SENTIA_COLORS = {
  primary: '#667eea',
  secondary: '#764ba2', 
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6'
}

// Real-time line chart component
export function RealTimeLineChart({ 
  data = [], 
  title = "Real-time Data",
  color = SENTIA_COLORS.primary,
  height = 200,
  showGrid = true,
  tension = 0.4
}) {
  const chartData = useMemo(() => ({
    labels: data.map(item => item.label || new Date(item.timestamp).toLocaleTimeString()),
    datasets: [{
      label: title,
      data: data.map(item => item.value),
      borderColor: color,
      backgroundColor: `${color}20`,
      borderWidth: 2,
      tension,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: color,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2
    }]
  }), [data, title, color, tension])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => `${title}: ${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: showGrid,
          color: '#e5e7eb'
        },
        ticks: {
          color: '#6b7280',
          maxTicksLimit: 6
        }
      },
      y: {
        display: true,
        grid: {
          display: showGrid,
          color: '#e5e7eb'
        },
        ticks: {
          color: '#6b7280'
        }
      }
    },
    elements: {
      point: {
        hoverBackgroundColor: color
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }), [title, showGrid, color])

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

// Multi-channel sales bar chart
export function MultiChannelBarChart({ 
  channels = {}, 
  height = 300,
  title = "Multi-Channel Performance"
}) {
  const chartData = useMemo(() => {
    const channelNames = Object.keys(channels)
    const revenues = channelNames.map(name => channels[name]?.revenue || 0)
    const orders = channelNames.map(name => channels[name]?.orders || 0)

    return {
      labels: channelNames.map(name => name.charAt(0).toUpperCase() + name.slice(1)),
      datasets: [
        {
          label: 'Revenue (£)',
          data: revenues,
          backgroundColor: `${SENTIA_COLORS.success}80`,
          borderColor: SENTIA_COLORS.success,
          borderWidth: 1,
          yAxisID: 'revenue'
        },
        {
          label: 'Orders',
          data: orders,
          backgroundColor: `${SENTIA_COLORS.info}80`,
          borderColor: SENTIA_COLORS.info,
          borderWidth: 1,
          yAxisID: 'orders'
        }
      ]
    }
  }, [channels])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const suffix = context.datasetIndex === 0 ? ' £' : ' orders'
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}${suffix}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
            weight: '500'
          }
        }
      },
      revenue: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          color: '#e5e7eb'
        },
        ticks: {
          color: SENTIA_COLORS.success,
          callback: (value) => `£${value.toLocaleString()}`
        }
      },
      orders: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: SENTIA_COLORS.info,
          callback: (value) => `${value} orders`
        }
      }
    }
  }), [])

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}

// Production pipeline status chart
export function ProductionPipelineChart({ 
  productionStages = {},
  height = 250
}) {
  const chartData = useMemo(() => {
    const stages = ['mixing', 'bottling', 'warehousing']
    const efficiencyData = stages.map(stage => productionStages[stage]?.efficiency || 0)
    const qualityData = stages.map(stage => productionStages[stage]?.qualityScore || 0)

    return {
      labels: ['Mixing & Infusion', 'Bottling & Labeling', 'Warehousing'],
      datasets: [
        {
          label: 'Efficiency (%)',
          data: efficiencyData,
          borderColor: SENTIA_COLORS.primary,
          backgroundColor: `${SENTIA_COLORS.primary}30`,
          tension: 0.4,
          fill: true
        },
        {
          label: 'Quality Score (%)',
          data: qualityData,
          borderColor: SENTIA_COLORS.success,
          backgroundColor: `${SENTIA_COLORS.success}30`,
          tension: 0.4,
          fill: true
        }
      ]
    }
  }, [productionStages])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6b7280'
        }
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: '#e5e7eb'
        },
        ticks: {
          color: '#6b7280',
          callback: (value) => `${value}%`
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6
      }
    }
  }), [])

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

export default { RealTimeLineChart, MultiChannelBarChart, ProductionPipelineChart }