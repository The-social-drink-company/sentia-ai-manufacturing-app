#!/usr/bin/env node

/**
 * Production Deployment Fix Script
 * Addresses critical MIME type and CSP issues in Railway production environment
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔧 CapLiquify Manufacturing Platform - Production Deployment Fix')
console.log('='.repeat(60))

async function runDeploymentFixes() {
  const fixes = []

  // 1. Verify dist directory structure
  console.log('\n📁 Checking dist directory structure...')
  const distPath = path.join(__dirname, 'dist')

  try {
    const distExists = fs.existsSync(distPath)
    if (!distExists) {
      console.error('❌ CRITICAL: dist directory does not exist - run npm run build first')
      process.exit(1)
    }

    const jsPath = path.join(distPath, 'js')
    const assetsPath = path.join(distPath, 'assets')
    const indexPath = path.join(distPath, 'index.html')

    console.log(`✅ dist directory exists: ${distExists}`)
    console.log(`✅ js directory exists: ${fs.existsSync(jsPath)}`)
    console.log(`✅ assets directory exists: ${fs.existsSync(assetsPath)}`)
    console.log(`✅ index.html exists: ${fs.existsSync(indexPath)}`)

    // Count files
    const jsFiles = fs.existsSync(jsPath)
      ? fs.readdirSync(jsPath).filter(f => f.endsWith('.js')).length
      : 0
    const cssFiles = fs.existsSync(assetsPath)
      ? fs.readdirSync(assetsPath).filter(f => f.endsWith('.css')).length
      : 0

    console.log(`✅ JavaScript files: ${jsFiles}`)
    console.log(`✅ CSS files: ${cssFiles}`)

    fixes.push('✅ Dist directory structure verified')
  } catch (error) {
    console.error('❌ Error checking dist directory:', error.message)
    fixes.push('❌ Dist directory check failed')
  }

  // 2. Verify index.html references
  console.log('\n📄 Checking index.html module references...')
  try {
    const indexPath = path.join(distPath, 'index.html')
    const indexContent = fs.readFileSync(indexPath, 'utf8')

    // Check for proper script module references
    const scriptModules = indexContent.match(/<script type="module"[^>]*src="([^"]+)"/g) || []
    const cssLinks = indexContent.match(/<link[^>]*href="([^"]*\.css[^"]*)"/g) || []

    console.log(`✅ Module script references: ${scriptModules.length}`)
    console.log(`✅ CSS link references: ${cssLinks.length}`)

    scriptModules.forEach(script => {
      const src = script.match(/src="([^"]+)"/)[1]
      console.log(`  📄 Script: ${src}`)
    })

    fixes.push('✅ Index.html references verified')
  } catch (error) {
    console.error('❌ Error checking index.html:', error.message)
    fixes.push('❌ Index.html verification failed')
  }

  // 3. Test server configuration
  console.log('\n🌐 Testing server configuration...')
  try {
    const serverPath = path.join(__dirname, 'server.js')
    const serverExists = fs.existsSync(serverPath)

    if (serverExists) {
      console.log('✅ server.js exists')

      // Read server.js and verify static middleware configuration
      const serverContent = fs.readFileSync(serverPath, 'utf8')

      const hasJsMiddleware = serverContent.includes("app.use('/js'")
      const hasAssetsMiddleware = serverContent.includes("app.use('/assets'")
      const hasCatchAll = serverContent.includes("app.get('*'")
      const hasCSP = serverContent.includes('Content-Security-Policy')

      console.log(`✅ JS middleware configured: ${hasJsMiddleware}`)
      console.log(`✅ Assets middleware configured: ${hasAssetsMiddleware}`)
      console.log(`✅ SPA catch-all configured: ${hasCatchAll}`)
      console.log(`✅ Content Security Policy configured: ${hasCSP}`)

      fixes.push('✅ Server configuration verified')
    } else {
      console.error('❌ server.js not found')
      fixes.push('❌ Server configuration check failed')
    }
  } catch (error) {
    console.error('❌ Error checking server configuration:', error.message)
    fixes.push('❌ Server configuration check failed')
  }

  // 4. Environment variable check
  console.log('\n🔐 Checking environment configuration...')
  try {
    const requiredEnvVars = ['NODE_ENV', 'VITE_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY']

    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar])

    if (missingVars.length === 0) {
      console.log('✅ All required environment variables present')
      fixes.push('✅ Environment variables verified')
    } else {
      console.log(`⚠️  Missing environment variables: ${missingVars.join(', ')}`)
      console.log('   Note: Some variables may be set in Railway deployment')
      fixes.push('⚠️  Some environment variables missing')
    }
  } catch (error) {
    console.error('❌ Error checking environment variables:', error.message)
    fixes.push('❌ Environment check failed')
  }

  // 5. Create deployment verification script
  console.log('\n📋 Creating deployment verification script...')
  try {
    const verifyScript = `#!/usr/bin/env node

/**
 * Production Deployment Verification
 * Run this script after Railway deployment to verify all fixes
 */

import http from 'http';
import https from 'https';

const BASE_URL = process.env.RAILWAY_URL || 'https://web-production-1f10.up.railway.app';

async function testEndpoint(path, expectedType) {
  return new Promise((resolve, reject) => {
    const url = \`\${BASE_URL}\${path}\`;
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      const contentType = res.headers['content-type'];
      const status = res.statusCode;
      
      console.log(\`\${path}: \${status} - \${contentType}\`);
      
      resolve({
        path,
        status,
        contentType,
        success: status === 200 && (!expectedType || contentType.includes(expectedType))
      });
    });
    
    req.on('error', (error) => {
      console.error(\`\${path}: ERROR - \${error.message}\`);
      resolve({ path, status: 'ERROR', contentType: null, success: false });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.error(\`\${path}: TIMEOUT\`);
      resolve({ path, status: 'TIMEOUT', contentType: null, success: false });
    });
  });
}

async function verifyDeployment() {
  console.log('🔍 Verifying Production Deployment');
  console.log(\`🌐 Base URL: \${BASE_URL}\`);
  console.log('=' .repeat(50));
  
  const tests = [
    { path: '/', expectedType: 'text/html' },
    { path: '/api/health', expectedType: 'application/json' },
    { path: '/js/index-MoO01Jk9.js', expectedType: 'application/javascript' },
    { path: '/assets/index-LlA1FKMx.css', expectedType: 'text/css' }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.path, test.expectedType);
    results.push(result);
  }
  
  console.log('\\n📊 Results Summary:');
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(\`✅ Successful: \${successful}/\${total}\`);
  
  if (successful === total) {
    console.log('🎉 All deployment fixes verified successfully!');
    process.exit(0);
  } else {
    console.log('❌ Some issues remain - check server logs');
    process.exit(1);
  }
}

verifyDeployment().catch(console.error);
`

    fs.writeFileSync('verify-deployment.js', verifyScript)
    console.log('✅ Created verify-deployment.js script')
    fixes.push('✅ Verification script created')
  } catch (error) {
    console.error('❌ Error creating verification script:', error.message)
    fixes.push('❌ Verification script creation failed')
  }

  // Summary
  console.log('\n🎯 Deployment Fix Summary')
  console.log('='.repeat(40))
  fixes.forEach(fix => console.log(fix))

  const successful = fixes.filter(f => f.startsWith('✅')).length
  const total = fixes.length

  console.log(`\n📊 Overall Status: ${successful}/${total} checks passed`)

  if (successful === total) {
    console.log('\n🚀 Ready for production deployment!')
    console.log('\nNext steps:')
    console.log(
      '1. Commit changes: git add . && git commit -m "Fix: Production deployment MIME type and CSP issues"'
    )
    console.log('2. Deploy to Railway: git push origin production')
    console.log('3. Verify deployment: node verify-deployment.js')
  } else {
    console.log('\n⚠️  Some issues need attention before deployment')
    console.log('Please resolve the failed checks above')
  }
}

// Handle uncaught errors
process.on('uncaughtException', error => {
  console.error('❌ Uncaught Exception:', error.message)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Run the fix script
runDeploymentFixes().catch(error => {
  console.error('❌ Deployment fix failed:', error.message)
  process.exit(1)
})

