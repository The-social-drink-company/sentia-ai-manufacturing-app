// Chart.js configuration and setup
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale,
  Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale,
  Filler
);

// Common chart configuration
export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
    },
    x: {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
    },
  },
};

// Color palettes for consistent theming
export const colorPalettes = {
  primary: [
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
  ],
  primaryBorder: [
    'rgba(59, 130, 246, 1)',
    'rgba(16, 185, 129, 1)',
    'rgba(245, 158, 11, 1)',
    'rgba(239, 68, 68, 1)',
    'rgba(139, 92, 246, 1)',
    'rgba(236, 72, 153, 1)',
  ],
  success: 'rgba(16, 185, 129, 0.8)',
  warning: 'rgba(245, 158, 11, 0.8)',
  danger: 'rgba(239, 68, 68, 0.8)',
  info: 'rgba(59, 130, 246, 0.8)',
};

// Production-specific color scheme
export const productionColors = {
  efficiency: 'rgba(16, 185, 129, 0.8)',
  output: 'rgba(59, 130, 246, 0.8)',
  quality: 'rgba(245, 158, 11, 0.8)',
  downtime: 'rgba(239, 68, 68, 0.8)',
};

// Quality-specific color scheme
export const qualityColors = {
  passed: 'rgba(16, 185, 129, 0.8)',
  failed: 'rgba(239, 68, 68, 0.8)',
  pending: 'rgba(245, 158, 11, 0.8)',
  inProgress: 'rgba(59, 130, 246, 0.8)',
};

// Inventory-specific color scheme
export const inventoryColors = {
  inStock: 'rgba(16, 185, 129, 0.8)',
  lowStock: 'rgba(245, 158, 11, 0.8)',
  outOfStock: 'rgba(239, 68, 68, 0.8)',
  reorder: 'rgba(139, 92, 246, 0.8)',
};

// Time-based chart configuration
export const timeChartOptions = {
  ...defaultChartOptions,
  scales: {
    ...defaultChartOptions.scales,
    x: {
      type: 'time',
      time: {
        displayFormats: {
          hour: 'MMM dd HH:mm',
          day: 'MMM dd',
          week: 'MMM dd',
          month: 'MMM yyyy'
        }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
    },
  },
};

export default ChartJS;