import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  TrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  BeakerIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { manufacturingAnalyticsService } from '../services/ManufacturingAnalyticsService.js';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7');

  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        setLoading(true);
        await manufacturingAnalyticsService.initialize();
        await fetchAnalyticsData();
        setError(null);
      } catch (err) {
        setError(`Failed to initialize analytics: ${err.message}`);
        console.error('Analytics initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAnalytics();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const data = await manufacturingAnalyticsService.getAnalyticsDashboard();
      setAnalyticsData(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(`Failed to fetch analytics data: ${err.message}`);
      console.error('Analytics data error:', err);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getOEEColor = (oee) => {
    if (oee >= 85) return 'text-green-600';
    if (oee >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOEEBgColor = (oee) => {
    if (oee >= 85) return 'bg-green-500';
    if (oee >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />;
      case 'declining':
        return <TrendingDownIcon className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 bg-gray-300 rounded-full"></div>;
    }
  };

  const getVarianceColor = (status) => {
    return status === 'favorable' ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="flex items-center space-x-3 text-red-600 mb-4">
            <ExclamationTriangleIcon className="w-8 h-8" />
            <h3 className="text-lg font-semibold">Analytics Error</h3>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <span>Manufacturing Analytics</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Overall Equipment Effectiveness (OEE) and Variance Analysis
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--'}
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Last 24 Hours</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
            <button
              onClick={fetchAnalyticsData}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Overall OEE Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Overall OEE</p>
              <p className={`text-3xl font-bold ${getOEEColor(analyticsData?.summary?.overallOEE || 0)}`}>
                {analyticsData?.summary?.overallOEE || 0}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {analyticsData?.summary?.classification || 'Unknown'}
              </p>
            </div>
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${getOEEBgColor(analyticsData?.summary?.overallOEE || 0)}`}>
                <span className="text-white font-bold">OEE</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Availability</p>
              <p className="text-3xl font-bold text-blue-600">
                {analyticsData?.summary?.availability || 0}%
              </p>
            </div>
            <ClockIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Performance</p>
              <p className="text-3xl font-bold text-green-600">
                {analyticsData?.summary?.performance || 0}%
              </p>
            </div>
            <CogIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Quality</p>
              <p className="text-3xl font-bold text-purple-600">
                {analyticsData?.summary?.quality || 0}%
              </p>
            </div>
            <BeakerIcon className="h-12 w-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Station OEE Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Station OEE Analysis</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Station
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OEE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Availability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData?.stationOEE?.map((station) => {
                const stationTrend = analyticsData?.trends?.[station.stationId];
                return (
                  <tr key={station.stationId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{station.stationName}</div>
                      <div className="text-sm text-gray-500">{station.stationId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-lg font-bold ${getOEEColor(station.oee)}`}>
                        {station.oee}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {station.availability}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {station.performance}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {station.quality}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        station.classification === 'World Class' ? 'bg-green-100 text-green-800' :
                        station.classification === 'Good' ? 'bg-yellow-100 text-yellow-800' :
                        station.classification === 'Fair' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {station.classification}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(stationTrend?.oee?.trend)}
                        <span className="text-sm text-gray-600">
                          {stationTrend?.oee?.change > 0 ? '+' : ''}{stationTrend?.oee?.change || 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Variance Analysis */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Variance Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analyticsData?.varianceAnalysis?.map((variance) => (
            <div key={variance.stationId} className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">{variance.stationName}</h3>
              
              <div className="space-y-3">
                {/* Production Variance */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Production Variance:</span>
                  <div className="text-right">
                    <span className={`font-medium ${getVarianceColor(variance.production.status)}`}>
                      {variance.production.variance > 0 ? '+' : ''}{variance.production.variance} units
                    </span>
                    <span className={`text-sm ml-2 ${getVarianceColor(variance.production.status)}`}>
                      ({variance.production.variancePercent}%)
                    </span>
                  </div>
                </div>

                {/* Efficiency Variance */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Efficiency Variance:</span>
                  <span className={`font-medium ${getVarianceColor(variance.efficiency.status)}`}>
                    {variance.efficiency.variance > 0 ? '+' : ''}{variance.efficiency.variance}%
                  </span>
                </div>

                {/* Downtime Variance */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Downtime Variance:</span>
                  <span className={`font-medium ${getVarianceColor(variance.downtime.status)}`}>
                    {variance.downtime.variance > 0 ? '+' : ''}{variance.downtime.variance} min
                  </span>
                </div>

                {/* Quality Variance */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Quality Variance:</span>
                  <span className={`font-medium ${getVarianceColor(variance.quality.status)}`}>
                    {variance.quality.variance > 0 ? '+' : ''}{Math.round(variance.quality.variance * 10) / 10}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {analyticsData?.recommendations?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Improvement Recommendations</h2>
          <div className="space-y-4">
            {analyticsData.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`border-l-4 p-4 rounded-lg ${
                  rec.type === 'critical' ? 'border-red-500 bg-red-50' :
                  rec.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {rec.type === 'critical' ? (
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mt-0.5" />
                  ) : (
                    <CheckCircleIcon className="h-6 w-6 text-yellow-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rec.impact === 'High' ? 'bg-red-100 text-red-800' :
                        rec.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.impact} Impact
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{rec.stationName}: {rec.description}</p>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Recommended Actions:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                        {rec.actions.map((action, actionIndex) => (
                          <li key={actionIndex}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;