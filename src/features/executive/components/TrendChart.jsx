import { useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TrendChart = ({ data, categories }) => {
  const chartRef = useRef(null);

  const chartData = {
    labels: data.map(d => d.month),
    datasets: categories.map(_(category, index) => {
      const colors = [
        { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.1)' },
        { border: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.1)' },
        { border: 'rgb(251, 146, 60)', bg: 'rgba(251, 146, 60, 0.1)' }
      ];

      const color = colors[index % colors.length];
      const key = category.toLowerCase().replace(/\s+/g, '');

      return {
        label: category,
        data: data.map(d => d[key] || 0),
        borderColor: color.border,
        backgroundColor: color.bg,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      };
    })
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (label.includes('%') || label.includes('Rate')) {
                label += context.parsed.y.toFixed(1) + '%';
              } else if (label.includes('$') || label.toLowerCase().includes('revenue') || label.toLowerCase().includes('cash')) {
                label += '$' + context.parsed.y.toFixed(1) + 'M';
              } else {
                label += context.parsed.y.toFixed(1);
              }
            }
            return label;
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
          font: {
            size: 12
          }
        }
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 12
          },
          callback: function(value) {
            if (this.chart.data.datasets[0].label.includes('%')) {
              return value + '%';
            } else if (this.chart.data.datasets[0].label.toLowerCase().includes('revenue') ||
                       this.chart.data.datasets[0].label.toLowerCase().includes('cash')) {
              return '$' + value + 'M';
            }
            return value;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div style={{ height: '300px' }}>
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
};

export default TrendChart;