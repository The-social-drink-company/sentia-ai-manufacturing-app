import React from 'react';
import { motion } from 'framer-motion';
import { Line } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const KPICard = ({ title, value, trend, sparklineData, color = 'blue', icon }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };

  const bgColorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
    orange: 'bg-orange-50 dark:bg-orange-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
  };

  const textColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-red-600 dark:text-red-400',
  };

  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className="w-4 h-4" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend > 0) return 'text-green-500';
    if (trend < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  // Generate sparkline data if not provided
  const generateSparkline = () => {
    if (sparklineData && sparklineData.length > 0) return sparklineData;

    // Generate dummy data for demonstration
    return [] => ({
      value: 0;
  };

  const sparkline = generateSparkline();
  const maxValue = Math.max(...sparkline.map(d => d.value));
  const minValue = Math.min(...sparkline.map(d => d.value));

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
      whileHover={{ y: -2, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${bgColorClasses[color]}`}>
          <div className={`${textColorClasses[color]}`}>
            {icon === 'chart-line' && (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            )}
            {icon === 'check-circle' && (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {icon === 'cube' && (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
            {icon === 'dollar-sign' && (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Trend indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-1 ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="text-sm font-medium">
            {Math.abs(trend)}%
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          vs last period
        </span>
      </div>

      {/* Mini sparkline chart */}
      <div className="h-12 relative">
        <svg className="w-full h-full">
          <polyline
            fill="none"
            stroke={colorClasses[color].replace('bg-', '#').replace('500', '400')}
            strokeWidth="2"
            points={sparkline.map((point, index) => {
              const x = (index / (sparkline.length - 1)) * 100;
              const y = ((maxValue - point.value) / (maxValue - minValue)) * 100;
              return `${x},${y}`;
            }).join(' ')}
            style={{
              vectorEffect: 'non-scaling-stroke',
            }}
            className="opacity-50"
          />
          <polyline
            fill="url(#gradient)"
            fillOpacity="0.1"
            stroke="none"
            points={`0,100 ${sparkline.map((point, index) => {
              const x = (index / (sparkline.length - 1)) * 100;
              const y = ((maxValue - point.value) / (maxValue - minValue)) * 100;
              return `${x},${y}`;
            }).join(' ')} 100,100`}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colorClasses[color].replace('bg-', '#').replace('500', '400')} />
              <stop offset="100%" stopColor={colorClasses[color].replace('bg-', '#').replace('500', '400')} stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </motion.div>
  );
};

export default KPICard;