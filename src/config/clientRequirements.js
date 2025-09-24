/**
 * SENTIA CLIENT REQUIREMENTS - FROM SEPTEMBER 11, 2025 MEETING
 * Matt Coulshed (Client) Requirements
 *
 * PRIMARY: Working Capital & Cash Flow Management
 * FOCUS: Demand Forecasting with Real Data Only
 */

export const CLIENT_REQUIREMENTS = {
  // DEMAND FORECASTING - PRIMARY REQUIREMENT
  demandForecasting: {
    forecastHorizons: [
      { value: 30, label: '30 days', enabled: true },
      { value: 60, label: '60 days', enabled: true },
      { value: 90, label: '90 days', enabled: true },
      { value: 120, label: '120 days', enabled: true },
      { value: 180, label: '180 days', enabled: true }
      // REMOVED: 7 and 14 day options per client request
    ],

    regions: [
      { id: 'us', name: 'USA', color: '#1e40af' },
      { id: 'uk', name: 'UK', color: '#dc2626' },
      { id: 'eu', name: 'Europe', color: '#16a34a' }
    ],

    products: [
      { id: 'red', name: 'Sentia Red', color: '#dc2626', lineStyle: 'solid' },
      { id: 'gold', name: 'Sentia Gold', color: '#f59e0b', lineStyle: 'solid' },
      { id: 'black', name: 'Sentia Black', color: '#1f2937', lineStyle: 'solid' }
    ],

    // Client's actual sales volume for sanity checks
    realSalesData: {
      dailyUnits: {
        min: 300,
        max: 400,
        average: 350
      },
      monthlyUnits: {
        average: 10500 // 350 * 30
      }
    },

    chartConfiguration: {
      // 3 separate charts - one per region
      chartsPerRegion: true,
      // Each chart shows 3 product lines
      productsAsLines: true,
      // Y-axis must show "Units" with proper labels
      yAxisLabel: 'Units (bottles)',
      xAxisLabel: 'Date',
      // Show historic + forecast with visual distinction
      showHistoricData: true,
      historicDataStyle: 'solid',
      forecastDataStyle: 'dashed'
    }
  },

  // INVENTORY MANAGEMENT
  inventoryManagement: {
    // Real inventory items only - NO MOCK DATA
    finishedGoods: [
      { sku: 'SENTIA-RED-500', name: 'Sentia Red 500ml', category: 'finished' },
      { sku: 'SENTIA-GOLD-500', name: 'Sentia Gold 500ml', category: 'finished' },
      { sku: 'SENTIA-BLACK-500', name: 'Sentia Black 500ml', category: 'finished' }
    ],

    rawMaterials: [
      { sku: 'BTL-500-AMBER', name: 'Amber Bottle 500ml', category: 'packaging' },
      { sku: 'LBL-RED', name: 'Red Product Label', category: 'packaging' },
      { sku: 'LBL-GOLD', name: 'Gold Product Label', category: 'packaging' },
      { sku: 'LBL-BLACK', name: 'Black Product Label', category: 'packaging' },
      { sku: 'FLV-BASE', name: 'Base Flavoring Extract', category: 'ingredient' },
      { sku: 'FLV-RED', name: 'Red Blend Extract', category: 'ingredient' },
      { sku: 'FLV-GOLD', name: 'Gold Blend Extract', category: 'ingredient' },
      { sku: 'FLV-BLACK', name: 'Black Blend Extract', category: 'ingredient' }
    ],

    // Remove these mock items if they appear
    mockDataToRemove: [
      'Bio X track limited',
      'Quality control labels',
      'Test Product A',
      'Sample Item'
    ]
  },

  // DATA SOURCES & PRIORITIES
  dataSources: {
    // Priority order for data (1 = highest)
    priority: {
      1: 'csv_import',      // User-uploaded CSV data
      2: 'unleashed_api',   // Unleashed inventory system
      3: 'xero_api',        // Xero accounting
      4: 'shopify_api'      // Shopify sales (alignment issues)
    },

    // Known issues from client
    issues: {
      xero: 'Does not reflect Shopify sales data',
      shopify: 'Sales data not aligning with actual demand',
      unleashed: 'Missing some product codes'
    }
  },

  // CSV IMPORT TEMPLATES
  csvTemplates: {
    historicSales: {
      name: 'Historic Sales - Last 12 Months',
      columns: [
        'Date',
        'Region',
        'Product',
        'Units Sold',
        'Revenue',
        'Channel'
      ],
      regionFiles: [
        'historic_sales_usa.csv',
        'historic_sales_uk.csv',
        'historic_sales_europe.csv'
      ],
      instructions: 'Upload separate CSV for each region to maintain data clarity'
    },

    inventoryLevels: {
      name: 'Current Inventory Levels',
      columns: [
        'SKU',
        'Product Name',
        'Current Stock',
        'Reorder Point',
        'Lead Time Days',
        'Location'
      ]
    },

    billOfMaterials: {
      name: 'Bill of Materials',
      columns: [
        'Finished Good SKU',
        'Component SKU',
        'Component Name',
        'Quantity Required',
        'Unit of Measure'
      ]
    }
  },

  // WORKING CAPITAL SPECIFICS
  workingCapital: {
    // Cash flow projection periods
    projectionPeriods: [30, 60, 90, 120, 180],

    // Key questions to answer
    keyMetrics: {
      cashRunway: 'How many days of cash do we have?',
      cashNeeded: 'How much cash needed for next X days?',
      fundingGap: 'Do we need injection for operations?',
      growthFunding: 'Funding needed for X% growth?'
    },

    // Funding options to display
    fundingOptions: [
      'Overdraft',
      'Invoice Finance',
      'Term Loan',
      'Shareholder Injection',
      'Private Equity'
    ]
  },

  // UI/UX REQUIREMENTS
  userInterface: {
    // Buttons that MUST work
    requiredButtons: [
      { id: 'demand_metrics', label: 'Demand Metrics', action: 'showDemandChart' },
      { id: 'revenue_forecast', label: 'Revenue', action: 'showRevenueChart' },
      { id: 'inventory_levels', label: 'Inventory', action: 'showInventoryTable' }
    ],

    // Data display rules
    dataDisplay: {
      noMockData: true,
      showZeroWithPrompt: true,
      promptMessage: 'No data available. Please import CSV or connect API.',
      actionButtons: ['Import CSV', 'Connect Unleashed', 'Connect Xero']
    }
  },

  // SANITY CHECKS
  sanityChecks: {
    enabled: true,
    rules: [
      {
        metric: 'daily_units',
        min: 200,
        max: 500,
        message: 'Daily units outside normal range (300-400)'
      },
      {
        metric: 'forecast_growth',
        maxPercentage: 50,
        message: 'Forecast growth seems unrealistic (>50%)'
      }
    ]
  }
};

// Export helper functions
export const getRegionChart = (region) => {
  return CLIENT_REQUIREMENTS.demandForecasting.regions.find(r => r.id === region);
};

export const getProductConfig = (productId) => {
  return CLIENT_REQUIREMENTS.demandForecasting.products.find(p => p.id === productId);
};

export const isRealProduct = (sku) => {
  const allProducts = [
    ...CLIENT_REQUIREMENTS.inventoryManagement.finishedGoods,
    ...CLIENT_REQUIREMENTS.inventoryManagement.rawMaterials
  ];
  return allProducts.some(p => p.sku === sku);
};

export const isMockData = (itemName) => {
  return CLIENT_REQUIREMENTS.inventoryManagement.mockDataToRemove.includes(itemName);
};

export const getDataSourcePriority = (source) => {
  return CLIENT_REQUIREMENTS.dataSources.priority[source] || 999;
};

export default CLIENT_REQUIREMENTS;