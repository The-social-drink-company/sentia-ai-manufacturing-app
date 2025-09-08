# Railway Deployment Setup Instructions

## Critical Environment Variables Required

Copy these environment variables to your Railway dashboard:

### Core Configuration
```
NODE_ENV=production
PORT=8080
```

### Database (Railway PostgreSQL Plugin)
```
# Railway will automatically inject DATABASE_URL from PostgreSQL plugin
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### Authentication (Demo Keys - Replace with Real Keys)
```
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
```

### API Configuration
```
VITE_API_BASE_URL=/api
CORS_ORIGINS=*
```

### Railway Specific
```
RAILWAY_ENVIRONMENT_NAME=production
```

## Deployment Commands
The Railway build process will:
1. `npm ci --no-cache` - Install dependencies
2. `npx prisma generate` - Generate Prisma client  
3. `npm run build` - Build React frontend
4. `npx prisma migrate deploy` - Run database migrations
5. `node server.js` - Start the server

## Health Checks
- Health endpoint: `/api/health`
- Admin endpoint: `/api/admin/users`
- Frontend: `/` (serves built React app)

## Admin Panel Features
- User management at `/admin`
- 6 API endpoints for user operations
- Demo users and invitations included
- Works without external dependencies