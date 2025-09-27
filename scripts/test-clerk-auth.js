#!/usr/bin/env node

/**
 * Test Clerk Authentication Configuration
 * Verifies that Clerk is properly configured for both frontend and backend
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname in ES modules
const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('='.repeat(60));
console.log('CLERK AUTHENTICATION CONFIGURATION TEST');
console.log('='.repeat(60));
console.log('');

// Test Clerk configuration
const tests = {
  'Frontend Publishable Key': process.env.VITE_CLERK_PUBLISHABLE_KEY,
  'Backend Secret Key': process.env.CLERK_SECRET_KEY,
  'Webhook Secret': process.env.CLERK_WEBHOOK_SECRET,
  'React App Key (Legacy)': process.env.REACT_APP_CLERK_PUBLISHABLE_KEY
};

let allPassed = true;

// Check each configuration
Object.entries(tests).forEach(_([name, _value]) => {
  if (value) {
    // Mask the actual value for security
    const masked = value.substring(0, 20) + '...' + value.substring(value.length - 4);
    console.log(`✅ ${name}: ${masked}`);
  } else {
    console.log(`❌ ${name}: NOT CONFIGURED`);
    allPassed = false;
  }
});

console.log('');
console.log('Key Format Validation:');
console.log('-'.repeat(40));

// Validate key formats
if (process.env.VITE_CLERK_PUBLISHABLE_KEY) {
  const pubKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (pubKey.startsWith('pk_test') || pubKey.startsWith('pk_live')) {
    console.log('✅ Publishable key has correct format');
  } else {
    console.log('⚠️  Publishable key format unusual (should start with pk_test_ or pk_live_)');
  }
}

if (process.env.CLERK_SECRET_KEY) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (secretKey.startsWith('sk_test') || secretKey.startsWith('sk_live')) {
    console.log('✅ Secret key has correct format');
  } else {
    console.log('⚠️  Secret key format unusual (should start with sk_test_ or sk_live_)');
  }
}

console.log('');
console.log('Environment Detection:');
console.log('-'.repeat(40));

// Detect environment
const isProduction = process.env.NODEENV = == 'production';
const isRender = !!process.env.RENDER;
const isLocal = !process.env.RENDER && !process.env.RAILWAY_ENVIRONMENT;

console.log(`Environment: ${process.env.NODE_ENV || 'not set'}`);
console.log(`Platform: ${isRender ? 'Render' : isLocal ? 'Local' : 'Unknown'}`);

if (isProduction && process.env.VITE_CLERK_PUBLISHABLE_KEY?.includes('test')) {
  console.log('⚠️  WARNING: Using test keys in production environment');
}

console.log('');
console.log('='.repeat(60));

if (allPassed) {
  console.log('✅ CLERK AUTHENTICATION PROPERLY CONFIGURED');
  console.log('');
  console.log('Next Steps:');
  console.log('1. Frontend will use ClerkProvider with the publishable key');
  console.log('2. Backend can validate sessions with the secret key');
  console.log('3. Webhooks can be verified with the webhook secret');
} else {
  console.log('❌ CLERK AUTHENTICATION MISSING CONFIGURATION');
  console.log('');
  console.log('Required Setup:');
  console.log('1. Get keys from: https://dashboard.clerk.com');
  console.log('2. Add to .env file:');
  console.log('   VITECLERK_PUBLISHABLE_KEY = pk_test_...');
  console.log('   CLERKSECRET_KEY = sk_test_...');
  console.log('   CLERKWEBHOOK_SECRET = whsec_...');
}

console.log('='.repeat(60));
