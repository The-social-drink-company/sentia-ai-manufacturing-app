// Railway Environment Variable Checker
// This script helps diagnose missing environment variables on Railway

const requiredVars = [
  // Core
  'NODE_ENV',
  'PORT',
  
  // Database
  'DATABASE_URL',
  'DEV_DATABASE_URL',
  'TEST_DATABASE_URL',
  
  // Authentication
  'CLERK_SECRET_KEY',
  'VITE_CLERK_PUBLISHABLE_KEY',
  
  // API Keys
  'XERO_CLIENT_ID',
  'XERO_CLIENT_SECRET',
  'SHOPIFY_ACCESS_TOKEN',
  'SHOPIFY_SHOP_DOMAIN',
  
  // Frontend
  'VITE_API_BASE_URL',
  'VITE_APP_TITLE',
  'VITE_APP_VERSION'
];

const optionalVars = [
  'REDIS_URL',
  'CORS_ORIGINS',
  'JWT_SECRET',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY'
];

console.log('========================================');
console.log('RAILWAY ENVIRONMENT VARIABLE CHECK');
console.log('========================================');
console.log('');

console.log('REQUIRED VARIABLES:');
console.log('-------------------');
let missingRequired = [];
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✓ ${varName}: ${varName.includes('SECRET') || varName.includes('KEY') ? '[REDACTED]' : value.substring(0, 50)}...`);
  } else {
    console.log(`✗ ${varName}: NOT SET`);
    missingRequired.push(varName);
  }
});

console.log('');
console.log('OPTIONAL VARIABLES:');
console.log('-------------------');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✓ ${varName}: ${varName.includes('SECRET') || varName.includes('KEY') ? '[REDACTED]' : value.substring(0, 50)}...`);
  } else {
    console.log(`○ ${varName}: Not set (optional)`);
  }
});

console.log('');
console.log('========================================');
if (missingRequired.length > 0) {
  console.log('⚠️  MISSING REQUIRED VARIABLES:');
  missingRequired.forEach(v => console.log(`   - ${v}`));
  console.log('');
  console.log('Please set these in Railway Dashboard:');
  console.log('1. Go to your Railway project');
  console.log('2. Click on the service (sentia-manufacturing-dashboard)');
  console.log('3. Go to Variables tab');
  console.log('4. Add the missing variables');
  process.exit(1);
} else {
  console.log('✅ All required variables are set!');
  console.log('If still getting 502, check Railway logs for startup errors.');
  process.exit(0);
}