#!/usr/bin/env node

/**
 * Enterprise Automated Testing Infrastructure
 * Comprehensive test execution with parallel processing and reporting
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import { performance } from 'perf_hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AutomatedTestRunner {
  constructor(options = {}) {
    this.options = {
      parallel: options.parallel ?? true,
      maxWorkers: options.maxWorkers ?? 4,
      bail: options.bail ?? false,
      verbose: options.verbose ?? false,
      coverage: options.coverage ?? true,
      report: options.report ?? true,
      watch: options.watch ?? false,
      updateSnapshots: options.updateSnapshots ?? false,
      ...options
    };

    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      suites: []
    };

    this.testSuites = [
      {
        name: 'Unit Tests',
        command: 'npm run test:unit',
        pattern: 'tests/unit/**/*.test.{js,jsx,ts,tsx}',
        timeout: 60000,
        critical: true
      },
      {
        name: 'Integration Tests',
        command: 'npm run test:integration',
        pattern: 'tests/integration/**/*.test.{js,jsx,ts,tsx}',
        timeout: 120000,
        critical: true
      },
      {
        name: 'Component Tests',
        command: 'npm run test:components',
        pattern: 'src/components/**/*.test.{js,jsx,ts,tsx}',
        timeout: 60000,
        critical: false
      },
      {
        name: 'API Tests',
        command: 'npm run test:api',
        pattern: 'tests/api/**/*.test.{js,jsx,ts,tsx}',
        timeout: 90000,
        critical: true
      },
      {
        name: 'Security Tests',
        command: 'npm run test:security',
        pattern: 'tests/security/**/*.test.{js,jsx,ts,tsx}',
        timeout: 60000,
        critical: true
      },
      {
        name: 'Performance Tests',
        command: 'npm run test:performance',
        pattern: 'tests/performance/**/*.test.{js,jsx,ts,tsx}',
        timeout: 180000,
        critical: false
      },
      {
        name: 'E2E Tests',
        command: 'npm run test:e2e',
        pattern: 'tests/e2e/**/*.spec.{js,ts}',
        timeout: 300000,
        critical: true
      }
    ];
  }

  /**
   * Run all test suites
   */
  async run() {
    console.log(chalk.bold.blue('\n🧪 Enterprise Automated Test Suite\n'));

    const startTime = performance.now();

    try {
      // Pre-test setup
      await this.setupTestEnvironment();

      // Run test suites
      if (this.options.parallel) {
        await this.runParallel();
      } else {
        await this.runSequential();
      }

      // Generate reports
      if (this.options.report) {
        await this.generateReports();
      }

      // Check coverage
      if (this.options.coverage) {
        await this.checkCoverage();
      }

      this.results.duration = performance.now() - startTime;

      // Display summary
      this.displaySummary();

      // Cleanup
      await this.cleanup();

      return this.results.failed === 0;

    } catch (error) {
      console.error(chalk.red('\n❌ Test execution failed:'), error);
      return false;
    }
  }

  /**
   * Setup test environment
   */
  async setupTestEnvironment() {
    const spinner = ora('Setting up test environment...').start();

    try {
      // Ensure test directories exist
      await fs.mkdir(path.join(__dirname, 'reports'), { recursive: true });
      await fs.mkdir(path.join(__dirname, 'coverage'), { recursive: true });

      // Start test database if needed
      if (this.requiresDatabase()) {
        await this.startTestDatabase();
      }

      // Clear previous test artifacts
      await this.clearTestArtifacts();

      // Set environment variables
      process.env.NODE_ENV = 'test';
      process.env.CI = 'true';

      spinner.succeed('Test environment ready');
    } catch (error) {
      spinner.fail('Failed to setup test environment');
      throw error;
    }
  }

  /**
   * Run tests in parallel
   */
  async runParallel() {
    console.log(chalk.cyan(`Running tests in parallel (max ${this.options.maxWorkers} workers)\n`));

    const chunks = this.chunkSuites(this.testSuites, this.options.maxWorkers);
    const promises = [];

    for (const chunk of chunks) {
      const chunkPromise = Promise.all(
        chunk.map(suite => this.runTestSuite(suite))
      );
      promises.push(chunkPromise);
    }

    const results = await Promise.all(promises);
    this.results.suites = results.flat();
  }

  /**
   * Run tests sequentially
   */
  async runSequential() {
    console.log(chalk.cyan('Running tests sequentially\n'));

    for (const suite of this.testSuites) {
      const result = await this.runTestSuite(suite);
      this.results.suites.push(result);

      if (this.options.bail && result.failed > 0 && suite.critical) {
        console.log(chalk.yellow('\n⚠️  Bailing due to critical test failure'));
        break;
      }
    }
  }

  /**
   * Run individual test suite
   */
  async runTestSuite(suite) {
    const spinner = ora(`Running ${suite.name}...`).start();
    const startTime = performance.now();

    const result = {
      name: suite.name,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      errors: []
    };

    try {
      const output = await this.executeCommand(suite.command, suite.timeout);

      // Parse test results
      const parsed = this.parseTestOutput(output);
      result.passed = parsed.passed;
      result.failed = parsed.failed;
      result.skipped = parsed.skipped;
      result.errors = parsed.errors;

      this.results.total += parsed.total;
      this.results.passed += parsed.passed;
      this.results.failed += parsed.failed;
      this.results.skipped += parsed.skipped;

      if (result.failed > 0) {
        spinner.fail(`${suite.name}: ${result.failed} failed`);

        if (this.options.verbose && result.errors.length > 0) {
          console.log(chalk.red('\nFailures:'));
          result.errors.forEach(error => {
            console.log(chalk.red(`  - ${error}`));
          });
        }
      } else {
        spinner.succeed(`${suite.name}: ${result.passed} passed`);
      }

    } catch (error) {
      spinner.fail(`${suite.name}: Error`);
      result.failed = 1;
      result.errors.push(error.message);
      this.results.failed += 1;
    }

    result.duration = performance.now() - startTime;
    return result;
  }

  /**
   * Execute shell command
   */
  executeCommand(command, timeout) {
    return new Promise(_(resolve, _reject) => {
      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, {
        shell: true,
        env: { ...process.env },
        timeout
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on(_'data', (data) => {
        stdout += data.toString();
        if (this.options.verbose) {
          process.stdout.write(data);
        }
      });

      child.stderr.on(_'data', (data) => {
        stderr += data.toString();
        if (this.options.verbose) {
          process.stderr.write(data);
        }
      });

      child.on(_'close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `Command failed with code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  /**
   * Parse test output
   */
  parseTestOutput(output) {
    const result = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    // Parse Jest/Vitest format
    const summaryMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+failed,\s+(\d+)\s+skipped,\s+(\d+)\s+total/);
    if (summaryMatch) {
      result.passed = parseInt(summaryMatch[1]);
      result.failed = parseInt(summaryMatch[2]);
      result.skipped = parseInt(summaryMatch[3]);
      result.total = parseInt(summaryMatch[4]);
    }

    // Parse Mocha format
    const mochaMatch = output.match(/(\d+)\s+passing.*(\d+)\s+failing/);
    if (mochaMatch) {
      result.passed = parseInt(mochaMatch[1]);
      result.failed = parseInt(mochaMatch[2]);
      result.total = result.passed + result.failed;
    }

    // Extract error messages
    const errorMatches = output.match(/✕.*$/gm);
    if (errorMatches) {
      result.errors = errorMatches.map(e => e.replace(/✕\s*/, ''));
    }

    return result;
  }

  /**
   * Generate test reports
   */
  async generateReports() {
    const spinner = ora('Generating test reports...').start();

    try {
      // Generate JSON report
      const jsonReport = {
        timestamp: new Date().toISOString(),
        duration: this.results.duration,
        summary: {
          total: this.results.total,
          passed: this.results.passed,
          failed: this.results.failed,
          skipped: this.results.skipped,
          passRate: ((this.results.passed / this.results.total) * 100).toFixed(2)
        },
        suites: this.results.suites
      };

      await fs.writeFile(
        path.join(__dirname, 'reports', 'test-results.json'),
        JSON.stringify(jsonReport, null, 2)
      );

      // Generate HTML report
      const htmlReport = this.generateHTMLReport(jsonReport);
      await fs.writeFile(
        path.join(__dirname, 'reports', 'test-results.html'),
        htmlReport
      );

      // Generate JUnit XML for CI
      const junitReport = this.generateJUnitXML(jsonReport);
      await fs.writeFile(
        path.join(__dirname, 'reports', 'junit.xml'),
        junitReport
      );

      spinner.succeed('Test reports generated');
    } catch (error) {
      spinner.fail('Failed to generate reports');
      throw error;
    }
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(data) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Test Results - ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f0f0f0; padding: 15px; border-radius: 5px; }
    .passed { color: green; }
    .failed { color: red; }
    .skipped { color: orange; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f4f4f4; }
  </style>
</head>
<body>
  <h1>Test Results</h1>
  <div class="summary">
    <h2>Summary</h2>
    <p>Total: ${data.summary.total}</p>
    <p class="passed">Passed: ${data.summary.passed}</p>
    <p class="failed">Failed: ${data.summary.failed}</p>
    <p class="skipped">Skipped: ${data.summary.skipped}</p>
    <p>Pass Rate: ${data.summary.passRate}%</p>
    <p>Duration: ${(data.duration / 1000).toFixed(2)}s</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Suite</th>
        <th>Passed</th>
        <th>Failed</th>
        <th>Skipped</th>
        <th>Duration</th>
      </tr>
    </thead>
    <tbody>
      ${data.suites.map(suite => `
        <tr>
          <td>${suite.name}</td>
          <td class="passed">${suite.passed}</td>
          <td class="failed">${suite.failed}</td>
          <td class="skipped">${suite.skipped}</td>
          <td>${(suite.duration / 1000).toFixed(2)}s</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;
  }

  /**
   * Generate JUnit XML
   */
  generateJUnitXML(data) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Automated Test Suite" tests="${data.summary.total}" failures="${data.summary.failed}" skipped="${data.summary.skipped}" time="${data.duration / 1000}">
  ${data.suites.map(suite => `
  <testsuite name="${suite.name}" tests="${suite.passed + suite.failed}" failures="${suite.failed}" skipped="${suite.skipped}" time="${suite.duration / 1000}">
    ${suite.errors.map((error, i) => `
    <testcase name="Test ${i + 1}" classname="${suite.name}">
      <failure message="${error}"/>
    </testcase>
    `).join('')}
  </testsuite>
  `).join('')}
</testsuites>`;
  }

  /**
   * Check test coverage
   */
  async checkCoverage() {
    const spinner = ora('Checking test coverage...').start();

    try {
      const output = await this.executeCommand('npm run test:coverage -- --json', 60000);
      const coverage = JSON.parse(output);

      const summary = coverage.total;
      const threshold = 80;

      const metrics = ['statements', 'branches', 'functions', 'lines'];
      let failed = false;

      console.log('\n' + chalk.bold('Coverage Summary:'));

      for (const metric of metrics) {
        const value = summary[metric].pct;
        const color = value >= threshold ? chalk.green : chalk.red;
        console.log(`  ${metric}: ${color(value.toFixed(2) + '%')}`);

        if (value < threshold) {
          failed = true;
        }
      }

      if (failed) {
        spinner.fail(`Coverage below ${threshold}% threshold`);
        if (!this.options.allowLowCoverage) {
          throw new Error('Coverage threshold not met');
        }
      } else {
        spinner.succeed('Coverage threshold met');
      }

    } catch (error) {
      spinner.fail('Failed to check coverage');
      if (!this.options.skipCoverage) {
        throw error;
      }
    }
  }

  /**
   * Display test summary
   */
  displaySummary() {
    console.log('\n' + chalk.bold('📊 Test Summary\n'));

    const passRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    const duration = (this.results.duration / 1000).toFixed(2);

    console.log(`Total Tests: ${this.results.total}`);
    console.log(chalk.green(`✓ Passed: ${this.results.passed}`));

    if (this.results.failed > 0) {
      console.log(chalk.red(`✗ Failed: ${this.results.failed}`));
    }

    if (this.results.skipped > 0) {
      console.log(chalk.yellow(`⊘ Skipped: ${this.results.skipped}`));
    }

    console.log(`\nPass Rate: ${passRate}%`);
    console.log(`Duration: ${duration}s`);

    if (this.results.failed === 0) {
      console.log('\n' + chalk.bold.green('✅ All tests passed!'));
    } else {
      console.log('\n' + chalk.bold.red('❌ Some tests failed'));
    }
  }

  /**
   * Cleanup test environment
   */
  async cleanup() {
    const spinner = ora('Cleaning up...').start();

    try {
      // Stop test database
      if (this.testDatabase) {
        await this.stopTestDatabase();
      }

      // Clear temporary files
      await this.clearTempFiles();

      spinner.succeed('Cleanup complete');
    } catch (error) {
      spinner.fail('Cleanup failed');
      // Don't throw - cleanup errors shouldn't fail the test run
    }
  }

  /**
   * Check if tests require database
   */
  requiresDatabase() {
    return this.testSuites.some(suite =>
      suite.name.includes('Integration') ||
      suite.name.includes('API')
    );
  }

  /**
   * Start test database
   */
  async startTestDatabase() {
    // Implementation depends on your database setup
    console.log(chalk.gray('Starting test database...'));
  }

  /**
   * Stop test database
   */
  async stopTestDatabase() {
    // Implementation depends on your database setup
    console.log(chalk.gray('Stopping test database...'));
  }

  /**
   * Clear test artifacts
   */
  async clearTestArtifacts() {
    const artifacts = [
      path.join(__dirname, 'reports', '*.json'),
      path.join(__dirname, 'reports', '*.xml'),
      path.join(__dirname, 'reports', '*.html'),
      path.join(__dirname, 'coverage', '*')
    ];

    for (const pattern of artifacts) {
      try {
        const files = await fs.glob(pattern);
        for (const file of files) {
          await fs.unlink(file);
        }
      } catch {
        // Ignore errors
      }
    }
  }

  /**
   * Clear temporary files
   */
  async clearTempFiles() {
    // Clear any temporary test files
    const tempDir = path.join(__dirname, 'temp');
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }
  }

  /**
   * Chunk suites for parallel execution
   */
  chunkSuites(suites, workers) {
    const chunks = [];
    const chunkSize = Math.ceil(suites.length / workers);

    for (let i = 0; i < suites.length; i += chunkSize) {
      chunks.push(suites.slice(i, i + chunkSize));
    }

    return chunks;
  }
}

// CLI execution
if (import.meta.url === `file://${__filename}`) {
  const runner = new AutomatedTestRunner({
    parallel: !process.argv.includes('--sequential'),
    verbose: process.argv.includes('--verbose'),
    coverage: !process.argv.includes('--no-coverage'),
    report: !process.argv.includes('--no-report'),
    bail: process.argv.includes('--bail'),
    watch: process.argv.includes('--watch'),
    updateSnapshots: process.argv.includes('-u')
  });

  runner.run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export default AutomatedTestRunner;