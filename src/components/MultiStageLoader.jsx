import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_STAGES = [
  { id: 1, name: 'Core Systems', description: 'Initializing enterprise core...', duration: 800 },
  { id: 2, name: 'Authentication', description: 'Securing access controls...', duration: 1200 },
  { id: 3, name: 'Database Connection', description: 'Connecting to PostgreSQL...', duration: 1000 },
  { id: 4, name: 'API Gateway', description: 'Establishing API connections...', duration: 900 },
  { id: 5, name: 'AI Engine', description: 'Loading MCP AI orchestration...', duration: 1500 },
  { id: 6, name: 'Dashboard Components', description: 'Building enterprise UI...', duration: 1100 },
  { id: 7, name: 'Real-time Systems', description: 'Activating WebSocket streams...', duration: 800 },
  { id: 8, name: 'Data Synchronization', description: 'Syncing with external systems...', duration: 1300 },
  { id: 9, name: 'Analytics Engine', description: 'Preparing intelligence layer...', duration: 1000 },
  { id: 10, name: 'Final Optimization', description: 'Optimizing performance...', duration: 600 }
];

const MultiStageLoader = ({ onComplete }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);

  useEffect(() => {
    if (currentStage >= LOADING_STAGES.length) {
      setTimeout(() => {
        onComplete();
      }, 500);
      return;
    }

    const stage = LOADING_STAGES[currentStage];
    const interval = setInterval(() => {
      setStageProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setCurrentStage(currentStage + 1);
          setProgress(((currentStage + 1) / LOADING_STAGES.length) * 100);
          return 0;
        }
        return prev + (100 / (stage.duration / 50));
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentStage, onComplete]);

  const currentStageData = LOADING_STAGES[currentStage] || LOADING_STAGES[LOADING_STAGES.length - 1];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center z-50">
      <div className="max-w-2xl w-full px-8">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mb-4 shadow-2xl">
            <span className="text-white font-bold text-3xl">S</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Sentia Manufacturing
          </h1>
          <p className="text-blue-200 text-lg">Enterprise Intelligence Platform</p>
        </div>

        {/* Loading Stages */}
        <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 shadow-2xl">
          {/* Stage Info */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold text-white">
                Stage {Math.min(currentStage + 1, LOADING_STAGES.length)} of {LOADING_STAGES.length}
              </h2>
              <span className="text-blue-400 font-mono text-sm">
                {Math.round(progress)}%
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-medium text-blue-300 mb-1">
                  {currentStageData.name}
                </h3>
                <p className="text-gray-400 text-sm">
                  {currentStageData.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stage Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                animate={{ width: `${stageProgress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="mb-6">
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-green-400"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Stage Grid */}
          <div className="grid grid-cols-5 gap-3">
            {LOADING_STAGES.map((stage, __index) => (
              <div
                key={stage.id}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-300
                  ${index < currentStage ? 'bg-green-900/50 border border-green-500' : ''}
                  ${index === currentStage ? 'bg-blue-900/50 border border-blue-400 animate-pulse' : ''}
                  ${index > currentStage ? 'bg-gray-800/50 border border-gray-600' : ''}
                `}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                  ${index < currentStage ? 'bg-green-500 text-white' : ''}
                  ${index === currentStage ? 'bg-blue-500 text-white' : ''}
                  ${index > currentStage ? 'bg-gray-600 text-gray-400' : ''}
                `}>
                  {index < currentStage ? '✓' : stage.id}
                </div>
                <span className={`
                  text-xs mt-1 text-center
                  ${index <= currentStage ? 'text-gray-300' : 'text-gray-500'}
                `}>
                  {stage.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mt-6 flex justify-center space-x-6 text-sm">
          <div className="text-gray-400">
            <span className="text-green-400 font-mono">●</span> Systems Online
          </div>
          <div className="text-gray-400">
            <span className="text-blue-400 font-mono">●</span> Loading
          </div>
          <div className="text-gray-400">
            <span className="text-gray-600 font-mono">●</span> Pending
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiStageLoader;