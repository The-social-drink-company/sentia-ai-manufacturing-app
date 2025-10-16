import express from 'express';
import NodeCache from 'node-cache';
import prisma from '../../lib/prisma.js';
import { requireAuth, requireRole, requireManager } from '../middleware/clerkAuth.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


// Initialize cache with 60 second TTL for financial data
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

const router = express.Router();

// Financial validation schemas
const financialSchemas = {
  cashFlow: {
    query: z.object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      category: z.enum(['operating', 'investing', 'financing']).optional(),
      limit: z.coerce.number().min(1).max(100).default(50),
      offset: z.coerce.number().min(0).default(0)
    })
  },
  workingCapital: {
    calculate: z.object({
      period: z.enum(['current', 'month', 'quarter', 'year']).default('current'),
      includeProjections: z.boolean().default(false)
    })
  },
  invoice: {
    create: z.object({
      customerName: z.string().min(1),
      customerEmail: z.string().email().optional(),
      items: z.array(z.object({
        description: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
        taxRate: z.number().min(0).max(100).default(0)
      })).min(1),
      dueDate: z.string().datetime(),
      terms: z.string().optional(),
      notes: z.string().optional()
    })
  },
  expense: {
    create: z.object({
      vendor: z.string().min(1),
      category: z.enum(['materials', 'labor', 'overhead', 'utilities', 'maintenance', 'other']),
      amount: z.number().min(0),
      description: z.string(),
      date: z.string().datetime(),
      paymentMethod: z.enum(['cash', 'credit', 'bank_transfer', 'check']).optional(),
      reference: z.string().optional()
    })
  }
};

/**
 * GET /api/financial/dashboard
 * Get financial dashboard overview
 */
router.get('/dashboard',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const { period = 'month' } = req.query;

    // Check cache
    const cacheKey = `financial-dashboard-${period}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      logDebug('[Cache Hit] Financial dashboard');
      return res.json(cached);
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Fetch financial metrics
    const [revenue, expenses, receivables, payables] = await Promise.all([
      // Revenue
      prisma.invoice.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: { in: ['paid', 'partial'] }
        },
        _sum: { totalAmount: true },
        _count: true
      }),
      // Expenses
      prisma.expense.aggregate({
        where: {
          date: { gte: startDate }
        },
        _sum: { amount: true },
        _count: true
      }),
      // Accounts Receivable
      prisma.invoice.aggregate({
        where: {
          status: { in: ['sent', 'partial'] },
          dueDate: { lte: now }
        },
        _sum: { totalAmount: true },
        _count: true
      }),
      // Accounts Payable
      prisma.expense.aggregate({
        where: {
          status: 'pending',
          dueDate: { lte: now }
        },
        _sum: { amount: true },
        _count: true
      })
    ]);

    // Calculate key metrics
    const netIncome = (revenue._sum.totalAmount || 0) - (expenses._sum.amount || 0);
    const profitMargin = revenue._sum.totalAmount ? 
      (netIncome / revenue._sum.totalAmount) * 100 : 0;

    res.json({
      success: true,
      data: {
        period,
        startDate,
        metrics: {
          revenue: revenue._sum.totalAmount || 0,
          expenses: expenses._sum.amount || 0,
          netIncome,
          profitMargin,
          invoiceCount: revenue._count,
          expenseCount: expenses._count
        },
        cashPosition: {
          accountsReceivable: receivables._sum.totalAmount || 0,
          accountsPayable: payables._sum.amount || 0,
          overdueReceivables: receivables._count,
          overduePayables: payables._count
        }
      }
    });
  })
);

/**
 * GET /api/financial/cashflow
 * Get cash flow statement
 */
router.get('/cashflow',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const query = financialSchemas.cashFlow.query.parse(req.query);

    // Build date range
    const where = {};
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    } else {
      // Default to current month
      const now = new Date();
      where.date = {
        gte: new Date(now.getFullYear(), now.getMonth(), 1),
        lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
      };
    }

    // Fetch cash flow data
    const [inflows, outflows] = await Promise.all([
      // Cash inflows
      prisma.cashFlow.findMany({
        where: {
          ...where,
          type: 'inflow',
          category: query.category
        },
        take: query.limit,
        skip: query.offset,
        orderBy: { date: 'desc' }
      }),
      // Cash outflows
      prisma.cashFlow.findMany({
        where: {
          ...where,
          type: 'outflow',
          category: query.category
        },
        take: query.limit,
        skip: query.offset,
        orderBy: { date: 'desc' }
      })
    ]);

    // Calculate totals
    const totalInflow = inflows.reduce((sum, item) => sum + item.amount, 0);
    const totalOutflow = outflows.reduce((sum, item) => sum + item.amount, 0);
    const netCashFlow = totalInflow - totalOutflow;

    res.json({
      success: true,
      data: {
        period: where.date,
        inflows,
        outflows,
        summary: {
          totalInflow,
          totalOutflow,
          netCashFlow,
          inflowCount: inflows.length,
          outflowCount: outflows.length
        },
        pagination: {
          limit: query.limit,
          offset: query.offset
        }
      }
    });
  })
);

/**
 * GET /api/financial/working-capital
 * Get working capital metrics from REAL DATABASE - Sentia business model
 */
router.get('/working-capital',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    logInfo('[Working Capital API] Request received - fetching REAL Sentia data');

    // Check cache first
    const cacheKey = 'working-capital-current';
    const cached = cache.get(cacheKey);

    if (cached) {
      logDebug('[Cache Hit] Working capital data');
      return res.json(cached);
    }

    logDebug('[Working Capital API] Fetching from REAL working_capital table');

    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;
      logInfo('[Working Capital API] Database connection successful');

      // Get latest working capital projection from REAL database
      const latestWorkingCapital = await prisma.working_capital.findFirst({
        orderBy: { projection_date: 'desc' },
        where: {
          scenario_type: 'actual'
        }
      });

      if (!latestWorkingCapital) {
        logWarn('[Working Capital API] No working capital data found in database');
        return res.status(404).json({
          success: false,
          error: 'No working capital data available',
          message: 'Working capital projections not found in database. Please ensure data is loaded.',
          dataSource: 'database',
          timestamp: new Date().toISOString()
        });
      }

      // Get inventory value from REAL inventory_levels table
      const inventoryData = await prisma.inventory_levels.aggregate({
        _sum: {
          total_value: true
        },
        _count: true
      });

      // Get historical sales for revenue calculations
      const recentSales = await prisma.historical_sales.aggregate({
        where: {
          sale_date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        _sum: {
          net_revenue: true,
          cost_of_goods_sold: true
        },
        _count: true
      });

      logInfo('[Working Capital API] Real data fetched successfully');

      // Calculate metrics from REAL data
      const workingCapitalValue = latestWorkingCapital.working_capital_requirement || 0;
      const currentAssets = 
        (inventoryData._sum.total_value || 0) + 
        (latestWorkingCapital.accounts_receivable || 0);
      const currentLiabilities = latestWorkingCapital.accounts_payable || 0;
      const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
      const quickRatio = currentLiabilities > 0 ? 
        (latestWorkingCapital.accounts_receivable || 0) / currentLiabilities : 0;

      const response = {
        success: true,
        dataSource: 'database',
        lastUpdated: latestWorkingCapital.updated_at,
        summary: {
          workingCapital: workingCapitalValue,
          currentAssets,
          currentLiabilities,
          cashConversionCycle: latestWorkingCapital.cash_conversion_cycle_days || 0,
          operatingCashFlow: latestWorkingCapital.net_cash_flow || 0,
          currentRatio,
          quickRatio,
          daysReceivables: latestWorkingCapital.days_sales_outstanding || 0,
          daysPayables: latestWorkingCapital.days_payable_outstanding || 0,
          daysInventory: latestWorkingCapital.days_inventory_outstanding || 0
        },
        details: {
          assets: {
            inventory: inventoryData._sum.total_value || 0,
            receivables: latestWorkingCapital.accounts_receivable || 0,
            cash: 0, // Would come from separate cash tracking
            other: 0
          },
          liabilities: {
            payables: latestWorkingCapital.accounts_payable || 0,
            shortTermDebt: 0,
            accruedExpenses: latestWorkingCapital.accrued_expenses || 0,
            other: 0
          }
        },
        businessMetrics: {
          projectedSalesRevenue: latestWorkingCapital.projected_sales_revenue,
          costOfGoodsSold: latestWorkingCapital.cost_of_goods_sold,
          inventoryInvestment: latestWorkingCapital.inventory_investment,
          manufacturingCosts: latestWorkingCapital.manufacturing_costs,
          workingCapitalTurnover: latestWorkingCapital.working_capital_turnover
        },
        recentPerformance: {
          last30DaysRevenue: recentSales._sum.net_revenue || 0,
          last30DaysCogs: recentSales._sum.cost_of_goods_sold || 0,
          transactionCount: recentSales._count,
          inventoryItems: inventoryData._count
        },
        sentiaSpecific: {
          projectionPeriod: latestWorkingCapital.projection_period,
          confidenceLevel: latestWorkingCapital.confidence_level,
          scenario: latestWorkingCapital.scenario_type,
          currency: latestWorkingCapital.currency_code
        }
      };

      logInfo('[Working Capital API] Response prepared with REAL Sentia data');

      // Cache the successful response for 5 minutes
      cache.set(cacheKey, response, 300);

      res.json(response);

    } catch (error) {
      logError('[Working Capital API] Error fetching real data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch working capital data from database',
        message: error.message,
        dataSource: 'database_error',
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * POST /api/financial/working-capital/calculate
 * Calculate working capital metrics
 */
router.post('/working-capital/calculate',
  requireAuth,
  requireRole(['admin', 'manager']),
  rateLimiters.expensive,
  asyncHandler(async (req, res) => {
    const data = financialSchemas.workingCapital.calculate.parse(req.body);

    // Get current assets and liabilities
    const [inventory, receivables, payables, cash] = await Promise.all([
      // Inventory value
      prisma.$queryRaw`
        SELECT SUM(quantity * unit_cost) as total_value
        FROM inventory
      `,
      // Accounts receivable
      prisma.invoice.aggregate({
        where: {
          status: { in: ['sent', 'partial'] }
        },
        _sum: { totalAmount: true }
      }),
      // Accounts payable
      prisma.expense.aggregate({
        where: {
          status: 'pending'
        },
        _sum: { amount: true }
      }),
      // Cash on hand (would typically come from bank integration)
      prisma.cashBalance.findFirst({
        orderBy: { date: 'desc' }
      })
    ]);

    // Calculate working capital components
    const currentAssets = 
      (inventory[0]?.total_value || 0) +
      (receivables._sum.totalAmount || 0) +
      (cash?.balance || 0);
    
    const currentLiabilities = payables._sum.amount || 0;
    const workingCapital = currentAssets - currentLiabilities;
    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    const quickRatio = currentLiabilities > 0 ? 
      ((receivables._sum.totalAmount || 0) + (cash?.balance || 0)) / currentLiabilities : 0;

    // Calculate cash conversion cycle
    const daysInventory = 45; // Would calculate from actual data
    const daysReceivables = 30; // Would calculate from actual data
    const daysPayables = 35; // Would calculate from actual data
    const cashConversionCycle = daysInventory + daysReceivables - daysPayables;

    const result = {
      metrics: {
        workingCapital,
        currentRatio,
        quickRatio,
        cashConversionCycle
      },
      components: {
        currentAssets: {
          total: currentAssets,
          inventory: inventory[0]?.total_value || 0,
          receivables: receivables._sum.totalAmount || 0,
          cash: cash?.balance || 0
        },
        currentLiabilities: {
          total: currentLiabilities,
          payables: payables._sum.amount || 0
        }
      },
      efficiency: {
        daysInventory,
        daysReceivables,
        daysPayables
      }
    };

    // Add projections if requested
    if (data.includeProjections) {
      result.projections = {
        nextMonth: workingCapital * 1.05,
        nextQuarter: workingCapital * 1.15,
        improvements: [
          { action: 'Reduce inventory days by 10%', impact: workingCapital * 0.03 },
          { action: 'Improve collection by 5 days', impact: workingCapital * 0.02 },
          { action: 'Extend payment terms by 5 days', impact: workingCapital * 0.02 }
        ]
      };
    }

    res.json({
      success: true,
      data: result
    });
  })
);

/**
 * GET /api/financial/invoices
 * Get invoices with filters
 */
router.get('/invoices',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const { status, startDate, endDate, customerId, limit = 50, offset = 0 } = req.query;

    // Build where clause
    const where = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Fetch invoices
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          lineItems: true
        }
      }),
      prisma.invoice.count({ where })
    ]);

    // Calculate summary
    const summary = await prisma.invoice.aggregate({
      where,
      _sum: {
        totalAmount: true,
        paidAmount: true
      },
      _avg: {
        totalAmount: true
      }
    });

    res.json({
      success: true,
      data: {
        invoices,
        summary: {
          total: total,
          totalValue: summary._sum.totalAmount || 0,
          totalPaid: summary._sum.paidAmount || 0,
          averageValue: summary._avg.totalAmount || 0,
          outstanding: (summary._sum.totalAmount || 0) - (summary._sum.paidAmount || 0)
        },
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total
        }
      }
    });
  })
);

/**
 * POST /api/financial/invoices
 * Create new invoice
 */
router.post('/invoices',
  requireAuth,
  requireRole(['admin', 'manager']),
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    const data = financialSchemas.invoice.create.parse(req.body);

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    const lineItems = data.items.map(item => {
      const lineTotal = item.quantity * item.unitPrice;
      const lineTax = lineTotal * (item.taxRate / 100);
      subtotal += lineTotal;
      taxAmount += lineTax;
      return {
        ...item,
        lineTotal,
        taxAmount: lineTax
      };
    });
    const totalAmount = subtotal + taxAmount;

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { invoiceNumber: 'desc' }
    });
    const invoiceNumber = lastInvoice ? 
      `INV-${String(parseInt(lastInvoice.invoiceNumber.split('-')[1]) + 1).padStart(5, '0')}` : 
      'INV-00001';

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        subtotal,
        taxAmount,
        totalAmount,
        dueDate: new Date(data.dueDate),
        terms: data.terms,
        notes: data.notes,
        status: 'draft',
        lineItems: {
          create: lineItems
        },
        createdBy: req.userId
      },
      include: {
        lineItems: true
      }
    });

    res.status(201).json({
      success: true,
      data: invoice
    });
  })
);

/**
 * GET /api/financial/expenses
 * Get expenses with filters
 */
router.get('/expenses',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const { category, vendor, startDate, endDate, limit = 50, offset = 0 } = req.query;

    // Build where clause
    const where = {};
    if (category) where.category = category;
    if (vendor) where.vendor = { contains: vendor, mode: 'insensitive' };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Fetch expenses
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { date: 'desc' }
      }),
      prisma.expense.count({ where })
    ]);

    // Calculate summary by category
    const categoryTotals = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: {
        amount: true
      },
      _count: true
    });

    res.json({
      success: true,
      data: {
        expenses,
        summary: {
          total: total,
          totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
          byCategory: categoryTotals.map(cat => ({
            category: cat.category,
            total: cat._sum.amount || 0,
            count: cat._count
          }))
        },
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total
        }
      }
    });
  })
);

/**
 * POST /api/financial/expenses
 * Create new expense
 */
router.post('/expenses',
  requireAuth,
  requireRole(['admin', 'manager', 'operator']),
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    const data = financialSchemas.expense.create.parse(req.body);

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        ...data,
        date: new Date(data.date),
        status: 'pending',
        createdBy: req.userId
      }
    });

    // Update cash flow
    await prisma.cashFlow.create({
      data: {
        type: 'outflow',
        category: 'operating',
        amount: data.amount,
        description: `Expense: ${data.description}`,
        reference: expense.id,
        date: new Date(data.date)
      }
    });

    res.status(201).json({
      success: true,
      data: expense
    });
  })
);

/**
 * GET /api/financial/profitability
 * Get profitability analysis
 */
router.get('/profitability',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const { period = '12m', groupBy = 'month' } = req.query;

    // Calculate date range
    const months = parseInt(period.replace('m', ''));
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get revenue and expense data
    const revenueData = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${groupBy}, created_at) as period,
        SUM(total_amount) as revenue
      FROM invoices
      WHERE created_at >= ${startDate}
        AND status IN ('paid', 'partial')
      GROUP BY period
      ORDER BY period ASC
    `;

    const expenseData = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${groupBy}, date) as period,
        category,
        SUM(amount) as expenses
      FROM expenses
      WHERE date >= ${startDate}
      GROUP BY period, category
      ORDER BY period ASC
    `;

    // Calculate profitability metrics
    const profitability = revenueData.map(rev => {
      const periodExpenses = expenseData
        .filter(exp => exp.period.getTime() === rev.period.getTime())
        .reduce((sum, exp) => sum + parseFloat(exp.expenses), 0);
      
      const netProfit = parseFloat(rev.revenue) - periodExpenses;
      const margin = rev.revenue > 0 ? (netProfit / parseFloat(rev.revenue)) * 100 : 0;

      return {
        period: rev.period,
        revenue: parseFloat(rev.revenue),
        expenses: periodExpenses,
        netProfit,
        profitMargin: margin,
        growth: 0 // Would calculate month-over-month growth
      };
    });

    res.json({
      success: true,
      data: {
        period,
        groupBy,
        profitability,
        summary: {
          totalRevenue: profitability.reduce((sum, p) => sum + p.revenue, 0),
          totalExpenses: profitability.reduce((sum, p) => sum + p.expenses, 0),
          totalProfit: profitability.reduce((sum, p) => sum + p.netProfit, 0),
          averageMargin: profitability.reduce((sum, p) => sum + p.profitMargin, 0) / profitability.length
        }
      }
    });
  })
);

/**
 * GET /api/financial/overview
 * Get comprehensive financial overview
 */
router.get('/overview',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const cacheKey = `financial-overview-${req.userId}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        data: cached,
        cached: true
      });
    }

    // Get current date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    try {
      // Get revenue data
      const [currentRevenue, lastMonthRevenue, yearRevenue] = await Promise.all([
        prisma.invoice.aggregate({
          where: {
            status: { in: ['paid', 'partial'] },
            createdAt: { gte: startOfMonth }
          },
          _sum: { totalAmount: true }
        }),
        prisma.invoice.aggregate({
          where: {
            status: { in: ['paid', 'partial'] },
            createdAt: { gte: lastMonth, lte: endOfLastMonth }
          },
          _sum: { totalAmount: true }
        }),
        prisma.invoice.aggregate({
          where: {
            status: { in: ['paid', 'partial'] },
            createdAt: { gte: startOfYear }
          },
          _sum: { totalAmount: true }
        })
      ]);

      // Get expense data
      const [currentExpenses, lastMonthExpenses, yearExpenses] = await Promise.all([
        prisma.expense.aggregate({
          where: { date: { gte: startOfMonth } },
          _sum: { amount: true }
        }),
        prisma.expense.aggregate({
          where: { date: { gte: lastMonth, lte: endOfLastMonth } },
          _sum: { amount: true }
        }),
        prisma.expense.aggregate({
          where: { date: { gte: startOfYear } },
          _sum: { amount: true }
        })
      ]);

      // Get cash flow data
      const cashFlow = await prisma.cashFlow.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { amount: true }
      });

      // Calculate summary metrics
      const revenue = currentRevenue._sum.totalAmount || 0;
      const expenses = currentExpenses._sum.amount || 0;
      const profit = revenue - expenses;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

      // Get working capital components (simplified)
      const [inventory, receivables, cash] = await Promise.all([
        prisma.$queryRaw`SELECT COALESCE(SUM(quantity * unit_price), 0) as total_value FROM inventory_items`,
        prisma.invoice.aggregate({
          where: { status: { in: ['sent', 'overdue'] } },
          _sum: { totalAmount: true }
        }),
        prisma.cashFlow.aggregate({
          _sum: { amount: true }
        })
      ]);

      const workingCapital = (inventory[0]?.total_value || 0) +
                           (receivables._sum.totalAmount || 0) +
                           (cash._sum.amount || 0);

      // Build response data structure
      const overviewData = {
        summary: {
          revenue,
          expenses,
          profit,
          profitMargin,
          cashFlow: cashFlow._sum.amount || 0,
          workingCapital,
          currentRatio: 1.85, // Would calculate from actual liabilities
          quickRatio: 1.42    // Would calculate from actual quick assets
        },
        revenueBreakdown: [
          { source: 'Product Sales', amount: revenue * 0.751, percentage: 75.1 },
          { source: 'Services', amount: revenue * 0.186, percentage: 18.6 },
          { source: 'Licensing', amount: revenue * 0.063, percentage: 6.3 }
        ],
        expenseBreakdown: [
          { category: 'Raw Materials', amount: expenses * 0.40, percentage: 40 },
          { category: 'Labor', amount: expenses * 0.30, percentage: 30 },
          { category: 'Operations', amount: expenses * 0.20, percentage: 20 },
          { category: 'Marketing', amount: expenses * 0.10, percentage: 10 }
        ],
        cashFlowTrend: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          operating: 0,
          investing: [-120000, -85000, -95000, -110000, -75000, -90000],
          financing: [-50000, -45000, -55000, -48000, -52000, -47000]
        },
        profitTrend: {
          labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
          revenue: [revenue * 0.85, revenue * 0.90, revenue * 0.95, revenue],
          profit: [profit * 0.85, profit * 0.90, profit * 0.95, profit],
          margin: [profitMargin * 0.95, profitMargin * 0.98, profitMargin * 0.99, profitMargin]
        },
        keyRatios: {
          grossMargin: 42.5,
          operatingMargin: 28.3,
          netMargin: profitMargin,
          roe: 18.7,
          roa: 12.4,
          debtToEquity: 0.45
        },
        budgetComparison: {
          revenue: {
            actual: revenue,
            budget: revenue * 0.98,
            variance: revenue > 0 ? ((revenue - revenue * 0.98) / (revenue * 0.98)) * 100 : 0
          },
          expenses: {
            actual: expenses,
            budget: expenses * 1.03,
            variance: expenses > 0 ? ((expenses - expenses * 1.03) / (expenses * 1.03)) * 100 : 0
          },
          profit: {
            actual: profit,
            budget: profit * 0.80,
            variance: profit > 0 ? ((profit - profit * 0.80) / (profit * 0.80)) * 100 : 0
          }
        }
      };

      // Cache the result
      cache.set(cacheKey, overviewData);

      res.json({
        success: true,
        data: overviewData
      });

    } catch (error) {
      logError('[Financial Reports API] Error:', error);
      res.status(500).json({
        error: 'Failed to fetch financial reports. Please ensure database connection is active.',
        message: error.message
      });
    }
  })
);

/**
 * GET /api/financial/pl-analysis
 * Get P&L analysis data by month
 */
router.get('/pl-analysis',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const cacheKey = 'pl_analysis_data';
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    try {
      // Generate mock P&L data for demonstration
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const plData = months.map((month, index) => {
        // Generate realistic but varied data with seasonal patterns
        const baseRevenue = 1200 + (Math.sin(index * 0.5) * 200) + (Math.random() * 100);
        const seasonalFactor = 1 + (Math.sin(index * 0.5) * 0.15);
        
        const revenue = Math.round(baseRevenue * seasonalFactor);
        const grossProfit = Math.round(revenue * (0.55 + Math.random() * 0.15)); // 55-70% gross margin
        const ebitda = Math.round(revenue * (0.18 + Math.random() * 0.08)); // 18-26% EBITDA margin
        const grossMarginPercent = Number(((grossProfit / revenue) * 100).toFixed(1));
        
        return {
          month,
          revenue,
          grossProfit,
          ebitda,
          grossMarginPercent
        };
      });

      const result = {
        success: true,
        data: plData,
        timestamp: new Date().toISOString()
      };

      // Cache for 5 minutes
      cache.set(cacheKey, result, 300);
      
      res.json(result);

    } catch (error) {
      logError('[P&L Analysis API] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch P&L analysis data',
        message: error.message
      });
    }
  })
);

/**
 * GET /api/financial/pl-summary
 * Get P&L summary metrics
 */
router.get('/pl-summary',
  requireAuth,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const { period = 'year' } = req.query;
    const cacheKey = `pl_summary_${period}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    try {
      // Mock summary calculations
      const mockTotalRevenue = 15840;
      const mockTotalGrossProfit = 9860;
      const mockTotalEbitda = 3420;
      
      const summaryData = {
        totalRevenue: mockTotalRevenue,
        totalGrossProfit: mockTotalGrossProfit,
        totalEbitda: mockTotalEbitda,
        avgGrossMargin: Number(((mockTotalGrossProfit / mockTotalRevenue) * 100).toFixed(1)),
        avgEbitdaMargin: Number(((mockTotalEbitda / mockTotalRevenue) * 100).toFixed(1)),
        period
      };

      const result = {
        success: true,
        data: summaryData,
        timestamp: new Date().toISOString()
      };

      // Cache for 10 minutes
      cache.set(cacheKey, result, 600);
      
      res.json(result);

    } catch (error) {
      logError('[P&L Summary API] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch P&L summary data',
        message: error.message
      });
    }
  })
);

export default router;