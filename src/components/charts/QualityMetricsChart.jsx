import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';

const QualityMetricsChart = ({ data }) => {
  // Generate sample data if not provided
  const chartData = data?.metrics || [
    { metric: 'First Pass Yield', value: 98.5, benchmark: 95 },
    { metric: 'Defect Rate', value: 99.2, benchmark: 98 },
    { metric: 'Customer Returns', value: 99.8, benchmark: 99 },
    { metric: 'Process Capability', value: 96.3, benchmark: 94 },
    { metric: 'Inspection Pass', value: 97.8, benchmark: 96 },
    { metric: 'Supplier Quality', value: 95.4, benchmark: 93 },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{data.metric}</p>
          <p className="text-xs text-green-600 dark:text-green-400">
            Actual: {data.value}%
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Benchmark: {data.benchmark}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full"
    >
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={chartData}>
          <PolarGrid
            stroke="#374151"
            strokeWidth={0.5}
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            className="text-xs"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[90, 100]}
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
          />
          <Radar
            name="Actual"
            dataKey="value"
            stroke="#10B981"
            fill="#10B981"
            fillOpacity={0.6}
            strokeWidth={2}
            animationDuration={1000}
          />
          <Radar
            name="Benchmark"
            dataKey="benchmark"
            stroke="#6B7280"
            fill="#6B7280"
            fillOpacity={0.3}
            strokeWidth={1}
            strokeDasharray="5 5"
            animationDuration={1000}
            animationBegin={200}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              fontSize: '12px',
              color: '#9CA3AF'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Quality Score */}
      <div className="flex justify-center mt-4">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Overall Quality Score</p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-3xl font-bold text-green-600 dark:text-green-400">
              {(chartData.reduce((acc, d) => acc + d.value, 0) / chartData.length).toFixed(1)}%
            </span>
            <span className="text-sm text-green-500">+2.3%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default QualityMetricsChart;