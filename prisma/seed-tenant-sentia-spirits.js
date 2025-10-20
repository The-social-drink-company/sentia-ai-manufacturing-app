/**
 * Seed script for Sentia Spirits tenant
 *
 * This creates a demo tenant within the CapLiquify multi-tenant SaaS platform.
 * Sentia Spirits represents a customer/client using the CapLiquify Manufacturing Dashboard.
 *
 * Platform: CapLiquify (SaaS)
 * Tenant: Sentia Spirits (Customer)
 *
 * Run with: npx prisma db seed --script seed-tenant-sentia-spirits.js
 */
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Sentia Spirits tenant seed...');
  console.log('Platform: CapLiquify Multi-Tenant SaaS');
  console.log('Creating tenant: Sentia Spirits');

  try {
    // Check if tenant already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: 'sentia-spirits' }
    });

    if (existingTenant) {
      console.log('⚠️  Tenant "Sentia Spirits" already exists. Skipping creation.');
      console.log(`Tenant ID: ${existingTenant.id}`);
      return;
    }

    // Create Sentia Spirits tenant
    console.log('Creating Sentia Spirits tenant...');
    const sentiaSpirits = await prisma.tenant.create({
      data: {
        id: uuidv4(),
        name: 'Sentia Spirits',
        slug: 'sentia-spirits',
        companyName: 'Sentia Spirits Ltd',
        domain: 'sentiadrinks.com',
        logo: '/logos/sentia-spirits.png',
        industry: 'Beverages - Functional Drinks',

        // Trial Configuration
        isInTrial: false, // Production customer
        trialTier: null,

        // Active Subscription
        subscriptionTier: 'enterprise', // Enterprise tier for full feature access
        subscriptionStatus: 'ACTIVE',

        // Limits (Enterprise tier)
        maxUsers: 50,
        maxEntities: 1000,
        maxStorage: 10000, // 10GB

        // Feature flags - All features enabled for demo
        features: {
          demandForecasting: true,
          inventoryManagement: true,
          workingCapitalAnalysis: true,
          aiAnalytics: true,
          multiChannelIntegration: true,
          advancedReporting: true,
          apiAccess: true,
          webhooks: true,
          customBranding: true,
          ssoAuth: true,
          auditLogs: true,
          dataExport: true,
          dataImport: true,
        },

        // Billing
        billingEmail: 'finance@sentiadrinks.com',
        billingAddress: '123 Distillery Lane, London, UK, SW1A 1AA',
        paymentMethod: 'STRIPE',

        // Configuration
        settings: {
          timezone: 'Europe/London',
          currency: 'GBP',
          dateFormat: 'DD/MM/YYYY',
          locale: 'en-GB',
          fiscalYearStart: '04-01', // April 1st (UK tax year)
          defaultLeadTimeDays: 14,
          reorderPointMethod: 'DYNAMIC', // Dynamic vs Fixed
          forecastingModel: 'ENSEMBLE', // AI-powered ensemble forecasting
        },

        // Metadata
        metadata: {
          foundedYear: 2019,
          employeeCount: 25,
          annualRevenue: 2500000, // £2.5M
          primaryMarkets: ['UK', 'EU', 'USA'],
          productCategories: ['GABA Red', 'GABA Black', 'GABA Gold'],
          salesChannels: ['Amazon UK', 'Amazon USA', 'Shopify UK', 'Shopify EU', 'Shopify USA'],
          erpSystem: 'Unleashed',
          accountingSystem: 'Xero',
          notes: 'Demo tenant showcasing full CapLiquify platform capabilities for functional beverage manufacturing',
        },

        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        lastActivityAt: new Date(),
        isActive: true,
        isSuspended: false,
      },
    });

    console.log('✅ Sentia Spirits tenant created successfully!');
    console.log(`   Tenant ID: ${sentiaSpirits.id}`);
    console.log(`   Slug: ${sentiaSpirits.slug}`);
    console.log(`   Subscription: ${sentiaSpirits.subscriptionTier} (${sentiaSpirits.subscriptionStatus})`);

    // Create API integration records for Sentia Spirits
    console.log('');
    console.log('Creating API integration records...');

    const integrations = [
      {
        name: 'Xero Accounting',
        type: 'xero',
        description: 'Financial data sync - receivables, payables, working capital',
        status: 'ACTIVE',
        apiEndpoint: 'https://api.xero.com/api.xro/2.0',
        syncEnabled: true,
        syncFrequency: 3600, // 1 hour
      },
      {
        name: 'Shopify UK',
        type: 'shopify',
        description: 'E-commerce orders and inventory sync - UK market',
        status: 'ACTIVE',
        apiEndpoint: 'https://sentia-uk.myshopify.com',
        syncEnabled: true,
        syncFrequency: 1800, // 30 minutes
      },
      {
        name: 'Shopify EU',
        type: 'shopify',
        description: 'E-commerce orders and inventory sync - EU market',
        status: 'ACTIVE',
        apiEndpoint: 'https://sentia-eu.myshopify.com',
        syncEnabled: true,
        syncFrequency: 1800, // 30 minutes
      },
      {
        name: 'Shopify USA',
        type: 'shopify',
        description: 'E-commerce orders and inventory sync - USA market',
        status: 'ACTIVE',
        apiEndpoint: 'https://sentia-usa.myshopify.com',
        syncEnabled: true,
        syncFrequency: 1800, // 30 minutes
      },
      {
        name: 'Amazon SP-API (UK)',
        type: 'amazon-sp-api',
        description: 'Amazon UK FBA inventory and order sync',
        status: 'ACTIVE',
        apiEndpoint: 'https://sellingpartnerapi-eu.amazon.com',
        syncEnabled: true,
        syncFrequency: 900, // 15 minutes
      },
      {
        name: 'Amazon SP-API (USA)',
        type: 'amazon-sp-api',
        description: 'Amazon USA FBA inventory and order sync',
        status: 'ACTIVE',
        apiEndpoint: 'https://sellingpartnerapi-na.amazon.com',
        syncEnabled: true,
        syncFrequency: 900, // 15 minutes
      },
      {
        name: 'Unleashed ERP',
        type: 'unleashed',
        description: 'Production planning, assembly jobs, and inventory management',
        status: 'ACTIVE',
        apiEndpoint: 'https://api.unleashedsoftware.com',
        syncEnabled: true,
        syncFrequency: 900, // 15 minutes
      },
    ];

    // Note: These are placeholder integration records. The actual Integration model
    // would need to be defined in schema.prisma. For now, this documents the intended
    // integrations that should be visible in the tenant's admin panel.

    console.log('✅ Integration configuration documented:');
    integrations.forEach((integration, index) => {
      console.log(`   ${index + 1}. ${integration.name} (${integration.type})`);
      console.log(`      Status: ${integration.status}`);
      console.log(`      Sync: ${integration.syncEnabled ? `Every ${integration.syncFrequency}s` : 'Disabled'}`);
    });

    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Configure API credentials in tenant admin panel (/app/admin)');
    console.log('   2. Run integration sync tests to verify connectivity');
    console.log('   3. Review data in dashboard to ensure proper tenant isolation');
    console.log('');
    console.log('🎉 Sentia Spirits tenant setup complete!');
    console.log('   Platform: CapLiquify (SaaS)');
    console.log('   Tenant: Sentia Spirits (Customer)');
    console.log('   Access: https://app.capliquify.com/sentia-spirits');

  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  }
}

// Run seed
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
