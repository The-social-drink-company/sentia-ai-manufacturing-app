#!/usr/bin/env node

// Environment Variable Validator for Railway Deployment
// This script checks for common issues that cause "invalid key-value pair" errors

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(__filename);

console.log('Railway Environment Variable Validator');
console.log('======================================\n');

// Read .env.template
const envTemplatePath = path.join(__dirname, '..', '.env.template');
const envTemplate = fs.readFileSync(envTemplatePath, 'utf8');

// Parse environment variables from template
const lines = envTemplate.split('\n');
const envVars = [];
let issues = [];

lines.forEach((line, index) => {
  const trimmed = line.trim();
  
  // Skip comments and empty lines
  if (!trimmed || trimmed.startsWith('#')) return;
  
  // Check for valid key=value format
  const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (match) {
    const [, key, value] = match;
    envVars.push({ key, value, line: index + 1 });
    
    // Check for common issues
    if (key.includes(' ')) {
      issues.push(`Line ${index + 1}: Key "${key}" contains spaces`);
    }
    if (key.startsWith('') || key.endsWith('_')) {
      issues.push(`Line ${index + 1}: Key "${key}" starts or ends with underscore`);
    }
    if (value.includes('\t')) {
      issues.push(`Line ${index + 1}: Value for "${key}" contains tabs`);
    }
    if (value.includes('"') && !value.startsWith('"')) {
      issues.push(`Line ${index + 1}: Value for "${key}" has unescaped quotes`);
    }
    if (value === '') {
      issues.push(`Line ${index + 1}: Key "${key}" has empty value (Railway requires explicit empty string "")`);
    }
  } else if (trimmed.includes('=')) {
    issues.push(`Line ${index + 1}: Invalid format: "${trimmed}"`);
  }
});

console.log(`Found ${envVars.length} environment variables\n`);

// List critical variables for Railway
const criticalVars = [
  'NODE_ENV',
  'DATABASE_URL',
  'CLERK_SECRET_KEY',
  'VITE_CLERK_PUBLISHABLE_KEY',
  'UNLEASHED_API_ID',
  'UNLEASHED_API_KEY'
];

console.log('Critical Variables for Railway:');
console.log('--------------------------------');
criticalVars.forEach(varName => {
  const found = envVars.find(v => v.key === varName);
  if (found) {
    console.log(`[OK] ${varName}`);
  } else {
    console.log(`[MISSING] ${varName}`);
    issues.push(`Critical variable "${varName}" not found in template`);
  }
});

console.log('\nPotential Issues:');
console.log('-----------------');
if (issues.length === 0) {
  console.log('No issues detected in .env.template');
} else {
  issues.forEach(issue => console.log(`- ${issue}`));
}

console.log('\nRailway Configuration Instructions:');
console.log('------------------------------------');
console.log('1. Check Railway dashboard for any variables with:');
console.log('   - Empty keys (just "=" with no variable name)');
console.log('   - Keys with spaces or special characters');
console.log('   - Values that need quotes but don\'t have them');
console.log('   - Trailing spaces in keys or values');
console.log('\n2. For empty values in Railway, use "" (empty quotes) not blank');
console.log('\n3. Common problematic variables:');
console.log('   - API keys with special characters (wrap in quotes if needed)');
console.log('   - URLs with query parameters (may need encoding)');
console.log('   - Multi-line values (not supported, use single line)');

// Check railway.toml for issues
console.log('\n\nRailway.toml Analysis:');
console.log('----------------------');
const railwayTomlPath = path.join(__dirname, '..', 'railway.toml');
if (fs.existsSync(railwayTomlPath)) {
  const railwayToml = fs.readFileSync(railwayTomlPath, 'utf8');
  const tomlLines = railwayToml.split('\n');
  
  let inVariablesSection = false;
  tomlLines.forEach((line, index) => {
    if (line.trim() === '[variables]') {
      inVariablesSection = true;
      return;
    }
    if (line.trim().startsWith('[') && line.trim() !== '[variables]') {
      inVariablesSection = false;
      return;
    }
    
    if (inVariablesSection && line.includes('=')) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"]*)"?$/);
      if (!match) {
        console.log(`Line ${index + 1}: Potential issue with: ${line.trim()}`);
      }
    }
  });
  
  console.log('Railway.toml variables section checked');
} else {
  console.log('railway.toml not found');
}

console.log('\n\nRecommended Fix for Railway:');
console.log('----------------------------');
console.log('1. Go to Railway dashboard -> Variables tab');
console.log('2. Look for any variable with:');
console.log('   - No name (empty key field)');
console.log('   - Name containing spaces');
console.log('   - Malformed entries');
console.log('3. Delete any problematic entries');
console.log('4. Re-add them with correct format');
console.log('5. Trigger new deployment');

process.exit(issues.length > 0 ? 1 : 0);