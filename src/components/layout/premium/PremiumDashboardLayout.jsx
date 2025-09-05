
import React from 'react';
import { cn } from '../../../lib/utils';

const PremiumDashboardLayout = ({ 
  children,
  header,
  sidebar,
  className 
}) => {
  return (
    <div className={cn(
      'min-h-screen bg-white',
      'font-[Assistant] antialiased',
      className
    )}>
      {/* Header */}
      {header && (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
          <div className="px-6 py-4">
            {header}
          </div>
        </header>
      )}

      <div className="flex">
        {/* Sidebar */}
        {sidebar && (
          <aside className="hidden lg:block w-64 border-r border-gray-100 bg-gray-50">
            <div className="p-6">
              {sidebar}
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export { PremiumDashboardLayout };
