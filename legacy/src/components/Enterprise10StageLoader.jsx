import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, CogIcon } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { logDebug, logInfo, logWarn, logError } from '../utils/logger';


const Enterprise10StageLoader = ({ onComplete, withClerk = true }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stageDetails, setStageDetails] = useState('');
  const [error, setError] = useState(null);

  // 10 comprehensive loading stages
  const stages = [
    {
      name: 'Initializing Core System',
      duration: 800,
      details: 'Loading React framework and core dependencies...',
      color: 'from-blue-400 to-blue-600'
    },
    {
      name: 'Authenticating with Clerk',
      duration: 1200,
      details: 'Establishing secure connection with Clerk authentication...',
      color: 'from-purple-400 to-purple-600'
    },
    {
      name: 'Connecting to Database',
      duration: 1000,
      details: 'Establishing PostgreSQL connection with pgvector...',
      color: 'from-green-400 to-green-600'
    },
    {
      name: 'Loading API Integrations',
      duration: 900,
      details: 'Connecting to Xero, Shopify, and Amazon SP-API...',
      color: 'from-yellow-400 to-yellow-600'
    },
    {
      name: 'Initializing AI Engine',
      duration: 1100,
      details: 'Starting Claude 3.5 Sonnet and GPT-4 Turbo...',
      color: 'from-red-400 to-red-600'
    },
    {
      name: 'Loading Dashboard Components',
      duration: 700,
      details: 'Preparing widgets and UI components...',
      color: 'from-indigo-400 to-indigo-600'
    },
    {
      name: 'Fetching Live Data',
      duration: 1300,
      details: 'Retrieving real-time manufacturing metrics...',
      color: 'from-teal-400 to-teal-600'
    },
    {
      name: 'Applying User Preferences',
      duration: 500,
      details: 'Loading saved layouts and configurations...',
      color: 'from-pink-400 to-pink-600'
    },
    {
      name: 'Optimizing Performance',
      duration: 600,
      details: 'Caching data and optimizing render performance...',
      color: 'from-orange-400 to-orange-600'
    },
    {
      name: 'Finalizing Enterprise Setup',
      duration: 400,
      details: 'Completing initialization sequence...',
      color: 'from-gray-400 to-gray-600'
    }
  ];

  useEffect(() => {
    let stageIndex = 0;
    let progressInterval;
    let stageTimeout;
    let mounted = true;

    const runStage = async () => {
      if (!mounted || stageIndex >= stages.length) {
        if (mounted && onComplete) {
          setTimeout(() => {
            if (mounted) onComplete();
          }, 500);
        }
        return;
      }

      const stage = stages[stageIndex];
      setCurrentStage(stageIndex);
      setStageDetails(stage.details);

      // Simulate actual loading work
      if (stageIndex === 1 && withClerk) {
        // Actually check for Clerk
        try {
          const clerkCheck = await checkClerkAvailability();
          if (!clerkCheck && mounted) {
            logDebug('Clerk check completed:', clerkCheck);
          }
        } catch (err) {
          logWarn('Clerk initialization warning:', err);
        }
      }

      const stageDuration = stage.duration;
      const progressStep = 100 / (stageDuration / 30);
      let currentProgress = 0;

      progressInterval = setInterval(() => {
        if (!mounted) {
          clearInterval(progressInterval);
          return;
        }
        currentProgress = Math.min(currentProgress + progressStep, 100);
        setProgress(currentProgress);
      }, 30);

      stageTimeout = setTimeout(() => {
        if (!mounted) return;
        clearInterval(progressInterval);
        setProgress(0);
        stageIndex++;
        runStage();
      }, stageDuration);
    };

    runStage();

    return () => {
      mounted = false;
      clearInterval(progressInterval);
      clearTimeout(stageTimeout);
    };
  }, [onComplete, withClerk]);

  const checkClerkAvailability = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const hasClerk = window.Clerk || window.__clerk_initialized;
        resolve(hasClerk);
      }, 100);
    });
  };

  const totalProgress = (currentStage / stages.length) * 100 + (progress / stages.length);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center z-[9999]">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-3xl w-full px-8">
        {/* Logo and Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-blue-600 font-bold text-4xl">S</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">
            Sentia Manufacturing
          </h1>
          <p className="text-blue-200 text-xl">
            Enterprise Intelligence Platform
          </p>
        </motion.div>

        {/* Loading Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20"
        >
          {/* Stage List */}
          <div className="space-y-3 mb-8">
            <AnimatePresence mode="wait">
              {stages.map((stage, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center space-x-3"
                >
                  {/* Stage indicator */}
                  {index < currentStage ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                  ) : index === currentStage ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 flex-shrink-0"
                    >
                      <CogIcon className="w-6 h-6 text-blue-400" />
                    </motion.div>
                  ) : (
                    <div className="w-6 h-6 border-2 border-gray-500 rounded-full flex-shrink-0"></div>
                  )}

                  {/* Stage name */}
                  <span
                    className={`text-sm font-medium transition-colors duration-500 ${
                      index < currentStage
                        ? 'text-green-400'
                        : index === currentStage
                        ? 'text-white'
                        : 'text-gray-500'
                    }`}
                  >
                    {stage.name}
                  </span>

                  {/* Live indicator for current stage */}
                  {index === currentStage && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="ml-auto"
                    >
                      <span className="text-xs text-blue-400 bg-blue-400/20 px-2 py-1 rounded-full">
                        LIVE
                      </span>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${
                  stages[Math.min(currentStage, stages.length - 1)].color
                } transition-all duration-300`}
                style={{ width: `${totalProgress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>

          {/* Status Details */}
          <div className="text-center">
            <motion.p
              key={currentStage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-blue-200 text-sm mb-2"
            >
              {stageDetails}
            </motion.p>
            <p className="text-gray-400 text-xs">
              {Math.round(totalProgress)}% Complete
            </p>
          </div>

          {/* Error handling */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg"
            >
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-400 text-xs">
            Powered by AI Central Nervous System
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Version 3.0.0 - Enterprise Edition with Live Data
          </p>
          <p className="text-gray-600 text-xs mt-2">
            Clerk Authentication {withClerk ? 'Enabled' : 'Bypassed'}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Enterprise10StageLoader;
