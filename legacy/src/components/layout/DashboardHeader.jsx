import React from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const DashboardHeader = ({ isEditMode, onToggleEdit, onOpenWidgetCatalog }) => {
  const currentTime = new Date().toLocaleString();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Enterprise Manufacturing Dashboard
          </h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentTime}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleEdit}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isEditMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {isEditMode ? 'Exit Edit Mode' : 'Edit Dashboard'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenWidgetCatalog}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Add Widget
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              localStorage.setItem('dashboardLayouts', JSON.stringify({}));
              toast.success('Dashboard reset to default layout');
              window.location.reload();
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Reset Layout
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
