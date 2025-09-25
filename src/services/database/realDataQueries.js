import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  errorFormat: 'pretty'
});
prisma.$connect().catch((err) => {
  console.error('Database connection failed:', err);
  throw new Error('Real database connection required. No mock data allowed.');
});
const assertValue = (value, field) => {
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing value for ${field}`);
  }
  return value;
};
const parseNumber = (value, field) => {
  const parsedValue = Number(assertValue(value, field));
  if (Number.isNaN(parsedValue)) {
    throw new Error(`Invalid numeric value for ${field}`);
  }
  return parsedValue;
};
const parseInteger = (value, field) => {
  const parsedValue = parseNumber(value, field);
  if (!Number.isInteger(parsedValue)) {
    throw new Error(`Expected integer for ${field}`);
  }
  return parsedValue;
};
const parseDate = (value, field) => {
  const parsedValue = new Date(assertValue(value, field));
  if (Number.isNaN(parsedValue.getTime())) {
    throw new Error(`Invalid date for ${field}`);
  }
  return parsedValue;
};
const parseString = (value, field) => {
  const parsedValue = assertValue(value, field);
  if (typeof parsedValue !== 'string' || !parsedValue.trim()) {
    throw new Error(`Invalid string for ${field}`);
  }
  return parsedValue.trim();
};
export const WorkingCapitalQueries = {
  async getCurrentMetrics() {
    const data = await prisma.workingCapital.findFirst({
      orderBy: { date: 'desc' }
    });
    if (!data) {
      throw new Error('No working capital data available. Import real data first.');
    }
    return data;
  },
  async getHistoricalData({ days }) {
    const windowDays = parseInteger(days, 'days');
    if (windowDays <= 0) {
      throw new Error('Days must be a positive integer.');
    }
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - windowDays);
    const data = await prisma.workingCapital.findMany({
      where: { date: { gte: startDate } },
      orderBy: { date: 'asc' }
    });
    if (data.length === 0) {
      throw new Error('No historical data found. Import real data from CSV or API.');
    }
    return data;
  },
  async importFromCSV(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('CSV import requires at least one row of real data.');
    }
    const records = rows.map((row) => ({
      date: parseDate(row.date, 'date'),
      currentAssets: parseNumber(row.currentAssets, 'currentAssets'),
      currentLiabilities: parseNumber(row.currentLiabilities, 'currentLiabilities'),
      inventory: parseNumber(row.inventory, 'inventory'),
      accountsReceivable: parseNumber(row.accountsReceivable, 'accountsReceivable'),
      accountsPayable: parseNumber(row.accountsPayable, 'accountsPayable'),
      cash: parseNumber(row.cash, 'cash'),
      dso: parseInteger(row.dso, 'dso'),
      dpo: parseInteger(row.dpo, 'dpo'),
      dio: parseInteger(row.dio, 'dio'),
      cashConversionCycle: parseInteger(row.cashConversionCycle, 'cashConversionCycle'),
      workingCapitalRatio: parseNumber(row.workingCapitalRatio, 'workingCapitalRatio'),
      quickRatio: parseNumber(row.quickRatio, 'quickRatio')
    }));
    return prisma.workingCapital.createMany({
      data: records,
      skipDuplicates: true
    });
  }
};
export const ProductionQueries = {
  async getActiveJobs() {
    const jobs = await prisma.production.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      orderBy: { priority: 'desc' }
    });
    if (jobs.length === 0) {
      throw new Error('No active production jobs. Create real jobs or import from ERP.');
    }
    return jobs;
  },
  async updateJobProgress(jobId, progress) {
    const targetId = parseString(jobId, 'jobId');
    if (!progress) {
      throw new Error('Progress payload required for real database update.');
    }
    const job = await prisma.production.update({
      where: { id: targetId },
      data: {
        completedQuantity: parseNumber(progress.completedQuantity, 'completedQuantity'),
        status: parseString(progress.status, 'status'),
        efficiency: parseNumber(progress.efficiency, 'efficiency'),
        qualityScore: parseNumber(progress.qualityScore, 'qualityScore'),
        updatedAt: new Date()
      }
    });
    if (!job) {
      throw new Error(`Production job ${targetId} not found. No mock updates allowed.`);
    }
    return job;
  },
  async importJobsFromCSV(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('CSV import requires at least one production job row.');
    }
    const records = rows.map((row) => ({
      id: parseString(row.id, 'id'),
      reference: parseString(row.reference, 'reference'),
      status: parseString(row.status, 'status'),
      priority: parseInteger(row.priority, 'priority'),
      plannedQuantity: parseNumber(row.plannedQuantity, 'plannedQuantity'),
      completedQuantity: parseNumber(row.completedQuantity, 'completedQuantity'),
      efficiency: parseNumber(row.efficiency, 'efficiency'),
      qualityScore: parseNumber(row.qualityScore, 'qualityScore'),
      startedAt: row.startedAt ? parseDate(row.startedAt, 'startedAt') : undefined,
      dueDate: row.dueDate ? parseDate(row.dueDate, 'dueDate') : undefined,
      updatedAt: new Date()
    }));
    return prisma.production.createMany({
      data: records,
      skipDuplicates: true
    });
  }
};
export const InventoryQueries = {
  async getCurrentLevels() {
    const inventory = await prisma.inventory.findMany({
      include: {
        movements: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (inventory.length === 0) {
      throw new Error('No inventory data. Import from ERP or CSV.');
    }
    return inventory;
  },
  async recordMovement(movement) {
    if (!movement || !movement.inventoryId) {
      throw new Error('Inventory movement requires a valid inventoryId.');
    }
    const quantity = parseNumber(movement.quantity, 'quantity');
    const type = parseString(movement.type, 'type');
    const result = await prisma.$transaction(async (tx) => {
      const inventoryUpdate = await tx.inventory.update({
        where: { id: parseString(movement.inventoryId, 'inventoryId') },
        data: {
          quantity: { increment: type === 'IN' ? quantity : -quantity },
          lastMovement: new Date()
        }
      });
      const movementRecord = await tx.inventoryMovement.create({
        data: {
          inventoryId: inventoryUpdate.id,
          type,
          quantity,
          reference: parseString(movement.reference, 'reference'),
          reason: parseString(movement.reason, 'reason'),
          performedBy: parseString(movement.userId, 'userId')
        }
      });
      return { inventory: inventoryUpdate, movement: movementRecord };
    });
    return result;
  },
  async importLevelsFromCSV(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('CSV import requires inventory rows.');
    }
    const records = rows.map((row) => ({
      sku: parseString(row.sku, 'sku'),
      location: parseString(row.location, 'location'),
      quantityOnHand: parseNumber(row.quantityOnHand, 'quantityOnHand'),
      quantityAvailable: parseNumber(row.quantityAvailable, 'quantityAvailable'),
      reorderPoint: parseNumber(row.reorderPoint, 'reorderPoint'),
      updatedAt: row.updatedAt ? parseDate(row.updatedAt, 'updatedAt') : new Date()
    }));
    return prisma.inventoryLevel.createMany({
      data: records,
      skipDuplicates: true
    });
  }
};
export const AIInsightQueries = {
  async getLatestInsights() {
    const insights = await prisma.aIInsight.findMany({
      where: { actioned: false },
      orderBy: [
        { priority: 'desc' },
        { confidence: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 20
    });
    if (insights.length === 0) {
      throw new Error('No AI insights available. Trigger real AI analysis.');
    }
    return insights;
  },
  async saveRealInsight(insight) {
    if (!insight || !insight.content || !insight.confidence) {
      throw new Error('Invalid insight payload. Real insights only.');
    }
    return prisma.aIInsight.create({ data: insight });
  }
};
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
export default {
  workingCapital: WorkingCapitalQueries,
  production: ProductionQueries,
  inventory: InventoryQueries,
  aiInsights: AIInsightQueries
};
