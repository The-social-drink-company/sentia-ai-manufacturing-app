/**
 * Xero Accounting API Routes
 * Handles Xero OAuth flow and API operations
 */

import express from 'express';
import { logError } from '../services/observability/structuredLogger.js';
import xeroService from '../services/xeroService.js';

const router = express.Router();

/**
 * GET /api/xero/auth
 * Initiate Xero OAuth flow
 */
router.get('/auth', async (req, res) => {
  try {
    const authUrl = await xeroService.getAuthUrl();
    res.json({
      success: true,
      authUrl: authUrl,
      message: 'Redirect user to this URL to authorize Xero access'
    });
  } catch (error) {
    logError('Xero auth error', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to initiate Xero authorization'
    });
  }
});

/**
 * GET /api/xero/callback
 * Handle Xero OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code not provided',
        message: 'OAuth callback failed - no authorization code'
      });
    }

    const tokenSet = await xeroService.exchangeCodeForToken(code);
    
    // Store token set securely (in production, use proper session management)
    req.session.xeroTokens = tokenSet;
    
    res.json({
      success: true,
      message: 'Successfully connected to Xero',
      tokenSet: {
        access_token: tokenSet.access_token,
        refresh_token: tokenSet.refresh_token,
        expires_at: tokenSet.expires_at
      }
    });
  } catch (error) {
    logError('Xero callback error', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to complete Xero authorization'
    });
  }
});

/**
 * GET /api/xero/organizations
 * Get connected Xero organizations
 */
router.get('/organizations', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '') || req.session?.xeroTokens?.access_token;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'No access token provided',
        message: 'Please authenticate with Xero first'
      });
    }

    const organizations = await xeroService.getOrganizations(accessToken);
    
    res.json({
      success: true,
      organizations: organizations,
      message: 'Successfully fetched organizations'
    });
  } catch (error) {
    logError('Xero organizations error', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch Xero organizations'
    });
  }
});

/**
 * GET /api/xero/contacts
 * Get contacts from Xero
 */
router.get('/contacts', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '') || req.session?.xeroTokens?.access_token;
    const { tenantId, page = 1, limit = 100 } = req.query;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'No access token provided',
        message: 'Please authenticate with Xero first'
      });
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required',
        message: 'Please provide a valid tenant ID'
      });
    }

    const contacts = await xeroService.getContacts(accessToken, tenantId, page, limit);
    
    res.json({
      success: true,
      contacts: contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: contacts.length
      },
      message: 'Successfully fetched contacts'
    });
  } catch (error) {
    logError('Xero contacts error', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch Xero contacts'
    });
  }
});

/**
 * POST /api/xero/contacts
 * Create or update contact in Xero
 */
router.post('/contacts', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '') || req.session?.xeroTokens?.access_token;
    const { tenantId, contactData } = req.body;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'No access token provided',
        message: 'Please authenticate with Xero first'
      });
    }

    if (!tenantId || !contactData) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID and contact data are required',
        message: 'Please provide valid tenant ID and contact data'
      });
    }

    const contact = await xeroService.createOrUpdateContact(accessToken, tenantId, contactData);
    
    res.json({
      success: true,
      contact: contact,
      message: 'Successfully created/updated contact'
    });
  } catch (error) {
    logError('Xero contact creation error', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create/update Xero contact'
    });
  }
});

/**
 * GET /api/xero/invoices
 * Get invoices from Xero
 */
router.get('/invoices', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '') || req.session?.xeroTokens?.access_token;
    const { tenantId, page = 1, limit = 100 } = req.query;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'No access token provided',
        message: 'Please authenticate with Xero first'
      });
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required',
        message: 'Please provide a valid tenant ID'
      });
    }

    const invoices = await xeroService.getInvoices(accessToken, tenantId, page, limit);
    
    res.json({
      success: true,
      invoices: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: invoices.length
      },
      message: 'Successfully fetched invoices'
    });
  } catch (error) {
    logError('Xero invoices error', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch Xero invoices'
    });
  }
});

/**
 * POST /api/xero/invoices
 * Create invoice in Xero
 */
router.post('/invoices', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '') || req.session?.xeroTokens?.access_token;
    const { tenantId, invoiceData } = req.body;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'No access token provided',
        message: 'Please authenticate with Xero first'
      });
    }

    if (!tenantId || !invoiceData) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID and invoice data are required',
        message: 'Please provide valid tenant ID and invoice data'
      });
    }

    const invoice = await xeroService.createInvoice(accessToken, tenantId, invoiceData);
    
    res.json({
      success: true,
      invoice: invoice,
      message: 'Successfully created invoice'
    });
  } catch (error) {
    logError('Xero invoice creation error', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create Xero invoice'
    });
  }
});

/**
 * GET /api/xero/items
 * Get items/products from Xero
 */
router.get('/items', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '') || req.session?.xeroTokens?.access_token;
    const { tenantId, page = 1, limit = 100 } = req.query;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'No access token provided',
        message: 'Please authenticate with Xero first'
      });
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required',
        message: 'Please provide a valid tenant ID'
      });
    }

    const items = await xeroService.getItems(accessToken, tenantId, page, limit);
    
    res.json({
      success: true,
      items: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: items.length
      },
      message: 'Successfully fetched items'
    });
  } catch (error) {
    logError('Xero items error', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to fetch Xero items'
    });
  }
});

/**
 * POST /api/xero/items
 * Create or update item in Xero
 */
router.post('/items', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '') || req.session?.xeroTokens?.access_token;
    const { tenantId, itemData } = req.body;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'No access token provided',
        message: 'Please authenticate with Xero first'
      });
    }

    if (!tenantId || !itemData) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID and item data are required',
        message: 'Please provide valid tenant ID and item data'
      });
    }

    const item = await xeroService.createOrUpdateItem(accessToken, tenantId, itemData);
    
    res.json({
      success: true,
      item: item,
      message: 'Successfully created/updated item'
    });
  } catch (error) {
    logError('Xero item creation error', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create/update Xero item'
    });
  }
});

/**
 * GET /api/xero/test
 * Test Xero connection
 */
router.get('/test', async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '') || req.session?.xeroTokens?.access_token;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'No access token provided',
        message: 'Please authenticate with Xero first'
      });
    }

    const result = await xeroService.testConnection(accessToken);
    
    res.json(result);
  } catch (error) {
    logError('Xero test error', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to test Xero connection'
    });
  }
});

export default router;
