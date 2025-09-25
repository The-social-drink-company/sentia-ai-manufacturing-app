import React, { useState, useEffect } from 'react';
import {
  PresentationChartLineIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  CpuChipIcon,
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentChartBarIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  CubeIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ComposedChart, Area, AreaChart, Legend
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { CLIENT_REQUIREMENTS } from '../config/clientRequirements';
import { realDataService } from '../../services/data/RealDataService';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


const Forecasting = () => {
  // Use client-specified horizons only (30, 60, 90, 120, 180 days)
  const [forecastHorizon, setForecastHorizon] = useState(30);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [activeTab, setActiveTab] = useState('demand');
  const [seasonality, setSeasonality] = useState('auto');
  const [showDataImportPrompt, setShowDataImportPrompt] = useState(false);

  // Regions and Products from client requirements
  const regions = CLIENT_REQUIREMENTS.demandForecasting.regions;
  const products = CLIENT_REQUIREMENTS.demandForecasting.products;
  const horizons = CLIENT_REQUIREMENTS.demandForecasting.forecastHorizons;

  // Fetch forecast data with REAL DATA ONLY - NO MOCK DATA
  const { data: forecastData, isLoading, error, refetch } = useQuery({
    queryKey: ['forecasting', forecastHorizon, selectedRegion, seasonality],
    queryFn: async () => {
      try {
        // Try to fetch from real APIs first
        const response = await fetch(
          `/api/forecasting/demand?horizon=${forecastHorizon}&region=${selectedRegion}&seasonality=${seasonality}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Sanity check - client sells 300-400 units/day
          if (data && data.dailyUnits > 500) {
            logWarn('Daily units exceed expected range (300-400)');
          }
          return data;
        }
      } catch (error) {
        logError('Forecast API error:', error);
      }

      // NO MOCK DATA - Return zero with prompt to import
      return {
        hasData: false,
        message: 'No forecast data available. Please import historic sales data or connect to Unleashed/Xero.',
        demandForecast: [],
        regionalForecasts: {
          us: [],
          uk: [],
          eu: []
        },
        productForecasts: products.map(product => ({
          product: product.name,
          sku: product.id.toUpperCase(),
          currentDemand: 0,
          forecastedDemand: 0,
          growth: 0,
          seasonality: 'Unknown',
          accuracy: 0,
          trend: 'unknown',
          riskLevel: 'unknown',
          requiresData: true
        }))
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: false // Don't auto-refetch when no data
  });

  // Handle CSV import
  const handleCSVImport = () => {
    setShowDataImportPrompt(true);
  };

  // Connect to API
  const handleConnectAPI = (apiType) => {
    window.location.href = `/settings?connect=${apiType}`;
  };

  // Render message when no data
  const renderNoDataMessage = () => (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
      <div className="flex items-start">
        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Real Data Required
          </h3>
          <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            {forecastData?.message || 'No forecast data available. Import historic sales data to generate accurate forecasts.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleCSVImport}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
              Import CSV
            </button>
            <button
              onClick={() => handleConnectAPI('unleashed')}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Connect Unleashed
            </button>
            <button
              onClick={() => handleConnectAPI('xero')}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Connect Xero
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render regional chart with product lines
  const renderRegionalChart = (region) => {
    const regionData = forecastData?.regionalForecasts?.[region.id] || [];

    if (!regionData || regionData.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500">
          <CubeIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>No data available for {region.name}</p>
          <p className="text-sm mt-1">Import {region.name} sales data to see forecasts</p>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={regionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            label={{
              value: 'Units (bottles)',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 12 }
            }}
            domain={[0, 500]} // Based on 300-400 units/day
          />
          <Tooltip
            formatter={(value) => [`${value} units`, '']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />

          {/* One line per product */}
          {products.map(product => (
            <Line
              key={product.id}
              type="monotone"
              dataKey={product.id}
              name={product.name}
              stroke={product.color}
              strokeWidth={2}
              strokeDasharray={product.id === 'forecast' ? '5 5' : '0'}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <PresentationChartLineIcon className="h-8 w-8 mr-3 text-blue-600" />
              Demand Forecasting
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Real-time demand predictions based on actual sales data
            </p>
          </div>

          {/* Forecast Horizon Selector - Client specified options only */}
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Forecast Horizon
              </label>
              <select
                value={forecastHorizon}
                onChange={(e) => setForecastHorizon(Number(e.target.value))}
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {horizons.filter(h => h.enabled).map(horizon => (
                  <option key={horizon.value} value={horizon.value}>
                    {horizon.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={refetch}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sanity Check Alert */}
        {forecastData?.dailyAverage > 500 && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded-md">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-700" />
              <div className="ml-2">
                <p className="text-sm text-yellow-700">
                  <strong>Data Sanity Check:</strong> Forecast shows {forecastData.dailyAverage} units/day.
                  Expected range is 300-400 units/day. Please verify data sources.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : !forecastData?.hasData ? (
        renderNoDataMessage()
      ) : (
        <>
          {/* Regional Charts - 3 separate charts as requested by client */}
          <div className="grid grid-cols-1 gap-6">
            {regions.map(region => (
              <div key={region.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: region.color }}
                  />
                  {region.name} Region Forecast
                </h3>
                {renderRegionalChart(region)}
              </div>
            ))}
          </div>

          {/* Product Performance Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Product Forecasts
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Current Demand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Forecasted Demand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Growth
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {forecastData?.productForecasts?.map((product, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {product.product}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {product.requiresData ? (
                          <span className="text-yellow-600">Import data</span>
                        ) : (
                          `${product.currentDemand.toLocaleString()} units`
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {product.requiresData ? (
                          <span className="text-yellow-600">-</span>
                        ) : (
                          `${product.forecastedDemand.toLocaleString()} units`
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {product.requiresData ? (
                          <span className="text-yellow-600">-</span>
                        ) : (
                          <div className="flex items-center">
                            {product.growth > 0 ? (
                              <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                            ) : (
                              <ArrowTrendingDownIcon className="h-4 w-4 text-red-600 mr-1" />
                            )}
                            <span className={product.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                              {product.growth}%
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.requiresData ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Needs Data
                          </span>
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${product.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                              product.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'}`}>
                            {product.riskLevel}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons - Must Work */}
          <div className="flex justify-center space-x-4">
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              onClick={() => setActiveTab('demand')}
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Demand Metrics
            </button>
            <button
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              onClick={() => setActiveTab('revenue')}
            >
              <ArrowTrendingUpIcon className="h-5 w-5 mr-2" />
              Revenue
            </button>
            <button
              className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
              onClick={() => setActiveTab('inventory')}
            >
              <CubeIcon className="h-5 w-5 mr-2" />
              Inventory
            </button>
          </div>
        </>
      )}

      {/* CSV Import Modal */}
      {showDataImportPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Import Historic Sales Data</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload separate CSV files for each region (USA, UK, Europe) with the following columns:
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside mb-4">
              <li>Date</li>
              <li>Product (Red/Gold/Black)</li>
              <li>Units Sold</li>
              <li>Revenue</li>
            </ul>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDataImportPrompt(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => window.location.href = '/data-import'}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Go to Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forecasting;