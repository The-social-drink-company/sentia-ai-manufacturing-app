#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Railway Internal Branch Configuration
const INTERNAL_CONFIG = {
  branch: 'internal',
  railwayUrl: 'https://vivacious-prosperity-internal.up.railway.app',
  customDomain: 'https://sentiadashboard.financeflo.ai',
  localUrl: 'http://localhost:4501',
  targetPort: 8080,
  githubRepo: 'https://github.com/The-social-drink-company/sentia-manufacturing-dashboard.git'
};

class RailwayInternalAgentMonitor {
  constructor() {
    this.logFile = 'railway-internal-monitor.jsonl';
    this.isRunning = false;
    this.cycleCount = 0;
    this.agentWidgets = [
      'PerformanceOptimizationWidget',
      'AutonomousCompletionWidget', 
      'QualityControlWidget',
      'MonitoringWidget',
      'UIUXEnhancementWidget',
      'DataIntegrationWidget',
      'DashboardUpdateWidget'
    ];
  }

  async log(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      cycle: this.cycleCount,
      ...data
    };
    
    console.log(`[${logEntry.timestamp}] [${level}] [Internal Monitor] ${message}`);
    
    try {
      await fs.appendFile(
        this.logFile,
        JSON.stringify(logEntry) + '\n'
      );
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  async ensureInternalBranch() {
    try {
      // Check if internal branch exists locally
      const { stdout: branches } = await execAsync('git branch -a');
      
      if (!branches.includes('internal')) {
        await this.log('INFO', 'Creating internal branch');
        await execAsync('git checkout -b internal');
        await execAsync('git push -u origin internal');
      } else {
        await execAsync('git checkout internal');
      }
      
      // Pull latest changes from production
      await execAsync('git pull origin production --no-edit');
      
      await this.log('SUCCESS', 'Internal branch ready');
      return true;
    } catch (error) {
      await this.log('ERROR', 'Failed to ensure internal branch', { error: error.message });
      
      // Try to recover
      try {
        await execAsync('git checkout -b internal origin/internal');
        return true;
      } catch (recoveryError) {
        return false;
      }
    }
  }

  async createAgentDashboard() {
    try {
      await this.log('INFO', 'Creating agent monitoring dashboard');
      
      // Create the internal dashboard component
      const dashboardContent = `import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const AgentMonitoringDashboard = () => {
  const [agents, setAgents] = useState([
    { name: 'Performance Optimization', status: 'running', cycles: 0, lastUpdate: null },
    { name: 'Autonomous Completion', status: 'running', cycles: 0, lastUpdate: null },
    { name: 'Quality Control', status: 'running', cycles: 0, lastUpdate: null },
    { name: 'Monitoring', status: 'running', cycles: 0, lastUpdate: null },
    { name: 'UI/UX Enhancement', status: 'running', cycles: 0, lastUpdate: null },
    { name: 'Data Integration', status: 'running', cycles: 0, lastUpdate: null },
    { name: 'Dashboard Update', status: 'running', cycles: 0, lastUpdate: null }
  ]);

  const [deploymentStatus, setDeploymentStatus] = useState({
    internal: 'checking',
    production: 'checking',
    development: 'checking',
    test: 'checking'
  });

  useEffect(() => {
    // Update agent status every 30 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/agent-status');
        const data = await response.json();
        setAgents(data.agents);
        setDeploymentStatus(data.deployments);
      } catch (error) {
        console.error('Failed to fetch agent status:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-6">
        Railway Internal Agent Dashboard Monitor
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {agents.map((agent) => (
          <Card key={agent.name} className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>{agent.name}</span>
                <Badge className={getStatusColor(agent.status)}>
                  {agent.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-gray-300">
                <div className="flex items-center">
                  <Activity className="mr-2 h-4 w-4" />
                  <span>Cycles: {agent.cycles}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Last: {agent.lastUpdate || 'Never'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Deployment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(deploymentStatus).map(([env, status]) => (
              <div key={env} className="flex items-center space-x-2">
                {status === 'online' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-white capitalize">{env}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-gray-400">
        <p>Port: {INTERNAL_CONFIG.targetPort} | Domain: {INTERNAL_CONFIG.customDomain}</p>
        <p>Last Update: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default AgentMonitoringDashboard;`;

      await fs.mkdir(path.join(__dirname, '../src/pages/internal'), { recursive: true });
      await fs.writeFile(
        path.join(__dirname, '../src/pages/internal/AgentMonitoringDashboard.jsx'),
        dashboardContent
      );

      // Create API endpoint for agent status
      const apiContent = `import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Read agent logs
    const logs = await fs.readFile('agent-orchestrator.log', 'utf-8');
    const lines = logs.split('\\n').filter(line => line);
    
    // Parse agent status from logs
    const agents = [];
    const agentMap = new Map();
    
    lines.forEach(line => {
      if (line.includes('[SUCCESS]') && line.includes('Cycle')) {
        const match = line.match(/\\[([^\\]]+)\\].*Cycle (\\d+) completed/);
        if (match) {
          const agentName = match[1];
          const cycle = parseInt(match[2]);
          agentMap.set(agentName, { 
            name: agentName, 
            status: 'running', 
            cycles: cycle,
            lastUpdate: new Date().toISOString()
          });
        }
      }
    });

    // Check deployment status
    const deployments = {};
    const urls = {
      internal: 'https://vivacious-prosperity-internal.up.railway.app',
      production: 'https://sentia-manufacturing-dashboard-production.up.railway.app',
      development: 'https://sentia-manufacturing-dashboard-development.up.railway.app',
      test: 'https://sentiatest.financeflo.ai'
    };

    for (const [env, url] of Object.entries(urls)) {
      try {
        const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
        deployments[env] = response.ok ? 'online' : 'offline';
      } catch {
        deployments[env] = 'offline';
      }
    }

    return new Response(JSON.stringify({
      agents: Array.from(agentMap.values()),
      deployments
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}`;

      await fs.mkdir(path.join(__dirname, '../src/api/agent-status'), { recursive: true });
      await fs.writeFile(
        path.join(__dirname, '../src/api/agent-status/route.js'),
        apiContent
      );

      await this.log('SUCCESS', 'Agent dashboard created');
      return true;
    } catch (error) {
      await this.log('ERROR', 'Failed to create agent dashboard', { error: error.message });
      return false;
    }
  }

  async configureForPort8080() {
    try {
      await this.log('INFO', 'Configuring for port 8080');
      
      // Update server configuration for port 8080
      const serverConfig = `import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080; // Railway internal port

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Agent monitoring API
app.get('/api/agent-status', async (req, res) => {
  // Implementation from API route
  res.json({ agents: [], deployments: {} });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(\`Internal dashboard running on port \${PORT}\`);
});`;

      await fs.writeFile(
        path.join(__dirname, '../server-internal.js'),
        serverConfig
      );

      // Update package.json scripts
      const packageJson = JSON.parse(
        await fs.readFile(path.join(__dirname, '../package.json'), 'utf-8')
      );
      
      packageJson.scripts['dev:internal'] = 'vite --port 4501 --mode internal';
      packageJson.scripts['start:internal'] = 'node server-internal.js';
      
      await fs.writeFile(
        path.join(__dirname, '../package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      await this.log('SUCCESS', 'Configured for port 8080');
      return true;
    } catch (error) {
      await this.log('ERROR', 'Failed to configure port', { error: error.message });
      return false;
    }
  }

  async deployToInternal() {
    try {
      this.cycleCount++;
      await this.log('INFO', `Starting deployment cycle ${this.cycleCount}`);
      
      // Ensure we're on internal branch
      if (!await this.ensureInternalBranch()) {
        throw new Error('Failed to setup internal branch');
      }

      // Create/update agent dashboard
      await this.createAgentDashboard();
      
      // Configure for port 8080
      await this.configureForPort8080();

      // Commit changes
      await execAsync('git add -A');
      await execAsync(`git commit -m "Internal Agent Monitor: Cycle ${this.cycleCount} - ${new Date().toISOString()}" || true`);
      
      // Push to internal branch
      await execAsync('git push origin internal');
      
      await this.log('SUCCESS', `Deployment cycle ${this.cycleCount} completed`);
      
      // Verify deployments
      await this.verifyDeployments();
      
      return true;
    } catch (error) {
      await this.log('ERROR', `Deployment cycle ${this.cycleCount} failed`, { error: error.message });
      return false;
    }
  }

  async verifyDeployments() {
    const urls = [
      { name: 'Railway Internal', url: INTERNAL_CONFIG.railwayUrl },
      { name: 'Custom Domain', url: INTERNAL_CONFIG.customDomain },
      { name: 'Localhost', url: INTERNAL_CONFIG.localUrl }
    ];

    for (const { name, url } of urls) {
      try {
        const response = await fetch(url, { 
          method: 'HEAD', 
          timeout: 10000,
          headers: { 'User-Agent': 'Internal-Monitor/1.0' }
        });
        
        if (response.ok) {
          await this.log('SUCCESS', `${name} is online`, { url });
        } else {
          await this.log('WARN', `${name} returned ${response.status}`, { url });
        }
      } catch (error) {
        await this.log('ERROR', `${name} is offline`, { url, error: error.message });
      }
    }
  }

  async startLocalServer() {
    try {
      await this.log('INFO', 'Starting local development server on port 4501');
      
      // Kill any existing process on port 4501
      try {
        await execAsync('npx kill-port 4501');
      } catch {
        // Port might not be in use
      }
      
      // Start the development server in background
      exec('npm run dev:internal', { 
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, PORT: '4501' }
      }, (error, stdout, stderr) => {
        if (error) {
          this.log('ERROR', 'Local server error', { error: error.message });
        }
      });
      
      await this.log('SUCCESS', 'Local server started on port 4501');
      return true;
    } catch (error) {
      await this.log('ERROR', 'Failed to start local server', { error: error.message });
      return false;
    }
  }

  async start() {
    this.isRunning = true;
    await this.log('INFO', 'Railway Internal Agent Monitor started');
    
    // Start local development server
    await this.startLocalServer();
    
    // Initial deployment
    await this.deployToInternal();
    
    // Run every 5 minutes
    const interval = setInterval(async () => {
      if (this.isRunning) {
        await this.deployToInternal();
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    // Keep process alive
    process.on('SIGINT', () => {
      clearInterval(interval);
      this.stop();
    });
  }

  stop() {
    this.isRunning = false;
    this.log('INFO', 'Railway Internal Agent Monitor stopped');
    process.exit(0);
  }
}

// Export configuration for other scripts
export { INTERNAL_CONFIG };

// Start the monitor
const monitor = new RailwayInternalAgentMonitor();
monitor.start().catch(console.error);