'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Search, File, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSearch } from '@/hooks/useSearch';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const { results, isLoading, search } = useSearch();

  useEffect(() => {
    if (query.trim()) {
      search(query);
    }
  }, [query, search]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open search from Navigation component
        }
      }
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-16">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
                <div className="flex items-center px-4 py-3 border-b border-gray-200">
                  <Search size={20} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documentation..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="ml-3 flex-1 border-none outline-none text-lg placeholder-gray-400"
                    autoFocus
                  />
                  <div className="flex space-x-1 text-xs text-gray-400">
                    <kbd className="px-2 py-1 bg-gray-100 rounded">ESC</kbd>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto p-4">
                  {isLoading && (
                    <div className="text-center py-8">
                      <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-gray-500 mt-2">Searching...</p>
                    </div>
                  )}

                  {!isLoading && query && results.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No results found for "{query}"</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Try searching for different keywords
                      </p>
                    </div>
                  )}

                  {!isLoading && results.length > 0 && (
                    <div className="space-y-2">
                      {results.map((result, index) => (
                        <Link
                          key={index}
                          href={result.href}
                          onClick={onClose}
                          className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <File size={16} className="text-gray-400 mt-1 flex-shrink-0" />
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {result.title}
                              </h3>
                              <ArrowRight size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {result.excerpt}
                            </p>
                            <div className="flex items-center mt-2 space-x-2">
                              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                {result.section}
                              </span>
                              {result.role && (
                                <span className="inline-block px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded">
                                  {result.role}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {!query && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Popular searches</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            'Getting started',
                            'API reference',
                            'User roles',
                            'Troubleshooting',
                            'Forecasting',
                            'Working capital',
                          ].map((term) => (
                            <button
                              key={term}
                              onClick={() => setQuery(term)}
                              className="text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Quick links</h3>
                        <div className="space-y-1">
                          {[
                            { title: 'Quick Start Guide', href: '/training/quickstart' },
                            { title: 'API Documentation', href: '/developer/api-reference' },
                            { title: 'Video Tutorials', href: '/training/tutorials' },
                            { title: 'Troubleshooting', href: '/training/troubleshooting' },
                          ].map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={onClose}
                              className="flex items-center p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                            >
                              <File size={14} className="mr-2" />
                              {link.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}