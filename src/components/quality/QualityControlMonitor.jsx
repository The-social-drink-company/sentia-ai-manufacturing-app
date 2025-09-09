import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BeakerIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { qualityControlService } from '../../services/QualityControlService.js';

const QualityControlMonitor = () => {
  const [qualityStatus, setQualityStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedStation, setSelectedStation] = useState('all');

  // Initialize quality control service
  useEffect(() => {
    const initializeQualityControl = async () => {
      try {
        setLoading(true);
        await qualityControlService.initialize();
        await fetchQualityStatus();
        setError(null);
      } catch (err) {
        setError(`Failed to initialize quality control systems: ${err.message}`);
        console.error('Quality control initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeQualityControl();
  }, []);

  // Fetch real-time quality status
  const fetchQualityStatus = useCallback(async () => {
    try {
      const status = await qualityControlService.getRealTimeQualityStatus();
      setQualityStatus(status);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(`Failed to fetch quality status: ${err.message}`);
      console.error('Quality status error:', err);
    }
  }, []);

  // Auto-refresh quality data
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchQualityStatus();
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchQualityStatus]);

  // Get station status color
  const getStationStatusColor = (status) => {
    const colors = {
      active: 'text-green-600 bg-green-100',
      idle: 'text-yellow-600 bg-yellow-100',
      maintenance: 'text-blue-600 bg-blue-100',
      calibration: 'text-purple-600 bg-purple-100'
    };
    return colors[status] || colors.idle;
  };

  // Get quality score color
  const getQualityScoreColor = (score) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 90) return 'text-yellow-600';
    if (score >= 80) return 'text-orange-600';
    return 'text-red-600';
  };

  // Filter stations based on selection
  const getFilteredStations = () => {
    if (!qualityStatus) return [];
    if (selectedStation === 'all') return qualityStatus.stations;
    return qualityStatus.stations.filter(station => station.id === selectedStation);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div className="h-6 bg-gray-300 rounded w-64"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-8 bg-gray-300 rounded mb-4"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-6 bg-gray-300 rounded mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-4 bg-gray-300 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 text-red-600 mb-4">
          <ExclamationTriangleIcon className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Quality Control System Error</h3>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchQualityStatus}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BeakerIcon className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">Quality Control Monitor</h2>
              <p className="text-purple-100 text-sm">
                Real-time quality testing and compliance monitoring
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right text-sm">
              <div className="text-purple-100">Last Update</div>
              <div className="font-medium">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
              </div>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                autoRefresh 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-300 text-gray-700'
              }`}
            >
              Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Overall Status */}
      {qualityStatus && (
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overall Quality</p>
                  <p className={`text-2xl font-bold ${getQualityScoreColor(qualityStatus.overallQualityScore)}`}>
                    {Math.round(qualityStatus.overallQualityScore)}%
                  </p>
                </div>
                <ShieldCheckIcon className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Passed Batches</p>
                  <p className="text-2xl font-bold text-green-600">
                    {qualityStatus.passedBatches}
                  </p>
                </div>
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Failed Batches</p>
                  <p className="text-2xl font-bold text-red-600">
                    {qualityStatus.failedBatches}
                  </p>
                </div>
                <XCircleIcon className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Tests</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {qualityStatus.pendingTests}
                  </p>
                </div>
                <ClockIcon className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Station Filter */}
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter by Station:</label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Stations</option>
                {qualityStatus.stations.map(station => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Testing Stations */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            <AnimatePresence>
              {getFilteredStations().map((station, index) => (
                <motion.div
                  key={station.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Station Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <BeakerIcon className="w-5 h-5 text-purple-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{station.name}</h3>
                          <p className="text-sm text-gray-600">{station.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStationStatusColor(station.status)}`}>
                          {station.status}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getQualityScoreColor(station.qualityScore)} bg-white border`}>
                          {Math.round(station.qualityScore)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Station Details */}
                  <div className="p-4">
                    {/* Current Batch */}
                    {station.currentBatch && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">Current Batch</p>
                        <p className="font-medium text-gray-900">{station.currentBatch.id}</p>
                        <p className="text-sm text-gray-500">{station.currentBatch.product}</p>
                        <p className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded inline-block mt-1">
                          {station.currentBatch.stage}
                        </p>
                      </div>
                    )}

                    {/* Station Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Tests Today</p>
                        <p className="text-lg font-bold text-gray-900">{station.testsCompleted}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Pass Rate</p>
                        <p className={`text-lg font-bold ${getQualityScoreColor(station.passRate)}`}>
                          {Math.round(station.passRate)}%
                        </p>
                      </div>
                    </div>

                    {/* Calibration Status */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AdjustmentsHorizontalIcon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Calibration</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        station.calibrationStatus === 'current' 
                          ? 'text-green-600 bg-green-100' 
                          : 'text-red-600 bg-red-100'
                      }`}>
                        {station.calibrationStatus}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Bottom Section - Recent Tests and Compliance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Test Results */}
            <div className="border border-gray-200 rounded-lg">
              <div className="bg-blue-50 px-4 py-3 border-b">
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Recent Test Results</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {/* Mock recent test results */}
                  {[
                    { batch: 'BATCH_2025090801', test: 'Microbiological', result: 'PASS', time: '10 min ago' },
                    { batch: 'BATCH_2025090802', test: 'Potency Analysis', result: 'PASS', time: '25 min ago' },
                    { batch: 'BATCH_2025090803', test: 'pH Testing', result: 'FAIL', time: '45 min ago' },
                    { batch: 'BATCH_2025090804', test: 'Moisture Content', result: 'PASS', time: '1 hour ago' },
                    { batch: 'BATCH_2025090805', test: 'Label Inspection', result: 'PASS', time: '1.5 hours ago' }
                  ].map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{test.batch}</p>
                        <p className="text-xs text-gray-600">{test.test}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          test.result === 'PASS' 
                            ? 'text-green-600 bg-green-100' 
                            : 'text-red-600 bg-red-100'
                        }`}>
                          {test.result}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{test.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Compliance Status */}
            <div className="border border-gray-200 rounded-lg">
              <div className="bg-green-50 px-4 py-3 border-b">
                <div className="flex items-center space-x-3">
                  <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Compliance Status</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {[
                    { standard: 'ISO 22000', status: 'Compliant', nextAudit: 'Nov 15, 2025' },
                    { standard: 'FDA Regulations', status: 'Compliant', nextAudit: 'Jan 20, 2026' },
                    { standard: 'HACCP', status: 'Compliant', nextAudit: 'Dec 1, 2025' },
                    { standard: 'GMP Standards', status: 'Compliant', nextAudit: 'Nov 10, 2025' }
                  ].map((compliance, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{compliance.standard}</p>
                        <p className="text-xs text-gray-600">Next audit: {compliance.nextAudit}</p>
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-medium text-green-600 bg-green-100">
                        {compliance.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityControlMonitor;