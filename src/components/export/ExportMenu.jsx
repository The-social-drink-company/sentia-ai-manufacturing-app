import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  TableCellsIcon,
  PhotoIcon,
  ChartBarIcon,
  EllipsisVerticalIcon,
  CheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { ExportUtility } from './ExportUtility';
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';


const ExportMenu = ({
  data = [],
  filename = 'export',
  columns = null,
  formatters = {},
  chartRef = null,
  showChartExport = false,
  onExportStart = null,
  onExportComplete = null,
  onExportError = null,
  customOptions = [],
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState({});
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format, options = {}) => {
    const exportId = `${format}-${Date.now()}`;
    
    try {
      setExportStatus(prev => ({ ...prev, [exportId]: 'starting' }));
      
      if (onExportStart) {
        onExportStart(format, options);
      }

      // Prepare data
      let exportData = data;
      if (Object.keys(formatters).length > 0) {
        exportData = ExportUtility.formatDataForExport(data, formatters);
      }

      // Generate timestamped filename
      const timestampedFilename = ExportUtility.generateFilename(filename, format);

      setExportStatus(prev => ({ ...prev, [exportId]: 'processing' }));

      // Export based on format
      switch (format.toLowerCase()) {
        case 'csv':
          await ExportUtility.exportToCSV(exportData, timestampedFilename, columns);
          break;
          
        case 'json':
          await ExportUtility.exportToJSON(exportData, timestampedFilename);
          break;
          
        case 'excel':
        case 'xlsx':
          await ExportUtility.exportToExcel(exportData, timestampedFilename, options.sheetName || 'Data');
          break;
          
        case 'pdf':
          await ExportUtility.exportToPDF(exportData, timestampedFilename, {
            title: options.title || filename,
            columns,
            ...options
          });
          break;
          
        case 'chart-png':
          if (chartRef) {
            const chartFilename = ExportUtility.generateFilename(`${filename}_chart`, 'png');
            await ExportUtility.exportChartAsPNG(chartRef, chartFilename);
          } else {
            throw new Error('Chart reference not available');
          }
          break;
          
        case 'chart-svg':
          if (chartRef) {
            const chartFilename = ExportUtility.generateFilename(`${filename}_chart`, 'svg');
            await ExportUtility.exportChartAsSVG(chartRef, chartFilename);
          } else {
            throw new Error('Chart reference not available');
          }
          break;
          
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      setExportStatus(prev => ({ ...prev, [exportId]: 'completed' }));
      
      if (onExportComplete) {
        onExportComplete(format, timestampedFilename);
      }

      // Clear status after delay
      setTimeout(() => {
        setExportStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[exportId];
          return newStatus;
        });
      }, 3000);

    } catch (error) {
      logError(`Export failed (${format}):`, error);
      setExportStatus(prev => ({ ...prev, [exportId]: 'error' }));
      
      if (onExportError) {
        onExportError(format, error);
      }

      // Clear error status after delay
      setTimeout(() => {
        setExportStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[exportId];
          return newStatus;
        });
      }, 5000);
    }
  };

  const exportOptions = [
    {
      id: 'csv',
      label: 'CSV File',
      description: 'Comma-separated values',
      icon: DocumentArrowDownIcon,
      color: 'text-green-600'
    },
    {
      id: 'excel',
      label: 'Excel Spreadsheet',
      description: 'Microsoft Excel format',
      icon: TableCellsIcon,
      color: 'text-blue-600'
    },
    {
      id: 'pdf',
      label: 'PDF Document',
      description: 'Portable document format',
      icon: DocumentTextIcon,
      color: 'text-red-600'
    },
    {
      id: 'json',
      label: 'JSON Data',
      description: 'JavaScript object notation',
      icon: EllipsisVerticalIcon,
      color: 'text-purple-600'
    }
  ];

  const chartExportOptions = [
    {
      id: 'chart-png',
      label: 'Chart as PNG',
      description: 'High quality image',
      icon: PhotoIcon,
      color: 'text-orange-600'
    },
    {
      id: 'chart-svg',
      label: 'Chart as SVG',
      description: 'Scalable vector graphics',
      icon: ChartBarIcon,
      color: 'text-indigo-600'
    }
  ];

  const allOptions = [
    ...exportOptions,
    ...(showChartExport ? chartExportOptions : []),
    ...customOptions
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'starting':
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />;
      case 'completed':
        return <CheckIcon className="h-4 w-4 text-green-600" />;
      case 'error':
        return <span className="text-red-600">✕</span>;
      default:
        return null;
    }
  };

  const hasActiveExports = Object.keys(exportStatus).length > 0;
  const hasCompletedExports = Object.values(exportStatus).some(status => status === 'completed');

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center space-x-2 ${
          hasActiveExports ? 'ring-2 ring-blue-500' : ''
        }`}
        disabled={!data || data.length === 0}
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        <span>Export</span>
        {hasActiveExports && (
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <div className="p-3">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Export Options
            </div>
            
            {data.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                No data available to export
              </div>
            ) : (
              <div className="space-y-1">
                {allOptions.map((option) => {
                  const currentStatus = Object.entries(exportStatus).find(([key]) => key.startsWith(option.id))?.[1];
                  const isDisabled = option.id.startsWith('chart-') && !chartRef;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => !isDisabled && handleExport(option.id)}
                      disabled={isDisabled}
                      className={`w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-3 ${
                        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <div className={`flex-shrink-0 ${option.color}`}>
                        <option.icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {option.label}
                          </span>
                          {currentStatus && getStatusIcon(currentStatus)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {currentStatus === 'starting' && 'Preparing export...'}
                          {currentStatus === 'processing' && 'Processing data...'}
                          {currentStatus === 'completed' && 'Export completed!'}
                          {currentStatus === 'error' && 'Export failed'}
                          {!currentStatus && option.description}
                          {isDisabled && !currentStatus && 'Chart not available'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {data.length > 0 ? (
                  `${data.length.toLocaleString()} record${data.length === 1 ? '' : 's'} ready for export`
                ) : (
                  'No data to export'
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Export Status Overlay */}
      {hasActiveExports && (
        <div className="absolute -top-2 -right-2">
          <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {Object.values(exportStatus).filter(status => 
              status === 'starting' || status === 'processing'
            ).length}
          </div>
        </div>
      )}
      
      {hasCompletedExports && (
        <div className="absolute -top-2 -right-6">
          <div className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            ✓
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;