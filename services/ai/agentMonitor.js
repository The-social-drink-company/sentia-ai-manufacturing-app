import { EventEmitter } from 'events';
import winston from 'winston';

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

/**
 * 24/7 Agent Monitoring System
 * Ensures all AI agents are running continuously
 */
class AgentMonitor extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.monitoringInterval = null;
    this.isMonitoring = false;
    this.healthCheckInterval = 30000; // 30 seconds
    this.restartAttempts = new Map();
    this.maxRestartAttempts = 3;
  }

  /**
   * Register an agent for monitoring
   */
  registerAgent(agentId, agent, config = {}) {
    this.agents.set(agentId, {
      instance: agent,
      status: 'initializing',
      lastHealthCheck: null,
      restarts: 0,
      config: {
        critical: config.critical || false,
        autoRestart: config.autoRestart !== false,
        healthCheckMethod: config.healthCheckMethod || 'getStatus',
        restartMethod: config.restartMethod || 'restart',
        ...config
      }
    });
    
    logger.info(`Agent registered for 24/7 monitoring: ${agentId}`);
  }

  /**
   * Start 24/7 monitoring
   */
  start() {
    if (this.isMonitoring) {
      logger.warn('Agent monitoring already running');
      return;
    }

    this.isMonitoring = true;
    logger.info('Starting 24/7 agent monitoring system');
    
    // Initial health check
    this.performHealthCheck();
    
    // Setup monitoring interval
    this.monitoringInterval = setInterval(_() => {
      this.performHealthCheck();
    }, this.healthCheckInterval);

    // Setup graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
    
    this.emit('monitoring-started', {
      timestamp: new Date(),
      agents: Array.from(this.agents.keys())
    });
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (!this.isMonitoring) return;
    
    logger.info('Stopping agent monitoring');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.isMonitoring = false;
    this.emit('monitoring-stopped', { timestamp: new Date() });
  }

  /**
   * Perform health check on all agents
   */
  async performHealthCheck() {
    const healthResults = [];
    
    for (const [agentId, agentInfo] of this.agents) {
      try {
        const health = await this.checkAgentHealth(agentId, agentInfo);
        healthResults.push({ agentId, ...health });
        
        if (!health.healthy && agentInfo.config.autoRestart) {
          await this.restartAgent(agentId, agentInfo);
        }
      } catch (error) {
        logger.error(`Health check failed for ${agentId}:`, error);
        healthResults.push({
          agentId,
          healthy: false,
          error: error.message
        });
      }
    }
    
    this.emit('health-check-complete', {
      timestamp: new Date(),
      results: healthResults
    });
    
    return healthResults;
  }

  /**
   * Check individual agent health
   */
  async checkAgentHealth(agentId, agentInfo) {
    const { instance, config } = agentInfo;
    
    try {
      // Call agent's health check method
      let status;
      if (typeof instance[config.healthCheckMethod] === 'function') {
        status = await instance[config.healthCheckMethod]();
      } else if (typeof instance.getHealth === 'function') {
        status = await instance.getHealth();
      } else if (typeof instance.isAlive === 'function') {
        status = await instance.isAlive();
      } else {
        // Basic check - if agent exists and has expected properties
        status = {
          operational: !!instance,
          status: instance.status || 'unknown'
        };
      }
      
      const healthy = status.operational !== false && 
                     status.status !== 'error' && 
                     status.status !== 'failed';
      
      agentInfo.status = healthy ? 'healthy' : 'unhealthy';
      agentInfo.lastHealthCheck = new Date();
      
      return {
        healthy,
        status: status.status || agentInfo.status,
        lastCheck: agentInfo.lastHealthCheck,
        details: status
      };
    } catch (error) {
      agentInfo.status = 'error';
      agentInfo.lastHealthCheck = new Date();
      
      return {
        healthy: false,
        status: 'error',
        lastCheck: agentInfo.lastHealthCheck,
        error: error.message
      };
    }
  }

  /**
   * Restart a failed agent
   */
  async restartAgent(agentId, agentInfo) {
    const attempts = this.restartAttempts.get(agentId) || 0;
    
    if (attempts >= this.maxRestartAttempts) {
      logger.error(`Max restart attempts reached for ${agentId}`);
      this.emit('agent-failed', {
        agentId,
        attempts,
        critical: agentInfo.config.critical
      });
      return false;
    }
    
    logger.info(`Attempting to restart agent: ${agentId} (attempt ${attempts + 1})`);
    
    try {
      const { instance, config } = agentInfo;
      
      // Try to restart the agent
      if (typeof instance[config.restartMethod] === 'function') {
        await instance[config.restartMethod]();
      } else if (typeof instance.restart === 'function') {
        await instance.restart();
      } else if (typeof instance.initialize === 'function') {
        await instance.initialize();
      } else if (typeof instance.start === 'function') {
        await instance.start();
      } else {
        throw new Error(`No restart method available for ${agentId}`);
      }
      
      // Reset restart attempts on success
      this.restartAttempts.set(agentId, 0);
      agentInfo.status = 'healthy';
      agentInfo.restarts++;
      
      logger.info(`Agent ${agentId} restarted successfully`);
      
      this.emit('agent-restarted', {
        agentId,
        restarts: agentInfo.restarts,
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error(`Failed to restart agent ${agentId}:`, error);
      this.restartAttempts.set(agentId, attempts + 1);
      
      // If this is a critical agent, emit alert
      if (agentInfo.config.critical) {
        this.emit('critical-agent-down', {
          agentId,
          error: error.message,
          attempts: attempts + 1
        });
      }
      
      return false;
    }
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    const agentStatuses = {};
    
    for (const [agentId, agentInfo] of this.agents) {
      agentStatuses[agentId] = {
        status: agentInfo.status,
        lastHealthCheck: agentInfo.lastHealthCheck,
        restarts: agentInfo.restarts,
        critical: agentInfo.config.critical
      };
    }
    
    return {
      monitoring: this.isMonitoring,
      healthCheckInterval: this.healthCheckInterval,
      agents: agentStatuses,
      totalAgents: this.agents.size,
      healthyAgents: Array.from(this.agents.values())
        .filter(a => a.status === 'healthy').length
    };
  }

  /**
   * Force health check for specific agent
   */
  async checkAgent(agentId) {
    const agentInfo = this.agents.get(agentId);
    if (!agentInfo) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    return await this.checkAgentHealth(agentId, agentInfo);
  }

  /**
   * Manually restart specific agent
   */
  async forceRestartAgent(agentId) {
    const agentInfo = this.agents.get(agentId);
    if (!agentInfo) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // Reset restart attempts for manual restart
    this.restartAttempts.set(agentId, 0);
    
    return await this.restartAgent(agentId, agentInfo);
  }

  /**
   * Get agent details
   */
  getAgentDetails(agentId) {
    const agentInfo = this.agents.get(agentId);
    if (!agentInfo) {
      return null;
    }
    
    return {
      id: agentId,
      status: agentInfo.status,
      lastHealthCheck: agentInfo.lastHealthCheck,
      restarts: agentInfo.restarts,
      config: agentInfo.config
    };
  }

  /**
   * Update monitoring interval
   */
  setHealthCheckInterval(intervalMs) {
    this.healthCheckInterval = intervalMs;
    
    if (this.isMonitoring) {
      // Restart monitoring with new interval
      this.stop();
      this.start();
    }
    
    logger.info(`Health check interval updated to ${intervalMs}ms`);
  }
}

// Create singleton instance
const agentMonitor = new AgentMonitor();

// Auto-start monitoring when module is loaded
process.nextTick(_() => {
  logger.info('Agent Monitor ready for 24/7 operation');
});

export default agentMonitor;