import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';

const ProductionFlowChart = ({ data }) => {
  // Generate sample data if not provided
  const chartData = data?.hourlyProduction || Array.from({ length: 24 }, (_, i) => ({
    time: `${String(i).padStart(2, '0')}:00`,
    units: Math.floor(Math.random() * 50) + 100 + Math.sin(i / 3) * 20,
    target: 130,
    efficiency: Math.floor(Math.random() * 10) + 85,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry, _index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name === 'Efficiency' ? '%' : ' units'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full"
    >
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#374151"
            opacity={0.2}
          />
          <XAxis
            dataKey="time"
            stroke="#9CA3AF"
            fontSize={12}
            tick={{ fill: '#9CA3AF' }}
          />
          <YAxis
            stroke="#9CA3AF"
            fontSize={12}
            tick={{ fill: '#9CA3AF' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontSize: '12px',
              color: '#9CA3AF'
            }}
          />
          <Area
            type="monotone"
            dataKey="units"
            name="Production"
            stroke="#3B82F6"
            fillOpacity={1}
            fill="url(#colorProduction)"
            strokeWidth={2}
            animationDuration={1000}
            animationBegin={0}
          />
          <Area
            type="monotone"
            dataKey="target"
            name="Target"
            stroke="#EF4444"
            fillOpacity={0.3}
            fill="url(#colorTarget)"
            strokeWidth={1}
            strokeDasharray="5 5"
            animationDuration={1000}
            animationBegin={200}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Additional metrics */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg Output</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {chartData.length > 0 ? Math.round(chartData.reduce((acc, d) => acc + d.units, 0) / chartData.length) : 'N/A'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Peak Hour</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {chartData.length > 0 ? chartData.reduce((max, d) => d.units > max.units ? d : max, chartData[0]).time : 'N/A'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Efficiency</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {chartData.length > 0 ? Math.round(chartData.reduce((acc, d) => acc + d.efficiency, 0) / chartData.length) : 'N/A'}%
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductionFlowChart;