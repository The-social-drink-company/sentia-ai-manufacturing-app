import React, { useState, useEffect } from 'react';
import {
  FunnelIcon,
  XMarkIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  BookmarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const AdvancedFilter = ({
  fields = [],
  onFilterChange,
  initialFilters = {},
  savedFilters = [],
  onSaveFilter = null,
  onDeleteFilter = null,
  showSavedFilters = true,
  className = ''
}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSavedFilter, setSelectedSavedFilter] = useState('');
  const [saveFilterName, setSaveFilterName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (value === '' || value === null || (Array.isArray(value) && value.length === 0)) {
        delete newFilters[field];
      } else {
        newFilters[field] = value;
      }
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchTerm('');
    setSelectedSavedFilter('');
  };

  const clearFilter = (field) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[field];
      return newFilters;
    });
  };

  const applySavedFilter = (filterData) => {
    setFilters(filterData.filters);
    setSelectedSavedFilter(filterData.id);
    setSearchTerm(filterData.filters.search || '');
  };

  const saveCurrentFilter = () => {
    if (saveFilterName.trim() && onSaveFilter) {
      onSaveFilter({
        name: saveFilterName.trim(),
        filters: { ...filters, search: searchTerm }
      });
      setSaveFilterName('');
      setShowSaveModal(false);
    }
  };

  const renderFilterField = (field) => {
    const value = filters[field.key] || '';

    switch (field.type) {
      case 'text':
      case 'search':
        return (
          <input
            type="text"
            placeholder={field.placeholder || `Search ${field.label.toLowerCase()}...`}
            value={value}
            onChange={(e) => handleFilterChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFilterChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All {field.label}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) ? value.includes(option.value) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleFilterChange(field.key, [...currentValues, option.value]);
                    } else {
                      handleFilterChange(field.key, currentValues.filter(v => v !== option.value));
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFilterChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        );

      case 'daterange':
        return (
          <div className="space-y-2">
            <input
              type="date"
              placeholder="From date"
              value={value.from || ''}
              onChange={(e) => handleFilterChange(field.key, { ...value, from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="date"
              placeholder="To date"
              value={value.to || ''}
              onChange={(e) => handleFilterChange(field.key, { ...value, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFilterChange(field.key, e.target.value)}
            min={field.min}
            max={field.max}
            step={field.step}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        );

      case 'range':
        return (
          <div className="space-y-2">
            <input
              type="number"
              placeholder={`Min ${field.label.toLowerCase()}`}
              value={value.min || ''}
              onChange={(e) => handleFilterChange(field.key, { ...value, min: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="number"
              placeholder={`Max ${field.label.toLowerCase()}`}
              value={value.max || ''}
              onChange={(e) => handleFilterChange(field.key, { ...value, max: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        );

      case 'boolean':
        return (
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name={field.key}
                value=""
                checked={value === ''}
                onChange={(e) => handleFilterChange(field.key, '')}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">All</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name={field.key}
                value="true"
                checked={value === 'true'}
                onChange={(e) => handleFilterChange(field.key, 'true')}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Yes</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name={field.key}
                value="false"
                checked={value === 'false'}
                onChange={(e) => handleFilterChange(field.key, 'false')}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  const activeFiltersCount = Object.keys(filters).length + (searchTerm ? 1 : 0);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FunnelIcon className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Advanced Filters
            </h3>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {activeFiltersCount} active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Clear All</span>
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Search */}
        <div className="mt-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Quick search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange('search', e.target.value);
              }}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4">
          {/* Saved Filters */}
          {showSavedFilters && savedFilters.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Saved Filters
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedSavedFilter}
                  onChange={(e) => {
                    const savedFilter = savedFilters.find(f => f.id === e.target.value);
                    if (savedFilter) {
                      applySavedFilter(savedFilter);
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select a saved filter...</option>
                  {savedFilters.map((filter) => (
                    <option key={filter.id} value={filter.id}>
                      {filter.name}
                    </option>
                  ))}
                </select>
                {selectedSavedFilter && onDeleteFilter && (
                  <button
                    onClick={() => {
                      onDeleteFilter(selectedSavedFilter);
                      setSelectedSavedFilter('');
                    }}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filter Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {field.label}
                  </label>
                  {filters[field.key] && (
                    <button
                      onClick={() => clearFilter(field.key)}
                      className="text-xs text-gray-500 hover:text-red-600"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {renderFilterField(field)}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {onSaveFilter && (
                <>
                  {!showSaveModal ? (
                    <button
                      onClick={() => setShowSaveModal(true)}
                      className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center space-x-2"
                    >
                      <BookmarkIcon className="h-4 w-4" />
                      <span>Save Filter</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Filter name..."
                        value={saveFilterName}
                        onChange={(e) => setSaveFilterName(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={saveCurrentFilter}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setShowSaveModal(false);
                          setSaveFilterName('');
                        }}
                        className="px-3 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="text-sm text-gray-500">
              {activeFiltersCount > 0 ? (
                `${activeFiltersCount} filter${activeFiltersCount === 1 ? '' : 's'} applied`
              ) : (
                'No filters applied'
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {!isExpanded && activeFiltersCount > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{searchTerm}"
                <button
                  onClick={() => {
                    setSearchTerm('');
                    handleFilterChange('search', '');
                  }}
                  className="ml-1"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {Object.entries(filters).filter(([key]) => key !== 'search').map(([key, value]) => {
              const field = fields.find(f => f.key === key);
              if (!field) return null;
              
              const displayValue = Array.isArray(value) 
                ? `${value.length} selected`
                : typeof value === 'object' 
                  ? `${value.from || '...'} - ${value.to || '...'}`
                  : value;

              return (
                <span key={key} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {field.label}: {displayValue}
                  <button
                    onClick={() => clearFilter(key)}
                    className="ml-1"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilter;