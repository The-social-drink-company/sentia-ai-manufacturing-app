#!/usr/bin/env node

/**
 * Comprehensive System Data Audit
 * Identifies all mock, test, and fake data vs real imported data from external systems
 * Generates recommendations for data cleanup
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

class SystemDataAuditor {
  constructor() {
    this.auditResults = {
      users: { real: [], fake: [], total: 0 },
      products: { real: [], fake: [], total: 0 },
      financialData: { real: [], fake: [], total: 0 },
      productionData: { real: [], fake: [], total: 0 },
      integrationData: { real: [], fake: [], total: 0 },
      summary: {
        totalReal: 0,
        totalFake: 0,
        realDataSources: [],
        fakeDataIndicators: []
      }
    };
  }

  async auditAllSystemData() {
    console.log('=========================================');
    console.log('SENTIA SYSTEM DATA AUDIT');
    console.log('=========================================\n');

    try {
      await prisma.$connect();
      console.log('✅ Database connected\n');

      // Audit each data category
      await this.auditUsers();
      await this.auditProducts();
      await this.auditFinancialData();
      await this.auditProductionData();
      await this.auditIntegrationData();
      
      // Generate summary report
      await this.generateSummaryReport();
      
    } catch (error) {
      console.error('❌ Audit failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async auditUsers() {
    console.log('1. AUDITING USERS');
    console.log('=====================================');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        created_via_jit: true,
        sso_provider: true,
        createdAt: true,
        last_login: true,
        login_count: true
      }
    });

    this.auditResults.users.total = users.length;

    users.forEach(user => {
      const isFake = this.isFakeUser(user);
      
      if (isFake) {
        this.auditResults.users.fake.push({
          id: user.id,
          email: user.email,
          reason: this.getFakeUserReason(user)
        });
      } else {
        this.auditResults.users.real.push({
          id: user.id,
          email: user.email,
          source: this.getRealUserSource(user)
        });
      }
    });

    console.log(`Total Users: ${users.length}`);
    console.log(`Real Users: ${this.auditResults.users.real.length}`);
    console.log(`Fake/Test Users: ${this.auditResults.users.fake.length}\n`);

    if (this.auditResults.users.fake.length > 0) {
      console.log('FAKE/TEST USERS TO REMOVE:');
      this.auditResults.users.fake.forEach(user => {
        console.log(`  - ${user.email} (${user.reason})`);
      });
      console.log('');
    }

    if (this.auditResults.users.real.length > 0) {
      console.log('REAL USERS TO PRESERVE:');
      this.auditResults.users.real.forEach(user => {
        console.log(`  - ${user.email} (${user.source})`);
      });
      console.log('');
    }
  }

  async auditProducts() {
    console.log('2. AUDITING PRODUCTS');
    console.log('=====================================');

    try {
      const products = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          sku: true,
          description: true,
          source: true,
          createdAt: true,
          updatedAt: true
        }
      });

      this.auditResults.products.total = products.length;

      products.forEach(product => {
        const isFake = this.isFakeProduct(product);
        
        if (isFake) {
          this.auditResults.products.fake.push({
            id: product.id,
            name: product.name,
            sku: product.sku,
            reason: this.getFakeProductReason(product)
          });
        } else {
          this.auditResults.products.real.push({
            id: product.id,
            name: product.name,
            sku: product.sku,
            source: product.source || 'imported'
          });
        }
      });

      console.log(`Total Products: ${products.length}`);
      console.log(`Real Products: ${this.auditResults.products.real.length}`);
      console.log(`Fake/Demo Products: ${this.auditResults.products.fake.length}\n`);

    } catch (error) {
      console.log('Products table not found or empty\n');
    }
  }

  async auditFinancialData() {
    console.log('3. AUDITING FINANCIAL DATA');
    console.log('=====================================');

    try {
      // Check Working Capital records
      const workingCapital = await prisma.workingCapital.findMany({
        select: {
          id: true,
          amount: true,
          source: true,
          createdAt: true,
          description: true
        }
      });

      workingCapital.forEach(record => {
        const isFake = this.isFakeFinancialRecord(record);
        
        if (isFake) {
          this.auditResults.financialData.fake.push({
            id: record.id,
            type: 'working_capital',
            amount: record.amount,
            reason: this.getFakeFinancialReason(record)
          });
        } else {
          this.auditResults.financialData.real.push({
            id: record.id,
            type: 'working_capital',
            amount: record.amount,
            source: record.source || 'imported'
          });
        }
      });

      this.auditResults.financialData.total = workingCapital.length;

      console.log(`Total Financial Records: ${workingCapital.length}`);
      console.log(`Real Financial Data: ${this.auditResults.financialData.real.length}`);
      console.log(`Fake/Demo Financial Data: ${this.auditResults.financialData.fake.length}\n`);

    } catch (error) {
      console.log('Financial data tables not found or empty\n');
    }
  }

  async auditProductionData() {
    console.log('4. AUDITING PRODUCTION DATA');
    console.log('=====================================');

    try {
      // Check for production jobs, metrics, etc.
      const productionJobs = await prisma.productionJob?.findMany({
        select: {
          id: true,
          productionLine: true,
          status: true,
          createdAt: true,
          actualOutput: true,
          targetOutput: true
        }
      }) || [];

      productionJobs.forEach(job => {
        const isFake = this.isFakeProductionData(job);
        
        if (isFake) {
          this.auditResults.productionData.fake.push({
            id: job.id,
            type: 'production_job',
            line: job.productionLine,
            reason: 'Generated mock data'
          });
        } else {
          this.auditResults.productionData.real.push({
            id: job.id,
            type: 'production_job',
            line: job.productionLine,
            source: 'production_system'
          });
        }
      });

      this.auditResults.productionData.total = productionJobs.length;

      console.log(`Total Production Records: ${productionJobs.length}`);
      console.log(`Real Production Data: ${this.auditResults.productionData.real.length}`);
      console.log(`Fake/Demo Production Data: ${this.auditResults.productionData.fake.length}\n`);

    } catch (error) {
      console.log('Production data tables not found or empty\n');
    }
  }

  async auditIntegrationData() {
    console.log('5. AUDITING INTEGRATION DATA SOURCES');
    console.log('=====================================');

    // Check environment variables for real API keys
    const integrations = [
      { name: 'Amazon SP-API', keys: ['AMAZON_SELLER_ID', 'AMAZON_MARKETPLACE_ID', 'AMAZON_ACCESS_KEY'] },
      { name: 'Shopify', keys: ['SHOPIFY_API_KEY', 'SHOPIFY_API_SECRET', 'SHOPIFY_SHOP_NAME'] },
      { name: 'Unleashed ERP', keys: ['UNLEASHED_API_ID', 'UNLEASHED_API_KEY'] },
      { name: 'Xero Accounting', keys: ['XERO_CLIENT_ID', 'XERO_CLIENT_SECRET'] },
      { name: 'Database', keys: ['DATABASE_URL'] },
      { name: 'Clerk Auth', keys: ['CLERK_SECRET_KEY', 'VITE_CLERK_PUBLISHABLE_KEY'] }
    ];

    integrations.forEach(integration => {
      const hasValidConfig = integration.keys.some(key => 
        process.env[key] && 
        process.env[key] !== 'your_key_here' && 
        process.env[key] !== 'placeholder' &&
        process.env[key].length > 10
      );

      if (hasValidConfig) {
        this.auditResults.integrationData.real.push({
          name: integration.name,
          status: 'Configured',
          keys: integration.keys.filter(key => process.env[key])
        });
      } else {
        this.auditResults.integrationData.fake.push({
          name: integration.name,
          status: 'Not configured or using placeholder',
          keys: integration.keys
        });
      }
    });

    console.log('REAL INTEGRATION SOURCES:');
    this.auditResults.integrationData.real.forEach(integration => {
      console.log(`  ✅ ${integration.name} - ${integration.status}`);
    });

    console.log('\nMISSING/FAKE INTEGRATIONS:');
    this.auditResults.integrationData.fake.forEach(integration => {
      console.log(`  ❌ ${integration.name} - ${integration.status}`);
    });
    console.log('');
  }

  async generateSummaryReport() {
    console.log('6. DATA CLEANUP SUMMARY & RECOMMENDATIONS');
    console.log('=====================================');

    const totalFake = 
      this.auditResults.users.fake.length +
      this.auditResults.products.fake.length +
      this.auditResults.financialData.fake.length +
      this.auditResults.productionData.fake.length;

    const totalReal = 
      this.auditResults.users.real.length +
      this.auditResults.products.real.length +
      this.auditResults.financialData.real.length +
      this.auditResults.productionData.real.length;

    console.log(`📊 SUMMARY STATISTICS:`);
    console.log(`  Total Real Data Records: ${totalReal}`);
    console.log(`  Total Fake/Test Data Records: ${totalFake}`);
    console.log(`  Real Integrations Configured: ${this.auditResults.integrationData.real.length}`);
    console.log(`  Missing Integrations: ${this.auditResults.integrationData.fake.length}\n`);

    console.log('🚨 IMMEDIATE CLEANUP ACTIONS REQUIRED:');
    
    if (this.auditResults.users.fake.length > 0) {
      console.log(`  1. Remove ${this.auditResults.users.fake.length} fake/test users`);
    }
    
    if (this.auditResults.products.fake.length > 0) {
      console.log(`  2. Remove ${this.auditResults.products.fake.length} demo/sample products`);
    }
    
    if (this.auditResults.financialData.fake.length > 0) {
      console.log(`  3. Remove ${this.auditResults.financialData.fake.length} mock financial records`);
    }
    
    if (this.auditResults.productionData.fake.length > 0) {
      console.log(`  4. Remove ${this.auditResults.productionData.fake.length} mock production data`);
    }

    console.log('\n✅ REAL DATA SOURCES TO PRESERVE:');
    this.auditResults.integrationData.real.forEach(integration => {
      console.log(`  - ${integration.name}: Keep all imported data`);
    });

    if (this.auditResults.users.real.length > 0) {
      console.log(`  - ${this.auditResults.users.real.length} legitimate user accounts`);
    }

    console.log('\n🔧 NEXT STEPS:');
    console.log('  1. Run cleanup script to remove identified fake data');
    console.log('  2. Configure missing API integrations for real data import');
    console.log('  3. Import actual business data from external systems');
    console.log('  4. Verify all remaining data is from legitimate sources');

    // Write detailed report to file
    await this.writeAuditReportToFile();
  }

  async writeAuditReportToFile() {
    const reportData = {
      timestamp: new Date().toISOString(),
      auditResults: this.auditResults,
      cleanupActions: this.generateCleanupActions()
    };

    const reportPath = './data-audit-report.json';
    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Detailed audit report saved to: ${reportPath}`);
  }

  generateCleanupActions() {
    return {
      removeUsers: this.auditResults.users.fake.map(u => ({ id: u.id, email: u.email })),
      removeProducts: this.auditResults.products.fake.map(p => ({ id: p.id, name: p.name })),
      removeFinancialData: this.auditResults.financialData.fake.map(f => ({ id: f.id, type: f.type })),
      removeProductionData: this.auditResults.productionData.fake.map(p => ({ id: p.id, type: p.type }))
    };
  }

  // Helper methods to identify fake vs real data
  isFakeUser(user) {
    const fakeIndicators = [
      user.email.includes('test'),
      user.email.includes('demo'),
      user.email.includes('example'),
      user.email.includes('sentia.com') && user.email.includes('test'),
      user.username?.includes('test'),
      user.first_name?.toLowerCase() === 'test',
      user.last_name?.toLowerCase() === 'user'
    ];

    return fakeIndicators.some(indicator => indicator === true);
  }

  getFakeUserReason(user) {
    if (user.email.includes('test')) return 'Test email address';
    if (user.email.includes('example')) return 'Example email address';
    if (user.username?.includes('test')) return 'Test username';
    if (user.first_name?.toLowerCase() === 'test') return 'Test user name';
    return 'Appears to be test/demo account';
  }

  getRealUserSource(user) {
    if (user.created_via_jit) return 'JIT Provisioning';
    if (user.sso_provider) return `SSO: ${user.sso_provider}`;
    if (user.login_count > 0) return 'Active user account';
    return 'Manually created legitimate account';
  }

  isFakeProduct(product) {
    const fakeIndicators = [
      product.name?.toLowerCase().includes('test'),
      product.name?.toLowerCase().includes('demo'),
      product.name?.toLowerCase().includes('sample'),
      product.sku?.toLowerCase().includes('test'),
      product.sku?.toLowerCase().includes('demo'),
      product.description?.toLowerCase().includes('test product')
    ];

    return fakeIndicators.some(indicator => indicator === true);
  }

  getFakeProductReason(product) {
    if (product.name?.toLowerCase().includes('test')) return 'Test product name';
    if (product.name?.toLowerCase().includes('demo')) return 'Demo product';
    if (product.sku?.toLowerCase().includes('test')) return 'Test SKU';
    return 'Appears to be sample/demo product';
  }

  isFakeFinancialRecord(record) {
    return record.description?.toLowerCase().includes('test') ||
           record.description?.toLowerCase().includes('demo') ||
           !record.source ||
           record.source === 'manual_entry';
  }

  getFakeFinancialReason(record) {
    if (record.description?.toLowerCase().includes('test')) return 'Test financial record';
    if (!record.source) return 'No source tracking - likely manual entry';
    return 'Manually entered data, not from external system';
  }

  isFakeProductionData(job) {
    return !job.actualOutput || 
           job.productionLine?.toLowerCase().includes('test') ||
           job.productionLine?.toLowerCase().includes('demo');
  }
}

// Run the audit
const auditor = new SystemDataAuditor();
auditor.auditAllSystemData().catch(error => {
  console.error('Fatal audit error:', error);
  process.exit(1);
});