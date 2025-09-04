# Railway Deployment Guide

## Overview
Railway is a deployment platform that simplifies the process of deploying applications. This guide covers best practices for deploying Vite + React applications with Node.js backends.

## Key Configuration Requirements

### 1. Environment Variables
- Railway auto-injects PORT environment variable
- Use process.env.PORT || 3000 in your server
- Frontend env vars must start with VITE_ prefix
- Set NODE_ENV=production for production builds

### 2. Build Configuration

#### package.json scripts
```json
{
  "scripts": {
    "build": "vite build",
    "start": "node server.js",
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\""
  }
}
```

### 3. Server Configuration

#### Static File Serving (server.js)
```javascript
// CRITICAL: Serve static files AFTER API routes but BEFORE catch-all
app.use('/api', apiRoutes);
app.use(express.static('dist'));

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
```

### 4. Railway.toml Configuration
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

## Common Issues and Solutions

### Blank Screen Issues

1. **Missing Environment Variables**
   - Ensure all required env vars are set in Railway dashboard
   - Check for conditional imports that fail silently

2. **Static File Serving**
   - Verify dist folder exists: `Dist folder exists: true`
   - Check middleware order in Express
   - Ensure index.html is being served for SPA routes

3. **Build Failures**
   - Remove problematic dependencies (like Clerk if not configured)
   - Check for import errors in production build
   - Verify all file paths are correct

4. **Port Configuration**
   - Railway provides PORT automatically
   - Don't hardcode ports, use process.env.PORT

### Debugging Steps

1. Check Railway deployment logs
2. Verify build output includes all files
3. Test locally with production build: `npm run build && npm start`
4. Check browser console for errors
5. Verify API endpoints are accessible

## Best Practices

1. **Remove Optional Dependencies**: If auth libraries like Clerk aren't configured, remove them completely
2. **Graceful Fallbacks**: Handle missing env vars gracefully
3. **Error Boundaries**: Implement React error boundaries
4. **Logging**: Add comprehensive logging for debugging
5. **Health Checks**: Implement health check endpoints

## Deployment Checklist

- [ ] All environment variables configured in Railway
- [ ] Build command succeeds locally
- [ ] Production build serves correctly
- [ ] Static files are accessible
- [ ] API routes work
- [ ] No console errors in browser
- [ ] Application renders content (not blank)

## Railway-Specific Features

- **Auto Deploy**: Pushes to connected branch trigger deployments
- **Preview Environments**: PRs create preview deployments
- **Rollback**: Easy rollback to previous deployments
- **Logs**: Real-time logs for debugging
- **Metrics**: Built-in metrics for monitoring

## References
- [Railway Docs](https://docs.railway.com)
- [Railway Node.js Guide](https://docs.railway.com/guides/node)
- [Railway Environment Variables](https://docs.railway.com/develop/variables)