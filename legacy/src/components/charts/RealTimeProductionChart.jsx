import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';


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

const RealTimeProductionChart = ({ height = 300, refreshInterval = 30000 }) => {
  const chartRef = useRef();
  const [isConnected, setIsConnected] = useState(false);

  // Fetch real-time production data from API
  const { data: productionData, isLoading, error, refetch } = useQuery({
    queryKey: ['real-time-production'],
    queryFn: async () => {
      const response = await fetch('/api/production/real-time');
      if (!response.ok) {
        throw new Error(`Failed to fetch production data: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Validate data structure
      if (!data.lines || !Array.isArray(data.lines)) {
        throw new Error('Invalid production data format');
      }
      
      // Ensure timestamps are current and realistic
      const now = new Date();
      const validatedData = data.lines.map(item => {
        const timestamp = new Date(item.timestamp);
        
        // Enhanced validation for realistic business hours
        const hoursDiff = (now - timestamp) / (1000 * 60 * 60);
        const isBusinessHour = timestamp.getHours() >= 6 && timestamp.getHours() <= 22; // 6 AM to 10 PM production
        const isWeekday = timestamp.getDay() >= 1 && timestamp.getDay() <= 5; // Monday to Friday
        
        // More strict validation for production data
        if (hoursDiff > 24 || hoursDiff < 0) {
          logWarn(`Production Chart: Timestamp ${item.timestamp} outside 24-hour window (${hoursDiff.toFixed(1)}h)`);
        }
        
        if (!isBusinessHour && isWeekday) {
          logWarn(`Production Chart: Data point ${item.timestamp} outside business hours`);
        }
        
        if (!isWeekday) {
          logWarn(`Production Chart: Weekend production data ${item.timestamp} - verify if correct`);
        }
        
        return {
          ...item,
          time: timestamp.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit'
          }),
          timestamp: timestamp.toISOString(),
          isCurrentHour: hoursDiff < 1
        };
      });
      
      return {
        ...data,
        lines: validatedData,
        lastUpdated: now.toISOString()
      };
    },
    refetchInterval: refreshInterval,
    refetchIntervalInBackground: true,
    onSuccess: () => setIsConnected(true),
    onError: () => setIsConnected(false)
  });

  const chartData = {
    labels: productionData?.lines?.map(item => item.time) || [],
    datasets: [
      {
        label: 'Line A Efficiency (%)',
        data: productionData?.lines?.map(item => item.lineA || 0) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
      },
      {
        label: 'Line B Efficiency (%)',
        data: productionData?.lines?.map(item => item.lineB || 0) || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
      },
      {
        label: 'Line C Efficiency (%)',
        data: productionData?.lines?.map(item => item.lineC || 0) || [],
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
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
        backgroundColor: '#1f2937',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const line = context.dataset.label;
            const efficiency = context.parsed.y;
            const timestamp = productionData?.lines?.[context.dataIndex]?.timestamp;
            return [
              `${line}: ${efficiency.toFixed(1)}%`,
              timestamp ? `Time: ${new Date(timestamp).toLocaleString()}` : ''
            ];
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#6b7280',
          maxTicksLimit: 8,
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Time',
          color: '#374151',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      y: {
        display: true,
        beginAtZero: true,
        max: 100,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#6b7280',
          callback: (value) => `${value}%`,
          font: {
            size: 11
          }
        },
        title: {
          display: true,
          text: 'Efficiency (%)',
          color: '#374151',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
    },
  };

  if (error) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-gray-50 rounded-lg border">
        <div className="text-center text-gray-500">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm font-medium">Unable to load production data</p>
          <p className="text-xs text-gray-400 mt-1">{error.message}</p>
          <button 
            onClick={refetch}
            className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-gray-50 rounded-lg border animate-pulse">
        <div className="text-center text-gray-400">
          <div className="w-8 h-8 mx-auto mb-2 bg-gray-200 rounded-full"></div>
          <p className="text-sm">Loading real-time production data...</p>
        </div>
      </div>
    );
  }

  if (!productionData?.lines?.length) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-gray-50 rounded-lg border">
        <div className="text-center text-gray-500">
          <div className="text-gray-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm font-medium">No production data available</p>
          <p className="text-xs text-gray-400 mt-1">Real-time data will appear here when production lines are active</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }} className="bg-white rounded-lg border p-4">
      {/* Connection Status Indicator */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-xs text-gray-500">
            {isConnected ? 'Live Data' : 'Disconnected'}
          </span>
        </div>
        <div className="text-xs text-gray-400">
          Last updated: {productionData?.lastUpdated ? new Date(productionData.lastUpdated).toLocaleTimeString() : 'â€”'}
        </div>
      </div>
      
      {/* Chart */}
      <div style={{ height: height - 40 }}>
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
};

export default RealTimeProductionChart;
