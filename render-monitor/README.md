# Autonomous Render Monitor with Anthropic AI

## 🤖 Overview

24/7 intelligent monitoring system that uses Claude 3.5 Sonnet to automatically detect, analyze, and fix deployment issues on Render.

## ✨ Features

- **Real-time Health Monitoring**: Checks all deployments every minute
- **AI-Powered Analysis**: Claude analyzes errors and generates fixes
- **Automatic Remediation**: Applies fixes automatically for critical issues
- **Pattern Recognition**: Identifies recurring issues and suggests long-term solutions
- **Self-Healing**: Automatically triggers redeployments and applies patches
- **Strategic Insights**: Provides DevOps recommendations based on trends

## 🚀 Deployment to Render

### Method 1: Direct Deployment (Recommended)

1. **Fork the repository** or push this code to your GitHub repo

2. **Create a new Web Service on Render**:
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `production` branch
   - Set root directory to `render-monitor`

3. **Configure the service**:
   ```
   Name: autonomous-render-monitor
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Starter ($7/month for 24/7 operation)
   ```

4. **Add environment variables** in Render Dashboard:
   ```
   ANTHROPIC_API_KEY=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
   GITHUB_TOKEN=<your-github-token>
   RENDER_API_KEY=<your-render-api-key>
   ENABLE_AUTO_FIX=true
   ENABLE_AI_ANALYSIS=true
   ```

5. **Deploy**: Click "Create Web Service"

### Method 2: Using render.yaml

1. **Copy the render.yaml** to your repository root
2. **Connect to Render** via Blueprint:
   - Go to https://dashboard.render.com/blueprints
   - Click "New Blueprint Instance"
   - Select your repository
   - Render will automatically detect render.yaml

3. **Add sensitive environment variables** via Render Dashboard after deployment

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Claude API key for AI analysis | Required |
| `CHECK_INTERVAL` | Health check frequency (ms) | 60000 |
| `AI_ANALYSIS_INTERVAL` | AI analysis frequency (ms) | 300000 |
| `AUTO_FIX_INTERVAL` | Auto-fix attempt frequency (ms) | 600000 |
| `ENABLE_AUTO_FIX` | Enable automatic fixes | true |
| `ENABLE_AI_ANALYSIS` | Enable AI-powered analysis | true |
| `GITHUB_TOKEN` | GitHub token for pushing fixes | Optional |
| `RENDER_API_KEY` | Render API key for redeployments | Optional |

## 📊 API Endpoints

### Health Check
```
GET /health
```
Returns monitor health status and metrics

### Current Status
```
GET /status
```
Returns deployment status, recent issues, fixes, and AI insights

### Deployment Status
```
GET /deployments
```
Returns health status of all monitored deployments

### Trigger Analysis
```
POST /analyze/:deployment
```
Manually trigger AI analysis for a specific deployment

### Apply Fix
```
POST /trigger-fix/:deployment
{
  "fix": { ... }
}
```
Manually apply a fix to a deployment

## 🧠 AI Capabilities

The monitor uses Claude 3.5 Sonnet to:

1. **Analyze Error Patterns**: Identifies root causes of 502 errors
2. **Generate Code Fixes**: Creates patches for code issues
3. **Optimize Configurations**: Suggests environment variable changes
4. **Recommend Architecture Changes**: Provides strategic improvements
5. **Predict Issues**: Identifies potential problems before they occur

## 📈 Monitoring Dashboard

Access the monitoring dashboard at:
```
https://autonomous-render-monitor.onrender.com/status
```

View real-time:
- Deployment health status
- Recent issues and fixes
- AI insights and recommendations
- Performance metrics
- Auto-fix history

## 🔒 Security

- API key is stored securely in environment variables
- GitHub token used only for pushing fixes
- Render API key used only for deployment management
- All communications over HTTPS

## 🛠️ Local Development

1. **Install dependencies**:
   ```bash
   cd render-monitor
   npm install
   ```

2. **Set environment variables**:
   ```bash
   export ANTHROPIC_API_KEY=your-api-key
   ```

3. **Run locally**:
   ```bash
   npm run dev
   ```

4. **Access locally**:
   ```
   http://localhost:3003/health
   http://localhost:3003/status
   ```

## 📝 Logs

Monitor logs are available in:
- Render Dashboard → Logs tab
- Local: `render-monitor/logs/monitor.log`

## 🚨 Alerts

The monitor can send alerts via:
- Slack webhooks
- Email notifications
- Custom webhooks

Configure in environment variables:
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
EMAIL_ALERTS=admin@example.com
```

## 📊 Metrics

Tracked metrics include:
- Total health checks performed
- Deployment failures detected
- Successful recoveries
- Auto-fixes applied
- AI analyses performed
- Pattern detections

## 🔄 Auto-Fix Types

1. **Code Patches**: Direct code fixes via git
2. **Config Updates**: Environment variable changes
3. **Redeployments**: Trigger service restarts
4. **Dependency Updates**: Package version fixes
5. **Database Migrations**: Schema updates

## 🎯 Success Metrics

- **Uptime**: 99.9% availability target
- **MTTR**: < 5 minutes mean time to recovery
- **Auto-Fix Rate**: > 80% issues resolved automatically
- **False Positives**: < 1% incorrect fixes

## 📚 Documentation

For more information:
- [Render Documentation](https://render.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com)
- [GitHub Actions](https://docs.github.com/actions)

## 📄 License

MIT License - Feel free to use and modify

## 🤝 Support

For issues or questions:
- Create an issue in the repository
- Contact the DevOps team
- Check monitor status at /health endpoint

---

**Built with ❤️ using Claude 3.5 Sonnet for intelligent monitoring**