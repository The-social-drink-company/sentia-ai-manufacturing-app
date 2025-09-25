import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMCPIntegration } from '../../hooks/useMCPIntegration';
import { logInfo, logError } from '../../services/observability/structuredLogger.js';
import {
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';

  BeakerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  UserIcon,
  FlagIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const QualityControlDashboard = () => {
  const [selectedTest, setSelectedTest] = useState(null);
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedInspector, setSelectedInspector] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();
  const { predictQuality } = useMCPIntegration();

  // Fetch quality data
  const { data: qualityData, isLoading, error } = useQuery({
    queryKey: ['quality', 'control'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/quality/control');
        if (!response.ok) {
          throw new Error('Failed to fetch quality data');
        }
        return await response.json();
      } catch (error) {
        logError('Failed to fetch quality data', error);
        // Return fallback data
        return {
          tests: [
            {
              id: 'QC-001',
              name: 'Spirit Purity Test',
              type: 'Chemical Analysis',
              status: 'passed',
              result: 99.8,
              target: 99.5,
              unit: '%',
              inspector: 'Dr. Sarah Johnson',
              timestamp: new Date().toISOString(),
              batchId: 'BATCH-2024-001',
              productLine: 'Premium Spirits',
              duration: 45,
              parameters: {
                alcoholContent: 40.2,
                impurities: 0.002,
                pH: 6.8,
                color: 'Clear',
              },
              notes: 'All parameters within acceptable range',
              trend: 'stable',
            },
            {
              id: 'QC-002',
              name: 'Bottle Integrity Test',
              type: 'Physical Test',
              status: 'passed',
              result: 100,
              target: 99.0,
              unit: '%',
              inspector: 'Mike Wilson',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              batchId: 'BATCH-2024-002',
              productLine: 'Premium Spirits',
              duration: 30,
              parameters: {
                pressureTest: 'Passed',
                leakTest: 'Passed',
                capIntegrity: 'Passed',
                labelAlignment: 'Passed',
              },
              notes: 'Perfect seal integrity',
              trend: 'improving',
            },
            {
              id: 'QC-003',
              name: 'Label Quality Check',
              type: 'Visual Inspection',
              status: 'failed',
              result: 94.5,
              target: 98.0,
              unit: '%',
              inspector: 'Lisa Brown',
              timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              batchId: 'BATCH-2024-003',
              productLine: 'Premium Spirits',
              duration: 25,
              parameters: {
                printQuality: 95.2,
                alignment: 93.8,
                adhesion: 96.1,
                readability: 92.9,
              },
              notes: 'Label alignment issues detected',
              trend: 'decreasing',
            },
            {
              id: 'QC-004',
              name: 'Packaging Strength Test',
              type: 'Physical Test',
              status: 'warning',
              result: 97.2,
              target: 98.0,
              unit: '%',
              inspector: 'John Smith',
              timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
              batchId: 'BATCH-2024-004',
              productLine: 'Premium Spirits',
              duration: 60,
              parameters: {
                crushResistance: 98.5,
                dropTest: 96.8,
                compressionTest: 96.1,
                vibrationTest: 97.4,
              },
              notes: 'Minor packaging weakness detected',
              trend: 'stable',
            },
            {
              id: 'QC-005',
              name: 'Taste Profile Analysis',
              type: 'Sensory Test',
              status: 'passed',
              result: 98.5,
              target: 95.0,
              unit: '%',
              inspector: 'Master Taster',
              timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
              batchId: 'BATCH-2024-005',
              productLine: 'Premium Spirits',
              duration: 90,
              parameters: {
                aroma: 98.0,
                taste: 99.0,
                finish: 98.5,
                complexity: 98.2,
              },
              notes: 'Excellent flavor profile',
              trend: 'improving',
            },
          ],
          summary: {
            totalTests: 5,
            passedTests: 3,
            failedTests: 1,
            warningTests: 1,
            passRate: 80.0,
            averageResult: 97.9,
            totalInspections: 1247,
          },
          analytics: {
            passRate: 80.0,
            defectRate: 0.8,
            inspectionTime: 45.2,
            reworkRate: 2.5,
            trends: {
              passRate: 'improving',
              defectRate: 'decreasing',
              inspectionTime: 'stable',
            },
          },
          inspectors: [
            'Dr. Sarah Johnson',
            'Mike Wilson',
            'Lisa Brown',
            'John Smith',
            'Master Taster',
          ],
          testTypes: [
            'Chemical Analysis',
            'Physical Test',
            'Visual Inspection',
            'Sensory Test',
            'Microbiological Test',
          ],
        };
      }
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // AI-powered quality prediction
  const predictMutation = useMutation({
    mutationFn: async () => {
      const result = await predictQuality({
        predictionHorizon: 24,
        includeRiskFactors: true,
      });
      return result;
    },
    onSuccess: (data) => {
      logInfo('Quality prediction completed', data);
      queryClient.invalidateQueries(['quality']);
    },
    onError: (error) => {
      logError('Quality prediction failed', error);
    },
  });

  // Filter tests
  const filteredTests = React.useMemo(() => {
    if (!qualityData?.tests) return [];

    return qualityData.tests.filter(test => {
      const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           test.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           test.batchId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || test.status === selectedStatus;
      const matchesInspector = selectedInspector === 'all' || test.inspector === selectedInspector;

      return matchesSearch && matchesStatus && matchesInspector;
    });
  }, [qualityData?.tests, searchTerm, selectedStatus, selectedInspector]);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'passed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'pending':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'failed':
        return <XCircleIcon className="w-4 h-4" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      default:
        return <BeakerIcon className="w-4 h-4" />;
    }
  };

  // Get trend icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
      case 'decreasing':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
      default:
        return <ChartBarIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading quality data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">Failed to load quality data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Quality Control Dashboard
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Comprehensive quality testing and inspection management
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => predictMutation.mutate()}
                disabled={predictMutation.isPending}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <BeakerIcon className="w-4 h-4 mr-2" />
                {predictMutation.isPending ? 'Predicting...' : 'AI Predict'}
              </motion.button>
              
              <motion.button
                onClick={() => setShowAddTestModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <BeakerIcon className="w-4 h-4 mr-2" />
                Add Test
              </motion.button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pass Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {qualityData?.summary?.passRate || 0}%
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(qualityData?.analytics?.trends?.passRate)}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {qualityData?.analytics?.trends?.passRate || 'stable'}
                  </span>
                </div>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {qualityData?.summary?.totalTests || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {qualityData?.summary?.totalInspections || 0} inspections
                </p>
              </div>
              <BeakerIcon className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Defect Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {qualityData?.analytics?.defectRate || 0}%
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(qualityData?.analytics?.trends?.defectRate)}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {qualityData?.analytics?.trends?.defectRate || 'stable'}
                  </span>
                </div>
              </div>
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Inspection Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {qualityData?.analytics?.inspectionTime || 0}min
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(qualityData?.analytics?.trends?.inspectionTime)}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {qualityData?.analytics?.trends?.inspectionTime || 'stable'}
                  </span>
                </div>
              </div>
              <ClockIcon className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="warning">Warning</option>
                <option value="pending">Pending</option>
              </select>

              <select
                value={selectedInspector}
                onChange={(e) => setSelectedInspector(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Inspectors</option>
                {qualityData?.inspectors?.map(inspector => (
                  <option key={inspector} value={inspector}>{inspector}</option>
                ))}
              </select>

              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1h">Last Hour</option>
                <option value="8h">Last 8 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quality Tests */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quality Tests ({filteredTests.length})
            </h2>
          </div>

          <div className="space-y-4">
            {filteredTests.map((test) => (
              <QualityTestCard
                key={test.id}
                test={test}
                onSelect={() => setSelectedTest(test)}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                getTrendIcon={getTrendIcon}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Add Test Modal */}
      <AnimatePresence>
        {showAddTestModal && (
          <AddTestModal
            onClose={() => setShowAddTestModal(false)}
            testTypes={qualityData?.testTypes || []}
            inspectors={qualityData?.inspectors || []}
          />
        )}
      </AnimatePresence>

      {/* Test Details Modal */}
      <AnimatePresence>
        {selectedTest && (
          <TestDetailsModal
            test={selectedTest}
            onClose={() => setSelectedTest(null)}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
            getTrendIcon={getTrendIcon}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Quality Test Card Component
const QualityTestCard = ({ test, onSelect, getStatusColor, getStatusIcon, getTrendIcon }) => {
  const resultPercentage = (test.result / test.target) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {test.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {test.id} â€¢ {test.type} â€¢ {test.batchId}
          </p>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <UserIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{test.inspector}</span>
            </div>
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(test.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {getTrendIcon(test.trend)}
            <span className="text-sm text-gray-600 dark:text-gray-400">{test.trend}</span>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(test.status)}`}>
            {test.status}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Result vs Target */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Result vs Target</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {test.result}{test.unit} / {test.target}{test.unit}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                resultPercentage >= 100 ? 'bg-green-500' :
                resultPercentage >= 95 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(resultPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Key Parameters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(test.parameters).slice(0, 4).map(([key, value]) => (
            <div key={key} className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                {typeof value === 'number' ? value.toFixed(2) : value}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {test.notes && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Notes</div>
            <div className="text-sm text-gray-900 dark:text-white">{test.notes}</div>
          </div>
        )}

        {/* Duration */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Duration: {test.duration} minutes</span>
          <span>Product Line: {test.productLine}</span>
        </div>
      </div>
    </motion.div>
  );
};

// Add Test Modal Component
const AddTestModal = ({ onClose, testTypes, inspectors }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    batchId: '',
    productLine: '',
    inspector: '',
    target: '',
    parameters: {},
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    logDebug('Adding test:', formData);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Add New Quality Test
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Test Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Test Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Type</option>
                {testTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Batch ID
              </label>
              <input
                type="text"
                value={formData.batchId}
                onChange={(e) => setFormData(prev => ({ ...prev, batchId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Inspector
              </label>
              <select
                value={formData.inspector}
                onChange={(e) => setFormData(prev => ({ ...prev, inspector: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Inspector</option>
                {inspectors.map(inspector => (
                  <option key={inspector} value={inspector}>{inspector}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Test
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Test Details Modal Component
const TestDetailsModal = ({ test, onClose, getStatusColor, getStatusIcon, getTrendIcon }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {test.name} - Test Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Test Information
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Test ID</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{test.id}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{test.type}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Batch ID</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{test.batchId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Product Line</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{test.productLine}</span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Inspector</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{test.inspector}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Duration</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{test.duration} minutes</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Timestamp</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {new Date(test.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Trend</span>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(test.trend)}
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{test.trend}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Parameters */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Test Parameters
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(test.parameters).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 capitalize mb-1">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {typeof value === 'number' ? value.toFixed(2) : value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Test Results
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {test.result}{test.unit}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Target: {test.target}{test.unit}
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    {getStatusIcon(test.status)}
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(test.status)}`}>
                      {test.status}
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 mb-4">
                  <div
                    className={`h-4 rounded-full transition-all duration-500 ${
                      (test.result / test.target) >= 1 ? 'bg-green-500' :
                      (test.result / test.target) >= 0.95 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((test.result / test.target) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            {test.notes && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Test Notes
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-900 dark:text-white">{test.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2 inline" />
              Edit Test
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QualityControlDashboard;

