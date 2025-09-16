import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChartBarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowsPointingOutIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  Squares2X2Icon,
  ListBulletIcon,
  TableCellsIcon,
  PresentationChartLineIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { Line, Bar, Pie, Scatter, Doughnut } from 'react-chartjs-2';

const AdvancedDataExplorer = ({ className = '' }) => {
  const [selectedDataset, setSelectedDataset] = useState('sales');
  const [visualizationType, setVisualizationType] = useState('line');
  const [timeRange, setTimeRange] = useState('30d');
  const [filters, setFilters] = useState({});
  const [drillDownPath, setDrillDownPath] = useState([]);
  const [viewMode, setViewMode] = useState('chart');
  const [groupBy, setGroupBy] = useState('date');
  const [aggregation, setAggregation] = useState('sum');

  // Fetch data based on current selections
  const { data: explorerData, isLoading, refetch } = useQuery({
    queryKey: ['data-explorer', selectedDataset, timeRange, filters, groupBy, aggregation],
    queryFn: async () => {
      try {
        const response = await fetch('/api/data-explorer/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataset: selectedDataset,
            timeRange,
            filters,
            groupBy,
            aggregation,
            drillDown: drillDownPath,
            includeMetadata: true
          })
        });
        
        if (!response.ok) throw new Error('Failed to fetch explorer data');
        return await response.json();
      } catch (error) {
        console.error('Data explorer fetch error:', error);
        return throwRealDataRequired(selectedDataset, timeRange);
      }
    },
    refetchInterval: 30000,
    staleTime: 10000
  });

  // REMOVED: No mock data explorer generation - use real data only
  const throwRealDataRequired = (dataset, range) => {
    throw new Error(`Data explorer requires real ${dataset} data from external APIs. Math.random() mock data is not permitted.`);
  };

  const getDrillDownOptions = (dataset) => {
    const options = {
      sales: [
        { label: 'By Product', field: 'category', icon: '📦' },
        { label: 'By Region', field: 'region', icon: '🌍' },
        { label: 'By Channel', field: 'channel', icon: '🛒' },
        { label: 'By Customer', field: 'customer', icon: '👤' }
      ],
      inventory: [
        { label: 'By SKU', field: 'sku', icon: '📋' },
        { label: 'By Category', field: 'category', icon: '📂' },
        { label: 'By Supplier', field: 'supplier', icon: '🏭' },
        { label: 'By Location', field: 'location', icon: '📍' }
      ],
      production: [
        { label: 'By Line', field: 'productionLine', icon: '⚙️' },
        { label: 'By Shift', field: 'shift', icon: '🕐' },
        { label: 'By Operator', field: 'operator', icon: '👷' },
        { label: 'By Product', field: 'product', icon: '🔧' }
      ]
    };
    return options[dataset] || [];
  };

  const chartData = useMemo(() => {
    if (!explorerData?.data) return null;

    const data = explorerData.data;
    
    if (groupBy === 'date') {
      return {
        labels: data.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [{
          label: selectedDataset.charAt(0).toUpperCase() + selectedDataset.slice(1),
          data: data.map(d => d.value),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: visualizationType === 'area'
        }]
      };
    } else {
      // Group by selected dimension
      const grouped = data.reduce((acc, item) => {
        const key = item[groupBy] || 'Unknown';
        acc[key] = (acc[key] || 0) + item.value;
        return acc;
      }, {});

      const sortedEntries = Object.entries(grouped)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10); // Top 10

      const colors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280'
      ];

      return {
        labels: sortedEntries.map(([key]) => key),
        datasets: [{
          label: `${selectedDataset} by ${groupBy}`,
          data: sortedEntries.map(([, value]) => value),
          backgroundColor: colors.slice(0, sortedEntries.length),
          borderColor: colors.slice(0, sortedEntries.length),
          borderWidth: 1
        }]
      };
    }
  }, [explorerData, groupBy, selectedDataset, visualizationType]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { usePointStyle: true }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          afterBody: (context) => {
            if (drillDownPath.length === 0) {
              return 'Click to drill down';
            }
            return '';
          }
        }
      }
    },
    scales: visualizationType === 'pie' || visualizationType === 'doughnut' ? {} : {
      x: {
        display: true,
        grid: { display: false }
      },
      y: {
        display: true,
        grid: { color: 'rgba(156, 163, 175, 0.1)' }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        handleChartDrillDown(elements[0].index);
      }
    }
  };

  const handleChartDrillDown = (index) => {
    if (!chartData || drillDownPath.length >= 3) return;

    const label = chartData.labels[index];
    const newDrillDown = [...drillDownPath, { level: groupBy, value: label }];
    setDrillDownPath(newDrillDown);
    
    // Update filters based on drill down
    setFilters(prev => ({
      ...prev,
      [groupBy]: label
    }));
  };

  const handleDrillUp = (levelIndex) => {
    const newDrillDown = drillDownPath.slice(0, levelIndex);
    setDrillDownPath(newDrillDown);
    
    // Remove corresponding filters
    const newFilters = { ...filters };
    for (let i = levelIndex; i < drillDownPath.length; i++) {
      delete newFilters[drillDownPath[i].level];
    }
    setFilters(newFilters);
  };

  const handleQuickDrillDown = (option) => {
    setGroupBy(option.field);
    refetch();
  };

  const renderChart = () => {
    if (!chartData) return null;

    const ChartComponent = {
      line: Line,
      bar: Bar,
      pie: Pie,
      doughnut: Doughnut,
      scatter: Scatter,
      area: Line
    }[visualizationType] || Line;

    return <ChartComponent data={chartData} options={chartOptions} />;
  };

  const renderDataTable = () => {
    if (!explorerData?.data) return null;

    const data = explorerData.data.slice(0, 100); // Limit to 100 rows
    const columns = Object.keys(data[0] || {});

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map(column => (
                <th key={column} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {column.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {columns.map(column => (
                  <td key={column} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {typeof row[column] === 'number' ? row[column].toLocaleString() : row[column]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-blue-500" />
            Advanced Data Explorer
          </h3>
          
          <div className="flex items-center space-x-2">
            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <DocumentArrowDownIcon className="h-4 w-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <ArrowsPointingOutIcon className="h-4 w-4" />
            </button>
            <button onClick={refetch} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Dataset</label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700"
            >
              <option value="sales">Sales Data</option>
              <option value="inventory">Inventory</option>
              <option value="production">Production</option>
              <option value="quality">Quality Metrics</option>
              <option value="financial">Financial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700"
            >
              <option value="date">Date</option>
              <option value="category">Category</option>
              <option value="region">Region</option>
              <option value="channel">Channel</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">View</label>
            <div className="flex rounded-md" role="group">
              <button
                onClick={() => setViewMode('chart')}
                className={`px-2 py-1 text-xs font-medium rounded-l-md border ${
                  viewMode === 'chart'
                    ? 'bg-blue-50 dark:bg-blue-900 border-blue-300 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                <PresentationChartLineIcon className="h-3 w-3" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2 py-1 text-xs font-medium rounded-r-md border-t border-r border-b ${
                  viewMode === 'table'
                    ? 'bg-blue-50 dark:bg-blue-900 border-blue-300 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                <TableCellsIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Chart Type Selection */}
        {viewMode === 'chart' && (
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Chart Type:</span>
            {['line', 'bar', 'pie', 'doughnut'].map(type => (
              <button
                key={type}
                onClick={() => setVisualizationType(type)}
                className={`px-2 py-1 text-xs font-medium rounded ${
                  visualizationType === type
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Drill Down Breadcrumb */}
        {drillDownPath.length > 0 && (
          <div className="flex items-center space-x-2 mb-4 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Drill Path:</span>
            <button
              onClick={() => handleDrillUp(0)}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              All {selectedDataset}
            </button>
            {drillDownPath.map((path, index) => (
              <React.Fragment key={index}>
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => handleDrillUp(index + 1)}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {path.value}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === 'chart' ? (
          <>
            <div className="h-80 mb-6">
              {renderChart()}
            </div>

            {/* Quick Drill Down Options */}
            {explorerData?.drillDownOptions && drillDownPath.length < 2 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Drill Down:</h4>
                <div className="flex flex-wrap gap-2">
                  {explorerData.drillDownOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickDrillDown(option)}
                      className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Statistics */}
            {explorerData?.summary && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {explorerData.summary.total?.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(explorerData.summary.average || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Average</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {explorerData.summary.max?.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Maximum</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {explorerData.summary.min?.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Minimum</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {explorerData.summary.count?.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Records</div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="max-h-96 overflow-auto">
            {renderDataTable()}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center">
            <EyeIcon className="h-3 w-3 mr-1" />
            Interactive data exploration with drill-down capabilities
          </span>
          <span>
            Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDataExplorer;