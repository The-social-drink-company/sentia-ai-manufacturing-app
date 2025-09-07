import React, { useState } from 'react';
import {
  DocumentArrowDownIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ChartBarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

const Templates = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const templates = [
    {
      id: 1,
      name: 'Production Data Import',
      description: 'Template for importing daily production data including units, efficiency, and quality metrics',
      category: 'production',
      type: 'csv',
      size: '2KB',
      downloads: 156,
      lastUpdated: '2025-09-01',
      fields: ['Date', 'Product ID', 'Units Produced', 'Efficiency %', 'Quality Score']
    },
    {
      id: 2,
      name: 'Inventory Management',
      description: 'Excel template for tracking inventory levels, reorder points, and supplier information',
      category: 'inventory',
      type: 'xlsx',
      size: '15KB',
      downloads: 89,
      lastUpdated: '2025-08-28',
      fields: ['SKU', 'Product Name', 'Current Stock', 'Reorder Point', 'Supplier', 'Unit Cost']
    },
    {
      id: 3,
      name: 'Quality Control Report',
      description: 'Standardized format for quality control test results and non-conformance reports',
      category: 'quality',
      type: 'csv',
      size: '3KB',
      downloads: 124,
      lastUpdated: '2025-09-05',
      fields: ['Test Date', 'Batch ID', 'Test Type', 'Result', 'Pass/Fail', 'Inspector']
    },
    {
      id: 4,
      name: 'Financial Summary',
      description: 'Monthly financial summary template including revenue, costs, and profit analysis',
      category: 'financial',
      type: 'xlsx',
      size: '25KB',
      downloads: 203,
      lastUpdated: '2025-09-03',
      fields: ['Month', 'Revenue', 'COGS', 'Operating Expenses', 'Net Profit', 'Margin %']
    },
    {
      id: 5,
      name: 'Working Capital Analysis',
      description: 'Template for analyzing working capital components and cash flow projections',
      category: 'financial',
      type: 'xlsx',
      size: '18KB',
      downloads: 67,
      lastUpdated: '2025-08-30',
      fields: ['Period', 'Current Assets', 'Current Liabilities', 'Working Capital', 'Cash Flow']
    },
    {
      id: 6,
      name: 'Demand Forecast Data',
      description: 'Historical sales data template for demand forecasting algorithms',
      category: 'forecasting',
      type: 'csv',
      size: '8KB',
      downloads: 91,
      lastUpdated: '2025-09-02',
      fields: ['Date', 'Product', 'Sales Quantity', 'Price', 'Seasonality Factor', 'Promotions']
    }
  ];

  const categories = [
    { value: 'all', label: 'All Templates', count: templates.length },
    { value: 'production', label: 'Production', count: templates.filter(t => t.category === 'production').length },
    { value: 'inventory', label: 'Inventory', count: templates.filter(t => t.category === 'inventory').length },
    { value: 'quality', label: 'Quality', count: templates.filter(t => t.category === 'quality').length },
    { value: 'financial', label: 'Financial', count: templates.filter(t => t.category === 'financial').length },
    { value: 'forecasting', label: 'Forecasting', count: templates.filter(t => t.category === 'forecasting').length }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'xlsx':
        return <TableCellsIcon className="h-5 w-5 text-green-600" />;
      case 'csv':
        return <DocumentTextIcon className="h-5 w-5 text-blue-600" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'production':
        return <ChartBarIcon className="h-4 w-4 text-blue-500" />;
      case 'inventory':
        return <TableCellsIcon className="h-4 w-4 text-green-500" />;
      case 'quality':
        return <DocumentTextIcon className="h-4 w-4 text-purple-500" />;
      case 'financial':
        return <ChartBarIcon className="h-4 w-4 text-yellow-500" />;
      case 'forecasting':
        return <ChartBarIcon className="h-4 w-4 text-red-500" />;
      default:
        return <FolderIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleDownload = (templateId, templateName) => {
    // In a real implementation, this would trigger a file download
    console.log(`Downloading template: ${templateName}`);
    // You could make an API call here to track downloads and serve the actual file
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Import Templates
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Download standardized templates for data import and analysis
          </p>
        </div>
        
        <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
          <PlusIcon className="h-4 w-4 mr-2" />
          Request Template
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        
        <div className="flex space-x-2">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.value
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow border dark:border-gray-700"
          >
            <div className="p-6">
              {/* Template Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(template.type)}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {getCategoryIcon(template.category)}
                      <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {template.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {template.description}
              </p>

              {/* Template Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Size:</span>
                  <span className="text-gray-900 dark:text-white">{template.size}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Downloads:</span>
                  <span className="text-gray-900 dark:text-white">{template.downloads}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Updated:</span>
                  <span className="text-gray-900 dark:text-white">{template.lastUpdated}</span>
                </div>
              </div>

              {/* Fields Preview */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Template Fields:
                </h4>
                <div className="flex flex-wrap gap-1">
                  {template.fields.slice(0, 3).map((field, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 rounded"
                    >
                      {field}
                    </span>
                  ))}
                  {template.fields.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 rounded">
                      +{template.fields.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={() => handleDownload(template.id, template.name)}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Download Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No templates found
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search criteria or category filter.
          </p>
        </div>
      )}
    </div>
  );
};

export default Templates;