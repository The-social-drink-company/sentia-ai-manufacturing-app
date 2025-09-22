import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Loader2, 
  Shield, 
  Palette, 
  Navigation, 
  BarChart3, 
  Calculator, 
  Database, 
  TrendingUp, 
  Brain, 
  CheckCircle 
} from 'lucide-react';

const LOADING_STAGES = [
  {
    id: 1,
    title: "Core System Initialization",
    description: "Establishing application framework and React component tree",
    icon: Loader2,
    duration: 800,
    color: "text-blue-500"
  },
  {
    id: 2,
    title: "Security Context Establishment",
    description: "Validating user session and activating role-based access control",
    icon: Shield,
    duration: 600,
    color: "text-green-500"
  },
  {
    id: 3,
    title: "UI Framework Loading",
    description: "Initializing Tailwind CSS and shadcn/ui component library",
    icon: Palette,
    duration: 500,
    color: "text-purple-500"
  },
  {
    id: 4,
    title: "Navigation System Activation",
    description: "Configuring sidebar navigation and route management",
    icon: Navigation,
    duration: 400,
    color: "text-indigo-500"
  },
  {
    id: 5,
    title: "Dashboard Core Loading",
    description: "Initializing executive dashboard and KPI calculation engines",
    icon: BarChart3,
    duration: 700,
    color: "text-cyan-500"
  },
  {
    id: 6,
    title: "Working Capital Engine Initialization",
    description: "Loading financial algorithms and AI-powered insights",
    icon: Calculator,
    duration: 900,
    color: "text-orange-500"
  },
  {
    id: 7,
    title: "Data Integration Layer",
    description: "Activating CSV upload and data processing capabilities",
    icon: Database,
    duration: 600,
    color: "text-teal-500"
  },
  {
    id: 8,
    title: "Analytics and Visualization",
    description: "Initializing chart rendering and interactive dashboards",
    icon: TrendingUp,
    duration: 500,
    color: "text-pink-500"
  },
  {
    id: 9,
    title: "AI and Intelligence Features",
    description: "Loading machine learning models and predictive analytics",
    icon: Brain,
    duration: 800,
    color: "text-violet-500"
  },
  {
    id: 10,
    title: "Full Application Readiness",
    description: "Finalizing performance optimization and system monitoring",
    icon: CheckCircle,
    duration: 400,
    color: "text-emerald-500"
  }
];

const LoadingManager = ({ onComplete }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);

  useEffect(() => {
    if (currentStage < LOADING_STAGES.length) {
      const stage = LOADING_STAGES[currentStage];
      let stageStartTime = Date.now();
      
      const updateProgress = () => {
        const elapsed = Date.now() - stageStartTime;
        const stageProgressPercent = Math.min((elapsed / stage.duration) * 100, 100);
        setStageProgress(stageProgressPercent);
        
        const overallProgress = ((currentStage * 100) + stageProgressPercent) / LOADING_STAGES.length;
        setProgress(overallProgress);
        
        if (stageProgressPercent >= 100) {
          if (currentStage < LOADING_STAGES.length - 1) {
            setTimeout(() => {
              setCurrentStage(currentStage + 1);
              setStageProgress(0);
            }, 200);
          } else {
            setTimeout(() => {
              onComplete();
            }, 500);
          }
        } else {
          requestAnimationFrame(updateProgress);
        }
      };
      
      requestAnimationFrame(updateProgress);
    }
  }, [currentStage, onComplete]);

  const currentStageData = LOADING_STAGES[currentStage];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mr-4">
                <span className="text-2xl font-bold">📊</span>
              </div>
              <h1 className="text-3xl font-bold">Sentia Manufacturing</h1>
            </div>
            <p className="text-blue-200 text-lg">Enterprise Working Capital Intelligence Platform</p>
          </div>

          {/* Current Stage */}
          <AnimatePresence mode="wait">
            {currentStageData && (
              <motion.div
                key={currentStage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center mb-8"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className={`w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mr-4`}>
                    <currentStageData.icon 
                      className={`w-6 h-6 ${currentStageData.color} animate-spin`} 
                    />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-semibold">{currentStageData.title}</h3>
                    <p className="text-gray-300 text-sm">{currentStageData.description}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Stage {currentStage + 1} of {LOADING_STAGES.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3 bg-white/10" />
          </div>

          {/* Stage Indicators */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {LOADING_STAGES.map((stage, index) => (
              <div
                key={stage.id}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index < currentStage 
                    ? 'bg-green-500' 
                    : index === currentStage 
                    ? 'bg-blue-500' 
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Loading Animation */}
          <div className="flex justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
            />
          </div>

          {/* Enterprise Messaging */}
          <div className="text-center mt-6 text-sm text-gray-300">
            <p>Initializing enterprise-grade features with advanced security</p>
            <p className="mt-1">SOC 2 Type II • GDPR Compliant • End-to-End Encryption</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadingManager;
