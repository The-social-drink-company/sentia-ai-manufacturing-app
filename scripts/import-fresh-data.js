#!/usr/bin/env node

/**
 * Fresh Data Import Script
 * Triggers immediate data import from all configured external systems
 */

import { PrismaClient } from '@prisma/client';
import { logInfo, logError } from '../services/observability/structuredLogger.js';
import { dataSyncScheduler } from '../services/scheduler/data-sync-scheduler.js';
import { userSyncService } from '../services/auth/user-sync-service.js';

const prisma = new PrismaClient();

class FreshDataImporter {
  constructor() {
    this.importResults = {
      startTime: new Date(),
      endTime: null,
      success: false,
      imports: {},
      errors: [],
      summary: {}
    };
  }

  async importAllFreshData() {
    console.log('=========================================');
    console.log('FRESH DATA IMPORT FROM EXTERNAL SYSTEMS');
    console.log('=========================================\n');

    try {
      logInfo('Starting fresh data import from all external systems');

      // Initialize systems if needed
      await this.initializeSystems();

      // Import users from Clerk
      await this.importUsers();

      // Import data from all external APIs
      await this.importExternalData();

      // Generate summary
      this.importResults.endTime = new Date();
      this.importResults.success = true;

      await this.generateImportReport();

      console.log('\n🎉 FRESH DATA IMPORT COMPLETED SUCCESSFULLY! 🎉');

    } catch (error) {
      this.importResults.endTime = new Date();
      this.importResults.success = false;
      this.importResults.errors.push(error.message);

      logError('Fresh data import failed', error);
      console.log(`\n💥 IMPORT FAILED: ${error.message}`);
      
      await this.generateImportReport();
      process.exit(1);
    }
  }

  async initializeSystems() {
    console.log('1. INITIALIZING IMPORT SYSTEMS');
    console.log('=====================================');

    try {
      // Initialize data sync scheduler
      console.log('  Initializing data sync scheduler...');
      await dataSyncScheduler.initialize();
      console.log('  ✅ Data sync scheduler ready');

      // Connect to database
      console.log('  Connecting to database...');
      await prisma.$connect();
      console.log('  ✅ Database connected');

    } catch (error) {
      console.log(`  ❌ System initialization failed: ${error.message}`);
      throw error;
    }

    console.log('');
  }

  async importUsers() {
    console.log('2. IMPORTING USERS FROM CLERK');
    console.log('=====================================');

    try {
      const syncResult = await userSyncService.syncAllUsers();

      if (syncResult.success) {
        console.log(`  ✅ User sync completed successfully`);
        console.log(`     Users created: ${syncResult.created || 0}`);
        console.log(`     Users updated: ${syncResult.updated || 0}`);
        console.log(`     Users skipped: ${syncResult.skipped || 0}`);

        this.importResults.imports.users = {
          success: true,
          created: syncResult.created || 0,
          updated: syncResult.updated || 0,
          skipped: syncResult.skipped || 0,
          timestamp: syncResult.timestamp
        };
      } else {
        throw new Error(`User sync failed: ${syncResult.error}`);
      }

    } catch (error) {
      console.log(`  ❌ User import failed: ${error.message}`);
      this.importResults.imports.users = {
        success: false,
        error: error.message
      };
      this.importResults.errors.push(`User import: ${error.message}`);
    }

    console.log('');
  }

  async importExternalData() {
    console.log('3. IMPORTING DATA FROM EXTERNAL APIS');
    console.log('=====================================');

    const sources = ['amazon', 'shopify', 'unleashed', 'xero'];
    
    for (const source of sources) {
      await this.importFromSource(source);
    }
  }

  async importFromSource(source) {
    console.log(`  Importing from ${source.toUpperCase()}...`);

    try {
      const startTime = Date.now();
      const syncResult = await dataSyncScheduler.triggerManualSync(source);
      const duration = Date.now() - startTime;

      if (Array.isArray(syncResult)) {
        // Handle Promise.allSettled results
        const result = syncResult[0]; // Get first result for this source
        
        if (result.status === 'fulfilled' && result.value.success) {
          console.log(`  ✅ ${source} import completed (${duration}ms)`);
          
          this.importResults.imports[source] = {
            success: true,
            duration,
            ...result.value
          };
        } else {
          throw new Error(result.reason?.message || 'Import failed');
        }
      } else if (syncResult && syncResult.success) {
        console.log(`  ✅ ${source} import completed (${duration}ms)`);
        console.log(`     Records processed: ${syncResult.recordsProcessed || 0}`);

        this.importResults.imports[source] = {
          success: true,
          duration,
          recordsProcessed: syncResult.recordsProcessed || 0,
          ...syncResult
        };
      } else {
        throw new Error(syncResult?.error || 'Unknown import error');
      }

    } catch (error) {
      console.log(`  ⚠️  ${source} import failed: ${error.message}`);
      
      this.importResults.imports[source] = {
        success: false,
        error: error.message
      };
      
      // Don't fail entire import for individual source failures
      this.importResults.errors.push(`${source} import: ${error.message}`);
    }
  }

  async generateImportReport() {
    const duration = this.importResults.endTime.getTime() - this.importResults.startTime.getTime();
    
    // Calculate summary statistics
    const totalImports = Object.keys(this.importResults.imports).length;
    const successfulImports = Object.values(this.importResults.imports).filter(i => i.success).length;
    const failedImports = totalImports - successfulImports;
    
    const totalRecords = Object.values(this.importResults.imports)
      .filter(i => i.success && i.recordsProcessed)
      .reduce((sum, i) => sum + (i.recordsProcessed || 0), 0);

    const totalUsers = this.importResults.imports.users?.success ? 
      (this.importResults.imports.users.created || 0) + (this.importResults.imports.users.updated || 0) : 0;

    this.importResults.summary = {
      duration,
      totalImports,
      successfulImports,
      failedImports,
      totalRecords,
      totalUsers,
      successRate: totalImports > 0 ? `${successfulImports}/${totalImports}` : '0/0'
    };

    console.log('\n=========================================');
    console.log('DATA IMPORT SUMMARY REPORT');
    console.log('=========================================');
    console.log(`Started: ${this.importResults.startTime.toISOString()}`);
    console.log(`Completed: ${this.importResults.endTime.toISOString()}`);
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    console.log(`Overall Success: ${this.importResults.success ? 'YES' : 'NO'}`);
    console.log(`Import Sources: ${successfulImports}/${totalImports} successful`);
    console.log(`Total Records Imported: ${totalRecords}`);
    console.log(`Total Users Synced: ${totalUsers}`);
    console.log(`Errors: ${this.importResults.errors.length}`);

    console.log('\nIMPORT BREAKDOWN:');
    Object.entries(this.importResults.imports).forEach(([source, result]) => {
      if (result.success) {
        const records = result.recordsProcessed || result.created || result.updated || 0;
        console.log(`  ✅ ${source.toUpperCase()}: ${records} records`);
      } else {
        console.log(`  ❌ ${source.toUpperCase()}: Failed - ${result.error}`);
      }
    });

    if (this.importResults.errors.length > 0) {
      console.log('\nERRORS:');
      this.importResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('\nDATA SOURCES STATUS:');
    console.log('  📊 Amazon SP-API: Orders and inventory data');
    console.log('  🛍️  Shopify: E-commerce sales and product data');
    console.log('  📦 Unleashed ERP: Inventory and product management');
    console.log('  💰 Xero: Financial and accounting data');
    console.log('  👥 Clerk: User authentication and profiles');

    console.log('\nNEXT STEPS:');
    if (this.importResults.success) {
      console.log('  1. ✅ Fresh data successfully imported from external systems');
      console.log('  2. 📊 Data is now available in the dashboard');
      console.log('  3. 🔄 Automated sync schedules will keep data current');
      console.log('  4. 🔍 Monitor data quality and sync performance');
    } else {
      console.log('  1. ❌ Review import errors and fix configuration issues');
      console.log('  2. 🔧 Check API credentials and network connectivity');
      console.log('  3. 🔄 Re-run import after resolving issues');
    }

    // Write detailed report to file
    const fs = await import('fs/promises');
    const reportPath = './fresh-data-import-report.json';
    await fs.writeFile(reportPath, JSON.stringify(this.importResults, null, 2));
    console.log(`\n📄 Detailed import report saved to: ${reportPath}`);

    // Update database with import statistics if possible
    try {
      await this.recordImportStatistics();
    } catch (error) {
      console.log(`⚠️  Could not record import statistics: ${error.message}`);
    }
  }

  async recordImportStatistics() {
    try {
      // Record import job in database if data_imports table exists
      await prisma.data_imports?.create({
        data: {
          source: 'fresh_data_import_all',
          status: this.importResults.success ? 'completed' : 'failed',
          records_processed: this.importResults.summary.totalRecords || 0,
          duration_ms: this.importResults.summary.duration || 0,
          error_message: this.importResults.errors.length > 0 ? 
            this.importResults.errors.join('; ') : null,
          metadata: this.importResults,
          started_at: this.importResults.startTime,
          completed_at: this.importResults.endTime,
          created_by: 'fresh_data_import_script'
        }
      });

      logInfo('Import statistics recorded in database');
    } catch (error) {
      // Ignore if table doesn't exist
      logInfo('Could not record import statistics - table may not exist');
    }
  }
}

// Command line options
const args = process.argv.slice(2);
const helpFlag = args.includes('--help') || args.includes('-h');

if (helpFlag) {
  console.log(`
Fresh Data Import Script
========================

Imports fresh data from all configured external systems:
- Clerk: User authentication and profiles
- Amazon SP-API: Orders and inventory  
- Shopify: E-commerce sales and products
- Unleashed ERP: Inventory management
- Xero: Financial and accounting data

Usage:
  node scripts/import-fresh-data.js

Options:
  --help, -h    Show this help message

The script will:
1. Initialize all import systems
2. Sync users from Clerk to database
3. Import data from all configured external APIs
4. Generate detailed import report
5. Record import statistics

All imports are performed in parallel where possible for optimal performance.
`);
  process.exit(0);
}

// Run the import
const importer = new FreshDataImporter();
importer.importAllFreshData().catch(error => {
  console.error('Fatal import error:', error);
  process.exit(1);
});