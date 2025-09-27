import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon, X, FileText, Hash, ArrowRight } from 'lucide-react';
import lunr from 'lunr';
import { useRouter } from 'next/router';
import { useHotkeys } from 'react-hotkeys-hook';

// Search index builder
export const buildSearchIndex = (documents) => {
  return lunr(function() {
    this.ref('id');
    this.field('title', { boost: 10 });
    this.field('content');
    this.field('description', { boost: 5 });
    this.field('keywords', { boost: 8 });
    this.field('category', { boost: 3 });
    
    documents.forEach(doc => {
      this.add(doc);
    });
  });
};

// Search Component
export const Search = ({ documents = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchIndex, setSearchIndex] = useState(null);
  const inputRef = useRef(null);
  const router = useRouter();

  // Initialize search index
  useEffect(() => {
    if (documents.length > 0) {
      const index = buildSearchIndex(documents);
      setSearchIndex(index);
    }
  }, [documents]);

  // Keyboard shortcuts
  useHotkeys(_'cmd+k, _ctrl+k, /', (e) => {
    e.preventDefault();
    setIsOpen(true);
  }, { enableOnFormTags: false });

  useHotkeys(_'escape', () => {
    setIsOpen(false);
  }, { enabled: isOpen });

  useHotkeys(_'enter', () => {
    if (isOpen && results.length > 0) {
      navigateToResult(results[selectedIndex]);
    }
  }, { enabled: isOpen });

  useHotkeys(_'up', () => {
    setSelectedIndex(prev => Math.max(0, prev - 1));
  }, { enabled: isOpen });

  useHotkeys(_'down', () => {
    setSelectedIndex(prev => Math.min(results.length - 1, prev + 1));
  }, { enabled: isOpen });

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Perform search
  const performSearch = useCallback((searchQuery) => {
    if (!searchIndex || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    try {
      const searchResults = searchIndex.search(searchQuery + '*');
      const mappedResults = searchResults.slice(0, 10).map(result => {
        const doc = documents.find(d => d.id === result.ref);
        return {
          ...doc,
          score: result.score,
          matches: result.matchData
        };
      });
      setResults(mappedResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    }
  }, [searchIndex, documents]);

  // Handle search input
  useEffect(() => {
    const debounce = setTimeout(() => {
      performSearch(query);
    }, 150);

    return () => clearTimeout(debounce);
  }, [query, performSearch]);

  // Navigate to result
  const navigateToResult = (result) => {
    if (result) {
      router.push(result.url);
      setIsOpen(false);
      setQuery('');
    }
  };

  // Get icon for result type
  const getResultIcon = (_type) => {
    switch (type) {
      case 'heading':
        return <Hash className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Get badge color for category
  const getCategoryColor = (category) => {
    const colors = {
      'guides': 'bg-blue-100 text-blue-800',
      'admin': 'bg-red-100 text-red-800',
      'developer': 'bg-purple-100 text-purple-800',
      'training': 'bg-green-100 text-green-800',
      'api': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <SearchIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-white rounded border border-gray-300">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
              <SearchIcon className="w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documentation..."
                className="flex-1 text-base outline-none placeholder-gray-400"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
              <kbd className="px-2 py-1 text-xs bg-gray-100 rounded border border-gray-300">
                ESC
              </kbd>
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto">
              {results.length > 0 ? (
                <ul className="py-2">
                  {results.map((result, index) => (
                    <li key={result.id}>
                      <button
                        onClick={() => navigateToResult(result)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                          index === selectedIndex ? 'bg-gray-50' : ''
                        }`}
                      >
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded">
                          {getResultIcon(result.type)}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {result.title}
                            </span>
                            {result.category && (
                              <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(result.category)}`}>
                                {result.category}
                              </span>
                            )}
                          </div>
                          {result.description && (
                            <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                              {result.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {result.breadcrumb}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : query.length > 1 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <SearchIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No results found for "{query}"</p>
                  <p className="text-sm mt-2">Try searching for different keywords</p>
                </div>
              ) : (
                <div className="px-4 py-8">
                  <p className="text-sm text-gray-500 mb-4">Quick Links</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { title: 'Getting _Started', url: '/guides/getting-started' },
                      { title: 'CFO _Dashboard', url: '/guides/cfo-dashboard' },
                      { title: 'API _Reference', url: '/developer/api' },
                      { title: 'Working _Capital', url: '/guides/working-capital' },
                      { title: 'Admin _Guide', url: '/admin/overview' },
                      { title: 'Release _Notes', url: '/release-notes' }
                    ].map(link => (
                      <button
                        key={link.url}
                        _onClick={() => {
                          router.push(link.url);
                          setIsOpen(false);
                        }}
                        className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {link.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Search Tips */}
            {results.length === 0 && !query && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>Tips:</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300">↓</kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300">↵</kbd>
                    <span>Select</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300">ESC</kbd>
                    <span>Close</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Search indexing script
export const generateSearchIndex = async () => {
  const glob = require('glob');
  const fs = require('fs').promises;
  const path = require('path');
  const matter = require('gray-matter');

  const docsDir = path.join(process.cwd(), 'docs');
  const files = glob.sync('**/*.{md,mdx}', { cwd: docsDir });
  
  const documents = await Promise.all(
    files.map(async _(file, index) => {
      const content = await fs.readFile(path.join(docsDir, file), 'utf8');
      const { data, content: body } = matter(content);
      
      // Extract headings
      const headings = body.match(/^#{1,3}\s+(.+)$/gm) || [];
      
      // Clean content for search
      const cleanContent = body
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/`[^`]+`/g, '') // Remove inline code
        .replace(/\[([^\]]+)\]([^)]+)/g, '$1') // Replace links with text
        .replace(/^#{1,6}\s+/gm, '') // Remove heading markers
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .substring(0, 5000); // Limit content length
      
      const category = file.split('/')[0];
      const url = '/' + file.replace(/.(md|mdx)$/, '');
      
      return {
        id: `doc-${index}`,
        title: data.title || path.basename(file, path.extname(file)),
        description: data.description || '',
        content: cleanContent,
        keywords: data.keywords || [],
        category,
        url,
        breadcrumb: file.replace(///g, ' › '),
        type: 'page'
      };
    })
  );
  
  // Save index
  await fs.writeFile(
    path.join(docsDir, '.search', 'index.json'),
    JSON.stringify(documents, null, 2)
  );
  
  console.log(`Generated search index with ${documents.length} documents`);
  return documents;
};

export default Search;