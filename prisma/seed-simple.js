import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting simple database seed...');

  try {
    // Create admin user with all required fields
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

    console.log(`✅ Created admin user: ${adminUser.email}`);

    // Create markets
    console.log('Creating markets...');
    const markets = await prisma.market.createMany({
      data: [
        {
          code: 'UK',
          name: 'United Kingdom',
          region: 'Europe',
          currencyCode: 'GBP',
          taxRate: 0.2000,
          standardShippingDays: 2,
          expressShippingDays: 1,
          isActive: true,
          created_by: adminUser.id,
        },
        {
          code: 'EU',
          name: 'European Union', 
          region: 'Europe',
          currencyCode: 'EUR',
          taxRate: 0.1900,
          standardShippingDays: 5,
          expressShippingDays: 3,
          isActive: true,
          created_by: adminUser.id,
        },
        {
          code: 'USA',
          name: 'United States',
          region: 'North America',
          currencyCode: 'USD',
          taxRate: 0.0800,
          standardShippingDays: 7,
          expressShippingDays: 3,
          isActive: true,
          created_by: adminUser.id,
        },
      ],
    });

    console.log(`✅ Created ${markets.count} markets`);

    // Create a few sample products
    console.log('Creating products...');
    const products = await prisma.product.createMany({
      data: [
        {
          sku: 'GABA_RED_UK',
          name: 'GABA Red - UK',
          category: 'GABA Red',
          marketRegion: 'UK',
          weight_kg: 0.5,
          unitCost: 15.00,
          sellingPrice: 29.99,
          productionTimeHours: 3.5,
          batch_size_min: 100,
          batch_size_max: 1000,
          isActive: true,
          createdBy: adminUser.id,
        },
        {
          sku: 'GABA_BLACK_UK', 
          name: 'GABA Black - UK',
          category: 'GABA Black',
          marketRegion: 'UK',
          weight_kg: 0.5,
          unitCost: 18.00,
          sellingPrice: 39.99,
          productionTimeHours: 3.5,
          batch_size_min: 100,
          batch_size_max: 1000,
          isActive: true,
          createdBy: adminUser.id,
        },
        {
          sku: 'GABA_GOLD_UK',
          name: 'GABA Gold - UK', 
          category: 'GABA Gold',
          marketRegion: 'UK',
          weight_kg: 0.5,
          unitCost: 22.00,
          sellingPrice: 49.99,
          productionTimeHours: 4.0,
          batch_size_min: 50,
          batch_size_max: 500,
          isActive: true,
          createdBy: adminUser.id,
        },
      ],
    });

    console.log(`✅ Created ${products.count} products`);

    // Create sales channels
    console.log('Creating sales channels...');
    const channels = await prisma.salesChannel.createMany({
      data: [
        {
          name: 'Amazon UK',
          channelType: 'Amazon',
          marketCode: 'UK',
          api_endpoint: 'https://sellingpartnerapi-eu.amazon.com',
          marketplace_id: 'A1F83G8C2ARO7P',
          commissionRate: 0.15,
          fulfillmentMethod: 'FBA',
          sync_enabled: true,
          isActive: true,
          created_by: adminUser.id,
        },
        {
          name: 'Shopify UK',
          channelType: 'Shopify',
          marketCode: 'UK',
          commissionRate: 0.029,
          fulfillmentMethod: 'Own',
          sync_enabled: true,
          isActive: true,
          created_by: adminUser.id,
        },
      ],
    });

    console.log(`✅ Created ${channels.count} sales channels`);

    // Create system settings
    console.log('Creating system settings...');
    const settings = await prisma.systemSetting.createMany({
      data: [
        {
          category: 'forecasting',
          key: 'default_horizon_days',
          name: 'Default Forecasting Horizon',
          dataType: 'integer',
          valueInteger: 30,
          description: 'Default forecasting horizon in days',
          is_encrypted: false,
          is_system_setting: true,
          is_sensitive: false,
          requires_restart: false,
          version: 1,
          isActive: true,
          createdBy: adminUser.id,
        },
        {
          category: 'inventory',
          key: 'safety_stock_multiplier',
          name: 'Safety Stock Multiplier',
          dataType: 'decimal',
          valueDecimal: 1.5,
          description: 'Safety stock multiplier for reorder calculations',
          is_encrypted: false,
          is_system_setting: true,
          is_sensitive: false,
          requires_restart: false,
          version: 1,
          isActive: true,
          createdBy: adminUser.id,
        },
      ],
    });

    console.log(`✅ Created ${settings.count} system settings`);

    console.log('\n🎉 Database seed completed successfully!');
    console.log('Sample data created:');
    console.log('- 1 admin user (admin@sentiamanufacturing.com)');
    console.log('- 3 markets (UK, EU, USA)');
    console.log('- 3 products (GABA variants for UK)');
    console.log('- 2 sales channels (Amazon UK, Shopify UK)');
    console.log('- 2 system settings');

  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  }
}

main()
  .catch(_(e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async _() => {
    await prisma.$disconnect();
  });