/**
 * Advanced AI Orchestration Engine
 * Multi-model AI coordination with intelligent routing and fallback
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CpuChipIcon, 
  LightBulbIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

// AI Model Configuration
const AI_MODELS = {
  claude: {
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    capabilities: ['reasoning', 'analysis', 'code', 'planning'],
    costPerToken: 0.000003,
    maxTokens: 200000,
    latency: 'medium',
    reliability: 0.99
  },
  gpt4: {
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    capabilities: ['reasoning', 'creative', 'code', 'multimodal'],
    costPerToken: 0.00003,
    maxTokens: 128000,
    latency: 'fast',
    reliability: 0.98
  },
  gemini: {
    name: 'Gemini Pro',
    provider: 'Google',
    capabilities: ['multimodal', 'reasoning', 'code'],
    costPerToken: 0.000001,
    maxTokens: 32000,
    latency: 'fast',
    reliability: 0.97
  },
  local: {
    name: 'Local LLM',
    provider: 'Ollama',
    capabilities: ['basic', 'privacy'],
    costPerToken: 0,
    maxTokens: 8000,
    latency: 'variable',
    reliability: 0.95
  }
};

// AI Task Types
const AI_TASK_TYPES = {
  DEMAND_FORECAST: {
    name: 'Demand Forecasting',
    preferredModels: ['claude', 'gpt4'],
    complexity: 'high',
    requiresData: true
  },
  QUALITY_ANALYSIS: {
    name: 'Quality Analysis',
    preferredModels: ['claude', 'gemini'],
    complexity: 'medium',
    requiresData: true
  },
  MAINTENANCE_PREDICTION: {
    name: 'Maintenance Prediction',
    preferredModels: ['gpt4', 'claude'],
    complexity: 'high',
    requiresData: true
  },
  COST_OPTIMIZATION: {
    name: 'Cost Optimization',
    preferredModels: ['claude', 'gpt4'],
    complexity: 'high',
    requiresData: true
  },
  WORKFLOW_OPTIMIZATION: {
    name: 'Workflow Optimization',
    preferredModels: ['gpt4', 'claude'],
    complexity: 'medium',
    requiresData: true
  },
  ANOMALY_DETECTION: {
    name: 'Anomaly Detection',
    preferredModels: ['gemini', 'gpt4'],
    complexity: 'medium',
    requiresData: true
  }
};

// AI Orchestration Engine Class
class AIOrchestrationEngine {
  constructor() {
    this.modelStatus = {};
    this.taskQueue = [];
    this.activeJobs = new Map();
    this.results = new Map();
    this.modelPerformance = {};
    
    this.initializeModels();
  }

  async initializeModels() {
    for (const [key, model] of Object.entries(AI_MODELS)) {
      try {
        const status = await this.checkModelHealth(key);
        this.modelStatus[key] = status;
        this.modelPerformance[key] = {
          successRate: 1.0,
          avgLatency: 1000,
          totalRequests: 0,
          totalErrors: 0
        };
      } catch (error) {
        this.modelStatus[key] = { available: false, error: error.message };
      }
    }
  }

  async checkModelHealth(modelKey) {
    const endpoint = this.getModelEndpoint(modelKey);
    
    try {
      const response = await fetch(`${endpoint}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      return {
        available: response.ok,
        latency: response.headers.get('x-response-time') || 'unknown',
        version: response.headers.get('x-model-version') || 'unknown'
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  getModelEndpoint(modelKey) {
    const endpoints = {
      claude: '/api/ai/claude',
      gpt4: '/api/ai/openai',
      gemini: '/api/ai/google',
      local: '/api/ai/local'
    };
    return endpoints[modelKey] || '/api/ai/default';
  }

  selectOptimalModel(taskType, context = {}) {
    const task = AI_TASK_TYPES[taskType];
    if (!task) throw new Error(`Unknown task type: ${taskType}`);

    const availableModels = task.preferredModels.filter(model => 
      this.modelStatus[model]?.available
    );

    if (availableModels.length === 0) {
      // Fallback to any available model
      const fallbackModel = Object.keys(this.modelStatus).find(model => 
        this.modelStatus[model]?.available
      );
      if (!fallbackModel) throw new Error('No AI models available');
      return fallbackModel;
    }

    // Score models based on performance, cost, and context
    const scoredModels = availableModels.map(modelKey => {
      const model = AI_MODELS[modelKey];
      const performance = this.modelPerformance[modelKey];
      
      let score = performance.successRate * 100;
      
      // Adjust for latency requirements
      if (context.urgency === 'high' && model.latency === 'fast') score += 20;
      if (context.urgency === 'low' && model.costPerToken < 0.00001) score += 15;
      
      // Adjust for data size
      if (context.dataSize > model.maxTokens * 0.8) score -= 30;
      
      // Adjust for complexity
      if (task.complexity === 'high' && model.capabilities.includes('reasoning')) score += 10;
      
      return { modelKey, score, latency: performance.avgLatency };
    });

    // Sort by score and select the best
    scoredModels.sort((a, b) => b.score - a.score);
    return scoredModels[0].modelKey;
  }

  async executeAITask(taskType, prompt, data = null, context = {}) {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const selectedModel = this.selectOptimalModel(taskType, context);
    
    const job = {
      id: taskId,
      taskType,
      model: selectedModel,
      prompt,
      data,
      context,
      startTime: Date.now(),
      status: 'running'
    };

    this.activeJobs.set(taskId, job);

    try {
      const result = await this.callAIModel(selectedModel, prompt, data, context);
      
      job.status = 'completed';
      job.endTime = Date.now();
      job.duration = job.endTime - job.startTime;
      job.result = result;

      this.updateModelPerformance(selectedModel, true, job.duration);
      this.results.set(taskId, job);
      
      return { taskId, result, model: selectedModel, duration: job.duration };
    } catch (error) {
      job.status = 'failed';
      job.endTime = Date.now();
      job.duration = job.endTime - job.startTime;
      job.error = error.message;

      this.updateModelPerformance(selectedModel, false, job.duration);
      
      // Try fallback model
      if (context.allowFallback !== false) {
        try {
          const fallbackModel = this.getFallbackModel(selectedModel, taskType);
          if (fallbackModel) {
            const fallbackResult = await this.callAIModel(fallbackModel, prompt, data, context);
            job.fallbackModel = fallbackModel;
            job.result = fallbackResult;
            job.status = 'completed_fallback';
            
            return { taskId, result: fallbackResult, model: fallbackModel, duration: job.duration, usedFallback: true };
          }
        } catch (fallbackError) {
          job.fallbackError = fallbackError.message;
        }
      }

      throw error;
    } finally {
      this.activeJobs.delete(taskId);
    }
  }

  async callAIModel(modelKey, prompt, data, context) {
    const endpoint = this.getModelEndpoint(modelKey);
    const model = AI_MODELS[modelKey];
    
    const payload = {
      model: model.name,
      prompt,
      data,
      context,
      maxTokens: Math.min(context.maxTokens || 4000, model.maxTokens),
      temperature: context.temperature || 0.7
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getModelAPIKey(modelKey)}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`AI model ${modelKey} returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  }

  getModelAPIKey(modelKey) {
    const keys = {
      claude: process.env.ANTHROPIC_API_KEY,
      gpt4: process.env.OPENAI_API_KEY,
      gemini: process.env.GOOGLE_AI_API_KEY,
      local: null
    };
    return keys[modelKey];
  }

  getFallbackModel(failedModel, taskType) {
    const task = AI_TASK_TYPES[taskType];
    const alternatives = task.preferredModels.filter(model => 
      model !== failedModel && this.modelStatus[model]?.available
    );
    return alternatives[0] || null;
  }

  updateModelPerformance(modelKey, success, duration) {
    const perf = this.modelPerformance[modelKey];
    perf.totalRequests++;
    
    if (success) {
      perf.avgLatency = (perf.avgLatency + duration) / 2;
      perf.successRate = (perf.successRate * (perf.totalRequests - 1) + 1) / perf.totalRequests;
    } else {
      perf.totalErrors++;
      perf.successRate = (perf.successRate * (perf.totalRequests - 1)) / perf.totalRequests;
    }
  }

  getSystemMetrics() {
    const totalJobs = this.results.size;
    const completedJobs = Array.from(this.results.values()).filter(job => 
      job.status === 'completed' || job.status === 'completed_fallback'
    ).length;
    
    const avgDuration = Array.from(this.results.values())
      .reduce((sum, job) => sum + (job.duration || 0), 0) / totalJobs || 0;

    return {
      activeJobs: this.activeJobs.size,
      totalJobs,
      completedJobs,
      successRate: totalJobs > 0 ? (completedJobs / totalJobs * 100) : 100,
      avgDuration: Math.round(avgDuration),
      modelStatus: this.modelStatus,
      modelPerformance: this.modelPerformance
    };
  }
}

// React Component for AI Orchestration Dashboard
const AIOrchestrationDashboard = () => {
  const [orchestrator] = useState(() => new AIOrchestrationEngine());
  const [metrics, setMetrics] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [taskHistory, setTaskHistory] = useState([]);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(orchestrator.getSystemMetrics());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 2000);
    return () => clearInterval(interval);
  }, [orchestrator]);

  const executeTask = useCallback(async (taskType, prompt, data) => {
    setActiveTask({ taskType, prompt, status: 'running', startTime: Date.now() });
    
    try {
      const result = await orchestrator.executeAITask(taskType, prompt, data, {
        urgency: 'medium',
        allowFallback: true
      });
      
      setActiveTask(prev => ({ ...prev, status: 'completed', result }));
      setTaskHistory(prev => [result, ...prev.slice(0, 9)]);
    } catch (error) {
      setActiveTask(prev => ({ ...prev, status: 'failed', error: error.message }));
    }
  }, [orchestrator]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running': return <ClockIcon className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'completed': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed': return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default: return <CpuChipIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <BoltIcon className="w-8 h-8" />
          <h1 className="text-2xl font-bold">AI Orchestration Engine</h1>
        </div>
        <p className="text-purple-100">
          Multi-model AI coordination with intelligent routing and fallback mechanisms
        </p>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.activeJobs}</p>
            </div>
            <ClockIcon className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalJobs}</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.successRate.toFixed(1)}%</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.avgDuration}ms</p>
            </div>
            <BoltIcon className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Model Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(AI_MODELS).map(([key, model]) => {
          const status = metrics.modelStatus[key];
          const performance = metrics.modelPerformance[key];
          
          return (
            <div key={key} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">{model.name}</h3>
                <div className={`w-3 h-3 rounded-full ${status?.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Provider:</span>
                  <span className="text-gray-900 dark:text-white">{model.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                  <span className="text-gray-900 dark:text-white">
                    {performance ? (performance.successRate * 100).toFixed(1) : 'N/A'}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Avg Latency:</span>
                  <span className="text-gray-900 dark:text-white">
                    {performance ? performance.avgLatency.toFixed(0) : 'N/A'}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Requests:</span>
                  <span className="text-gray-900 dark:text-white">
                    {performance ? performance.totalRequests : 0}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Execution Interface */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <LightBulbIcon className="w-6 h-6" />
          <span>AI Task Execution</span>
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(AI_TASK_TYPES).map(([key, task]) => (
            <button
              key={key}
              onClick={() => executeTask(key, `Execute ${task.name} analysis`, null)}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="font-medium text-gray-900 dark:text-white">{task.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Complexity: {task.complexity}
              </p>
            </button>
          ))}
        </div>

        {/* Active Task Display */}
        {activeTask && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              {getStatusIcon(activeTask.status)}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {AI_TASK_TYPES[activeTask.taskType]?.name || activeTask.taskType}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Status: {activeTask.status}
                  {activeTask.result && ` • Model: ${activeTask.result.model}`}
                  {activeTask.result && ` • Duration: ${activeTask.result.duration}ms`}
                </p>
              </div>
            </div>
            
            {activeTask.error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-400">{activeTask.error}</p>
              </div>
            )}
            
            {activeTask.result?.result && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-400">Task completed successfully!</p>
              </div>
            )}
          </div>
        )}

        {/* Task History */}
        {taskHistory.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Recent Tasks</h3>
            <div className="space-y-2">
              {taskHistory.map((task, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm text-gray-900 dark:text-white">Task {task.taskId}</span>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{task.model}</span>
                    <span className="text-gray-600 dark:text-gray-400">{task.duration}ms</span>
                    {task.usedFallback && (
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full text-xs">
                        Fallback
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIOrchestrationDashboard;