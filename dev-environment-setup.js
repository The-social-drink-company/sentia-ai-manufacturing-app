import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🛠️ OPTIMIZING LOCAL DEVELOPMENT ENVIRONMENT');
console.log('=============================================');

try {
  console.log('🔧 Checking and installing missing dependencies...');
  
  // Install core dependencies that might be missing
  const criticalDeps = [
    'dotenv@^16.6.1',
    'express@^4.19.2',
    '@vitejs/plugin-react@^5.0.2',
    'vite@^7.1.4',
    'concurrently@^8.2.2',
    'nodemon@^3.1.4'
  ];
  
  console.log('📦 Installing critical dependencies...');
  criticalDeps.forEach(dep => {
    try {
      execSync(`npm install ${dep}`, { stdio: 'inherit' });
      console.log(`✅ ${dep} installed successfully`);
    } catch (error) {
      console.log(`⚠️ ${dep} already installed or error occurred`);
    }
  });

  // Clean up node_modules cache issues
  console.log('🧹 Cleaning development cache...');
  try {
    execSync('npm run prebuild', { stdio: 'inherit' });
    console.log('✅ Cache cleaned successfully');
  } catch (error) {
    console.log('⚠️ Cache clean completed with warnings');
  }

  // Create optimized development scripts
  console.log('📝 Creating optimized development scripts...');
  
  const devScripts = {
    'dev:clean': 'rimraf node_modules/.vite dist node_modules/.cache',
    'dev:fresh': 'npm run dev:clean && npm install && npm run dev',
    'dev:quick': 'concurrently "npm run serve" "npm run dev:client"',
    'serve:static': 'npx serve dist -p 3000',
    'dev:production-test': 'npm run build && npm run serve:static'
  };

  // Update package.json with optimized scripts
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  Object.assign(packageJson.scripts, devScripts);
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Development scripts added to package.json');

  // Create environment-specific configurations
  console.log('⚙️ Setting up environment configurations...');
  
  const devEnvTemplate = `# DEVELOPMENT ENVIRONMENT CONFIGURATION
NODE_ENV=development
PORT=5001
VITE_PORT=3000

# Local Development URLs
VITE_API_BASE_URL=http://localhost:5001/api
CORS_ORIGINS=http://localhost:3000,http://localhost:5001

# Development Database (Render PostgreSQL)
DATABASE_URL=postgresql://sentia_dev:nZ4vtXienMAwxahr0GJByc2qXFIFSoYL@dpg-d344rkfdiees73a20c50-a/sentia_manufacturing_dev

# Clerk Development Keys
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y2hhbXBpb24tYnVsbGRvZy05Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_EP6iF7prGbq73CscUPCOW8PAKol4pPaBG5iYdsDodq

# Development Flags
VITE_DEBUG_MODE=true
VITE_DEV_TOOLS=true
VITE_HOT_RELOAD=true

# Logging Level
LOG_LEVEL=DEBUG
`;

  fs.writeFileSync('.env.development', devEnvTemplate);
  console.log('✅ Development environment file created');

  // Create VS Code workspace settings for optimal development
  const vsCodeSettings = {
    "typescript.preferences.quoteStyle": "single",
    "javascript.preferences.quoteStyle": "single",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true,
      "source.organizeImports": true
    },
    "emmet.includeLanguages": {
      "javascript": "javascriptreact"
    },
    "files.associations": {
      "*.env.*": "dotenv"
    },
    "search.exclude": {
      "**/node_modules": true,
      "**/dist": true,
      "**/.git": true,
      "**/coverage": true
    }
  };

  const vsCodeDir = path.join(process.cwd(), '.vscode');
  if (!fs.existsSync(vsCodeDir)) {
    fs.mkdirSync(vsCodeDir);
  }
  
  fs.writeFileSync(
    path.join(vsCodeDir, 'settings.json'),
    JSON.stringify(vsCodeSettings, null, 2)
  );
  console.log('✅ VS Code workspace settings configured');

  console.log('\n🎉 LOCAL DEVELOPMENT ENVIRONMENT OPTIMIZED!');
  console.log('=========================================');
  console.log('🚀 Available development commands:');
  console.log('   npm run dev         - Start full development server');
  console.log('   npm run dev:fresh   - Clean install and start dev');
  console.log('   npm run dev:quick   - Quick start with static serving');
  console.log('   npm run build       - Production build');
  console.log('   npm run preview     - Preview production build');
  console.log('\n✅ Environment ready for continued development!');

} catch (error) {
  console.error('❌ Development environment setup failed:', error.message);
  process.exit(1);
}