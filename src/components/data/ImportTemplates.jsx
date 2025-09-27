import React from 'react';
import { DocumentArrowDownIcon, TableCellsIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const ImportTemplates = () => {
  const templates = [
    { name: 'Working Capital Template', format: 'XLSX', size: '245 KB', description: 'Template for importing AR/AP and cash flow data' },
    { name: 'Inventory Template', format: 'CSV', size: '128 KB', description: 'Template for bulk inventory import' },
    { name: 'Production Data Template', format: 'XLSX', size: '312 KB', description: 'Template for production metrics and OEE data' },
    { name: 'Quality Metrics Template', format: 'CSV', size: '98 KB', description: 'Template for quality control data import' },
    { name: 'Financial Data Template', format: 'XLSX', size: '456 KB', description: 'Template for comprehensive financial data' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Import Templates</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Download templates for bulk data import into the system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template, __index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                {template.format === 'XLSX' ? (
                  <TableCellsIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                ) : (
                  <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {template.format}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {template.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {template.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-500">
                Size: {template.size}
              </span>
              <button className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          How to use templates
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>Download the template for your data type</li>
          <li>Fill in your data following the column headers</li>
          <li>Save the file in the original format</li>
          <li>Upload via the Data Import page</li>
          <li>Review and confirm the import preview</li>
        </ol>
      </div>
    </div>
  );
};

export default ImportTemplates;