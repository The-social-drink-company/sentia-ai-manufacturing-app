import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useChartTheme } from '../ChartProvider';

ChartJS.register(ArcElement, Title, Tooltip, Legend);

export const DoughnutChart = ({
  data,
  options = {},
  title,
  height = 300,
  colorPalette = 'production',
  showLegend = true,
  showTooltip = true,
  cutout = '60%',
  showValues = true,
  centerText = null,
  ...props
}) => {
  const { getChartOptions, getColorPalette, theme } = useChartTheme();
  
  // Prepare chart data with theme colors
  const chartData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => {
      const colors = getColorPalette(colorPalette, dataset.data.length);
      
      return {
        ...dataset,
        backgroundColor: colors,
        borderColor: theme.colors.background,
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverOffset: 8,
        cutout: cutout
      };
    })
  };
  
  // Center text plugin
  const centerTextPlugin = centerText ? {
    id: 'centerText',
    beforeDraw: (chart) => {
      const { width, height, ctx } = chart;
      ctx.restore();
      
      const fontSize = (height / 114).toFixed(2);
      ctx.font = `${fontSize}em 'Inter', sans-serif`;
      ctx.fillStyle = theme.colors.textPrimary;
      ctx.textBaseline = 'middle';
      
      const text = centerText;
      const textX = Math.round((width - ctx.measureText(text).width) / 2);
      const textY = height / 2;
      
      ctx.fillText(text, textX, textY);
      ctx.save();
    }
  } : undefined;
  
  // Merge options with theme defaults
  const chartOptions = getChartOptions({
    ...options,
    plugins: {
      ...options.plugins,
      legend: {
        display: showLegend,
        position: 'bottom',
        labels: {
          ...options.plugins?.legend?.labels,
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        },
        ...options.plugins?.legend
      },
      tooltip: {
        enabled: showTooltip,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            
            return showValues ? 
              `${label}: ${value} (${percentage}%)` : 
              `${label}: ${percentage}%`;
          },
          ...options.plugins?.tooltip?.callbacks
        },
        ...options.plugins?.tooltip
      },
      title: title ? {
        display: true,
        text: title,
        color: theme.colors.textPrimary,
        font: {
          family: "'Inter', sans-serif",
          size: 14,
          weight: '600'
        },
        padding: 20,
        ...options.plugins?.title
      } : undefined
    }
  });
  
  return (
    <div style={{ height: height, position: 'relative' }} {...props}>
      <Doughnut 
        data={chartData} 
        options={chartOptions}
        plugins={centerTextPlugin ? [centerTextPlugin] : undefined}
      />
    </div>
  );
};

export default DoughnutChart;
