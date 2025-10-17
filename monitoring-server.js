#!/usr/bin/env node

/**
 * Enterprise-Level Autonomous Testing & Self-Healing Monitoring Dashboard
 * Provides real-time visibility into the autonomous testing system
 * Runs on localhost:6000
 */

import express from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { promises as fs } from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class EnterpriseMonitoringDashboard {
  constructor() {
    this.app = express()
    this.server = http.createServer(this.app)
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    })

    this.systemMetrics = {
      testingSuite: {
        status: 'initializing',
        lastRun: null,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
        coverage: 0,
      },
      selfHealing: {
        status: 'active',
        totalFixes: 0,
        successfulFixes: 0,
        lastFix: null,
        fixesThisHour: 0,
      },
      deployment: {
        status: 'monitoring',
        lastDeploy: null,
        deploymentSuccess: true,
        railwayStatus: 'connected',
      },
      apiHealth: {
        mainApp: { status: 'unknown', port: 5000, uptime: 0 },
        frontend: { status: 'unknown', port: 3000, uptime: 0 },
        monitoring: { status: 'active', port: 6000, uptime: 0 },
      },
      whatIfAnalysis: {
        status: 'operational',
        activeUsers: 0,
        calculationsPerMinute: 0,
        avgResponseTime: 0,
      },
    }

    this.setupMiddleware()
    this.setupRoutes()
    this.setupSocketHandlers()
    this.startMonitoring()
  }

  setupMiddleware() {
    this.app.use(express.json())
    this.app.use(express.static(path.join(__dirname, 'monitoring-dashboard')))

    // CORS for API requests
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
      next()
    })
  }

  setupRoutes() {
    // Serve the monitoring dashboard
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'monitoring-dashboard', 'index.html'))
    })

    // API endpoints for monitoring data
    this.app.get('/api/monitoring/status', (req, res) => {
      res.json({
        timestamp: new Date().toISOString(),
        systemHealth: this.calculateSystemHealth(),
        metrics: this.systemMetrics,
        uptime: process.uptime(),
      })
    })

    this.app.get('/api/monitoring/logs/:component', async (req, res) => {
      try {
        const component = req.params.component
        const logPath = path.join(__dirname, 'tests', 'autonomous', 'logs', `${component}.log`)
        const logs = await this.readLogFile(logPath)
        res.json({ logs, component })
      } catch (error) {
        res.status(404).json({ error: 'Log file not found', component: req.params.component })
      }
    })

    this.app.get('/api/monitoring/performance', (req, res) => {
      res.json({
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        timestamp: new Date().toISOString(),
      })
    })

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      })
    })
  }

  setupSocketHandlers() {
    this.io.on('connection', socket => {
      console.log('Monitoring client connected:', socket.id)

      // Send initial data
      socket.emit('system-status', this.systemMetrics)

      socket.on('request-logs', async component => {
        try {
          const logs = await this.getComponentLogs(component)
          socket.emit('logs-update', { component, logs })
        } catch (error) {
          socket.emit('logs-error', { component, error: error.message })
        }
      })

      socket.on('trigger-test-run', () => {
        this.triggerTestExecution()
        socket.emit('test-triggered', { timestamp: new Date().toISOString() })
      })

      socket.on('disconnect', () => {
        console.log('Monitoring client disconnected:', socket.id)
      })
    })
  }

  async startMonitoring() {
    console.log('Starting Enterprise Monitoring Dashboard...')

    // Monitor system health every 30 seconds
    setInterval(() => {
      this.updateSystemMetrics()
      this.broadcastUpdate()
    }, 30000)

    // Monitor API health every 15 seconds
    setInterval(() => {
      this.checkApiHealth()
    }, 15000)

    // Monitor log files for changes
    this.watchLogFiles()

    // Initial system check
    await this.updateSystemMetrics()

    const PORT = process.env.MONITORING_PORT || 6000
    this.server.listen(PORT, () => {
      console.log(`\\n=== ENTERPRISE MONITORING DASHBOARD ===`)
      console.log(`Dashboard URL: http://localhost:${PORT}`)
      console.log(`WebSocket: ws://localhost:${PORT}`)
      console.log(`Health Check: http://localhost:${PORT}/health`)
      console.log(`API Status: http://localhost:${PORT}/api/monitoring/status`)
      console.log('========================================\\n')
    })
  }

  async updateSystemMetrics() {
    try {
      // Check test execution status
      await this.checkTestingStatus()

      // Check self-healing status
      await this.checkSelfHealingStatus()

      // Check deployment status
      await this.checkDeploymentStatus()

      // Update timestamps
      this.systemMetrics.lastUpdate = new Date().toISOString()
    } catch (error) {
      console.error('Error updating system metrics:', error)
    }
  }

  async checkTestingStatus() {
    try {
      const logPath = path.join(__dirname, 'tests', 'autonomous', 'logs', 'test-execution.log')
      const exists = await fs
        .access(logPath)
        .then(() => true)
        .catch(() => false)

      if (exists) {
        const stats = await fs.stat(logPath)
        const content = await fs.readFile(logPath, 'utf8')
        const lines = content.split('\\n').filter(line => line.trim())

        // Parse test results from logs
        const testResults = this.parseTestResults(lines)

        this.systemMetrics.testingSuite = {
          ...this.systemMetrics.testingSuite,
          status: testResults.status || 'running',
          lastRun: stats.mtime.toISOString(),
          totalTests: testResults.total || 0,
          passedTests: testResults.passed || 0,
          failedTests: testResults.failed || 0,
          duration: testResults.duration || 0,
        }
      } else {
        this.systemMetrics.testingSuite.status = 'no-logs'
      }
    } catch (error) {
      this.systemMetrics.testingSuite.status = 'error'
      console.error('Error checking testing status:', error)
    }
  }

  async checkSelfHealingStatus() {
    try {
      const fixLogPath = path.join(__dirname, 'tests', 'autonomous', 'logs', 'self-healing.log')
      const exists = await fs
        .access(fixLogPath)
        .then(() => true)
        .catch(() => false)

      if (exists) {
        const content = await fs.readFile(fixLogPath, 'utf8')
        const fixes = this.parseSelfHealingLogs(content)

        this.systemMetrics.selfHealing = {
          ...this.systemMetrics.selfHealing,
          totalFixes: fixes.total,
          successfulFixes: fixes.successful,
          lastFix: fixes.lastFix,
          fixesThisHour: fixes.thisHour,
        }
      }
    } catch (error) {
      console.error('Error checking self-healing status:', error)
    }
  }

  async checkApiHealth() {
    const apis = [
      { name: 'mainApp', port: 5000, endpoint: '/api/health' },
      { name: 'frontend', port: 3000, endpoint: '/' },
    ]

    for (const api of apis) {
      try {
        const response = await fetch(`http://localhost:${api.port}${api.endpoint}`, {
          timeout: 5000,
        })

        this.systemMetrics.apiHealth[api.name].status = response.ok ? 'healthy' : 'degraded'
        this.systemMetrics.apiHealth[api.name].uptime = process.uptime()
      } catch (error) {
        this.systemMetrics.apiHealth[api.name].status = 'down'
      }
    }
  }

  calculateSystemHealth() {
    const weights = {
      testingSuite: 0.3,
      selfHealing: 0.2,
      apiHealth: 0.3,
      deployment: 0.2,
    }

    let score = 0

    // Testing suite health
    if (this.systemMetrics.testingSuite.status === 'passing') score += weights.testingSuite
    else if (this.systemMetrics.testingSuite.status === 'running')
      score += weights.testingSuite * 0.8

    // Self-healing health
    if (this.systemMetrics.selfHealing.status === 'active') score += weights.selfHealing

    // API health
    const healthyApis = Object.values(this.systemMetrics.apiHealth).filter(
      api => api.status === 'healthy'
    ).length
    const totalApis = Object.keys(this.systemMetrics.apiHealth).length
    score += weights.apiHealth * (healthyApis / totalApis)

    // Deployment health
    if (this.systemMetrics.deployment.deploymentSuccess) score += weights.deployment

    return {
      score: Math.round(score * 100),
      status: score > 0.8 ? 'excellent' : score > 0.6 ? 'good' : score > 0.4 ? 'fair' : 'poor',
    }
  }

  parseTestResults(logLines) {
    // Parse test execution logs for metrics
    const results = { total: 0, passed: 0, failed: 0, status: 'unknown', duration: 0 }

    for (const line of logLines.slice(-50)) {
      // Check last 50 lines
      if (line.includes('PASS:')) results.passed++
      if (line.includes('FAIL:')) results.failed++
      if (line.includes('Test completed in')) {
        const match = line.match(/Test completed in (\\d+)ms/)
        if (match) results.duration = parseInt(match[1])
      }
    }

    results.total = results.passed + results.failed
    results.status =
      results.failed === 0 && results.total > 0
        ? 'passing'
        : results.failed > 0
          ? 'failing'
          : 'unknown'

    return results
  }

  parseSelfHealingLogs(content) {
    const lines = content.split('\\n').filter(line => line.trim())
    const oneHourAgo = Date.now() - 60 * 60 * 1000

    let total = 0
    let successful = 0
    let thisHour = 0
    let lastFix = null

    for (const line of lines) {
      if (line.includes('FIX_APPLIED')) {
        total++
        if (line.includes('SUCCESS')) successful++

        // Check if fix was in the last hour
        const timestamp = this.extractTimestamp(line)
        if (timestamp && timestamp > oneHourAgo) thisHour++

        if (!lastFix || (timestamp && timestamp > lastFix)) {
          lastFix = timestamp
        }
      }
    }

    return {
      total,
      successful,
      thisHour,
      lastFix: lastFix ? new Date(lastFix).toISOString() : null,
    }
  }

  extractTimestamp(logLine) {
    const match = logLine.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]/)
    return match ? new Date(match[1]).getTime() : null
  }

  broadcastUpdate() {
    this.io.emit('metrics-update', {
      timestamp: new Date().toISOString(),
      metrics: this.systemMetrics,
      health: this.calculateSystemHealth(),
    })
  }

  async triggerTestExecution() {
    try {
      console.log('Manual test execution triggered via dashboard')

      const testProcess = spawn('npm', ['run', 'test:autonomous'], {
        cwd: __dirname,
        stdio: 'pipe',
      })

      testProcess.stdout.on('data', data => {
        this.io.emit('test-output', { type: 'stdout', data: data.toString() })
      })

      testProcess.stderr.on('data', data => {
        this.io.emit('test-output', { type: 'stderr', data: data.toString() })
      })

      testProcess.on('close', code => {
        this.io.emit('test-completed', { exitCode: code, timestamp: new Date().toISOString() })
      })
    } catch (error) {
      console.error('Error triggering test execution:', error)
      this.io.emit('test-error', { error: error.message })
    }
  }

  async readLogFile(logPath) {
    try {
      const content = await fs.readFile(logPath, 'utf8')
      return content.split('\\n').slice(-100).join('\\n') // Return last 100 lines
    } catch (error) {
      return `Log file not found: ${logPath}`
    }
  }

  watchLogFiles() {
    const logDir = path.join(__dirname, 'tests', 'autonomous', 'logs')

    fs.readdir(logDir)
      .then(files => {
        files
          .filter(file => file.endsWith('.log'))
          .forEach(file => {
            const logPath = path.join(logDir, file)

            fs.watchFile(logPath, { interval: 1000 }, (curr, prev) => {
              if (curr.mtime > prev.mtime) {
                this.io.emit('log-updated', {
                  file: file.replace('.log', ''),
                  timestamp: curr.mtime.toISOString(),
                })
              }
            })
          })
      })
      .catch(() => {
        console.log('Log directory not found, will create when needed')
      })
  }

  async checkDeploymentStatus() {
    try {
      // Check Railway deployment status if configured
      const deployLogPath = path.join(__dirname, 'tests', 'autonomous', 'logs', 'deployment.log')
      const exists = await fs
        .access(deployLogPath)
        .then(() => true)
        .catch(() => false)

      if (exists) {
        const stats = await fs.stat(deployLogPath)
        this.systemMetrics.deployment.lastDeploy = stats.mtime.toISOString()
        this.systemMetrics.deployment.status = 'active'
      }
    } catch (error) {
      this.systemMetrics.deployment.status = 'unknown'
    }
  }

  async getComponentLogs(component) {
    const logPath = path.join(__dirname, 'tests', 'autonomous', 'logs', `${component}.log`)
    return await this.readLogFile(logPath)
  }
}

// Start the monitoring dashboard
const dashboard = new EnterpriseMonitoringDashboard()

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\nShutting down Enterprise Monitoring Dashboard...')
  process.exit(0)
})

export default EnterpriseMonitoringDashboard
