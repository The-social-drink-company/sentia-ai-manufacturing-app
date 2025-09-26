import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting minimal database seed...');

  // Create EnterpriseCashCoverage records
  const currentDate = new Date();
  const cashCoverageRecords = [];

  for (let i = 5; i >= 0; i--) {
    const period = new Date(currentDate);
    period.setMonth(period.getMonth() - i);
    period.setDate(1);
    period.setHours(0, 0, 0, 0);

    const baseRevenue = 250000 + Math.random() * 50000;
    const baseExpenses = 180000 + Math.random() * 30000;

    cashCoverageRecords.push({
      period,
      startingCash: 500000 + (5 - i) * 20000,
      salesRevenue: baseRevenue * 0.7,
      subscriptionRevenue: baseRevenue * 0.2,
      serviceRevenue: baseRevenue * 0.08,
      otherRevenue: baseRevenue * 0.02,
      totalRevenue: baseRevenue,
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
      capitalExpenses: 15000 + Math.random() * 10000,
      loanPayments: 8000,
      taxPayments: baseRevenue * 0.15,
      dividendPayments: i === 2 ? 50000 : 0,
      netCashFlow: baseRevenue - baseExpenses - 8000,
      operatingCashFlow: baseRevenue - baseExpenses,
      financingCashFlow: -8000,
      investingCashFlow: -(15000 + Math.random() * 10000),
      cashCoverageRatio: 2.1 + Math.random() * 0.5,
      quickRatio: 1.3 + Math.random() * 0.3,
      currentRatio: 1.8 + Math.random() * 0.4,
      debtServiceCoverageRatio: 3.5 + Math.random() * 0.5,
      accountsReceivable: baseRevenue * 1.2,
      accountsPayable: baseExpenses * 0.8,
      inventory: 120000 + Math.random() * 30000,
      prepaidExpenses: 15000,
      accruedLiabilities: 25000,
      daysOfCashOnHand: 45 + Math.random() * 15,
      burnRate: baseExpenses / 30,
      runwayMonths: 8 + Math.random() * 4,
      isActual: i < 3,
      isForecast: i >= 3,
      confidenceScore: i < 3 ? 1.0 : 0.7 - (i - 3) * 0.1,
      dataSource: i < 3 ? 'xero' : 'forecast_model',
      importedFrom: i < 3 ? 'Xero API' : 'AI Forecast Engine',
      notes: i < 3 ? 'Actual data from accounting system' : 'Forecasted based on historical trends',
      endingCash: 500000 + (5 - i) * 20000 + (baseRevenue - baseExpenses - 8000),
    });
  }

  // Clear and insert EnterpriseCashCoverage records
  await prisma.enterpriseCashCoverage.deleteMany({});
  console.log('Cleared existing EnterpriseCashCoverage records');

  for (const record of cashCoverageRecords) {
    await prisma.enterpriseCashCoverage.create({ data: record });
    console.log(`Created EnterpriseCashCoverage for ${record.period.toISOString().slice(0, 7)}`);
  }

  // Create WorkingCapital records (matching actual schema)
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
      date,
      currentAssets,
      currentLiabilities,
      inventory: 250000 + Math.random() * 50000,
      accountsReceivable: 350000 + Math.random() * 100000,
      accountsPayable: 280000 + Math.random() * 80000,
      cash: cashAmount,
      dso: Math.floor(35 + Math.random() * 10), // Days Sales Outstanding (integer)
      dpo: Math.floor(40 + Math.random() * 10), // Days Payable Outstanding (integer)
      dio: Math.floor(45 + Math.random() * 15), // Days Inventory Outstanding (integer)
      cashConversionCycle: Math.floor(40 + Math.random() * 10), // integer
      workingCapitalRatio: currentAssets / currentLiabilities,
      quickRatio: (currentAssets - 250000) / currentLiabilities,
    });
  }

  await prisma.workingCapital.deleteMany({});
  for (const record of workingCapitalData) {
    await prisma.workingCapital.create({ data: record });
  }
  console.log(`Created ${workingCapitalData.length} WorkingCapital records`);

  // Create Users
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

  // Create Inventory records
  const inventoryItems = [
    {
      sku: 'SENT-001',
      name: 'Sentia Red',
      category: 'Finished Goods',
      quantity: 500,
      unitCost: 25.50,
      reorderPoint: 100,
      reorderQuantity: 200, // Required field
      unitPrice: 35.00,
      totalValue: 500 * 25.50,
      location: 'Warehouse A',
      warehouse: 'Warehouse A', // Required field
      status: 'ACTIVE'
    },
    {
      sku: 'SENT-002',
      name: 'Sentia Black',
      category: 'Finished Goods',
      quantity: 350,
      unitCost: 28.00,
      reorderPoint: 75,
      reorderQuantity: 150, // Required field
      unitPrice: 38.00,
      totalValue: 350 * 28.00,
      location: 'Warehouse A',
      warehouse: 'Warehouse A', // Required field
      status: 'ACTIVE'
    },
    {
      sku: 'RAW-001',
      name: 'Botanical Extract A',
      category: 'Raw Materials',
      quantity: 1000,
      unitCost: 5.25,
      reorderPoint: 200,
      reorderQuantity: 400, // Required field
      unitPrice: 5.25,
      totalValue: 1000 * 5.25,
      location: 'Warehouse B',
      warehouse: 'Warehouse B', // Required field
      status: 'ACTIVE'
    },
  ];

  await prisma.inventory.deleteMany({});
  for (const item of inventoryItems) {
    await prisma.inventory.create({ data: item });
  }
  console.log(`Created ${inventoryItems.length} Inventory items`);

  // Create Production records
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
  console.log(`Created ${productionBatches.length} Production batches`);

  // Create CashRunway records
  const cashRunwayData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    cashRunwayData.push({
      date,
      cashBalance: 500000 + Math.random() * 200000,
      monthlyBurnRate: 180000 + Math.random() * 40000,
      monthlyRevenue: 250000 + Math.random() * 50000,
      netBurnRate: -30000 + Math.random() * 20000,
      runwayMonths: 8 + Math.random() * 6,
      coverageDay30: 0.85 + Math.random() * 0.15,
      coverageDay60: 0.75 + Math.random() * 0.15,
      coverageDay90: 0.65 + Math.random() * 0.15,
      healthScore: 75 + Math.random() * 20,
      alertLevel: i < 2 ? 'green' : i < 4 ? 'yellow' : 'red',
      metadata: { source: 'calculated' }
    });
  }

  await prisma.cashRunway.deleteMany({});
  for (const record of cashRunwayData) {
    await prisma.cashRunway.create({ data: record });
  }
  console.log(`Created ${cashRunwayData.length} CashRunway records`);

  console.log('\nDatabase seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });