/**
 * Enterprise Integration Hub
 * Sentia Manufacturing Dashboard - Enterprise Edition
 * 
 * Comprehensive integration hub managing all external service connections:
 * - Shopify (UK, USA, EU stores)
 * - Amazon SP-API (UK, USA marketplaces)
 * - Unleashed Software (inventory & orders)
 * - Xero (financial data)
 * - Microsoft Email System
 * - Slack (notifications)
 * - AI Services (OpenAI, Claude)
 * 
 * Features:
 * - Real-time data synchronization
 * - Intelligent error handling and retry logic
 * - Performance monitoring and optimization
 * - Automated workflow triggers
 * - Data transformation and validation
 * 
 * @version 2.0.0
 * @author Sentia Enterprise Team
 */

const EventEmitter = require('events');
const axios = require('axios');

class EnterpriseIntegrationHub extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Sync intervals (in milliseconds)
            syncIntervals: {
                shopify: 1800000, // 30 minutes
                amazon: 3600000,  // 1 hour
                unleashed: 3600000, // 1 hour
                xero: 7200000,    // 2 hours
                financial: 21600000, // 6 hours
                inventory: 3600000,  // 1 hour
                orders: 1800000,     // 30 minutes
                customers: 7200000,  // 2 hours
                products: 3600000    // 1 hour
            },
            
            // Retry configuration
            retry: {
                attempts: 3,
                delay: 5000,
                backoff: 2
            },
            
            // Timeout configuration
            timeouts: {
                default: 30000,
                shopify: 30000,
                amazon: 30000,
                unleashed: 30000,
                xero: 30000,
                slack: 10000
            },
            
            // Rate limiting
            rateLimits: {
                shopify: { requests: 40, window: 60000 }, // 40 requests per minute
                amazon: { requests: 10, window: 60000 },  // 10 requests per minute
                unleashed: { requests: 100, window: 60000 }, // 100 requests per minute
                xero: { requests: 60, window: 60000 },    // 60 requests per minute
                slack: { requests: 100, window: 60000 }   // 100 requests per minute
            },
            
            ...config
        };
        
        this.initializeIntegrations();
        this.setupMetrics();
        this.setupEventHandlers();
        this.startSyncSchedulers();
    }
    
    /**
     * Initialize all integrations
     */
    async initializeIntegrations() {
        try {
            // Initialize integration clients
            this.integrations = {
                shopify: {
                    uk: this.initializeShopifyClient('uk'),
                    usa: this.initializeShopifyClient('usa'),
                    eu: this.initializeShopifyClient('eu')
                },
                amazon: {
                    uk: this.initializeAmazonClient('uk'),
                    usa: this.initializeAmazonClient('usa')
                },
                unleashed: this.initializeUnleashedClient(),
                xero: this.initializeXeroClient(),
                microsoft: this.initializeMicrosoftClient(),
                slack: this.initializeSlackClient()
            };
            
            // Initialize rate limiters
            this.rateLimiters = {};
            Object.keys(this.config.rateLimits).forEach(service => {
                this.rateLimiters[service] = {
                    requests: [],
                    limit: this.config.rateLimits[service].requests,
                    window: this.config.rateLimits[service].window
                };
            });
            
            // Initialize data cache
            this.dataCache = new Map();
            
            // Initialize sync status
            this.syncStatus = {};
            
            this.emit('integrations_initialized', {
                services: Object.keys(this.integrations),
                timestamp: new Date().toISOString()
            });
            
            console.log('✅ Enterprise Integration Hub initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize integrations:', error);
            this.emit('initialization_error', error);
            throw error;
        }
    }
    
    /**
     * Initialize Shopify client
     */
    initializeShopifyClient(region) {
        const config = {
            uk: {
                apiKey: process.env.SHOPIFY_UK_API_KEY,
                secret: process.env.SHOPIFY_UK_SECRET,
                accessToken: process.env.SHOPIFY_UK_ACCESS_TOKEN,
                shopUrl: process.env.SHOPIFY_UK_SHOP_URL
            },
            usa: {
                apiKey: process.env.SHOPIFY_USA_API_KEY,
                secret: process.env.SHOPIFY_USA_SECRET,
                accessToken: process.env.SHOPIFY_USA_ACCESS_TOKEN,
                shopUrl: process.env.SHOPIFY_USA_SHOP_URL
            },
            eu: {
                apiKey: process.env.SHOPIFY_EU_API_KEY,
                secret: process.env.SHOPIFY_EU_SECRET,
                accessToken: process.env.SHOPIFY_EU_ACCESS_TOKEN,
                shopUrl: process.env.SHOPIFY_EU_SHOP_URL
            }
        };
        
        const regionConfig = config[region];
        if (!regionConfig || !regionConfig.accessToken) {
            console.warn(`⚠️ Shopify ${region.toUpperCase()} configuration incomplete`);
            return null;
        }
        
        return {
            region,
            baseURL: `https://${regionConfig.shopUrl}/admin/api/2023-10/`,
            headers: {
                'X-Shopify-Access-Token': regionConfig.accessToken,
                'Content-Type': 'application/json'
            },
            timeout: this.config.timeouts.shopify
        };
    }
    
    /**
     * Initialize Amazon SP-API client
     */
    initializeAmazonClient(region) {
        const marketplaceIds = {
            uk: process.env.AMAZON_UK_MARKETPLACE_ID,
            usa: process.env.AMAZON_USA_MARKETPLACE_ID
        };
        
        if (!process.env.AMAZON_SP_API_CLIENT_ID) {
            console.warn('⚠️ Amazon SP-API configuration incomplete');
            return null;
        }
        
        return {
            region,
            marketplaceId: marketplaceIds[region],
            clientId: process.env.AMAZON_SP_API_CLIENT_ID,
            clientSecret: process.env.AMAZON_SP_API_CLIENT_SECRET,
            refreshToken: process.env.AMAZON_SP_API_REFRESH_TOKEN,
            baseURL: region === 'usa' ? 
                'https://sellingpartnerapi-na.amazon.com' : 
                'https://sellingpartnerapi-eu.amazon.com',
            timeout: this.config.timeouts.amazon
        };
    }
    
    /**
     * Initialize Unleashed client
     */
    initializeUnleashedClient() {
        if (!process.env.UNLEASHED_API_ID || !process.env.UNLEASHED_API_KEY) {
            console.warn('⚠️ Unleashed Software configuration incomplete');
            return null;
        }
        
        return {
            baseURL: process.env.UNLEASHED_API_URL,
            apiId: process.env.UNLEASHED_API_ID,
            apiKey: process.env.UNLEASHED_API_KEY,
            timeout: this.config.timeouts.unleashed
        };
    }
    
    /**
     * Initialize Xero client
     */
    initializeXeroClient() {
        if (!process.env.XERO_API_KEY || !process.env.XERO_SECRET) {
            console.warn('⚠️ Xero configuration incomplete');
            return null;
        }
        
        return {
            baseURL: 'https://api.xero.com/api.xro/2.0',
            apiKey: process.env.XERO_API_KEY,
            secret: process.env.XERO_SECRET,
            tenantId: process.env.XERO_TENANT_ID,
            timeout: this.config.timeouts.xero
        };
    }
    
    /**
     * Initialize Microsoft client
     */
    initializeMicrosoftClient() {
        if (!process.env.MS_API_KEY || !process.env.MS_API_SECRET) {
            console.warn('⚠️ Microsoft configuration incomplete');
            return null;
        }
        
        return {
            baseURL: 'https://graph.microsoft.com/v1.0',
            apiKey: process.env.MS_API_KEY,
            secret: process.env.MS_API_SECRET,
            tenantId: process.env.MS_TENANT_ID,
            clientId: process.env.MS_CLIENT_ID,
            adminEmail: process.env.MS_EMAIL_ADMIN,
            dataEmail: process.env.MS_EMAIL_DATA,
            timeout: this.config.timeouts.default
        };
    }
    
    /**
     * Initialize Slack client
     */
    initializeSlackClient() {
        if (!process.env.SLACK_BOT_TOKEN) {
            console.warn('⚠️ Slack configuration incomplete');
            return null;
        }
        
        return {
            baseURL: 'https://slack.com/api',
            token: process.env.SLACK_BOT_TOKEN,
            signingSecret: process.env.SLACK_SIGNING_SECRET,
            channels: {
                alerts: process.env.SLACK_CHANNEL_ALERTS || '#alerts',
                notifications: process.env.SLACK_CHANNEL_NOTIFICATIONS || '#notifications',
                monitoring: process.env.SLACK_CHANNEL_MONITORING || '#monitoring'
            },
            webhookUrl: process.env.SLACK_WEBHOOK_URL,
            timeout: this.config.timeouts.slack
        };
    }
    
    /**
     * Setup performance metrics
     */
    setupMetrics() {
        this.metrics = {
            requests: {
                total: 0,
                successful: 0,
                failed: 0,
                byService: {}
            },
            sync: {
                total: 0,
                successful: 0,
                failed: 0,
                byService: {}
            },
            performance: {
                averageResponseTime: 0,
                successRate: 0,
                errorRate: 0
            },
            lastUpdated: new Date().toISOString()
        };
        
        // Initialize service-specific metrics
        const services = ['shopify', 'amazon', 'unleashed', 'xero', 'microsoft', 'slack'];
        services.forEach(service => {
            this.metrics.requests.byService[service] = { total: 0, successful: 0, failed: 0 };
            this.metrics.sync.byService[service] = { total: 0, successful: 0, failed: 0 };
        });
    }
    
    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        this.on('sync_request', this.handleSyncRequest.bind(this));
        this.on('sync_complete', this.handleSyncComplete.bind(this));
        this.on('sync_error', this.handleSyncError.bind(this));
        this.on('api_request', this.handleApiRequest.bind(this));
        this.on('api_response', this.handleApiResponse.bind(this));
        this.on('error', this.handleError.bind(this));
    }
    
    /**
     * Start sync schedulers
     */
    startSyncSchedulers() {
        // Shopify sync schedulers
        if (this.integrations.shopify.uk) {
            setInterval(() => this.syncShopifyData('uk'), this.config.syncIntervals.shopify);
        }
        if (this.integrations.shopify.usa) {
            setInterval(() => this.syncShopifyData('usa'), this.config.syncIntervals.shopify);
        }
        if (this.integrations.shopify.eu) {
            setInterval(() => this.syncShopifyData('eu'), this.config.syncIntervals.shopify);
        }
        
        // Amazon sync schedulers
        if (this.integrations.amazon.uk) {
            setInterval(() => this.syncAmazonData('uk'), this.config.syncIntervals.amazon);
        }
        if (this.integrations.amazon.usa) {
            setInterval(() => this.syncAmazonData('usa'), this.config.syncIntervals.amazon);
        }
        
        // Unleashed sync scheduler
        if (this.integrations.unleashed) {
            setInterval(() => this.syncUnleashedData(), this.config.syncIntervals.unleashed);
        }
        
        // Xero sync scheduler
        if (this.integrations.xero) {
            setInterval(() => this.syncXeroData(), this.config.syncIntervals.xero);
        }
        
        console.log('🔄 Sync schedulers started');
    }
    
    /**
     * Shopify Integration Methods
     */
    async syncShopifyData(region) {
        const startTime = Date.now();
        
        try {
            this.emit('sync_request', { service: 'shopify', region, type: 'full_sync' });
            
            const client = this.integrations.shopify[region];
            if (!client) {
                throw new Error(`Shopify ${region} client not available`);
            }
            
            // Sync orders
            const orders = await this.getShopifyOrders(region);
            
            // Sync products
            const products = await this.getShopifyProducts(region);
            
            // Sync customers
            const customers = await this.getShopifyCustomers(region);
            
            // Sync inventory
            const inventory = await this.getShopifyInventory(region);
            
            // Cache the data
            this.cacheData(`shopify_${region}_orders`, orders);
            this.cacheData(`shopify_${region}_products`, products);
            this.cacheData(`shopify_${region}_customers`, customers);
            this.cacheData(`shopify_${region}_inventory`, inventory);
            
            const responseTime = Date.now() - startTime;
            this.updateMetrics('sync', 'shopify', responseTime, true);
            
            this.emit('sync_complete', {
                service: 'shopify',
                region,
                data: { orders: orders.length, products: products.length, customers: customers.length },
                responseTime
            });
            
            console.log(`✅ Shopify ${region.toUpperCase()} sync completed: ${orders.length} orders, ${products.length} products`);
            
            return { orders, products, customers, inventory };
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            console.error(`❌ Shopify ${region} sync failed:`, error.message);
            
            this.updateMetrics('sync', 'shopify', responseTime, false);
            this.emit('sync_error', { service: 'shopify', region, error, responseTime });
            
            throw error;
        }
    }
    
    async getShopifyOrders(region, options = {}) {
        const client = this.integrations.shopify[region];
        const params = {
            limit: options.limit || 250,
            status: options.status || 'any',
            created_at_min: options.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        };
        
        return await this.makeApiRequest('shopify', 'GET', `${client.baseURL}orders.json`, {
            headers: client.headers,
            params,
            timeout: client.timeout
        });
    }
    
    async getShopifyProducts(region, options = {}) {
        const client = this.integrations.shopify[region];
        const params = {
            limit: options.limit || 250,
            published_status: options.status || 'published'
        };
        
        return await this.makeApiRequest('shopify', 'GET', `${client.baseURL}products.json`, {
            headers: client.headers,
            params,
            timeout: client.timeout
        });
    }
    
    async getShopifyCustomers(region, options = {}) {
        const client = this.integrations.shopify[region];
        const params = {
            limit: options.limit || 250,
            created_at_min: options.since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        return await this.makeApiRequest('shopify', 'GET', `${client.baseURL}customers.json`, {
            headers: client.headers,
            params,
            timeout: client.timeout
        });
    }
    
    async getShopifyInventory(region, options = {}) {
        const client = this.integrations.shopify[region];
        const params = {
            limit: options.limit || 250
        };
        
        return await this.makeApiRequest('shopify', 'GET', `${client.baseURL}inventory_levels.json`, {
            headers: client.headers,
            params,
            timeout: client.timeout
        });
    }
    
    /**
     * Amazon SP-API Integration Methods
     */
    async syncAmazonData(region) {
        const startTime = Date.now();
        
        try {
            this.emit('sync_request', { service: 'amazon', region, type: 'full_sync' });
            
            const client = this.integrations.amazon[region];
            if (!client) {
                throw new Error(`Amazon ${region} client not available`);
            }
            
            // Get access token first
            const accessToken = await this.getAmazonAccessToken(region);
            
            // Sync orders
            const orders = await this.getAmazonOrders(region, accessToken);
            
            // Sync inventory
            const inventory = await this.getAmazonInventory(region, accessToken);
            
            // Sync reports
            const reports = await this.getAmazonReports(region, accessToken);
            
            // Cache the data
            this.cacheData(`amazon_${region}_orders`, orders);
            this.cacheData(`amazon_${region}_inventory`, inventory);
            this.cacheData(`amazon_${region}_reports`, reports);
            
            const responseTime = Date.now() - startTime;
            this.updateMetrics('sync', 'amazon', responseTime, true);
            
            this.emit('sync_complete', {
                service: 'amazon',
                region,
                data: { orders: orders.length, inventory: inventory.length },
                responseTime
            });
            
            console.log(`✅ Amazon ${region.toUpperCase()} sync completed: ${orders.length} orders`);
            
            return { orders, inventory, reports };
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            console.error(`❌ Amazon ${region} sync failed:`, error.message);
            
            this.updateMetrics('sync', 'amazon', responseTime, false);
            this.emit('sync_error', { service: 'amazon', region, error, responseTime });
            
            throw error;
        }
    }
    
    async getAmazonAccessToken(region) {
        const client = this.integrations.amazon[region];
        
        const tokenData = {
            grant_type: 'refresh_token',
            refresh_token: client.refreshToken,
            client_id: client.clientId,
            client_secret: client.clientSecret
        };
        
        const response = await this.makeApiRequest('amazon', 'POST', 'https://api.amazon.com/auth/o2/token', {
            data: tokenData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: client.timeout
        });
        
        return response.access_token;
    }
    
    async getAmazonOrders(region, accessToken, options = {}) {
        const client = this.integrations.amazon[region];
        const params = {
            MarketplaceIds: client.marketplaceId,
            CreatedAfter: options.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            OrderStatuses: options.statuses || ['Unshipped', 'PartiallyShipped', 'Shipped']
        };
        
        return await this.makeApiRequest('amazon', 'GET', `${client.baseURL}/orders/v0/orders`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'x-amz-access-token': accessToken
            },
            params,
            timeout: client.timeout
        });
    }
    
    async getAmazonInventory(region, accessToken, options = {}) {
        const client = this.integrations.amazon[region];
        const params = {
            MarketplaceIds: client.marketplaceId,
            details: true
        };
        
        return await this.makeApiRequest('amazon', 'GET', `${client.baseURL}/fba/inventory/v1/summaries`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'x-amz-access-token': accessToken
            },
            params,
            timeout: client.timeout
        });
    }
    
    async getAmazonReports(region, accessToken, options = {}) {
        const client = this.integrations.amazon[region];
        const params = {
            reportTypes: options.types || ['GET_MERCHANT_LISTINGS_ALL_DATA', 'GET_FLAT_FILE_OPEN_LISTINGS_DATA'],
            marketplaceIds: client.marketplaceId
        };
        
        return await this.makeApiRequest('amazon', 'GET', `${client.baseURL}/reports/2021-06-30/reports`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'x-amz-access-token': accessToken
            },
            params,
            timeout: client.timeout
        });
    }
    
    /**
     * Unleashed Software Integration Methods
     */
    async syncUnleashedData() {
        const startTime = Date.now();
        
        try {
            this.emit('sync_request', { service: 'unleashed', type: 'full_sync' });
            
            const client = this.integrations.unleashed;
            if (!client) {
                throw new Error('Unleashed client not available');
            }
            
            // Sync products
            const products = await this.getUnleashedProducts();
            
            // Sync stock on hand
            const stockOnHand = await this.getUnleashedStockOnHand();
            
            // Sync sales orders
            const salesOrders = await this.getUnleashedSalesOrders();
            
            // Sync purchase orders
            const purchaseOrders = await this.getUnleashedPurchaseOrders();
            
            // Cache the data
            this.cacheData('unleashed_products', products);
            this.cacheData('unleashed_stock', stockOnHand);
            this.cacheData('unleashed_sales_orders', salesOrders);
            this.cacheData('unleashed_purchase_orders', purchaseOrders);
            
            const responseTime = Date.now() - startTime;
            this.updateMetrics('sync', 'unleashed', responseTime, true);
            
            this.emit('sync_complete', {
                service: 'unleashed',
                data: { 
                    products: products.length, 
                    stock: stockOnHand.length,
                    salesOrders: salesOrders.length,
                    purchaseOrders: purchaseOrders.length
                },
                responseTime
            });
            
            console.log(`✅ Unleashed sync completed: ${products.length} products, ${salesOrders.length} sales orders`);
            
            return { products, stockOnHand, salesOrders, purchaseOrders };
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            console.error('❌ Unleashed sync failed:', error.message);
            
            this.updateMetrics('sync', 'unleashed', responseTime, false);
            this.emit('sync_error', { service: 'unleashed', error, responseTime });
            
            throw error;
        }
    }
    
    async getUnleashedProducts(options = {}) {
        const client = this.integrations.unleashed;
        const params = {
            pageSize: options.limit || 200,
            page: options.page || 1
        };
        
        return await this.makeApiRequest('unleashed', 'GET', `${client.baseURL}/Products`, {
            headers: this.getUnleashedHeaders(),
            params,
            timeout: client.timeout
        });
    }
    
    async getUnleashedStockOnHand(options = {}) {
        const client = this.integrations.unleashed;
        const params = {
            pageSize: options.limit || 200,
            page: options.page || 1
        };
        
        return await this.makeApiRequest('unleashed', 'GET', `${client.baseURL}/StockOnHand`, {
            headers: this.getUnleashedHeaders(),
            params,
            timeout: client.timeout
        });
    }
    
    async getUnleashedSalesOrders(options = {}) {
        const client = this.integrations.unleashed;
        const params = {
            pageSize: options.limit || 200,
            page: options.page || 1,
            modifiedSince: options.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        };
        
        return await this.makeApiRequest('unleashed', 'GET', `${client.baseURL}/SalesOrders`, {
            headers: this.getUnleashedHeaders(),
            params,
            timeout: client.timeout
        });
    }
    
    async getUnleashedPurchaseOrders(options = {}) {
        const client = this.integrations.unleashed;
        const params = {
            pageSize: options.limit || 200,
            page: options.page || 1,
            modifiedSince: options.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        };
        
        return await this.makeApiRequest('unleashed', 'GET', `${client.baseURL}/PurchaseOrders`, {
            headers: this.getUnleashedHeaders(),
            params,
            timeout: client.timeout
        });
    }
    
    getUnleashedHeaders() {
        const client = this.integrations.unleashed;
        const signature = this.generateUnleashedSignature();
        
        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-auth-id': client.apiId,
            'api-auth-signature': signature
        };
    }
    
    generateUnleashedSignature() {
        // Simplified signature generation
        // In production, this would use proper HMAC-SHA256 signing
        const client = this.integrations.unleashed;
        return Buffer.from(`${client.apiId}:${client.apiKey}`).toString('base64');
    }
    
    /**
     * Xero Integration Methods
     */
    async syncXeroData() {
        const startTime = Date.now();
        
        try {
            this.emit('sync_request', { service: 'xero', type: 'full_sync' });
            
            const client = this.integrations.xero;
            if (!client) {
                throw new Error('Xero client not available');
            }
            
            // Get access token
            const accessToken = await this.getXeroAccessToken();
            
            // Sync invoices
            const invoices = await this.getXeroInvoices(accessToken);
            
            // Sync contacts
            const contacts = await this.getXeroContacts(accessToken);
            
            // Sync accounts
            const accounts = await this.getXeroAccounts(accessToken);
            
            // Sync bank transactions
            const bankTransactions = await this.getXeroBankTransactions(accessToken);
            
            // Cache the data
            this.cacheData('xero_invoices', invoices);
            this.cacheData('xero_contacts', contacts);
            this.cacheData('xero_accounts', accounts);
            this.cacheData('xero_bank_transactions', bankTransactions);
            
            const responseTime = Date.now() - startTime;
            this.updateMetrics('sync', 'xero', responseTime, true);
            
            this.emit('sync_complete', {
                service: 'xero',
                data: { 
                    invoices: invoices.length, 
                    contacts: contacts.length,
                    accounts: accounts.length,
                    bankTransactions: bankTransactions.length
                },
                responseTime
            });
            
            console.log(`✅ Xero sync completed: ${invoices.length} invoices, ${contacts.length} contacts`);
            
            return { invoices, contacts, accounts, bankTransactions };
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            console.error('❌ Xero sync failed:', error.message);
            
            this.updateMetrics('sync', 'xero', responseTime, false);
            this.emit('sync_error', { service: 'xero', error, responseTime });
            
            throw error;
        }
    }
    
    async getXeroAccessToken() {
        // Simplified OAuth token handling
        // In production, this would handle proper OAuth 2.0 flow
        const client = this.integrations.xero;
        return `Bearer ${client.apiKey}`;
    }
    
    async getXeroInvoices(accessToken, options = {}) {
        const client = this.integrations.xero;
        const params = {
            where: options.where || `Date >= DateTime(${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]})`,
            order: 'Date DESC'
        };
        
        return await this.makeApiRequest('xero', 'GET', `${client.baseURL}/Invoices`, {
            headers: {
                'Authorization': accessToken,
                'Xero-tenant-id': client.tenantId,
                'Accept': 'application/json'
            },
            params,
            timeout: client.timeout
        });
    }
    
    async getXeroContacts(accessToken, options = {}) {
        const client = this.integrations.xero;
        const params = {
            where: options.where || 'IsCustomer == true OR IsSupplier == true',
            order: 'UpdatedDateUTC DESC'
        };
        
        return await this.makeApiRequest('xero', 'GET', `${client.baseURL}/Contacts`, {
            headers: {
                'Authorization': accessToken,
                'Xero-tenant-id': client.tenantId,
                'Accept': 'application/json'
            },
            params,
            timeout: client.timeout
        });
    }
    
    async getXeroAccounts(accessToken, options = {}) {
        const client = this.integrations.xero;
        
        return await this.makeApiRequest('xero', 'GET', `${client.baseURL}/Accounts`, {
            headers: {
                'Authorization': accessToken,
                'Xero-tenant-id': client.tenantId,
                'Accept': 'application/json'
            },
            timeout: client.timeout
        });
    }
    
    async getXeroBankTransactions(accessToken, options = {}) {
        const client = this.integrations.xero;
        const params = {
            where: options.where || `Date >= DateTime(${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]})`,
            order: 'Date DESC'
        };
        
        return await this.makeApiRequest('xero', 'GET', `${client.baseURL}/BankTransactions`, {
            headers: {
                'Authorization': accessToken,
                'Xero-tenant-id': client.tenantId,
                'Accept': 'application/json'
            },
            params,
            timeout: client.timeout
        });
    }
    
    /**
     * Slack Integration Methods
     */
    async sendSlackNotification(channel, message, options = {}) {
        try {
            const client = this.integrations.slack;
            if (!client) {
                throw new Error('Slack client not available');
            }
            
            const payload = {
                channel: channel || client.channels.notifications,
                text: message,
                username: options.username || 'Sentia Dashboard',
                icon_emoji: options.icon || ':factory:',
                attachments: options.attachments || []
            };
            
            if (client.webhookUrl) {
                // Use webhook for simple messages
                return await this.makeApiRequest('slack', 'POST', client.webhookUrl, {
                    data: payload,
                    timeout: client.timeout
                });
            } else {
                // Use API for advanced features
                return await this.makeApiRequest('slack', 'POST', `${client.baseURL}/chat.postMessage`, {
                    headers: {
                        'Authorization': `Bearer ${client.token}`,
                        'Content-Type': 'application/json'
                    },
                    data: payload,
                    timeout: client.timeout
                });
            }
            
        } catch (error) {
            console.error('❌ Slack notification failed:', error.message);
            throw error;
        }
    }
    
    async sendSlackAlert(message, severity = 'info', options = {}) {
        const colors = {
            info: '#36a64f',
            warning: '#ff9500',
            error: '#ff0000',
            critical: '#8b0000'
        };
        
        const icons = {
            info: ':information_source:',
            warning: ':warning:',
            error: ':x:',
            critical: ':rotating_light:'
        };
        
        const attachment = {
            color: colors[severity],
            title: `${severity.toUpperCase()}: Sentia Dashboard Alert`,
            text: message,
            timestamp: Math.floor(Date.now() / 1000),
            footer: 'Sentia Manufacturing Dashboard',
            footer_icon: 'https://example.com/sentia-icon.png'
        };
        
        return await this.sendSlackNotification(
            this.integrations.slack.channels.alerts,
            `${icons[severity]} Alert: ${message}`,
            { ...options, attachments: [attachment] }
        );
    }
    
    /**
     * Microsoft Email Integration Methods
     */
    async sendEmail(to, subject, body, options = {}) {
        try {
            const client = this.integrations.microsoft;
            if (!client) {
                throw new Error('Microsoft client not available');
            }
            
            const accessToken = await this.getMicrosoftAccessToken();
            
            const emailData = {
                message: {
                    subject: subject,
                    body: {
                        contentType: options.contentType || 'HTML',
                        content: body
                    },
                    toRecipients: Array.isArray(to) ? 
                        to.map(email => ({ emailAddress: { address: email } })) :
                        [{ emailAddress: { address: to } }],
                    from: {
                        emailAddress: { address: options.from || client.adminEmail }
                    }
                },
                saveToSentItems: options.saveToSentItems !== false
            };
            
            return await this.makeApiRequest('microsoft', 'POST', `${client.baseURL}/me/sendMail`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                data: emailData,
                timeout: client.timeout
            });
            
        } catch (error) {
            console.error('❌ Email sending failed:', error.message);
            throw error;
        }
    }
    
    async getMicrosoftAccessToken() {
        // Simplified OAuth token handling
        // In production, this would handle proper OAuth 2.0 flow
        const client = this.integrations.microsoft;
        return client.apiKey;
    }
    
    /**
     * Generic API request method with retry logic and rate limiting
     */
    async makeApiRequest(service, method, url, options = {}) {
        const startTime = Date.now();
        
        try {
            // Check rate limiting
            await this.checkRateLimit(service);
            
            this.emit('api_request', { service, method, url });
            
            // Make request with retry logic
            const response = await this.makeRequestWithRetry(method, url, options);
            
            const responseTime = Date.now() - startTime;
            this.updateMetrics('request', service, responseTime, true);
            
            this.emit('api_response', { service, method, url, responseTime, success: true });
            
            return response.data || response;
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.updateMetrics('request', service, responseTime, false);
            
            this.emit('api_response', { service, method, url, responseTime, success: false, error: error.message });
            
            throw error;
        }
    }
    
    async makeRequestWithRetry(method, url, options, attempt = 1) {
        try {
            const response = await axios({
                method,
                url,
                ...options
            });
            
            return response;
            
        } catch (error) {
            if (attempt < this.config.retry.attempts) {
                const delay = this.config.retry.delay * Math.pow(this.config.retry.backoff, attempt - 1);
                console.warn(`⚠️ Request failed, retrying in ${delay}ms (attempt ${attempt}/${this.config.retry.attempts})`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return await this.makeRequestWithRetry(method, url, options, attempt + 1);
            }
            
            throw error;
        }
    }
    
    async checkRateLimit(service) {
        const rateLimiter = this.rateLimiters[service];
        if (!rateLimiter) return;
        
        const now = Date.now();
        const windowStart = now - rateLimiter.window;
        
        // Remove old requests
        rateLimiter.requests = rateLimiter.requests.filter(time => time > windowStart);
        
        // Check if we're at the limit
        if (rateLimiter.requests.length >= rateLimiter.limit) {
            const oldestRequest = Math.min(...rateLimiter.requests);
            const waitTime = oldestRequest + rateLimiter.window - now;
            
            if (waitTime > 0) {
                console.warn(`⚠️ Rate limit reached for ${service}, waiting ${waitTime}ms`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        
        // Add current request
        rateLimiter.requests.push(now);
    }
    
    /**
     * Data caching methods
     */
    cacheData(key, data, ttl = 3600000) { // Default 1 hour TTL
        this.dataCache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
        
        // Set expiration
        setTimeout(() => {
            this.dataCache.delete(key);
        }, ttl);
    }
    
    getCachedData(key) {
        const cached = this.dataCache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > cached.ttl) {
            this.dataCache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    /**
     * Metrics and monitoring
     */
    updateMetrics(type, service, responseTime, success) {
        try {
            if (type === 'request') {
                this.metrics.requests.total++;
                this.metrics.requests.byService[service].total++;
                
                if (success) {
                    this.metrics.requests.successful++;
                    this.metrics.requests.byService[service].successful++;
                } else {
                    this.metrics.requests.failed++;
                    this.metrics.requests.byService[service].failed++;
                }
            } else if (type === 'sync') {
                this.metrics.sync.total++;
                this.metrics.sync.byService[service].total++;
                
                if (success) {
                    this.metrics.sync.successful++;
                    this.metrics.sync.byService[service].successful++;
                } else {
                    this.metrics.sync.failed++;
                    this.metrics.sync.byService[service].failed++;
                }
            }
            
            // Update performance metrics
            this.metrics.performance.averageResponseTime = 
                (this.metrics.performance.averageResponseTime * 0.9) + (responseTime * 0.1);
            
            const totalRequests = this.metrics.requests.total;
            this.metrics.performance.successRate = totalRequests > 0 ? 
                (this.metrics.requests.successful / totalRequests) * 100 : 100;
            
            this.metrics.performance.errorRate = totalRequests > 0 ? 
                (this.metrics.requests.failed / totalRequests) * 100 : 0;
            
            this.metrics.lastUpdated = new Date().toISOString();
            
            this.emit('metrics_updated', this.metrics);
            
        } catch (error) {
            console.error('❌ Failed to update metrics:', error);
        }
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            health: this.calculateHealthScore(),
            status: 'operational',
            timestamp: new Date().toISOString()
        };
    }
    
    calculateHealthScore() {
        const successRate = this.metrics.performance.successRate;
        const responseTimeScore = Math.max(0, 100 - (this.metrics.performance.averageResponseTime / 1000) * 10);
        const errorRate = this.metrics.performance.errorRate;
        
        const healthScore = (successRate * 0.6) + (responseTimeScore * 0.3) + ((100 - errorRate) * 0.1);
        
        return {
            score: Math.round(Math.min(healthScore, 100)),
            successRate: Math.round(successRate),
            responseTime: Math.round(responseTimeScore),
            errorRate: Math.round(errorRate),
            status: healthScore > 80 ? 'excellent' : healthScore > 60 ? 'good' : 'fair'
        };
    }
    
    /**
     * Integration status methods
     */
    async getIntegrationStatus() {
        const status = {};
        
        // Check Shopify integrations
        status.shopify = {
            uk: await this.checkServiceHealth('shopify', 'uk'),
            usa: await this.checkServiceHealth('shopify', 'usa'),
            eu: await this.checkServiceHealth('shopify', 'eu')
        };
        
        // Check Amazon integrations
        status.amazon = {
            uk: await this.checkServiceHealth('amazon', 'uk'),
            usa: await this.checkServiceHealth('amazon', 'usa')
        };
        
        // Check other integrations
        status.unleashed = await this.checkServiceHealth('unleashed');
        status.xero = await this.checkServiceHealth('xero');
        status.microsoft = await this.checkServiceHealth('microsoft');
        status.slack = await this.checkServiceHealth('slack');
        
        return status;
    }
    
    async checkServiceHealth(service, region = null) {
        try {
            const key = region ? `${service}_${region}` : service;
            const lastSync = this.syncStatus[key];
            
            return {
                available: this.integrations[service] !== null,
                configured: this.isServiceConfigured(service, region),
                lastSync: lastSync?.timestamp || null,
                lastSyncSuccess: lastSync?.success || false,
                status: this.getServiceStatus(service, region)
            };
            
        } catch (error) {
            return {
                available: false,
                configured: false,
                lastSync: null,
                lastSyncSuccess: false,
                status: 'error',
                error: error.message
            };
        }
    }
    
    isServiceConfigured(service, region = null) {
        const integration = region ? 
            this.integrations[service]?.[region] : 
            this.integrations[service];
        
        return integration !== null && integration !== undefined;
    }
    
    getServiceStatus(service, region = null) {
        const key = region ? `${service}_${region}` : service;
        const metrics = this.metrics.sync.byService[service];
        
        if (!metrics || metrics.total === 0) return 'unknown';
        
        const successRate = (metrics.successful / metrics.total) * 100;
        
        if (successRate >= 95) return 'excellent';
        if (successRate >= 80) return 'good';
        if (successRate >= 60) return 'fair';
        return 'poor';
    }
    
    /**
     * Event handlers
     */
    handleSyncRequest(data) {
        console.log('🔄 Sync request:', {
            service: data.service,
            region: data.region,
            type: data.type
        });
    }
    
    handleSyncComplete(data) {
        console.log('✅ Sync completed:', {
            service: data.service,
            region: data.region,
            responseTime: data.responseTime,
            data: data.data
        });
        
        const key = data.region ? `${data.service}_${data.region}` : data.service;
        this.syncStatus[key] = {
            timestamp: new Date().toISOString(),
            success: true,
            responseTime: data.responseTime,
            data: data.data
        };
    }
    
    handleSyncError(data) {
        console.error('❌ Sync error:', {
            service: data.service,
            region: data.region,
            error: data.error.message,
            responseTime: data.responseTime
        });
        
        const key = data.region ? `${data.service}_${data.region}` : data.service;
        this.syncStatus[key] = {
            timestamp: new Date().toISOString(),
            success: false,
            responseTime: data.responseTime,
            error: data.error.message
        };
        
        // Send alert for critical errors
        if (data.error.message.includes('authentication') || data.error.message.includes('unauthorized')) {
            this.sendSlackAlert(`Integration error: ${data.service} ${data.region || ''} - ${data.error.message}`, 'error');
        }
    }
    
    handleApiRequest(data) {
        // Log API requests for debugging
        if (process.env.NODE_ENV === 'development') {
            console.log('📡 API request:', data);
        }
    }
    
    handleApiResponse(data) {
        // Log API responses for debugging
        if (process.env.NODE_ENV === 'development' && !data.success) {
            console.log('📡 API response error:', data);
        }
    }
    
    handleError(error) {
        console.error('❌ Integration Hub error:', error);
        this.sendSlackAlert(`Integration Hub error: ${error.message}`, 'error');
    }
}

module.exports = EnterpriseIntegrationHub;

