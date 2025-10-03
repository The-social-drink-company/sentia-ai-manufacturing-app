/**
 * Amazon Products Management Tool
 * 
 * Comprehensive product catalog retrieval and management for Amazon marketplaces
 * with pricing analysis, performance tracking, and competitive insights.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Amazon Products Tool Class
 */
export class ProductsTool {
  constructor(authManager, options = {}) {
    this.authManager = authManager;
    this.options = {
      defaultLimit: options.defaultLimit || 50,
      maxLimit: options.maxLimit || 200,
      includeImages: options.includeImages !== false,
      includeRankings: options.includeRankings !== false,
      ...options
    };

    // Input schema for MCP
    this.inputSchema = {
      type: 'object',
      properties: {
        marketplaceId: {
          type: 'string',
          enum: ['UK', 'USA', 'EU', 'CANADA', 'A1F83G8C2ARO7P', 'ATVPDKIKX0DER', 'A1PA6795UKMFR9', 'A2EUQ1WTGCTBG2'],
          description: 'Amazon marketplace ID or name'
        },
        searchType: {
          type: 'string',
          enum: ['listings', 'catalog', 'asin', 'sku'],
          default: 'listings',
          description: 'Type of product search to perform'
        },
        identifiers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Product identifiers (ASINs, SKUs, etc.)'
        },
        category: {
          type: 'string',
          description: 'Product category to filter by'
        },
        brand: {
          type: 'string',
          description: 'Brand name to filter by'
        },
        priceRange: {
          type: 'object',
          properties: {
            min: { type: 'number' },
            max: { type: 'number' }
          },
          description: 'Price range filter'
        },
        includeImages: {
          type: 'boolean',
          default: true,
          description: 'Include product images'
        },
        includeRankings: {
          type: 'boolean',
          default: true,
          description: 'Include sales rank and performance data'
        },
        includeVariations: {
          type: 'boolean',
          default: false,
          description: 'Include product variations'
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 200,
          description: 'Maximum number of products to retrieve'
        },
        sandbox: {
          type: 'boolean',
          default: false,
          description: 'Use sandbox environment'
        }
      },
      required: ['marketplaceId']
    };

    logger.info('Amazon Products Tool initialized', {
      defaultLimit: this.options.defaultLimit,
      maxLimit: this.options.maxLimit
    });
  }

  /**
   * Execute products retrieval
   */
  async execute(params = {}) {
    const correlationId = `products-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info('Executing Amazon products retrieval', {
        correlationId,
        params: this.sanitizeParams(params)
      });

      // Validate and normalize parameters
      const normalizedParams = this.validateAndNormalizeParams(params);
      
      // Get authenticated client
      const client = await this.authManager.getClient(normalizedParams.marketplaceId, {
        sandbox: normalizedParams.sandbox,
        correlationId
      });

      // Retrieve products based on search type
      const productsData = await this.retrieveProducts(client, normalizedParams, correlationId);

      // Enrich with additional data
      await this.enrichProductsData(productsData.products, normalizedParams, correlationId);

      // Calculate analytics
      const analytics = this.calculateProductAnalytics(productsData.products, normalizedParams);

      const result = {
        success: true,
        marketplace: normalizedParams.marketplaceId,
        searchType: normalizedParams.searchType,
        summary: {
          totalProducts: productsData.products.length,
          averagePrice: this.calculateAveragePrice(productsData.products),
          priceRange: this.calculatePriceRange(productsData.products),
          currency: this.determineCurrency(normalizedParams.marketplaceId)
        },
        products: productsData.products,
        analytics,
        pagination: {
          hasNextPage: !!productsData.nextToken,
          nextToken: productsData.nextToken
        },
        timestamp: new Date().toISOString(),
        correlationId
      };

      logger.info('Amazon products retrieval completed', {
        correlationId,
        productCount: result.products.length,
        searchType: normalizedParams.searchType,
        marketplace: normalizedParams.marketplaceId
      });

      return result;

    } catch (error) {
      logger.error('Amazon products retrieval failed', {
        correlationId,
        error: error.message,
        stack: error.stack,
        params: this.sanitizeParams(params)
      });

      return {
        success: false,
        error: error.message,
        correlationId,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Validate and normalize input parameters
   */
  validateAndNormalizeParams(params) {
    const normalized = { ...params };

    // Set defaults
    normalized.searchType = normalized.searchType || 'listings';
    normalized.limit = Math.min(normalized.limit || this.options.defaultLimit, this.options.maxLimit);
    normalized.includeImages = normalized.includeImages !== false;
    normalized.includeRankings = normalized.includeRankings !== false;
    normalized.includeVariations = normalized.includeVariations || false;
    normalized.sandbox = normalized.sandbox || false;

    // Validate required parameters based on search type
    if (normalized.searchType === 'asin' || normalized.searchType === 'sku') {
      if (!normalized.identifiers || normalized.identifiers.length === 0) {
        throw new Error(`Search type '${normalized.searchType}' requires identifiers array`);
      }
    }

    return normalized;
  }

  /**
   * Retrieve products from Amazon SP-API
   */
  async retrieveProducts(client, params, correlationId) {
    try {
      logger.debug('Retrieving products from SP-API', {
        correlationId,
        marketplace: params.marketplaceId,
        searchType: params.searchType
      });

      let products = [];
      let nextToken = null;

      switch (params.searchType) {
        case 'listings':
          const listingsData = await this.getSellerListings(client, params, correlationId);
          products = listingsData.products;
          nextToken = listingsData.nextToken;
          break;

        case 'catalog':
          const catalogData = await this.getCatalogItems(client, params, correlationId);
          products = catalogData.products;
          nextToken = catalogData.nextToken;
          break;

        case 'asin':
          products = await this.getProductsByASIN(client, params, correlationId);
          break;

        case 'sku':
          products = await this.getProductsBySKU(client, params, correlationId);
          break;

        default:
          throw new Error(`Unsupported search type: ${params.searchType}`);
      }

      return { products, nextToken };

    } catch (error) {
      logger.error('Failed to retrieve products from SP-API', {
        correlationId,
        error: error.message,
        searchType: params.searchType
      });
      throw error;
    }
  }

  /**
   * Get seller listings
   */
  async getSellerListings(client, params, correlationId) {
    const requestParams = {
      MarketplaceId: this.getMarketplaceId(params.marketplaceId),
      MaxResultsPerPage: params.limit
    };

    const response = await client.callAPI({
      operation: 'getListingsItem',
      endpoint: 'listings',
      query: requestParams
    });

    const listings = response.listings || [];
    const products = listings.map(listing => this.transformListingToProduct(listing, params));

    return {
      products,
      nextToken: response.NextToken
    };
  }

  /**
   * Get catalog items
   */
  async getCatalogItems(client, params, correlationId) {
    const requestParams = {
      MarketplaceId: this.getMarketplaceId(params.marketplaceId),
      MaxPageSize: params.limit
    };

    // Add filters if provided
    if (params.category) {
      requestParams.BrowseNodeId = params.category;
    }

    if (params.brand) {
      requestParams.Brand = params.brand;
    }

    const response = await client.callAPI({
      operation: 'searchCatalogItems',
      endpoint: 'catalog',
      query: requestParams
    });

    const items = response.items || [];
    const products = items.map(item => this.transformCatalogItemToProduct(item, params));

    return {
      products,
      nextToken: response.NextToken
    };
  }

  /**
   * Get products by ASIN
   */
  async getProductsByASIN(client, params, correlationId) {
    const products = [];

    for (const asin of params.identifiers) {
      try {
        const response = await client.callAPI({
          operation: 'getCatalogItem',
          endpoint: 'catalog',
          path: {
            asin: asin
          },
          query: {
            MarketplaceId: this.getMarketplaceId(params.marketplaceId),
            includedData: ['attributes', 'images', 'productTypes', 'relationships', 'salesRanks']
          }
        });

        if (response) {
          const product = this.transformCatalogItemToProduct(response, params);
          product.asin = asin;
          products.push(product);
        }
      } catch (error) {
        logger.warn('Failed to get product by ASIN', {
          correlationId,
          asin,
          error: error.message
        });
      }
    }

    return products;
  }

  /**
   * Get products by SKU
   */
  async getProductsBySKU(client, params, correlationId) {
    const products = [];

    for (const sku of params.identifiers) {
      try {
        const response = await client.callAPI({
          operation: 'getListingsItem',
          endpoint: 'listings',
          path: {
            sellerId: process.env.AMAZON_SELLER_ID,
            sku: sku
          },
          query: {
            MarketplaceIds: [this.getMarketplaceId(params.marketplaceId)]
          }
        });

        if (response) {
          const product = this.transformListingToProduct(response, params);
          product.sku = sku;
          products.push(product);
        }
      } catch (error) {
        logger.warn('Failed to get product by SKU', {
          correlationId,
          sku,
          error: error.message
        });
      }
    }

    return products;
  }

  /**
   * Transform listing data to standardized product format
   */
  transformListingToProduct(listing, params) {
    return {
      id: listing.sku,
      asin: listing.asin,
      sku: listing.sku,
      title: listing.summaries?.[0]?.itemName || 'Unknown Product',
      description: listing.summaries?.[0]?.itemDescription,
      brand: listing.attributes?.brand?.[0]?.value,
      category: listing.productType,
      price: {
        amount: listing.offers?.[0]?.listingPrice?.Amount,
        currency: listing.offers?.[0]?.listingPrice?.CurrencyCode
      },
      availability: {
        quantity: listing.offers?.[0]?.quantity,
        fulfillmentChannel: listing.offers?.[0]?.fulfillmentChannel
      },
      images: params.includeImages ? this.extractImages(listing) : [],
      status: listing.status,
      lastUpdated: listing.offers?.[0]?.lastUpdated,
      source: 'listing'
    };
  }

  /**
   * Transform catalog item to standardized product format
   */
  transformCatalogItemToProduct(item, params) {
    return {
      id: item.asin,
      asin: item.asin,
      title: item.attributes?.item_name?.[0]?.value || 'Unknown Product',
      description: item.attributes?.bullet_point?.map(bp => bp.value).join(' '),
      brand: item.attributes?.brand?.[0]?.value,
      category: item.productTypes?.[0]?.productType,
      price: this.extractPriceFromCatalog(item),
      dimensions: this.extractDimensions(item),
      weight: item.attributes?.item_weight?.[0]?.value,
      images: params.includeImages ? this.extractCatalogImages(item) : [],
      salesRank: params.includeRankings ? this.extractSalesRank(item) : null,
      variations: params.includeVariations ? this.extractVariations(item) : [],
      source: 'catalog'
    };
  }

  /**
   * Enrich products with additional data
   */
  async enrichProductsData(products, params, correlationId) {
    logger.debug('Enriching products with additional data', {
      correlationId,
      productCount: products.length
    });

    for (const product of products) {
      // Add calculated fields
      product.calculated = {
        priceCategory: this.categorizePriceRange(product.price?.amount),
        competitiveIndex: this.calculateCompetitiveIndex(product),
        qualityScore: this.calculateQualityScore(product),
        marketPosition: this.determineMarketPosition(product)
      };

      // Add performance metrics if available
      if (product.salesRank) {
        product.calculated.performanceRating = this.calculatePerformanceRating(product.salesRank);
      }
    }
  }

  /**
   * Calculate product analytics
   */
  calculateProductAnalytics(products, params) {
    if (!products || products.length === 0) {
      return null;
    }

    const analytics = {
      overview: {
        totalProducts: products.length,
        averagePrice: this.calculateAveragePrice(products),
        priceDistribution: this.calculatePriceDistribution(products)
      },
      categories: {},
      brands: {},
      priceRanges: {
        budget: 0,      // < $25
        mid: 0,         // $25-100
        premium: 0,     // $100-500
        luxury: 0       // > $500
      },
      availability: {
        inStock: 0,
        outOfStock: 0,
        fba: 0,
        fbm: 0
      },
      performance: {
        topPerformers: [],
        averageRank: 0,
        rankDistribution: {}
      }
    };

    products.forEach(product => {
      // Category analysis
      if (product.category) {
        analytics.categories[product.category] = (analytics.categories[product.category] || 0) + 1;
      }

      // Brand analysis
      if (product.brand) {
        analytics.brands[product.brand] = (analytics.brands[product.brand] || 0) + 1;
      }

      // Price range analysis
      const price = parseFloat(product.price?.amount || 0);
      if (price > 0) {
        if (price < 25) analytics.priceRanges.budget++;
        else if (price < 100) analytics.priceRanges.mid++;
        else if (price < 500) analytics.priceRanges.premium++;
        else analytics.priceRanges.luxury++;
      }

      // Availability analysis
      const quantity = parseInt(product.availability?.quantity || 0);
      if (quantity > 0) {
        analytics.availability.inStock++;
      } else {
        analytics.availability.outOfStock++;
      }

      if (product.availability?.fulfillmentChannel === 'AMAZON_NA') {
        analytics.availability.fba++;
      } else {
        analytics.availability.fbm++;
      }

      // Performance analysis
      if (product.salesRank) {
        const rank = product.salesRank.rank;
        if (rank && rank < 10000) {
          analytics.performance.topPerformers.push({
            asin: product.asin,
            title: product.title,
            rank: rank,
            category: product.salesRank.category
          });
        }
      }
    });

    // Sort top performers by rank
    analytics.performance.topPerformers.sort((a, b) => a.rank - b.rank);
    analytics.performance.topPerformers = analytics.performance.topPerformers.slice(0, 10);

    return analytics;
  }

  /**
   * Extract images from listing
   */
  extractImages(listing) {
    const images = [];
    
    if (listing.images && listing.images.length > 0) {
      listing.images.forEach(image => {
        if (image.link) {
          images.push({
            url: image.link,
            height: image.height,
            width: image.width,
            type: 'listing'
          });
        }
      });
    }

    return images;
  }

  /**
   * Extract images from catalog item
   */
  extractCatalogImages(item) {
    const images = [];
    
    if (item.images) {
      item.images.forEach(imageSet => {
        if (imageSet.images) {
          imageSet.images.forEach(image => {
            images.push({
              url: image.link,
              height: image.height,
              width: image.width,
              type: imageSet.variant || 'main'
            });
          });
        }
      });
    }

    return images;
  }

  /**
   * Extract price from catalog item
   */
  extractPriceFromCatalog(item) {
    if (item.attributes?.list_price) {
      return {
        amount: item.attributes.list_price[0].value?.amount,
        currency: item.attributes.list_price[0].value?.currency
      };
    }
    return null;
  }

  /**
   * Extract dimensions from catalog item
   */
  extractDimensions(item) {
    const dims = {};
    
    if (item.attributes?.item_dimensions_height) {
      dims.height = item.attributes.item_dimensions_height[0].value;
    }
    if (item.attributes?.item_dimensions_length) {
      dims.length = item.attributes.item_dimensions_length[0].value;
    }
    if (item.attributes?.item_dimensions_width) {
      dims.width = item.attributes.item_dimensions_width[0].value;
    }

    return Object.keys(dims).length > 0 ? dims : null;
  }

  /**
   * Extract sales rank information
   */
  extractSalesRank(item) {
    if (item.salesRanks && item.salesRanks.length > 0) {
      const mainRank = item.salesRanks[0];
      return {
        rank: mainRank.rank,
        category: mainRank.title,
        categoryId: mainRank.categoryId
      };
    }
    return null;
  }

  /**
   * Extract product variations
   */
  extractVariations(item) {
    const variations = [];
    
    if (item.relationships) {
      item.relationships.forEach(rel => {
        if (rel.type === 'VARIATION') {
          variations.push({
            asin: rel.asin,
            type: rel.variationType
          });
        }
      });
    }

    return variations;
  }

  /**
   * Categorize price range
   */
  categorizePriceRange(price) {
    const amount = parseFloat(price || 0);
    if (amount < 25) return 'Budget';
    if (amount < 100) return 'Mid-Range';
    if (amount < 500) return 'Premium';
    return 'Luxury';
  }

  /**
   * Calculate competitive index
   */
  calculateCompetitiveIndex(product) {
    let score = 0;
    
    if (product.salesRank?.rank) {
      if (product.salesRank.rank < 1000) score += 5;
      else if (product.salesRank.rank < 10000) score += 3;
      else if (product.salesRank.rank < 100000) score += 1;
    }

    if (product.price?.amount && parseFloat(product.price.amount) > 0) score += 2;
    if (product.images && product.images.length > 3) score += 1;
    if (product.variations && product.variations.length > 0) score += 1;

    return Math.min(score, 10);
  }

  /**
   * Calculate quality score
   */
  calculateQualityScore(product) {
    let score = 0;
    
    if (product.title && product.title.length > 20) score += 2;
    if (product.description && product.description.length > 100) score += 2;
    if (product.images && product.images.length > 0) score += 2;
    if (product.brand) score += 2;
    if (product.dimensions) score += 1;
    if (product.weight) score += 1;

    return Math.min(score, 10);
  }

  /**
   * Determine market position
   */
  determineMarketPosition(product) {
    const competitive = product.calculated?.competitiveIndex || 0;
    const quality = product.calculated?.qualityScore || 0;
    
    const total = competitive + quality;
    
    if (total >= 15) return 'Market Leader';
    if (total >= 12) return 'Strong Competitor';
    if (total >= 8) return 'Average';
    return 'Needs Improvement';
  }

  /**
   * Calculate performance rating
   */
  calculatePerformanceRating(salesRank) {
    if (!salesRank?.rank) return 'Unranked';
    
    const rank = salesRank.rank;
    if (rank <= 100) return 'Excellent';
    if (rank <= 1000) return 'Very Good';
    if (rank <= 10000) return 'Good';
    if (rank <= 100000) return 'Average';
    return 'Poor';
  }

  /**
   * Calculate average price
   */
  calculateAveragePrice(products) {
    const prices = products
      .map(p => parseFloat(p.price?.amount || 0))
      .filter(p => p > 0);
    
    return prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  }

  /**
   * Calculate price range
   */
  calculatePriceRange(products) {
    const prices = products
      .map(p => parseFloat(p.price?.amount || 0))
      .filter(p => p > 0);
    
    if (prices.length === 0) return { min: 0, max: 0 };
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }

  /**
   * Calculate price distribution
   */
  calculatePriceDistribution(products) {
    const ranges = {
      '0-25': 0,
      '25-50': 0,
      '50-100': 0,
      '100-500': 0,
      '500+': 0
    };

    products.forEach(product => {
      const price = parseFloat(product.price?.amount || 0);
      if (price > 0) {
        if (price <= 25) ranges['0-25']++;
        else if (price <= 50) ranges['25-50']++;
        else if (price <= 100) ranges['50-100']++;
        else if (price <= 500) ranges['100-500']++;
        else ranges['500+']++;
      }
    });

    return ranges;
  }

  /**
   * Determine currency based on marketplace
   */
  determineCurrency(marketplaceId) {
    const currencyMap = {
      'UK': 'GBP',
      'A1F83G8C2ARO7P': 'GBP',
      'USA': 'USD',
      'ATVPDKIKX0DER': 'USD',
      'EU': 'EUR',
      'A1PA6795UKMFR9': 'EUR',
      'CANADA': 'CAD',
      'A2EUQ1WTGCTBG2': 'CAD'
    };

    return currencyMap[marketplaceId] || 'USD';
  }

  /**
   * Get marketplace ID from name or return as-is
   */
  getMarketplaceId(identifier) {
    const marketplaceMap = {
      'UK': 'A1F83G8C2ARO7P',
      'USA': 'ATVPDKIKX0DER',
      'EU': 'A1PA6795UKMFR9',
      'CANADA': 'A2EUQ1WTGCTBG2'
    };

    return marketplaceMap[identifier.toUpperCase()] || identifier;
  }

  /**
   * Sanitize parameters for logging
   */
  sanitizeParams(params) {
    const sanitized = { ...params };
    // Remove sensitive data if any
    return sanitized;
  }

  /**
   * Get tool schema for MCP registration
   */
  getSchema() {
    return {
      name: 'amazon-get-products',
      description: 'Retrieve and analyze Amazon marketplace products with pricing, performance tracking, and competitive insights',
      inputSchema: this.inputSchema
    };
  }
}