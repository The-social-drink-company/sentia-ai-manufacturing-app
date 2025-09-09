import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';

export class AutomationController {
  constructor(databaseService, productionDataIntegrator) {
    this.databaseService = databaseService;
    this.productionDataIntegrator = productionDataIntegrator;
    this.processCache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes for real-time automation data
    
    // Automation process templates
    this.processTemplates = {
      'quality-control': {
        name: 'Quality Control Automation',
        category: 'quality',
        estimatedDuration: 480, // 8 hours in minutes
        requiresOperator: false,
        automationLevel: 'full'
      },
      'packaging': {
        name: 'Automated Packaging',
        category: 'packaging',
        estimatedDuration: 360, // 6 hours
        requiresOperator: true,
        automationLevel: 'semi'
      },
      'assembly': {
        name: 'Assembly Line Automation',
        category: 'assembly',
        estimatedDuration: 600, // 10 hours
        requiresOperator: true,
        automationLevel: 'semi'
      },
      'testing': {
        name: 'Automated Testing',
        category: 'testing',
        estimatedDuration: 240, // 4 hours
        requiresOperator: false,
        automationLevel: 'full'
      }
    };

    // Process status tracking
    this.processStatuses = new Map();
    this.initializeProcesses();
  }

  initializeProcesses() {
    // Initialize with some active processes based on production data
    const sampleProcesses = [
      {
        id: 'QC-001',
        templateId: 'quality-control',
        name: 'Quality Control Batch 2025-001',
        status: 'running',
        progress: 85,
        startTime: new Date(Date.now() - 7 * 60 * 60 * 1000), // Started 7 hours ago
        estimatedCompletion: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour remaining
        lineId: 'line-4',
        priority: 'high',
        automationLevel: 'full'
      },
      {
        id: 'PKG-002',
        templateId: 'packaging',
        name: 'Packaging Line Alpha',
        status: 'running',
        progress: 62,
        startTime: new Date(Date.now() - 5.5 * 60 * 60 * 1000), // Started 5.5 hours ago
        estimatedCompletion: new Date(Date.now() + 2.5 * 60 * 60 * 1000), // 2.5 hours remaining
        lineId: 'line-3',
        priority: 'medium',
        automationLevel: 'semi'
      },
      {
        id: 'ASM-003',
        templateId: 'assembly',
        name: 'Assembly Station B',
        status: 'paused',
        progress: 45,
        startTime: new Date(Date.now() - 8 * 60 * 60 * 1000), // Started 8 hours ago
        estimatedCompletion: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours remaining (paused)
        lineId: 'line-2',
        priority: 'medium',
        automationLevel: 'semi',
        pauseReason: 'Material shortage detected'
      }
    ];

    sampleProcesses.forEach(process => {
      this.processStatuses.set(process.id, process);
    });
  }

  async getAutomationOverview(companyId = 'default') {
    const cacheKey = `automation_overview_${companyId}`;
    
    // Check cache
    const cached = this.processCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      logInfo('Getting automation overview', { companyId });

      // Get production metrics to inform automation status
      const productionMetrics = await this.productionDataIntegrator.getProductionMetrics(companyId, {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        endDate: new Date()
      });

      // Get active processes
      const activeProcesses = Array.from(this.processStatuses.values())
        .filter(process => process.status !== 'completed' && process.status !== 'cancelled');

      // Calculate automation statistics
      const stats = this.calculateAutomationStats(activeProcesses, productionMetrics);

      // Get efficiency trends
      const efficiencyTrend = this.calculateEfficiencyTrend(productionMetrics);

      // Get process performance metrics
      const processMetrics = this.calculateProcessMetrics(activeProcesses, productionMetrics);

      const overview = {
        stats,
        activeProcesses: activeProcesses.map(process => this.formatProcessForAPI(process)),
        efficiencyTrend,
        processMetrics,
        alerts: this.generateAutomationAlerts(activeProcesses, productionMetrics),
        recommendations: this.generateAutomationRecommendations(activeProcesses, productionMetrics),
        lastUpdated: new Date()
      };

      // Cache the results
      this.processCache.set(cacheKey, {
        data: overview,
        timestamp: Date.now()
      });

      logInfo('Automation overview generated successfully', {
        activeProcesses: activeProcesses.length,
        totalProcesses: this.processStatuses.size
      });

      return overview;

    } catch (error) {
      logError('Failed to get automation overview', error);
      return this.getFallbackOverview(companyId, error);
    }
  }

  async controlProcess(processId, action) {
    try {
      logInfo('Process control requested', { processId, action });

      const process = this.processStatuses.get(processId);
      if (!process) {
        throw new Error(`Process ${processId} not found`);
      }

      // Validate action based on current status
      const validTransitions = this.getValidStatusTransitions(process.status);
      if (!validTransitions.includes(action)) {
        throw new Error(`Invalid action '${action}' for process in '${process.status}' state`);
      }

      // Update process status
      const updatedProcess = { ...process };
      const now = new Date();

      switch (action) {
        case 'start':
          updatedProcess.status = 'running';
          if (process.status === 'paused') {
            // Resume from where it left off
            const pausedDuration = now - new Date(process.pausedAt || process.startTime);
            updatedProcess.estimatedCompletion = new Date(now.getTime() + pausedDuration);
          } else {
            updatedProcess.startTime = now;
            updatedProcess.estimatedCompletion = new Date(now.getTime() + this.processTemplates[process.templateId].estimatedDuration * 60 * 1000);
          }
          updatedProcess.resumedAt = now;
          break;

        case 'pause':
          updatedProcess.status = 'paused';
          updatedProcess.pausedAt = now;
          break;

        case 'stop':
          updatedProcess.status = 'stopped';
          updatedProcess.stoppedAt = now;
          break;

        case 'reset':
          updatedProcess.status = 'ready';
          updatedProcess.progress = 0;
          updatedProcess.startTime = null;
          updatedProcess.estimatedCompletion = null;
          break;
      }

      // Save updated process
      this.processStatuses.set(processId, updatedProcess);

      // Clear related caches
      this.clearAutomationCaches();

      // Log the control action
      await this.logProcessAction(processId, action, updatedProcess);

      logInfo('Process control executed successfully', {
        processId,
        action,
        newStatus: updatedProcess.status
      });

      return {
        success: true,
        process: this.formatProcessForAPI(updatedProcess),
        action,
        timestamp: now
      };

    } catch (error) {
      logError('Failed to control process', { processId, action, error: error.message });
      throw error;
    }
  }

  async createProcess(templateId, options = {}) {
    try {
      const template = this.processTemplates[templateId];
      if (!template) {
        throw new Error(`Process template '${templateId}' not found`);
      }

      const processId = this.generateProcessId(templateId);
      const now = new Date();

      const newProcess = {
        id: processId,
        templateId,
        name: options.name || template.name,
        status: 'ready',
        progress: 0,
        priority: options.priority || 'medium',
        lineId: options.lineId || null,
        createdAt: now,
        automationLevel: template.automationLevel,
        requiresOperator: template.requiresOperator,
        estimatedDuration: template.estimatedDuration,
        ...options
      };

      this.processStatuses.set(processId, newProcess);
      this.clearAutomationCaches();

      logInfo('New automation process created', { processId, templateId });

      return {
        success: true,
        process: this.formatProcessForAPI(newProcess)
      };

    } catch (error) {
      logError('Failed to create process', error);
      throw error;
    }
  }

  async getProcess(processId) {
    const process = this.processStatuses.get(processId);
    if (!process) {
      throw new Error(`Process ${processId} not found`);
    }

    return this.formatProcessForAPI(process);
  }

  async getAllProcesses() {
    const processes = Array.from(this.processStatuses.values());
    return processes.map(process => this.formatProcessForAPI(process));
  }

  calculateAutomationStats(activeProcesses, productionMetrics) {
    const totalProcesses = this.processStatuses.size;
    const runningProcesses = activeProcesses.filter(p => p.status === 'running').length;
    const pausedProcesses = activeProcesses.filter(p => p.status === 'paused').length;
    
    // Calculate completed processes today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = Array.from(this.processStatuses.values())
      .filter(p => p.status === 'completed' && new Date(p.completedAt || p.updatedAt) >= today)
      .length;

    // Get efficiency from production metrics
    const averageEfficiency = productionMetrics?.efficiency?.overall * 100 || 94.2;

    // Calculate automation utilization
    const automationUtilization = totalProcesses > 0 ? (runningProcesses / totalProcesses) * 100 : 0;

    return {
      totalProcesses,
      activeProcesses: runningProcesses,
      pausedProcesses,
      completedToday,
      averageEfficiency: Number(averageEfficiency.toFixed(1)),
      automationUtilization: Number(automationUtilization.toFixed(1)),
      uptime: productionMetrics?.availability?.overall * 100 || 92.5
    };
  }

  calculateEfficiencyTrend(productionMetrics) {
    // Generate 24-hour efficiency trend based on production data
    const trend = [];
    const now = new Date();
    const baseEfficiency = productionMetrics?.efficiency?.overall * 100 || 94;
    
    for (let i = 0; i < 24; i += 4) {
      const time = String(i).padStart(2, '0') + ':00';
      // Add some realistic variation based on shift patterns
      let efficiency = baseEfficiency;
      if (i >= 0 && i < 8) efficiency += Math.random() * 4 - 2; // Night shift
      if (i >= 8 && i < 16) efficiency += Math.random() * 6 - 1; // Day shift
      if (i >= 16 && i < 24) efficiency += Math.random() * 3 - 2; // Evening shift
      
      trend.push({
        time,
        efficiency: Math.max(80, Math.min(100, Number(efficiency.toFixed(1))))
      });
    }

    return trend;
  }

  calculateProcessMetrics(activeProcesses, productionMetrics) {
    const processCategories = ['Quality Control', 'Packaging', 'Assembly', 'Testing'];
    
    return processCategories.map(category => {
      const categoryProcesses = activeProcesses.filter(p => 
        this.processTemplates[p.templateId]?.category === category.toLowerCase().replace(' ', '-')
      );
      
      // Calculate uptime and efficiency for this category
      const runningCount = categoryProcesses.filter(p => p.status === 'running').length;
      const totalCount = Math.max(1, categoryProcesses.length);
      const uptime = (runningCount / totalCount) * 100;
      
      // Use production metrics if available, otherwise simulate
      const efficiency = productionMetrics?.efficiency?.overall * 100 || (90 + Math.random() * 8);
      
      return {
        name: category,
        uptime: Number(uptime.toFixed(1)),
        efficiency: Number(efficiency.toFixed(1))
      };
    });
  }

  generateAutomationAlerts(activeProcesses, productionMetrics) {
    const alerts = [];

    // Check for paused processes
    const pausedProcesses = activeProcesses.filter(p => p.status === 'paused');
    if (pausedProcesses.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Processes Paused',
        message: `${pausedProcesses.length} automation process(es) are currently paused`,
        processes: pausedProcesses.map(p => p.id),
        action: 'Review and resume paused processes'
      });
    }

    // Check for long-running processes
    const now = new Date();
    const longRunningProcesses = activeProcesses.filter(p => {
      if (p.status !== 'running') return false;
      const runningTime = now - new Date(p.startTime);
      const expectedDuration = this.processTemplates[p.templateId]?.estimatedDuration * 60 * 1000;
      return runningTime > expectedDuration * 1.2; // 20% over expected time
    });

    if (longRunningProcesses.length > 0) {
      alerts.push({
        type: 'error',
        title: 'Processes Overrunning',
        message: `${longRunningProcesses.length} process(es) are taking longer than expected`,
        processes: longRunningProcesses.map(p => p.id),
        action: 'Investigate process performance issues'
      });
    }

    // Check overall efficiency
    if (productionMetrics?.efficiency?.overall < 0.8) {
      alerts.push({
        type: 'warning',
        title: 'Low Automation Efficiency',
        message: `Overall efficiency is ${(productionMetrics.efficiency.overall * 100).toFixed(1)}%`,
        action: 'Review automation parameters and optimize processes'
      });
    }

    return alerts;
  }

  generateAutomationRecommendations(activeProcesses, productionMetrics) {
    const recommendations = [];

    // Recommend starting new processes if capacity allows
    const runningProcesses = activeProcesses.filter(p => p.status === 'running').length;
    const totalCapacity = Object.keys(this.processTemplates).length;
    
    if (runningProcesses < totalCapacity * 0.8) {
      recommendations.push({
        type: 'optimization',
        title: 'Increase Automation Utilization',
        description: 'Current automation utilization is below optimal levels',
        impact: 'Could increase throughput by 15-20%',
        actions: ['Start additional automation processes', 'Review process scheduling']
      });
    }

    // Recommend maintenance if efficiency is declining
    if (productionMetrics?.trends?.efficiency === 'declining') {
      recommendations.push({
        type: 'maintenance',
        title: 'Schedule Preventive Maintenance',
        description: 'Efficiency trends indicate potential equipment issues',
        impact: 'Prevent unplanned downtime and maintain performance',
        actions: ['Schedule equipment inspection', 'Update automation parameters']
      });
    }

    // Recommend process optimization
    const averageProgress = activeProcesses.reduce((sum, p) => sum + p.progress, 0) / activeProcesses.length;
    if (averageProgress < 70 && activeProcesses.length > 0) {
      recommendations.push({
        type: 'optimization',
        title: 'Optimize Process Parameters',
        description: 'Process completion rates could be improved',
        impact: 'Reduce cycle times by 10-15%',
        actions: ['Review process configurations', 'Optimize automation sequences']
      });
    }

    return recommendations;
  }

  getValidStatusTransitions(currentStatus) {
    const transitions = {
      'ready': ['start'],
      'running': ['pause', 'stop'],
      'paused': ['start', 'stop'],
      'stopped': ['reset'],
      'completed': ['reset'],
      'cancelled': ['reset'],
      'error': ['reset']
    };

    return transitions[currentStatus] || [];
  }

  formatProcessForAPI(process) {
    return {
      id: process.id,
      name: process.name,
      status: process.status,
      progress: this.calculateCurrentProgress(process),
      startTime: process.startTime,
      estimatedCompletion: process.estimatedCompletion,
      lineId: process.lineId,
      priority: process.priority,
      automationLevel: process.automationLevel,
      requiresOperator: process.requiresOperator,
      pauseReason: process.pauseReason,
      template: this.processTemplates[process.templateId]
    };
  }

  calculateCurrentProgress(process) {
    if (process.status === 'completed') return 100;
    if (process.status === 'ready' || !process.startTime) return process.progress || 0;

    const now = new Date();
    const startTime = new Date(process.startTime);
    const estimatedDuration = this.processTemplates[process.templateId]?.estimatedDuration * 60 * 1000;

    if (!estimatedDuration) return process.progress || 0;

    // Calculate progress based on time elapsed
    const elapsed = now - startTime;
    const timeProgress = Math.min(100, (elapsed / estimatedDuration) * 100);
    
    // For paused processes, don't advance time-based progress
    if (process.status === 'paused' && process.pausedAt) {
      const pausedTime = new Date(process.pausedAt) - startTime;
      return Math.min(100, (pausedTime / estimatedDuration) * 100);
    }

    return Math.max(process.progress || 0, Math.min(100, timeProgress));
  }

  generateProcessId(templateId) {
    const prefix = templateId.split('-')[0].toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  }

  async logProcessAction(processId, action, process) {
    try {
      // In a real implementation, this would log to the database
      logInfo('Process action logged', {
        processId,
        action,
        status: process.status,
        timestamp: new Date()
      });
    } catch (error) {
      logError('Failed to log process action', error);
    }
  }

  clearAutomationCaches() {
    // Clear all automation-related caches
    for (const key of this.processCache.keys()) {
      if (key.includes('automation')) {
        this.processCache.delete(key);
      }
    }
  }

  getFallbackOverview(companyId, error) {
    return {
      error: error.message,
      fallback: true,
      stats: {
        totalProcesses: 12,
        activeProcesses: 8,
        pausedProcesses: 1,
        completedToday: 24,
        averageEfficiency: 94.2,
        automationUtilization: 66.7,
        uptime: 92.5
      },
      activeProcesses: Array.from(this.processStatuses.values())
        .filter(p => p.status !== 'completed')
        .map(process => this.formatProcessForAPI(process)),
      alerts: [{
        type: 'error',
        title: 'System Error',
        message: `Automation system error: ${error.message}`,
        action: 'Check system connectivity'
      }],
      lastUpdated: new Date()
    };
  }

  // Cache management
  clearCache() {
    this.processCache.clear();
    logInfo('Automation controller cache cleared');
  }

  getCacheStats() {
    return {
      size: this.processCache.size,
      timeout: this.cacheTimeout,
      keys: Array.from(this.processCache.keys())
    };
  }
}

export default AutomationController;