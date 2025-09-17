/**
 * Global Readiness Repository - Multi-Entity/Multi-Currency Support
 * Enhanced database service layer for global operations
 * 
 * Provides methods for:
 * - Multi-entity data access with proper scoping
 * - Multi-currency operations with FX conversion
 * - Compliance and tax jurisdiction management
 * - Performance-optimized queries with proper indexing
 * 
 * @author Claude Code
 * @created 2025-01-20
 */

import { PrismaClient } from '@prisma/client';

class GlobalReadinessRepository {
  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }

  /**
   * ENTITY MANAGEMENT
   */
  
  /**
   * Get all active entities with their currency information
   * @returns {Promise<Array>} Active entities
   */
  async getActiveEntities() {
    return await this.prisma.entity.findMany({
      where: { 
        is_active: true,
        deleted_at: null 
      },
      include: {
        historical_sales: {
          select: { id: true },
          take: 1 // Just to check if entity has sales data
        },
        working_capital: {
          select: { id: true },
          take: 1 // Just to check if entity has WC data
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Get entity by ID with full context
   * @param {string} entityId - Entity UUID
   * @returns {Promise<Object>} Entity with metadata
   */
  async getEntityById(entityId) {
    return await this.prisma.entity.findUnique({
      where: { 
        id: entityId,
        is_active: true,
        deleted_at: null 
      },
      include: {
        historical_sales: {
          select: {
            id: true,
            sale_date: true,
            net_revenue: true,
            currency_code_tx: true,
            amount_base: true
          },
          orderBy: { sale_date: 'desc' },
          take: 10 // Recent sales summary
        }
      }
    });
  }

  /**
   * CURRENCY & FX OPERATIONS
   */

  /**
   * Get current FX rate between two currencies
   * @param {string} baseCurrency - Base currency code
   * @param {string} quoteCurrency - Quote currency code
   * @param {Date} asOfDate - Rate date (defaults to today)
   * @returns {Promise<number>} FX rate or null if not found
   */
  async getFxRate(baseCurrency, quoteCurrency, asOfDate = new Date()) {
    if (baseCurrency === quoteCurrency) return 1.0;

    const fxRate = await this.prisma.fxRate.findFirst({
      where: {
        base_code: baseCurrency,
        quote_code: quoteCurrency,
        as_of_date: {
          lte: asOfDate
        }
      },
      orderBy: { as_of_date: 'desc' },
      select: { rate: true }
    });

    return fxRate ? Number(fxRate.rate) : null;
  }

  /**
   * Convert amount between currencies using current rates
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @param {Date} asOfDate - Rate date
   * @returns {Promise<Object>} Conversion result
   */
  async convertCurrency(amount, fromCurrency, toCurrency, asOfDate = new Date()) {
    if (fromCurrency === toCurrency) {
      return {
        original_amount: amount,
        converted_amount: amount,
        fx_rate: 1.0,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        rate_date: asOfDate
      };
    }

    const fxRate = await this.getFxRate(fromCurrency, toCurrency, asOfDate);
    
    if (!fxRate) {
      throw new Error(`FX rate not available for ${fromCurrency}/${toCurrency} on ${asOfDate.toISOString().split('T')[0]}`);
    }

    return {
      original_amount: amount,
      converted_amount: amount * fxRate,
      fx_rate: fxRate,
      from_currency: fromCurrency,
      to_currency: toCurrency,
      rate_date: asOfDate
    };
  }

  /**
   * ENHANCED SALES DATA ACCESS
   */

  /**
   * Get historical sales with multi-entity and multi-currency support
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Enhanced sales data
   */
  async getHistoricalSales(filters = {}) {
    const {
      entity_id,
      region,
      currency_code,
      start_date,
      end_date,
      product_id,
      sales_channel_id,
      base_currency = 'GBP',
      limit = 1000,
      offset = 0
    } = filters;

    const where = {
      deleted_at: null,
      ...(entity_id && { entity_id }),
      ...(region && { region }),
      ...(currency_code && { currency_code_tx: currency_code }),
      ...(product_id && { product_id }),
      ...(sales_channel_id && { sales_channel_id }),
      ...(start_date && end_date && {
        sale_date: {
          gte: start_date,
          lte: end_date
        }
      })
    };

    return await this.prisma.historicalSale.findMany({
      where,
      include: {
        product: {
          select: { sku: true, category: true, market_region: true }
        },
        sales_channel: {
          select: { name: true, channel_type: true }
        },
        entity: {
          select: { name: true, country_code: true }
        }
      },
      orderBy: { sale_date: 'desc' },
      take: limit,
      skip: offset
    });
  }

  /**
   * Get sales summary by entity and region
   * @param {Object} filters - Aggregation filters
   * @returns {Promise<Array>} Aggregated sales data
   */
  async getSalesSummaryByEntity(filters = {}) {
    const {
      start_date,
      end_date,
      base_currency = 'GBP'
    } = filters;

    // Note: This would typically use Prisma's aggregation features
    // For complex aggregations, consider using raw SQL for performance
    const salesSummary = await this.prisma.historicalSale.groupBy({
      by: ['entity_id', 'region', 'currency_code_tx'],
      where: {
        deleted_at: null,
        ...(start_date && end_date && {
          sale_date: {
            gte: start_date,
            lte: end_date
          }
        })
      },
      _sum: {
        net_revenue: true,
        net_profit: true,
        amount_base: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          amount_base: 'desc'
        }
      }
    });

    return salesSummary;
  }

  /**
   * WORKING CAPITAL OPERATIONS
   */

  /**
   * Get working capital projections with multi-entity support
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Working capital data
   */
  async getWorkingCapitalProjections(filters = {}) {
    const {
      entity_id,
      region,
      projection_date_from,
      projection_date_to,
      scenario = 'base',
      currency_code_base = 'GBP'
    } = filters;

    return await this.prisma.workingCapital.findMany({
      where: {
        ...(entity_id && { entity_id }),
        ...(region && { region }),
        ...(scenario && { scenarioType: scenario }),
        ...(currency_code_base && { currency_code_base }),
        ...(projection_date_from && projection_date_to && {
          projectionDate: {
            gte: projection_date_from,
            lte: projection_date_to
          }
        })
      },
      include: {
        entity: {
          select: { name: true, country_code: true }
        },
        product: {
          select: { sku: true, category: true }
        },
        baseCurrency: {
          select: { code: true, symbol: true }
        }
      },
      orderBy: [
        { entity_id: 'asc' },
        { projectionDate: 'asc' }
      ]
    });
  }

  /**
   * Get consolidated working capital across entities
   * @param {Object} filters - Consolidation filters  
   * @returns {Promise<Array>} Consolidated projections
   */
  async getConsolidatedWorkingCapital(filters = {}) {
    const {
      projection_date_from,
      projection_date_to,
      scenario = 'base',
      base_currency = 'GBP',
      exclude_intercompany = true
    } = filters;

    return await this.prisma.workingCapital.findMany({
      where: {
        scenarioType: scenario,
        currency_code_base: base_currency,
        ...(exclude_intercompany && {
          intercompany_elimination_flag: {
            not: true
          }
        }),
        ...(projection_date_from && projection_date_to && {
          projectionDate: {
            gte: projection_date_from,
            lte: projection_date_to
          }
        })
      },
      select: {
        projectionDate: true,
        entity_id: true,
        region: true,
        consolidation_group: true,
        projectedSalesRevenue: true,
        netCashFlow: true,
        workingCapitalRequirement: true,
        cash_conversion_cycle_days: true,
        entity: {
          select: { name: true }
        }
      },
      orderBy: [
        { consolidation_group: 'asc' },
        { projectionDate: 'asc' }
      ]
    });
  }

  /**
   * COMPLIANCE & TAX OPERATIONS
   */

  /**
   * Get applicable VAT/Sales tax rates
   * @param {string} countryCode - Country code
   * @param {Date} asOfDate - Rate effective date
   * @returns {Promise<Array>} Applicable tax rates
   */
  async getTaxRates(countryCode, asOfDate = new Date()) {
    if (countryCode === 'US') {
      // US Sales Tax - simplified to state level
      return await this.prisma.salesTaxUs.findMany({
        where: {
          valid_from: { lte: asOfDate },
          OR: [
            { valid_to: null },
            { valid_to: { gte: asOfDate } }
          ]
        },
        orderBy: { state_code: 'asc' }
      });
    } else {
      // VAT for other countries
      return await this.prisma.vatRate.findMany({
        where: {
          country_code: countryCode,
          valid_from: { lte: asOfDate },
          OR: [
            { valid_to: null },
            { valid_to: { gte: asOfDate } }
          ]
        },
        orderBy: { rate_name: 'asc' }
      });
    }
  }

  /**
   * Get import compliance status
   * @param {string} originCountry - Origin country code
   * @param {string} destinationCountry - Destination country code
   * @param {string} productCategory - Product category
   * @returns {Promise<Object>} Compliance information
   */
  async getImportCompliance(originCountry, destinationCountry, productCategory) {
    return await this.prisma.importProvenance.findFirst({
      where: {
        origin_country: originCountry,
        destination_country: destinationCountry,
        product_category: productCategory,
        compliance_status: 'COMPLIANT'
      },
      orderBy: { updated_at: 'desc' }
    });
  }

  /**
   * PERFORMANCE UTILITIES
   */

  /**
   * Health check for database connections
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      // Test basic connectivity
      await this.prisma.$queryRaw`SELECT 1 as health_check`;
      
      // Test index usage
      const entityCount = await this.prisma.entity.count({ where: { is_active: true } });
      const currencyCount = await this.prisma.currency.count({ where: { is_active: true } });
      
      return {
        status: 'healthy',
        database: 'connected',
        entities: entityCount,
        currencies: currencyCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

export default GlobalReadinessRepository;