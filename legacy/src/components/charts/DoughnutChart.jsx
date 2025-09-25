import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { defaultChartOptions } from './ChartConfig';

const DoughnutChart = ({ 
  data, 
  options = {}, 
  height = 300,
  className = ""
}) => {
  const chartOptions = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      legend: {
        position: 'right',
      },
    },
    ...options
  };

  return (
    <div className={`w-full ${className}`} style={{ height: `${height}px` }}>
      <Doughnut data={data} options={chartOptions} />
    </div>
  );
};

export default DoughnutChart;
