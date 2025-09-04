'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, 
  Users, 
  Settings, 
  Code, 
  GraduationCap,
  ChevronRight,
  ChevronDown,
  Search,
  Menu,
  X
} from 'lucide-react';
import { SearchModal } from './SearchModal';
import clsx from 'clsx';

const navigationSections = [
  {
    title: 'User Guides',
    icon: BookOpen,
    items: [
      { title: 'Viewer Guide', href: '/guides/viewer-guide', role: 'Viewer' },
      { title: 'Operator Guide', href: '/guides/operator-guide', role: 'Operator' },
      { title: 'Manager Guide', href: '/guides/manager-guide', role: 'Manager' },
      { title: 'Admin Guide', href: '/guides/admin-guide', role: 'Admin' },
    ]
  },
  {
    title: 'Administration',
    icon: Settings,
    items: [
      { title: 'User Management', href: '/admin/user-management' },
      { title: 'Integrations', href: '/admin/integrations' },
      { title: 'Maintenance', href: '/admin/maintenance' },
      { title: 'Backups & Recovery', href: '/admin/backups' },
    ]
  },
  {
    title: 'Developer',
    icon: Code,
    items: [
      { title: 'Architecture', href: '/developer/architecture' },
      { title: 'API Reference', href: '/developer/api-reference' },
      { title: 'Data Models', href: '/developer/data-models' },
      { title: 'CI/CD & Deployment', href: '/developer/ci-cd' },
      { title: 'Testing', href: '/developer/testing' },
    ]
  },
  {
    title: 'Training',
    icon: GraduationCap,
    items: [
      { title: 'Quick Start', href: '/training/quickstart' },
      { title: 'Video Tutorials', href: '/training/tutorials' },
      { title: 'Interactive Guides', href: '/training/interactive' },
      { title: 'Glossary', href: '/training/glossary' },
      { title: 'Troubleshooting', href: '/training/troubleshooting' },
    ]
  }
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'User Guides': true,
    'Training': true,
  });
  const pathname = usePathname();

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 bg-white rounded-md shadow-md border border-gray-200"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Sidebar */}
      <nav className={clsx(
        "fixed inset-y-0 left-0 z-40 w-80 bg-docs-sidebar border-r border-docs-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-docs-border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <BookOpen size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Sentia Docs</h1>
                <p className="text-xs text-gray-500">v{process.env.NEXT_PUBLIC_DOCS_VERSION}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-docs-border">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center space-x-2 px-3 py-2 text-left text-gray-500 bg-white rounded-md border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <Search size={16} />
              <span className="text-sm">Search documentation...</span>
              <div className="ml-auto flex space-x-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 rounded">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 rounded">K</kbd>
              </div>
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              {navigationSections.map((section) => {
                const Icon = section.icon;
                const isExpanded = expandedSections[section.title];

                return (
                  <div key={section.title}>
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="flex items-center justify-between w-full p-2 text-left text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Icon size={18} />
                        <span className="font-medium">{section.title}</span>
                      </div>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {isExpanded && (
                      <div className="ml-6 mt-2 space-y-1">
                        {section.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={clsx(
                              "flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                              isActive(item.href)
                                ? "bg-primary-50 text-primary-700 border-r-2 border-primary-600"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            )}
                          >
                            <span>{item.title}</span>
                            {'role' in item && (
                              <span className={clsx(
                                "px-2 py-0.5 text-xs rounded-full",
                                item.role === 'Admin' && "bg-red-100 text-red-700",
                                item.role === 'Manager' && "bg-blue-100 text-blue-700",
                                item.role === 'Operator' && "bg-green-100 text-green-700",
                                item.role === 'Viewer' && "bg-gray-100 text-gray-700"
                              )}>
                                {item.role}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-docs-border">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Made with ❤️ by Sentia</span>
              <Link 
                href={process.env.NEXT_PUBLIC_APP_URL || '#'} 
                className="text-primary-600 hover:text-primary-700"
              >
                App →
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}