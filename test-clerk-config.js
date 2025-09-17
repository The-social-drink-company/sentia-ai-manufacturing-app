#!/usr/bin/env node
// Test Clerk configuration
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('='.repeat(60));
console.log('Clerk Authentication Configuration Test');
console.log('='.repeat(60));

// Check for Clerk keys
const clerkPublishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

console.log('\n1. Environment Variables:');
console.log('-------------------------');

if (clerkPublishableKey) {
  console.log('✅ VITE_CLERK_PUBLISHABLE_KEY is set');
  console.log('   Key prefix:', clerkPublishableKey.substring(0, 30) + '...');
  console.log('   Key type:', clerkPublishableKey.startsWith('pk_test') ? 'Test/Development' : 'Production');
} else {
  console.error('❌ VITE_CLERK_PUBLISHABLE_KEY is NOT set');
  console.log('   This is required for frontend authentication');
}

if (clerkSecretKey) {
  console.log('✅ CLERK_SECRET_KEY is set');
  console.log('   Key prefix:', clerkSecretKey.substring(0, 20) + '...');
  console.log('   Key type:', clerkSecretKey.startsWith('sk_test') ? 'Test/Development' : 'Production');
} else {
  console.error('❌ CLERK_SECRET_KEY is NOT set');
  console.log('   This is required for backend authentication');
}

console.log('\n2. Configuration Status:');
console.log('------------------------');

const hasFrontendAuth = !!clerkPublishableKey;
const hasBackendAuth = !!clerkSecretKey;

if (hasFrontendAuth && hasBackendAuth) {
  console.log('✅ Full Clerk authentication is configured');
  console.log('   Both frontend and backend can authenticate users');
} else if (hasFrontendAuth) {
  console.log('⚠️ Partial configuration - Frontend only');
  console.log('   Users can sign in via UI but backend cannot verify');
} else if (hasBackendAuth) {
  console.log('⚠️ Partial configuration - Backend only');
  console.log('   Backend can verify but UI cannot show sign-in');
} else {
  console.log('❌ No Clerk authentication configured');
  console.log('   Application will run in guest/demo mode');
}

console.log('\n3. Implementation Locations:');
console.log('----------------------------');
console.log('Frontend:');
console.log('  - main.jsx: ClerkProvider wrapper (lines 84-105)');
console.log('  - App.jsx: Protected routes and auth UI components');
console.log('  - Uses: VITE_CLERK_PUBLISHABLE_KEY');
console.log('');
console.log('Backend:');
console.log('  - server.js: Authentication middleware');
console.log('  - Uses: CLERK_SECRET_KEY');

console.log('\n4. Recommendations:');
console.log('-------------------');
if (!hasFrontendAuth || !hasBackendAuth) {
  console.log('To enable full authentication:');
  if (!clerkPublishableKey) {
    console.log('1. Add VITE_CLERK_PUBLISHABLE_KEY to .env file');
    console.log('   Get from: https://dashboard.clerk.dev');
  }
  if (!clerkSecretKey) {
    console.log('2. Add CLERK_SECRET_KEY to .env file');
    console.log('   Get from: https://dashboard.clerk.dev');
  }
  console.log('3. Restart the development server after adding keys');
} else {
  console.log('✅ Clerk is fully configured and ready to use!');
}

console.log('\n' + '='.repeat(60));
console.log('Test completed');
console.log('='.repeat(60));