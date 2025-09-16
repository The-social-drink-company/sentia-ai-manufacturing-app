#!/usr/bin/env node

/**
 * Render Deployment Fix Script
 * Ensures all files are correctly configured for Render deployment
 */

import fs from 'fs';
import path from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.blue}Render Deployment Fix Tool${colors.reset}`);
console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);

let hasErrors = false;
const fixes = [];

// Check 1: Verify server.js exists
console.log(`${colors.cyan}Checking server files...${colors.reset}`);
if (fs.existsSync('server.js')) {
  console.log(`${colors.green}✓${colors.reset} server.js exists`);
} else {
  console.log(`${colors.red}✗${colors.reset} server.js missing`);
  hasErrors = true;
}

// Check 2: Verify render.yaml uses correct start command
console.log(`\n${colors.cyan}Checking render.yaml configuration...${colors.reset}`);
if (fs.existsSync('render.yaml')) {
  const renderYaml = fs.readFileSync('render.yaml', 'utf8');

  if (renderYaml.includes('startCommand: node server-render.js')) {
    console.log(`${colors.yellow}⚠${colors.reset} render.yaml uses server-render.js (fixing...)`);

    const fixed = renderYaml.replace(
      /startCommand: node server-render\.js/g,
      'startCommand: node server.js'
    );

    fs.writeFileSync('render.yaml', fixed);
    fixes.push('Updated render.yaml to use server.js');
    console.log(`${colors.green}✓${colors.reset} Fixed render.yaml`);
  } else if (renderYaml.includes('startCommand: node server.js')) {
    console.log(`${colors.green}✓${colors.reset} render.yaml correctly uses server.js`);
  } else {
    console.log(`${colors.yellow}⚠${colors.reset} render.yaml has non-standard start command`);
  }
} else {
  console.log(`${colors.red}✗${colors.reset} render.yaml not found`);
  hasErrors = true;
}

// Check 3: Verify render-environments-complete.yaml if it exists
if (fs.existsSync('render-environments-complete.yaml')) {
  console.log(`\n${colors.cyan}Checking render-environments-complete.yaml...${colors.reset}`);
  const envYaml = fs.readFileSync('render-environments-complete.yaml', 'utf8');

  if (envYaml.includes('startCommand: node server-render.js')) {
    console.log(`${colors.yellow}⚠${colors.reset} Found server-render.js references (fixing...)`);

    const fixed = envYaml.replace(
      /startCommand: node server-render\.js/g,
      'startCommand: node server.js'
    );

    fs.writeFileSync('render-environments-complete.yaml', fixed);
    fixes.push('Updated render-environments-complete.yaml');
    console.log(`${colors.green}✓${colors.reset} Fixed render-environments-complete.yaml`);
  } else {
    console.log(`${colors.green}✓${colors.reset} render-environments-complete.yaml is correct`);
  }
}

// Check 4: Verify critical directories exist
console.log(`\n${colors.cyan}Checking directory structure...${colors.reset}`);
const requiredDirs = ['routes', 'services', 'config', 'dist', 'public'];

for (const dir of requiredDirs) {
  if (fs.existsSync(dir)) {
    console.log(`${colors.green}✓${colors.reset} ${dir}/ directory exists`);
  } else {
    console.log(`${colors.yellow}⚠${colors.reset} ${dir}/ directory missing (may be created during build)`);
  }
}

// Check 5: Verify package.json has correct scripts
console.log(`\n${colors.cyan}Checking package.json scripts...${colors.reset}`);
if (fs.existsSync('package.json')) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

  const requiredScripts = ['start', 'build'];
  for (const script of requiredScripts) {
    if (pkg.scripts && pkg.scripts[script]) {
      console.log(`${colors.green}✓${colors.reset} "${script}" script exists`);
    } else {
      console.log(`${colors.red}✗${colors.reset} "${script}" script missing`);
      hasErrors = true;
    }
  }
}

// Check 6: Database configuration
console.log(`\n${colors.cyan}Checking database configuration...${colors.reset}`);
if (fs.existsSync('render.yaml')) {
  const renderYaml = fs.readFileSync('render.yaml', 'utf8');

  if (renderYaml.includes('fromDatabase:')) {
    console.log(`${colors.green}✓${colors.reset} Database configuration uses Render PostgreSQL`);
  } else if (renderYaml.includes('neon')) {
    console.log(`${colors.yellow}⚠${colors.reset} Still references Neon database`);
    console.log(`  Run migration script to switch to Render PostgreSQL`);
  }
}

// Check 7: Prisma configuration
console.log(`\n${colors.cyan}Checking Prisma configuration...${colors.reset}`);
if (fs.existsSync('prisma/schema.prisma')) {
  console.log(`${colors.green}✓${colors.reset} Prisma schema exists`);
} else {
  console.log(`${colors.red}✗${colors.reset} Prisma schema missing`);
  hasErrors = true;
}

// Summary
console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}`);
console.log(`${colors.blue}DEPLOYMENT FIX SUMMARY${colors.reset}`);
console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);

if (fixes.length > 0) {
  console.log(`${colors.green}Applied ${fixes.length} fixes:${colors.reset}`);
  fixes.forEach(fix => {
    console.log(`  ${colors.green}✓${colors.reset} ${fix}`);
  });
  console.log();
}

if (hasErrors) {
  console.log(`${colors.red}⚠ Some issues require manual attention${colors.reset}`);
  console.log(`Please review the errors above and fix them manually.`);
  process.exit(1);
} else {
  console.log(`${colors.green}✅ All checks passed!${colors.reset}`);
  console.log(`${colors.green}Your application is ready for Render deployment.${colors.reset}`);

  console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
  console.log(`1. Commit changes: git add -A && git commit -m "Fix Render deployment"`);
  console.log(`2. Push to GitHub: git push origin development`);
  console.log(`3. Render will automatically redeploy`);
  console.log(`4. Monitor deployment at: https://dashboard.render.com`);

  process.exit(0);
}