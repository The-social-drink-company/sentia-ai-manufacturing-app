/**
 * ProgressTracker Component
 *
 * Real-time progress tracking with SSE integration
 * Displays progress bar and live statistics
 */

import { useEffect, useState } from 'react';
import { useSSE } from '@/hooks/useSSE';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function ProgressTracker({
  jobId,
  type = 'import', // 'import' or 'export'
  onComplete,
  onError,
}) {
  const [status, setStatus] = useState('PENDING');
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({
    processedRows: 0,
    succeededRows: 0,
    failedRows: 0,
  });

  // Connect to SSE endpoint
  const { data, connected, error: sseError } = useSSE(
    `${type}/${jobId}`,
    {
      enabled: !!jobId,
      onMessage: (message) => {
        console.log(`SSE ${type} event:`, message);

        if (message.type === `${type}:started`) {
          setStatus('IMPORTING');
        } else if (message.type === `${type}:progress`) {
          setProgress(message.data.progress || 0);
          if (message.data.processedRows !== undefined) {
            setStats({
              processedRows: message.data.processedRows || 0,
              succeededRows: message.data.succeededRows || 0,
              failedRows: message.data.failedRows || 0,
            });
          }
        } else if (message.type === `${type}:completed`) {
          setStatus('COMPLETED');
          setProgress(100);
          if (message.data.succeededRows !== undefined) {
            setStats({
              processedRows: message.data.totalRows || message.data.processedRows || 0,
              succeededRows: message.data.succeededRows || 0,
              failedRows: message.data.failedRows || 0,
            });
          }
          if (onComplete) {
            onComplete(message.data);
          }
        } else if (message.type === `${type}:failed`) {
          setStatus('FAILED');
          if (onError) {
            onError(message.data.error || 'Import failed');
          }
        }
      },
    }
  );

  // Update from SSE data
  useEffect(() => {
    if (data) {
      if (data.status) setStatus(data.status);
      if (data.progress !== undefined) setProgress(data.progress);
      if (data.processedRows !== undefined) {
        setStats({
          processedRows: data.processedRows || 0,
          succeededRows: data.succeededRows || 0,
          failedRows: data.failedRows || 0,
        });
      }
    }
  }, [data]);

  const getStatusColor = () => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600';
      case 'FAILED':
        return 'text-red-600';
      case 'IMPORTING':
      case 'EXPORTING':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="h-8 w-8 text-green-600" />;
      case 'FAILED':
        return <XCircleIcon className="h-8 w-8 text-red-600" />;
      case 'IMPORTING':
      case 'EXPORTING':
        return <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin" />;
      default:
        return <ArrowPathIcon className="h-8 w-8 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'PENDING':
        return 'Starting...';
      case 'IMPORTING':
        return 'Importing data...';
      case 'EXPORTING':
        return 'Generating export...';
      case 'COMPLETED':
        return 'Completed successfully!';
      case 'FAILED':
        return 'Failed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {getStatusIcon()}
          <div>
            <h3 className={`text-lg font-semibold ${getStatusColor()}`}>
              {getStatusText()}
            </h3>
            {!connected && status !== 'COMPLETED' && status !== 'FAILED' && (
              <p className="text-sm text-gray-500">Connecting to server...</p>
            )}
            {connected && status !== 'COMPLETED' && status !== 'FAILED' && (
              <p className="text-sm text-gray-500">Live updates enabled</p>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{progress}%</div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${
              status === 'COMPLETED'
                ? 'bg-green-500'
                : status === 'FAILED'
                ? 'bg-red-500'
                : 'bg-blue-500'
            } ${status === 'IMPORTING' || status === 'EXPORTING' ? 'animate-pulse' : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {status === 'IMPORTING' || status === 'EXPORTING' && progress < 100 && (
          <p className="text-xs text-gray-500 text-center">
            This may take a few moments. Please don't close this window.
          </p>
        )}
      </div>

      {/* Statistics (for imports) */}
      {type === 'import' && stats.processedRows > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.processedRows}
            </div>
            <div className="text-xs text-gray-500 mt-1">Processed</div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.succeededRows}
            </div>
            <div className="text-xs text-green-700 mt-1">Succeeded</div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {stats.failedRows}
            </div>
            <div className="text-xs text-red-700 mt-1">Failed</div>
          </div>
        </div>
      )}

      {/* Connection Error */}
      {sseError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                Real-time updates unavailable
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Connection to server lost. Progress will update when you refresh the page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {status === 'COMPLETED' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-800">
                {type === 'import' ? 'Import' : 'Export'} completed successfully!
              </h4>
              <p className="text-sm text-green-700 mt-1">
                {type === 'import'
                  ? `${stats.succeededRows} rows imported successfully${
                      stats.failedRows > 0 ? `, ${stats.failedRows} rows failed` : ''
                    }.`
                  : 'Your export is ready for download.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {status === 'FAILED' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <XCircleIcon className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">
                {type === 'import' ? 'Import' : 'Export'} failed
              </h4>
              <p className="text-sm text-red-700 mt-1">
                {sseError || 'An error occurred during processing. Please try again.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
