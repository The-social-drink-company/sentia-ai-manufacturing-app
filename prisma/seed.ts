import { PrismaClient, Prisma } from '@prisma/client'
import { hash } from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Sentia data aligned with current Prisma schema...')

  console.log('Clearing existing records...')
  await prisma.$transaction([
    prisma.qualityRecord.deleteMany({}),
    prisma.productionJob.deleteMany({}),
    prisma.inventoryMovement.deleteMany({}),
    prisma.inventoryItem.deleteMany({}),
    prisma.cashFlowForecast.deleteMany({}),
    prisma.whatIfScenario.deleteMany({}),
    prisma.workingCapital.deleteMany({}),
    prisma.demandForecast.deleteMany({}),
    prisma.dashboard.deleteMany({}),
    prisma.aiInsight.deleteMany({}),
    prisma.mcpRequest.deleteMany({}),
    prisma.vectorStore.deleteMany({}),
    prisma.auditLog.deleteMany({}),
    prisma.dataExport.deleteMany({}),
    prisma.notification.deleteMany({}),
    prisma.scheduledJob.deleteMany({}),
    prisma.systemSetting.deleteMany({}),
    prisma.session.deleteMany({}),
    prisma.department.deleteMany({}),
    prisma.user.deleteMany({}),
    prisma.organization.deleteMany({}),
  ])

  console.log('Creating organization and department...')
  const organization = await prisma.organization.create({
    data: {
      name: 'Sentia Spirits Manufacturing',
      displayName: 'Sentia Spirits',
      domain: 'sentia-spirits.local',
      plan: 'PROFESSIONAL',
      features: {
        ai_forecasting: true,
        what_if: true,
        api_integrations: true,
        advanced_reports: false,
      },
    },
  })

  const operationsDept = await prisma.department.create({
    data: {
      organizationId: organization.id,
      name: 'Operations',
      code: 'OPS',
      description: 'Manufacturing and supply chain operations',
    },
  })

  console.log('Creating users...')
  const passwordHash = await hash('SentiaAdmin123!', 10)
  const adminUser = await prisma.user.create({
    data: {
      organizationId: organization.id,
      departmentId: operationsDept.id,
      email: 'admin@sentia-spirits.local',
      username: 'sentia-admin',
      firstName: 'Avery',
      lastName: 'Nguyen',
      displayName: 'Avery Nguyen',
      role: 'ADMIN',
      passwordHash,
      permissions: ['*:*'],
      dashboardLayout: {
        widgets: ['workingCapital', 'inventory', 'productionStatus'],
      },
    },
  })

  console.log('Creating products...')
  const [productRed, productBlack] = await prisma.$transaction([
    prisma.product.create({
      data: {
        organizationId: organization.id,
        sku: 'SENTIA-RED-750',
        name: 'Sentia Red 750ml',
        category: 'FINISHED_GOODS',
        unitCost: new Prisma.Decimal('9.50'),
        sellingPrice: new Prisma.Decimal('24.00'),
        leadTime: 14,
        batchSize: 240,
        safetyStock: 120,
        reorderPoint: 200,
      },
    }),
    prisma.product.create({
      data: {
        organizationId: organization.id,
        sku: 'SENTIA-BLACK-750',
        name: 'Sentia Black 750ml',
        category: 'FINISHED_GOODS',
        unitCost: new Prisma.Decimal('10.25'),
        sellingPrice: new Prisma.Decimal('26.00'),
        leadTime: 16,
        batchSize: 200,
        safetyStock: 140,
        reorderPoint: 220,
      },
    }),
  ])

  console.log('Creating inventory items...')
  await prisma.$transaction([
    prisma.inventoryItem.create({
      data: {
        organizationId: organization.id,
        productId: productRed.id,
        warehouseId: 'WH-LON-01',
        location: 'Aisle 3 / Bay 4',
        quantityOnHand: 520,
        quantityAvailable: 480,
        quantityReserved: 40,
        unitCost: new Prisma.Decimal('9.50'),
        totalValue: new Prisma.Decimal('4940'),
      },
    }),
    prisma.inventoryItem.create({
      data: {
        organizationId: organization.id,
        productId: productBlack.id,
        warehouseId: 'WH-LON-01',
        location: 'Aisle 5 / Bay 2',
        quantityOnHand: 410,
        quantityAvailable: 360,
        quantityReserved: 50,
        unitCost: new Prisma.Decimal('10.25'),
        totalValue: new Prisma.Decimal('4202.50'),
      },
    }),
  ])

  console.log('Creating working capital baseline...')
  const workingCapital = await prisma.workingCapital.create({
    data: {
      organizationId: organization.id,
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-03-31'),
      revenue: new Prisma.Decimal('265000'),
      cogs: new Prisma.Decimal('132500'),
      grossProfit: new Prisma.Decimal('132500'),
      grossMargin: new Prisma.Decimal('50.0'),
      accountsReceivable: new Prisma.Decimal('48000'),
      accountsPayable: new Prisma.Decimal('31000'),
      inventory: new Prisma.Decimal('91000'),
      workingCapital: new Prisma.Decimal('108000'),
      dso: 46,
      dio: 51,
      dpo: 32,
      ccc: 65,
      inventoryTurnover: new Prisma.Decimal('3.6'),
      receivablesTurnover: new Prisma.Decimal('7.5'),
      payablesTurnover: new Prisma.Decimal('5.1'),
      quickRatio: new Prisma.Decimal('1.7'),
      currentRatio: new Prisma.Decimal('2.1'),
      workingCapitalRatio: new Prisma.Decimal('1.9'),
      aiScore: 82.4,
      createdBy: adminUser.id,
      notes: 'Baseline quarter for FY2024 transition to CapLiquify.',
    },
  })

  await prisma.cashFlowForecast.create({
    data: {
      workingCapitalId: workingCapital.id,
      forecastDate: new Date('2024-04-30'),
      horizon: 90,
      openingBalance: new Prisma.Decimal('82000'),
      cashInflows: new Prisma.Decimal('112000'),
      cashOutflows: new Prisma.Decimal('98000'),
      closingBalance: new Prisma.Decimal('96000'),
      salesReceipts: new Prisma.Decimal('84000'),
      supplierPayments: new Prisma.Decimal('43000'),
      payrollExpenses: new Prisma.Decimal('22000'),
      overheadExpenses: new Prisma.Decimal('13500'),
      capitalExpenses: new Prisma.Decimal('4500'),
      cashRunway: 5,
      burnRate: new Prisma.Decimal('1500'),
      modelVersion: 'v1.0',
      assumptions: {
        notes: 'Forecast assumes 6% uplift from new enterprise contracts.',
      },
    },
  })

  console.log('Creating production job and quality record...')
  const productionJob = await prisma.productionJob.create({
    data: {
      organizationId: organization.id,
      productId: productRed.id,
      jobNumber: 'JOB-2024-0001',
      workOrderNumber: 'WO-3412',
      quantityOrdered: 480,
      quantityProduced: 460,
      quantityRejected: 8,
      plannedStart: new Date('2024-02-10T08:00:00Z'),
      plannedEnd: new Date('2024-02-15T18:00:00Z'),
      actualStart: new Date('2024-02-10T09:15:00Z'),
      actualEnd: new Date('2024-02-15T17:20:00Z'),
      status: 'COMPLETED',
      priority: 4,
      assignedLine: 'Bottling-Line-1',
      assignedTeam: 'Evening Shift',
      laborHours: new Prisma.Decimal('128.5'),
      machineHours: new Prisma.Decimal('142.0'),
      materialCost: new Prisma.Decimal('4300'),
      laborCost: new Prisma.Decimal('3650'),
      overheadCost: new Prisma.Decimal('2850'),
      totalCost: new Prisma.Decimal('10800'),
      qualityScore: 94.5,
      defectRate: 1.7,
    },
  })

  await prisma.qualityRecord.create({
    data: {
      productionJobId: productionJob.id,
      productId: productRed.id,
      inspectionType: 'FINAL',
      batchNumber: 'BATCH-2024-02-15',
      sampleSize: 60,
      passed: 58,
      failed: 2,
      passRate: 96.7,
      defects: [
        { type: 'Label-Misalignment', count: 1 },
        { type: 'Cap-Scuff', count: 1 },
      ],
      rootCause: 'Manual handling in final packaging',
      correctiveAction: 'Retrain packaging staff and update SOP',
      measurements: {
        fillVolumeMl: { target: 750, min: 749, max: 751 },
        sealIntegrity: 'Pass',
      },
      specifications: {
        color: 'Deep crimson',
        aroma: 'Herbal',
      },
      inspectedBy: 'QA-1023',
      approvedBy: 'QA-Manager-01',
      approvedAt: new Date('2024-02-15T19:30:00Z'),
    },
  })

  await prisma.whatIfScenario.create({
    data: {
      workingCapitalId: workingCapital.id,
      name: 'Reduce DSO by 10 days',
      description: 'Early payment incentives for key distributors',
      type: 'OPTIMISTIC',
      revenueChange: new Prisma.Decimal('2.5'),
      cogsChange: new Prisma.Decimal('-1.2'),
      dsoChange: -10,
      dioChange: -4,
      dpoChange: 2,
      projectedRevenue: new Prisma.Decimal('272000'),
      projectedCogs: new Prisma.Decimal('130000'),
      projectedWC: new Prisma.Decimal('98000'),
      projectedCCC: 55,
      impact: new Prisma.Decimal('9500'),
    },
  })

  await prisma.demandForecast.create({
    data: {
      organizationId: organization.id,
      productId: productBlack.id,
      forecastDate: new Date('2024-03-01'),
      periodType: 'MONTH',
      forecastType: 'demand',
      modelType: 'ARIMA',
      predictedValue: new Prisma.Decimal('420'),
      confidenceLower: new Prisma.Decimal('380'),
      confidenceUpper: new Prisma.Decimal('460'),
      accuracyScore: new Prisma.Decimal('87.5'),
      assumptions: {
        notes: 'Seasonal uplift from spring retailer promotions.',
      },
    },
  })

  console.log('Seed complete.')
}

main()
  .catch(error => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
