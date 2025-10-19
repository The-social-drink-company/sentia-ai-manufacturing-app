/**
 * Sentia Manufacturing Dashboard - Database Seed Script
 *
 * This script populates the database with initial data for development and testing.
 *
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Clearing existing data...');
    await prisma.$transaction([
      prisma.orderItem.deleteMany(),
      prisma.order.deleteMany(),
      prisma.customer.deleteMany(),
      prisma.salesData.deleteMany(),
      prisma.stockMovement.deleteMany(),
      prisma.inventory.deleteMany(),
      prisma.warehouse.deleteMany(),
      prisma.forecast.deleteMany(),
      prisma.forecastModel.deleteMany(),
      prisma.qualityMetric.deleteMany(),
      prisma.downtimeEvent.deleteMany(),
      prisma.productionSchedule.deleteMany(),
      prisma.productionJob.deleteMany(),
      prisma.workingCapital.deleteMany(),
      prisma.cashRunway.deleteMany(),
      prisma.scenario.deleteMany(),
      prisma.product.deleteMany(),
      prisma.session.deleteMany(),
      prisma.auditLog.deleteMany(),
      prisma.user.deleteMany(),
    ]);
  }

  // 1. Users
  console.log('👤 Creating users...');

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@sentia.com',
      username: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      displayName: 'System Administrator',
      role: 'ADMIN',
      permissions: JSON.stringify(['*:*']), // All permissions
      mfaEnabled: true,
      sessionTimeout: 3600,
      preferredCurrency: 'GBP',
      preferredLocale: 'en-GB',
      preferredTimezone: 'Europe/London',
      isActive: true,
      isApproved: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@sentia.com',
      username: 'manager',
      firstName: 'Operations',
      lastName: 'Manager',
      displayName: 'Operations Manager',
      role: 'MANAGER',
      permissions: JSON.stringify([
        'dashboard:read',
        'forecast:read',
        'forecast:write',
        'capital:read',
        'capital:write',
        'inventory:read',
        'inventory:write',
        'reports:read',
      ]),
      mfaEnabled: false,
      sessionTimeout: 3600,
      preferredCurrency: 'GBP',
      preferredLocale: 'en-GB',
      preferredTimezone: 'Europe/London',
      isActive: true,
      isApproved: true,
    },
  });

  const operatorUser = await prisma.user.create({
    data: {
      email: 'operator@sentia.com',
      username: 'operator',
      firstName: 'Production',
      lastName: 'Operator',
      displayName: 'Production Operator',
      role: 'OPERATOR',
      permissions: JSON.stringify([
        'dashboard:read',
        'inventory:read',
        'production:read',
        'production:write',
      ]),
      mfaEnabled: false,
      sessionTimeout: 1800,
      preferredCurrency: 'GBP',
      preferredLocale: 'en-GB',
      preferredTimezone: 'Europe/London',
      isActive: true,
      isApproved: true,
    },
  });

  console.log('✅ Created 3 users');

  // 2. Warehouses
  console.log('🏭 Creating warehouses...');

  const ukWarehouse = await prisma.warehouse.create({
    data: {
      code: 'WH-UK-01',
      name: 'Sentia UK Main Warehouse',
      location: JSON.stringify({
        address: '123 Industrial Estate',
        city: 'London',
        country: 'GB',
        postalCode: 'SW1A 1AA',
        coordinates: { lat: 51.5074, lon: -0.1278 },
      }),
      region: 'UK',
      timezone: 'Europe/London',
      capacity: 10000,
      capacityUnit: 'pallets',
      utilisationPct: 65.5,
      storageCostPerUnitMonthly: 12.50,
      currency: 'GBP',
      isActive: true,
    },
  });

  const euWarehouse = await prisma.warehouse.create({
    data: {
      code: 'WH-EU-01',
      name: 'Sentia EU Distribution Center',
      location: JSON.stringify({
        address: 'Europaweg 100',
        city: 'Rotterdam',
        country: 'NL',
        postalCode: '3000 AA',
        coordinates: { lat: 51.9225, lon: 4.47917 },
      }),
      region: 'EU',
      timezone: 'Europe/Amsterdam',
      capacity: 15000,
      capacityUnit: 'pallets',
      utilisationPct: 72.3,
      storageCostPerUnitMonthly: 14.75,
      currency: 'EUR',
      isActive: true,
    },
  });

  console.log('✅ Created 2 warehouses');

  // 3. Products
  console.log('📦 Creating products...');

  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: 'UK-FG-001',
        name: 'Sentia Red (750ml)',
        description: 'Premium non-alcoholic aperitif - Red variant',
        category: 'FINISHED_GOODS',
        weightKg: 1.2,
        dimensions: JSON.stringify({ length: 30, width: 8, height: 8, unit: 'cm' }),
        hsCode: '2206.00.31',
        unitCost: 8.50,
        sellingPrice: 25.00,
        currency: 'GBP',
        productionTimeHours: 2.5,
        batchSizeMin: 100,
        batchSizeMax: 1000,
        shelfLifeDays: 730,
        region: 'UK',
        channel: 'SHOPIFY_UK',
        isActive: true,
        createdBy: adminUser.id,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'UK-FG-002',
        name: 'Sentia Black (750ml)',
        description: 'Premium non-alcoholic aperitif - Black variant',
        category: 'FINISHED_GOODS',
        weightKg: 1.2,
        dimensions: JSON.stringify({ length: 30, width: 8, height: 8, unit: 'cm' }),
        hsCode: '2206.00.31',
        unitCost: 9.00,
        sellingPrice: 28.00,
        currency: 'GBP',
        productionTimeHours: 2.5,
        batchSizeMin: 100,
        batchSizeMax: 1000,
        shelfLifeDays: 730,
        region: 'UK',
        channel: 'SHOPIFY_UK',
        isActive: true,
        createdBy: adminUser.id,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'EU-FG-001',
        name: 'Sentia Red (750ml) - EU',
        description: 'Premium non-alcoholic aperitif - Red variant (EU market)',
        category: 'FINISHED_GOODS',
        weightKg: 1.2,
        dimensions: JSON.stringify({ length: 30, width: 8, height: 8, unit: 'cm' }),
        hsCode: '2206.00.31',
        unitCost: 10.00,
        sellingPrice: 30.00,
        currency: 'EUR',
        productionTimeHours: 2.5,
        batchSizeMin: 100,
        batchSizeMax: 1000,
        shelfLifeDays: 730,
        region: 'EU',
        channel: 'SHOPIFY_EU',
        isActive: true,
        createdBy: adminUser.id,
      },
    }),
  ]);

  console.log('✅ Created 3 products');

  // 4. Inventory
  console.log('📊 Creating inventory records...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const inventoryRecords = await Promise.all([
    prisma.inventory.create({
      data: {
        productId: products[0].id,
        warehouseId: ukWarehouse.id,
        quantity: 850,
        safetyStock: 200,
        reorderPoint: 300,
        economicOrderQty: 500,
        status: 'AVAILABLE',
        unitCost: 8.50,
        totalValue: 7225.00,
        turnoverRate: 4.5,
        daysOfSupply: 45,
        stockoutRisk: 0.15,
        snapshotDate: today,
      },
    }),
    prisma.inventory.create({
      data: {
        productId: products[1].id,
        warehouseId: ukWarehouse.id,
        quantity: 620,
        safetyStock: 150,
        reorderPoint: 250,
        economicOrderQty: 400,
        status: 'AVAILABLE',
        unitCost: 9.00,
        totalValue: 5580.00,
        turnoverRate: 3.8,
        daysOfSupply: 52,
        stockoutRisk: 0.22,
        snapshotDate: today,
      },
    }),
    prisma.inventory.create({
      data: {
        productId: products[2].id,
        warehouseId: euWarehouse.id,
        quantity: 1200,
        safetyStock: 250,
        reorderPoint: 400,
        economicOrderQty: 600,
        status: 'AVAILABLE',
        unitCost: 10.00,
        totalValue: 12000.00,
        turnoverRate: 5.2,
        daysOfSupply: 38,
        stockoutRisk: 0.08,
        snapshotDate: today,
      },
    }),
  ]);

  console.log('✅ Created 3 inventory records');

  // 5. Customers
  console.log('👥 Creating customers...');

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        externalId: 'SHOPIFY-UK-12345',
        name: 'John Smith',
        email: 'john.smith@example.com',
        customerType: 'B2C',
        region: 'UK',
        channel: 'SHOPIFY_UK',
        lifetimeValue: 150.00,
        totalOrders: 3,
        averageOrderValue: 50.00,
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        externalId: 'SHOPIFY-UK-67890',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        customerType: 'B2C',
        region: 'UK',
        channel: 'SHOPIFY_UK',
        lifetimeValue: 280.00,
        totalOrders: 5,
        averageOrderValue: 56.00,
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Created 2 customers');

  // 6. Orders
  console.log('🛒 Creating orders...');

  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'SHOPIFY-UK-20251017-001',
      externalId: 'SHOPIFY-12345',
      customerId: customers[0].id,
      channel: 'SHOPIFY_UK',
      region: 'UK',
      status: 'DELIVERED',
      subtotal: 50.00,
      discounts: 0,
      shippingCost: 5.00,
      tax: 11.00,
      total: 66.00,
      currency: 'GBP',
      shippingMethod: 'Royal Mail Tracked 48',
      shippingAddress: JSON.stringify({
        name: 'John Smith',
        line1: '123 High Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'GB',
      }),
      orderDate: new Date('2025-10-01T10:30:00Z'),
      shippedDate: new Date('2025-10-02T14:00:00Z'),
      deliveredDate: new Date('2025-10-04T11:00:00Z'),
      createdBy: operatorUser.id,
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order1.id,
        productId: products[0].id,
        quantity: 2,
        unitPrice: 25.00,
        discount: 0,
        tax: 11.00,
        subtotal: 50.00,
      },
    ],
  });

  console.log('✅ Created 1 order with 1 item');

  // 7. Sales Data (aggregated)
  console.log('💰 Creating sales data aggregations...');

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const salesDataRecords = [];
  for (const date of last30Days) {
    for (const product of products.slice(0, 2)) {
      // Random sales data
      const quantity = Math.floor(Math.random() * 50) + 10;
      const revenue = quantity * Number(product.sellingPrice);
      const cost = quantity * Number(product.unitCost);
      const profit = revenue - cost;

      salesDataRecords.push({
        productId: product.id,
        channel: product.channel as any,
        region: product.region,
        date,
        quantity,
        revenue,
        cost,
        profit,
        currency: product.currency,
        orderCount: Math.floor(quantity / 2),
        averageOrderValue: revenue / Math.floor(quantity / 2),
      });
    }
  }

  await prisma.salesData.createMany({ data: salesDataRecords });

  console.log(`✅ Created ${salesDataRecords.length} sales data records`);

  // 8. Production Jobs
  console.log('🏭 Creating production jobs...');

  const productionJob = await prisma.productionJob.create({
    data: {
      jobNumber: 'PROD-20251017-001',
      productId: products[0].id,
      quantity: 500,
      batchSize: 500,
      priority: 7,
      status: 'COMPLETED',
      scheduledStart: new Date('2025-10-15T08:00:00Z'),
      scheduledEnd: new Date('2025-10-15T16:00:00Z'),
      actualStart: new Date('2025-10-15T08:15:00Z'),
      actualEnd: new Date('2025-10-15T15:45:00Z'),
      oee: 0.89,
      firstPassYield: 0.96,
      defectRate: 0.04,
      quantityProduced: 495,
      quantityDefective: 5,
      quantityScrap: 0,
      createdBy: managerUser.id,
    },
  });

  await prisma.productionSchedule.create({
    data: {
      jobId: productionJob.id,
      scheduledStart: new Date('2025-10-15T08:00:00Z'),
      scheduledEnd: new Date('2025-10-15T16:00:00Z'),
      priority: 7,
      assignedResources: JSON.stringify(['MIXER-01', 'FILLER-02', 'LABELER-01']),
      dependencies: [],
      isLocked: true,
    },
  });

  await prisma.qualityMetric.create({
    data: {
      jobId: productionJob.id,
      firstPassYield: 0.96,
      defectRate: 0.04,
      reworkRate: 0.00,
      scrapRate: 0.00,
      defectTypes: JSON.stringify({ 'label_misalignment': 3, 'fill_level_variance': 2 }),
      defectCost: 42.50,
      inspectionDate: new Date('2025-10-15T16:00:00Z'),
    },
  });

  console.log('✅ Created 1 production job with schedule and quality metrics');

  // 9. Forecasts
  console.log('🔮 Creating forecasts...');

  const forecastModel = await prisma.forecastModel.create({
    data: {
      name: 'Ensemble v1.0',
      type: 'hybrid',
      parameters: JSON.stringify({
        models: ['ARIMA', 'PROPHET', 'LSTM'],
        weights: [0.3, 0.4, 0.3],
        seasonality: 'multiplicative',
        trend: 'additive',
      }),
      performance: JSON.stringify({
        historical_mape: 0.12,
        historical_rmse: 45.2,
      }),
      averageAccuracy: 0.88,
      modelVersion: '1.0.0',
      isActive: true,
      lastTrainedAt: new Date('2025-10-01T00:00:00Z'),
    },
  });

  const next30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return { date: date.toISOString().split('T')[0], quantity: Math.floor(Math.random() * 40) + 30 };
  });

  await prisma.forecast.create({
    data: {
      productId: products[0].id,
      model: 'ENSEMBLE',
      horizon: 30,
      forecastDate: today,
      predictions: JSON.stringify(next30Days),
      accuracy: 0.88,
      confidence: 0.85,
      lowerBound: JSON.stringify(next30Days.map(d => ({ ...d, quantity: d.quantity * 0.8 }))),
      upperBound: JSON.stringify(next30Days.map(d => ({ ...d, quantity: d.quantity * 1.2 }))),
      rmse: 45.2,
      mae: 38.1,
      mape: 0.12,
      trainingDataStart: new Date('2024-01-01'),
      trainingDataEnd: new Date('2025-09-30'),
      status: 'APPROVED',
      isApproved: true,
      approvedBy: managerUser.id,
      approvedAt: new Date(),
      modelVersion: '1.0.0',
      modelParameters: JSON.stringify({}),
    },
  });

  console.log('✅ Created 1 forecast model and 1 forecast');

  // 10. Working Capital
  console.log('💵 Creating working capital records...');

  await prisma.workingCapital.create({
    data: {
      date: today,
      productId: products[0].id,
      region: 'UK',
      daysInventoryOutstanding: 45,
      daysPayableOutstanding: 30,
      daysSalesOutstanding: 25,
      ccc: 40, // 45 + 25 - 30
      accountsReceivable: 12500.00,
      inventory: 45000.00,
      accountsPayable: 18000.00,
      workingCapital: 39500.00, // 12500 + 45000 - 18000
      currency: 'GBP',
    },
  });

  console.log('✅ Created 1 working capital record');

  // 11. Cash Runway
  console.log('🏃 Creating cash runway projection...');

  await prisma.cashRunway.create({
    data: {
      date: today,
      cashBalance: 250000.00,
      burnRate: 35000.00,
      runwayDays: 214, // ~7 months
      breachRisk: 'LOW',
      projectedCashFlow: JSON.stringify(
        Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          cashIn: 85000,
          cashOut: 35000,
          netCashFlow: 50000,
          endingCash: 250000 + (50000 * (i + 1)),
        }))
      ),
      currency: 'GBP',
    },
  });

  console.log('✅ Created 1 cash runway projection');

  // 12. Integration Configs
  console.log('🔗 Creating integration configurations...');

  await prisma.integrationConfig.createMany({
    data: [
      {
        system: 'SHOPIFY',
        status: 'ACTIVE',
        syncEnabled: true,
        syncFrequency: 15,
        lastSync: new Date(),
      },
      {
        system: 'AMAZON_SP_API',
        status: 'ACTIVE',
        syncEnabled: true,
        syncFrequency: 15,
        lastSync: new Date(),
      },
      {
        system: 'XERO',
        status: 'ACTIVE',
        syncEnabled: true,
        syncFrequency: 60,
        lastSync: new Date(),
      },
      {
        system: 'UNLEASHED_ERP',
        status: 'ACTIVE',
        syncEnabled: true,
        syncFrequency: 60,
        lastSync: new Date(),
      },
    ],
  });

  console.log('✅ Created 4 integration configurations');

  // 13. Audit Log Entry
  console.log('📝 Creating audit log entry...');

  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'CREATE',
      severity: 'INFO',
      resourceType: 'database',
      resourceId: 'seed',
      after: JSON.stringify({ message: 'Database seeded successfully' }),
      ipAddress: '127.0.0.1',
      userAgent: 'Prisma Seed Script',
    },
  });

  console.log('✅ Created audit log entry');

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: 3 (admin, manager, operator)`);
  console.log(`   - Warehouses: 2 (UK, EU)`);
  console.log(`   - Products: 3 (Sentia Red, Black, EU)`);
  console.log(`   - Inventory: 3 records`);
  console.log(`   - Customers: 2`);
  console.log(`   - Orders: 1 with 1 item`);
  console.log(`   - Sales Data: ${salesDataRecords.length} records (30 days)`);
  console.log(`   - Production Jobs: 1 with schedule and metrics`);
  console.log(`   - Forecasts: 1 (30-day horizon)`);
  console.log(`   - Working Capital: 1 record`);
  console.log(`   - Cash Runway: 1 projection`);
  console.log(`   - Integrations: 4 configurations`);

  console.log('\n🔐 Test Credentials:');
  console.log('   Admin:    admin@sentia.com');
  console.log('   Manager:  manager@sentia.com');
  console.log('   Operator: operator@sentia.com');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
