import { EventEmitter } from 'events';
import axios from 'axios';
import logger, { logInfo, logError, logWarn } from '../logger.js';
import ManufacturingMCPServers from '../mcp/manufacturingMCPServers.js';
import SentiaDigitalTwinPlatform from './digitalTwinPlatform.js';
import SentiaSupplyChainIntelligence from './supplyChainIntelligence.js';
import SentiaComputerVisionQuality from './computerVisionQuality.js';

/**
 * CapLiquify Platform Execution Intelligence
 * AI-powered orchestration of multi-facility production with Unleashed BOM integration
 * Optimizes botanical beverage production across outsourced facilities
 */
class SentiaManufacturingExecution extends EventEmitter {
  constructor() {
    super();
    
    // Core system integrations
    this.mcpServers = new ManufacturingMCPServers();
    this.digitalTwin = new SentiaDigitalTwinPlatform();
    this.supplyChain = new SentiaSupplyChainIntelligence();
    this.qualitySystem = new SentiaComputerVisionQuality();
    
    // Unleashed API integration
    this.unleashedClient = this.initializeUnleashedClient();
    
    // Production orchestration engine
    this.productionEngine = {
      activeOrders: new Map(),
      productionQueue: [],
      facilitySchedules: new Map(),
      resourceAllocations: new Map(),
      qualityCheckpoints: new Map(),
      performanceMetrics: new Map()
    };

    // Sentia-specific production workflows
    this.productionWorkflows = {
      'GABA_RED': this.createGABARedWorkflowTemplate(),
      'GABA_GOLD': this.createGABAGoldWorkflowTemplate(),
      'GABA_BLACK': this.createGABABlackWorkflowTemplate()
    };

    // AI optimization algorithms
    this.optimizationAlgorithms = {
      scheduling: this.initializeSchedulingAI(),
      resourceAllocation: this.initializeResourceOptimization(),
      qualityOptimization: this.initializeQualityOptimization(),
      costMinimization: this.initializeCostOptimization()
    };

    // Real-time coordination
    this.coordination = {
      facilitySync: new Map(),
      crossFacilityTransfers: new Map(),
      qualityHolds: new Map(),
      emergencyProtocols: new Map()
    };

    // Performance tracking
    this.kpis = {
      oee: new Map(), // Overall Equipment Effectiveness
      throughput: new Map(),
      qualityMetrics: new Map(),
      costMetrics: new Map(),
      sustainabilityMetrics: new Map()
    };

    this.initializeSystem();
    logInfo('CapLiquify Platform Execution Intelligence initialized');
  }

  /**
   * Initialize Unleashed API client for BOM and production data
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
      },
      timeout: 30000
    });
  }

  /**
   * Initialize the manufacturing execution system
   */
  async initializeSystem() {
    try {
      // Setup MCP integration for real-time facility data
      await this.mcpServers.initializeDefaultServers();
      
      // Initialize facility coordination
      await this.initializeFacilityCoordination();
      
      // Load production data from Unleashed
      await this.loadUnleashedProductionData();
      
      // Initialize AI optimization algorithms
      await this.initializeOptimizationAI();
      
      // Setup real-time coordination
      this.startRealTimeCoordination();
      
      // Initialize quality checkpoint integration
      await this.setupQualityIntegration();
      
      // Setup event handlers
      this.setupEventHandlers();
      
      logInfo('Manufacturing Execution Intelligence initialization complete');
    } catch (error) {
      logError('Manufacturing execution initialization failed:', error);
    }
  }

  /**
   * Load production data from Unleashed (BOMs, Work Orders, etc.)
   */
  async loadUnleashedProductionData() {
    if (!this.unleashedClient) {
      logWarn('Unleashed client not available - using mock production data');
      return;
    }

    try {
      // Load Bills of Materials for Sentia products
      const bomResponse = await this.unleashedClient.get('/BillOfMaterials', {
        params: { pageSize: 200 }
      });
      const boms = bomResponse.data.Items || [];
      
      // Load active Work Orders
      const workOrdersResponse = await this.unleashedClient.get('/SalesOrders', {
        params: { 
          orderStatus: 'Parked,Placed,InProgress',
          pageSize: 100
        }
      });
      const workOrders = workOrdersResponse.data.Items || [];
      
      // Load current stock levels for botanicals
      const stockResponse = await this.unleashedClient.get('/StockOnHand', {
        params: { pageSize: 500 }
      });
      const stockLevels = stockResponse.data.Items || [];
      
      // Process and integrate production data
      await this.processUnleashedData(boms, workOrders, stockLevels);
      
      logInfo(`Loaded Unleashed production data: ${boms.length} BOMs, ${workOrders.length} orders, ${stockLevels.length} stock items`);
      
    } catch (error) {
      logError('Failed to load Unleashed production data:', error);
    }
  }

  /**
   * Process Unleashed data and create production schedules
   */
  async processUnleashedData(boms, workOrders, stockLevels) {
    // Process BOMs to understand botanical requirements
    const sentiaProducts = boms.filter(bom => 
      bom.ProductCode && (
        bom.ProductCode.includes('GABA') || 
        bom.ProductCode.includes('SENTIA')
      )
    );

    for (const bom of sentiaProducts) {
      const productionRecipe = await this.processBOM(bom);
      this.productionEngine.resourceAllocations.set(bom.ProductCode, productionRecipe);
    }

    // Process active work orders for production planning
    const sentiaOrders = workOrders.filter(order =>
      order.OrderLines && order.OrderLines.some(line =>
        line.Product && (
          line.Product.ProductCode.includes('GABA') ||
          line.Product.ProductCode.includes('SENTIA')
        )
      )
    );

    for (const order of sentiaOrders) {
      const productionOrder = await this.createProductionOrder(order, sentiaProducts);
      if (productionOrder) {
        this.productionEngine.activeOrders.set(order.OrderNumber, productionOrder);
      }
    }

    // Update botanical inventory levels
    const botanicalStock = stockLevels.filter(stock =>
      this.isBotanicalIngredient(stock.ProductCode)
    );

    for (const stock of botanicalStock) {
      const botanical = this.identifyBotanical(stock.ProductCode);
      if (botanical) {
        this.updateBotanicalInventory(botanical, stock);
      }
    }

    logInfo(`Processed ${sentiaProducts.length} Sentia products, ${sentiaOrders.length} active orders`);
  }

  /**
   * Process BOM to create botanical production recipe
   */
  async processBOM(bom) {
    const recipe = {
      productCode: bom.ProductCode,
      productName: bom.Product?.ProductDescription || bom.ProductCode,
      version: bom.BomVersion,
      yield: bom.Quantity,
      botanicalIngredients: [],
      baseIngredients: [],
      packagingMaterials: [],
      productionSteps: [],
      qualityCheckpoints: [],
      estimatedDuration: 0,
      lastUpdated: new Date(bom.LastModifiedOn)
    };

    // Process BOM lines to identify ingredients
    for (const line of bom.BomLines || []) {
      const ingredient = {
        code: line.ProductCode,
        description: line.Product?.ProductDescription,
        quantity: line.Qty,
        unit: line.Product?.UnitOfMeasure,
        cost: line.AverageLandedCost || 0
      };

      if (this.isBotanicalIngredient(line.ProductCode)) {
        const botanical = this.identifyBotanical(line.ProductCode);
        ingredient.botanical = botanical;
        ingredient.qualitySpecs = this.getBotanicalQualitySpecs(botanical);
        recipe.botanicalIngredients.push(ingredient);
      } else if (this.isPackagingMaterial(line.ProductCode)) {
        recipe.packagingMaterials.push(ingredient);
      } else {
        recipe.baseIngredients.push(ingredient);
      }
    }

    // Generate production steps based on product type
    recipe.productionSteps = this.generateProductionSteps(recipe);
    recipe.qualityCheckpoints = this.generateQualityCheckpoints(recipe);
    recipe.estimatedDuration = this.calculateProductionDuration(recipe);

    return recipe;
  }

  /**
   * Create production order from Unleashed sales order
   */
  async createProductionOrder(salesOrder, availableProducts) {
    const productionOrder = {
      id: `PROD_${salesOrder.OrderNumber}_${Date.now()}`,
      salesOrderNumber: salesOrder.OrderNumber,
      customerName: salesOrder.Customer?.CustomerName,
      orderDate: new Date(salesOrder.OrderDate),
      requiredDate: new Date(salesOrder.RequiredDate),
      priority: this.calculateOrderPriority(salesOrder),
      status: 'planned',
      products: [],
      totalQuantity: 0,
      estimatedDuration: 0,
      facilityAssignments: new Map(),
      qualityRequirements: [],
      createdAt: new Date()
    };

    // Process order lines
    for (const line of salesOrder.OrderLines || []) {
      const product = availableProducts.find(p => p.ProductCode === line.Product.ProductCode);
      if (product) {
        const productionItem = {
          productCode: line.Product.ProductCode,
          productName: line.Product.ProductDescription,
          quantity: line.OrderQuantity,
          unitPrice: line.UnitPrice,
          recipe: this.productionEngine.resourceAllocations.get(line.Product.ProductCode),
          estimatedStartTime: null,
          estimatedCompletionTime: null,
          status: 'queued'
        };

        productionOrder.products.push(productionItem);
        productionOrder.totalQuantity += line.OrderQuantity;
        
        if (productionItem.recipe) {
          productionOrder.estimatedDuration += productionItem.recipe.estimatedDuration * line.OrderQuantity;
        }
      }
    }

    // Assign facilities and create schedule
    await this.assignFacilitiesAndSchedule(productionOrder);

    return productionOrder;
  }

  /**
   * Create GABA Red production workflow template
   */
  createGABARedWorkflowTemplate() {
    return {
      productType: 'GABA_RED',
      botanicals: ['ashwagandha', 'passionflower', 'magnolia_bark'],
      phases: [
        {
          name: 'botanical_preparation',
          facility: 'mixing_facility',
          duration: 60, // minutes
          steps: [
            'Inspect incoming botanicals',
            'Weigh and measure botanicals',
            'Visual quality check',
            'Document batch numbers'
          ],
          qualityChecks: ['botanical_identity', 'potency_verification', 'contaminant_screening'],
          equipment: ['precision_scales', 'inspection_station'],
          temperature: { min: 18, max: 22 },
          humidity: { max: 60 }
        },
        {
          name: 'extraction_infusion',
          facility: 'mixing_facility',
          duration: 240, // 4 hours
          steps: [
            'Load botanicals into extraction unit',
            'Add purified water',
            'Start controlled extraction process',
            'Monitor temperature and pH',
            'Complete infusion cycle'
          ],
          qualityChecks: ['extraction_efficiency', 'gaba_potency', 'ph_level'],
          equipment: ['extraction_unit_001', 'ph_meter', 'temperature_probe'],
          temperature: { min: 20, max: 25 },
          extractionRatio: '1:10', // botanical:water
          targetGABA: 750 // mg per batch
        },
        {
          name: 'blending_standardization',
          facility: 'mixing_facility', 
          duration: 120, // 2 hours
          steps: [
            'Transfer extract to blending tank',
            'Add flavor components',
            'Add preservatives',
            'Homogenize blend',
            'Final quality testing'
          ],
          qualityChecks: ['flavor_profile', 'gaba_concentration', 'microbiological', 'color_specification'],
          equipment: ['blending_tank_001', 'homogenizer', 'quality_lab'],
          targetColor: { r: 139, g: 28, b: 35 }, // Ruby red
          targetBrix: 10,
          targetpH: 3.5
        },
        {
          name: 'transfer_preparation',
          facility: 'mixing_facility',
          duration: 60,
          steps: [
            'Prepare transfer containers',
            'Filter final blend',
            'Transfer to transport tanks',
            'Seal and label containers',
            'Prepare transport documentation'
          ],
          qualityChecks: ['filtration_efficiency', 'container_sanitization'],
          equipment: ['filtration_system', 'transfer_pumps'],
          temperature: { maintain: true, range: [18, 22] }
        },
        {
          name: 'transport_logistics',
          facility: 'transport',
          duration: 60,
          steps: [
            'Load transport vehicle',
            'Verify temperature control',
            'Begin transport to bottling facility',
            'Monitor during transport',
            'Arrive and verify integrity'
          ],
          qualityChecks: ['temperature_log', 'transport_integrity'],
          equipment: ['temperature_controlled_vehicle', 'gps_tracking']
        },
        {
          name: 'bottling_preparation',
          facility: 'bottling_facility',
          duration: 30,
          steps: [
            'Receive and inspect incoming blend',
            'Transfer to receiving tanks',
            'Set up bottling line',
            'Calibrate fill volumes',
            'Prepare bottles and caps'
          ],
          qualityChecks: ['incoming_inspection', 'line_calibration'],
          equipment: ['receiving_tanks', 'bottling_line_001'],
          fillVolume: 500 // ml
        },
        {
          name: 'bottling_production',
          facility: 'bottling_facility',
          duration: 180, // 3 hours for typical batch
          steps: [
            'Start automated bottling',
            'Monitor fill levels',
            'Apply caps and seals',
            'Conduct in-line inspection',
            'Apply labels'
          ],
          qualityChecks: ['fill_accuracy', 'seal_integrity', 'label_alignment', 'visual_inspection'],
          equipment: ['bottling_line_001', 'capping_machine', 'labeling_machine'],
          targetSpeed: 1200, // bottles per hour
          qualityChecking: { frequency: 'every_100_bottles' }
        },
        {
          name: 'packaging_dispatch',
          facility: 'bottling_facility',
          duration: 120,
          steps: [
            'Pack bottles into cases',
            'Apply batch codes and dates',
            'Palletize finished goods',
            'Prepare shipping documentation',
            'Load for distribution'
          ],
          qualityChecks: ['package_integrity', 'batch_documentation', 'shipping_compliance'],
          equipment: ['case_packer', 'palletizer', 'label_printer'],
          packagingFormat: '12_bottles_per_case'
        }
      ],
      totalDuration: 828, // Total minutes (13.8 hours)
      criticalControlPoints: [
        'botanical_potency_verification',
        'gaba_concentration_testing', 
        'microbiological_testing',
        'fill_volume_accuracy'
      ],
      yieldExpectation: 0.92 // 92% yield
    };
  }

  /**
   * Create GABA Gold production workflow template
   */
  createGABAGoldWorkflowTemplate() {
    return {
      productType: 'GABA_GOLD',
      botanicals: ['lemon_balm', 'schisandra', 'hops'],
      phases: [
        {
          name: 'botanical_preparation',
          facility: 'mixing_facility',
          duration: 45,
          steps: [
            'Inspect incoming botanicals',
            'Weigh lemon balm, schisandra, hops',
            'Visual and aromatic quality check',
            'Document botanical certificates'
          ],
          qualityChecks: ['botanical_identity', 'aromatic_profile', 'moisture_content'],
          equipment: ['precision_scales', 'aroma_assessment_station'],
          temperature: { min: 18, max: 22 }
        },
        {
          name: 'gentle_extraction',
          facility: 'mixing_facility',
          duration: 200, // 3.3 hours - gentler process
          steps: [
            'Load botanicals in sequence',
            'Add temperature-controlled water',
            'Begin gentle extraction',
            'Monitor volatile compounds',
            'Complete delicate infusion'
          ],
          qualityChecks: ['volatile_retention', 'gaba_potency', 'color_development'],
          equipment: ['gentle_extraction_unit', 'volatile_monitor'],
          temperature: { min: 18, max: 23 }, // Lower temp for delicate compounds
          extractionRatio: '1:12',
          targetGABA: 750
        },
        {
          name: 'precision_blending',
          facility: 'mixing_facility',
          duration: 90,
          steps: [
            'Transfer to precision blending tank',
            'Add natural golden coloring',
            'Incorporate flavor enhancers',
            'Gentle homogenization',
            'Stability testing'
          ],
          qualityChecks: ['color_consistency', 'flavor_balance', 'gaba_stability'],
          equipment: ['precision_blender', 'color_spectrometer'],
          targetColor: { r: 255, g: 191, b: 0 }, // Golden amber
          targetBrix: 9,
          targetpH: 3.3
        },
        {
          name: 'quality_stabilization',
          facility: 'mixing_facility',
          duration: 60,
          steps: [
            'Add natural preservatives',
            'Final pH adjustment',
            'Micro-filtration',
            'Quality verification',
            'Prepare for transfer'
          ],
          qualityChecks: ['preservative_efficacy', 'microbial_stability'],
          equipment: ['micro_filtration', 'ph_adjuster'],
          temperature: { maintain: true }
        },
        {
          name: 'transport_logistics',
          facility: 'transport',
          duration: 60,
          steps: [
            'Temperature-controlled loading',
            'Light-protected transport',
            'GPS tracking enabled',
            'Condition monitoring',
            'Delivery verification'
          ],
          qualityChecks: ['light_protection', 'temperature_stability'],
          equipment: ['light_proof_containers', 'climate_control']
        },
        {
          name: 'premium_bottling',
          facility: 'bottling_facility',
          duration: 45,
          steps: [
            'Receive premium blend',
            'Line setup for gold variant',
            'Calibrate for precise filling',
            'Prepare premium bottles',
            'Quality pre-checks'
          ],
          qualityChecks: ['line_cleanliness', 'bottle_premium_grade'],
          equipment: ['premium_bottling_line', 'precision_fillers']
        },
        {
          name: 'bottling_production',
          facility: 'bottling_facility',
          duration: 150, // Slower for premium quality
          steps: [
            'Controlled bottling process',
            'Enhanced quality monitoring',
            'Premium cap application',
            'Gold label application',
            'Individual inspection'
          ],
          qualityChecks: ['individual_inspection', 'premium_seal_check', 'label_premium_grade'],
          equipment: ['premium_line', 'individual_inspector'],
          targetSpeed: 1000, // Slower for quality
          qualityChecking: { frequency: 'every_50_bottles' }
        },
        {
          name: 'premium_packaging',
          facility: 'bottling_facility',
          duration: 90,
          steps: [
            'Premium case packaging',
            'Gold foil accents',
            'Premium documentation',
            'Quality assurance signoff',
            'Secure dispatch preparation'
          ],
          qualityChecks: ['premium_packaging_standards', 'documentation_complete'],
          equipment: ['premium_packaging_line', 'foil_applicator']
        }
      ],
      totalDuration: 740, // 12.3 hours
      criticalControlPoints: [
        'volatile_compound_retention',
        'color_consistency_check',
        'premium_grade_verification',
        'individual_bottle_inspection'
      ],
      yieldExpectation: 0.94 // Higher yield for premium process
    };
  }

  /**
   * Create GABA Black production workflow template  
   */
  createGABABlackWorkflowTemplate() {
    return {
      productType: 'GABA_BLACK',
      botanicals: ['ginseng', 'ginkgo', 'linden'],
      phases: [
        {
          name: 'premium_botanical_prep',
          facility: 'mixing_facility',
          duration: 75, // Longer for premium ingredients
          steps: [
            'Inspect premium ginseng quality',
            'Verify ginkgo pharmaceutical grade',
            'Assess linden flower quality',
            'Precise weighing and documentation',
            'Certificate of analysis review'
          ],
          qualityChecks: ['premium_grade_verification', 'pharmaceutical_compliance', 'potency_certificates'],
          equipment: ['precision_scales', 'pharmaceutical_inspector'],
          temperature: { min: 18, max: 20 } // Tighter control
        },
        {
          name: 'specialized_extraction',
          facility: 'mixing_facility',
          duration: 280, // 4.7 hours - complex extraction
          steps: [
            'Sequential botanical loading',
            'Multi-stage extraction process',
            'Ginseng saponin optimization',
            'Ginkgo flavonoid retention',
            'Complex compound stabilization'
          ],
          qualityChecks: ['ginsenoside_levels', 'ginkgo_flavonoids', 'compound_synergy'],
          equipment: ['multi_stage_extractor', 'compound_analyzer'],
          temperature: { min: 19, max: 24 },
          extractionRatio: '1:8', // Concentrated
          targetGABA: 750,
          targetGinsenosides: 15, // mg/bottle
          targetFlavonoids: 25 // mg/bottle
        },
        {
          name: 'complex_blending',
          facility: 'mixing_facility',
          duration: 150, // 2.5 hours
          steps: [
            'Transfer to specialized blender',
            'Add natural black coloring',
            'Complex flavor balancing',
            'Ensure compound stability',
            'Multi-parameter testing'
          ],
          qualityChecks: ['compound_interactions', 'color_depth', 'flavor_complexity'],
          equipment: ['specialized_blender', 'multi_parameter_tester'],
          targetColor: { r: 28, g: 28, b: 28 }, // Deep black
          targetBrix: 10,
          targetpH: 3.4
        },
        {
          name: 'stabilization_optimization',
          facility: 'mixing_facility',
          duration: 90,
          steps: [
            'Advanced stabilization process',
            'Antioxidant addition',
            'Fine filtration',
            'Stability validation',
            'Complex quality verification'
          ],
          qualityChecks: ['oxidation_resistance', 'long_term_stability'],
          equipment: ['advanced_stabilizer', 'oxidation_tester']
        },
        {
          name: 'protected_transport',
          facility: 'transport',
          duration: 75, // Longer setup for protection
          steps: [
            'Light and oxygen protection',
            'Temperature optimization',
            'Vibration minimization',
            'Continuous monitoring',
            'Protected delivery'
          ],
          qualityChecks: ['multi_protection_verification'],
          equipment: ['multi_protection_transport', 'continuous_monitor']
        },
        {
          name: 'specialized_bottling_prep',
          facility: 'bottling_facility',
          duration: 60,
          steps: [
            'Specialized line configuration',
            'Dark bottle preparation',
            'Nitrogen atmosphere setup',
            'Precision calibration',
            'Quality system activation'
          ],
          qualityChecks: ['nitrogen_atmosphere', 'dark_bottle_grade'],
          equipment: ['nitrogen_system', 'dark_bottles']
        },
        {
          name: 'precision_bottling',
          facility: 'bottling_facility',
          duration: 200, // Slower for complexity
          steps: [
            'Nitrogen-atmosphere filling',
            'Minimal light exposure',
            'Specialized cap sealing',
            'Premium black labeling',
            'Enhanced quality control'
          ],
          qualityChecks: ['atmosphere_integrity', 'light_exposure_minimal', 'premium_sealing'],
          equipment: ['nitrogen_filler', 'light_minimal_system'],
          targetSpeed: 900, // Slowest for highest quality
          qualityChecking: { frequency: 'every_25_bottles' }
        },
        {
          name: 'premium_black_packaging',
          facility: 'bottling_facility',
          duration: 120,
          steps: [
            'Premium black packaging',
            'Individual protection wrapping',
            'Premium documentation set',
            'Multi-point quality verification',
            'Secure premium dispatch'
          ],
          qualityChecks: ['individual_protection', 'premium_documentation_complete'],
          equipment: ['premium_black_packaging', 'individual_wrapper']
        }
      ],
      totalDuration: 1050, // 17.5 hours - most complex
      criticalControlPoints: [
        'ginsenoside_concentration_verification',
        'ginkgo_flavonoid_retention',
        'compound_synergy_testing',
        'atmosphere_integrity_check',
        'premium_grade_final_verification'
      ],
      yieldExpectation: 0.96 // Highest yield for most controlled process
    };
  }

  /**
   * Assign facilities and create production schedule
   */
  async assignFacilitiesAndSchedule(productionOrder) {
    try {
      // Get current facility schedules
      const mixingSchedule = this.productionEngine.facilitySchedules.get('mixing_facility') || [];
      const bottlingSchedule = this.productionEngine.facilitySchedules.get('bottling_facility') || [];

      for (const product of productionOrder.products) {
        const workflow = this.productionWorkflows[this.mapProductToWorkflow(product.productCode)];
        
        if (workflow) {
          // Schedule mixing facility phases
          const mixingPhases = workflow.phases.filter(p => p.facility === 'mixing_facility');
          const mixingDuration = mixingPhases.reduce((sum, p) => sum + p.duration, 0);
          
          const mixingSlot = this.findAvailableTimeSlot(mixingSchedule, mixingDuration);
          product.estimatedStartTime = mixingSlot.startTime;
          
          // Schedule bottling facility phases
          const bottlingPhases = workflow.phases.filter(p => p.facility === 'bottling_facility');
          const bottlingDuration = bottlingPhases.reduce((sum, p) => sum + p.duration, 0);
          
          // Bottling starts after mixing + transport
          const transportTime = workflow.phases.find(p => p.facility === 'transport')?.duration || 60;
          const bottlingStartTime = new Date(mixingSlot.endTime.getTime() + transportTime * 60000);
          
          const bottlingSlot = this.findAvailableTimeSlot(bottlingSchedule, bottlingDuration, bottlingStartTime);
          product.estimatedCompletionTime = bottlingSlot.endTime;
          
          // Update facility schedules
          mixingSchedule.push({
            orderId: productionOrder.id,
            productCode: product.productCode,
            startTime: mixingSlot.startTime,
            endTime: mixingSlot.endTime,
            phases: mixingPhases
          });
          
          bottlingSchedule.push({
            orderId: productionOrder.id,
            productCode: product.productCode,
            startTime: bottlingSlot.startTime,
            endTime: bottlingSlot.endTime,
            phases: bottlingPhases
          });
        }
      }

      // Update facility schedules
      this.productionEngine.facilitySchedules.set('mixing_facility', mixingSchedule);
      this.productionEngine.facilitySchedules.set('bottling_facility', bottlingSchedule);
      
      // Set overall order completion time
      const lastCompletion = Math.max(...productionOrder.products
        .map(p => p.estimatedCompletionTime?.getTime() || 0));
      
      if (lastCompletion > 0) {
        productionOrder.estimatedCompletionTime = new Date(lastCompletion);
        productionOrder.status = 'scheduled';
      }

      logInfo(`Production order ${productionOrder.id} scheduled with ${productionOrder.products.length} products`);
      
    } catch (error) {
      logError(`Failed to schedule production order ${productionOrder.id}:`, error);
      productionOrder.status = 'scheduling_failed';
    }
  }

  /**
   * Start real-time coordination between facilities
   */
  startRealTimeCoordination() {
    const coordinationInterval = 30000; // 30 seconds

    setInterval(async () => {
      try {
        // Sync facility status
        await this.syncFacilityStatus();
        
        // Coordinate cross-facility transfers
        await this.coordinateTransfers();
        
        // Monitor quality checkpoints
        await this.monitorQualityCheckpoints();
        
        // Update performance metrics
        await this.updatePerformanceMetrics();
        
        // Optimize ongoing production
        await this.optimizeOngoingProduction();
        
        this.emit('coordinationCycleCompleted', { 
          timestamp: new Date(),
          activeOrders: this.productionEngine.activeOrders.size
        });
        
      } catch (error) {
        logError('Real-time coordination cycle failed:', error);
      }
    }, coordinationInterval);

    logInfo('Real-time facility coordination started');
  }

  /**
   * Sync facility status across all production sites
   */
  async syncFacilityStatus() {
    const facilities = ['mixing_facility', 'bottling_facility'];
    
    for (const facilityId of facilities) {
      try {
        // Query facility status via MCP
        const facilityData = await this.mcpServers.queryManufacturingIntelligence({
          intent: `real-time status for ${facilityId}`,
          parameters: {
            facility: facilityId,
            dataTypes: ['equipment_status', 'production_metrics', 'quality_data'],
            timeRange: { minutes: 5 }
          }
        });

        if (facilityData && facilityData.data) {
          const facilityStatus = this.processFacilityData(facilityId, facilityData.data);
          this.coordination.facilitySync.set(facilityId, {
            status: facilityStatus,
            lastUpdate: new Date(),
            dataQuality: facilityData.analytics?.summary || 'unknown'
          });
        }
        
      } catch (error) {
        logWarn(`Facility sync failed for ${facilityId}:`, error);
      }
    }
  }

  /**
   * Get comprehensive manufacturing execution dashboard
   */
  getExecutionDashboard() {
    const dashboard = {
      timestamp: new Date(),
      overview: {
        activeOrders: this.productionEngine.activeOrders.size,
        queuedProductions: this.productionEngine.productionQueue.length,
        facilitiesOnline: this.getFacilitiesOnlineCount(),
        overallOEE: this.calculateOverallOEE(),
        qualityPassRate: this.calculateQualityPassRate(),
        onTimeDelivery: this.calculateOnTimeDeliveryRate()
      },
      
      facilities: {
        mixing: this.getFacilityStatus('mixing_facility'),
        bottling: this.getFacilityStatus('bottling_facility')
      },
      
      activeProductions: this.getActiveProductionStatus(),
      
      upcomingSchedule: this.getUpcomingProductionSchedule(),
      
      qualityMetrics: this.getQualityMetrics(),
      
      performanceKPIs: {
        throughput: this.getThroughputMetrics(),
        efficiency: this.getEfficiencyMetrics(),
        cost: this.getCostMetrics(),
        sustainability: this.getSustainabilityMetrics()
      },
      
      alerts: this.getActiveExecutionAlerts(),
      
      optimizationRecommendations: this.getOptimizationRecommendations()
    };

    return dashboard;
  }

  /**
   * Execute production order with AI optimization
   */
  async executeProductionOrder(orderId, options = {}) {
    const productionOrder = this.productionEngine.activeOrders.get(orderId);
    
    if (!productionOrder) {
      throw new Error(`Production order ${orderId} not found`);
    }

    if (productionOrder.status === 'executing') {
      throw new Error(`Production order ${orderId} is already executing`);
    }

    try {
      // Update order status
      productionOrder.status = 'executing';
      productionOrder.actualStartTime = new Date();
      
      // Initialize execution tracking
      const executionTracker = {
        orderId,
        phases: [],
        currentPhase: null,
        qualityCheckpoints: new Map(),
        alerts: [],
        metrics: {
          actualDuration: 0,
          yieldRate: 0,
          qualityScore: 0,
          costVariance: 0
        }
      };

      // Start production execution for each product
      for (const product of productionOrder.products) {
        const workflow = this.productionWorkflows[this.mapProductToWorkflow(product.productCode)];
        
        if (workflow) {
          const productExecution = await this.executeProductWorkflow(
            product, 
            workflow, 
            executionTracker,
            options
          );
          
          product.execution = productExecution;
          product.status = 'executing';
        }
      }

      // Setup real-time monitoring
      this.setupExecutionMonitoring(orderId, executionTracker);
      
      logInfo(`Started execution of production order ${orderId} with ${productionOrder.products.length} products`);
      
      this.emit('productionStarted', {
        orderId,
        productsCount: productionOrder.products.length,
        estimatedCompletion: productionOrder.estimatedCompletionTime
      });
      
      return {
        orderId,
        status: 'executing',
        startTime: productionOrder.actualStartTime,
        estimatedCompletion: productionOrder.estimatedCompletionTime,
        tracker: executionTracker
      };
      
    } catch (error) {
      productionOrder.status = 'execution_failed';
      logError(`Failed to execute production order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  isBotanicalIngredient(productCode) {
    const botanicalKeywords = [
      'ashwagandha', 'passionflower', 'magnolia', 'lemon_balm', 'schisandra',
      'hops', 'ginseng', 'ginkgo', 'linden', 'botanical', 'herb', 'extract'
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

  isPackagingMaterial(productCode) {
    const packagingKeywords = ['bottle', 'cap', 'label', 'case', 'box', 'packaging'];
    return packagingKeywords.some(keyword => 
      productCode.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  mapProductToWorkflow(productCode) {
    if (productCode.includes('GABA-RED') || productCode.includes('RED')) return 'GABA_RED';
    if (productCode.includes('GABA-GOLD') || productCode.includes('GOLD')) return 'GABA_GOLD';
    if (productCode.includes('GABA-BLACK') || productCode.includes('BLACK')) return 'GABA_BLACK';
    
    // Default mapping based on product naming
    if (productCode.includes('GABA')) {
      if (productCode.includes('1') || productCode.includes('RED')) return 'GABA_RED';
      if (productCode.includes('2') || productCode.includes('GOLD')) return 'GABA_GOLD';
      if (productCode.includes('3') || productCode.includes('BLACK')) return 'GABA_BLACK';
    }
    
    return 'GABA_RED'; // Default fallback
  }

  calculateOrderPriority(salesOrder) {
    let priority = 5; // Base priority (1-10 scale)
    
    // Customer importance
    if (salesOrder.Customer?.CustomerType === 'VIP') priority += 2;
    
    // Order urgency
    const daysUntilRequired = (new Date(salesOrder.RequiredDate) - new Date()) / (1000 * 60 * 60 * 24);
    if (daysUntilRequired < 7) priority += 3;
    else if (daysUntilRequired < 14) priority += 2;
    else if (daysUntilRequired < 21) priority += 1;
    
    // Order size
    const totalValue = salesOrder.OrderLines?.reduce((sum, line) => 
      sum + (line.OrderQuantity * line.UnitPrice), 0) || 0;
    if (totalValue > 10000) priority += 2;
    else if (totalValue > 5000) priority += 1;
    
    return Math.min(10, Math.max(1, priority));
  }

  findAvailableTimeSlot(schedule, duration, earliestStart = new Date()) {
    // Sort schedule by start time
    schedule.sort((a, b) => a.startTime - b.startTime);
    
    let proposedStart = new Date(Math.max(earliestStart.getTime(), Date.now()));
    
    for (const slot of schedule) {
      const proposedEnd = new Date(proposedStart.getTime() + duration * 60000);
      
      // Check if proposed slot conflicts with existing slot
      if (proposedEnd <= slot.startTime || proposedStart >= slot.endTime) {
        // No conflict, we can use this slot
        continue;
      } else {
        // Conflict, move proposed start to after this slot
        proposedStart = new Date(slot.endTime.getTime());
      }
    }
    
    return {
      startTime: proposedStart,
      endTime: new Date(proposedStart.getTime() + duration * 60000)
    };
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Handle digital twin updates
    this.digitalTwin.on(_'batchStarted', _(data) => {
      this.handleBatchStarted(data);
    });

    // Handle quality system alerts
    this.qualitySystem.on(_'qualityAlert', _(alert) => {
      this.handleQualityAlert(alert);
    });

    // Handle supply chain issues
    this.supplyChain.on(_'riskAlert', _(alert) => {
      this.handleSupplyChainRisk(alert);
    });

    // Handle MCP data updates
    this.mcpServers.orchestrator.on(_'dataUpdated', _(data) => {
      this.handleMCPDataUpdate(data);
    });
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    // Stop all active productions gracefully
    for (const [orderId, order] of this.productionEngine.activeOrders) {
      if (order.status === 'executing') {
        order.status = 'interrupted';
        logWarn(`Production order ${orderId} interrupted during shutdown`);
      }
    }

    // Clear all production data
    this.productionEngine.activeOrders.clear();
    this.productionEngine.productionQueue = [];
    this.productionEngine.facilitySchedules.clear();
    this.productionEngine.resourceAllocations.clear();

    // Shutdown integrated systems
    await this.digitalTwin.shutdown();
    await this.supplyChain.shutdown();
    await this.qualitySystem.shutdown();
    await this.mcpServers.shutdown();

    logInfo('Manufacturing Execution Intelligence shutdown complete');
  }
}

export default SentiaManufacturingExecution;