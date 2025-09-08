import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EnterpriseNavigation from './EnterpriseNavigation';
import EnterpriseHeader from './EnterpriseHeader';

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
    collapsed: {
      marginLeft: isMobile ? '0' : '5rem',
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    },
    expanded: {
      marginLeft: isMobile ? '0' : '23rem',
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.1)_1px,transparent_0)] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30" />
      </div>

      {/* Enterprise Navigation Sidebar */}
      <EnterpriseNavigation 
        isCollapsed={sidebarCollapsed} 
        onToggleCollapse={toggleSidebar} 
      />

      {/* Enterprise Header */}
      <EnterpriseHeader 
        sidebarCollapsed={sidebarCollapsed} 
        onToggleSidebar={toggleSidebar} 
      />

      {/* Main Content Area */}
      <motion.main
        variants={mainContentVariants}
        animate={sidebarCollapsed ? "collapsed" : "expanded"}
        className="pt-20 min-h-screen relative z-10"
      >
        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="p-8"
        >
          {/* Content Container with Glass Effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="relative bg-white/40 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-black/10 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(248,250,252,0.4) 100%)'
            }}
          >
            {/* Content Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
            
            {/* Content */}
            <div className="relative z-10">
              {children}
            </div>

            {/* Animated Border Effect */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{
                background: 'linear-gradient(45deg, transparent, rgba(59,130,246,0.1), transparent, rgba(147,51,234,0.1), transparent)',
                backgroundSize: '400% 400%'
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </motion.div>
        </motion.div>

        {/* Floating Action Button */}
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 300 }}
          whileHover={{ scale: 1.1, y: -5 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center z-50 group"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </motion.div>
          
          {/* Glow Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-50"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.button>

        {/* Performance Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="fixed bottom-8 left-8 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg p-4 z-50"
        >
          <div className="flex items-center space-x-3">
            <motion.div
              className="w-3 h-3 bg-green-500 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <div className="text-sm">
              <div className="font-semibold text-gray-900">System Status</div>
              <div className="text-gray-600">Optimal Performance</div>
            </div>
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
};

export default WorldClassLayout;