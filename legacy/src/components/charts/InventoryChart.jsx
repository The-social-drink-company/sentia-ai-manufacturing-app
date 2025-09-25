import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';

const InventoryChart = ({ data }) => {
  // Generate sample data if not provided
  const chartData = data?.inventory || [
    { category: 'Raw Materials', current: 450, optimal: 500, min: 200 },
    { category: 'WIP', current: 280, optimal: 250, min: 150 },
    { category: 'Finished Goods', current: 620, optimal: 600, min: 400 },
    { category: 'Spare Parts', current: 150, optimal: 180, min: 100 },
    { category: 'Packaging', current: 320, optimal: 350, min: 200 },
  ];

  const getBarColor = (current, optimal, min) => {
    const ratio = current / optimal;
    if (current < min) return '#EF4444'; // Red - below minimum
    if (ratio > 1.2) return '#F59E0B'; // Orange - overstocked
    if (ratio > 0.8 && ratio <= 1.2) return '#10B981'; // Green - optimal
    return '#F59E0B'; // Orange - suboptimal
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Current: {data.current} units
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            Optimal: {data.optimal} units
          </p>
          <p className="text-xs text-red-600 dark:text-red-400">
            Minimum: {data.min} units
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Status: {
              data.current < data.min ? 'Below Minimum' :
              data.current / data.optimal > 1.2 ? 'Overstocked' :
              data.current / data.optimal > 0.8 ? 'Optimal' : 'Low Stock'
            }
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full"
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
          <XAxis
            dataKey="category"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={70}
          />
          <YAxis
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            label={{ value: 'Units', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontSize: '12px',
              color: '#9CA3AF'
            }}
          />
          <Bar
            dataKey="current"
            name="Current Stock"
            animationDuration={1000}
            animationBegin={0}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry.current, entry.optimal, entry.min)}
              />
            ))}
          </Bar>
          <Bar
            dataKey="optimal"
            name="Optimal Level"
            fill="#6B7280"
            fillOpacity={0.3}
            animationDuration={1000}
            animationBegin={200}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Inventory Metrics */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Value</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            $2.4M
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Turnover Rate</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            12.5x
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Days on Hand</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            28
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default InventoryChart;
