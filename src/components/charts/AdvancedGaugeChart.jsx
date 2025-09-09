import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const AdvancedGaugeChart = ({ 
  value, 
  max = 100, 
  min = 0,
  title = "Gauge Chart",
  unit = "%",
  colors = {
    good: '#10B981',      // Green
    warning: '#F59E0B',   // Yellow  
    critical: '#EF4444',  // Red
    background: '#E5E7EB' // Gray
  },
  thresholds = {
    warning: 70,
    critical: 40
  },
  showLabels = true,
  size = 200,
  thickness = 20
}) => {
  // Calculate percentage
  const percentage = ((value - min) / (max - min)) * 100;
  
  // Determine color based on thresholds
  const getColor = () => {
    if (percentage >= thresholds.warning) return colors.good;
    if (percentage >= thresholds.critical) return colors.warning;
    return colors.critical;
  };

  // Create gauge data - split into segments for better visual
  const gaugeData = [
    { name: 'value', value: percentage, fill: getColor() },
    { name: 'remaining', value: 100 - percentage, fill: colors.background }
  ];

  // Create threshold indicators
  const thresholdData = [
    { name: 'critical', value: thresholds.critical, fill: colors.critical },
    { name: 'warning', value: thresholds.warning - thresholds.critical, fill: colors.warning },
    { name: 'good', value: 100 - thresholds.warning, fill: colors.good }
  ];

  const RADIAN = Math.PI / 180;
  
  // Custom label function for the main value
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    if (name !== 'value') return null;
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${value}${unit}`}
      </text>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <ResponsiveContainer width={size} height={size * 0.6}>
          <PieChart>
            {/* Background threshold indicators */}
            <Pie
              data={thresholdData}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={size * 0.25}
              outerRadius={size * 0.28}
              dataKey="value"
              stroke="none"
            >
              {thresholdData.map((entry, index) => (
                <Cell key={`threshold-${index}`} fill={entry.fill} opacity={0.3} />
              ))}
            </Pie>
            
            {/* Main gauge */}
            <Pie
              data={gaugeData}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={size * 0.3}
              outerRadius={size * 0.45}
              dataKey="value"
              stroke="none"
              label={showLabels ? renderCustomizedLabel : false}
            >
              {gaugeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center value display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}{unit}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {min} - {max}{unit}
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLabels && (
        <div className="flex items-center space-x-4 mt-4">
          <div className="flex items-center space-x-1">
            <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: colors.critical }} />
            <span className="text-xs text-gray-600">Critical</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: colors.warning }} />
            <span className="text-xs text-gray-600">Warning</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: colors.good }} />
            <span className="text-xs text-gray-600">Good</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedGaugeChart;