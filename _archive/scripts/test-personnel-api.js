#!/usr/bin/env node
// Test script for /api/personnel endpoint
// Node 18+ has global fetch

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

console.log('Testing Personnel API Endpoint');
console.log('='.repeat(50));
console.log('Base URL:', BASE_URL);
console.log('');

async function testPersonnelAPI() {
  try {
    // Test 1: Get all personnel
    console.log('Test 1: Fetching all personnel...');
    const response1 = await fetch(`${BASE_URL}/api/personnel`);
    const data1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', JSON.stringify(data1, null, 2));
    console.log('');

    // Test 2: Get personnel by role
    console.log('Test 2: Fetching personnel with role=admin...');
    const response2 = await fetch(`${BASE_URL}/api/personnel?role=admin`);
    const data2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', JSON.stringify(data2, null, 2));
    console.log('');

    // Test 3: Get personnel with multiple roles
    console.log('Test 3: Fetching personnel with multiple roles...');
    const response3 = await fetch(`${BASE_URL}/api/personnel?role=admin&role=manager`);
    const data3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Response:', JSON.stringify(data3, null, 2));
    console.log('');

    console.log('✅ Personnel API tests completed');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPersonnelAPI();