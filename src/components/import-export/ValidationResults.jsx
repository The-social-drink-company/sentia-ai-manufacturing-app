/**
 * ValidationResults Component
 *
 * Displays validation results with error and warning details
 * Supports filtering, sorting, and error report download
 */

import { useState } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

export default function ValidationResults({ validation }) {
  const [filterType, setFilterType] = useState('all'); // all, errors, warnings
  const [sortBy, setSort By] = useState('rowNumber'); // rowNumber, type

  if (!validation) {
    return null;
  }

  const { totalRows, validRows, invalidRows, errors = [], warnings = [] } = validation;

  // Filter errors
  const filteredErrors =
    filterType === 'all'
      ? errors
      : filterType === 'errors'
      ? errors.filter((e) => e.errors && e.errors.length > 0)
      : [];

  // Sort errors
  const sortedErrors = [...filteredErrors].sort((a, b) => {
    if (sortBy === 'rowNumber') {
      return a.rowNumber - b.rowNumber;
    }
    return 0;
  });

  const handleDownloadReport = () => {
    // Generate CSV error report
    const csvContent = [
      ['Row Number', 'Field', 'Error Type', 'Message', 'Value'].join(','),
      ...errors.flatMap((rowError) =>
        (rowError.errors || []).map((error) =>
          [
            rowError.rowNumber,
            error.field || '',
            error.type || '',
            `"${(error.message || '').replace(/"/g, '""')}"`,
            `"${(error.value || '').toString().replace(/"/g, '""')}"`,
          ].join(',')
        )
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation-errors-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Rows</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalRows}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Valid Rows</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{validRows}</p>
              <p className="text-xs text-green-600 mt-1">
                {totalRows > 0 ? Math.round((validRows / totalRows) * 100) : 0}% success rate
              </p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Invalid Rows</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{invalidRows}</p>
              <p className="text-xs text-red-600 mt-1">
                {errors.length} validation errors
              </p>
            </div>
            <XCircleIcon className="h-12 w-12 text-red-600" />
          </div>
        </div>
      </div>

      {/* Warnings Section */}
      {warnings && warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {warnings.slice(0, 5).map((warning, index) => (
                    <li key={index}>
                      Row {warning.rowNumber}: {warning.warnings?.[0]?.message || 'Warning'}
                    </li>
                  ))}
                  {warnings.length > 5 && (
                    <li className="text-yellow-600">
                      ...and {warnings.length - 5} more warnings
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Table */}
      {errors.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FunnelIcon className="h-4 w-4 text-gray-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Issues</option>
                  <option value="errors">Errors Only</option>
                </select>
              </div>

              <div className="text-sm text-gray-600">
                Showing {sortedErrors.length} of {errors.length} rows with errors
              </div>
            </div>

            <button
              onClick={handleDownloadReport}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download Report
            </button>
          </div>

          {/* Error List */}
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {sortedErrors.map((rowError, index) => (
              <div key={index} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Row {rowError.rowNumber}
                      </span>
                      <span className="text-xs text-gray-500">
                        {rowError.errors?.length || 0} error{rowError.errors?.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(rowError.errors || []).map((error, errorIndex) => (
                        <div key={errorIndex} className="flex items-start space-x-2">
                          <XCircleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">{error.field}:</span>{' '}
                              {error.message}
                            </p>
                            {error.value !== undefined && error.value !== null && (
                              <p className="text-xs text-gray-500 mt-1">
                                Value: <code className="bg-gray-100 px-1 py-0.5 rounded">{String(error.value)}</code>
                              </p>
                            )}
                            {error.suggestion && (
                              <p className="text-xs text-blue-600 mt-1">
                                💡 {error.suggestion}
                              </p>
                            )}
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {error.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Errors Message */}
      {errors.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-green-900 mb-2">
            All validation checks passed!
          </h3>
          <p className="text-sm text-green-700">
            All {totalRows} rows are valid and ready for import.
          </p>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Next steps:</strong>{' '}
          {errors.length > 0
            ? 'Fix the errors in your file and re-upload, or proceed with "Skip Errors" option to import only valid rows.'
            : 'Your data is ready to import. Click "Next" to proceed with the import.'}
        </p>
      </div>
    </div>
  );
}
