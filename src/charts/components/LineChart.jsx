import React from 'react';
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
import { useChartTheme } from '../ChartProvider';

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

export const LineChart = ({
  data,
  options = {},
  title,
  height = 300,
  colorPalette = 'production',
  showLegend = true,
  showTooltip = true,
  showGrid = true,
  tension = 0.1,
  fill = false,
  ...props
}) => {
  const { getChartOptions, getColorPalette, theme } = useChartTheme();
  
  // Prepare chart data with theme colors
  const chartData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => {
      const colors = getColorPalette(colorPalette, data.datasets.length);
      const color = colors[index % colors.length];
      
      return {
        ...dataset,
        borderColor: color,
        backgroundColor: fill ? `${color}20` : color, // 20 = ~12% opacity
        pointBackgroundColor: theme.colors.background,
        pointBorderColor: color,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: theme.colors.background,
        tension: tension,
        fill: fill,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3
      };
    })
  };
  
  // Merge options with theme defaults
  const chartOptions = getChartOptions({
    ...options,
    plugins: {
      ...options.plugins,
      legend: {
        display: showLegend,
        ...options.plugins?.legend
      },
      tooltip: {
        enabled: showTooltip,
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
    },
    scales: {
      ...options.scales,
      x: {
        ...options.scales?.x,
        grid: {
          display: showGrid,
          ...options.scales?.x?.grid
        }
      },
      y: {
        ...options.scales?.y,
        grid: {
          display: showGrid,
          ...options.scales?.y?.grid
        }
      }
    }
  });
  
  return (
    <div style={{ height: height }} {...props}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default LineChart;