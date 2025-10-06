import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  try {
    // Clear existing data (be careful in production!)
    if (process.env.NODE_ENV === 'development') {
      console.log('Clearing existing data...');
      await prisma.historicalSale.deleteMany();
      await prisma.forecast.deleteMany();
      await prisma.inventoryLevel.deleteMany();
      await prisma.workingCapital.deleteMany();
      await prisma.product.deleteMany();
      await prisma.salesChannel.deleteMany();
      await prisma.market.deleteMany();
      await prisma.systemSetting.deleteMany();
      await prisma.schedule.deleteMany();
      await prisma.job.deleteMany();
      await prisma.resource.deleteMany();
      await prisma.user.deleteMany();
    }

    // Create admin user
    console.log('Creating admin user...');
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@sentiamanufacturing.com',
        role: 'admin',
        isActive: true,
        is_admin: true,
        timezone: 'Europe/London',
        language: 'en',
        permissions: {
          canManageUsers: true,
          canManageProducts: true,
          canViewReports: true,
          canManageSettings: true,
        },
        two_factor_enabled: false,
        force_password_change: false,
      },
    });

    // Create markets
    console.log('Creating markets...');
    const ukMarket = await prisma.market.create({
      data: {
        code: 'UK',
        name: 'United Kingdom',
        region: 'Europe',
        currencyCode: 'GBP',
        taxRate: 0.2000, // 20% VAT
        standardShippingDays: 2,
        expressShippingDays: 1,
        regulatory_requirements: {
          notes: 'MHRA regulations, post-Brexit compliance',
          certifications: ['MHRA', 'UK-CA']
        },
        isActive: true,
        created_by: adminUser.id,
      },
    });

    const euMarket = await prisma.market.create({
      data: {
        code: 'EU',
        name: 'European Union',
        region: 'Europe',
        currencyCode: 'EUR',
        taxRate: 0.1900, // 19% VAT
        standardShippingDays: 5,
        expressShippingDays: 3,
        regulatory_requirements: {
          notes: 'EU Novel Food regulations, multilingual labeling',
          certifications: ['EU-NF', 'CE']
        },
        isActive: true,
        created_by: adminUser.id,
      },
    });

    const usMarket = await prisma.market.create({
      data: {
        code: 'USA',
        name: 'United States',
        region: 'North America',
        currencyCode: 'USD',
        taxRate: 0.0800, // 8% Sales Tax
        standardShippingDays: 7,
        expressShippingDays: 3,
        regulatory_requirements: {
          notes: 'FDA regulations, state-specific requirements',
          certifications: ['FDA', 'USDA']
        },
        isActive: true,
        created_by: adminUser.id,
      },
    });

    // Create products (9 SKUs: 3 products × 3 regions)
    console.log('Creating products...');
    const products = [];
    const categories = ['GABA Red', 'GABA Black', 'GABA Gold'];
    const markets = [
      { code: 'UK', cost: 15.00, price: 29.99 },
      { code: 'EU', cost: 16.50, price: 34.99 },
      { code: 'USA', cost: 18.00, price: 39.99 },
    ];

    for (const category of categories) {
      for (const market of markets) {
        const product = await prisma.product.create({
          data: {
            sku: `${category.replace(' ', '_').toUpperCase()}_${market.code}`,
            name: `${category} - ${market.code}`,
            category: category,
            marketRegion: market.code,
            weight_kg: 0.5,
            dimensions_cm: '10x5x5',
            unitCost: market.cost,
            sellingPrice: market.price,
            productionTimeHours: 3.5,
            batch_size_min: 100,
            batch_size_max: 1000,
            isActive: true,
            createdBy: adminUser.id,
          },
        });
        products.push(product);
      }
    }

    // Create sales channels
    console.log('Creating sales channels...');
    const salesChannels = [];
    
    // Amazon channels
    const amazonUK = await prisma.salesChannel.create({
      data: {
        name: 'Amazon UK',
        channelType: 'Amazon',
        marketCode: 'UK',
        api_endpoint: 'https://sellingpartnerapi-eu.amazon.com',
        marketplace_id: 'A1F83G8C2ARO7P',
        commissionRate: 0.15,
        fulfillmentMethod: 'FBA',
        average_processing_days: 2,
        sync_enabled: true,
        sync_frequency_minutes: 60,
        syncStatus: 'active',
        conversionRate: 0.12,
        monthly_sales_target: 50000.00,
        return_rate: 0.05,
        isActive: true,
        created_by: adminUser.id,
      },
    });
    salesChannels.push(amazonUK);

    const amazonUSA = await prisma.salesChannel.create({
      data: {
        name: 'Amazon USA',
        channelType: 'Amazon',
        marketCode: 'USA',
        commissionRate: 0.15,
        fulfillmentMethod: 'FBA',
        conversionRate: 0.10,
        revenueTarget: 75000.00,
        isActive: true,
      },
    });
    salesChannels.push(amazonUSA);

    // Shopify channels
    const shopifyUK = await prisma.salesChannel.create({
      data: {
        name: 'Shopify UK',
        channelType: 'Shopify',
        marketCode: 'UK',
        commissionRate: 0.029,
        fulfillmentMethod: 'Own',
        conversionRate: 0.08,
        revenueTarget: 25000.00,
        isActive: true,
      },
    });
    salesChannels.push(shopifyUK);

    const shopifyEU = await prisma.salesChannel.create({
      data: {
        name: 'Shopify EU',
        channelType: 'Shopify',
        marketCode: 'EU',
        commissionRate: 0.029,
        fulfillmentMethod: 'Own',
        conversionRate: 0.06,
        revenueTarget: 30000.00,
        isActive: true,
      },
    });
    salesChannels.push(shopifyEU);

    const shopifyUSA = await prisma.salesChannel.create({
      data: {
        name: 'Shopify USA',
        channelType: 'Shopify',
        marketCode: 'USA',
        commissionRate: 0.029,
        fulfillmentMethod: 'Own',
        conversionRate: 0.07,
        revenueTarget: 35000.00,
        isActive: true,
      },
    });
    salesChannels.push(shopifyUSA);

    // Create realistic manufacturing data for development/testing
    // This data simulates real manufacturing operations
    console.log('Creating realistic manufacturing data...');

    // Production Metrics - Daily records for last 30 days
    const productionMetrics = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      productionMetrics.push({
        date: date,
        efficiency: 85 + Math.random() * 10, // 85-95%
        unitsProduced: Math.floor(800 + Math.random() * 400),
        defectRate: 0.5 + Math.random() * 2, // 0.5-2.5%
        oeeScore: 75 + Math.random() * 15, // 75-90%
        createdAt: date,
        updatedAt: date
      });
    }

    if (productionMetrics.length > 0) {
      await prisma.productionMetrics.createMany({
        data: productionMetrics
      });
      console.log(`Created ${productionMetrics.length} production metrics`);
    }

    // Financial Metrics - Monthly records for last 12 months
    const financialMetrics = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      financialMetrics.push({
        date: date,
        grossMargin: 35 + Math.random() * 15, // 35-50%
        netMargin: 15 + Math.random() * 10, // 15-25%
        ebitda: 400000 + Math.random() * 200000,
        roi: 18 + Math.random() * 12, // 18-30%
        createdAt: date,
        updatedAt: date
      });
    }

    if (financialMetrics.length > 0) {
      await prisma.financialMetrics.createMany({
        data: financialMetrics
      });
      console.log(`Created ${financialMetrics.length} financial metrics`);
    }

    // Working Capital - Monthly records
    const workingCapital = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const currentAssets = 3000000 + Math.random() * 2000000;
      const currentLiabilities = 1500000 + Math.random() * 1000000;

      workingCapital.push({
        date: date,
        currentAssets: currentAssets,
        currentLiabilities: currentLiabilities,
        ratio: currentAssets / currentLiabilities,
        cashFlow: 200000 + Math.random() * 300000,
        daysReceivable: Math.floor(35 + Math.random() * 20),
        createdAt: date,
        updatedAt: date
      });
    }

    if (workingCapital.length > 0) {
      await prisma.workingCapital.createMany({
        data: workingCapital
      });
      console.log(`Created ${workingCapital.length} working capital records`);
    }

    // Inventory Items
    const inventoryItems = [];
    for (let i = 1; i <= 50; i++) {
      inventoryItems.push({
        sku: `SKU-${String(i).padStart(5, '0')}`,
        name: `Component ${i}`,
        quantity: Math.floor(100 + Math.random() * 900),
        reorderPoint: Math.floor(50 + Math.random() * 150),
        value: parseFloat((1000 + Math.random() * 9000).toFixed(2)),
        updatedAt: new Date()
      });
    }

    if (inventoryItems.length > 0) {
      await prisma.inventory.createMany({
        data: inventoryItems
      });
      console.log(`Created ${inventoryItems.length} inventory items`);
    }

    // Create system settings
    console.log('Creating system settings...');
    await prisma.systemSetting.createMany({
      data: [
        {
          category: 'forecasting',
          key: 'default_horizon_days',
          dataType: 'integer',
          valueInteger: 30,
          description: 'Default forecasting horizon in days',
          createdBy: adminUser.id,
        },
        {
          category: 'inventory',
          key: 'safety_stock_multiplier',
          dataType: 'decimal',
          valueDecimal: 1.5,
          description: 'Safety stock multiplier for reorder calculations',
          createdBy: adminUser.id,
        },
        {
          category: 'manufacturing',
          key: 'max_batch_size_global',
          dataType: 'integer',
          valueInteger: 1000,
          description: 'Global maximum batch size for production',
          createdBy: adminUser.id,
        },
        {
          category: 'api',
          key: 'unleashed_sync_enabled',
          dataType: 'boolean',
          valueBoolean: true,
          description: 'Enable Unleashed API synchronization',
          createdBy: adminUser.id,
        },
      ],
    });

    console.log('Database seed completed successfully!');
    console.log(`Created:`);
    console.log(`- 1 admin user`);
    console.log(`- 3 markets (UK, EU, USA)`);
    console.log(`- 9 products (3 categories × 3 regions)`);
    console.log(`- 5 sales channels (2 Amazon, 3 Shopify)`);
    console.log(`- ${productionMetrics.length} production metrics`);
    console.log(`- ${financialMetrics.length} financial metrics`);
    console.log(`- ${workingCapital.length} working capital records`);
    console.log(`- ${inventoryItems.length} inventory items`);
    console.log(`- 4 system settings`);

  } catch (error) {
    console.error('Error during seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });