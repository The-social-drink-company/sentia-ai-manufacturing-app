import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const QualityTrendsChart = ({ data = [], height = 300 }) => {
  // Only use REAL data - no mock data allowed
  const realData = data.length > 0 ? data : [];

  // If no real data available, show empty state
  if (realData.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="text-center text-gray-500">
          <p>No quality data available</p>
          <p className="text-sm">Connect to real-time data source</p>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: realData.map(item => item.period),
    datasets: [
      {
        label: 'Pass Rate (%)',
        data: realData.map(item => item.passRate),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: 'Tests Conducted',
        data: realData.map(item => item.testsCount),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
      {
        label: 'Failed Tests',
        data: realData.map(item => item.failedTests),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
        yAxisID: 'y1',
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Quality Control Trends',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label;
            const value = context.parsed.y;
            if (label === 'Pass Rate (%)') {
              return `${label}: ${value.toFixed(1)}%`;
            }
            return `${label}: ${value}`;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time Period'
        },
        grid: {
          display: false
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Pass Rate (%)'
        },
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Number of Tests'
        },
        grid: {
          drawOnChartArea: false,
        },
        min: 0
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

// Mock data generation function removed - only use real data

export default QualityTrendsChart;