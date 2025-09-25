#!/usr/bin/env node
/**
 * SpecKit Validation Script: Enforce REAL DATA ONLY policy
 * Scans project files for any mock/fake/static data patterns.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  'playwright-report',
  'test-results',
  '.next',
  '.turbo'
]);

const SCAN_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.md',
  '.mdx'
]);

const PATTERNS = [
  { regex: /\bmockData\b/i, message: 'mockData identifier detected' },
  { regex: /\bfakeData\b/i, message: 'fakeData identifier detected' },
  { regex: /\bdemoData\b/i, message: 'demoData identifier detected' },
  { regex: /\bstaticData\b/i, message: 'staticData identifier detected' },
  { regex: /\bfallbackData\b/i, message: 'fallbackData identifier detected' },
  { regex: /\bdefaultData\b/i, message: 'defaultData identifier detected' },
  { regex: /\bsampleData\b/i, message: 'sampleData identifier detected' },
  { regex: /\bexampleData\b/i, message: 'exampleData identifier detected' },
  { regex: /\btestData\b/i, message: 'testData identifier detected' },
  { regex: /MOCK_/i, message: 'MOCK_ prefix detected' },
  { regex: /FAKE_/i, message: 'FAKE_ prefix detected' },
  { regex: /DEMO_/i, message: 'DEMO_ prefix detected' },
  { regex: /\bmock data\b/i, message: '"mock data" phrase detected' },
  { regex: /\bfake data\b/i, message: '"fake data" phrase detected' },
  { regex: /\bdemo mode\b/i, message: '"demo mode" phrase detected' },
  { regex: /\bfallback value\b/i, message: '"fallback value" phrase detected' }
];

/**
 * Recursively walk the project tree collecting files for inspection.
 */
function collectFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      // Still inspect .env files but skip other dot directories except .env*
      if (entry.isFile() && entry.name.startsWith('.env')) {
        const fullPath = path.join(dir, entry.name);
        files.push(fullPath);
      }
      if (entry.isDirectory() && entry.name !== '.env') {
        continue;
      }
    }

    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }
      files.push(...collectFiles(path.join(dir, entry.name)));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (SCAN_EXTENSIONS.has(ext) || entry.name.startsWith('.env')) {
        files.push(path.join(dir, entry.name));
      }
    }
  }

  return files;
}

/**
 * Scan a single file for forbidden patterns.
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    PATTERNS.forEach((rule) => {
      if (rule.regex.test(line)) {
        violations.push({
          file: filePath,
          line: index + 1,
          message: rule.message,
          snippet: line.trim().slice(0, 200)
        });
      }
      // Reset regex state just in case
      if (rule.regex.global) {
        rule.regex.lastIndex = 0;
      }
    });
  });

  return violations;
}

function main() {
  const files = collectFiles(ROOT);
  const findings = [];

  files.forEach((file) => {
    try {
      const violations = scanFile(file);
      if (violations.length > 0) {
        findings.push(...violations);
      }
    } catch (error) {
      console.error(`[speckit] Failed to scan ${file}:`, error.message);
    }
  });

  if (findings.length > 0) {
    console.error('\n[SpecKit] REAL DATA ONLY validation failed:');
    findings.forEach((violation) => {
      console.error(`- ${violation.file}:${violation.line} -> ${violation.message}`);
      console.error(`  snippet: ${violation.snippet}`);
    });
    console.error(`\nTotal violations: ${findings.length}`);
    process.exit(1);
  }

  console.log('[SpecKit] REAL DATA ONLY validation passed. No mock/fake/static data detected.');
}

main();
