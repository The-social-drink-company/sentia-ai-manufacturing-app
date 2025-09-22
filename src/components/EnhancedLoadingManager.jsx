import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  CheckCircle,
  Zap,
  Lock,
  Cpu,
  Network,
  Eye,
  Sparkles
} from 'lucide-react';

const LOADING_STAGES = [
  {
    id: 1,
    title: "Core System Initialization",
    description: "Establishing React 19 framework and component architecture",
    details: "Initializing virtual DOM, state management, and error boundaries",
    icon: Cpu,
    duration: 1200,
    color: "text-blue-500",
    bgColor: "bg-blue-500/20",
    tasks: ["React framework", "Component tree", "State management", "Error boundaries"]
  },
  {
    id: 2,
    title: "Security Context Establishment",
    description: "Validating enterprise security protocols and user permissions",
    details: "Implementing SOC 2 compliance and role-based access control",
    icon: Shield,
    duration: 1000,
    color: "text-green-500",
    bgColor: "bg-green-500/20",
    tasks: ["User validation", "Permission matrix", "Access control", "Security policies"]
  },
  {
    id: 3,
    title: "UI Framework Loading",
    description: "Initializing Tailwind CSS and shadcn/ui component library",
    details: "Loading design system, themes, and responsive components",
    icon: Palette,
    duration: 800,
    color: "text-purple-500",
    bgColor: "bg-purple-500/20",
    tasks: ["Tailwind CSS", "Component library", "Theme system", "Responsive design"]
  },
  {
    id: 4,
    title: "Navigation System Activation",
    description: "Configuring enterprise navigation and routing architecture",
    details: "Setting up sidebar navigation, routes, and menu permissions",
    icon: Navigation,
    duration: 600,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/20",
    tasks: ["Route configuration", "Sidebar navigation", "Menu structure", "Navigation state"]
  },
  {
    id: 5,
    title: "Dashboard Core Loading",
    description: "Initializing executive dashboard and KPI calculation engines",
    details: "Loading real-time data connections and performance monitoring",
    icon: BarChart3,
    duration: 1400,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/20",
    tasks: ["Dashboard framework", "KPI engines", "Data connections", "Performance monitoring"]
  },
  {
    id: 6,
    title: "Working Capital Engine Initialization",
    description: "Loading financial algorithms and AI-powered optimization",
    details: "Activating industry benchmarks and recommendation systems",
    icon: Calculator,
    duration: 1600,
    color: "text-orange-500",
    bgColor: "bg-orange-500/20",
    tasks: ["Financial algorithms", "Industry benchmarks", "AI insights", "Optimization engine"]
  },
  {
    id: 7,
    title: "Data Integration Layer",
    description: "Activating CSV upload and enterprise data processing",
    details: "Initializing file processing and data transformation engines",
    icon: Database,
    duration: 1000,
    color: "text-teal-500",
    bgColor: "bg-teal-500/20",
    tasks: ["CSV processing", "File validation", "Data transformation", "Historical analysis"]
  },
  {
    id: 8,
    title: "Analytics and Visualization",
    description: "Initializing Recharts and interactive dashboard systems",
    details: "Loading chart rendering engines and report generation",
    icon: TrendingUp,
    duration: 800,
    color: "text-pink-500",
    bgColor: "bg-pink-500/20",
    tasks: ["Chart rendering", "Interactive dashboards", "Report generation", "Data visualization"]
  },
  {
    id: 9,
    title: "AI and Intelligence Features",
    description: "Loading machine learning models and predictive analytics",
    details: "Activating automated insights and benchmarking systems",
    icon: Brain,
    duration: 1200,
    color: "text-violet-500",
    bgColor: "bg-violet-500/20",
    tasks: ["ML models", "Predictive analytics", "Automated insights", "Benchmarking systems"]
  },
  {
    id: 10,
    title: "Full Application Readiness",
    description: "Finalizing performance optimization and system monitoring",
    details: "Completing enterprise feature activation and health checks",
    icon: CheckCircle,
    duration: 600,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/20",
    tasks: ["Performance optimization", "Feature activation", "System monitoring", "Health checks"]
  }
];

const EnhancedLoadingManager = ({ onComplete }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(0);

  useEffect(() => {
    if (currentStage < LOADING_STAGES.length) {
      const stage = LOADING_STAGES[currentStage];
      let stageStartTime = Date.now();
      let taskIndex = 0;
      
      const updateProgress = () => {
        const elapsed = Date.now() - stageStartTime;
        const stageProgressPercent = Math.min((elapsed / stage.duration) * 100, 100);
        setStageProgress(stageProgressPercent);
        
        // Update current task based on progress
        const newTaskIndex = Math.floor((stageProgressPercent / 100) * stage.tasks.length);
        if (newTaskIndex !== taskIndex && newTaskIndex < stage.tasks.length) {
          taskIndex = newTaskIndex;
          setCurrentTask(taskIndex);
        }
        
        const overallProgress = ((currentStage * 100) + stageProgressPercent) / LOADING_STAGES.length;
        setProgress(overallProgress);
        
        if (stageProgressPercent >= 100) {
          setCompletedTasks(prev => [...prev, currentStage]);
          if (currentStage < LOADING_STAGES.length - 1) {
            setTimeout(() => {
              setCurrentStage(currentStage + 1);
              setStageProgress(0);
              setCurrentTask(0);
            }, 300);
          } else {
            setTimeout(() => {
              onComplete();
            }, 800);
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
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-ping" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <motion.div 
                  className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mr-6 shadow-2xl"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="text-3xl font-bold">📊</span>
                </motion.div>
                <div className="text-left">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    Sentia Manufacturing
                  </h1>
                  <p className="text-blue-200 text-lg">Enterprise Working Capital Intelligence Platform</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <Badge variant="secondary" className="bg-green-600/20 text-green-200 border-green-400/30 text-xs">
                      <Lock className="w-3 h-3 mr-1" />
                      SOC 2 Certified
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-600/20 text-blue-200 border-blue-400/30 text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      Enterprise Grade
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Stage Display */}
            <AnimatePresence mode="wait">
              {currentStageData && (
                <motion.div
                  key={currentStage}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="mb-8"
                >
                  <div className="flex items-start space-x-6 mb-6">
                    <motion.div 
                      className={`w-16 h-16 rounded-2xl ${currentStageData.bgColor} flex items-center justify-center shadow-lg`}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <currentStageData.icon 
                        className={`w-8 h-8 ${currentStageData.color}`} 
                      />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-2">{currentStageData.title}</h3>
                      <p className="text-gray-300 text-lg mb-2">{currentStageData.description}</p>
                      <p className="text-gray-400 text-sm">{currentStageData.details}</p>
                    </div>
                  </div>

                  {/* Current Tasks */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {currentStageData.tasks.map((task, index) => (
                      <motion.div
                        key={task}
                        initial={{ opacity: 0.3 }}
                        animate={{ 
                          opacity: index <= currentTask ? 1 : 0.3,
                          scale: index === currentTask ? 1.05 : 1
                        }}
                        className={`p-3 rounded-lg border ${
                          index <= currentTask 
                            ? `${currentStageData.bgColor} border-white/20` 
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {index < currentTask ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : index === currentTask ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Loader2 className={`w-4 h-4 ${currentStageData.color}`} />
                            </motion.div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-500" />
                          )}
                          <span className="text-sm font-medium">{task}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-semibold">
                    Stage {currentStage + 1} of {LOADING_STAGES.length}
                  </span>
                  <Badge variant="secondary" className="bg-white/10 text-white">
                    {Math.round(progress)}% Complete
                  </Badge>
                </div>
                <div className="text-sm text-gray-300">
                  ETA: {Math.round((100 - progress) * 0.1)}s
                </div>
              </div>
              
              <div className="space-y-3">
                <Progress value={progress} className="h-4 bg-white/10" />
                <Progress value={stageProgress} className="h-2 bg-white/5" />
              </div>
            </div>

            {/* Stage Indicators */}
            <div className="grid grid-cols-10 gap-2 mb-8">
              {LOADING_STAGES.map((stage, index) => (
                <motion.div
                  key={stage.id}
                  className={`h-3 rounded-full transition-all duration-500 ${
                    index < currentStage 
                      ? 'bg-green-500 shadow-lg' 
                      : index === currentStage 
                      ? `${stage.bgColor.replace('/20', '/60')} shadow-md` 
                      : 'bg-white/20'
                  }`}
                  animate={index === currentStage ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              ))}
            </div>

            {/* Loading Animation */}
            <div className="flex justify-center items-center space-x-4 mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full"
              />
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-blue-500 rounded-full"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ 
                      duration: 0.6, 
                      repeat: Infinity, 
                      delay: i * 0.2 
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Enterprise Messaging */}
            <div className="text-center space-y-3">
              <div className="flex justify-center items-center space-x-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <span className="text-lg font-semibold">Initializing Enterprise Features</span>
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-gray-300">
                Advanced security protocols, AI-powered insights, and real-time analytics
              </p>
              <div className="flex justify-center items-center space-x-6 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Shield className="w-4 h-4" />
                  <span>SOC 2 Type II</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Lock className="w-4 h-4" />
                  <span>GDPR Compliant</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Network className="w-4 h-4" />
                  <span>End-to-End Encryption</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedLoadingManager;
