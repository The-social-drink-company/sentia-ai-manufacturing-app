import { EventEmitter } from 'events';
import * as THREE from 'three';
import axios from 'axios';
import logger, { logInfo, logError, logWarn } from '../logger.js';
import ManufacturingMCPServers from '../mcp/manufacturingMCPServers.js';

/**
 * Sentia Digital Twin Platform
 * Real-time visualization and simulation of outsourced botanical beverage production
 * Specialized for functional drinks with GABA-enhancing botanicals
 */
class SentiaDigitalTwinPlatform extends EventEmitter {
  constructor() {
    super();
    
    this.mcpServers = new ManufacturingMCPServers();
    
    // Sentia-specific production facilities
    this.productionFacilities = {
      mixingFacility: {
        id: 'facility_mixing_001',
        name: 'Botanical Mixing & Infusion Facility',
        type: 'outsourced_mixing',
        location: 'UK',
        capabilities: ['botanical_extraction', 'gaba_infusion', 'quality_testing', 'blending'],
        equipment: new Map(),
        processes: new Map(),
        digitalTwin: null
      },
      bottlingFacility: {
        id: 'facility_bottling_001', 
        name: 'Bottling & Labelling Facility',
        type: 'outsourced_bottling',
        location: 'UK',
        capabilities: ['bottling', 'labelling', 'packaging', 'quality_control'],
        equipment: new Map(),
        processes: new Map(),
        digitalTwin: null
      },
      warehouses: {
        uk: { id: 'warehouse_uk_001', name: 'UK Distribution Center', location: 'UK' },
        eu: { id: 'warehouse_eu_001', name: 'EU Distribution Center', location: 'EU' },
        usa: { id: 'warehouse_usa_001', name: 'USA Distribution Center', location: 'USA' }
      }
    };

    // Sentia product specifications
    this.productSpecs = {
      'GABA_RED': {
        sku: 'GABA-RED-500ML',
        name: 'SENTIA GABA Red',
        botanicals: ['ashwagandha', 'passionflower', 'magnolia_bark'],
        targetGABA: 750, // mg per bottle
        volume: 500, // ml
        shelfLife: 24, // months
        qualityParams: {
          pH: { min: 3.2, max: 3.8, target: 3.5 },
          brix: { min: 8, max: 12, target: 10 },
          botanicalConcentration: { min: 95, max: 105, target: 100 }, // % of target
          microbial: { max: 100 }, // CFU/ml
          color: { target: 'ruby_red', tolerance: 5 }
        }
      },
      'GABA_GOLD': {
        sku: 'GABA-GOLD-500ML',
        name: 'SENTIA GABA Gold',
        botanicals: ['lemon_balm', 'schisandra', 'hops'],
        targetGABA: 750,
        volume: 500,
        shelfLife: 24,
        qualityParams: {
          pH: { min: 3.0, max: 3.6, target: 3.3 },
          brix: { min: 7, max: 11, target: 9 },
          botanicalConcentration: { min: 95, max: 105, target: 100 },
          microbial: { max: 100 },
          color: { target: 'golden_amber', tolerance: 5 }
        }
      },
      'GABA_BLACK': {
        sku: 'GABA-BLACK-500ML',
        name: 'SENTIA GABA Black',
        botanicals: ['ginseng', 'ginkgo', 'linden'],
        targetGABA: 750,
        volume: 500,
        shelfLife: 24,
        qualityParams: {
          pH: { min: 3.1, max: 3.7, target: 3.4 },
          brix: { min: 8, max: 12, target: 10 },
          botanicalConcentration: { min: 95, max: 105, target: 100 },
          microbial: { max: 100 },
          color: { target: 'deep_black', tolerance: 5 }
        }
      }
    };

    // Digital twin models
    this.digitalTwins = new Map();
    this.processSimulations = new Map();
    this.realTimeData = new Map();
    this.qualityPredictions = new Map();
    
    // 3D Visualization engine
    this.visualizationEngine = {
      scene: null,
      renderer: null,
      cameras: new Map(),
      meshes: new Map(),
      animations: new Map(),
      initialized: false
    };

    // Simulation parameters
    this.simulationConfig = {
      updateInterval: 5000, // 5 seconds
      predictionHorizon: 168, // 1 week in hours
      qualityCheckInterval: 30000, // 30 seconds
      facilitySync: true
    };

    this.initializePlatform();
    logInfo('Sentia Digital Twin Platform initialized');
  }

  /**
   * Initialize the digital twin platform
   */
  async initializePlatform() {
    try {
      // Setup MCP integration for real-time data
      await this.mcpServers.initializeDefaultServers();
      
      // Initialize facility digital twins
      await this.initializeFacilityTwins();
      
      // Setup process simulations
      await this.initializeProcessSimulations();
      
      // Initialize 3D visualization
      await this.initialize3DVisualization();
      
      // Start real-time synchronization
      this.startRealTimeSync();
      
      // Setup event handlers
      this.setupEventHandlers();
      
      logInfo('Digital Twin Platform initialization complete');
    } catch (error) {
      logError('Platform initialization failed:', error);
    }
  }

  /**
   * Initialize digital twins for each production facility
   */
  async initializeFacilityTwins() {
    // Mixing Facility Digital Twin
    const mixingTwin = await this.createMixingFacilityTwin();
    this.digitalTwins.set('mixing_facility', mixingTwin);
    
    // Bottling Facility Digital Twin
    const bottlingTwin = await this.createBottlingFacilityTwin();
    this.digitalTwins.set('bottling_facility', bottlingTwin);
    
    // Warehouse Digital Twins
    for (const [region, warehouse] of Object.entries(this.productionFacilities.warehouses)) {
      const warehouseTwin = await this.createWarehouseTwin(warehouse);
      this.digitalTwins.set(`warehouse_${region}`, warehouseTwin);
    }

    logInfo('Facility digital twins initialized');
  }

  /**
   * Create digital twin for the botanical mixing facility
   */
  async createMixingFacilityTwin() {
    const facility = this.productionFacilities.mixingFacility;
    
    const digitalTwin = {
      id: facility.id,
      name: facility.name,
      type: 'mixing_facility_twin',
      physicalAsset: facility,
      
      // Virtual representation
      virtualModel: {
        layout: {
          botanicalStorage: { capacity: 1000, currentStock: new Map() },
          extractionUnits: [
            { id: 'extractor_001', status: 'operational', currentProduct: null, efficiency: 95 },
            { id: 'extractor_002', status: 'operational', currentProduct: null, efficiency: 93 }
          ],
          blendingTanks: [
            { id: 'tank_001', capacity: 2000, currentVolume: 0, product: null },
            { id: 'tank_002', capacity: 2000, currentVolume: 0, product: null },
            { id: 'tank_003', capacity: 2000, currentVolume: 0, product: null }
          ],
          qualityLab: { status: 'operational', backlog: 0, avgTestTime: 45 }, // minutes
          transferSystem: { status: 'operational', throughput: 500 } // L/hour
        },
        
        // Current processes
        activeProcesses: new Map(),
        
        // Environmental conditions
        environment: {
          temperature: 18, // Celsius - optimal for botanical preservation
          humidity: 45, // % - controlled for ingredient stability
          pressure: 1013, // mbar
          airQuality: 'filtered'
        },
        
        // Quality metrics
        quality: {
          botanicalPotency: {},
          extractionEfficiency: {},
          blendConsistency: {},
          microbiological: {}
        }
      },
      
      // Real-time synchronization
      synchronization: {
        lastSync: new Date(),
        syncInterval: this.simulationConfig.updateInterval,
        dataStreams: ['process_data', 'quality_data', 'environmental_data'],
        enabled: true
      },
      
      // Predictive capabilities
      predictions: {
        batchCompletionTimes: new Map(),
        qualityForecasts: new Map(),
        equipmentMaintenance: new Map(),
        capacityUtilization: {}
      },

      // 3D visualization data
      visualization: {
        position: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        rotation: { x: 0, y: 0, z: 0 },
        meshes: {},
        animations: {},
        materials: {}
      }
    };

    // Initialize botanical inventory
    await this.initializeBotanicalInventory(digitalTwin);
    
    return digitalTwin;
  }

  /**
   * Create digital twin for the bottling facility
   */
  async createBottlingFacilityTwin() {
    const facility = this.productionFacilities.bottlingFacility;
    
    const digitalTwin = {
      id: facility.id,
      name: facility.name,
      type: 'bottling_facility_twin',
      physicalAsset: facility,
      
      virtualModel: {
        layout: {
          receivingTanks: [
            { id: 'receiving_001', capacity: 5000, currentVolume: 0, product: null },
            { id: 'receiving_002', capacity: 5000, currentVolume: 0, product: null }
          ],
          bottlingLines: [
            { 
              id: 'line_001', 
              speed: 1200, // bottles/hour
              efficiency: 92,
              currentProduct: null,
              status: 'operational',
              qualityChecks: { frequency: 100, lastCheck: new Date() }
            },
            {
              id: 'line_002',
              speed: 1000,
              efficiency: 89,
              currentProduct: null,
              status: 'operational',
              qualityChecks: { frequency: 100, lastCheck: new Date() }
            }
          ],
          labelingStations: [
            { id: 'label_001', speed: 1500, efficiency: 96, status: 'operational' },
            { id: 'label_002', speed: 1400, efficiency: 94, status: 'operational' }
          ],
          packagingArea: {
            capacity: 10000, // bottles
            currentStock: 0,
            packagingRate: 2000, // bottles/hour
            status: 'operational'
          },
          qualityControl: {
            stations: 3,
            sampleRate: 0.5, // % of production
            avgInspectionTime: 5, // minutes
            backlog: 0
          }
        },
        
        activeOrders: new Map(),
        
        environment: {
          temperature: 22,
          humidity: 50,
          cleanliness: 'ISO_22000_compliant',
          lighting: 'optimal'
        },
        
        quality: {
          fillAccuracy: {},
          sealIntegrity: {},
          labelAlignment: {},
          visualInspection: {}
        }
      },
      
      synchronization: {
        lastSync: new Date(),
        syncInterval: this.simulationConfig.updateInterval,
        dataStreams: ['production_data', 'quality_data', 'order_data'],
        enabled: true
      },
      
      predictions: {
        orderCompletionTimes: new Map(),
        bottlingEfficiency: {},
        qualityTrends: new Map(),
        equipmentUtilization: {}
      },

      visualization: {
        position: { x: 100, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        rotation: { x: 0, y: 0, z: 0 },
        meshes: {},
        animations: {},
        materials: {}
      }
    };

    return digitalTwin;
  }

  /**
   * Create warehouse digital twin
   */
  async createWarehouseTwin(warehouseConfig) {
    const digitalTwin = {
      id: warehouseConfig.id,
      name: warehouseConfig.name,
      type: 'warehouse_twin',
      region: warehouseConfig.location,
      
      virtualModel: {
        layout: {
          receivingDock: { capacity: 500, currentLoad: 0 },
          storage: {
            zones: [
              { id: 'zone_A', capacity: 5000, currentStock: 0, temperature: 'ambient' },
              { id: 'zone_B', capacity: 3000, currentStock: 0, temperature: 'controlled' }
            ]
          },
          shippingDock: { capacity: 300, currentLoad: 0 },
          qualityHold: { capacity: 500, currentStock: 0 }
        },
        
        inventory: new Map(), // SKU -> quantity
        
        activeOrders: {
          inbound: new Map(),
          outbound: new Map(),
          ecommerce: new Map() // Amazon, Shopify orders
        },
        
        automation: {
          wms: { status: 'connected', efficiency: 98 },
          picking: { method: 'manual', efficiency: 85 },
          sorting: { method: 'automated', efficiency: 92 }
        }
      },
      
      synchronization: {
        lastSync: new Date(),
        syncInterval: this.simulationConfig.updateInterval,
        dataStreams: ['inventory_data', 'order_data', 'shipment_data'],
        enabled: true
      },
      
      predictions: {
        inventoryLevels: new Map(),
        orderFulfillmentTimes: new Map(),
        shippingOptimization: {},
        demandForecasting: {}
      },

      visualization: {
        position: { 
          x: warehouseConfig.location === 'UK' ? -50 : warehouseConfig.location === 'EU' ? 0 : 50, 
          y: -50, 
          z: 0 
        },
        scale: { x: 0.8, y: 0.8, z: 0.8 },
        rotation: { x: 0, y: 0, z: 0 },
        meshes: {},
        animations: {},
        materials: {}
      }
    };

    return digitalTwin;
  }

  /**
   * Initialize botanical inventory for mixing facility
   */
  async initializeBotanicalInventory(mixingTwin) {
    const botanicalInventory = {
      // GABA Red botanicals
      ashwagandha: { stock: 250, unit: 'kg', potency: 98, expiry: new Date('2024-12-31') },
      passionflower: { stock: 180, unit: 'kg', potency: 96, expiry: new Date('2024-11-30') },
      magnolia_bark: { stock: 120, unit: 'kg', potency: 99, expiry: new Date('2025-01-31') },
      
      // GABA Gold botanicals
      lemon_balm: { stock: 200, unit: 'kg', potency: 97, expiry: new Date('2024-12-15') },
      schisandra: { stock: 150, unit: 'kg', potency: 95, expiry: new Date('2025-02-28') },
      hops: { stock: 90, unit: 'kg', potency: 98, expiry: new Date('2024-10-31') },
      
      // GABA Black botanicals
      ginseng: { stock: 175, unit: 'kg', potency: 96, expiry: new Date('2025-03-31') },
      ginkgo: { stock: 140, unit: 'kg', potency: 99, expiry: new Date('2024-11-15') },
      linden: { stock: 110, unit: 'kg', potency: 97, expiry: new Date('2025-01-15') },
      
      // Base ingredients
      purified_water: { stock: 10000, unit: 'L', quality: 'pharmaceutical_grade' },
      natural_flavoring: { stock: 500, unit: 'kg', variety: 'mixed' },
      citric_acid: { stock: 200, unit: 'kg', purity: 99.5 },
      potassium_sorbate: { stock: 50, unit: 'kg', purity: 99.0 }
    };

    mixingTwin.virtualModel.layout.botanicalStorage.currentStock = new Map(Object.entries(botanicalInventory));
  }

  /**
   * Initialize process simulations for each product
   */
  async initializeProcessSimulations() {
    for (const [productKey, productSpec] of Object.entries(this.productSpecs)) {
      const simulation = await this.createProductionSimulation(productKey, productSpec);
      this.processSimulations.set(productKey, simulation);
    }

    logInfo('Process simulations initialized for all products');
  }

  /**
   * Create production simulation for a specific product
   */
  async createProductionSimulation(productKey, productSpec) {
    const simulation = {
      product: productSpec,
      phases: {
        // Phase 1: Botanical extraction and infusion (Mixing Facility)
        extraction: {
          duration: 240, // 4 hours
          temperature: { min: 15, max: 25, optimal: 20 },
          efficiency: { min: 92, max: 98, target: 95 },
          qualityChecks: ['potency', 'purity', 'microbial'],
          dependencies: ['botanical_inventory', 'extraction_equipment']
        },
        
        // Phase 2: Blending and quality control (Mixing Facility)
        blending: {
          duration: 120, // 2 hours
          temperature: { min: 18, max: 22, optimal: 20 },
          mixing: { speed: 'low', duration: 90 }, // minutes
          qualityChecks: ['pH', 'brix', 'botanical_concentration', 'color'],
          dependencies: ['blending_tanks', 'quality_lab']
        },
        
        // Phase 3: Transfer to bottling facility
        transfer: {
          duration: 60, // 1 hour including logistics
          temperature: { maintained: true, range: [18, 22] },
          qualityChecks: ['temperature_log', 'container_integrity'],
          dependencies: ['transport_system', 'receiving_tanks']
        },
        
        // Phase 4: Bottling and labeling (Bottling Facility)
        bottling: {
          duration: 180, // 3 hours for typical batch
          speed: { min: 1000, max: 1500, target: 1200 }, // bottles/hour
          qualityChecks: ['fill_volume', 'seal_integrity', 'label_accuracy'],
          dependencies: ['bottling_lines', 'quality_control']
        },
        
        // Phase 5: Packaging and dispatch
        packaging: {
          duration: 120, // 2 hours
          rate: { target: 2000 }, // bottles/hour
          qualityChecks: ['package_integrity', 'batch_documentation'],
          dependencies: ['packaging_area', 'dispatch_system']
        }
      },
      
      // Real-time variables
      currentPhase: null,
      batchId: null,
      startTime: null,
      estimatedCompletion: null,
      qualityParameters: new Map(),
      
      // Optimization parameters
      optimization: {
        throughput: true,
        quality: true,
        efficiency: true,
        costMinimization: true
      },
      
      // Simulation state
      isRunning: false,
      progress: 0,
      alerts: [],
      recommendations: []
    };

    return simulation;
  }

  /**
   * Initialize 3D visualization engine
   */
  async initialize3DVisualization() {
    try {
      // Initialize Three.js scene
      this.visualizationEngine.scene = new THREE.Scene();
      
      // Setup cameras for different views
      this.visualizationEngine.cameras.set('overview', new THREE.PerspectiveCamera(75, 16/9, 0.1, 1000));
      this.visualizationEngine.cameras.set('mixing', new THREE.PerspectiveCamera(75, 16/9, 0.1, 1000));
      this.visualizationEngine.cameras.set('bottling', new THREE.PerspectiveCamera(75, 16/9, 0.1, 1000));
      
      // Position cameras
      this.visualizationEngine.cameras.get('overview').position.set(0, 100, 200);
      this.visualizationEngine.cameras.get('mixing').position.set(-50, 50, 100);
      this.visualizationEngine.cameras.get('bottling').position.set(50, 50, 100);

      // Create 3D models for facilities
      await this.create3DModels();
      
      // Setup lighting
      this.setupLighting();
      
      // Initialize animations
      this.initializeAnimations();
      
      this.visualizationEngine.initialized = true;
      logInfo('3D visualization engine initialized');
      
    } catch (error) {
      logWarn('3D visualization initialization failed:', error);
      this.visualizationEngine.initialized = false;
    }
  }

  /**
   * Create 3D models for all facilities and equipment
   */
  async create3DModels() {
    const geometry = new THREE.BoxGeometry();
    const materials = {
      mixing: new THREE.MeshPhongMaterial({ color: 0x4CAF50 }), // Green for mixing
      bottling: new THREE.MeshPhongMaterial({ color: 0x2196F3 }), // Blue for bottling
      warehouse: new THREE.MeshPhongMaterial({ color: 0xFF9800 }), // Orange for warehouses
      product: new THREE.MeshPhongMaterial({ color: 0x9C27B0 }) // Purple for products
    };

    // Create mixing facility model
    const mixingMesh = new THREE.Mesh(geometry, materials.mixing);
    mixingMesh.position.set(0, 0, 0);
    mixingMesh.scale.set(20, 15, 30);
    this.visualizationEngine.scene.add(mixingMesh);
    this.visualizationEngine.meshes.set('mixing_facility', mixingMesh);

    // Create bottling facility model
    const bottlingMesh = new THREE.Mesh(geometry, materials.bottling);
    bottlingMesh.position.set(100, 0, 0);
    bottlingMesh.scale.set(25, 12, 35);
    this.visualizationEngine.scene.add(bottlingMesh);
    this.visualizationEngine.meshes.set('bottling_facility', bottlingMesh);

    // Create warehouse models
    Object.entries(this.productionFacilities.warehouses).forEach(_([region, warehouse]) => {
      const warehouseMesh = new THREE.Mesh(geometry, materials.warehouse);
      const twin = this.digitalTwins.get(`warehouse_${region}`);
      if (twin) {
        warehouseMesh.position.set(twin.visualization.position.x, twin.visualization.position.y, twin.visualization.position.z);
        warehouseMesh.scale.set(15, 10, 20);
        this.visualizationEngine.scene.add(warehouseMesh);
        this.visualizationEngine.meshes.set(`warehouse_${region}`, warehouseMesh);
      }
    });
  }

  /**
   * Setup lighting for 3D scene
   */
  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.visualizationEngine.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    this.visualizationEngine.scene.add(directionalLight);

    // Point lights for each facility
    const mixingLight = new THREE.PointLight(0x4CAF50, 0.5, 100);
    mixingLight.position.set(0, 20, 0);
    this.visualizationEngine.scene.add(mixingLight);

    const bottlingLight = new THREE.PointLight(0x2196F3, 0.5, 100);
    bottlingLight.position.set(100, 20, 0);
    this.visualizationEngine.scene.add(bottlingLight);
  }

  /**
   * Start real-time synchronization with physical facilities
   */
  startRealTimeSync() {
    const syncInterval = setInterval(async () => {
      try {
        // Sync all digital twins
        for (const [twinId, twin] of this.digitalTwins) {
          await this.syncDigitalTwin(twinId, twin);
        }
        
        // Update process simulations
        for (const [productKey, simulation] of this.processSimulations) {
          if (simulation.isRunning) {
            await this.updateSimulation(productKey, simulation);
          }
        }
        
        // Update 3D visualization
        if (this.visualizationEngine.initialized) {
          this.update3DVisualization();
        }
        
        this.emit('syncCompleted', { timestamp: new Date() });
        
      } catch (error) {
        logError('Real-time sync error:', error);
      }
    }, this.simulationConfig.updateInterval);

    logInfo('Real-time synchronization started');
    return syncInterval;
  }

  /**
   * Synchronize a specific digital twin with real-time data
   */
  async syncDigitalTwin(twinId, twin) {
    try {
      // Query relevant MCP servers for real-time data
      const dataQuery = {
        intent: `real-time data for ${twin.name}`,
        parameters: {
          facilityId: twin.id,
          dataTypes: twin.synchronization.dataStreams,
          timeRange: { minutes: 5 }
        }
      };

      const realTimeData = await this.mcpServers.queryManufacturingIntelligence(dataQuery);
      
      if (realTimeData && realTimeData.data) {
        // Update twin state based on real data
        this.updateTwinFromRealData(twin, realTimeData.data);
        
        // Update predictions
        await this.updateTwinPredictions(twin);
        
        // Check for anomalies or alerts
        this.checkTwinHealth(twin);
        
        twin.synchronization.lastSync = new Date();
      }
      
    } catch (error) {
      logWarn(`Twin sync failed for ${twinId}:`, error);
    }
  }

  /**
   * Start a production batch simulation
   */
  async startProductionBatch(productKey, batchSize, priority = 'normal') {
    const simulation = this.processSimulations.get(productKey);
    const productSpec = this.productSpecs[productKey];
    
    if (!simulation || !productSpec) {
      throw new Error(`Product ${productKey} not found`);
    }

    if (simulation.isRunning) {
      throw new Error(`Production already running for ${productKey}`);
    }

    // Initialize batch
    const batchId = `BATCH_${productKey}_${Date.now()}`;
    simulation.batchId = batchId;
    simulation.startTime = new Date();
    simulation.isRunning = true;
    simulation.progress = 0;
    simulation.batchSize = batchSize;
    simulation.priority = priority;
    
    // Calculate estimated completion time
    const totalDuration = Object.values(simulation.phases)
      .reduce((total, phase) => total + phase.duration, 0);
    simulation.estimatedCompletion = new Date(Date.now() + totalDuration * 60 * 1000);

    // Start with extraction phase
    simulation.currentPhase = 'extraction';
    
    logInfo(`Started production batch: ${batchId} for ${productSpec.name}`);
    this.emit('batchStarted', { batchId, productKey, batchSize, estimatedCompletion: simulation.estimatedCompletion });
    
    return {
      batchId,
      productKey,
      batchSize,
      estimatedCompletion: simulation.estimatedCompletion,
      phases: Object.keys(simulation.phases)
    };
  }

  /**
   * Get comprehensive platform status
   */
  getPlatformStatus() {
    const status = {
      timestamp: new Date(),
      platform: {
        initialized: true,
        facilitiesConnected: this.digitalTwins.size,
        visualization3D: this.visualizationEngine.initialized,
        realTimeSync: true
      },
      
      facilities: {},
      
      activeProductions: {},
      
      systemHealth: {
        overallStatus: 'operational',
        lastSync: this.getLastSyncTime(),
        dataStreams: this.getActiveDataStreams(),
        alerts: this.getActiveAlerts()
      },
      
      capabilities: {
        realTimeMonitoring: true,
        predictiveAnalysis: true,
        qualityPrediction: true,
        productionOptimization: true,
        multiProductSupport: true,
        facilityCoordination: true,
        visualization3D: this.visualizationEngine.initialized
      }
    };

    // Add facility status
    for (const [twinId, twin] of this.digitalTwins) {
      status.facilities[twinId] = {
        name: twin.name,
        type: twin.type,
        status: this.getTwinStatus(twin),
        lastSync: twin.synchronization.lastSync,
        alerts: this.getTwinAlerts(twin)
      };
    }

    // Add active production status
    for (const [productKey, simulation] of this.processSimulations) {
      if (simulation.isRunning) {
        status.activeProductions[productKey] = {
          batchId: simulation.batchId,
          currentPhase: simulation.currentPhase,
          progress: simulation.progress,
          estimatedCompletion: simulation.estimatedCompletion,
          batchSize: simulation.batchSize
        };
      }
    }

    return status;
  }

  /**
   * Generate 3D scene data for frontend visualization
   */
  generate3DSceneData(cameraView = 'overview') {
    if (!this.visualizationEngine.initialized) {
      return { error: 'Visualization engine not initialized' };
    }

    const sceneData = {
      camera: cameraView,
      timestamp: new Date(),
      facilities: [],
      connections: [],
      animations: [],
      metrics: {}
    };

    // Export facility data for 3D rendering
    for (const [twinId, twin] of this.digitalTwins) {
      const mesh = this.visualizationEngine.meshes.get(twinId);
      if (mesh) {
        sceneData.facilities.push({
          id: twinId,
          name: twin.name,
          type: twin.type,
          position: mesh.position.toArray(),
          scale: mesh.scale.toArray(),
          rotation: mesh.rotation.toArray(),
          status: this.getTwinStatus(twin),
          color: this.getTwinStatusColor(twin),
          metrics: this.getTwinMetrics(twin)
        });
      }
    }

    // Add production flow connections
    sceneData.connections = this.generateProductionFlowData();

    return sceneData;
  }

  /**
   * Helper methods
   */
  getTwinStatus(twin) {
    if (!twin.synchronization.lastSync) return 'disconnected';
    
    const timeSinceSync = Date.now() - twin.synchronization.lastSync.getTime();
    if (timeSinceSync > 60000) return 'stale'; // 1 minute
    if (timeSinceSync > 300000) return 'disconnected'; // 5 minutes
    
    return 'operational';
  }

  getTwinStatusColor(twin) {
    switch (this.getTwinStatus(twin)) {
      case 'operational': return '#4CAF50';
      case 'stale': return '#FF9800';
      case 'disconnected': return '#F44336';
      default: return '#9E9E9E';
    }
  }

  generateProductionFlowData() {
    return [
      {
        from: 'mixing_facility',
        to: 'bottling_facility',
        type: 'liquid_transfer',
        status: 'active',
        flow_rate: 500 // L/hour
      },
      {
        from: 'bottling_facility',
        to: 'warehouse_uk',
        type: 'finished_goods',
        status: 'active',
        throughput: 1200 // bottles/hour
      },
      {
        from: 'warehouse_uk',
        to: 'warehouse_eu',
        type: 'distribution',
        status: 'scheduled'
      },
      {
        from: 'warehouse_uk',
        to: 'warehouse_usa',
        type: 'distribution',
        status: 'scheduled'
      }
    ];
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    // Stop all simulations
    for (const simulation of this.processSimulations.values()) {
      simulation.isRunning = false;
    }

    // Cleanup 3D visualization
    if (this.visualizationEngine.scene) {
      this.visualizationEngine.scene.clear();
    }

    // Shutdown MCP servers
    await this.mcpServers.shutdown();
    
    // Clear all data
    this.digitalTwins.clear();
    this.processSimulations.clear();
    this.realTimeData.clear();
    this.qualityPredictions.clear();
    
    logInfo('Sentia Digital Twin Platform shutdown complete');
  }
}

export default SentiaDigitalTwinPlatform;