import axios from 'axios';
import crypto from 'crypto';

class UnleashedIntegration {
  constructor(config = {}) {
    this.apiId = config.apiId || process.env.UNLEASHED_API_ID;
    this.apiKey = config.apiKey || process.env.UNLEASHED_API_KEY;
    this.baseUrl = 'https://api.unleashedsoftware.com';
    this.isConfigured = !!(this.apiId && this.apiKey);
    this.mockMode = !this.isConfigured;

    this.rateLimit = {
      maxRequests: 200,
      perHour: 3600000,
      requests: []
    };
  }

  generateSignature(query) {
    const hmac = crypto.createHmac('sha256', this.apiKey);
    hmac.update(query);
    return hmac.digest('base64');
  }

  async checkRateLimit() {
    const now = Date.now();
    this.rateLimit.requests = this.rateLimit.requests.filter(
      time => now - time < this.rateLimit.perHour
    );

    if (this.rateLimit.requests.length >= this.rateLimit.maxRequests) {
      const waitTime = this.rateLimit.perHour - (now - this.rateLimit.requests[0]);
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 60000)} minutes`);
    }

    this.rateLimit.requests.push(now);
  }

  async makeRequest(endpoint, params = {}) {
    if (this.mockMode) {
      return this.getMockData(endpoint);
    }

    try {
      await this.checkRateLimit();

      const queryString = new URLSearchParams(params).toString();
      const signature = this.generateSignature(queryString);

      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}${endpoint}`,
        params,
        headers: {
          'api-auth-id': this.apiId,
          'api-auth-signature': signature,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Unleashed API error:', error.message);
      return this.getMockData(endpoint);
    }
  }

  async getStatus() {
    if (this.mockMode) {
      return {
        connected: false,
        message: 'Running in mock mode - Unleashed credentials not configured',
        mockMode: true,
        lastSync: null
      };
    }

    try {
      const result = await this.makeRequest('/StockOnHand');
      return {
        connected: true,
        apiId: this.apiId,
        lastSync: new Date().toISOString(),
        itemsCount: result?.Items?.length || 0
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        lastSync: null
      };
    }
  }

  async getStockOnHand(warehouseCode = null) {
    const endpoint = '/StockOnHand';
    const params = warehouseCode ? { warehouseCode } : {};

    if (this.mockMode) {
      return this.getMockStockOnHand();
    }

    const result = await this.makeRequest(endpoint, params);

    return result.Items?.map(item => ({
      productCode: item.ProductCode,
      productDescription: item.ProductDescription,
      warehouse: item.WarehouseCode,
      quantityOnHand: item.QtyOnHand,
      allocatedQuantity: item.AllocatedQty,
      availableQuantity: item.AvailableQty,
      averageCost: item.AvgCost,
      totalValue: item.TotalCost,
      lastModified: item.LastModifiedOn
    })) || this.getMockStockOnHand();
  }

  async getProducts(pageSize = 200, pageNumber = 1) {
    const endpoint = '/Products';
    const params = { pageSize, pageNumber };

    if (this.mockMode) {
      return this.getMockProducts();
    }

    const result = await this.makeRequest(endpoint, params);

    return result.Items?.map(product => ({
      id: product.Guid,
      code: product.ProductCode,
      description: product.ProductDescription,
      barcode: product.Barcode,
      unitOfMeasure: product.UnitOfMeasure,
      averageLandedCost: product.AverageLandPrice,
      category: product.ProductGroup?.GroupName,
      supplier: product.Supplier?.SupplierName,
      isActive: !product.Obsolete,
      lastCost: product.LastCost,
      sellPrice: product.DefaultSellPrice
    })) || this.getMockProducts();
  }

  async getSalesOrders(status = null, pageSize = 100, pageNumber = 1) {
    const endpoint = '/SalesOrders';
    const params = { pageSize, pageNumber };
    if (status) params.orderStatus = status;

    if (this.mockMode) {
      return this.getMockSalesOrders(status);
    }

    const result = await this.makeRequest(endpoint, params);

    return result.Items?.map(order => ({
      orderNumber: order.OrderNumber,
      orderDate: order.OrderDate,
      requiredDate: order.RequiredDate,
      customer: order.Customer?.CustomerName,
      status: order.OrderStatus,
      subTotal: order.SubTotal,
      tax: order.TaxTotal,
      total: order.Total,
      lines: order.SalesOrderLines?.map(line => ({
        productCode: line.Product?.ProductCode,
        description: line.Product?.ProductDescription,
        quantity: line.OrderQuantity,
        unitPrice: line.UnitPrice,
        lineTotal: line.LineTotal,
        discountRate: line.DiscountRate
      }))
    })) || this.getMockSalesOrders(status);
  }

  async getPurchaseOrders(status = null, pageSize = 100, pageNumber = 1) {
    const endpoint = '/PurchaseOrders';
    const params = { pageSize, pageNumber };
    if (status) params.orderStatus = status;

    if (this.mockMode) {
      return this.getMockPurchaseOrders(status);
    }

    const result = await this.makeRequest(endpoint, params);

    return result.Items?.map(order => ({
      orderNumber: order.OrderNumber,
      orderDate: order.OrderDate,
      requiredDate: order.RequiredDate,
      supplier: order.Supplier?.SupplierName,
      status: order.OrderStatus,
      subTotal: order.SubTotal,
      tax: order.TaxTotal,
      total: order.Total,
      lines: order.PurchaseOrderLines?.map(line => ({
        productCode: line.Product?.ProductCode,
        description: line.Product?.ProductDescription,
        quantity: line.OrderQuantity,
        unitPrice: line.UnitPrice,
        lineTotal: line.LineTotal,
        receivedQuantity: line.ReceivedQuantity
      }))
    })) || this.getMockPurchaseOrders(status);
  }

  async getWarehouses() {
    const endpoint = '/Warehouses';

    if (this.mockMode) {
      return this.getMockWarehouses();
    }

    const result = await this.makeRequest(endpoint);

    return result.Items?.map(warehouse => ({
      code: warehouse.WarehouseCode,
      name: warehouse.WarehouseName,
      isDefault: warehouse.IsDefault,
      address: {
        street: warehouse.StreetNo,
        suburb: warehouse.Suburb,
        city: warehouse.City,
        region: warehouse.Region,
        country: warehouse.Country,
        postalCode: warehouse.PostCode
      },
      contactName: warehouse.ContactName,
      phoneNumber: warehouse.PhoneNumber,
      obsolete: warehouse.Obsolete
    })) || this.getMockWarehouses();
  }

  // Mock data methods
  getMockData(endpoint) {
    switch (endpoint) {
      case '/StockOnHand':
        return { Items: this.getMockStockOnHand() };
      case '/Products':
        return { Items: this.getMockProducts() };
      case '/SalesOrders':
        return { Items: this.getMockSalesOrders() };
      case '/PurchaseOrders':
        return { Items: this.getMockPurchaseOrders() };
      case '/Warehouses':
        return { Items: this.getMockWarehouses() };
      default:
        return { Items: [] };
    }
  }

  getMockStockOnHand() {
    return [
      {
        productCode: 'WIDGET-A',
        productDescription: 'Premium Widget Type A',
        warehouse: 'MAIN',
        quantityOnHand: 1250,
        allocatedQuantity: 300,
        availableQuantity: 950,
        averageCost: 45.50,
        totalValue: 56875.00,
        lastModified: new Date().toISOString()
      },
      {
        productCode: 'WIDGET-B',
        productDescription: 'Standard Widget Type B',
        warehouse: 'MAIN',
        quantityOnHand: 2100,
        allocatedQuantity: 450,
        availableQuantity: 1650,
        averageCost: 32.25,
        totalValue: 67725.00,
        lastModified: new Date().toISOString()
      },
      {
        productCode: 'COMPONENT-X',
        productDescription: 'Electronic Component X',
        warehouse: 'MAIN',
        quantityOnHand: 5000,
        allocatedQuantity: 1200,
        availableQuantity: 3800,
        averageCost: 8.75,
        totalValue: 43750.00,
        lastModified: new Date().toISOString()
      }
    ];
  }

  getMockProducts() {
    return [
      {
        id: 'prod-001',
        code: 'WIDGET-A',
        description: 'Premium Widget Type A',
        barcode: '1234567890123',
        unitOfMeasure: 'EA',
        averageLandedCost: 45.50,
        category: 'Widgets',
        supplier: 'Acme Supplies',
        isActive: true,
        lastCost: 44.00,
        sellPrice: 89.99
      },
      {
        id: 'prod-002',
        code: 'WIDGET-B',
        description: 'Standard Widget Type B',
        barcode: '1234567890124',
        unitOfMeasure: 'EA',
        averageLandedCost: 32.25,
        category: 'Widgets',
        supplier: 'Global Parts Co',
        isActive: true,
        lastCost: 31.50,
        sellPrice: 64.99
      }
    ];
  }

  getMockSalesOrders(status) {
    const orders = [
      {
        orderNumber: 'SO-2025-001',
        orderDate: '2025-01-15',
        requiredDate: '2025-01-22',
        customer: 'Retail Chain Inc',
        status: 'Open',
        subTotal: 4500.00,
        tax: 450.00,
        total: 4950.00,
        lines: [
          {
            productCode: 'WIDGET-A',
            description: 'Premium Widget Type A',
            quantity: 50,
            unitPrice: 90.00,
            lineTotal: 4500.00,
            discountRate: 0
          }
        ]
      },
      {
        orderNumber: 'SO-2025-002',
        orderDate: '2025-01-18',
        requiredDate: '2025-01-25',
        customer: 'Online Retailer Ltd',
        status: 'Dispatched',
        subTotal: 3250.00,
        tax: 325.00,
        total: 3575.00,
        lines: [
          {
            productCode: 'WIDGET-B',
            description: 'Standard Widget Type B',
            quantity: 50,
            unitPrice: 65.00,
            lineTotal: 3250.00,
            discountRate: 0
          }
        ]
      }
    ];

    return status ? orders.filter(o => o.status === status) : orders;
  }

  getMockPurchaseOrders(status) {
    const orders = [
      {
        orderNumber: 'PO-2025-001',
        orderDate: '2025-01-10',
        requiredDate: '2025-01-20',
        supplier: 'Acme Supplies',
        status: 'Open',
        subTotal: 22000.00,
        tax: 2200.00,
        total: 24200.00,
        lines: [
          {
            productCode: 'WIDGET-A',
            description: 'Premium Widget Type A',
            quantity: 500,
            unitPrice: 44.00,
            lineTotal: 22000.00,
            receivedQuantity: 0
          }
        ]
      },
      {
        orderNumber: 'PO-2025-002',
        orderDate: '2025-01-12',
        requiredDate: '2025-01-22',
        supplier: 'Global Parts Co',
        status: 'Received',
        subTotal: 15750.00,
        tax: 1575.00,
        total: 17325.00,
        lines: [
          {
            productCode: 'WIDGET-B',
            description: 'Standard Widget Type B',
            quantity: 500,
            unitPrice: 31.50,
            lineTotal: 15750.00,
            receivedQuantity: 500
          }
        ]
      }
    ];

    return status ? orders.filter(o => o.status === status) : orders;
  }

  getMockWarehouses() {
    return [
      {
        code: 'MAIN',
        name: 'Main Warehouse',
        isDefault: true,
        address: {
          street: '123 Industrial Way',
          suburb: 'Manufacturing District',
          city: 'London',
          region: 'Greater London',
          country: 'United Kingdom',
          postalCode: 'SW1A 1AA'
        },
        contactName: 'John Smith',
        phoneNumber: '+44 20 7946 0958',
        obsolete: false
      },
      {
        code: 'SECONDARY',
        name: 'Secondary Distribution Center',
        isDefault: false,
        address: {
          street: '456 Logistics Park',
          suburb: 'Business Park',
          city: 'Manchester',
          region: 'Greater Manchester',
          country: 'United Kingdom',
          postalCode: 'M1 1AE'
        },
        contactName: 'Jane Doe',
        phoneNumber: '+44 161 234 5678',
        obsolete: false
      }
    ];
  }
}

export default UnleashedIntegration;