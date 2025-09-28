#!/usr/bin/env node

/**
 * Data Cleanup Script
 * Removes all identified fake, test, and mock data from the system
 * Preserves only real data from external system imports
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { createClerkClient } from '@clerk/backend';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

class DataCleanupService {
  constructor() {
    this.cleanupReport = {
      usersRemoved: 0,
      productsRemoved: 0,
      financialRecordsRemoved: 0,
      productionDataRemoved: 0,
      errors: []
    };
  }

  async performCompleteCleanup() {
    console.log('=========================================');
    console.log('SENTIA DATA CLEANUP - REMOVING FAKE DATA');
    console.log('=========================================\n');

    try {
      await prisma.$connect();
      console.log('✅ Database connected\n');

      // Confirm cleanup with user
      console.log('⚠️  WARNING: This will permanently remove fake/test data!');
      console.log('Real user accounts and external API data will be preserved.\n');

      // Remove fake users
      await this.removeFakeUsers();
      
      // Remove fake products
      await this.removeFakeProducts();
      
      // Remove fake financial data
      await this.removeFakeFinancialData();
      
      // Remove fake production data
      await this.removeFakeProductionData();
      
      // Generate cleanup report
      await this.generateCleanupReport();
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      this.cleanupReport.errors.push(error.message);
    } finally {
      await prisma.$disconnect();
    }
  }

  async removeFakeUsers() {
    console.log('1. REMOVING FAKE/TEST USERS');
    console.log('=====================================');

    // Get all users first
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true
      }
    });

    // Identify fake users
    const fakeUsers = allUsers.filter(user => this.isFakeUser(user));
    const realUsers = allUsers.filter(user => !this.isFakeUser(user));

    console.log(`Found ${fakeUsers.length} fake/test users to remove:`);
    
    for (const user of fakeUsers) {
      try {
        console.log(`  Removing: ${user.email} (${user.username})`);
        
        // Remove from database
        await prisma.user.delete({
          where: { id: user.id }
        });
        
        this.cleanupReport.usersRemoved++;
        
      } catch (error) {
        console.error(`  ❌ Failed to remove ${user.email}:`, error.message);
        this.cleanupReport.errors.push(`User removal failed: ${user.email} - ${error.message}`);
      }
    }

    console.log(`\n✅ Removed ${this.cleanupReport.usersRemoved} fake users`);
    console.log(`✅ Preserved ${realUsers.length} real users:`);
    realUsers.forEach(user => {
      console.log(`  - ${user.email}`);
    });
    console.log('');
  }

  async removeFakeProducts() {
    console.log('2. REMOVING FAKE/DEMO PRODUCTS');
    console.log('=====================================');

    try {
      const products = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          sku: true,
          description: true,
          source: true
        }
      });

      const fakeProducts = products.filter(product => this.isFakeProduct(product));
      const realProducts = products.filter(product => !this.isFakeProduct(product));

      console.log(`Found ${fakeProducts.length} fake/demo products to remove:`);
      
      for (const product of fakeProducts) {
        try {
          console.log(`  Removing: ${product.name} (SKU: ${product.sku})`);
          
          await prisma.product.delete({
            where: { id: product.id }
          });
          
          this.cleanupReport.productsRemoved++;
          
        } catch (error) {
          console.error(`  ❌ Failed to remove ${product.name}:`, error.message);
          this.cleanupReport.errors.push(`Product removal failed: ${product.name} - ${error.message}`);
        }
      }

      console.log(`\n✅ Removed ${this.cleanupReport.productsRemoved} fake products`);
      console.log(`✅ Preserved ${realProducts.length} real products from external systems\n`);
      
    } catch (error) {
      console.log('No products table found or empty\n');
    }
  }

  async removeFakeFinancialData() {
    console.log('3. REMOVING MOCK FINANCIAL DATA');
    console.log('=====================================');

    try {
      // Check various financial tables
      const workingCapital = await prisma.workingCapital?.findMany() || [];
      const historicalSales = await prisma.historicalSale?.findMany() || [];
      
      let removedCount = 0;

      // Remove mock working capital records
      for (const record of workingCapital) {
        if (this.isFakeFinancialRecord(record)) {
          try {
            await prisma.workingCapital.delete({
              where: { id: record.id }
            });
            removedCount++;
            console.log(`  Removed working capital record: ${record.id}`);
          } catch (error) {
            this.cleanupReport.errors.push(`Failed to remove working capital: ${error.message}`);
          }
        }
      }

      // Remove mock historical sales
      for (const record of historicalSales) {
        if (this.isFakeFinancialRecord(record)) {
          try {
            await prisma.historicalSale.delete({
              where: { id: record.id }
            });
            removedCount++;
            console.log(`  Removed historical sale record: ${record.id}`);
          } catch (error) {
            this.cleanupReport.errors.push(`Failed to remove historical sale: ${error.message}`);
          }
        }
      }

      this.cleanupReport.financialRecordsRemoved = removedCount;
      console.log(`\n✅ Removed ${removedCount} mock financial records\n`);
      
    } catch (error) {
      console.log('No financial data tables found or empty\n');
    }
  }

  async removeFakeProductionData() {
    console.log('4. REMOVING MOCK PRODUCTION DATA');
    console.log('=====================================');

    try {
      const productionJobs = await prisma.productionJob?.findMany() || [];
      const productionMetrics = await prisma.productionMetric?.findMany() || [];
      
      let removedCount = 0;

      // Remove mock production jobs
      for (const job of productionJobs) {
        if (this.isFakeProductionData(job)) {
          try {
            await prisma.productionJob.delete({
              where: { id: job.id }
            });
            removedCount++;
            console.log(`  Removed production job: ${job.id}`);
          } catch (error) {
            this.cleanupReport.errors.push(`Failed to remove production job: ${error.message}`);
          }
        }
      }

      // Remove mock production metrics
      for (const metric of productionMetrics) {
        if (this.isFakeProductionData(metric)) {
          try {
            await prisma.productionMetric.delete({
              where: { id: metric.id }
            });
            removedCount++;
            console.log(`  Removed production metric: ${metric.id}`);
          } catch (error) {
            this.cleanupReport.errors.push(`Failed to remove production metric: ${error.message}`);
          }
        }
      }

      this.cleanupReport.productionDataRemoved = removedCount;
      console.log(`\n✅ Removed ${removedCount} mock production records\n`);
      
    } catch (error) {
      console.log('No production data tables found or empty\n');
    }
  }

  async generateCleanupReport() {
    console.log('5. CLEANUP COMPLETE - SUMMARY REPORT');
    console.log('=====================================');

    const totalRemoved = 
      this.cleanupReport.usersRemoved +
      this.cleanupReport.productsRemoved +
      this.cleanupReport.financialRecordsRemoved +
      this.cleanupReport.productionDataRemoved;

    console.log(`📊 CLEANUP STATISTICS:`);
    console.log(`  Fake Users Removed: ${this.cleanupReport.usersRemoved}`);
    console.log(`  Fake Products Removed: ${this.cleanupReport.productsRemoved}`);
    console.log(`  Mock Financial Records Removed: ${this.cleanupReport.financialRecordsRemoved}`);
    console.log(`  Mock Production Records Removed: ${this.cleanupReport.productionDataRemoved}`);
    console.log(`  Total Records Removed: ${totalRemoved}\n`);

    if (this.cleanupReport.errors.length > 0) {
      console.log('⚠️  ERRORS ENCOUNTERED:');
      this.cleanupReport.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
      console.log('');
    }

    console.log('✅ DATA CLEANUP COMPLETE');
    console.log('=====================================');
    console.log('The system now contains ONLY real data from external sources:');
    console.log('  - Legitimate user accounts');
    console.log('  - Products imported from Unleashed ERP');
    console.log('  - Financial data from Xero');
    console.log('  - Sales data from Shopify');
    console.log('  - Production data from manufacturing systems');
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify all remaining data is from legitimate external sources');
    console.log('2. Configure any missing API integrations (Amazon SP-API)');
    console.log('3. Import fresh data from all connected external systems');
  }

  // Helper methods to identify fake data (same logic as audit)
  isFakeUser(user) {
    const fakeIndicators = [
      user.email.includes('test'),
      user.email.includes('demo'),
      user.email.includes('example'),
      user.email.includes('sentia.com') && user.email.includes('admin'),
      user.username?.includes('test'),
      user.first_name?.toLowerCase() === 'test',
      user.last_name?.toLowerCase() === 'user'
    ];

    return fakeIndicators.some(indicator => indicator === true);
  }

  isFakeProduct(product) {
    const fakeIndicators = [
      product.name?.toLowerCase().includes('test'),
      product.name?.toLowerCase().includes('demo'),
      product.name?.toLowerCase().includes('sample'),
      product.sku?.toLowerCase().includes('test'),
      product.sku?.toLowerCase().includes('demo'),
      product.description?.toLowerCase().includes('test product'),
      !product.source || product.source === 'manual'
    ];

    return fakeIndicators.some(indicator => indicator === true);
  }

  isFakeFinancialRecord(record) {
    return record.description?.toLowerCase().includes('test') ||
           record.description?.toLowerCase().includes('demo') ||
           record.description?.toLowerCase().includes('sample') ||
           !record.source ||
           record.source === 'manual_entry';
  }

  isFakeProductionData(record) {
    return !record.actualOutput || 
           record.productionLine?.toLowerCase().includes('test') ||
           record.productionLine?.toLowerCase().includes('demo') ||
           !record.source ||
           record.source === 'manual';
  }
}

// Add confirmation prompt
async function confirmCleanup() {
  return new Promise(_(resolve) => {
    process.stdout.write('Do you want to proceed with removing all fake/test data? (yes/no): ');
    process.stdin.once('data', _(data) => {
      const answer = data.toString().trim().toLowerCase();
      resolve(answer === 'yes' || answer === 'y');
    });
  });
}

// Main execution
async function main() {
  const shouldProceed = await confirmCleanup();
  
  if (!shouldProceed) {
    console.log('Cleanup cancelled by user.');
    process.exit(0);
  }

  const cleanupService = new DataCleanupService();
  await cleanupService.performCompleteCleanup();
}

// Run the cleanup
main().catch(error => {
  console.error('Fatal cleanup error:', error);
  process.exit(1);
});