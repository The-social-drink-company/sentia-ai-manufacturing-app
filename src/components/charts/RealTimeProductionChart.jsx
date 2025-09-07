import React, { useEffect, useRef } from 'react';
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
import { Line } from 'react-chartjs-2';

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

const RealTimeProductionChart = ({ data = [], height = 300 }) => {
  const chartRef = useRef();

  // Generate mock real-time data if none provided
  const mockData = data.length > 0 ? data : generateMockProductionData();

  const chartData = {
    labels: mockData.map(item => item.time),
    datasets: [
      {
        label: 'Line A Efficiency',
        data: mockData.map(item => item.lineA),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Line B Efficiency',
        data: mockData.map(item => item.lineB),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Line C Efficiency',
        data: mockData.map(item => item.lineC),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
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
        text: 'Real-Time Production Line Efficiency',
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
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
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
          text: 'Time'
        },
        grid: {
          display: false
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Efficiency (%)'
        },
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 6
      }
    }
  };

  // Simulate real-time updates
  useEffect(() => {
    if (!data.length) {
      const interval = setInterval(() => {
        const chart = chartRef.current;
        if (chart) {
          const newDataPoint = {
            time: new Date().toLocaleTimeString('en-US', { 
              hour12: false, 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            lineA: 85 + Math.random() * 15,
            lineB: 80 + Math.random() * 20,
            lineC: 75 + Math.random() * 25
          };

          chart.data.labels.push(newDataPoint.time);
          chart.data.datasets[0].data.push(newDataPoint.lineA);
          chart.data.datasets[1].data.push(newDataPoint.lineB);
          chart.data.datasets[2].data.push(newDataPoint.lineC);

          // Keep only last 20 data points
          if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets.forEach(dataset => {
              dataset.data.shift();
            });
          }

          chart.update('none');
        }
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [data.length]);

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
};

function generateMockProductionData() {
  const data = [];
  const now = new Date();
  
  for (let i = 19; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5 * 60 * 1000);
    data.push({
      time: time.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      lineA: 85 + Math.random() * 15,
      lineB: 80 + Math.random() * 20,
      lineC: 75 + Math.random() * 25
    });
  }
  
  return data;
}

export default RealTimeProductionChart;