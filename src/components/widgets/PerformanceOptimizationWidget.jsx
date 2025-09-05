import React, { useState, useEffect } from 'react';
import { 
  CpuChipIcon,
  BoltIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CircleStackIcon,
  RocketLaunchIcon,
  CommandLineIcon,
  WifiIcon,
  CubeTransparentIcon
} from '@heroicons/react/24/outline';

const PerformanceOptimizationWidget = () => {
  const [performanceData, setPerformanceData] = useState({
    cpuUsage: 23,
    memoryUsage: 42,
    responseTime: 45,
    throughput: 1247
  });

  // Simulate real-time performance updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceData(prev => ({
        cpuUsage: Math.min(100, Math.max(10, prev.cpuUsage + (Math.random() - 0.5) * 5)),
        memoryUsage: Math.min(100, Math.max(20, prev.memoryUsage + (Math.random() - 0.5) * 3)),
        responseTime: Math.min(100, Math.max(20, prev.responseTime + (Math.random() - 0.5) * 10)),
        throughput: Math.max(500, prev.throughput + (Math.random() - 0.5) * 100)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const agentData = {
    id: 'performance-optimization',
    name: 'Performance Optimization Agent',
    version: '1.2.0',
    status: 'running',
    completion: 20,
    cycles: 1,
    startTime: '2025-09-05T08:30:00Z',
    lastUpdate: new Date().toISOString(),
    description: 'Enterprise scalability & sub-2s load times',
    primaryColor: '#ef4444',
    icon: <CpuChipIcon className="w-8 h-8" />
  };

  const optimizations = [
    {
      name: 'Code Splitting & Lazy Loading',
      status: 'completed',
      impact: 'HIGH',
      improvement: '68% bundle reduction',
      details: 'Split into 12 async chunks with route-based loading',
      metrics: { before: '3.2MB', after: '245KB', chunks: 12 }
    },
    {
      name: 'Service Worker & Caching',
      status: 'completed',
      impact: 'HIGH',
      improvement: '92% cache hit rate',
      details: 'PWA with offline support and intelligent caching',
      metrics: { cacheSize: '15MB', hitRate: '92%', ttl: '7d' }
    },
    {
      name: 'Database Optimization',
      status: 'completed',
      impact: 'CRITICAL',
      improvement: '3x query speed',
      details: 'Indexed all foreign keys, optimized N+1 queries',
      metrics: { indexes: 24, queries: 156, poolSize: 20 }
    },
    {
      name: 'Bundle Optimization',
      status: 'running',
      impact: 'MEDIUM',
      progress: 60,
      improvement: 'In progress...',
      details: 'Tree-shaking, minification, compression',
      metrics: { target: '<200KB', current: '245KB', reduction: '22%' }
    },
    {
      name: 'Memory Optimization',
      status: 'pending',
      impact: 'HIGH',
      improvement: 'Pending',
      details: 'Memory leak detection and garbage collection tuning',
      metrics: { target: '<100MB', current: '156MB', leaks: 0 }
    },
    {
      name: 'Asset Optimization',
      status: 'pending',
      impact: 'MEDIUM',
      improvement: 'Pending',
      details: 'Image compression, CDN distribution, lazy loading',
      metrics: { images: 234, videos: 12, cdn: 'Cloudflare' }
    }
  ];

  const metrics = {
    current: {
      loadTime: '1.2s',
      lighthouse: 92,
      fps: 60,
      ttfb: '120ms',
      memory: '42MB',
      cpu: '23%'
    },
    target: {
      loadTime: '<1s',
      lighthouse: 100,
      fps: 60,
      ttfb: '<100ms',
      memory: '<40MB',
      cpu: '<20%'
    },
    improvement: {
      loadTime: '-68%',
      lighthouse: '+15',
      fps: 'Stable',
      ttfb: '-45%',
      memory: '-58%',
      cpu: '-62%'
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'CRITICAL': return 'text-red-600 bg-red-50';
      case 'HIGH': return 'text-orange-600 bg-orange-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'LOW': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'running':
        return <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-red-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-100 rounded-lg">
              {agentData.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{agentData.name}</h3>
              <p className="text-sm text-gray-600">{agentData.description}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-xs text-gray-500">Version: {agentData.version}</span>
                <span className="text-xs text-gray-500">Cycles: {agentData.cycles}</span>
                <span className="text-xs text-gray-500">Target: Sub-2s load</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-red-600">{agentData.completion}%</div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mt-2">
              <BoltIcon className="w-4 h-4 mr-1 animate-pulse" />
              OPTIMIZING
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 h-3 rounded-full transition-all duration-500" 
                 style={{ width: `${agentData.completion}%` }}></div>
          </div>
        </div>

        {/* Real-time Performance Metrics */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <CpuChipIcon className="w-5 h-5 text-red-600" />
              <span className="text-xl font-bold text-red-700">{performanceData.cpuUsage.toFixed(1)}%</span>
            </div>
            <div className="text-xs text-gray-600">CPU Usage</div>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <CircleStackIcon className="w-5 h-5 text-orange-600" />
              <span className="text-xl font-bold text-orange-700">{performanceData.memoryUsage.toFixed(1)}%</span>
            </div>
            <div className="text-xs text-gray-600">Memory</div>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <ClockIcon className="w-5 h-5 text-yellow-600" />
              <span className="text-xl font-bold text-yellow-700">{performanceData.responseTime}ms</span>
            </div>
            <div className="text-xs text-gray-600">Response</div>
          </div>
          <div className="bg-white/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
              <span className="text-xl font-bold text-green-700">{performanceData.throughput.toFixed(0)}</span>
            </div>
            <div className="text-xs text-gray-600">Req/s</div>
          </div>
        </div>
      </div>

      {/* Optimization Tasks */}
      <div className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Optimization Pipeline</h4>
        <div className="space-y-4">
          {optimizations.map((task, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusIcon(task.status)}
                    <h5 className="font-semibold text-gray-900">{task.name}</h5>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(task.impact)}`}>
                      {task.impact}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{task.details}</p>
                  
                  {task.progress && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                             style={{ width: `${task.progress}%` }}></div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(task.metrics).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 px-2 py-1 rounded">
                          <span className="text-xs text-gray-600">{key}: </span>
                          <span className="text-xs font-semibold text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                    {task.improvement && (
                      <span className="text-sm font-semibold text-green-600">{task.improvement}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h4>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(metrics.current).map(([key, value]) => (
            <div key={key} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-xs text-green-600 font-semibold">
                  {metrics.improvement[key]}
                </span>
              </div>
              <div className="text-xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-1">
                Target: {metrics.target[key]}
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                <div className="bg-green-500 h-1 rounded-full" 
                     style={{ width: `${Math.min(100, (parseFloat(value) / parseFloat(metrics.target[key]) * 100) || 80)}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technologies & Tools */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Webpack 5</span>
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Vite</span>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Service Workers</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Redis Cache</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">CDN</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Lighthouse CI</span>
          </div>
          <div className="text-xs text-gray-500">
            Next optimization: {new Date(Date.now() + 900000).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceOptimizationWidget;