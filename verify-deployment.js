#!/usr/bin/env node

/**
 * Production Deployment Verification
 * Run this script after Railway deployment to verify all fixes
 */

import http from 'http';
import https from 'https';

const BASE_URL = process.env.RAILWAY_URL || 'https://web-production-1f10.up.railway.app';

async function testEndpoint(path, expectedType) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      const contentType = res.headers['content-type'];
      const status = res.statusCode;
      
      console.log(`${path}: ${status} - ${contentType}`);
      
      resolve({
        path,
        status,
        contentType,
        success: status === 200 && (!expectedType || contentType.includes(expectedType))
      });
    });
    
    req.on('error', (error) => {
      console.error(`${path}: ERROR - ${error.message}`);
      resolve({ path, status: 'ERROR', contentType: null, success: false });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.error(`${path}: TIMEOUT`);
      resolve({ path, status: 'TIMEOUT', contentType: null, success: false });
    });
  });
}

async function verifyDeployment() {
  console.log('🔍 Verifying Production Deployment');
  console.log(`🌐 Base URL: ${BASE_URL}`);
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
  
  console.log('\n📊 Results Summary:');
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`✅ Successful: ${successful}/${total}`);
  
  if (successful === total) {
    console.log('🎉 All deployment fixes verified successfully!');
    process.exit(0);
  } else {
    console.log('❌ Some issues remain - check server logs');
    process.exit(1);
  }
}

verifyDeployment().catch(console.error);
