import React from 'react';
import { Line } from 'react-chartjs-2';
import { defaultChartOptions, timeChartOptions } from './ChartConfig';

const LineChart = ({ 
  data, 
  options = {}, 
  height = 300, 
  timeChart = false,
  className = ""
}) => {
  const chartOptions = {
    ...(timeChart ? timeChartOptions : defaultChartOptions),
    ...options
  };

  return (
    <div className={`w-full ${className}`} style={{ height: `${height}px` }}>
      <Line data={data} options={chartOptions} />
    </div>
  );
};

export default LineChart;
