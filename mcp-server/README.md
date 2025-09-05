# Sentia MCP Server

Model Context Protocol (MCP) server providing cross-branch access to Xero, OpenAI, and Anthropic services for the Sentia Manufacturing Dashboard.

## Features

- **Xero Integration**: Complete accounting API integration
- **OpenAI Services**: Text generation, embeddings, and data analysis
- **Anthropic AI**: Manufacturing analysis and process optimization
- **Multi-Environment Support**: Separate deployments for production, test, and development
- **Health Monitoring**: Built-in health checks and status monitoring
- **Auto-deployment**: GitHub Actions workflow for CI/CD

## Quick Start

### Windows Users

1. **Initial Setup**:
   ```batch
   setup-railway.bat
   ```

2. **Deploy to Environment**:
   ```batch
   deploy-production.bat
   deploy-test.bat
   deploy-development.bat
   ```

3. **Monitor Health**:
   ```batch
   monitor-health.bat
   ```

### macOS/Linux Users

1. **Initial Setup**:
   ```bash
   chmod +x setup-railway.sh
   ./setup-railway.sh
   ```

2. **Deploy to Environment**:
   ```bash
   ./deploy-production.sh
   ./deploy-test.sh
   ./deploy-development.sh
   ```

3. **Monitor Health**:
   ```bash
   node monitor-health.js
   ```

## NPM Scripts

```bash
# Deployment
npm run deploy:production
npm run deploy:test
npm run deploy:development

# Monitoring
npm run monitor              # Check all environments
npm run monitor:production   # Check production only
npm run monitor:test         # Check test only
npm run monitor:development  # Check development only

# Logs
npm run logs:production
npm run logs:test
npm run logs:development
```

## Environment URLs

| Environment | Server URL | Health Check |
|-------------|------------|--------------|
| Production | https://sentia-mcp-server.railway.app | /health |
| Test | https://test-sentia-mcp-server.railway.app | /health |
| Development | https://dev-sentia-mcp-server.railway.app | /health |

## API Endpoints

### Health & Status
- `GET /health` - Server health check
- `GET /api/providers` - Provider status

### Xero Integration
- `GET /api/xero/contacts` - Get contacts
- `GET /api/xero/invoices` - Get invoices
- `GET /api/xero/items` - Get items
- `POST /api/xero/invoices` - Create invoice

### OpenAI Integration
- `POST /api/openai/generate` - Generate text
- `POST /api/openai/analyze` - Analyze data
- `POST /api/openai/embedding` - Create embeddings

### Anthropic Integration
- `POST /api/anthropic/manufacturing/analyze` - Manufacturing analysis
- `POST /api/anthropic/process/optimize` - Process optimization
- `POST /api/anthropic/insights` - Generate insights

## Environment Variables

### Required for All Environments

```env
# Server Configuration
NODE_ENV=production|test|development
PORT=3000
LOG_LEVEL=info|debug

# Xero Configuration
XERO_CLIENT_ID=your_client_id
XERO_CLIENT_SECRET=your_client_secret
XERO_REDIRECT_URI=https://your-server.railway.app/api/xero/callback
XERO_SCOPE=accounting.transactions,accounting.contacts,accounting.settings

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Anthropic Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key

# CORS Configuration
CORS_ORIGINS=https://your-app.railway.app
```

## Frontend Integration

### React Service Usage

```javascript
import { mcpService } from './services/mcpService';

// Check health
const health = await mcpService.checkHealth();

// Get Xero contacts
const contacts = await mcpService.xeroGetContacts();

// Generate text with OpenAI
const result = await mcpService.openaiGenerateText(
  'Your prompt here',
  { temperature: 0.7 }
);

// Analyze manufacturing data with Anthropic
const analysis = await mcpService.anthropicAnalyzeManufacturing(
  data,
  'efficiency'
);
```

### React Hook Usage

```javascript
import { useMCPService } from './hooks/useMCPService';

function MyComponent() {
  const { useHealthCheck, useXeroContacts } = useMCPService();
  
  const { data: health, isLoading } = useHealthCheck();
  const { data: contacts } = useXeroContacts({ page: 1 });
  
  return (
    <div>
      {isLoading ? 'Checking...' : health?.status}
    </div>
  );
}
```

## Deployment Architecture

```
┌─────────────────────────────────────┐
│     GitHub Repository               │
│  (production/test/development)      │
└─────────────┬───────────────────────┘
              │
              ├──── GitHub Actions
              │     (Auto-deploy)
              ▼
┌─────────────────────────────────────┐
│         Railway Platform            │
├─────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │   Production Environment      │  │
│  │   sentia-mcp-server.railway   │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │   Test Environment            │  │
│  │   test-sentia-mcp-server      │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │   Development Environment     │  │
│  │   dev-sentia-mcp-server       │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│      External Services              │
├─────────────────────────────────────┤
│  • Xero API                         │
│  • OpenAI API                       │
│  • Anthropic API                    │
└─────────────────────────────────────┘
```

## Troubleshooting

### Railway CLI Not Found
```bash
npm install -g @railway/cli
```

### Authentication Issues
```bash
railway login
railway whoami
```

### Deployment Failures
1. Check logs: `railway logs`
2. Verify environment variables
3. Check Railway dashboard for errors
4. Ensure all dependencies are in package.json

### Health Check Failures
1. Verify server is running: `railway status`
2. Check CORS configuration
3. Verify API keys are valid
4. Review server logs for errors

## Security

- API keys stored in Railway environment variables
- HTTPS enforced by Railway
- CORS configured per environment
- Rate limiting recommended for production
- Regular security audits advised

## Support

For issues or questions:
1. Check deployment logs: `npm run logs:{environment}`
2. Run health monitor: `npm run monitor`
3. Review Railway dashboard
4. Check GitHub Actions workflow status

## License

MIT - Sentia Manufacturing Dashboard