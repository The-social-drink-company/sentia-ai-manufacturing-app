# Sentia Manufacturing Dashboard - Monitoring System Guide

## Overview

This comprehensive monitoring and self-correction system provides continuous monitoring of all Sentia Manufacturing Dashboard deployments with automatic issue detection and resolution capabilities.

## 🎯 Key Features

### 1. **Continuous URL Monitoring**

- Railway Production: `sentia-manufacturing-dashboard-production.up.railway.app`
- Railway Development: `sentia-manufacturing-dashboard-development.up.railway.app`
- Railway Test: `sentiatest.financeflo.ai`
- Localhost instances: `http://localhost:3000`, `:3002`, `:3003`

### 2. **Phase 4 Feature Detection**

- Automatically detects `PredictiveMaintenanceWidget`
- Verifies `SmartInventoryWidget` is present
- Validates API endpoints are responsive
- Ensures all features are properly deployed

### 3. **Agentic Self-Correction**

- 5-minute monitoring intervals
- Automatic restart of failed local servers
- Railway deployment triggering for remote issues
- Port conflict resolution
- Dependency installation and builds

### 4. **Comprehensive Logging**

- Real-time status updates with color coding
- JSON-formatted log files (`monitoring.log`)
- Persistent status tracking (`monitoring-status.json`)
- Performance metrics and success rates

## 🚀 Quick Start

### Method 1: Using npm Scripts (Recommended)

```bash
# Start monitoring (foreground)
npm run monitor

# Check current status
npm run monitor:status

# Start in background (Unix/Linux/macOS)
npm run monitor:bg
```

### Method 2: Using Batch File (Windows)

```cmd
# Start monitoring
start-monitoring.bat

# Check status
start-monitoring.bat status

# Stop monitoring
start-monitoring.bat stop
```

### Method 3: Direct Node.js Execution

```bash
# Start monitoring
node monitoring-agent.js

# Show help
node monitoring-agent.js --help

# Check status
node monitoring-agent.js --status
```

## 🔧 Configuration

The monitoring system uses multiple configuration sources:

### 1. Built-in Configuration (`monitoring-agent.js`)

- URL definitions and aliases
- Check intervals and timeouts
- Phase 4 feature detection rules
- Retry logic and backoff strategies

### 2. Extended Configuration (`monitoring-config.json`)

- Detailed service definitions
- Performance thresholds
- Alert configurations
- Recovery strategies
- Security settings

### 3. Environment Variables

- Railway deployment settings
- API keys and tokens
- Database connections
- Custom monitoring parameters

## 📊 Monitoring Capabilities

### URL Health Checks

- HTTP status validation (accepts 2xx-4xx, rejects 5xx)
- Response time monitoring
- Content validation (detects blank screens)
- SSL certificate verification
- Alternative URL fallback support

### Phase 4 Feature Verification

- Scans HTML content for widget components
- Validates API endpoint responses
- Checks for specific feature strings
- Ensures deployment completeness

### API Health Monitoring

- `/api/health` - General service health
- `/api/predictive-maintenance` - AI features
- `/api/smart-inventory` - Inventory optimization
- `/api/dashboard/widgets` - Widget configurations

## 🔄 Self-Correction Actions

### Local Server Issues

- **Server Not Running**: Automatically starts using appropriate npm scripts
- **Blank Screen**: Restarts development server after cleanup
- **Port Conflicts**: Kills conflicting processes and restarts
- **Dependency Issues**: Runs `npm install` and `npm run build`

### Remote Deployment Issues

- **Missing Features**: Triggers Railway redeploy via git commits
- **Server Errors**: Initiates build and deployment pipeline
- **Timeout Issues**: Scales service resources
- **Configuration Problems**: Validates and updates environment variables

### Escalation Strategy

1. **Level 1**: Simple restart (2-minute timeout)
2. **Level 2**: Full redeploy (5-minute timeout)
3. **Level 3**: Rollback to previous version (10-minute timeout)

## 📈 Status Monitoring

### Real-time Status

```bash
npm run monitor:status
```

### Status File Structure

```json
{
  "startTime": "2025-09-04T22:00:00.000Z",
  "lastCheck": "2025-09-04T22:05:00.000Z",
  "totalChecks": 12,
  "successfulChecks": 10,
  "failedChecks": 2,
  "correctionsMade": 1,
  "urlStatuses": {
    "https://...": {
      "name": "Railway Production",
      "status": "healthy",
      "phase4FeaturesDetected": true,
      "consecutiveFailures": 0,
      "lastError": null
    }
  }
}
```

### Log File Format

```json
{
  "timestamp": "2025-09-04T22:05:00.000Z",
  "level": "INFO",
  "message": "Starting monitoring cycle",
  "data": { "cycle": 3, "urls": 6 }
}
```

## 🚨 Alert Levels

### Success (Green)

- All URLs healthy
- Phase 4 features detected
- APIs responding correctly
- No corrective actions needed

### Warning (Yellow)

- Temporary issues detected
- Corrective actions in progress
- Some URLs degraded but recovering
- Non-critical API failures

### Error (Red)

- Multiple consecutive failures
- Critical service unavailable
- Phase 4 features missing
- Deployment issues detected

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Node.js not found"

```bash
# Install Node.js 18+ from nodejs.org
# Verify installation
node --version
npm --version
```

#### 2. "Dependencies not installed"

```bash
# Install project dependencies
npm install

# Verify installation
ls node_modules
```

#### 3. "Git not available"

```bash
# Install Git for deployment triggers
# Verify git repository
git status
```

#### 4. "Environment file missing"

```bash
# Copy from template
cp .env.template .env

# Edit with your configuration
# Add required API keys and URLs
```

### Manual Recovery Commands

#### Restart All Services

```bash
# Stop all monitoring
pkill -f "monitoring-agent"

# Clean up processes
taskkill /f /im node.exe

# Restart monitoring
npm run monitor
```

#### Force Railway Redeploy

```bash
# Create deployment trigger
echo "Deploy: $(date)" > .railway-deploy-$(date +%s)
git add .
git commit -m "trigger: force redeploy"
git push origin development
```

#### Reset Monitoring State

```bash
# Clear status and logs
rm -f monitoring.log monitoring-status.json

# Restart with clean state
npm run monitor
```

## 📝 Development Mode

### Testing New Features

1. Start monitoring in test mode
2. Deploy to development environment
3. Monitor automatic detection
4. Verify corrective actions work
5. Promote to production when stable

### Adding New URLs

1. Edit `monitoring-agent.js` CONFIG section
2. Add URL configuration with environment
3. Update Phase 4 feature detection if needed
4. Restart monitoring system
5. Verify new URL is monitored

### Custom Corrective Actions

1. Extend `handleLocalServerIssues()` method
2. Add new `handleRemoteDeploymentIssues()` cases
3. Update retry logic and backoff strategies
4. Test thoroughly before deployment

## 🔒 Security Considerations

- Monitor logs for sensitive information exposure
- Rotate API keys and tokens regularly
- Use secure communication channels
- Limit monitoring agent permissions
- Review corrective action permissions

## 📞 Support

For issues with the monitoring system:

1. Check logs: `tail -f monitoring.log`
2. View status: `npm run monitor:status`
3. Restart system: `npm run monitor`
4. Review this guide for troubleshooting steps

## 🚀 Continuous Operation

The monitoring system is designed to run 24/7 until all URLs show healthy status with complete Phase 4 features. It will:

- ✅ Monitor every 5 minutes
- ✅ Detect and fix issues automatically
- ✅ Log all activities with timestamps
- ✅ Provide real-time status updates
- ✅ Only stop when everything is perfect

**Start monitoring now:** `npm run monitor`
