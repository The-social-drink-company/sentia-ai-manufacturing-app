import React, { useState, useEffect } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const EnterpriseLoader = ({ onComplete }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  const stages = [
    { name: 'Initializing Core System', duration: 500 },
    { name: 'Loading Authentication Module', duration: 600 },
    { name: 'Connecting to Database', duration: 800 },
    { name: 'Loading API Integrations', duration: 700 },
    { name: 'Initializing AI Engine', duration: 900 },
    { name: 'Loading Dashboard Components', duration: 600 },
    { name: 'Fetching Live Data', duration: 1000 },
    { name: 'Applying User Preferences', duration: 400 },
    { name: 'Optimizing Performance', duration: 500 },
    { name: 'Finalizing Enterprise Setup', duration: 300 }
  ];

  useEffect(() => {
    let stageIndex = 0;
    let progressInterval;
    let stageTimeout;

    const runStage = () => {
      if (stageIndex >= stages.length) {
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 500);
        return;
      }

      setCurrentStage(stageIndex);
      const stageDuration = stages[stageIndex].duration;
      const progressStep = 100 / (stageDuration / 20);
      let currentProgress = 0;

      progressInterval = setInterval(() => {
        currentProgress += progressStep;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(progressInterval);
        }
        setProgress(currentProgress);
      }, 20);

      stageTimeout = setTimeout(() => {
        clearInterval(progressInterval);
        setProgress(0);
        stageIndex++;
        runStage();
      }, stageDuration);
    };

    runStage();

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stageTimeout);
    };
  }, [onComplete, stages.length]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center z-50">
      <div className="max-w-2xl w-full px-8">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-blue-600 font-bold text-3xl">S</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Sentia Manufacturing</h1>
          <p className="text-blue-200 text-lg">Enterprise Dashboard</p>
        </div>

        {/* Loading Stages */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
          <div className="space-y-4 mb-6">
            {stages.map((stage, index) => (
              <div key={index} className="flex items-center space-x-3">
                {index < currentStage ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                ) : index === currentStage ? (
                  <div className="w-5 h-5 flex-shrink-0">
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-500 rounded-full flex-shrink-0"></div>
                )}
                <span
                  className={`text-sm font-medium transition-colors duration-300 ${
                    index < currentStage
                      ? 'text-green-400'
                      : index === currentStage
                      ? 'text-blue-300'
                      : 'text-gray-500'
                  }`}
                >
                  {stage.name}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-100 ease-linear"
                style={{ width: `${(currentStage / stages.length) * 100 + (progress / stages.length)}%` }}
              ></div>
            </div>
          </div>

          {/* Status Text */}
          <div className="mt-6 text-center">
            <p className="text-blue-200 text-sm">
              {currentStage < stages.length
                ? `Stage ${currentStage + 1} of ${stages.length}: ${stages[currentStage].name}`
                : 'Initialization Complete'}
            </p>
            <p className="text-gray-400 text-xs mt-2">
              {Math.round((currentStage / stages.length) * 100 + (progress / stages.length))}% Complete
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-xs">
            Powered by AI Central Nervous System
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Version 2.0.0 - Enterprise Edition
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseLoader;