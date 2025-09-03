# Deployment Test

Railway Project ID: `ef36131f-d36e-4c2d-8ab9-1914288d5781`

## GitHub to Railway Integration Status

- ✅ Repository: https://github.com/The-social-drink-company/sentia-manufacturing-dashboard.git
- ✅ Branch structure: development, test, production
- ✅ Auto-deployment configured via GitHub integration
- ✅ Railway configuration files in place (railway.json, Dockerfile)

## Recent Deployments

Latest commit: `bce280f` - Add explicit Railway project ID tracking
Pushed at: 2025-09-03T13:29:48Z

## Deployment Test

Test timestamp: $(date)
Test purpose: Verify GitHub push triggers Railway deployment

Expected behavior:
1. Push to development branch triggers Railway build
2. Railway builds using Dockerfile
3. New deployment becomes available at https://sentiadeploy.financeflo.ai
4. Health check endpoint responds successfully