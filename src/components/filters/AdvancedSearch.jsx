import React, { useState, useEffect, useRef } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  StarIcon,
  DocumentTextIcon,
  TagIcon,
  UserIcon,
  CalendarDaysIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const AdvancedSearch = ({
  onSearch,
  onFilterChange,
  searchFields = [],
  recentSearches = [],
  savedSearches = [],
  onSaveSearch = null,
  onDeleteSearch = null,
  placeholder = "Search...",
  showRecentSearches = true,
  showSavedSearches = true,
  showAdvancedFilters = false,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchHistory, setSearchHistory] = useState(recentSearches);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [searchFilters, setSearchFilters] = useState({});
  const [isSearching, setIsSearching] = useState(false);

  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Search suggestions based on query
  const suggestions = React.useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    
    const queryLower = query.toLowerCase();
    const results = [];

    // Add matching search history
    searchHistory.forEach(search => {
      if (search.query.toLowerCase().includes(queryLower) && !results.find(r => r.query === search.query)) {
        results.push({ ...search, type: 'history' });
      }
    });

    // Add matching saved searches
    savedSearches.forEach(search => {
      if (search.name.toLowerCase().includes(queryLower) && !results.find(r => r.query === search.query)) {
        results.push({ ...search, type: 'saved' });
      }
    });

    // Add field-specific suggestions
    searchFields.forEach(field => {
      if (field.suggestions) {
        field.suggestions.forEach(suggestion => {
          if (suggestion.toLowerCase().includes(queryLower) && !results.find(r => r.query === suggestion)) {
            results.push({
              query: suggestion,
              type: 'suggestion',
              field: field.key,
              fieldLabel: field.label
            });
          }
        });
      }
    });

    return results.slice(0, 10); // Limit to 10 suggestions
  }, [query, searchHistory, savedSearches, searchFields]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (searchQuery = query, filters = searchFilters) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    
    try {
      // Add to search history
      const newSearch = {
        query: searchQuery.trim(),
        timestamp: Date.now(),
        filters: { ...filters }
      };
      
      setSearchHistory(prev => {
        const filtered = prev.filter(s => s.query !== searchQuery.trim());
        return [newSearch, ...filtered].slice(0, 10); // Keep only last 10
      });

      // Perform search
      if (onSearch) {
        await onSearch(searchQuery.trim(), filters);
      }
    } finally {
      setIsSearching(false);
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestion(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
          const suggestion = suggestions[selectedSuggestion];
          setQuery(suggestion.query);
          handleSearch(suggestion.query, suggestion.filters || {});
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
        searchInputRef.current?.blur();
        break;
    }
  };

  const selectSuggestion = (suggestion) => {
    setQuery(suggestion.query);
    if (suggestion.filters) {
      setSearchFilters(suggestion.filters);
    }
    handleSearch(suggestion.query, suggestion.filters || {});
  };

  const clearSearch = () => {
    setQuery('');
    setSearchFilters({});
    if (onSearch) {
      onSearch('', {});
    }
  };

  const saveCurrentSearch = () => {
    if (onSaveSearch && query.trim()) {
      const searchName = prompt('Save search as:');
      if (searchName?.trim()) {
        onSaveSearch({
          name: searchName.trim(),
          query: query.trim(),
          filters: { ...searchFilters },
          timestamp: Date.now()
        });
      }
    }
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'history':
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
      case 'saved':
        return <StarIcon className="h-4 w-4 text-yellow-500" />;
      case 'suggestion':
        return <TagIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isSearching ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          ) : (
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setSelectedSuggestion(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim() || suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
          {query && (
            <button
              onClick={clearSearch}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          
          {showAdvancedFilters && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-1 ${isExpanded ? 'text-blue-600' : 'text-gray-400'} hover:text-blue-600`}
            >
              <FunnelIcon className="h-4 w-4" />
            </button>
          )}
          
          {query && onSaveSearch && (
            <button
              onClick={saveCurrentSearch}
              className="p-1 text-gray-400 hover:text-yellow-500"
              title="Save search"
            >
              <StarIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || query.length < 2) && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {/* Quick Actions */}
          {query.trim() && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-600">
              <button
                onClick={() => handleSearch()}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center space-x-3"
              >
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm">
                  Search for "<strong>{query}</strong>"
                </span>
              </button>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => selectSuggestion(suggestion)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 ${
                    selectedSuggestion === index ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  {getSuggestionIcon(suggestion.type)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {suggestion.query}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {suggestion.type === 'history' && `Search history • ${formatTimestamp(suggestion.timestamp)}`}
                      {suggestion.type === 'saved' && `Saved search • ${formatTimestamp(suggestion.timestamp)}`}
                      {suggestion.type === 'suggestion' && `${suggestion.fieldLabel} suggestion`}
                    </div>
                  </div>
                  {suggestion.type === 'saved' && onDeleteSearch && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSearch(suggestion.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {query.length < 2 && showRecentSearches && searchHistory.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Recent Searches
              </div>
              {searchHistory.slice(0, 5).map((search, index) => (
                <button
                  key={index}
                  onClick={() => selectSuggestion(search)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                >
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {search.query}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(search.timestamp)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Saved Searches */}
          {query.length < 2 && showSavedSearches && savedSearches.length > 0 && (
            <div className="py-2 border-t border-gray-200 dark:border-gray-600">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Saved Searches
              </div>
              {savedSearches.slice(0, 5).map((search, index) => (
                <button
                  key={index}
                  onClick={() => selectSuggestion(search)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                >
                  <StarIcon className="h-4 w-4 text-yellow-500" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {search.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {search.query} • {formatTimestamp(search.timestamp)}
                    </div>
                  </div>
                  {onDeleteSearch && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSearch(search.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Advanced Filters */}
      {isExpanded && showAdvancedFilters && (
        <div className="absolute z-40 w-full mt-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Search Filters
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchFields.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={searchFilters[field.key] || ''}
                    onChange={(e) => {
                      const newFilters = { ...searchFilters };
                      if (e.target.value) {
                        newFilters[field.key] = e.target.value;
                      } else {
                        delete newFilters[field.key];
                      }
                      setSearchFilters(newFilters);
                      if (onFilterChange) {
                        onFilterChange(newFilters);
                      }
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Any {field.label}</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={searchFilters[field.key] || ''}
                    onChange={(e) => {
                      const newFilters = { ...searchFilters };
                      if (e.target.value) {
                        newFilters[field.key] = e.target.value;
                      } else {
                        delete newFilters[field.key];
                      }
                      setSearchFilters(newFilters);
                      if (onFilterChange) {
                        onFilterChange(newFilters);
                      }
                    }}
                    placeholder={field.placeholder}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => {
                setSearchFilters({});
                if (onFilterChange) {
                  onFilterChange({});
                }
              }}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Clear Filters
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;