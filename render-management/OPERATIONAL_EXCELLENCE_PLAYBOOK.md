# 📘 Operational Excellence Playbook - Render Infrastructure

## 🎯 Mission Statement
Achieve 99.99% uptime for Sentia Manufacturing Dashboard through proactive monitoring, rapid incident response, and continuous improvement.

---

## 📅 Daily Operations Schedule

### 🌅 Morning (9:00 AM)
```powershell
# Morning health check routine
cd render-management
.\quick-status.ps1

# Check overnight issues
.\get-logs.ps1 -ServiceName "sentia-manufacturing-production" -Lines 100 | Select-String "ERROR"

# Verify database connections
Invoke-RestMethod -Uri "https://sentia-manufacturing-production.onrender.com/api/health/detailed"
```

**Checklist:**
- [ ] All services showing "Healthy"
- [ ] No critical errors in logs
- [ ] Database connections active
- [ ] MCP AI server responding
- [ ] No pending alerts

### ☀️ Midday (1:00 PM)
```powershell
# Performance check
$services = @(
    "sentia-manufacturing-production",
    "sentia-manufacturing-testing",
    "sentia-mcp-server"
)

foreach ($service in $services) {
    $url = "https://$service.onrender.com/health"
    $response = Measure-Command { Invoke-RestMethod -Uri $url }
    Write-Host "$service response time: $($response.TotalMilliseconds)ms"
}
```

**Acceptable Thresholds:**
- Response time: < 500ms
- Memory usage: < 80%
- CPU usage: < 70%
- Error rate: < 1%

### 🌆 End of Day (5:00 PM)
```powershell
# Generate daily summary
$date = Get-Date -Format "yyyy-MM-dd"
$report = @{
    Date = $date
    ServicesChecked = 0
    HealthyServices = 0
    Issues = @()
    Deployments = @()
}

# Run comprehensive check
.\quick-status.ps1 | Out-File "daily-reports\report-$date.txt"

Write-Host "Daily report saved to daily-reports\report-$date.txt"
```

---

## 🚨 Incident Response Procedures

### Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|--------------|---------|
| **P1 - Critical** | Complete outage | 15 minutes | All services down |
| **P2 - High** | Degraded service | 30 minutes | Database connection issues |
| **P3 - Medium** | Feature impaired | 2 hours | Slow response times |
| **P4 - Low** | Minor issue | Next business day | UI glitch |

### P1 Critical Incident Response

#### 1. Immediate Actions (0-5 minutes)
```powershell
# Rapid assessment
$critical_services = @(
    @{Name="Production"; URL="https://sentia-manufacturing-production.onrender.com/health"},
    @{Name="Database"; URL="https://sentia-manufacturing-production.onrender.com/api/health/db"},
    @{Name="MCP Server"; URL="https://mcp-server-tkyu.onrender.com/health"}
)

foreach ($service in $critical_services) {
    try {
        Invoke-RestMethod -Uri $service.URL -TimeoutSec 3
        Write-Host "✅ $($service.Name): UP" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($service.Name): DOWN" -ForegroundColor Red
        # Trigger alert
    }
}
```

#### 2. Diagnosis (5-15 minutes)
```powershell
# Gather evidence
.\get-logs.ps1 -ServiceName "sentia-manufacturing-production" -Lines 200 | Out-File "incident-logs.txt"

# Check recent deployments
$headers = @{"Authorization" = "Bearer $env:RENDER_API_KEY"}
$deployments = Invoke-RestMethod -Uri "https://api.render.com/v1/services/deployments?limit=5" -Headers $headers

# Check external dependencies
Test-NetConnection -ComputerName "api.render.com" -Port 443
```

#### 3. Resolution (15+ minutes)
```powershell
# Option 1: Restart service (via Dashboard)
Start-Process "https://dashboard.render.com/web/services"

# Option 2: Rollback (if deployment-related)
# Use Render Dashboard rollback feature

# Option 3: Scale up (if resource issue)
# Adjust via Render Dashboard
```

#### 4. Post-Incident (After resolution)
```powershell
# Document incident
$incident = @{
    ID = "INC-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Severity = "P1"
    StartTime = ""
    EndTime = ""
    Duration = ""
    RootCause = ""
    Resolution = ""
    PreventiveMeasures = ""
}

$incident | ConvertTo-Json | Out-File "incidents\$(Get-Date -Format 'yyyy-MM-dd')-incident.json"
```

---

## 📊 Key Performance Indicators (KPIs)

### Weekly Metrics to Track

```powershell
# Weekly KPI collector
$kpis = @{
    Week = Get-Date -UFormat "%V"
    Uptime = 0
    IncidentCount = 0
    AverageResponseTime = 0
    DeploymentSuccess = 0
    ErrorRate = 0
}

# Calculate uptime
$totalMinutes = 7 * 24 * 60
$downtime = 0  # Get from incident logs
$kpis.Uptime = (($totalMinutes - $downtime) / $totalMinutes) * 100

Write-Host "Week $($kpis.Week) Uptime: $($kpis.Uptime)%"
```

### Target KPIs
- **Uptime**: > 99.9%
- **MTTR**: < 30 minutes
- **Deployment Success**: > 95%
- **Error Rate**: < 1%
- **Response Time**: < 200ms p95

---

## 🔄 Continuous Improvement

### Weekly Review Meeting Agenda

1. **Metrics Review** (10 min)
   - Uptime percentage
   - Incident count and severity
   - Performance trends

2. **Incident Review** (15 min)
   - Root cause analysis
   - Resolution effectiveness
   - Preventive measures

3. **Upcoming Changes** (10 min)
   - Planned deployments
   - Maintenance windows
   - Feature releases

4. **Process Improvements** (10 min)
   - Automation opportunities
   - Tool enhancements
   - Training needs

### Monthly Optimization Tasks

```powershell
# 1. Analyze log patterns
.\get-logs.ps1 -ServiceName "sentia-manufacturing-production" -Lines 10000 |
    Group-Object -Property {$_ -match "ERROR|WARN|INFO"} |
    Select-Object Count, Name

# 2. Review resource usage trends
# Check Render Dashboard metrics

# 3. Update scripts based on learnings
# Add new health checks, improve error handling

# 4. Security audit
# Review API key usage, check for anomalies
```

---

## 🛠️ Automation Opportunities

### 1. Automated Health Monitor
```powershell
# Save as automated-monitor.ps1
param(
    [int]$IntervalSeconds = 300
)

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $health = @{}

    $services = @(
        "sentia-manufacturing-production",
        "sentia-manufacturing-testing",
        "sentia-mcp-server"
    )

    foreach ($service in $services) {
        try {
            $response = Invoke-RestMethod -Uri "https://$service.onrender.com/health" -TimeoutSec 5
            $health[$service] = "Healthy"
        } catch {
            $health[$service] = "Unhealthy"
            # Send alert
            Send-MailMessage -To "ops@sentia.com" -Subject "Service Down: $service" -Body "Service $service is not responding"
        }
    }

    # Log results
    "$timestamp - $($health | ConvertTo-Json -Compress)" | Add-Content "monitoring.log"

    Start-Sleep -Seconds $IntervalSeconds
}
```

### 2. Deployment Verifier
```powershell
# Save as verify-deployment.ps1
param(
    [string]$ServiceName
)

Write-Host "Verifying deployment for $ServiceName..." -ForegroundColor Yellow

# Pre-deployment metrics
$preMetrics = Invoke-RestMethod -Uri "https://$ServiceName.onrender.com/metrics"

# Wait for deployment (check Render API)
Start-Sleep -Seconds 120

# Post-deployment checks
$checks = @{
    HealthCheck = $false
    ResponseTime = 0
    ErrorRate = 0
    Version = ""
}

# Health check
try {
    $health = Invoke-RestMethod -Uri "https://$ServiceName.onrender.com/health"
    $checks.HealthCheck = $true
    $checks.Version = $health.version
} catch {
    Write-Host "❌ Health check failed" -ForegroundColor Red
}

# Response time
$checks.ResponseTime = (Measure-Command {
    Invoke-RestMethod -Uri "https://$ServiceName.onrender.com"
}).TotalMilliseconds

# Compare with pre-deployment
if ($checks.ResponseTime -gt ($preMetrics.ResponseTime * 1.5)) {
    Write-Host "⚠️ Response time degraded" -ForegroundColor Yellow
}

$checks | Format-Table
```

---

## 📈 Scaling Guidelines

### When to Scale

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU > 80% | 5 minutes | Scale horizontally |
| Memory > 85% | 10 minutes | Scale vertically |
| Response time > 1s | 15 minutes | Add instances |
| Queue depth > 1000 | Immediate | Add workers |

### Scaling Procedures

```powershell
# Check current resources
$headers = @{"Authorization" = "Bearer $env:RENDER_API_KEY"}
$service = Invoke-RestMethod -Uri "https://api.render.com/v1/services/srv-xxxxx" -Headers $headers

Write-Host "Current plan: $($service.plan)"
Write-Host "Instances: $($service.numInstances)"

# Scale via Dashboard (API scaling coming soon)
Start-Process "https://dashboard.render.com/web/srv-xxxxx/settings"
```

---

## 🔐 Security Operations

### Weekly Security Tasks

```powershell
# 1. Check for unusual API activity
$headers = @{"Authorization" = "Bearer $env:RENDER_API_KEY"}
$logs = Invoke-RestMethod -Uri "https://api.render.com/v1/audit-logs" -Headers $headers

# 2. Review access patterns
$logs | Where-Object {$_.action -match "login|auth"} |
    Group-Object -Property user |
    Select-Object Count, Name

# 3. Verify environment variables
$services = Invoke-RestMethod -Uri "https://api.render.com/v1/services" -Headers $headers
foreach ($service in $services) {
    if ($service.envVars -match "KEY|SECRET|PASSWORD") {
        Write-Host "⚠️ Check secrets in $($service.name)" -ForegroundColor Yellow
    }
}
```

---

## 📚 Knowledge Base

### Common Issues & Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Cold starts** | Slow first request | Keep-alive pings |
| **Memory leaks** | Gradual degradation | Schedule restarts |
| **Database pool** | Connection errors | Increase pool size |
| **Rate limiting** | 429 errors | Implement caching |
| **SSL issues** | Certificate errors | Check DNS settings |

### Useful Commands Reference

```powershell
# Get service by name
$headers = @{"Authorization" = "Bearer $env:RENDER_API_KEY"}
$services = Invoke-RestMethod -Uri "https://api.render.com/v1/services" -Headers $headers
$myService = $services | Where-Object {$_.service.name -eq "sentia-manufacturing-production"}

# Check deployment status
$deployments = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$($myService.service.id)/deploys" -Headers $headers
$latest = $deployments[0]
Write-Host "Latest deployment: $($latest.status) at $($latest.createdAt)"

# Get environment variables (keys only)
$envVars = $myService.service.envVars | Select-Object -ExpandProperty key
Write-Host "Environment variables configured: $($envVars -join ', ')"
```

---

## 🎓 Team Training Resources

### Onboarding Checklist for New Team Members

- [ ] Render Dashboard access granted
- [ ] API key documentation reviewed
- [ ] PowerShell scripts training completed
- [ ] Incident response procedures understood
- [ ] Monitoring tools familiarization
- [ ] Shadow on-call rotation
- [ ] Complete first health check solo

### Training Modules

1. **Render Basics** (2 hours)
   - Service types
   - Deployment process
   - Environment variables
   - Logs and metrics

2. **PowerShell Scripts** (1 hour)
   - Running health checks
   - Viewing logs
   - API interactions

3. **Incident Response** (3 hours)
   - Severity levels
   - Response procedures
   - Communication protocols
   - Post-incident reviews

4. **Advanced Operations** (4 hours)
   - Scaling strategies
   - Performance optimization
   - Security best practices
   - Automation techniques

---

## 📞 Escalation Matrix

| Level | Contact | When to Escalate |
|-------|---------|------------------|
| L1 - On-Call | Current on-call engineer | First response |
| L2 - Team Lead | DevOps Team Lead | P1/P2 incidents |
| L3 - Management | Engineering Manager | Customer impact |
| L4 - Executive | CTO | Major outage > 1hr |

### External Support
- **Render Support**: support@render.com
- **Render Status**: https://status.render.com
- **Community Forum**: https://community.render.com

---

## ✅ Excellence Checklist

Daily:
- [ ] Morning health check
- [ ] Review overnight logs
- [ ] Check deployment queue
- [ ] Update team on status

Weekly:
- [ ] Calculate uptime metrics
- [ ] Review incident reports
- [ ] Update documentation
- [ ] Team sync meeting

Monthly:
- [ ] Full security audit
- [ ] Performance analysis
- [ ] Cost optimization review
- [ ] Disaster recovery test

Quarterly:
- [ ] API key rotation
- [ ] Access review
- [ ] Capacity planning
- [ ] Architecture review

---

**Remember**: Operational excellence is a journey, not a destination. Continuous improvement is key to maintaining world-class infrastructure.

*Last Updated: December 16, 2024*
*Next Review: January 16, 2025*