const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 4500;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Serve the enhanced dashboard HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'agent-dashboard-enhanced.html'));
});

// API endpoint to get monitoring data
app.get('/api/monitoring-data', (req, res) => {
  const data = {
    timestamp: new Date().toISOString(),
    agents: {},
    deployments: {},
    issues: [],
    qualityScore: null
  };

  // Read monitoring results if available
  try {
    const monitoringFile = path.join(__dirname, 'monitoring-results.jsonl');
    if (fs.existsSync(monitoringFile)) {
      const lines = fs.readFileSync(monitoringFile, 'utf8').trim().split('\n');
      const latestResult = lines.length > 0 ? JSON.parse(lines[lines.length - 1]) : null;
      if (latestResult) {
        data.deployments = latestResult.environments || {};
      }
    }
  } catch (error) {
    console.error('Error reading monitoring results:', error);
  }

  // Read quality report if available
  try {
    const qualityFile = path.join(__dirname, 'quality-report-latest.json');
    if (fs.existsSync(qualityFile)) {
      const qualityReport = JSON.parse(fs.readFileSync(qualityFile, 'utf8'));
      data.qualityScore = qualityReport.qualityScore;
      data.issues = qualityReport.issues || [];
      data.summary = qualityReport.summary;
      data.categories = qualityReport.categories;
    }
  } catch (error) {
    console.error('Error reading quality report:', error);
  }

  // Read agent statuses from process files
  const agentFiles = {
    'simple-monitor': 'simple-monitor.status',
    'monitoring-agent': 'monitoring-agent.status',
    'railway-deployment': 'railway-deployment.status',
    'autonomous-completion': 'autonomous-completion.status',
    'quality-control': 'quality-control.status'
  };

  Object.entries(agentFiles).forEach(([agent, file]) => {
    try {
      const statusFile = path.join(__dirname, file);
      if (fs.existsSync(statusFile)) {
        data.agents[agent] = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
      }
    } catch (error) {
      // Status file not available yet
    }
  });

  res.json(data);
});

// API endpoint to get log entries
app.get('/api/logs', (req, res) => {
  const logs = [];
  const logFiles = [
    'monitoring.log',
    'autonomous-agent.log',
    'quality-control.log',
    'deployment.log'
  ];

  logFiles.forEach(file => {
    try {
      const logPath = path.join(__dirname, file);
      if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.trim().split('\n').slice(-50); // Last 50 lines
        logs.push(...lines.filter(l => l.trim()));
      }
    } catch (error) {
      // Log file not available
    }
  });

  res.json({ logs: logs.slice(-100) }); // Return last 100 log entries
});

// Start server
app.listen(PORT, () => {
  console.log(`Agent Dashboard Server running on http://localhost:${PORT}`);
  console.log('');
  console.log('Dashboard Features:');
  console.log('- Real-time monitoring of all 5 autonomous agents');
  console.log('- Live deployment status for all environments');
  console.log('- Quality score tracking with issue details');
  console.log('- Consolidated log viewer');
  console.log('- Auto-refresh every 5 seconds');
  console.log('');
  console.log('Active Agents:');
  console.log('[1] Simple Monitor - Checking Phase 4 features');
  console.log('[2] Monitoring Agent - Full application testing');
  console.log('[3] Railway Deployment Tracker - Build & deploy status');
  console.log('[4] Autonomous Completion Agent - Driving to 100%');
  console.log('[5] Quality Control Agent - Testing Policeman');
});