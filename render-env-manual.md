# Manual Environment Variables for Render

## CRITICAL VARIABLES ONLY (Minimum to get working)

### For ALL Services (Dev/Test/Prod):
```
NODE_ENV = [development/test/production]
PORT = 5000
DATABASE_URL = postgresql://neondb_owner:npg_2wXVD9gdintm@ep-aged-dust-abpyip0r-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
VITE_CLERK_PUBLISHABLE_KEY = pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY = sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq
JWT_SECRET = dev_jwt_secret_change_this_in_production_xY9zA3bC5dE7fG2hJ4kL
SESSION_SECRET = dev_session_secret_change_this_in_production_aB3dE5gH7jK9mN2pQ4rS
CORS_ORIGINS = https://sentia-manufacturing-[environment].onrender.com
```

### Specific for Development:
```
NODE_ENV = development
CORS_ORIGINS = https://sentia-manufacturing-development.onrender.com,http://localhost:3000
VITE_API_BASE_URL = https://sentia-manufacturing-development.onrender.com/api
```

### Specific for Testing:
```
NODE_ENV = test
CORS_ORIGINS = https://sentia-manufacturing-testing.onrender.com,http://localhost:3000
VITE_API_BASE_URL = https://sentia-manufacturing-testing.onrender.com/api
TEST_DATABASE_URL = postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

### Specific for Production:
```
NODE_ENV = production
CORS_ORIGINS = https://sentia-manufacturing-production.onrender.com
VITE_API_BASE_URL = https://sentia-manufacturing-production.onrender.com/api
DATABASE_URL = postgresql://neondb_owner:npg_2wXVD9gdintm@ep-broad-resonance-ablmx6yo-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

## HOW TO ADD IN RENDER:

1. Go to your service (e.g., sentia-manufacturing-development)
2. Click "Environment" tab
3. For each variable above:
   - Click "Add Environment Variable"
   - Enter the KEY (left side of =)
   - Enter the VALUE (right side of =)
   - Click Save/Add

4. After adding all variables, the service should auto-redeploy

## IF STILL NOT WORKING:

Try "Manual Deploy":
1. Go to the service
2. Find "Manual Deploy" button (usually top right)
3. Click "Clear build cache & deploy"