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

    // Create sample historical sales data
    console.log('Creating sample historical sales...');
    const currentDate = new Date();
    const salesData = [];
    
    for (let i = 0; i < 90; i++) { // 90 days of data
      const saleDate = new Date(currentDate);
      saleDate.setDate(saleDate.getDate() - i);
      
      // Generate sales for each product-channel combination
      for (const product of products.slice(0, 3)) { // Just use first 3 products for sample
        for (const channel of salesChannels.slice(0, 2)) { // Just use first 2 channels
          if (product.marketRegion === channel.marketCode) {
            const quantity = Math.floor(Math.random() * 50) + 10; // 10-59 units
            const unitPrice = product.sellingPrice;
            const grossRevenue = quantity * unitPrice;
            const netRevenue = grossRevenue * 0.95; // 5% discounts
            const cogs = quantity * product.unitCost;
            const platformFees = grossRevenue * channel.commissionRate;
            const netProfit = netRevenue - cogs - platformFees - (grossRevenue * 0.08); // 8% other costs

            await prisma.historicalSale.create({
              data: {
                productId: product.id,
                salesChannelId: channel.id,
                saleDate: saleDate,
                quantitySold: quantity,
                grossRevenue: grossRevenue,
                netRevenue: netRevenue,
                cogs: cogs,
                shippingCosts: quantity * 2.50,
                platformFees: platformFees,
                taxes: grossRevenue * 0.08,
                netProfit: netProfit,
                dataQualityScore: 0.95,
                seasonalCategory: i % 30 < 10 ? 'high' : i % 30 < 20 ? 'medium' : 'low',
                geoRegion: product.marketRegion,
                createdBy: adminUser.id,
              },
            });
          }
        }
      }
    }

    // Create sample forecasts
    console.log('Creating sample forecasts...');
    for (const product of products.slice(0, 3)) {
      for (const channel of salesChannels.slice(0, 2)) {
        if (product.marketRegion === channel.marketCode) {
          const forecastDate = new Date();
          forecastDate.setDate(forecastDate.getDate() + 30); // 30 days ahead
          
          await prisma.forecast.create({
            data: {
              productId: product.id,
              salesChannelId: channel.id,
              forecastDate: forecastDate,
              predictedDemand: Math.floor(Math.random() * 200) + 100, // 100-299 units
              confidenceScore: 0.85,
              modelType: 'ARIMA',
              upperBound: 350,
              lowerBound: 80,
              seasonalFactor: 1.2,
              trendFactor: 1.05,
              modelVersion: 'v1.0',
              accuracyScore: 0.78,
              approvalStatus: 'approved',
              createdBy: adminUser.id,
            },
          });
        }
      }
    }

    // Create sample inventory levels
    console.log('Creating sample inventory levels...');
    for (const product of products.slice(0, 3)) {
      await prisma.inventoryLevel.create({
        data: {
          productId: product.id,
          locationId: `WH_${product.marketRegion}_001`,
          locationType: 'own_warehouse',
          availableQuantity: Math.floor(Math.random() * 500) + 100,
          reservedQuantity: Math.floor(Math.random() * 50),
          inboundQuantity: Math.floor(Math.random() * 100),
          defectiveQuantity: Math.floor(Math.random() * 10),
          reorderPoint: 150,
          maxStockLevel: 1000,
          daysOfSupply: Math.floor(Math.random() * 60) + 30,
          turnoverRate: 6.5,
          ageInDays: Math.floor(Math.random() * 90),
          storagesCosts: 0.50,
          riskScore: 0.15,
        },
      });
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
    console.log(`- ${90 * 3 * 2} historical sales records`);
    console.log(`- ${3 * 2} forecasts`);
    console.log(`- 3 inventory level records`);
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