#!/usr/bin/env node

/**
 * Simple Continuous Monitoring Script for Sentia Dashboard
 * Checks all URLs every 2 minutes and reports status
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

const URLS = [
  { name: 'Railway Prod', url: 'https://sentia-manufacturing-dashboard-production.up.railway.app' },
  { name: 'Railway Dev', url: 'https://sentia-manufacturing-dashboard-development.up.railway.app' },
  { name: 'Railway Test', url: 'https://sentiatest.financeflo.ai' },
  { name: 'Prod Alias', url: 'https://sentiaprod.financeflo.ai' },
  { name: 'Deploy Alias', url: 'https://sentiadeploy.financeflo.ai' },
  { name: 'Local:3000', url: 'http://localhost:3000' },
  { name: 'Local:3001', url: 'http://localhost:3001' },
  { name: 'Local:3002', url: 'http://localhost:3002' },
  { name: 'Local:3003', url: 'http://localhost:3003' }
];

const PHASE4_FEATURES = [
  'PredictiveMaintenanceWidget',
  'SmartInventoryWidget',
  'Predictive Maintenance',
  'Smart Inventory'
];

class SimpleMonitor {
  constructor() {
    this.checkCount = 0;
    this.results = {};
    this.startTime = new Date();
    console.log('\n========================================');
    console.log('SENTIA DASHBOARD CONTINUOUS MONITORING');
    console.log('Phase 4 Deployment Verification System');
    console.log('========================================\n');
  }

  async checkUrl(urlConfig) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const result = {
        name: urlConfig.name,
        url: urlConfig.url,
        status: 'checking',
        httpCode: null,
        features: [],
        responseTime: 0,
        error: null
      };

      const module = urlConfig.url.startsWith('https') ? https : http;
      
      const req = module.get(urlConfig.url, { timeout: 10000 }, (res) => {
        let data = '';
        
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          result.httpCode = res.statusCode;
          result.responseTime = Date.now() - startTime;
          
          // Check for Phase 4 features
          result.features = PHASE4_FEATURES.filter(feature => 
            data.includes(feature)
          );
          
          // Determine status
          if (res.statusCode === 200) {
            if (result.features.length >= 2) {
              result.status = 'PHASE4_OK';
            } else if (result.features.length > 0) {
              result.status = 'PARTIAL';
            } else {
              result.status = 'NO_PHASE4';
            }
          } else {
            result.status = 'HTTP_ERROR';
          }
          
          resolve(result);
        });
      });
      
      req.on('error', (err) => {
        result.status = 'OFFLINE';
        result.error = err.message;
        result.responseTime = Date.now() - startTime;
        resolve(result);
      });
      
      req.on('timeout', () => {
        req.destroy();
        result.status = 'TIMEOUT';
        result.responseTime = Date.now() - startTime;
        resolve(result);
      });
    });
  }

  async performCheck() {
    this.checkCount++;
    const timestamp = new Date().toISOString();
    
    console.log(`\n[CHECK #${this.checkCount}] ${timestamp}`);
    console.log('================================================');
    
    let allPhase4Ready = true;
    let onlineCount = 0;
    let phase4Count = 0;
    
    for (const urlConfig of URLS) {
      const result = await this.checkUrl(urlConfig);
      this.results[urlConfig.name] = result;
      
      // Status icon
      let icon = '❌';
      let color = '\x1b[31m'; // red
      
      if (result.status === 'PHASE4_OK') {
        icon = '✅';
        color = '\x1b[32m'; // green
        phase4Count++;
        onlineCount++;
      } else if (result.status === 'PARTIAL') {
        icon = '⚠️ ';
        color = '\x1b[33m'; // yellow
        allPhase4Ready = false;
        onlineCount++;
      } else if (result.status === 'NO_PHASE4') {
        icon = '🔄';
        color = '\x1b[36m'; // cyan
        allPhase4Ready = false;
        onlineCount++;
      } else if (result.status === 'OFFLINE') {
        icon = '⭕';
        color = '\x1b[90m'; // gray
        allPhase4Ready = false;
      } else {
        allPhase4Ready = false;
      }
      
      console.log(`${icon} ${color}${result.name.padEnd(15)}\x1b[0m: ${result.status.padEnd(12)} | Features: ${result.features.length}/4 | ${result.responseTime}ms`);
    }
    
    // Summary
    console.log('\n--- SUMMARY ---');
    console.log(`Online: ${onlineCount}/${URLS.length} | Phase 4 Ready: ${phase4Count}/${URLS.length}`);
    
    if (allPhase4Ready) {
      console.log('\n🎉 SUCCESS! All systems showing Phase 4 features!');
    } else {
      console.log('\n⏳ Waiting for Phase 4 deployment to complete...');
      console.log('   Railway typically takes 3-5 minutes to deploy');
    }
    
    // Save results to file
    const logEntry = {
      check: this.checkCount,
      timestamp,
      results: this.results,
      summary: {
        online: onlineCount,
        phase4Ready: phase4Count,
        total: URLS.length
      }
    };
    
    fs.appendFileSync('monitoring-results.jsonl', JSON.stringify(logEntry) + '\n');
  }

  async start() {
    console.log('Starting continuous monitoring...');
    console.log('Checking every 2 minutes for Phase 4 features\n');
    
    // Initial check
    await this.performCheck();
    
    // Schedule regular checks
    this.interval = setInterval(async () => {
      await this.performCheck();
    }, 2 * 60 * 1000); // 2 minutes
    
    // Handle shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  stop() {
    console.log('\n\nStopping monitoring...');
    if (this.interval) {
      clearInterval(this.interval);
    }
    
    const runtime = Math.floor((Date.now() - this.startTime) / 1000);
    console.log(`Total runtime: ${runtime}s | Checks performed: ${this.checkCount}`);
    process.exit(0);
  }
}

// Start monitoring
const monitor = new SimpleMonitor();
monitor.start();