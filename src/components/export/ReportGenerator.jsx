import React, { useState, useMemo } from 'react';
import {
  DocumentArrowDownIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  TableCellsIcon,
  PhotoIcon,
  FolderArrowDownIcon
} from '@heroicons/react/24/outline';
import { ExportUtility } from './ExportUtility';

const ReportGenerator = ({
  data = [],
  title = 'Report',
  availableFields = [],
  onDataFetch = null,
  onReportGenerated = null,
  className = ''
}) => {
  const [reportConfig, setReportConfig] = useState({
    title: title,
    format: 'pdf',
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    },
    fields: availableFields.slice(0, 8).map(field => field.key), // Default to first 8 fields
    groupBy: '',
    sortBy: '',
    sortOrder: 'asc',
    includeCharts: true,
    includeSummary: true,
    customFilters: {}
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);

  // Memoized processed data based on config
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply date range filter
    if (reportConfig.dateRange.from || reportConfig.dateRange.to) {
      result = result.filter(item => {
        const itemDate = new Date(item.date || item.createdAt || item.timestamp);
        const fromDate = reportConfig.dateRange.from ? new Date(reportConfig.dateRange.from) : null;
        const toDate = reportConfig.dateRange.to ? new Date(reportConfig.dateRange.to) : null;

        if (fromDate && itemDate < fromDate) return false;
        if (toDate && itemDate > toDate) return false;
        return true;
      });
    }

    // Apply custom filters
    Object.entries(reportConfig.customFilters).forEach(([field, value]) => {
      if (value) {
        result = result.filter(item => {
          const itemValue = item[field];
          if (typeof value === 'string') {
            return String(itemValue).toLowerCase().includes(value.toLowerCase());
          }
          return itemValue === value;
        });
      }
    });

    // Apply sorting
    if (reportConfig.sortBy) {
      result.sort((a, b) => {
        const aValue = a[reportConfig.sortBy];
        const bValue = b[reportConfig.sortBy];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else {
          comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }

        return reportConfig.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // Filter to selected fields only
    if (reportConfig.fields.length > 0) {
      result = result.map(item => {
        const filteredItem = {};
        reportConfig.fields.forEach(field => {
          filteredItem[field] = item[field];
        });
        return filteredItem;
      });
    }

    return result;
  }, [data, reportConfig]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (processedData.length === 0) return {};

    const stats = {
      totalRecords: processedData.length,
      dateRange: `${reportConfig.dateRange.from} to ${reportConfig.dateRange.to}`
    };

    // Calculate numeric field statistics
    availableFields.forEach(field => {
      if (field.type === 'number' && reportConfig.fields.includes(field.key)) {
        const values = processedData
          .map(item => item[field.key])
          .filter(val => val !== null && val !== undefined && !isNaN(val));

        if (values.length > 0) {
          stats[`${field.key}_total`] = values.reduce((sum, val) => sum + val, 0);
          stats[`${field.key}_avg`] = stats[`${field.key}_total`] / values.length;
          stats[`${field.key}_min`] = Math.min(...values);
          stats[`${field.key}_max`] = Math.max(...values);
        }
      }
    });

    return stats;
  }, [processedData, availableFields, reportConfig.fields]);

  const handleConfigChange = (key, value) => {
    setReportConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFieldToggle = (fieldKey) => {
    setReportConfig(prev => ({
      ...prev,
      fields: prev.fields.includes(fieldKey)
        ? prev.fields.filter(f => f !== fieldKey)
        : [...prev.fields, fieldKey]
    }));
  };

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Fetch fresh data if needed
      let reportData = processedData;
      if (onDataFetch) {
        reportData = await onDataFetch(reportConfig);
      }

      // Create report object
      const report = {
        title: reportConfig.title,
        generatedAt: new Date().toISOString(),
        config: reportConfig,
        summary: {
          ...summaryStats,
          recordsIncluded: reportData.length
        },
        data: reportData
      };

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${reportConfig.title.toLowerCase().replace(/\s+/g, '_')}_${timestamp}`;

      // Export based on format
      await ExportUtility.exportReport(report, reportConfig.format, {
        filename,
        columns: reportConfig.fields,
        title: reportConfig.title,
        orientation: reportData.length > 100 ? 'landscape' : 'portrait'
      });

      // Add to report history
      const historyItem = {
        id: Date.now(),
        title: reportConfig.title,
        format: reportConfig.format,
        recordCount: reportData.length,
        generatedAt: new Date(),
        config: { ...reportConfig }
      };
      setReportHistory(prev => [historyItem, ...prev.slice(0, 9)]);

      // Notify parent component
      if (onReportGenerated) {
        onReportGenerated(report);
      }

    } catch (error) {
      console.error('Report generation failed:', error);
      alert('Failed to generate report: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatOptions = [
    { value: 'pdf', label: 'PDF Document', icon: DocumentTextIcon },
    { value: 'excel', label: 'Excel Spreadsheet', icon: TableCellsIcon },
    { value: 'csv', label: 'CSV File', icon: DocumentArrowDownIcon },
    { value: 'json', label: 'JSON Data', icon: FolderArrowDownIcon }
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Report Generator
            </h3>
          </div>
          
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            <span>{showAdvanced ? 'Basic' : 'Advanced'}</span>
          </button>
        </div>

        {/* Basic Configuration */}
        <div className="space-y-6">
          {/* Report Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Title
            </label>
            <input
              type="text"
              value={reportConfig.title}
              onChange={(e) => handleConfigChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter report title..."
            />
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {formatOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleConfigChange('format', option.value)}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    reportConfig.format === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <option.icon className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={reportConfig.dateRange.from}
                  onChange={(e) => handleConfigChange('dateRange', {
                    ...reportConfig.dateRange,
                    from: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={reportConfig.dateRange.to}
                  onChange={(e) => handleConfigChange('dateRange', {
                    ...reportConfig.dateRange,
                    to: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Advanced Configuration */}
          {showAdvanced && (
            <>
              {/* Field Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Include Fields ({reportConfig.fields.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                  <div className="space-y-2">
                    {availableFields.map(field => (
                      <label key={field.key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={reportConfig.fields.includes(field.key)}
                          onChange={() => handleFieldToggle(field.key)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {field.label}
                        </span>
                        {field.type && (
                          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                            {field.type}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sorting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={reportConfig.sortBy}
                    onChange={(e) => handleConfigChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">No sorting</option>
                    {availableFields.map(field => (
                      <option key={field.key} value={field.key}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort Order
                  </label>
                  <select
                    value={reportConfig.sortOrder}
                    onChange={(e) => handleConfigChange('sortOrder', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>

              {/* Report Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Options
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={reportConfig.includeSummary}
                      onChange={(e) => handleConfigChange('includeSummary', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Include summary statistics
                    </span>
                  </label>
                  {reportConfig.format === 'pdf' && (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={reportConfig.includeCharts}
                        onChange={(e) => handleConfigChange('includeCharts', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Include charts and visualizations
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Report Preview */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Report Preview
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Records:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {processedData.length.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Fields:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {reportConfig.fields.length}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Format:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {reportConfig.format.toUpperCase()}
                </span>
              </div>
            </div>
            
            {reportConfig.includeSummary && Object.keys(summaryStats).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-500 mb-2">Summary Statistics</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(summaryStats).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <span className="text-gray-500">{key.replace(/_/g, ' ')}:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {isGenerating ? 'Generating report...' : `Ready to generate ${reportConfig.format.toUpperCase()} report`}
            </div>
            
            <button
              onClick={generateReport}
              disabled={isGenerating || reportConfig.fields.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  <span>Generate Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Report History */}
        {reportHistory.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Recent Reports
            </h4>
            <div className="space-y-2">
              {reportHistory.slice(0, 5).map(report => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {report.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {report.format.toUpperCase()} • {report.recordCount} records • {
                          new Date(report.generatedAt).toLocaleString()
                        }
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setReportConfig(report.config)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Use Config
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportGenerator;