import { PrismaClient } from '@prisma/client';
import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
});

export class DatabaseService {
  constructor() {
    this.prisma = prisma;
    this.isConnected = false;
  }

  async connect() {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      logInfo('Database connection established');
      return true;
    } catch (error) {
      logError('Database connection failed', error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect() {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      logInfo('Database connection closed');
    } catch (error) {
      logError('Database disconnection error', error);
    }
  }

  async getProductionJobs(options = {}) {
    try {
      const { status, line, limit = 50 } = options;
      
      const where = {};
      if (status) where.status = status;
      if (line) where.productionLine = { contains: line };

      const jobs = await this.prisma.productionJob.findMany({
        where,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          product: true,
          productionMetrics: true,
        },
      });

      return jobs.map(job => ({
        id: job.id,
        product: job.product?.name || 'Unknown Product',
        line: job.productionLine,
        status: job.status,
        progress: job.completionPercentage || 0,
        startTime: job.startTime?.toISOString(),
        estimatedEnd: job.estimatedEndTime?.toISOString(),
        actualOutput: job.actualOutput,
        targetOutput: job.targetOutput,
        efficiency: job.efficiency,
      }));
    } catch (error) {
      logError('Failed to fetch production jobs', error);
      return [];
    }
  }

  async getProductionMetrics(timeRange = '24h') {
    try {
      const now = new Date();
      let startTime;

      switch (timeRange) {
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const [totalJobs, activeJobs, completedJobs, metrics] = await Promise.all([
        this.prisma.productionJob.count({
          where: { createdAt: { gte: startTime } }
        }),
        this.prisma.productionJob.count({
          where: { 
            status: 'RUNNING',
            createdAt: { gte: startTime }
          }
        }),
        this.prisma.productionJob.count({
          where: { 
            status: 'COMPLETED',
            createdAt: { gte: startTime }
          }
        }),
        this.prisma.productionMetric.aggregate({
          where: { timestamp: { gte: startTime } },
          _avg: {
            efficiency: true,
            capacity: true,
            output: true,
          },
          _sum: {
            output: true,
            downtimeMinutes: true,
          }
        })
      ]);

      return {
        totalJobs,
        activeJobs,
        completedToday: completedJobs,
        capacity: Math.round(metrics._avg.capacity || 0),
        efficiency: Math.round(metrics._avg.efficiency || 0),
        outputToday: metrics._sum.output || 0,
        outputTarget: 1400, // TODO: Get from configuration
        downtimeMinutes: metrics._sum.downtimeMinutes || 0,
      };
    } catch (error) {
      logError('Failed to fetch production metrics', error);
      return {
        totalJobs: 0,
        activeJobs: 0,
        completedToday: 0,
        capacity: 0,
        efficiency: 0,
        outputToday: 0,
        outputTarget: 1400,
        downtimeMinutes: 0,
      };
    }
  }

  async getHourlyProduction(timeRange = '24h') {
    try {
      const now = new Date();
      let startTime;
      let interval = '1 hour';

      switch (timeRange) {
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          interval = '1 hour';
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          interval = '1 day';
          break;
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          interval = '1 day';
          break;
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const result = await this.prisma.$queryRaw`
        SELECT 
          DATE_TRUNC(${interval}, timestamp) as hour,
          AVG(output)::integer as output,
          AVG(efficiency)::integer as efficiency,
          AVG(capacity)::integer as capacity
        FROM "ProductionMetric"
        WHERE timestamp >= ${startTime}
        GROUP BY DATE_TRUNC(${interval}, timestamp)
        ORDER BY hour ASC
      `;

      return result.map(row => ({
        timestamp: row.hour.toISOString(),
        output: row.output || 0,
        efficiency: row.efficiency || 0,
        capacity: row.capacity || 0,
      }));
    } catch (error) {
      logError('Failed to fetch hourly production data', error);
      return [];
    }
  }

  async getWorkingCapitalData(companyId) {
    try {
      const [arData, apData, inventory, cashFlow] = await Promise.all([
        this.prisma.accountsReceivable.findMany({
          where: { companyId },
          orderBy: { dueDate: 'desc' },
          take: 100
        }),
        this.prisma.accountsPayable.findMany({
          where: { companyId },
          orderBy: { dueDate: 'desc' },
          take: 100
        }),
        this.prisma.inventoryLevel.findMany({
          where: { companyId },
          include: { product: true }
        }),
        this.prisma.cashFlow.findMany({
          where: { companyId },
          orderBy: { date: 'desc' },
          take: 90 // Last 90 days
        })
      ]);

      const totalAR = arData.reduce((sum, item) => sum + (item.amount || 0), 0);
      const totalAP = apData.reduce((sum, item) => sum + (item.amount || 0), 0);
      const totalInventory = inventory.reduce((sum, item) => sum + (item.value || 0), 0);

      // Calculate DSO (Days Sales Outstanding)
      const dailySales = cashFlow
        .filter(cf => cf.type === 'REVENUE')
        .reduce((sum, cf) => sum + cf.amount, 0) / 90;
      const dso = dailySales > 0 ? totalAR / dailySales : 0;

      // Calculate DPO (Days Payable Outstanding)
      const dailyPurchases = cashFlow
        .filter(cf => cf.type === 'EXPENSE' && cf.category === 'PURCHASES')
        .reduce((sum, cf) => sum + Math.abs(cf.amount), 0) / 90;
      const dpo = dailyPurchases > 0 ? totalAP / dailyPurchases : 0;

      // Calculate DIO (Days Inventory Outstanding)
      const dailyCOGS = cashFlow
        .filter(cf => cf.type === 'EXPENSE' && cf.category === 'COGS')
        .reduce((sum, cf) => sum + Math.abs(cf.amount), 0) / 90;
      const dio = dailyCOGS > 0 ? totalInventory / dailyCOGS : 0;

      // Cash Conversion Cycle
      const ccc = dso + dio - dpo;

      return {
        totalAR,
        totalAP,
        totalInventory,
        workingCapital: totalAR + totalInventory - totalAP,
        dso: Math.round(dso),
        dpo: Math.round(dpo),
        dio: Math.round(dio),
        ccc: Math.round(ccc),
        metrics: {
          arTurnover: 365 / dso,
          apTurnover: 365 / dpo,
          inventoryTurnover: 365 / dio,
        }
      };
    } catch (error) {
      logError('Failed to fetch working capital data', error);
      return {
        totalAR: 0,
        totalAP: 0,
        totalInventory: 0,
        workingCapital: 0,
        dso: 0,
        dpo: 0,
        dio: 0,
        ccc: 0,
        metrics: {
          arTurnover: 0,
          apTurnover: 0,
          inventoryTurnover: 0,
        }
      };
    }
  }

  async getForecastData(productId, timeHorizon = 90) {
    try {
      const forecast = await this.prisma.forecast.findFirst({
        where: { 
          productId,
          timeHorizon,
          isActive: true
        },
        include: {
          forecastValues: {
            orderBy: { forecastDate: 'asc' }
          }
        }
      });

      if (!forecast) {
        logWarn('No forecast found for product', { productId, timeHorizon });
        return { periods: [], accuracy: null };
      }

      const periods = forecast.forecastValues.map(fv => ({
        date: fv.forecastDate.toISOString().split('T')[0],
        forecast: fv.forecastValue,
        confidence: fv.confidenceInterval,
        actual: fv.actualValue,
      }));

      return {
        periods,
        accuracy: forecast.accuracy,
        method: forecast.method,
        createdAt: forecast.createdAt,
      };
    } catch (error) {
      logError('Failed to fetch forecast data', error);
      return { periods: [], accuracy: null };
    }
  }

  async createProductionJob(jobData) {
    try {
      const job = await this.prisma.productionJob.create({
        data: {
          id: jobData.id,
          productId: jobData.productId,
          productionLine: jobData.line,
          status: 'RUNNING',
          targetOutput: jobData.targetOutput,
          priority: jobData.priority || 'NORMAL',
          startTime: new Date(),
          estimatedEndTime: jobData.estimatedEndTime ? new Date(jobData.estimatedEndTime) : null,
        },
        include: {
          product: true
        }
      });

      logInfo('Production job created', { jobId: job.id });
      return {
        success: true,
        jobId: job.id,
        status: job.status,
        message: 'Job started successfully',
        timestamp: job.startTime.toISOString()
      };
    } catch (error) {
      logError('Failed to create production job', error);
      return {
        success: false,
        error: 'Failed to start production job',
        message: error.message
      };
    }
  }

  async updateProductionJob(jobId, updates) {
    try {
      const job = await this.prisma.productionJob.update({
        where: { id: jobId },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      logInfo('Production job updated', { jobId, updates });
      return {
        success: true,
        jobId: job.id,
        status: job.status,
        message: 'Job updated successfully'
      };
    } catch (error) {
      logError('Failed to update production job', error);
      return {
        success: false,
        error: 'Failed to update production job'
      };
    }
  }

  async getAutomationProcesses() {
    try {
      const processes = await this.prisma.automationProcess.findMany({
        where: { isActive: true },
        include: {
          processSteps: {
            orderBy: { stepOrder: 'asc' }
          }
        }
      });

      const stats = await this.prisma.automationProcess.aggregate({
        _count: { id: true },
        where: { isActive: true }
      });

      const activeCount = await this.prisma.automationProcess.count({
        where: { 
          isActive: true,
          status: 'RUNNING' 
        }
      });

      const completedToday = await this.prisma.automationExecution.count({
        where: {
          completedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          },
          status: 'COMPLETED'
        }
      });

      return {
        stats: {
          totalProcesses: stats._count.id,
          activeProcesses: activeCount,
          completedToday,
          averageEfficiency: 94, // TODO: Calculate from execution metrics
        },
        activeProcesses: processes.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          status: p.status,
          progress: p.progress || 0,
          nextRun: p.nextRunTime?.toISOString(),
          steps: p.processSteps.length,
        }))
      };
    } catch (error) {
      logError('Failed to fetch automation processes', error);
      return {
        stats: {
          totalProcesses: 0,
          activeProcesses: 0,
          completedToday: 0,
          averageEfficiency: 0,
        },
        activeProcesses: []
      };
    }
  }
}

export const databaseService = new DatabaseService();
export default databaseService;