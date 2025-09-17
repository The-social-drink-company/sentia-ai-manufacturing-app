import SellingPartnerAPI from 'amazon-sp-api';
import crypto from 'crypto';

// Mock database for Amazon data (replace with actual database when ready)
const mockDatabase = {
  salesOrders: [],
  inventory: [],
  integrationLogs: [],
  productReturns: []
};

class AmazonIntegration {
  constructor() {
    this.spApi = new SellingPartnerAPI({
      region: process.env.AMAZON_REGION || 'na', // na (North America), eu (Europe), fe (Far East)
      refresh_token: process.env.AMAZON_SP_API_REFRESH_TOKEN,
      access_token: process.env.AMAZON_SP_API_ACCESS_TOKEN,
      role_arn: process.env.AMAZON_ROLE_ARN,
      app_client_id: process.env.AMAZON_SP_API_CLIENT_ID,
      app_client_secret: process.env.AMAZON_SP_API_CLIENT_SECRET
    });

    // Store marketplace IDs
    this.marketplaceIds = {
      uk: process.env.AMAZON_UK_MARKETPLACE_ID || 'A1F83G8C2ARO7P',
      usa: process.env.AMAZON_USA_MARKETPLACE_ID || 'ATVPDKIKX0DER'
    };

    this.currentMarketplace = process.env.AMAZON_DEFAULT_MARKETPLACE || 'uk';
  }

  async syncSalesData(marketplace = this.currentMarketplace) {
    try {
      // Get orders from last 30 days
      const endDate = new Date();
      const startDate = new Date(endDate - 30*24*60*60*1000);

      const ordersResponse = await this.spApi.callAPI({
        operation: 'getOrders',
        query: {
          CreatedAfter: startDate.toISOString(),
          OrderStatuses: ['Unshipped', 'PartiallyShipped', 'Shipped'],
          MarketplaceIds: [this.marketplaceIds[marketplace]]
        }
      });

      const orders = ordersResponse.Orders || [];

      // Process each order
      for (const order of orders) {
        // Get order items
        const itemsResponse = await this.spApi.callAPI({
          operation: 'getOrderItems',
          path: { orderId: order.AmazonOrderId }
        });

        // Store in mock database (replace with actual database when ready)
        const existingOrderIndex = mockDatabase.salesOrders.findIndex(
          o => o.externalId === `amazon_${order.AmazonOrderId}`
        );

        const orderData = {
          externalId: `amazon_${order.AmazonOrderId}`,
          source: 'amazon',
          marketplace: marketplace,
          orderDate: new Date(order.PurchaseDate),
          totalAmount: parseFloat(order.OrderTotal?.Amount || 0),
          currency: order.OrderTotal?.CurrencyCode,
          status: order.OrderStatus,
          fulfillmentChannel: order.FulfillmentChannel,
          customerEmail: order.BuyerEmail,
          shippingAddress: {
            name: order.ShippingAddress?.Name,
            addressLine1: order.ShippingAddress?.AddressLine1,
            city: order.ShippingAddress?.City,
            stateOrRegion: order.ShippingAddress?.StateOrRegion,
            postalCode: order.ShippingAddress?.PostalCode,
            countryCode: order.ShippingAddress?.CountryCode
          },
          lineItems: itemsResponse.OrderItems?.map(item => ({
            asin: item.ASIN,
            sku: item.SellerSKU,
            quantity: item.QuantityOrdered,
            price: parseFloat(item.ItemPrice?.Amount || 0),
            productName: item.Title
          })) || [],
          updatedAt: new Date()
        };

        if (existingOrderIndex >= 0) {
          mockDatabase.salesOrders[existingOrderIndex] = orderData;
        } else {
          mockDatabase.salesOrders.push(orderData);
        }
      }

      // Get FBA inventory
      const inventoryResponse = await this.getFBAInventory(marketplace);

      // Calculate Amazon-specific metrics
      const metrics = await this.calculateAmazonMetrics(orders);

      // Store sync log
      mockDatabase.integrationLogs.push({
        integration: 'amazon',
        marketplace: marketplace,
        action: 'sync_sales_data',
        status: 'success',
        recordsProcessed: orders.length,
        metadata: metrics,
        timestamp: new Date()
      });

      return {
        success: true,
        marketplace: marketplace,
        ordersProcessed: orders.length,
        metrics,
        fbaInventory: inventoryResponse
      };
    } catch (error) {
      console.error('Amazon sync error:', error);

      // Log error to database
      await prisma.integrationLog.create({
        data: {
          integration: 'amazon',
          marketplace: marketplace,
          action: 'sync_sales_data',
          status: 'error',
          error: error.message,
          timestamp: new Date()
        }
      });

      throw error;
    }
  }

  async getFBAInventory(marketplace = this.currentMarketplace) {
    try {
      const inventory = await this.spApi.callAPI({
        operation: 'getInventorySummaries',
        query: {
          marketplaceIds: [this.marketplaceIds[marketplace]],
          details: true,
          granularityType: 'Marketplace',
          granularityId: this.marketplaceIds[marketplace]
        }
      });

      // Store FBA inventory levels
      for (const item of inventory.inventorySummaries || []) {
        await prisma.inventory.upsert({
          where: {
            sku_marketplace: {
              sku: item.sellerSku,
              marketplace: marketplace
            }
          },
          update: {
            fbaQuantity: item.totalQuantity,
            fbaInbound: item.inboundQuantity,
            fbaAvailable: item.availableQuantity,
            fbaReserved: item.reservedQuantity,
            fbaUnsellable: item.unsellableQuantity,
            updatedAt: new Date()
          },
          create: {
            sku: item.sellerSku,
            asin: item.asin,
            marketplace: marketplace,
            fbaQuantity: item.totalQuantity,
            fbaInbound: item.inboundQuantity,
            fbaAvailable: item.availableQuantity,
            fbaReserved: item.reservedQuantity,
            fbaUnsellable: item.unsellableQuantity,
            location: 'Amazon FBA',
            fnsku: item.fnsku,
            productName: item.productName
          }
        });
      }

      return inventory.inventorySummaries;
    } catch (error) {
      console.error('FBA inventory error:', error);
      throw error;
    }
  }

  async calculateAmazonMetrics(orders) {
    const metrics = {
      totalRevenue: 0,
      averageOrderValue: 0,
      buyBoxPercentage: 0,
      fbaVsMerchantFulfilled: { fba: 0, merchant: 0 },
      topASINs: {},
      ordersByStatus: {},
      returnRate: 0,
      currencyBreakdown: {}
    };

    orders.forEach(order => {
      // Calculate revenue
      const orderAmount = parseFloat(order.OrderTotal?.Amount || 0);
      metrics.totalRevenue += orderAmount;

      // Track fulfillment channel
      if (order.FulfillmentChannel === 'AFN') {
        metrics.fbaVsMerchantFulfilled.fba++;
      } else {
        metrics.fbaVsMerchantFulfilled.merchant++;
      }

      // Track order status
      metrics.ordersByStatus[order.OrderStatus] =
        (metrics.ordersByStatus[order.OrderStatus] || 0) + 1;

      // Track currency
      const currency = order.OrderTotal?.CurrencyCode;
      if (currency) {
        metrics.currencyBreakdown[currency] =
          (metrics.currencyBreakdown[currency] || 0) + orderAmount;
      }
    });

    // Calculate average order value
    if (orders.length > 0) {
      metrics.averageOrderValue = metrics.totalRevenue / orders.length;
    }

    // Calculate FBA percentage
    const totalOrders = metrics.fbaVsMerchantFulfilled.fba +
                       metrics.fbaVsMerchantFulfilled.merchant;
    if (totalOrders > 0) {
      metrics.fbaPercentage = (metrics.fbaVsMerchantFulfilled.fba / totalOrders) * 100;
    }

    return metrics;
  }

  async getProductPerformance(marketplace = this.currentMarketplace) {
    try {
      const response = await this.spApi.callAPI({
        operation: 'getCatalogItem',
        query: {
          MarketplaceId: this.marketplaceIds[marketplace]
        }
      });

      return response;
    } catch (error) {
      console.error('Product performance error:', error);
      throw error;
    }
  }

  async getFinancialEvents(marketplace = this.currentMarketplace) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate - 30*24*60*60*1000);

      const response = await this.spApi.callAPI({
        operation: 'listFinancialEvents',
        query: {
          PostedAfter: startDate.toISOString(),
          PostedBefore: endDate.toISOString()
        }
      });

      // Process financial events
      const events = response.FinancialEvents || {};
      const summary = {
        productSales: 0,
        shippingCredits: 0,
        promotionalRebates: 0,
        sellingFees: 0,
        fbaFees: 0,
        otherTransactionFees: 0,
        netProceeds: 0
      };

      // Calculate totals from shipment events
      if (events.ShipmentEventList) {
        events.ShipmentEventList.forEach(shipment => {
          // Add product sales
          shipment.ShipmentItemList?.forEach(item => {
            item.ItemChargeList?.forEach(charge => {
              if (charge.ChargeType === 'Principal') {
                summary.productSales += parseFloat(charge.Amount || 0);
              } else if (charge.ChargeType === 'Shipping') {
                summary.shippingCredits += parseFloat(charge.Amount || 0);
              }
            });

            // Subtract fees
            item.ItemFeeList?.forEach(fee => {
              if (fee.FeeType.includes('FBA')) {
                summary.fbaFees += parseFloat(fee.Amount || 0);
              } else {
                summary.sellingFees += parseFloat(fee.Amount || 0);
              }
            });
          });
        });
      }

      // Calculate net proceeds
      summary.netProceeds = summary.productSales + summary.shippingCredits -
                           summary.sellingFees - summary.fbaFees -
                           summary.otherTransactionFees;

      return {
        events: events,
        summary: summary,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      };
    } catch (error) {
      console.error('Financial events error:', error);
      throw error;
    }
  }

  async createFBAShipment(items, marketplace = this.currentMarketplace) {
    try {
      const response = await this.spApi.callAPI({
        operation: 'createInboundShipmentPlan',
        body: {
          ShipFromAddress: {
            Name: process.env.WAREHOUSE_NAME,
            AddressLine1: process.env.WAREHOUSE_ADDRESS,
            City: process.env.WAREHOUSE_CITY,
            StateOrProvinceCode: process.env.WAREHOUSE_STATE,
            CountryCode: process.env.WAREHOUSE_COUNTRY,
            PostalCode: process.env.WAREHOUSE_POSTAL
          },
          LabelPrepPreference: 'SELLER_LABEL',
          InboundShipmentPlanRequestItems: items.map(item => ({
            SellerSKU: item.sku,
            ASIN: item.asin,
            Quantity: item.quantity,
            QuantityInCase: item.caseQuantity || 1
          }))
        }
      });

      return response;
    } catch (error) {
      console.error('FBA shipment creation error:', error);
      throw error;
    }
  }

  async getReturns(marketplace = this.currentMarketplace) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate - 30*24*60*60*1000);

      const response = await this.spApi.callAPI({
        operation: 'getReturns',
        query: {
          MarketplaceIds: [this.marketplaceIds[marketplace]],
          CreatedAfter: startDate.toISOString(),
          CreatedBefore: endDate.toISOString()
        }
      });

      const returns = response.Returns || [];

      // Process returns
      for (const returnItem of returns) {
        await prisma.productReturn.create({
          data: {
            externalId: `amazon_${returnItem.ReturnId}`,
            marketplace: marketplace,
            orderId: returnItem.AmazonOrderId,
            sku: returnItem.SellerSKU,
            asin: returnItem.ASIN,
            quantity: returnItem.Quantity,
            reason: returnItem.ReturnReason,
            status: returnItem.Status,
            returnDate: new Date(returnItem.ReturnDate),
            refundAmount: parseFloat(returnItem.RefundAmount?.Amount || 0),
            currency: returnItem.RefundAmount?.CurrencyCode
          }
        });
      }

      return {
        success: true,
        returnsProcessed: returns.length,
        returns: returns
      };
    } catch (error) {
      console.error('Returns fetch error:', error);
      throw error;
    }
  }
}

// Export singleton instance
const amazonIntegration = new AmazonIntegration();
export default amazonIntegration;

// Also export class for testing
export { AmazonIntegration };