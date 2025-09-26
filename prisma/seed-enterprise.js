import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Enterprise Cash Coverage database seed...');

  // Create sample EnterpriseCashCoverage records for the last 6 months
  const currentDate = new Date();
  const records = [];

  for (let i = 5; i >= 0; i--) {
    const period = new Date(currentDate);
    period.setMonth(period.getMonth() - i);
    period.setDate(1); // First day of month
    period.setHours(0, 0, 0, 0);

    const baseRevenue = 250000 + Math.random() * 50000;
    const baseExpenses = 180000 + Math.random() * 30000;

    records.push({
      period,
      startingCash: 500000 + (5 - i) * 20000,

      // Revenue components
      salesRevenue: baseRevenue * 0.7,
      subscriptionRevenue: baseRevenue * 0.2,
      serviceRevenue: baseRevenue * 0.08,
      otherRevenue: baseRevenue * 0.02,
      totalRevenue: baseRevenue,

      // Operating expenses
      payrollExpenses: baseExpenses * 0.4,
      rentExpenses: baseExpenses * 0.1,
      utilitiesExpenses: baseExpenses * 0.05,
      marketingExpenses: baseExpenses * 0.15,
      suppliesExpenses: baseExpenses * 0.08,
      maintenanceExpenses: baseExpenses * 0.05,
      insuranceExpenses: baseExpenses * 0.04,
      professionalFees: baseExpenses * 0.06,
      otherOperatingExpenses: baseExpenses * 0.07,
      totalOperatingExpenses: baseExpenses,

      // Non-operating items
      capitalExpenses: 15000 + Math.random() * 10000,
      loanPayments: 8000,
      taxPayments: baseRevenue * 0.15,
      dividendPayments: i === 2 ? 50000 : 0, // Quarterly dividend

      // Cash flow metrics
      netCashFlow: baseRevenue - baseExpenses - 8000,
      operatingCashFlow: baseRevenue - baseExpenses,
      financingCashFlow: -8000,
      investingCashFlow: -(15000 + Math.random() * 10000),

      // Coverage ratios
      cashCoverageRatio: 2.1 + Math.random() * 0.5,
      quickRatio: 1.3 + Math.random() * 0.3,
      currentRatio: 1.8 + Math.random() * 0.4,
      debtServiceCoverageRatio: 3.5 + Math.random() * 0.5,

      // Working capital items
      accountsReceivable: baseRevenue * 1.2,
      accountsPayable: baseExpenses * 0.8,
      inventory: 120000 + Math.random() * 30000,
      prepaidExpenses: 15000,
      accruedLiabilities: 25000,

      // Key metrics
      daysOfCashOnHand: 45 + Math.random() * 15,
      burnRate: baseExpenses / 30,
      runwayMonths: 8 + Math.random() * 4,

      // Analysis flags
      isActual: i < 3, // First 3 months are actual, rest are forecast
      isForecast: i >= 3,
      confidenceScore: i < 3 ? 1.0 : 0.7 - (i - 3) * 0.1,

      // Source tracking
      dataSource: i < 3 ? 'xero' : 'forecast_model',
      importedFrom: i < 3 ? 'Xero API' : 'AI Forecast Engine',

      // Metadata
      notes: i < 3 ? 'Actual data from accounting system' : 'Forecasted based on historical trends',

      endingCash: 500000 + (5 - i) * 20000 + (baseRevenue - baseExpenses - 8000),
    });
  }

  // Delete existing records first
  await prisma.enterpriseCashCoverage.deleteMany({});
  console.log('Cleared existing EnterpriseCashCoverage records');

  // Insert new records
  for (const record of records) {
    await prisma.enterpriseCashCoverage.create({
      data: record
    });
    console.log(`Created record for ${record.period.toISOString().slice(0, 7)}`);
  }

  // Create sample users
  const users = [
    { email: 'admin@sentia.com', name: 'Admin User', role: 'ADMIN' },
    { email: 'manager@sentia.com', name: 'Manager User', role: 'MANAGER' },
    { email: 'operator@sentia.com', name: 'Operator User', role: 'OPERATOR' },
    { email: 'viewer@sentia.com', name: 'Viewer User', role: 'VIEWER' },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    console.log(`Created/updated user: ${user.email}`);
  }

  // Create sample working capital records
  const workingCapitalData = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);

    const currentAssets = 800000 + Math.random() * 200000;
    const currentLiabilities = 600000 + Math.random() * 150000;

    const cashAmount = 180000 + Math.random() * 40000;

    workingCapitalData.push({
      period: date,
      currentAssets,
      currentLiabilities,
      accountsReceivable: 350000 + Math.random() * 100000,
      accountsPayable: 280000 + Math.random() * 80000,
      inventory: 250000 + Math.random() * 50000,
      cash: cashAmount, // Required field
      cashBalance: cashAmount,
      shortTermDebt: 50000 + Math.random() * 20000,
      workingCapital: currentAssets - currentLiabilities,

      // Ratios
      currentRatio: currentAssets / currentLiabilities,
      quickRatio: (currentAssets - 250000) / currentLiabilities,
      cashRatio: cashAmount / currentLiabilities,

      // Days metrics
      daysInventoryOutstanding: 45 + Math.random() * 15,
      daysSalesOutstanding: 35 + Math.random() * 10,
      daysPayableOutstanding: 40 + Math.random() * 10,
      cashConversionCycle: 40 + Math.random() * 10,

      dataSource: 'xero',
      isProjection: i > 8,
      metadata: {
        imported: true,
        source: 'Xero API',
        version: '1.0'
      }
    });
  }

  // Clear and insert working capital records
  await prisma.workingCapital.deleteMany({});
  for (const record of workingCapitalData) {
    await prisma.workingCapital.create({ data: record });
  }
  console.log(`Created ${workingCapitalData.length} working capital records`);

  // Create sample inventory records
  const inventoryItems = [
    {
      sku: 'SENT-001',
      name: 'Sentia Red',
      category: 'Finished Goods',
      quantity: 500,
      unitCost: 25.50,
      reorderPoint: 100,
      unitPrice: 35.00,
      totalValue: 500 * 25.50,
      location: 'Warehouse A',
      status: 'ACTIVE'
    },
    {
      sku: 'SENT-002',
      name: 'Sentia Black',
      category: 'Finished Goods',
      quantity: 350,
      unitCost: 28.00,
      reorderPoint: 75,
      unitPrice: 38.00,
      totalValue: 350 * 28.00,
      location: 'Warehouse A',
      status: 'ACTIVE'
    },
    {
      sku: 'RAW-001',
      name: 'Botanical Extract A',
      category: 'Raw Materials',
      quantity: 1000,
      unitCost: 5.25,
      reorderPoint: 200,
      unitPrice: 5.25,
      totalValue: 1000 * 5.25,
      location: 'Warehouse B',
      status: 'ACTIVE'
    },
    {
      sku: 'RAW-002',
      name: 'Botanical Extract B',
      category: 'Raw Materials',
      quantity: 800,
      unitCost: 7.50,
      reorderPoint: 150,
      unitPrice: 7.50,
      totalValue: 800 * 7.50,
      location: 'Warehouse B',
      status: 'ACTIVE'
    },
    {
      sku: 'PKG-001',
      name: 'Glass Bottles 750ml',
      category: 'Packaging',
      quantity: 2000,
      unitCost: 2.15,
      reorderPoint: 500,
      unitPrice: 2.15,
      totalValue: 2000 * 2.15,
      location: 'Warehouse C',
      status: 'ACTIVE'
    },
  ];

  await prisma.inventory.deleteMany({});
  for (const item of inventoryItems) {
    await prisma.inventory.create({ data: item });
  }
  console.log(`Created ${inventoryItems.length} inventory items`);

  // Create sample production records
  const productionBatches = [
    {
      batchNumber: 'BATCH-2024-001',
      productName: 'Sentia Red',
      productSku: 'SENT-001',
      plannedQuantity: 500,
      actualQuantity: 495,
      plannedStartDate: new Date('2024-01-15'),
      plannedEndDate: new Date('2024-01-20'),
      actualStartDate: new Date('2024-01-15'),
      actualEndDate: new Date('2024-01-19'),
      status: 'COMPLETED',
      priority: 'HIGH',
      assignedTo: 'Production Team A',
      qualityScore: 95.5,
      efficiency: 99.0,
      notes: 'Batch completed ahead of schedule',
      metadata: { location: 'Production Line 1' }
    },
    {
      batchNumber: 'BATCH-2024-002',
      productName: 'Sentia Black',
      productSku: 'SENT-002',
      plannedQuantity: 300,
      actualQuantity: 0,
      plannedStartDate: new Date('2024-02-01'),
      plannedEndDate: new Date('2024-02-05'),
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      assignedTo: 'Production Team B',
      qualityScore: 0,
      efficiency: 0,
      notes: 'In production',
      metadata: { location: 'Production Line 2' }
    }
  ];

  await prisma.production.deleteMany({});
  for (const batch of productionBatches) {
    await prisma.production.create({ data: batch });
  }
  console.log(`Created ${productionBatches.length} production batches`);

  // Create sample analytics records
  const analyticsData = [];
  const metrics = ['revenue', 'costs', 'profit_margin', 'inventory_turnover', 'cash_flow'];

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    for (const metric of metrics) {
      analyticsData.push({
        date,
        metric,
        value: Math.random() * 100000 + 50000,
        dimension: 'daily',
        forecast: i > 15 ? Math.random() * 100000 + 50000 : null,
        actual: i <= 15 ? Math.random() * 100000 + 50000 : null,
        variance: i <= 15 ? Math.random() * 5000 - 2500 : null,
        metadata: { source: 'system', confidence: 0.85 }
      });
    }
  }

  await prisma.analytics.deleteMany({});
  for (const record of analyticsData) {
    await prisma.analytics.create({ data: record });
  }
  console.log(`Created ${analyticsData.length} analytics records`);

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });