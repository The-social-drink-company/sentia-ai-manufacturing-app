import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { devLog } from '../../utils/structuredLogger.js';

const CommandPalette = ({ onClose }) => {
  const [query, setQuery] = React.useState('');

  const commands = [
    { id: 1, name: 'Go to Dashboard', action: () => { window.location.href = '/dashboard'; onClose(); } },
    { id: 2, name: 'View Working Capital', action: () => { window.location.href = '/working-capital'; onClose(); } },
    { id: 3, name: 'Open What-If Analysis', action: () => { window.location.href = '/what-if'; onClose(); } },
    { id: 4, name: 'Export Data', action: () => { devLog.log('Exporting...'); onClose(); } },
    { id: 5, name: 'Toggle Theme', action: () => { document.documentElement.classList.toggle('dark'); onClose(); } },
    { id: 6, name: 'Settings', action: () => { window.location.href = '/settings'; onClose(); } },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(query.toLowerCase())
  );

  React.useEffect(() {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-0 w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-2 bg-transparent border-0 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              autoFocus
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.map((cmd) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-gray-900 dark:text-white">{cmd.name}</span>
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            Press ESC to close
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CommandPalette;