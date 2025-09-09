import xeroCompleteService from '../../services/integrations/xero-complete.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { method, query } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Xero API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

async function handleGet(req, res) {
  const { endpoint, ...params } = req.query;

  switch (endpoint) {
    case 'accounts':
      return await getAccountsData(req, res);
    case 'contacts':
      return await getContactsData(req, res);
    case 'invoices':
      return await getInvoicesData(req, res);
    case 'bills':
      return await getBillsData(req, res);
    case 'payments':
      return await getPaymentsData(req, res);
    case 'bank-transactions':
      return await getBankTransactionsData(req, res);
    case 'items':
      return await getItemsData(req, res);
    case 'financial-summary':
      return await getFinancialSummary(req, res);
    case 'cash-flow':
      return await getCashFlowData(req, res);
    case 'aging-report':
      return await getAgingReport(req, res);
    case 'status':
      return await getConnectionStatus(req, res);
    default:
      return res.status(400).json({ error: 'Invalid endpoint' });
  }
}

async function handlePost(req, res) {
  const { action } = req.body;

  switch (action) {
    case 'sync':
      return await triggerSync(req, res);
    case 'connect':
      return await testConnection(req, res);
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}

async function getAccountsData(req, res) {
  try {
    const { limit = 50, page = 1, type, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    if (type) {
      whereClause.account_type = type;
    }

    if (status) {
      whereClause.status = status;
    }

    const [accounts, total] = await Promise.all([
      prisma.xeroAccount.findMany({
        where: whereClause,
        skip: offset,
        take: parseInt(limit),
        orderBy: { account_code: 'asc' }
      }),
      prisma.xeroAccount.count({ where: whereClause })
    ]);

    return res.status(200).json({
      success: true,
      data: accounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch accounts data', details: error.message });
  }
}

async function getContactsData(req, res) {
  try {
    const { limit = 50, page = 1, type, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    if (type === 'customers') {
      whereClause.is_customer = true;
    } else if (type === 'suppliers') {
      whereClause.is_supplier = true;
    }

    if (search) {
      whereClause = {
        ...whereClause,
        OR: [
          { contact_name: { contains: search, mode: 'insensitive' } },
          { email_address: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const [contacts, total] = await Promise.all([
      prisma.xeroContact.findMany({
        where: whereClause,
        skip: offset,
        take: parseInt(limit),
        orderBy: { updated_date_utc: 'desc' }
      }),
      prisma.xeroContact.count({ where: whereClause })
    ]);

    return res.status(200).json({
      success: true,
      data: contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch contacts data', details: error.message });
  }
}

async function getInvoicesData(req, res) {
  try {
    const { limit = 50, page = 1, status, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }

    if (dateFrom || dateTo) {
      whereClause.date_string = {};
      if (dateFrom) whereClause.date_string.gte = dateFrom;
      if (dateTo) whereClause.date_string.lte = dateTo;
    }

    const [invoices, total] = await Promise.all([
      prisma.xeroInvoice.findMany({
        where: whereClause,
        skip: offset,
        take: parseInt(limit),
        orderBy: { updated_date_utc: 'desc' }
      }),
      prisma.xeroInvoice.count({ where: whereClause })
    ]);

    return res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch invoices data', details: error.message });
  }
}

async function getBillsData(req, res) {
  try {
    const { limit = 50, page = 1, status, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }

    if (dateFrom || dateTo) {
      whereClause.date_string = {};
      if (dateFrom) whereClause.date_string.gte = dateFrom;
      if (dateTo) whereClause.date_string.lte = dateTo;
    }

    const [bills, total] = await Promise.all([
      prisma.xeroBill.findMany({
        where: whereClause,
        skip: offset,
        take: parseInt(limit),
        orderBy: { updated_date_utc: 'desc' }
      }),
      prisma.xeroBill.count({ where: whereClause })
    ]);

    return res.status(200).json({
      success: true,
      data: bills,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch bills data', details: error.message });
  }
}

async function getPaymentsData(req, res) {
  try {
    const { limit = 50, page = 1, status, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }

    if (dateFrom || dateTo) {
      whereClause.date_string = {};
      if (dateFrom) whereClause.date_string.gte = dateFrom;
      if (dateTo) whereClause.date_string.lte = dateTo;
    }

    const [payments, total] = await Promise.all([
      prisma.xeroPayment.findMany({
        where: whereClause,
        skip: offset,
        take: parseInt(limit),
        orderBy: { updated_date_utc: 'desc' }
      }),
      prisma.xeroPayment.count({ where: whereClause })
    ]);

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch payments data', details: error.message });
  }
}

async function getBankTransactionsData(req, res) {
  try {
    const { limit = 50, page = 1, type, reconciled, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    if (type) {
      whereClause.transaction_type = type;
    }

    if (reconciled !== undefined) {
      whereClause.is_reconciled = reconciled === 'true';
    }

    if (dateFrom || dateTo) {
      whereClause.date_string = {};
      if (dateFrom) whereClause.date_string.gte = dateFrom;
      if (dateTo) whereClause.date_string.lte = dateTo;
    }

    const [transactions, total] = await Promise.all([
      prisma.xeroBankTransaction.findMany({
        where: whereClause,
        skip: offset,
        take: parseInt(limit),
        orderBy: { updated_date_utc: 'desc' }
      }),
      prisma.xeroBankTransaction.count({ where: whereClause })
    ]);

    return res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch bank transactions data', details: error.message });
  }
}

async function getItemsData(req, res) {
  try {
    const { limit = 50, page = 1, tracked } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    if (tracked !== undefined) {
      whereClause.is_tracked_as_inventory = tracked === 'true';
    }

    const [items, total] = await Promise.all([
      prisma.xeroItem.findMany({
        where: whereClause,
        skip: offset,
        take: parseInt(limit),
        orderBy: { updated_date_utc: 'desc' }
      }),
      prisma.xeroItem.count({ where: whereClause })
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch items data', details: error.message });
  }
}

async function getFinancialSummary(req, res) {
  try {
    const { period = '30' } = req.query;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);

    // Get invoice summary
    const invoiceSummary = await prisma.xeroInvoice.aggregate({
      where: {
        updated_date_utc: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        total: true,
        amount_due: true,
        amount_paid: true
      },
      _count: {
        _all: true
      }
    });

    // Get bill summary
    const billSummary = await prisma.xeroBill.aggregate({
      where: {
        updated_date_utc: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        total: true,
        amount_due: true,
        amount_paid: true
      },
      _count: {
        _all: true
      }
    });

    // Get overdue invoices
    const overdueInvoices = await prisma.xeroInvoice.count({
      where: {
        status: 'AUTHORISED',
        due_date_string: { lt: new Date().toISOString().split('T')[0] },
        amount_due: { gt: 0 }
      }
    });

    const summary = {
      invoices: {
        total: invoiceSummary._sum.total || 0,
        due: invoiceSummary._sum.amount_due || 0,
        paid: invoiceSummary._sum.amount_paid || 0,
        count: invoiceSummary._count._all
      },
      bills: {
        total: billSummary._sum.total || 0,
        due: billSummary._sum.amount_due || 0,
        paid: billSummary._sum.amount_paid || 0,
        count: billSummary._count._all
      },
      overdueInvoices,
      period: parseInt(period),
      lastSync: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get financial summary', details: error.message });
  }
}

async function getCashFlowData(req, res) {
  try {
    const { period = '90' } = req.query;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - parseInt(period) * 24 * 60 * 60 * 1000);

    const cashFlowData = await prisma.xeroBankTransaction.findMany({
      where: {
        date_string: {
          gte: startDate.toISOString().split('T')[0],
          lte: endDate.toISOString().split('T')[0]
        }
      },
      select: {
        date_string: true,
        transaction_type: true,
        total: true
      },
      orderBy: {
        date_string: 'asc'
      }
    });

    // Group by date and calculate daily cash flow
    const dailyCashFlow = cashFlowData.reduce((acc, transaction) => {
      const date = transaction.date_string;
      if (!acc[date]) {
        acc[date] = { inflow: 0, outflow: 0, net: 0 };
      }
      
      if (transaction.transaction_type === 'RECEIVE') {
        acc[date].inflow += transaction.total || 0;
      } else {
        acc[date].outflow += Math.abs(transaction.total || 0);
      }
      
      acc[date].net = acc[date].inflow - acc[date].outflow;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: {
        dailyCashFlow,
        summary: {
          totalInflow: cashFlowData
            .filter(t => t.transaction_type === 'RECEIVE')
            .reduce((sum, t) => sum + (t.total || 0), 0),
          totalOutflow: cashFlowData
            .filter(t => t.transaction_type === 'SPEND')
            .reduce((sum, t) => sum + Math.abs(t.total || 0), 0),
          period: parseInt(period)
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get cash flow data', details: error.message });
  }
}

async function getAgingReport(req, res) {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    const agingData = await prisma.xeroInvoice.groupBy({
      by: ['due_date_string'],
      where: {
        status: 'AUTHORISED',
        amount_due: { gt: 0 }
      },
      _sum: {
        amount_due: true
      }
    });

    const aging = {
      current: 0,
      thirtyDays: 0,
      sixtyDays: 0,
      ninetyDaysPlus: 0
    };

    agingData.forEach(invoice => {
      const dueDate = new Date(invoice.due_date_string);
      const amount = invoice._sum.amount_due || 0;

      if (dueDate >= today) {
        aging.current += amount;
      } else if (dueDate >= thirtyDaysAgo) {
        aging.thirtyDays += amount;
      } else if (dueDate >= sixtyDaysAgo) {
        aging.sixtyDays += amount;
      } else {
        aging.ninetyDaysPlus += amount;
      }
    });

    return res.status(200).json({
      success: true,
      data: aging
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get aging report', details: error.message });
  }
}

async function getConnectionStatus(req, res) {
  try {
    const status = {
      connected: xeroCompleteService.isConnected,
      lastSync: new Date().toISOString(),
      credentials: {
        configured: !!(process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET)
      }
    };

    return res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get connection status', details: error.message });
  }
}

async function triggerSync(req, res) {
  try {
    if (!xeroCompleteService.isConnected) {
      return res.status(400).json({ error: 'Xero not connected' });
    }

    // Trigger async sync
    xeroCompleteService.performFullSync().catch(error => {
      console.error('Xero sync failed:', error);
    });

    return res.status(200).json({
      success: true,
      message: 'Sync triggered successfully'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to trigger sync', details: error.message });
  }
}

async function testConnection(req, res) {
  try {
    await xeroCompleteService.testConnection();
    
    return res.status(200).json({
      success: true,
      message: 'Connection successful',
      connected: true
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: 'Connection failed', 
      details: error.message,
      connected: false
    });
  }
}