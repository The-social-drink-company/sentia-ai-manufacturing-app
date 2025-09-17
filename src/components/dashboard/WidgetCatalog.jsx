import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const widgetTypes = [
  {
    id: 'production-chart',
    name: 'Production Chart',
    description: 'Real-time production flow visualization',
    component: 'ProductionFlowChart',
    icon: '📈',
    category: 'Operations',
  },
  {
    id: 'quality-radar',
    name: 'Quality Radar',
    description: 'Multi-dimensional quality metrics',
    component: 'QualityMetricsChart',
    icon: '🎯',
    category: 'Quality',
  },
  {
    id: 'inventory-bars',
    name: 'Inventory Levels',
    description: 'Current inventory status by category',
    component: 'InventoryChart',
    icon: '📦',
    category: 'Inventory',
  },
  {
    id: 'working-capital',
    name: 'Working Capital',
    description: 'Financial metrics and cash flow',
    component: 'WorkingCapitalChart',
    icon: '💰',
    category: 'Finance',
  },
  {
    id: 'oee-gauge',
    name: 'OEE Gauge',
    description: 'Overall Equipment Effectiveness',
    component: 'OEEGauge',
    icon: '⚙️',
    category: 'Operations',
  },
  {
    id: 'alert-feed',
    name: 'Alert Feed',
    description: 'Real-time alerts and notifications',
    component: 'AlertFeed',
    icon: '🔔',
    category: 'Monitoring',
  },
];

const WidgetCatalog = ({ onClose, onAddWidget }) => {
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const categories = ['All', ...new Set(widgetTypes.map(w => w.category))];
  const filteredWidgets = selectedCategory === 'All'
    ? widgetTypes
    : widgetTypes.filter(w => w.category === selectedCategory);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-4xl max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Widget Catalog
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mb-6">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Widget Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWidgets.map(widget => (
              <motion.div
                key={widget.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer border-2 border-transparent hover:border-blue-500 transition-colors"
                onClick={() => {
                  onAddWidget({
                    type: 'chart',
                    title: widget.name,
                    component: widget.component,
                  });
                  onClose();
                }}
              >
                <div className="text-3xl mb-3">{widget.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {widget.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {widget.description}
                </p>
                <span className="inline-block mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                  {widget.category}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WidgetCatalog;