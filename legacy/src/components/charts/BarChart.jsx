import React from 'react';
import { Bar } from 'react-chartjs-2';
import { defaultChartOptions } from './ChartConfig';

const BarChart = ({ 
  data, 
  options = {}, 
  height = 300,
  horizontal = false,
  className = ""
}) => {
  const chartOptions = {
    ...defaultChartOptions,
    indexAxis: horizontal ? 'y' : 'x',
    ...options
  };

  return (
    <div className={`w-full ${className}`} style={{ height: `${height}px` }}>
      <Bar data={data} options={chartOptions} />
    </div>
  );
};

export default BarChart;
