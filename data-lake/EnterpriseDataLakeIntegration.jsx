/**
 * Enterprise Data Lake Integration
 * Unified data ingestion, processing, and analytics platform
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CloudIcon, 
  ServerIcon, 
  CpuChipIcon,
  ChartBarIcon,
  DocumentArrowUpIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

// Data Sources Configuration
const DATA_SOURCES = {
  erp: {
    name: 'ERP System',
    type: 'database',
    connector: 'postgresql',
    description: 'Production orders, inventory, financials',
    schedule: '*/15 * * * *', // Every 15 minutes
    lastSync: null,
    status: 'active',
    recordCount: 0,
    icon: ServerIcon
  },
  iot_sensors: {
    name: 'IoT Sensors',
    type: 'streaming',
    connector: 'mqtt',
    description: 'Real-time machine telemetry',
    schedule: 'real-time',
    lastSync: null,
    status: 'active',
    recordCount: 0,
    icon: CpuChipIcon
  },
  quality_systems: {
    name: 'Quality Management',
    type: 'api',
    connector: 'rest',
    description: 'Quality metrics, inspections, defects',
    schedule: '0 */6 * * *', // Every 6 hours
    lastSync: null,
    status: 'active',
    recordCount: 0,
    icon: BeakerIcon
  },
  external_apis: {
    name: 'External APIs',
    type: 'api',
    connector: 'multi',
    description: 'Xero, Shopify, Amazon, weather data',
    schedule: '0 */4 * * *', // Every 4 hours
    lastSync: null,
    status: 'active',
    recordCount: 0,
    icon: CloudIcon
  },
  file_uploads: {
    name: 'File Uploads',
    type: 'batch',
    connector: 'sftp',
    description: 'CSV, Excel, XML imports',
    schedule: '0 */2 * * *', // Every 2 hours
    lastSync: null,
    status: 'active',
    recordCount: 0,
    icon: DocumentArrowUpIcon
  }
};

// Data Processing Pipeline Configuration
const PROCESSING_PIPELINES = {
  data_ingestion: {
    name: 'Data Ingestion',
    stages: [
      'source_connection',
      'data_validation',
      'format_standardization',
      'quality_checks',
      'storage'
    ],
    status: 'running'
  },
  data_transformation: {
    name: 'Data Transformation',
    stages: [
      'data_cleansing',
      'enrichment',
      'aggregation',
      'feature_engineering',
      'indexing'
    ],
    status: 'running'
  },
  analytics_preparation: {
    name: 'Analytics Preparation',
    stages: [
      'dimensional_modeling',
      'metric_calculation',
      'trend_analysis',
      'anomaly_detection',
      'cache_optimization'
    ],
    status: 'running'
  }
};

// Data Lake Architecture Class
class EnterpriseDataLake {
  constructor() {
    this.dataSources = { ...DATA_SOURCES };
    this.pipelines = { ...PROCESSING_PIPELINES };
    this.metrics = {
      totalRecords: 0,
      processedToday: 0,
      errorRate: 0,
      storageUsed: 0,
      queryPerformance: 0
    };
    this.initializeConnections();
  }

  async initializeConnections() {
    for (const [key, source] of Object.entries(this.dataSources)) {
      try {
        await this.testConnection(key);
        this.dataSources[key].status = 'connected';
      } catch (error) {
        this.dataSources[key].status = 'error';
        this.dataSources[key].error = error.message;
      }
    }
  }

  async testConnection(sourceKey) {
    const source = this.dataSources[sourceKey];
    const endpoint = this.getSourceEndpoint(sourceKey);
    
    try {
      const response = await fetch(`${endpoint}/health`, {
        method: 'GET',
        timeout: 10000
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      return { connected: true, latency: Date.now() };
    } catch (error) {
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  getSourceEndpoint(sourceKey) {
    const endpoints = {
      erp: '/api/data-lake/sources/erp',
      iot_sensors: '/api/data-lake/sources/iot',
      quality_systems: '/api/data-lake/sources/quality',
      external_apis: '/api/data-lake/sources/external',
      file_uploads: '/api/data-lake/sources/files'
    };
    return endpoints[sourceKey] || '/api/data-lake/sources/default';
  }

  async ingestData(sourceKey, data = null) {
    const source = this.dataSources[sourceKey];
    const endpoint = this.getSourceEndpoint(sourceKey);
    
    try {
      const response = await fetch(`${endpoint}/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source-Type': source.type
        },
        body: JSON.stringify({
          source: sourceKey,
          data,
          timestamp: Date.now(),
          metadata: {
            connector: source.connector,
            schedule: source.schedule
          }
        })
      });

      if (!response.ok) throw new Error(`Ingestion failed: ${response.statusText}`);
      
      const result = await response.json();
      
      // Update metrics
      this.dataSources[sourceKey].recordCount += result.recordsProcessed || 0;
      this.dataSources[sourceKey].lastSync = new Date().toISOString();
      this.metrics.totalRecords += result.recordsProcessed || 0;
      this.metrics.processedToday += result.recordsProcessed || 0;
      
      return result;
    } catch (error) {
      this.dataSources[sourceKey].status = 'error';
      this.dataSources[sourceKey].error = error.message;
      this.metrics.errorRate += 1;
      throw error;
    }
  }

  async runPipeline(pipelineKey) {
    const pipeline = this.pipelines[pipelineKey];
    pipeline.status = 'running';
    pipeline.currentStage = 0;
    pipeline.startTime = Date.now();

    try {
      for (let i = 0; i < pipeline.stages.length; i++) {
        const stage = pipeline.stages[i];
        pipeline.currentStage = i;
        
        await this.runPipelineStage(pipelineKey, stage);
        
        // Simulate stage processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      pipeline.status = 'completed';
      pipeline.endTime = Date.now();
      pipeline.duration = pipeline.endTime - pipeline.startTime;
      
      return { success: true, duration: pipeline.duration };
    } catch (error) {
      pipeline.status = 'failed';
      pipeline.error = error.message;
      throw error;
    }
  }

  async runPipelineStage(pipelineKey, stage) {
    const endpoint = `/api/data-lake/pipelines/${pipelineKey}/stages/${stage}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pipeline: pipelineKey,
        stage,
        timestamp: Date.now()
      })
    });

    if (!response.ok) {
      throw new Error(`Stage ${stage} failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async queryData(query) {
    const endpoint = '/api/data-lake/query';
    const startTime = Date.now();
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          timestamp: Date.now(),
          format: 'json'
        })
      });

      if (!response.ok) throw new Error(`Query failed: ${response.statusText}`);
      
      const result = await response.json();
      const duration = Date.now() - startTime;
      
      this.metrics.queryPerformance = (this.metrics.queryPerformance + duration) / 2;
      
      return { ...result, queryTime: duration };
    } catch (error) {
      throw error;
    }
  }

  getSystemMetrics() {
    const totalSources = Object.keys(this.dataSources).length;
    const activeSources = Object.values(this.dataSources).filter(s => s.status === 'connected').length;
    const runningPipelines = Object.values(this.pipelines).filter(p => p.status === 'running').length;
    
    return {
      ...this.metrics,
      totalSources,
      activeSources,
      sourceHealthRate: totalSources > 0 ? (activeSources / totalSources * 100) : 100,
      runningPipelines,
      dataSources: this.dataSources,
      pipelines: this.pipelines
    };
  }
}

// React Component for Data Lake Dashboard
const EnterpriseDataLakeDashboard = () => {
  const [dataLake] = useState(() => new EnterpriseDataLake());
  const [metrics, setMetrics] = useState(null);
  const [activeSource, setActiveSource] = useState(null);
  const [activePipeline, setActivePipeline] = useState(null);
  const [queryResult, setQueryResult] = useState(null);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(dataLake.getSystemMetrics());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 3000);
    return () => clearInterval(interval);
  }, [dataLake]);

  const handleSourceSync = useCallback(async (sourceKey) => {
    setActiveSource({ key: sourceKey, status: 'syncing' });
    
    try {
      const result = await dataLake.ingestData(sourceKey);
      setActiveSource({ key: sourceKey, status: 'completed', result });
    } catch (error) {
      setActiveSource({ key: sourceKey, status: 'failed', error: error.message });
    }
  }, [dataLake]);

  const handlePipelineRun = useCallback(async (pipelineKey) => {
    setActivePipeline({ key: pipelineKey, status: 'running' });
    
    try {
      const result = await dataLake.runPipeline(pipelineKey);
      setActivePipeline({ key: pipelineKey, status: 'completed', result });
    } catch (error) {
      setActivePipeline({ key: pipelineKey, status: 'failed', error: error.message });
    }
  }, [dataLake]);

  const handleQuery = useCallback(async (query) => {
    setQueryResult({ status: 'running', query });
    
    try {
      const result = await dataLake.queryData(query);
      setQueryResult({ status: 'completed', query, result });
    } catch (error) {
      setQueryResult({ status: 'failed', query, error: error.message });
    }
  }, [dataLake]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'running':
        return <ClockIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
      case 'failed':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
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
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <CloudIcon className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Enterprise Data Lake</h1>
        </div>
        <p className="text-blue-100">
          Unified data ingestion, processing, and analytics platform for manufacturing intelligence
        </p>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Records</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.totalRecords.toLocaleString()}
              </p>
            </div>
            <ServerIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Processed Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.processedToday.toLocaleString()}
              </p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Source Health</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.sourceHealthRate.toFixed(1)}%
              </p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sources</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.activeSources}/{metrics.totalSources}
              </p>
            </div>
            <CpuChipIcon className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Query Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.queryPerformance.toFixed(0)}ms
              </p>
            </div>
            <ArrowPathIcon className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Data Sources Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
          <ServerIcon className="w-6 h-6" />
          <span>Data Sources</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(DATA_SOURCES).map(([key, source]) => {
            const status = metrics.dataSources[key];
            const IconComponent = source.icon;
            
            return (
              <div key={key} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="font-medium text-gray-900 dark:text-white">{source.name}</h3>
                  </div>
                  {getStatusIcon(status?.status)}
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{source.description}</p>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium">{source.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Schedule:</span>
                    <span className="font-medium">{source.schedule}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Records:</span>
                    <span className="font-medium">{status?.recordCount?.toLocaleString() || 0}</span>
                  </div>
                  {status?.lastSync && (
                    <div className="flex justify-between">
                      <span>Last Sync:</span>
                      <span className="font-medium">
                        {new Date(status.lastSync).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleSourceSync(key)}
                  disabled={activeSource?.key === key && activeSource?.status === 'syncing'}
                  className="w-full mt-4 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors"
                >
                  {activeSource?.key === key && activeSource?.status === 'syncing' ? 'Syncing...' : 'Sync Now'}
                </button>
                
                {status?.error && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-400">
                    {status.error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Processing Pipelines */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
          <CpuChipIcon className="w-6 h-6" />
          <span>Processing Pipelines</span>
        </h2>
        
        <div className="space-y-6">
          {Object.entries(PROCESSING_PIPELINES).map(([key, pipeline]) => {
            const status = metrics.pipelines[key];
            
            return (
              <div key={key} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">{pipeline.name}</h3>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status?.status)}
                    <button
                      onClick={() => handlePipelineRun(key)}
                      disabled={activePipeline?.key === key && activePipeline?.status === 'running'}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded text-sm font-medium transition-colors"
                    >
                      {activePipeline?.key === key && activePipeline?.status === 'running' ? 'Running...' : 'Run Pipeline'}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {pipeline.stages.map((stage, index) => {
                    const isActive = status?.currentStage === index;
                    const isCompleted = status?.currentStage > index || status?.status === 'completed';
                    
                    return (
                      <div
                        key={stage}
                        className={`p-2 rounded text-center text-xs font-medium ${
                          isActive ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' :
                          isCompleted ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {stage.replace('_', ' ')}
                      </div>
                    );
                  })}
                </div>
                
                {status?.duration && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Last run completed in {(status.duration / 1000).toFixed(1)}s
                  </p>
                )}
                
                {status?.error && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-400">
                    {status.error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Query Interface */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
          <ChartBarIcon className="w-6 h-6" />
          <span>Data Analytics Query</span>
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleQuery('SELECT * FROM production_metrics WHERE date >= CURRENT_DATE - INTERVAL 7 DAY')}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <h3 className="font-medium text-gray-900 dark:text-white">Weekly Production</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Last 7 days production data</p>
            </button>
            
            <button
              onClick={() => handleQuery('SELECT machine_id, AVG(efficiency) FROM machine_data GROUP BY machine_id')}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <h3 className="font-medium text-gray-900 dark:text-white">Machine Efficiency</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Average efficiency by machine</p>
            </button>
            
            <button
              onClick={() => handleQuery('SELECT product_id, COUNT(*) as defect_count FROM quality_issues WHERE created_at >= CURRENT_DATE - INTERVAL 30 DAY GROUP BY product_id')}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <h3 className="font-medium text-gray-900 dark:text-white">Quality Issues</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Defects by product (30 days)</p>
            </button>
          </div>
          
          {queryResult && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 dark:text-white">Query Result</h3>
                {getStatusIcon(queryResult.status)}
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Query: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{queryResult.query}</code>
              </div>
              
              {queryResult.status === 'completed' && (
                <div>
                  <p className="text-sm text-green-700 dark:text-green-400 mb-2">
                    Query completed in {queryResult.result.queryTime}ms
                  </p>
                  <div className="bg-white dark:bg-gray-800 rounded border p-3 max-h-64 overflow-auto">
                    <pre className="text-xs">{JSON.stringify(queryResult.result.data, null, 2)}</pre>
                  </div>
                </div>
              )}
              
              {queryResult.error && (
                <div className="text-sm text-red-700 dark:text-red-400">
                  Error: {queryResult.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnterpriseDataLakeDashboard;