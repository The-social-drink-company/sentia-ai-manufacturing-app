#!/usr/bin/env node

/**
 * Real Data Validation Script
 * Scans codebase for mock/fake/static data violations
 * Part of SpecKit Real Data Only enforcement
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import chalk from 'chalk';

const _dirname = path.dirname(fileURLToPath(import.meta.url));

// ==================== CONFIGURATION ====================
const SCANPATTERNS = [
  'src/**/*.{js,jsx,ts,tsx}',
  'server*.js',
  'api/**/*.{js,jsx}',
  'services/**/*.js',
  'lib/**/*.js'
];

const EXCLUDEPATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/coverage/**',
  '**/*.test.js',
  '**/*.spec.js',
  '**/test/**',
  '**/tests/**'
];

// Forbidden patterns that indicate mock/fake data
const FORBIDDENPATTERNS = [
  // Mock data patterns
  /\bMOCK_[A-Z_]+\b/g,
  /\bFAKE_[A-Z_]+\b/g,
  /\bDEMO_[A-Z_]+\b/g,
  /\bSAMPLE_[A-Z_]+\b/g,
  /\bTEST_[A-Z_]+\b/g,

  // Variable/function names
  /\bmockData\b/g,
  /\bfakeData\b/g,
  /\bdemoData\b/g,
  /\bstaticData\b/g,
  /\bfallbackData\b/g,
  /\bdefaultData\b/g,
  /\bsampleData\b/g,
  /\bexampleData\b/g,
  /\btestData\b/g,
  /\bplaceholderData\b/g,
  /\bdummyData\b/g,

  // Function calls
  /\bgetMockData(/g,
  /\bgenerateFakeData(/g,
  /\bcreateDemoData(/g,
  /\buseMockData(/g,
  /\buseFakeData(/g,

  // Imports
  /import.*mock/gi,
  /import.*fake/gi,
  /import.*demo/gi,
  /from\s+['"].*mock.*['"]/gi,
  /from\s+['"].*fake.*['"]/gi,

  // Common mock libraries
  /\bfaker./g,
  /\b@faker-js/faker\b/g,
  /\bcasual./g,
  /\bchance./g,

  // Hardcoded data arrays
  /const\s+\w+\s*=\s*\[\s*['"][^'"]+['"]/g,
  /const\s+\w+\s*=\s*\[\s*\{/g,

  // Lorem ipsum
  /\blorem\s+ipsum\b/gi,
  /\bdolor\s+sit\s+amet\b/gi
];

// Forbidden fallback patterns
const FALLBACKPATTERNS = [
  /\|\|\s*\[\]/g,           // || []
  /\|\|\s*\{\}/g,           // || {}
  /\|\|\s*['"]['"]*/g,      // || "" or || ''
  /\|\|\s*0/g,              // || 0
  /\|\|\s*null/g,           // || null
  /\?\?\s*\[\]/g,           // ?? []
  /\?\?\s*\{\}/g,           // ?? {}
  /withFallback(/g,
  /fallback:/g,
  /defaultValue:/g
];

// Required patterns for real data
const REQUIREDPATTERNS = {
  components: [
    /useQuery/,
    /useMutation/,
    /axios/,
    /fetch/
  ],
  services: [
    /axios/,
    /fetch/,
    /pgPool.query/,
    /prisma./
  ],
  api: [
    /res.status/,
    /res.json/,
    /await/,
    /try\s*{/
  ]
};

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Scan file for violations
 */
async function scanFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const violations = [];
  const warnings = [];

  // Check for forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      violations.push({
        file: filePath,
        pattern: pattern.toString(),
        matches: matches.slice(0, 3), // Show first 3 matches
        line: getLineNumber(content, matches[0]),
        type: 'FORBIDDEN_PATTERN'
      });
    }
  }

  // Check for fallback patterns
  for (const pattern of FALLBACK_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      violations.push({
        file: filePath,
        pattern: pattern.toString(),
        matches: matches.slice(0, 3),
        line: getLineNumber(content, matches[0]),
        type: 'FALLBACK_PATTERN'
      });
    }
  }

  // Check for hardcoded data
  const hardcodedArrays = content.match(/const\s+\w+\s*=\s*\[[\s\S]{0,500}\]/g);
  if (hardcodedArrays) {
    hardcodedArrays.forEach(match => {
      // Skip if it's importing or destructuring
      if (!match.includes('import') && !match.includes('require') && !match.includes('...')) {
        warnings.push({
          file: filePath,
          snippet: match.substring(0, 100) + '...',
          line: getLineNumber(content, match),
          type: 'POSSIBLE_HARDCODED_DATA'
        });
      }
    });
  }

  // Check for missing required patterns based on file type
  const fileType = getFileType(filePath);
  if (REQUIRED_PATTERNS[fileType]) {
    const hasRequired = REQUIRED_PATTERNS[fileType].some(pattern =>
      pattern.test(content)
    );

    if (!hasRequired && content.length > 100) { // Skip empty/small files
      warnings.push({
        file: filePath,
        type: 'MISSING_DATA_FETCHING',
        message: `File appears to lack real data fetching mechanisms`
      });
    }
  }

  return { violations, warnings };
}

/**
 * Get line number for a match
 */
function getLineNumber(content, match) {
  const lines = content.substring(0, content.indexOf(match)).split('\n');
  return lines.length;
}

/**
 * Determine file type
 */
function getFileType(filePath) {
  if (filePath.includes('/components/')) return 'components';
  if (filePath.includes('/services/')) return 'services';
  if (filePath.includes('/api/') || filePath.includes('server')) return 'api';
  return 'other';
}

/**
 * Format violation for output
 */
function formatViolation(violation) {
  const location = chalk.cyan(`${violation.file}:${violation.line || '?'}`);
  const type = chalk.red(violation.type);
  const pattern = chalk.yellow(violation.pattern || '');

  let output = `  ${location}\n    ${type}`;

  if (violation.matches) {
    output += `\n    Matches: ${violation.matches.join(', ')}`;
  }

  if (violation.snippet) {
    output += `\n    ${chalk.gray(violation.snippet)}`;
  }

  return output;
}

/**
 * Format warning for output
 */
function formatWarning(warning) {
  const location = chalk.cyan(warning.file + (warning.line ? `:${warning.line}` : ''));
  const type = chalk.yellow(warning.type);

  let output = `  ${location}\n    ${type}`;

  if (warning.message) {
    output += `\n    ${chalk.gray(warning.message)}`;
  }

  if (warning.snippet) {
    output += `\n    ${chalk.gray(warning.snippet)}`;
  }

  return output;
}

// ==================== MAIN EXECUTION ====================

async function main() {
  console.log(chalk.bold.blue('\n🔍 SpecKit Real Data Validation\n'));
  console.log(chalk.gray('Scanning for mock/fake/static data violations...\n'));

  let totalViolations = 0;
  let totalWarnings = 0;
  const allViolations = [];
  const allWarnings = [];

  // Get all files to scan
  const files = await glob(SCAN_PATTERNS, {
    ignore: EXCLUDE_PATTERNS,
    absolute: true
  });

  console.log(chalk.gray(`Scanning ${files.length} files...\n`));

  // Scan each file
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    const { violations, warnings } = await scanFile(file);

    if (violations.length > 0) {
      violations.forEach(v => {
        v.file = relativePath;
        allViolations.push(v);
      });
      totalViolations += violations.length;
    }

    if (warnings.length > 0) {
      warnings.forEach(w => {
        w.file = relativePath;
        allWarnings.push(w);
      });
      totalWarnings += warnings.length;
    }
  }

  // Report results
  if (totalViolations > 0) {
    console.log(chalk.bold.red(`\n❌ ${totalViolations} VIOLATIONS FOUND:\n`));

    // Group violations by type
    const byType = {};
    allViolations.forEach(v => {
      if (!byType[v.type]) byType[v.type] = [];
      byType[v.type].push(v);
    });

    Object.entries(byType).forEach(_([type, _violations]) => {
      console.log(chalk.bold.red(`\n${type} (${violations.length}):\n`));
      violations.forEach(v => console.log(formatViolation(v)));
    });
  }

  if (totalWarnings > 0) {
    console.log(chalk.bold.yellow(`\n⚠️  ${totalWarnings} WARNINGS:\n`));
    allWarnings.forEach(w => console.log(formatWarning(w)));
  }

  // Summary
  console.log(chalk.bold.blue('\n📊 SUMMARY:\n'));
  console.log(`  Files scanned: ${chalk.cyan(files.length)}`);
  console.log(`  Violations: ${totalViolations > 0 ? chalk.red(totalViolations) : chalk.green(0)}`);
  console.log(`  Warnings: ${totalWarnings > 0 ? chalk.yellow(totalWarnings) : chalk.green(0)}`);

  if (totalViolations === 0 && totalWarnings === 0) {
    console.log(chalk.bold.green('\n✅ All files comply with Real Data Only policy!\n'));
    process.exit(0);
  } else if (totalViolations > 0) {
    console.log(chalk.bold.red('\n❌ Fix all violations before deploying to production.\n'));
    console.log(chalk.gray('Violations must be resolved. Warnings should be reviewed.\n'));
    process.exit(1);
  } else {
    console.log(chalk.bold.yellow('\n⚠️  Review warnings and ensure real data is being used.\n'));
    process.exit(0);
  }
}

// ==================== ERROR HANDLING ====================

process.on('unhandledRejection', (error) => {
  console.error(chalk.red('\n❌ Validation script error:'), error);
  process.exit(1);
});

// ==================== RUN VALIDATION ====================

main().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error);
  process.exit(1);
});