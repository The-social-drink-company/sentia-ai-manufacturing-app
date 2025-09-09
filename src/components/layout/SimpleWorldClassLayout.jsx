import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import EnterpriseHeader from './EnterpriseHeader';

const SimpleWorldClassLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Enterprise Header */}
      <EnterpriseHeader 
        sidebarCollapsed={sidebarCollapsed} 
        onToggleSidebar={toggleSidebar} 
      />

      {/* Main Content Area */}
      <main 
        className="pt-20 min-h-screen transition-all duration-300"
        style={{ 
          marginLeft: isMobile ? '0' : '256px' 
        }}
      >
        <div className="p-6">
          {/* Simple content wrapper - no glass effects */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
            {children}
          </div>
        </div>

        {/* Simple back to top button */}
        <button
          className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ↑
        </button>

        {/* Simple status indicator */}
        <div className="fixed bottom-6 left-6 bg-white rounded-lg shadow-sm border border-gray-200 p-3 z-50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="text-sm text-gray-600">System Online</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SimpleWorldClassLayout;