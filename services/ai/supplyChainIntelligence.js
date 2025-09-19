import { EventEmitter } from 'events';
import axios from 'axios';
import logger, { logInfo, logError, logWarn } from '../logger.js';
import ManufacturingMCPServers from '../mcp/manufacturingMCPServers.js';
import AIEnsembleForecastingService from '../../src/services/aiEnsembleForecasting.js';

/**
 * Sentia Supply Chain Intelligence System
 * AI-powered botanical supplier risk assessment and supply chain optimization
 * Integrated with Unleashed for BOM and inventory management
 */
class SentiaSupplyChainIntelligence extends EventEmitter {
  constructor() {
    super();
    
    this.mcpServers = new ManufacturingMCPServers();
    this.forecastingService = new AIEnsembleForecastingService();
    
    // Unleashed API integration
    this.unleashedClient = this.initializeUnleashedClient();
    
    // External data sources
    this.externalSources = {
      weather: this.initializeWeatherAPI(),
      geopolitical: this.initializePoliticalRiskAPI(),
      commodity: this.initializeCommodityAPI(),
      logistics: this.initializeLogisticsAPI(),
      sustainability: this.initializeSustainabilityAPI()
    };

    // Botanical supplier database with risk profiles
    this.botanicalSuppliers = {
      ashwagandha: {
        primary: {
          id: 'SUP_ASH_001',
          name: 'Himalayan Botanicals Ltd',
          location: 'Uttarakhand, India',
          coordinates: { lat: 30.0668, lng: 79.0193 },
          capacity: { annual: 5000, unit: 'kg' }, // 5 tons annually
          certifications: ['organic', 'fair_trade', 'gmp'],
          qualityHistory: { avgScore: 96, consistency: 'high' },
          deliveryPerformance: { onTime: 92, avgDelay: 3 }, // days
          pricing: { current: 45, trend: 'stable', currency: 'USD' }, // per kg
          riskFactors: ['weather', 'geopolitical', 'quality_variability'],
          lastAudit: new Date('2024-08-15'),
          nextAudit: new Date('2024-11-15')
        },
        secondary: {
          id: 'SUP_ASH_002',
          name: 'Kerala Herbs Pvt Ltd',
          location: 'Kerala, India',
          coordinates: { lat: 10.8505, lng: 76.2711 },
          capacity: { annual: 3000, unit: 'kg' },
          certifications: ['organic', 'iso_22000'],
          qualityHistory: { avgScore: 89, consistency: 'medium' },
          deliveryPerformance: { onTime: 87, avgDelay: 5 },
          pricing: { current: 42, trend: 'increasing', currency: 'USD' },
          riskFactors: ['weather', 'transportation', 'capacity_constraints'],
          lastAudit: new Date('2024-07-20'),
          nextAudit: new Date('2024-12-20')
        }
      },
      passionflower: {
        primary: {
          id: 'SUP_PAS_001',
          name: 'European Botanics GmbH',
          location: 'Baden-Württemberg, Germany',
          coordinates: { lat: 48.5311, lng: 9.0549 },
          capacity: { annual: 8000, unit: 'kg' },
          certifications: ['organic', 'eu_gmp', 'iso_9001'],
          qualityHistory: { avgScore: 98, consistency: 'very_high' },
          deliveryPerformance: { onTime: 96, avgDelay: 1 },
          pricing: { current: 28, trend: 'stable', currency: 'EUR' },
          riskFactors: ['seasonal_availability', 'eu_regulations'],
          lastAudit: new Date('2024-09-01'),
          nextAudit: new Date('2025-01-15')
        },
        secondary: {
          id: 'SUP_PAS_002',
          name: 'Mountain Herbs Co',
          location: 'North Carolina, USA',
          coordinates: { lat: 35.7796, lng: -82.5565 },
          capacity: { annual: 4000, unit: 'kg' },
          certifications: ['usda_organic', 'gmp'],
          qualityHistory: { avgScore: 91, consistency: 'high' },
          deliveryPerformance: { onTime: 89, avgDelay: 4 },
          pricing: { current: 35, trend: 'increasing', currency: 'USD' },
          riskFactors: ['weather_events', 'labor_costs', 'shipping_delays'],
          lastAudit: new Date('2024-06-30'),
          nextAudit: new Date('2024-10-30')
        }
      },
      magnolia_bark: {
        primary: {
          id: 'SUP_MAG_001',
          name: 'Sichuan Traditional Herbs',
          location: 'Sichuan, China',
          coordinates: { lat: 30.5728, lng: 104.0668 },
          capacity: { annual: 2000, unit: 'kg' },
          certifications: ['organic', 'gmp', 'cites'],
          qualityHistory: { avgScore: 94, consistency: 'high' },
          deliveryPerformance: { onTime: 85, avgDelay: 8 },
          pricing: { current: 65, trend: 'volatile', currency: 'USD' },
          riskFactors: ['export_regulations', 'sustainability_concerns', 'geopolitical'],
          lastAudit: new Date('2024-05-15'),
          nextAudit: new Date('2024-11-15')
        },
        secondary: {
          id: 'SUP_MAG_002',
          name: 'Sustainable Magnolia Corp',
          location: 'Oregon, USA',
          coordinates: { lat: 44.9778, lng: -123.0351 },
          capacity: { annual: 800, unit: 'kg' },
          certifications: ['usda_organic', 'sustainable_forestry'],
          qualityHistory: { avgScore: 97, consistency: 'very_high' },
          deliveryPerformance: { onTime: 94, avgDelay: 2 },
          pricing: { current: 85, trend: 'increasing', currency: 'USD' },
          riskFactors: ['limited_capacity', 'premium_pricing'],
          lastAudit: new Date('2024-08-01'),
          nextAudit: new Date('2024-12-01')
        }
      },
      lemon_balm: {
        primary: {
          id: 'SUP_LEM_001',
          name: 'Mediterranean Herbs SA',
          location: 'Provence, France',
          coordinates: { lat: 43.9493, lng: 4.8055 },
          capacity: { annual: 6000, unit: 'kg' },
          certifications: ['ab_organic', 'eu_gmp'],
          qualityHistory: { avgScore: 95, consistency: 'high' },
          deliveryPerformance: { onTime: 93, avgDelay: 2 },
          pricing: { current: 22, trend: 'stable', currency: 'EUR' },
          riskFactors: ['seasonal_quality', 'drought_risk'],
          lastAudit: new Date('2024-07-10'),
          nextAudit: new Date('2025-01-10')
        }
      },
      schisandra: {
        primary: {
          id: 'SUP_SCH_001',
          name: 'Siberian Botanicals LLC',
          location: 'Primorye, Russia',
          coordinates: { lat: 43.1056, lng: 131.8735 },
          capacity: { annual: 1500, unit: 'kg' },
          certifications: ['organic', 'wild_harvested'],
          qualityHistory: { avgScore: 92, consistency: 'medium' },
          deliveryPerformance: { onTime: 78, avgDelay: 12 },
          pricing: { current: 55, trend: 'volatile', currency: 'USD' },
          riskFactors: ['geopolitical', 'export_restrictions', 'currency_volatility'],
          lastAudit: new Date('2024-04-20'),
          nextAudit: new Date('2024-10-20')
        },
        secondary: {
          id: 'SUP_SCH_002',
          name: 'Northeastern Berries Inc',
          location: 'Heilongjiang, China',
          coordinates: { lat: 47.8620, lng: 127.7615 },
          capacity: { annual: 2500, unit: 'kg' },
          certifications: ['organic', 'gmp'],
          qualityHistory: { avgScore: 88, consistency: 'medium' },
          deliveryPerformance: { onTime: 82, avgDelay: 10 },
          pricing: { current: 48, trend: 'increasing', currency: 'USD' },
          riskFactors: ['quality_variability', 'shipping_delays', 'weather'],
          lastAudit: new Date('2024-06-01'),
          nextAudit: new Date('2024-12-01')
        }
      },
      hops: {
        primary: {
          id: 'SUP_HOP_001',
          name: 'Kent Hop Gardens Ltd',
          location: 'Kent, United Kingdom',
          coordinates: { lat: 51.2787, lng: 0.5217 },
          capacity: { annual: 10000, unit: 'kg' },
          certifications: ['soil_association_organic', 'red_tractor'],
          qualityHistory: { avgScore: 97, consistency: 'very_high' },
          deliveryPerformance: { onTime: 98, avgDelay: 0.5 },
          pricing: { current: 18, trend: 'stable', currency: 'GBP' },
          riskFactors: ['weather', 'brexit_impact'],
          lastAudit: new Date('2024-09-05'),
          nextAudit: new Date('2025-02-05')
        }
      },
      ginseng: {
        primary: {
          id: 'SUP_GIN_001',
          name: 'Wisconsin Ginseng Board',
          location: 'Wisconsin, USA',
          coordinates: { lat: 44.2619, lng: -89.6179 },
          capacity: { annual: 1200, unit: 'kg' },
          certifications: ['usda_organic', 'american_ginseng_certified'],
          qualityHistory: { avgScore: 99, consistency: 'very_high' },
          deliveryPerformance: { onTime: 96, avgDelay: 1 },
          pricing: { current: 120, trend: 'increasing', currency: 'USD' },
          riskFactors: ['premium_ingredient', 'limited_supply'],
          lastAudit: new Date('2024-08-20'),
          nextAudit: new Date('2024-12-20')
        }
      },
      ginkgo: {
        primary: {
          id: 'SUP_GIK_001',
          name: 'German Phytopharmaceuticals',
          location: 'Bavaria, Germany',
          coordinates: { lat: 48.7904, lng: 11.4979 },
          capacity: { annual: 4000, unit: 'kg' },
          certifications: ['eu_gmp', 'pharmacopoeia_grade'],
          qualityHistory: { avgScore: 98, consistency: 'very_high' },
          deliveryPerformance: { onTime: 97, avgDelay: 1 },
          pricing: { current: 38, trend: 'stable', currency: 'EUR' },
          riskFactors: ['regulatory_changes', 'quality_specifications'],
          lastAudit: new Date('2024-07-25'),
          nextAudit: new Date('2024-11-25')
        }
      },
      linden: {
        primary: {
          id: 'SUP_LIN_001',
          name: 'Baltic Botanicals Ltd',
          location: 'Estonia',
          coordinates: { lat: 58.5953, lng: 25.0136 },
          capacity: { annual: 3000, unit: 'kg' },
          certifications: ['eu_organic', 'wild_harvested'],
          qualityHistory: { avgScore: 93, consistency: 'high' },
          deliveryPerformance: { onTime: 91, avgDelay: 3 },
          pricing: { current: 25, trend: 'stable', currency: 'EUR' },
          riskFactors: ['seasonal_availability', 'harvesting_regulations'],
          lastAudit: new Date('2024-06-15'),
          nextAudit: new Date('2024-12-15')
        }
      }
    };

    // Risk assessment models
    this.riskModels = {
      supplier: null,
      geographical: null,
      commodity: null,
      quality: null,
      logistics: null
    };

    // Supply chain optimization
    this.optimization = {
      inventory: new Map(),
      procurement: new Map(),
      logistics: new Map(),
      contingency: new Map()
    };

    // Risk monitoring
    this.riskMonitoring = {
      alerts: new Map(),
      thresholds: new Map(),
      trends: new Map(),
      mitigation: new Map()
    };

    this.initializeSystem();
    logInfo('Sentia Supply Chain Intelligence System initialized');
  }

  /**
   * Initialize Unleashed API client
   */
  initializeUnleashedClient() {
    const apiId = process.env.UNLEASHED_API_ID;
    const apiKey = process.env.UNLEASHED_API_KEY;
    const baseUrl = process.env.UNLEASHED_API_URL || 'https://api.unleashedsoftware.com';

    if (!apiId || !apiKey) {
      logWarn('Unleashed API credentials not configured');
      return null;
    }

    return axios.create({
      baseURL: baseUrl,
      headers: {
        'api-auth-id': apiId,
        'api-auth-signature': apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Initialize external data source APIs
   */
  initializeWeatherAPI() {
    const apiKey = process.env.WEATHER_API_KEY;
    return apiKey ? axios.create({
      baseURL: 'https://api.openweathermap.org/data/2.5',
      params: { appid: apiKey }
    }) : null;
  }

  initializePoliticalRiskAPI() {
    const apiKey = process.env.POLITICAL_RISK_API_KEY;
    return apiKey ? axios.create({
      baseURL: 'https://api.country-risk.io/v1',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    }) : null;
  }

  initializeCommodityAPI() {
    const apiKey = process.env.COMMODITY_API_KEY;
    return apiKey ? axios.create({
      baseURL: 'https://api.commodity-markets.com/v1',
      headers: { 'X-API-Key': apiKey }
    }) : null;
  }

  initializeLogisticsAPI() {
    const apiKey = process.env.LOGISTICS_API_KEY;
    return apiKey ? axios.create({
      baseURL: 'https://api.freightos.com/v1',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    }) : null;
  }

  initializeSustainabilityAPI() {
    const apiKey = process.env.SUSTAINABILITY_API_KEY;
    return apiKey ? axios.create({
      baseURL: 'https://api.sustainability-tracker.org/v1',
      headers: { 'X-API-Key': apiKey }
    }) : null;
  }

  /**
   * Initialize the supply chain intelligence system
   */
  async initializeSystem() {
    try {
      // Setup MCP integration
      await this.mcpServers.initializeDefaultServers();
      
      // Initialize risk monitoring thresholds
      this.setupRiskThresholds();
      
      // Load current inventory from Unleashed
      await this.loadUnleashedData();
      
      // Initialize risk models
      await this.initializeRiskModels();
      
      // Start risk monitoring
      this.startRiskMonitoring();
      
      // Setup optimization algorithms
      this.setupOptimizationAlgorithms();
      
      // Setup event handlers
      this.setupEventHandlers();
      
      logInfo('Supply Chain Intelligence initialization complete');
    } catch (error) {
      logError('Supply chain intelligence initialization failed:', error);
    }
  }

  /**
   * Load data from Unleashed (BOM, inventory, suppliers)
   */
  async loadUnleashedData() {
    if (!this.unleashedClient) {
      logWarn('Unleashed client not available - using mock data');
      return;
    }

    try {
      // Load Bills of Materials
      const bomResponse = await this.unleashedClient.get('/BillOfMaterials');
      const boms = bomResponse.data.Items || [];
      
      // Load current inventory levels
      const inventoryResponse = await this.unleashedClient.get('/StockOnHand');
      const inventory = inventoryResponse.data.Items || [];
      
      // Load supplier information
      const suppliersResponse = await this.unleashedClient.get('/Suppliers');
      const suppliers = suppliersResponse.data.Items || [];
      
      // Process and integrate with botanical suppliers
      this.integrateUnleashedData(boms, inventory, suppliers);
      
      logInfo(`Loaded Unleashed data: ${boms.length} BOMs, ${inventory.length} inventory items, ${suppliers.length} suppliers`);
      
    } catch (error) {
      logError('Failed to load Unleashed data:', error);
    }
  }

  /**
   * Integrate Unleashed data with botanical supplier information
   */
  integrateUnleashedData(boms, inventory, suppliers) {
    // Process BOMs for botanical requirements
    boms.forEach(bom => {
      if (this.isSentiaProduct(bom.ProductCode)) {
        const botanicalRequirements = this.extractBotanicalRequirements(bom);
        this.optimization.inventory.set(bom.ProductCode, {
          bom,
          botanicalRequirements,
          currentStock: this.getCurrentStock(bom.ProductCode, inventory),
          lastUpdated: new Date()
        });
      }
    });

    // Update supplier data with Unleashed information
    suppliers.forEach(supplier => {
      const botanicalSupplier = this.findBotanicalSupplier(supplier);
      if (botanicalSupplier) {
        // Merge Unleashed data with our botanical supplier profiles
        Object.assign(botanicalSupplier, {
          unleashedId: supplier.Guid,
          accountCode: supplier.SupplierCode,
          paymentTerms: supplier.DefaultPurchaseTaxType,
          lastPurchase: supplier.LastModifiedOn,
          totalPurchases: supplier.TotalPurchases || 0
        });
      }
    });

    // Process inventory levels for reorder predictions
    inventory.forEach(item => {
      if (this.isBotanicalIngredient(item.ProductCode)) {
        const botanical = this.identifyBotanical(item.ProductCode);
        if (botanical) {
          this.optimization.inventory.set(item.ProductCode, {
            currentStock: item.QtyOnHand,
            allocatedStock: item.QtyAllocated,
            availableStock: item.QtyAvailable,
            reorderPoint: item.MinStockLevel || 0,
            maxStock: item.MaxStockLevel || 0,
            avgConsumption: this.calculateAvgConsumption(item),
            botanical,
            lastUpdated: new Date(item.LastModifiedOn)
          });
        }
      }
    });
  }

  /**
   * Setup risk monitoring thresholds
   */
  setupRiskThresholds() {
    const thresholds = {
      supplier_performance: { critical: 70, warning: 85, target: 95 },
      delivery_reliability: { critical: 80, warning: 90, target: 98 },
      quality_consistency: { critical: 85, warning: 92, target: 98 },
      price_volatility: { critical: 20, warning: 15, target: 10 }, // % change
      inventory_risk: { critical: 7, warning: 14, target: 30 }, // days of stock
      geopolitical_risk: { critical: 7, warning: 5, target: 3 }, // risk score 1-10
      weather_impact: { critical: 8, warning: 6, target: 4 }, // impact score 1-10
      logistics_disruption: { critical: 5, warning: 3, target: 1 } // disruption days
    };

    Object.entries(thresholds).forEach(([metric, threshold]) => {
      this.riskMonitoring.thresholds.set(metric, threshold);
    });
  }

  /**
   * Initialize supplier risk model
   */
  initializeSupplierRiskModel() {
    return {
      factors: {
        performance: 0.25,
        financial: 0.20,
        geographical: 0.20,
        diversification: 0.15,
        compliance: 0.10,
        sustainability: 0.10
      },
      calculate: (supplier) => {
        let score = 100;
        // Basic risk calculation logic
        if (supplier.deliveryRate < 95) score -= 10;
        if (supplier.qualityRate < 98) score -= 10;
        if (supplier.financialHealth < 80) score -= 15;
        return Math.max(0, Math.min(100, score));
      }
    };
  }

  /**
   * Initialize geographical risk model
   */
  initializeGeographicalRiskModel() {
    return {
      regions: {
        'Europe': { stability: 90, logistics: 95, regulatory: 85 },
        'North America': { stability: 95, logistics: 90, regulatory: 80 },
        'Asia': { stability: 75, logistics: 85, regulatory: 70 },
        'South America': { stability: 70, logistics: 75, regulatory: 65 }
      },
      calculate: (location) => {
        const region = this.getRegion(location);
        const regionData = this.regions[region] || { stability: 50, logistics: 50, regulatory: 50 };
        return (regionData.stability + regionData.logistics + regionData.regulatory) / 3;
      }
    };
  }

  /**
   * Initialize commodity risk model
   */
  initializeCommodityRiskModel() {
    return {
      commodities: new Map([
        ['botanicals', { volatility: 'medium', availability: 'good', priceStability: 75 }],
        ['glass', { volatility: 'low', availability: 'excellent', priceStability: 90 }],
        ['labels', { volatility: 'low', availability: 'excellent', priceStability: 95 }],
        ['chemicals', { volatility: 'high', availability: 'moderate', priceStability: 60 }]
      ]),
      calculate: (commodity) => {
        const data = this.commodities.get(commodity) || { priceStability: 50 };
        return data.priceStability;
      }
    };
  }

  /**
   * Initialize quality risk model
   */
  initializeQualityRiskModel() {
    return {
      metrics: {
        defectRate: 0.3,
        consistencyScore: 0.3,
        certificationStatus: 0.2,
        auditScore: 0.2
      },
      calculate: (qualityData) => {
        let score = 100;
        if (qualityData.defectRate > 2) score -= 20;
        if (qualityData.consistencyScore < 95) score -= 15;
        if (!qualityData.certified) score -= 10;
        return Math.max(0, Math.min(100, score));
      }
    };
  }

  /**
   * Initialize logistics risk model
   */
  initializeLogisticsRiskModel() {
    return {
      factors: {
        leadTime: 0.25,
        reliability: 0.30,
        flexibility: 0.20,
        cost: 0.25
      },
      calculate: (logisticsData) => {
        let score = 100;
        if (logisticsData.avgLeadTime > 14) score -= 15;
        if (logisticsData.onTimeDelivery < 95) score -= 20;
        if (logisticsData.flexibility < 80) score -= 10;
        return Math.max(0, Math.min(100, score));
      }
    };
  }

  /**
   * Initialize risk assessment models
   */
  async initializeRiskModels() {
    // Initialize all risk models
    this.riskModels.supplier = this.initializeSupplierRiskModel();
    this.riskModels.geographical = this.initializeGeographicalRiskModel();
    this.riskModels.commodity = this.initializeCommodityRiskModel();
    this.riskModels.quality = this.initializeQualityRiskModel();
    this.riskModels.logistics = this.initializeLogisticsRiskModel();
    
    // Supplier risk model with multiple factors
    this.riskModels.supplier = {
      factors: {
        performance: 0.25,    // Delivery and quality performance
        financial: 0.20,      // Financial stability
        geographical: 0.20,   // Location-based risks
        diversification: 0.15, // Single source dependency
        compliance: 0.10,     // Certifications and regulations
        sustainability: 0.10  // Environmental and social factors
      },
      calculate: this.calculateSupplierRisk.bind(this)
    };

    // Geographical risk model
    this.riskModels.geographical = {
      factors: {
        political: 0.30,      // Political stability
        economic: 0.25,       // Economic conditions
        environmental: 0.25,  // Weather, climate, natural disasters
        infrastructure: 0.20  // Transportation, utilities
      },
      calculate: this.calculateGeographicalRisk.bind(this)
    };

    // Quality risk model for botanicals
    this.riskModels.quality = {
      factors: {
        consistency: 0.30,    // Historical quality consistency
        seasonality: 0.25,    // Seasonal quality variation
        testing: 0.20,        // Testing and certification
        handling: 0.15,       // Storage and transportation
        contamination: 0.10   // Contamination risk
      },
      calculate: this.calculateQualityRisk.bind(this)
    };

    logInfo('Risk assessment models initialized');
  }

  /**
   * Start continuous risk monitoring
   */
  startRiskMonitoring() {
    const monitoringInterval = 300000; // 5 minutes

    setInterval(async () => {
      try {
        // Assess all supplier risks
        await this.assessAllSupplierRisks();
        
        // Monitor external risk factors
        await this.monitorExternalRisks();
        
        // Update inventory risk assessments
        await this.assessInventoryRisks();
        
        // Generate risk alerts if needed
        this.generateRiskAlerts();
        
        this.emit('riskMonitoringCompleted', { timestamp: new Date() });
        
      } catch (error) {
        logError('Risk monitoring cycle failed:', error);
      }
    }, monitoringInterval);

    logInfo('Risk monitoring started');
  }

  /**
   * Assess all supplier risks comprehensively
   */
  async assessAllSupplierRisks() {
    for (const [botanical, suppliers] of Object.entries(this.botanicalSuppliers)) {
      for (const [tier, supplier] of Object.entries(suppliers)) {
        try {
          const riskAssessment = await this.assessSupplierRisk(supplier, botanical);
          
          this.riskMonitoring.trends.set(`${supplier.id}_risk`, {
            currentRisk: riskAssessment.overallRisk,
            factors: riskAssessment.riskFactors,
            recommendations: riskAssessment.recommendations,
            lastAssessed: new Date(),
            trend: this.calculateRiskTrend(supplier.id)
          });
          
        } catch (error) {
          logWarn(`Risk assessment failed for ${supplier.name}:`, error);
        }
      }
    }
  }

  /**
   * Assess individual supplier risk
   */
  async assessSupplierRisk(supplier, botanical) {
    const riskFactors = {
      performance: await this.assessPerformanceRisk(supplier),
      financial: await this.assessFinancialRisk(supplier),
      geographical: await this.assessGeographicalRisk(supplier),
      quality: await this.assessQualityRisk(supplier, botanical),
      compliance: await this.assessComplianceRisk(supplier),
      sustainability: await this.assessSustainabilityRisk(supplier)
    };

    // Calculate weighted risk score
    const weights = this.riskModels.supplier.factors;
    const overallRisk = Object.entries(riskFactors).reduce((total, [factor, risk]) => {
      return total + (risk.score * weights[factor]);
    }, 0);

    const riskLevel = this.classifyRiskLevel(overallRisk);
    
    return {
      supplierId: supplier.id,
      supplierName: supplier.name,
      botanical,
      overallRisk: Math.round(overallRisk),
      riskLevel,
      riskFactors,
      recommendations: this.generateRiskMitigationRecommendations(riskFactors, riskLevel),
      assessmentDate: new Date()
    };
  }

  /**
   * Assess performance risk (delivery, quality history)
   */
  async assessPerformanceRisk(supplier) {
    const deliveryScore = Math.max(0, supplier.deliveryPerformance.onTime);
    const qualityScore = supplier.qualityHistory.avgScore;
    const consistencyScore = supplier.qualityHistory.consistency === 'very_high' ? 100 : 
                           supplier.qualityHistory.consistency === 'high' ? 85 :
                           supplier.qualityHistory.consistency === 'medium' ? 70 : 50;

    const performanceScore = (deliveryScore * 0.4) + (qualityScore * 0.4) + (consistencyScore * 0.2);
    const riskScore = 100 - performanceScore;

    return {
      score: riskScore,
      factors: {
        deliveryReliability: deliveryScore,
        qualityScore,
        consistency: consistencyScore
      },
      level: this.classifyRiskLevel(riskScore)
    };
  }

  /**
   * Assess geographical risk based on location
   */
  async assessGeographicalRisk(supplier) {
    const coordinates = supplier.coordinates;
    const location = supplier.location;
    
    // Get risk data from external sources
    const weatherRisk = await this.getWeatherRisk(coordinates);
    const politicalRisk = await this.getPoliticalRisk(location);
    const economicRisk = await this.getEconomicRisk(location);
    
    const geographicalRiskScore = (
      (weatherRisk.score * 0.4) + 
      (politicalRisk.score * 0.35) + 
      (economicRisk.score * 0.25)
    );

    return {
      score: geographicalRiskScore,
      factors: {
        weatherRisk: weatherRisk.score,
        politicalRisk: politicalRisk.score,
        economicRisk: economicRisk.score
      },
      level: this.classifyRiskLevel(geographicalRiskScore),
      details: {
        weather: weatherRisk.details,
        political: politicalRisk.details,
        economic: economicRisk.details
      }
    };
  }

  /**
   * Get weather risk data from external API
   */
  async getWeatherRisk(coordinates) {
    if (!this.externalSources.weather) {
      return { score: 25, details: 'Weather data unavailable' };
    }

    try {
      // Get current and forecast weather data
      const response = await this.externalSources.weather.get('/weather', {
        params: {
          lat: coordinates.lat,
          lon: coordinates.lng
        }
      });

      // Assess weather risk based on conditions
      const weatherCondition = response.data.weather[0].main;
      const temperature = response.data.main.temp;
      const humidity = response.data.main.humidity;

      let riskScore = 10; // Base low risk

      // Weather condition risk
      if (['Storm', 'Rain', 'Snow'].includes(weatherCondition)) riskScore += 20;
      if (['Extreme'].includes(weatherCondition)) riskScore += 40;

      // Temperature extremes
      if (temperature < -10 || temperature > 40) riskScore += 15;

      // High humidity (affects botanical quality)
      if (humidity > 80) riskScore += 10;

      return {
        score: Math.min(riskScore, 100),
        details: {
          condition: weatherCondition,
          temperature,
          humidity,
          description: response.data.weather[0].description
        }
      };

    } catch (error) {
      logWarn('Weather risk assessment failed:', error);
      return { score: 25, details: 'Weather assessment failed' };
    }
  }

  /**
   * Get political risk assessment
   */
  async getPoliticalRisk(location) {
    if (!this.externalSources.geopolitical) {
      // Use static risk assessment based on location
      return this.getStaticPoliticalRisk(location);
    }

    try {
      const countryCode = this.extractCountryCode(location);
      const response = await this.externalSources.geopolitical.get(`/countries/${countryCode}`);
      
      const politicalRisk = response.data.political_risk_score || 25;
      
      return {
        score: politicalRisk,
        details: {
          stability: response.data.political_stability,
          governance: response.data.governance_score,
          riskFactors: response.data.risk_factors || []
        }
      };

    } catch (error) {
      logWarn('Political risk assessment failed:', error);
      return this.getStaticPoliticalRisk(location);
    }
  }

  /**
   * Static political risk assessment based on location
   */
  getStaticPoliticalRisk(location) {
    const riskMap = {
      'Germany': 5,
      'United Kingdom': 8,
      'France': 10,
      'USA': 15,
      'Estonia': 12,
      'India': 35,
      'China': 45,
      'Russia': 65
    };

    const country = Object.keys(riskMap).find(c => location.includes(c));
    const riskScore = riskMap[country] || 30;

    return {
      score: riskScore,
      details: {
        country,
        riskLevel: riskScore < 20 ? 'low' : riskScore < 40 ? 'medium' : 'high',
        factors: ['static_assessment']
      }
    };
  }

  /**
   * Generate procurement recommendations
   */
  async generateProcurementRecommendations(botanical, timeHorizon = 90) {
    const suppliers = this.botanicalSuppliers[botanical];
    if (!suppliers) {
      return { error: `No suppliers found for ${botanical}` };
    }

    // Get demand forecast
    const demandForecast = await this.forecastingService.generateEnsembleForecast({
      sku: this.getBotanicalSKU(botanical),
      timeHorizon,
      includeExternalFactors: true
    });

    // Calculate procurement requirements
    const requirements = this.calculateProcurementRequirements(botanical, demandForecast, timeHorizon);
    
    // Assess supplier options
    const supplierOptions = await this.assessSupplierOptions(suppliers, requirements);
    
    // Generate optimization recommendations
    const recommendations = {
      botanical,
      timeHorizon,
      requirements,
      totalDemand: requirements.totalQuantity,
      recommendedStrategy: this.optimizeProcurementStrategy(supplierOptions, requirements),
      supplierRecommendations: supplierOptions,
      riskMitigation: this.generateRiskMitigationStrategy(botanical, suppliers),
      costOptimization: this.optimizeProcurementCosts(suppliers, requirements),
      sustainabilityScore: this.calculateSustainabilityScore(suppliers),
      contingencyPlans: this.generateContingencyPlans(botanical, suppliers)
    };

    return recommendations;
  }

  /**
   * Generate supply chain optimization dashboard
   */
  getSupplyChainDashboard() {
    const dashboard = {
      timestamp: new Date(),
      overview: {
        totalSuppliers: this.getTotalSuppliersCount(),
        activeBotanicals: Object.keys(this.botanicalSuppliers).length,
        riskAlerts: this.getActiveRiskAlerts(),
        avgRiskScore: this.getAverageRiskScore(),
        inventoryHealth: this.getInventoryHealthScore()
      },
      suppliers: {},
      riskMatrix: {},
      procurement: {},
      sustainability: {},
      recommendations: {}
    };

    // Populate supplier information
    Object.entries(this.botanicalSuppliers).forEach(([botanical, suppliers]) => {
      dashboard.suppliers[botanical] = {};
      Object.entries(suppliers).forEach(([tier, supplier]) => {
        const riskTrend = this.riskMonitoring.trends.get(`${supplier.id}_risk`);
        dashboard.suppliers[botanical][tier] = {
          name: supplier.name,
          location: supplier.location,
          capacity: supplier.capacity,
          qualityScore: supplier.qualityHistory.avgScore,
          deliveryPerformance: supplier.deliveryPerformance.onTime,
          currentRisk: riskTrend?.currentRisk || 'unknown',
          riskLevel: this.classifyRiskLevel(riskTrend?.currentRisk || 50),
          lastAudit: supplier.lastAudit,
          nextAudit: supplier.nextAudit
        };
      });
    });

    // Add risk matrix data
    dashboard.riskMatrix = this.generateRiskMatrix();
    
    // Add procurement insights
    dashboard.procurement = this.getProcurementInsights();
    
    // Add sustainability metrics
    dashboard.sustainability = this.getSustainabilityMetrics();
    
    // Add recommendations
    dashboard.recommendations = this.getTopRecommendations();

    return dashboard;
  }

  /**
   * Helper methods
   */
  isSentiaProduct(productCode) {
    return productCode && (productCode.includes('GABA') || productCode.includes('SENTIA'));
  }

  isBotanicalIngredient(productCode) {
    const botanicalKeywords = [
      'ashwagandha', 'passionflower', 'magnolia', 'lemon_balm', 'schisandra',
      'hops', 'ginseng', 'ginkgo', 'linden'
    ];
    return botanicalKeywords.some(keyword => 
      productCode.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  identifyBotanical(productCode) {
    const code = productCode.toLowerCase();
    if (code.includes('ashwagandha')) return 'ashwagandha';
    if (code.includes('passionflower')) return 'passionflower';
    if (code.includes('magnolia')) return 'magnolia_bark';
    if (code.includes('lemon') || code.includes('balm')) return 'lemon_balm';
    if (code.includes('schisandra')) return 'schisandra';
    if (code.includes('hops')) return 'hops';
    if (code.includes('ginseng')) return 'ginseng';
    if (code.includes('ginkgo')) return 'ginkgo';
    if (code.includes('linden')) return 'linden';
    return null;
  }

  getBotanicalSKU(botanical) {
    const skuMap = {
      ashwagandha: 'BOT-ASH-001',
      passionflower: 'BOT-PAS-001',
      magnolia_bark: 'BOT-MAG-001',
      lemon_balm: 'BOT-LEM-001',
      schisandra: 'BOT-SCH-001',
      hops: 'BOT-HOP-001',
      ginseng: 'BOT-GIN-001',
      ginkgo: 'BOT-GIK-001',
      linden: 'BOT-LIN-001'
    };
    return skuMap[botanical] || `BOT-${botanical.toUpperCase().substr(0,3)}-001`;
  }

  classifyRiskLevel(riskScore) {
    if (riskScore >= 70) return 'critical';
    if (riskScore >= 50) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }

  extractCountryCode(location) {
    const countryMap = {
      'Germany': 'DE',
      'United Kingdom': 'GB', 
      'France': 'FR',
      'USA': 'US',
      'Estonia': 'EE',
      'India': 'IN',
      'China': 'CN',
      'Russia': 'RU'
    };

    const country = Object.keys(countryMap).find(c => location.includes(c));
    return countryMap[country] || 'XX';
  }

  getTotalSuppliersCount() {
    return Object.values(this.botanicalSuppliers).reduce((total, suppliers) => {
      return total + Object.keys(suppliers).length;
    }, 0);
  }

  getActiveRiskAlerts() {
    return Array.from(this.riskMonitoring.alerts.values())
      .filter(alert => alert.status === 'active').length;
  }

  getAverageRiskScore() {
    const riskScores = Array.from(this.riskMonitoring.trends.values())
      .map(trend => trend.currentRisk)
      .filter(score => typeof score === 'number');
    
    return riskScores.length > 0 ? 
      Math.round(riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length) : 0;
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Handle MCP supply chain data updates
    this.mcpServers.orchestrator.on('resourcesProcessed', (data) => {
      if (data.serverId === 'supply-chain') {
        this.processSupplyChainData(data.data);
      }
    });

    // Handle risk alerts
    this.on('riskAlert', (alert) => {
      logWarn(`Supply Chain Risk Alert [${alert.level.toUpperCase()}]: ${alert.message}`);
    });
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    // Clear all monitoring data
    this.riskMonitoring.alerts.clear();
    this.riskMonitoring.thresholds.clear();
    this.riskMonitoring.trends.clear();
    this.riskMonitoring.mitigation.clear();

    // Clear optimization data
    this.optimization.inventory.clear();
    this.optimization.procurement.clear();
    this.optimization.logistics.clear();
    this.optimization.contingency.clear();

    // Shutdown MCP servers
    await this.mcpServers.shutdown();
    
    logInfo('Supply Chain Intelligence System shutdown complete');
  }
}

export default SentiaSupplyChainIntelligence;