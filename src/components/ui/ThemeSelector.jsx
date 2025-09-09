import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon,
  ChevronDownIcon,
  CheckIcon,
  EyeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const ThemeSelector = ({ variant = 'dropdown', size = 'medium' }) => {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const getThemeIcon = (themeName) => {
    const icons = {
      bright: SunIcon,
      medium: ComputerDesktopIcon,
      dark: MoonIcon
    };
    return icons[themeName] || ComputerDesktopIcon;
  };

  const sizes = {
    small: { button: 'p-2', icon: 'w-4 h-4', text: 'text-sm' },
    medium: { button: 'p-3', icon: 'w-5 h-5', text: 'text-base' },
    large: { button: 'p-4', icon: 'w-6 h-6', text: 'text-lg' }
  };

  const currentSize = sizes[size];

  if (variant === 'compact') {
    return (
      <div className="relative">
        <motion.button
          className={`
            ${currentSize.button} rounded-xl bg-elevated border border-light
            hover:bg-tertiary hover:border-normal transition-all duration-200
            flex items-center gap-2 shadow-theme-sm
          `}
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          {React.createElement(getThemeIcon(theme), {
            className: `${currentSize.icon} text-secondary`
          })}
          <ChevronDownIcon 
            className={`w-4 h-4 text-tertiary transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute right-0 top-full mt-2 bg-elevated border border-light rounded-xl shadow-theme-lg z-50 min-w-64"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-2">
                <div className="px-3 py-2 border-b border-light mb-2">
                  <h3 className="font-semibold text-primary flex items-center gap-2">
                    <EyeIcon className="w-4 h-4" />
                    Vision Comfort
                  </h3>
                  <p className="text-xs text-tertiary mt-1">Choose your preferred viewing mode</p>
                </div>
                
                {Object.entries(themes).map(([key, themeData]) => {
                  const Icon = getThemeIcon(key);
                  const isSelected = theme === key;
                  
                  return (
                    <motion.button
                      key={key}
                      className={`
                        w-full p-3 rounded-lg transition-all duration-200 flex items-center gap-3
                        ${isSelected 
                          ? 'bg-primary/10 border border-primary/20 text-primary' 
                          : 'hover:bg-tertiary text-secondary hover:text-primary'
                        }
                      `}
                      onClick={() => {
                        setTheme(key);
                        setIsOpen(false);
                      }}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`
                        p-2 rounded-lg ${isSelected 
                          ? 'bg-primary text-inverse' 
                          : 'bg-secondary text-tertiary'
                        }
                      `}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 text-left">
                        <div className="font-medium flex items-center gap-2">
                          {themeData.name}
                          {isSelected && <CheckIcon className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="text-xs text-tertiary mt-0.5">
                          {themeData.ideal}
                        </div>
                      </div>
                      
                      <span className="text-lg opacity-60">
                        {themeData.icon}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <SparklesIcon className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-primary">Theme Selection</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(themes).map(([key, themeData]) => {
            const Icon = getThemeIcon(key);
            const isSelected = theme === key;
            
            return (
              <motion.button
                key={key}
                className={`
                  p-6 rounded-2xl border-2 transition-all duration-300 text-left
                  ${isSelected 
                    ? 'border-primary bg-primary/5 shadow-theme-md' 
                    : 'border-light bg-elevated hover:border-normal hover:shadow-theme-base'
                  }
                `}
                onClick={() => setTheme(key)}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                layout
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`
                    p-3 rounded-xl ${isSelected 
                      ? 'bg-primary text-inverse' 
                      : 'bg-secondary text-secondary'
                    }
                  `}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-2xl opacity-60">{themeData.icon}</span>
                    {isSelected && (
                      <motion.div
                        className="p-1 rounded-full bg-primary"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <CheckIcon className="w-4 h-4 text-inverse" />
                      </motion.div>
                    )}
                  </div>
                </div>
                
                <h4 className="font-semibold text-primary mb-2">{themeData.name}</h4>
                <p className="text-sm text-secondary mb-3">{themeData.description}</p>
                <p className="text-xs text-tertiary">
                  <span className="font-medium">Best for:</span> {themeData.ideal}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className="relative">
      <motion.button
        className={`
          ${currentSize.button} rounded-xl bg-elevated border border-light
          hover:bg-tertiary hover:border-normal transition-all duration-200
          flex items-center gap-3 shadow-theme-sm min-w-48
        `}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="p-2 rounded-lg bg-secondary">
          {React.createElement(getThemeIcon(theme), {
            className: `${currentSize.icon} text-secondary`
          })}
        </div>
        
        <div className="flex-1 text-left">
          <div className={`font-medium text-primary ${currentSize.text}`}>
            {themes[theme].name}
          </div>
          <div className="text-xs text-tertiary">
            {themes[theme].ideal}
          </div>
        </div>
        
        <ChevronDownIcon 
          className={`w-5 h-5 text-tertiary transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 top-full mt-2 bg-elevated border border-light rounded-xl shadow-theme-lg z-50 min-w-80"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4">
              <div className="mb-4">
                <h3 className="font-semibold text-primary flex items-center gap-2">
                  <EyeIcon className="w-5 h-5" />
                  Vision Comfort Settings
                </h3>
                <p className="text-sm text-secondary mt-1">
                  Select the theme that's most comfortable for your current environment
                </p>
              </div>
              
              <div className="space-y-2">
                {Object.entries(themes).map(([key, themeData]) => {
                  const Icon = getThemeIcon(key);
                  const isSelected = theme === key;
                  
                  return (
                    <motion.button
                      key={key}
                      className={`
                        w-full p-4 rounded-xl transition-all duration-200 flex items-center gap-4
                        ${isSelected 
                          ? 'bg-primary/10 border border-primary/20 text-primary' 
                          : 'hover:bg-tertiary text-secondary hover:text-primary border border-transparent hover:border-light'
                        }
                      `}
                      onClick={() => {
                        setTheme(key);
                        setIsOpen(false);
                      }}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`
                        p-3 rounded-xl ${isSelected 
                          ? 'bg-primary text-inverse' 
                          : 'bg-secondary text-tertiary'
                        }
                      `}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 text-left">
                        <div className="font-semibold flex items-center gap-2">
                          {themeData.name}
                          {isSelected && <CheckIcon className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="text-sm text-secondary mt-0.5">
                          {themeData.description}
                        </div>
                        <div className="text-xs text-tertiary mt-1">
                          <span className="font-medium">Ideal for:</span> {themeData.ideal}
                        </div>
                      </div>
                      
                      <span className="text-2xl opacity-60">
                        {themeData.icon}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t border-light">
                <p className="text-xs text-tertiary flex items-center gap-2">
                  <SparklesIcon className="w-3 h-3" />
                  Theme preference is automatically saved
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ThemeSelector;