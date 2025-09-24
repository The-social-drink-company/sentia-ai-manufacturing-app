# Autonomous Testing & Self-Healing System

## Overview

This system provides comprehensive autonomous testing with self-healing capabilities that automatically:
- Runs tests every 10 minutes
- Detects and analyzes failures
- Applies code fixes using AST analysis
- Deploys fixes to localhost and Railway
- Monitors system health and performance

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Scheduler     │───▶│  Master Test     │───▶│ Result Analyzer │
│  (10 min cron)  │    │     Suite        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
┌─────────────────┐    ┌──────────────────┐             │
│ Self-Healing    │◀───│  Code Corrector  │◀────────────┘
│     Agent       │    │   (AST Engine)   │
└─────────────────┘    └──────────────────┘
         │
         ▼
┌─────────────────┐    ┌──────────────────┐
│    Deploy       │───▶│    Monitoring    │
│  Orchestrator   │    │   Dashboard      │
└─────────────────┘    └──────────────────┘
```

## Quick Start

### 1. Activate Autonomous System
```bash
npm run autonomous:activate
```

### 2. Manual Commands
```bash
# Setup Railway environments
npm run railway:autonomous:setup

# Deploy to specific environment
npm run railway:autonomous:deploy development

# Check system status
npm run railway:autonomous:status
```

### 3. Access Monitoring Dashboard
- Local: http://localhost:3000/test-monitor
- Railway: https://your-app.railway.app/test-monitor

## Environment Configuration

### Development (Fully Autonomous)
- Auto-testing: Every 10 minutes
- Auto-fixing: Enabled
- Auto-deployment: Enabled to Railway
- Rollback: Enabled on failure

### Testing (Semi-Autonomous)
- Auto-testing: Every 10 minutes  
- Auto-fixing: Enabled
- Auto-deployment: Disabled (manual approval)
- Rollback: Enabled

### Production (Safety Mode)
- Auto-testing: Disabled
- Auto-fixing: Disabled
- Auto-deployment: Disabled
- Manual oversight required

## System Components

### 1. Master Test Suite (`tests/autonomous/master-test-suite.js`)
- Tests 40+ API endpoints
- UI component validation
- Performance benchmarks
- Security checks
- Real-time feature testing

### 2. Test Data Factory (`tests/autonomous/test-data-factory.js`)
- Generates realistic test scenarios
- Edge cases and stress testing
- Manufacturing data simulation
- Financial data modeling

### 3. Result Analyzer (`tests/autonomous/result-analyzer.js`)
- Failure pattern detection
- Root cause analysis
- Fix recommendation engine
- Performance trend analysis

### 4. Self-Healing Agent (`services/agent/self-healing-agent.js`)
- Orchestrates autonomous cycles
- Applies intelligent fixes
- Manages system state
- Emergency stop handling

### 5. Code Corrector (`services/agent/code-corrector.js`)
- AST-based code analysis
- Automated code transformations
- Syntax error fixes
- Logic error corrections

### 6. Deploy Orchestrator (`services/agent/deploy-orchestrator.js`)
- Git-based deployments
- Rollback capabilities
- Health checks
- Railway integration

### 7. Monitoring Dashboard (`src/pages/TestMonitorDashboard.jsx`)
- Real-time system status
- Test results visualization
- Performance metrics
- Manual controls

## API Endpoints

### Autonomous System Control
- `GET /api/autonomous/status` - System status
- `POST /api/autonomous/start` - Start autonomous mode
- `POST /api/autonomous/stop` - Stop autonomous mode
- `POST /api/autonomous/emergency-stop` - Emergency shutdown

### Test Management
- `GET /api/autonomous/tests/results` - Latest test results
- `GET /api/autonomous/tests/history` - Historical data
- `POST /api/autonomous/tests/run` - Manual test execution

### Fix Management
- `GET /api/autonomous/fixes/applied` - Applied fixes
- `GET /api/autonomous/fixes/pending` - Pending fixes
- `POST /api/autonomous/fixes/rollback` - Rollback fixes

## Safety Features

### Emergency Stop
- Manual stop via dashboard
- Automatic stop on critical failures
- Admin notification system

### Rollback Mechanism
- Git-based rollback on deployment failure
- Automated health checks
- State restoration

### Failure Thresholds
- Max 3 consecutive failures before intervention
- Pattern-based failure detection
- Escalation procedures

## Monitoring & Alerting

### Real-time Metrics
- Test success/failure rates
- System performance
- Deployment status
- Error trends

### Historical Analysis
- 7-day retention by default
- Failure pattern analysis
- Performance benchmarking
- System reliability metrics

## Configuration Files

### Railway Configuration (`railway.json`)
Environment-specific variables for autonomous operation

### Environment Template (`.env.autonomous`)
Complete configuration template with all autonomous settings

### Package Scripts
- `autonomous:activate` - Full system activation
- `railway:autonomous:setup` - Environment setup
- `railway:autonomous:deploy` - Deployment
- `railway:autonomous:status` - Status check

## Best Practices

### Development
1. Test autonomous system in development environment first
2. Monitor initial cycles closely
3. Verify Railway deployments work correctly

### Monitoring
1. Check dashboard regularly during initial setup
2. Review failure patterns and fix effectiveness
3. Adjust thresholds based on system behavior

### Safety
1. Keep emergency stop accessible
2. Monitor Railway deployment quotas
3. Have manual rollback procedures ready

## Troubleshooting

### Common Issues
1. **Tests failing repeatedly**: Check test data factory configuration
2. **Fixes not applying**: Verify AST parser configuration
3. **Deployments failing**: Check Railway environment variables
4. **System not starting**: Verify cron service and permissions

### Debug Commands
```bash
# Check autonomous system logs
npm run monitor:status

# Test individual components
node tests/autonomous/master-test-suite.js
node services/agent/self-healing-agent.js --dry-run

# Verify Railway connection
railway status --environment development
```

## Support & Maintenance

The autonomous system is designed to be self-maintaining, but periodic review is recommended:
- Weekly review of failure patterns
- Monthly performance optimization
- Quarterly security updates
- Annual system architecture review

For issues or questions, check the monitoring dashboard first, then review system logs for detailed diagnostic information.