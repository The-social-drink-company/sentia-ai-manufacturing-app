import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import EnterpriseHeader from './EnterpriseHeader';

const AISupportChatbot = lazy(() => import('../chatbot/AISupportChatbot'));

const WorldClassLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const mainContentVariants = {
    default: {
      marginLeft: isMobile ? '0' : '256px', // 256px to match sidebar width
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

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
        className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300"
        style={{
          marginLeft: isMobile ? '0' : sidebarCollapsed ? '64px' : '256px',
          paddingTop: '64px'
        }}
      >
        <div className="p-6">
          {children}
        </div>
      </main>

      {/* AI Support Chatbot - Only on protected dashboard pages */}
      <Suspense fallback={null}>
        <AISupportChatbot />
      </Suspense>

      {/* Simple Scroll to Top Button */}
      <button
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-40"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
};

export default WorldClassLayout;