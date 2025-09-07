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
  // Generate mock data if none provided
  const mockData = data.length > 0 ? data : generateMockQualityData();

  const chartData = {
    labels: mockData.map(item => item.period),
    datasets: [
      {
        label: 'Pass Rate (%)',
        data: mockData.map(item => item.passRate),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: 'Tests Conducted',
        data: mockData.map(item => item.testsCount),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
      {
        label: 'Failed Tests',
        data: mockData.map(item => item.failedTests),
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

function generateMockQualityData() {
  const periods = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
  
  return periods.map(period => ({
    period,
    passRate: 95 + Math.random() * 5,
    testsCount: Math.floor(80 + Math.random() * 40),
    failedTests: Math.floor(Math.random() * 8)
  }));
}

export default QualityTrendsChart;