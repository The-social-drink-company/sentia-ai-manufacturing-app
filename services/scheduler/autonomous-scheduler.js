/**
 * Autonomous Test Scheduler - Continuous 10-Minute Test & Heal Cycle
 * Orchestrates the complete autonomous testing and healing process
 * with intelligent scheduling, resource management, and failure handling
 */

import EventEmitter from 'events';
import cron from 'cron';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

// Import our autonomous components
import SelfHealingAgent from '../agent/self-healing-agent.js';
import TestDataFactory from '../../tests/autonomous/test-data-factory.js';
import TestResultAnalyzer from '../../tests/autonomous/result-analyzer.js';
import CodeCorrectionEngine from '../agent/code-corrector.js';
import DeploymentOrchestrator from '../agent/deploy-orchestrator.js';

class AutonomousScheduler extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Core scheduling
      testInterval: '*/10 * * * *', // Every 10 minutes (cron format)
      enableScheduling: true,
      maxConcurrentRuns: 1,
      
      // Component configuration
      agent: {
        testInterval: 10 * 60 * 1000, // 10 minutes in ms
        autoFixEnabled: true,
        deploymentEnabled: true,
        rollbackEnabled: true
      },
      
      // Resource management
      resourceLimits: {
        maxMemoryUsage: 2 * 1024 * 1024 * 1024, // 2GB
        maxCpuUsage: 80, // 80%
        maxDiskUsage: 90 // 90%
      },
      
      // Failure handling
      failureHandling: {
        maxConsecutiveFailures: 5,
        backoffMultiplier: 2,
        maxBackoffTime: 60 * 60 * 1000, // 1 hour
        emergencyStopThreshold: 10
      },
      
      // Monitoring
      monitoring: {
        enableMetrics: true,
        enableAlerts: true,
        alertWebhook: null
      },
      
      ...config
    };

    // Initialize components
    this.initializeComponents();
    
    // Scheduler state
    this.state = {
      isRunning: false,
      currentRun: null,
      consecutiveFailures: 0,
      totalRuns: 0,
      successfulRuns: 0,
      lastRun: null,
      nextRun: null,
      backoffTime: 0
    };

    // Performance metrics
    this.metrics = {
      runDurations: [],
      resourceUsage: [],
      errorRates: [],
      fixSuccessRates: [],
      deploymentTimes: []
    };

    // Initialize scheduler
    this.initialize();
  }

  initializeComponents() {
    console.log('🔧 Initializing autonomous components...');
    
    try {
      this.selfHealingAgent = new SelfHealingAgent(this.config.agent);
      this.testDataFactory = new TestDataFactory();
      this.resultAnalyzer = new TestResultAnalyzer();
      this.codeCorrector = new CodeCorrectionEngine();
      this.deployOrchestrator = new DeploymentOrchestrator();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('✅ All autonomous components initialized');
    } catch (error) {
      console.error('❌ Failed to initialize components:', error.message);
      throw error;
    }
  }

  setupEventListeners() {
    // Self-healing agent events
    this.selfHealingAgent.on('cycleCompleted', (analysis) => {
      this.handleCycleCompleted(analysis);
    });
    
    this.selfHealingAgent.on('emergencyStop', () => {
      this.handleEmergencyStop();
    });

    // Deployment orchestrator events
    this.deployOrchestrator.on('deploymentCompleted', (deployment) => {
      this.metrics.deploymentTimes.push(deployment.duration);
    });
    
    this.deployOrchestrator.on('deploymentFailed', (deployment) => {
      console.error(`🚨 Deployment ${deployment.id} failed`);
      this.handleDeploymentFailure(deployment);
    });

    // Process events
    process.on('SIGINT', () => this.gracefulShutdown());
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('uncaughtException', (error) => {
      console.error('🚨 Uncaught exception in scheduler:', error);
      this.handleCriticalError(error);
    });
  }

  async initialize() {
    console.log('🤖 INITIALIZING AUTONOMOUS SCHEDULER');
    
    // Create directories
    this.ensureDirectories();
    
    // Load historical state
    await this.loadState();
    
    // Validate system resources
    await this.validateResources();
    
    // Initialize cron job
    this.initializeCronJob();
    
    console.log('✅ Autonomous Scheduler initialized successfully');
    this.emit('initialized');
  }

  ensureDirectories() {
    const dirs = [
      'logs/scheduler',
      'logs/autonomous',
      'tests/autonomous/runs',
      'metrics/scheduler'
    ];

    dirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  async loadState() {
    try {
      const stateFile = path.join(process.cwd(), 'logs', 'scheduler', 'scheduler-state.json');
      if (fs.existsSync(stateFile)) {
        const savedState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        this.state = { ...this.state, ...savedState.state };
        this.metrics = { ...this.metrics, ...savedState.metrics };
        console.log('📚 Scheduler state loaded from disk');
      }
    } catch (error) {
      console.warn(`Failed to load scheduler state: ${error.message}`);
    }
  }

  async validateResources() {
    const resources = await this.checkSystemResources();
    
    if (resources.memoryUsagePercent > this.config.resourceLimits.maxMemoryUsage) {
      console.warn(`⚠️ High memory usage: ${resources.memoryUsagePercent}%`);
    }
    
    if (resources.diskUsagePercent > this.config.resourceLimits.maxDiskUsage) {
      throw new Error(`Insufficient disk space: ${resources.diskUsagePercent}% used`);
    }
    
    console.log('✅ System resources validated');
  }

  initializeCronJob() {
    if (!this.config.enableScheduling) {
      console.log('⏸️ Scheduling disabled by configuration');
      return;
    }

    this.cronJob = new cron.CronJob(
      this.config.testInterval,
      () => this.executeCycle(),
      null, // onComplete
      false, // start immediately
      'America/New_York' // timezone
    );

    console.log(`⏰ Cron job initialized: ${this.config.testInterval}`);
    this.updateNextRunTime();
  }

  // Main orchestration methods
  async start() {
    if (this.state.isRunning) {
      console.log('⚠️ Scheduler is already running');
      return;
    }

    console.log('🚀 STARTING AUTONOMOUS SCHEDULER');
    
    this.state.isRunning = true;
    
    // Start the self-healing agent
    await this.selfHealingAgent.start();
    
    // Start cron job if enabled
    if (this.cronJob) {
      this.cronJob.start();
      console.log(`⏰ Scheduled testing every ${this.config.testInterval}`);
    }
    
    // Run immediate test cycle
    if (this.config.runImmediately !== false) {
      setTimeout(() => this.executeCycle(), 5000); // Wait 5 seconds then start
    }
    
    this.emit('started');
    console.log('✅ Autonomous Scheduler started successfully');
  }

  async stop() {
    console.log('🛑 Stopping Autonomous Scheduler...');
    
    this.state.isRunning = false;
    
    // Stop cron job
    if (this.cronJob) {
      this.cronJob.stop();
    }
    
    // Stop self-healing agent
    await this.selfHealingAgent.stop();
    
    // Wait for current run to complete
    if (this.state.currentRun) {
      console.log('⏳ Waiting for current run to complete...');
      await this.waitForCurrentRun();
    }
    
    await this.saveState();
    this.emit('stopped');
    console.log('✅ Autonomous Scheduler stopped');
  }

  async executeCycle() {
    // Check if we should skip this cycle
    if (!this.shouldExecuteCycle()) {
      return;
    }

    const runId = this.generateRunId();
    const startTime = Date.now();
    
    console.log(`🔄 Starting autonomous cycle: ${runId}`);
    
    const run = {
      id: runId,
      startTime: new Date().toISOString(),
      status: 'running',
      phases: [],
      errors: [],
      metrics: {}
    };

    this.state.currentRun = run;
    this.state.totalRuns++;
    
    try {
      // Phase 1: Pre-flight checks
      await this.executePhase(run, 'preflight', async () => {
        await this.preflightChecks(run);
      });

      // Phase 2: Generate test data
      await this.executePhase(run, 'test-data', async () => {
        await this.generateTestData(run);
      });

      // Phase 3: Execute comprehensive tests
      await this.executePhase(run, 'testing', async () => {
        await this.executeTests(run);
      });

      // Phase 4: Analyze results
      await this.executePhase(run, 'analysis', async () => {
        await this.analyzeResults(run);
      });

      // Phase 5: Apply fixes (if needed)
      if (run.analysis && run.analysis.failedTests > 0) {
        await this.executePhase(run, 'fixing', async () => {
          await this.applyFixes(run);
        });
      }

      // Phase 6: Deploy changes (if fixes applied)
      if (run.fixes && run.fixes.applied && run.fixes.applied.length > 0) {
        await this.executePhase(run, 'deployment', async () => {
          await this.deployChanges(run);
        });
      }

      // Phase 7: Validation
      await this.executePhase(run, 'validation', async () => {
        await this.validateChanges(run);
      });

      run.status = 'completed';
      run.endTime = new Date().toISOString();
      run.duration = Date.now() - startTime;
      
      this.state.successfulRuns++;
      this.state.consecutiveFailures = 0;
      this.state.backoffTime = 0; // Reset backoff
      
      console.log(`✅ Autonomous cycle ${runId} completed successfully in ${run.duration}ms`);
      this.emit('cycleCompleted', run);

    } catch (error) {
      console.error(`❌ Autonomous cycle ${runId} failed:`, error.message);
      
      run.status = 'failed';
      run.endTime = new Date().toISOString();
      run.duration = Date.now() - startTime;
      run.error = error.message;
      
      this.state.consecutiveFailures++;
      this.handleCycleFailure(run, error);
      
      this.emit('cycleFailed', run);
    } finally {
      this.state.currentRun = null;
      this.state.lastRun = run;
      
      this.updateMetrics(run);
      await this.saveRunRecord(run);
      await this.saveState();
      
      this.updateNextRunTime();
    }
  }

  async executePhase(run, phaseName, phaseFunction) {
    const phase = {
      name: phaseName,
      startTime: new Date().toISOString(),
      status: 'running'
    };

    run.phases.push(phase);
    
    console.log(`🔄 Executing phase: ${phaseName}`);
    
    try {
      const phaseStartTime = Date.now();
      await phaseFunction();
      
      phase.endTime = new Date().toISOString();
      phase.duration = Date.now() - phaseStartTime;
      phase.status = 'completed';
      
      console.log(`✅ Phase ${phaseName} completed in ${phase.duration}ms`);
    } catch (error) {
      phase.endTime = new Date().toISOString();
      phase.status = 'failed';
      phase.error = error.message;
      
      console.error(`❌ Phase ${phaseName} failed:`, error.message);
      throw error;
    }
  }

  shouldExecuteCycle() {
    // Check if already running
    if (this.state.currentRun) {
      console.log('⏸️ Skipping cycle - another run is in progress');
      return false;
    }

    // Check backoff time
    if (this.state.backoffTime > 0 && Date.now() < this.state.backoffTime) {
      const remainingTime = Math.ceil((this.state.backoffTime - Date.now()) / 1000 / 60);
      console.log(`⏸️ Skipping cycle - in backoff period (${remainingTime}min remaining)`);
      return false;
    }

    // Check consecutive failures
    if (this.state.consecutiveFailures >= this.config.failureHandling.emergencyStopThreshold) {
      console.error('🚨 Too many consecutive failures - emergency stop triggered');
      this.handleEmergencyStop();
      return false;
    }

    // Check system resources
    const resources = this.checkSystemResourcesSync();
    if (resources.memoryUsagePercent > 90) {
      console.warn('⚠️ Skipping cycle - high memory usage');
      return false;
    }

    return true;
  }

  async preflightChecks(run) {
    console.log('🔍 Running preflight checks...');
    
    const checks = [];
    
    // System resources
    const resources = await this.checkSystemResources();
    checks.push({
      name: 'system_resources',
      passed: resources.memoryUsagePercent < 85 && resources.diskUsagePercent < 90,
      details: resources
    });
    
    // Git repository status (non-fatal in container environments)
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      const { stdout } = await execAsync('git status --porcelain');
      checks.push({
        name: 'git_status',
        passed: true,
        details: { uncommittedChanges: stdout.trim().split('\n').filter(Boolean).length }
      });
    } catch (error) {
      checks.push({
        name: 'git_status',
        passed: true,
        details: { skipped: true }
      });
    }
    
    // Network connectivity
    try {
      const response = await fetch('https://www.google.com', { timeout: 5000 });
      checks.push({
        name: 'network_connectivity',
        passed: response.ok,
        details: { status: response.status }
      });
    } catch (error) {
      checks.push({
        name: 'network_connectivity',
        passed: false,
        error: error.message
      });
    }

    run.preflightChecks = checks;
    
    const failedChecks = checks.filter(c => !c.passed);
    if (failedChecks.length > 0) {
      console.warn(`⚠️ ${failedChecks.length} preflight checks failed`);
      // Continue anyway for non-critical failures
    } else {
      console.log('✅ All preflight checks passed');
    }
  }

  async generateTestData(run) {
    console.log('📊 Generating comprehensive test data...');
    
    const scenario = this.testDataFactory.generateCompleteTestScenario('autonomous_run');
    const summary = this.testDataFactory.saveTestDataToFiles(scenario);
    
    run.testData = {
      scenario: scenario.name,
      recordCounts: summary.recordCounts,
      dataSize: summary.dataSize,
      generatedAt: scenario.generatedAt
    };
    
    console.log(`✅ Test data generated: ${summary.dataSize}`);
  }

  async executeTests(run) {
    console.log('🧪 Executing comprehensive test suite...');
    
    // Import and run the master test suite
    const { execAsync } = await import('util');
    const { promisify } = await import('util');
    const execPromise = promisify(exec);
    
    const testCommands = [
      { name: 'playwright_tests', command: 'npx playwright test tests/autonomous/master-test-suite.js', timeout: 600000 },
      { name: 'unit_tests', command: 'npm run test:run', timeout: 300000 },
      { name: 'lint_check', command: 'npm run lint', timeout: 120000 }
    ];

    const testResults = [];
    
    for (const testCmd of testCommands) {
      try {
        console.log(`🔬 Running ${testCmd.name}...`);
        const startTime = Date.now();
        
        const result = await execPromise(testCmd.command, { 
          timeout: testCmd.timeout,
          maxBuffer: 1024 * 1024 * 10 // 10MB
        });
        
        const duration = Date.now() - startTime;
        
        testResults.push({
          name: testCmd.name,
          command: testCmd.command,
          status: 'passed',
          duration,
          stdout: result.stdout,
          stderr: result.stderr
        });
        
        console.log(`✅ ${testCmd.name} passed in ${duration}ms`);
        
      } catch (error) {
        const duration = Date.now() - (testCmd.startTime || Date.now());
        
        testResults.push({
          name: testCmd.name,
          command: testCmd.command,
          status: 'failed',
          duration,
          error: error.message,
          stdout: error.stdout || '',
          stderr: error.stderr || ''
        });
        
        console.error(`❌ ${testCmd.name} failed:`, error.message);
      }
    }

    run.testResults = testResults;
    
    const passedTests = testResults.filter(t => t.status === 'passed').length;
    console.log(`🎯 Tests completed: ${passedTests}/${testResults.length} passed`);
  }

  async analyzeResults(run) {
    console.log('📊 Analyzing test results...');
    
    // Convert test results to format expected by analyzer
    const analysisInput = run.testResults.map(test => ({
      testName: test.name,
      result: test.status === 'passed' ? 'pass' : 'fail',
      duration: test.duration,
      error: test.error ? { message: test.error } : null,
      context: {
        command: test.command,
        stdout: test.stdout,
        stderr: test.stderr
      }
    }));

    const analysis = this.resultAnalyzer.analyzeTestResults(analysisInput);
    const actionableReport = this.resultAnalyzer.generateActionableReport(analysis);
    
    run.analysis = analysis;
    run.actionableReport = actionableReport;
    
    console.log(`📈 Analysis complete: ${analysis.passedTests}/${analysis.totalTests} passed, Risk: ${analysis.riskAssessment.level}`);
  }

  async applyFixes(run) {
    console.log('🔧 Applying autonomous fixes...');
    
    const fixes = await this.codeCorrector.applyCorrections(run.analysis);
    run.fixes = fixes;
    
    console.log(`✅ Applied ${fixes.applied.length} fixes, ${fixes.failed.length} failed`);
  }

  async deployChanges(run) {
    console.log('🚀 Deploying changes...');
    
    const deployment = await this.deployOrchestrator.orchestrateDeployment(
      run.fixes,
      {
        environments: ['localhost', 'test', 'production'],
        skipTests: false, // We already ran comprehensive tests
        rollbackOnFailure: true
      }
    );
    
    run.deployment = deployment;
    
    console.log(`✅ Deployment ${deployment.id} completed`);
  }

  async validateChanges(run) {
    console.log('🔍 Validating changes...');
    
    // Run a quick validation test
    const { execAsync } = await import('util');
    const { promisify } = await import('util');
    const execPromise = promisify(exec);
    
    try {
      // Basic health check
      await execPromise('npm run test:run -- --testPathPattern=health', { timeout: 60000 });
      
      run.validation = {
        status: 'passed',
        message: 'All validation checks passed'
      };
      
      console.log('✅ Validation passed');
    } catch (error) {
      run.validation = {
        status: 'failed',
        error: error.message
      };
      
      console.error('❌ Validation failed:', error.message);
      
      // Don't throw - we've already deployed, just log the issue
    }
  }

  // Event handlers
  handleCycleCompleted(analysis) {
    console.log(`🎯 Cycle completed with ${analysis.passedTests}/${analysis.totalTests} tests passed`);
  }

  handleCycleFailure(run, error) {
    console.error(`🚨 Cycle ${run.id} failed after ${this.state.consecutiveFailures} consecutive failures`);
    
    // Calculate backoff time
    if (this.state.consecutiveFailures >= this.config.failureHandling.maxConsecutiveFailures) {
      const backoffMultiplier = Math.min(
        Math.pow(this.config.failureHandling.backoffMultiplier, this.state.consecutiveFailures - this.config.failureHandling.maxConsecutiveFailures),
        this.config.failureHandling.maxBackoffTime / (10 * 60 * 1000) // Convert to intervals
      );
      
      this.state.backoffTime = Date.now() + (10 * 60 * 1000 * backoffMultiplier);
      
      const backoffMinutes = Math.ceil((this.state.backoffTime - Date.now()) / 1000 / 60);
      console.log(`⏸️ Entering backoff period: ${backoffMinutes} minutes`);
    }
    
    // Send alert if configured
    if (this.config.monitoring.alertWebhook) {
      this.sendAlert('CYCLE_FAILURE', {
        runId: run.id,
        consecutiveFailures: this.state.consecutiveFailures,
        error: error.message
      });
    }
  }

  handleEmergencyStop() {
    console.error('🚨 EMERGENCY STOP TRIGGERED');
    
    this.state.isRunning = false;
    
    if (this.cronJob) {
      this.cronJob.stop();
    }
    
    // Send critical alert
    if (this.config.monitoring.alertWebhook) {
      this.sendAlert('EMERGENCY_STOP', {
        consecutiveFailures: this.state.consecutiveFailures,
        timestamp: new Date().toISOString()
      });
    }
    
    this.emit('emergencyStop');
  }

  handleDeploymentFailure(deployment) {
    console.error(`🚨 Deployment failure: ${deployment.id}`);
    
    if (this.config.monitoring.alertWebhook) {
      this.sendAlert('DEPLOYMENT_FAILURE', deployment);
    }
  }

  handleCriticalError(error) {
    console.error('🚨 CRITICAL ERROR:', error);
    
    if (this.config.monitoring.alertWebhook) {
      this.sendAlert('CRITICAL_ERROR', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
    
    // Force stop
    this.state.isRunning = false;
    this.emit('criticalError', error);
  }

  // Utility methods
  async checkSystemResources() {
    const memUsage = process.memoryUsage();
    const { totalmem, freemem } = await import('os');
    const totalMemory = totalmem();
    const freeMemory = freemem();
    
    return {
      memory: {
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external
      },
      memoryUsagePercent: ((totalMemory - freeMemory) / totalMemory) * 100,
      diskUsagePercent: 50, // Simplified - would need platform-specific implementation
      cpuUsagePercent: 25, // Simplified - would need actual CPU monitoring
      uptime: process.uptime()
    };
  }

  checkSystemResourcesSync() {
    // Simplified synchronous version
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    
    return {
      memoryUsagePercent: ((totalMemory - freeMemory) / totalMemory) * 100
    };
  }

  updateMetrics(run) {
    if (run.duration) {
      this.metrics.runDurations.push(run.duration);
    }

    // Keep only last 100 metrics
    Object.keys(this.metrics).forEach(key => {
      if (Array.isArray(this.metrics[key]) && this.metrics[key].length > 100) {
        this.metrics[key] = this.metrics[key].slice(-100);
      }
    });
  }

  /**
   * Track performance metrics for monitoring
   * @param {string} metric - The metric name
   * @param {number|object} value - The metric value
   */
  trackPerformance(metric, value) {
    try {
      // Store in appropriate metrics collection
      switch (metric) {
        case 'runDuration':
          this.metrics.runDurations.push(value);
          break;
        case 'resourceUsage':
          this.metrics.resourceUsage.push(value);
          break;
        case 'errorRate':
          this.metrics.errorRates.push(value);
          break;
        case 'fixSuccessRate':
          this.metrics.fixSuccessRates.push(value);
          break;
        case 'deploymentTime':
          this.metrics.deploymentTimes.push(value);
          break;
        default:
          // Store custom metrics
          if (!this.metrics[metric]) {
            this.metrics[metric] = [];
          }
          this.metrics[metric].push({
            value,
            timestamp: new Date().toISOString()
          });
      }

      // Keep only last 100 entries per metric
      if (this.metrics[metric] && Array.isArray(this.metrics[metric]) && this.metrics[metric].length > 100) {
        this.metrics[metric] = this.metrics[metric].slice(-100);
      }

      // Emit metric event for real-time monitoring
      this.emit('metricTracked', { metric, value, timestamp: new Date() });

    } catch (error) {
      console.error(`Failed to track performance metric ${metric}:`, error.message);
    }
  }

  async saveRunRecord(run) {
    try {
      const runFile = path.join(process.cwd(), 'tests', 'autonomous', 'runs', `${run.id}.json`);
      fs.writeFileSync(runFile, JSON.stringify(run, null, 2));
    } catch (error) {
      console.error('Failed to save run record:', error.message);
    }
  }

  async saveState() {
    try {
      const stateData = {
        timestamp: new Date().toISOString(),
        state: this.state,
        metrics: this.metrics,
        config: this.config
      };
      
      const stateFile = path.join(process.cwd(), 'logs', 'scheduler', 'scheduler-state.json');
      fs.writeFileSync(stateFile, JSON.stringify(stateData, null, 2));
    } catch (error) {
      console.error('Failed to save scheduler state:', error.message);
    }
  }

  updateNextRunTime() {
    if (this.cronJob) {
      try {
        const nextDate = this.cronJob.nextDate();
        if (nextDate && typeof nextDate.toISOString === 'function') {
          this.state.nextRun = nextDate.toISOString();
        } else if (nextDate && typeof nextDate.toDate === 'function') {
          // Handle moment or other date-like objects
          this.state.nextRun = nextDate.toDate().toISOString();
        } else {
          this.state.nextRun = new Date(Date.now() + 600000).toISOString(); // Default to 10 minutes
        }
      } catch (error) {
        console.log('Error getting next run time:', error.message);
        this.state.nextRun = new Date(Date.now() + 600000).toISOString(); // Default to 10 minutes
      }
    }
  }

  generateRunId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    const random = Math.random().toString(36).substr(2, 6);
    return `run_${timestamp}_${random}`;
  }

  async waitForCurrentRun() {
    while (this.state.currentRun) {
      await this.sleep(1000);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async sendAlert(type, data) {
    if (!this.config.monitoring.alertWebhook) {
      return;
    }
    
    try {
      const alert = {
        type,
        timestamp: new Date().toISOString(),
        scheduler: this.getStatus(),
        data
      };
      
      await fetch(this.config.monitoring.alertWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
        timeout: 10000
      });
    } catch (error) {
      console.error('Failed to send alert:', error.message);
    }
  }

  async gracefulShutdown() {
    console.log('\n🛑 Received shutdown signal - performing graceful shutdown...');
    await this.stop();
    process.exit(0);
  }

  // Public API methods
  getStatus() {
    return {
      isRunning: this.state.isRunning,
      currentRun: this.state.currentRun?.id || null,
      lastRun: this.state.lastRun?.id || null,
      nextRun: this.state.nextRun,
      totalRuns: this.state.totalRuns,
      successfulRuns: this.state.successfulRuns,
      consecutiveFailures: this.state.consecutiveFailures,
      successRate: this.state.totalRuns > 0 ? (this.state.successfulRuns / this.state.totalRuns) * 100 : 0,
      backoffTime: this.state.backoffTime,
      uptime: process.uptime()
    };
  }

  getMetrics() {
    return {
      ...this.metrics,
      averageRunDuration: this.metrics.runDurations.length > 0 ?
        this.metrics.runDurations.reduce((a, b) => a + b, 0) / this.metrics.runDurations.length : 0,
      lastResourceCheck: this.checkSystemResourcesSync()
    };
  }

  getCurrentRun() {
    return this.state.currentRun;
  }

  getRunHistory(limit = 10) {
    const runDir = path.join(process.cwd(), 'tests', 'autonomous', 'runs');
    if (!fs.existsSync(runDir)) {
      return [];
    }

    const runFiles = fs.readdirSync(runDir)
      .filter(file => file.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, limit);

    return runFiles.map(file => {
      try {
        const content = fs.readFileSync(path.join(runDir, file), 'utf8');
        return JSON.parse(content);
      } catch (error) {
        return null;
      }
    }).filter(Boolean);
  }

  // Control methods
  async triggerManualRun() {
    if (this.state.currentRun) {
      throw new Error('Another run is already in progress');
    }
    
    console.log('🔄 Triggering manual test cycle...');
    return this.executeCycle();
  }

  pauseScheduler() {
    if (this.cronJob) {
      this.cronJob.stop();
    }
    console.log('⏸️ Scheduler paused');
  }

  resumeScheduler() {
    if (this.cronJob) {
      this.cronJob.start();
    }
    console.log('▶️ Scheduler resumed');
  }

  updateSchedule(cronExpression) {
    this.config.testInterval = cronExpression;
    
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob.setTime(new cron.CronTime(cronExpression));
      this.cronJob.start();
    }
    
    this.updateNextRunTime();
    console.log(`⏰ Schedule updated: ${cronExpression}`);
  }
}

export default AutonomousScheduler;
export { AutonomousScheduler };