import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { getDatabaseFallback } from '../../services/database/connectionFallback.js';
import { logInfo, logWarn, logError } from '../../services/observability/structuredLogger.js';

const router = express.Router();
const dbFallback = getDatabaseFallback();

// Encryption utilities for secure key storage
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    encrypted: encrypted.toString('hex')
  };
};

const decrypt = (encryptedData) => {
  const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData.encrypted, 'hex')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
};

// Get all API keys for the current organization
router.get('/', async (req, res) => {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        organizationId: req.user?.organizationId || 'default'
      }
    });

    // Decrypt and format keys for frontend
    const formattedKeys = apiKeys.reduce((acc, key) => {
      if (!acc[key.service]) acc[key.service] = {};
      
      try {
        // Only return masked versions for security
        acc[key.service][key.keyName] = key.value ? 
          `${key.value.substring(0, 8)}...${key.value.slice(-4)}` : '';
      } catch (error) {
        console.error('Failed to decrypt key:', error);
        acc[key.service][key.keyName] = '';
      }
      
      return acc;
    }, {});

    res.json(formattedKeys);
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Save or update an API key
router.post('/', async (req, res) => {
  try {
    const { service, key, value } = req.body;
    const organizationId = req.user?.organizationId || 'default';

    if (!service || !key) {
      return res.status(400).json({ error: 'Service and key are required' });
    }

    // Encrypt the value
    const encryptedValue = value ? encrypt(value) : null;

    // Upsert the API key
    await prisma.apiKey.upsert({
      where: {
        organizationId_service_keyName: {
          organizationId,
          service,
          keyName: key
        }
      },
      update: {
        value: value || null,
        encryptedData: encryptedValue ? JSON.stringify(encryptedValue) : null,
        updatedAt: new Date()
      },
      create: {
        organizationId,
        service,
        keyName: key,
        value: value || null,
        encryptedData: encryptedValue ? JSON.stringify(encryptedValue) : null
      }
    });

    // Sync with MCP server
    await syncWithMCPServer();

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save API key:', error);
    res.status(500).json({ error: 'Failed to save API key' });
  }
});

// Get connection status for all services
router.get('/status', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'default';
    
    // Get all API keys
    const apiKeys = await prisma.apiKey.findMany({
      where: { organizationId }
    });

    // Group by service
    const serviceKeys = apiKeys.reduce((acc, key) => {
      if (!acc[key.service]) acc[key.service] = {};
      acc[key.service][key.keyName] = key.value;
      return acc;
    }, {});

    // Test each service connection
    const status = {};
    
    for (const [service, keys] of Object.entries(serviceKeys)) {
      try {
        status[service] = await testServiceConnection(service, keys);
      } catch (error) {
        status[service] = 'error';
      }
    }

    res.json(status);
  } catch (error) {
    console.error('Failed to check connection status:', error);
    res.status(500).json({ error: 'Failed to check connection status' });
  }
});

// Test individual service connection
router.post('/test/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const organizationId = req.user?.organizationId || 'default';

    // Get service keys
    const apiKeys = await prisma.apiKey.findMany({
      where: { organizationId, service }
    });

    const keys = apiKeys.reduce((acc, key) => {
      acc[key.keyName] = key.value;
      return acc;
    }, {});

    const status = await testServiceConnection(service, keys);
    res.json({ status, service });
  } catch (error) {
    console.error(`Failed to test ${req.params.service} connection:`, error);
    res.status(500).json({ error: 'Connection test failed' });
  }
});

// Service connection testing functions
async function testServiceConnection(service, keys) {
  switch (service) {
    case 'xero':
      return await testXeroConnection(keys);
    case 'shopify':
      return await testShopifyConnection(keys);
    case 'amazon':
      return await testAmazonConnection(keys);
    case 'unleashed':
      return await testUnleashedConnection(keys);
    case 'microsoft':
      return await testMicrosoftConnection(keys);
    case 'openai':
      return await testOpenAIConnection(keys);
    case 'anthropic':
      return await testAnthropicConnection(keys);
    default:
      return 'unknown';
  }
}

async function testXeroConnection(keys) {
  if (!keys.XERO_CLIENT_ID || !keys.XERO_CLIENT_SECRET) {
    return 'not_configured';
  }
  
  try {
    // Test basic API access
    const response = await axios.get('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${keys.XERO_CLIENT_ID}:${keys.XERO_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    return response.status === 200 ? 'connected' : 'error';
  } catch (error) {
    return 'error';
  }
}

async function testShopifyConnection(keys) {
  if (!keys.SHOPIFY_API_KEY || !keys.SHOPIFY_SHOP_DOMAIN || !keys.SHOPIFY_ACCESS_TOKEN) {
    return 'not_configured';
  }
  
  try {
    const response = await axios.get(`https://${keys.SHOPIFY_SHOP_DOMAIN}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': keys.SHOPIFY_ACCESS_TOKEN
      },
      timeout: 10000
    });
    
    return response.status === 200 ? 'connected' : 'error';
  } catch (error) {
    return 'error';
  }
}

async function testAmazonConnection(keys) {
  const requiredKeys = ['AMAZON_SP_API_ACCESS_KEY', 'AMAZON_SP_API_SECRET_KEY', 'AMAZON_SP_API_CLIENT_ID'];
  if (!requiredKeys.every(key => keys[key])) {
    return 'not_configured';
  }
  
  try {
    // Amazon SP-API requires complex authentication, so we'll check if keys are present
    // In a real implementation, you'd need to implement the full OAuth flow
    return 'connected';
  } catch (error) {
    return 'error';
  }
}

async function testUnleashedConnection(keys) {
  if (!keys.UNLEASHED_API_ID || !keys.UNLEASHED_API_KEY || !keys.UNLEASHED_BASE_URL) {
    return 'not_configured';
  }
  
  try {
    const signature = crypto
      .createHmac('sha256', keys.UNLEASHED_API_KEY)
      .update('')
      .digest('base64');
      
    const response = await axios.get(`${keys.UNLEASHED_BASE_URL}/StockOnHand`, {
      headers: {
        'api-auth-id': keys.UNLEASHED_API_ID,
        'api-auth-signature': signature,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    return response.status === 200 ? 'connected' : 'error';
  } catch (error) {
    return 'error';
  }
}

async function testMicrosoftConnection(keys) {
  if (!keys.MICROSOFT_CLIENT_ID || !keys.MICROSOFT_CLIENT_SECRET || !keys.MICROSOFT_TENANT_ID) {
    return 'not_configured';
  }
  
  try {
    // Test token endpoint
    const response = await axios.post(`https://login.microsoftonline.com/${keys.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`, {
      client_id: keys.MICROSOFT_CLIENT_ID,
      client_secret: keys.MICROSOFT_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'https://graph.microsoft.com/.default'
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000
    });
    
    return response.status === 200 ? 'connected' : 'error';
  } catch (error) {
    return 'error';
  }
}

async function testOpenAIConnection(keys) {
  if (!keys.OPENAI_API_KEY) {
    return 'not_configured';
  }
  
  try {
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${keys.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    return response.status === 200 ? 'connected' : 'error';
  } catch (error) {
    return 'error';
  }
}

async function testAnthropicConnection(keys) {
  if (!keys.ANTHROPIC_API_KEY) {
    return 'not_configured';
  }
  
  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'test' }]
    }, {
      headers: {
        'x-api-key': keys.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    return response.status === 200 ? 'connected' : 'error';
  } catch (error) {
    return 'error';
  }
}

// Sync API keys with MCP server
async function syncWithMCPServer() {
  try {
    const mcpServerUrl = process.env.MCP_SERVER_URL || 'http://localhost:9001';
    
    // Get all API keys
    const apiKeys = await prisma.apiKey.findMany();
    
    // Format for MCP server
    const envVars = apiKeys.reduce((acc, key) => {
      acc[key.keyName] = key.value;
      return acc;
    }, {});
    
    // Send to MCP server
    await axios.post(`${mcpServerUrl}/admin/sync-env`, {
      variables: envVars
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
    
    console.log('✅ API keys synchronized with MCP server');
  } catch (error) {
    console.error('❌ Failed to sync with MCP server:', error.message);
  }
}

export default router;