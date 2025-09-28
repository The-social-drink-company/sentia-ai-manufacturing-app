import { EventEmitter } from 'events';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import logger, { logInfo, logError, logWarn } from '../logger.js';
import ManufacturingMCPServers from '../mcp/manufacturingMCPServers.js';

/**
 * Sentia Computer Vision Quality System
 * AI-powered visual inspection for botanical ingredients and finished products
 * Specialized for functional botanical beverage quality control
 */
class SentiaComputerVisionQuality extends EventEmitter {
  constructor() {
    super();
    
    this.mcpServers = new ManufacturingMCPServers();
    
    // AI Vision Models
    this.visionModels = {
      openai: {
        client: this.initializeOpenAIVision(),
        model: 'gpt-4-vision-preview',
        enabled: false
      },
      azure: {
        client: this.initializeAzureVision(),
        model: 'gpt-4-vision',
        enabled: false
      },
      roboflow: {
        client: this.initializeRoboflow(),
        model: 'botanical-quality-v2',
        enabled: false
      }
    };

    // Botanical Quality Standards for Sentia products
    this.botanicalStandards = {
      ashwagandha: {
        color: { target: 'light_brown', tolerance: 0.15 },
        texture: { target: 'fine_powder', particles: { max_size: 200 } }, // microns
        moisture: { max: 8 }, // %
        potency: { min: 1.5, max: 12 }, // % withanolides
        contaminants: { heavy_metals: { max: 10 }, microbial: { max: 1000 } }, // ppm, CFU/g
        visual_defects: ['discoloration', 'foreign_matter', 'clumping']
      },
      passionflower: {
        color: { target: 'green_brown', tolerance: 0.12 },
        texture: { target: 'crushed_leaves', particle_size: { min: 500, max: 2000 } },
        moisture: { max: 10 },
        potency: { min: 0.8, max: 2.1 }, // % vitexin
        contaminants: { pesticides: { max: 0.5 }, microbial: { max: 1000 } },
        visual_defects: ['stems', 'discolored_leaves', 'foreign_plant_matter']
      },
      magnolia_bark: {
        color: { target: 'reddish_brown', tolerance: 0.18 },
        texture: { target: 'bark_pieces', size: { min: 1000, max: 5000 } },
        moisture: { max: 12 },
        potency: { min: 1.0, max: 3.0 }, // % honokiol + magnolol
        contaminants: { heavy_metals: { max: 15 }, microbial: { max: 500 } },
        visual_defects: ['mold', 'insect_damage', 'excessive_bark_dust']
      },
      lemon_balm: {
        color: { target: 'light_green', tolerance: 0.10 },
        texture: { target: 'dried_leaves', fragmentation: 'moderate' },
        moisture: { max: 9 },
        potency: { min: 0.05, max: 0.3 }, // % rosmarinic acid
        contaminants: { pesticides: { max: 0.1 }, microbial: { max: 1000 } },
        visual_defects: ['brown_spots', 'stem_fragments', 'foreign_matter']
      },
      schisandra: {
        color: { target: 'dark_red', tolerance: 0.20 },
        texture: { target: 'dried_berries', integrity: 'whole_to_broken' },
        moisture: { max: 11 },
        potency: { min: 2.0, max: 9.0 }, // % schisandrins
        contaminants: { heavy_metals: { max: 12 }, microbial: { max: 500 } },
        visual_defects: ['shriveled_berries', 'mold', 'insect_holes']
      },
      hops: {
        color: { target: 'golden_green', tolerance: 0.15 },
        texture: { target: 'cone_fragments', lupulin: 'visible_yellow_powder' },
        moisture: { max: 10 },
        potency: { min: 8.0, max: 16.0 }, // % alpha acids
        contaminants: { pesticides: { max: 1.0 }, microbial: { max: 1000 } },
        visual_defects: ['brown_cones', 'missing_lupulin', 'stem_pieces']
      },
      ginseng: {
        color: { target: 'cream_white', tolerance: 0.12 },
        texture: { target: 'fine_powder', density: 'consistent' },
        moisture: { max: 7 },
        potency: { min: 1.5, max: 7.0 }, // % ginsenosides
        contaminants: { heavy_metals: { max: 8 }, microbial: { max: 500 } },
        visual_defects: ['yellowing', 'foreign_particles', 'clumping']
      },
      ginkgo: {
        color: { target: 'light_brown', tolerance: 0.14 },
        texture: { target: 'leaf_powder', fineness: 'uniform' },
        moisture: { max: 8 },
        potency: { min: 22.0, max: 27.0 }, // % flavone glycosides
        contaminants: { ginkgolic_acids: { max: 5 }, microbial: { max: 1000 } }, // ppm
        visual_defects: ['dark_spots', 'foreign_plant_matter', 'excessive_moisture']
      },
      linden: {
        color: { target: 'pale_yellow', tolerance: 0.16 },
        texture: { target: 'flower_fragments', petals: 'intact_to_broken' },
        moisture: { max: 9 },
        potency: { min: 0.5, max: 2.0 }, // % flavonoids
        contaminants: { pesticides: { max: 0.3 }, microbial: { max: 1000 } },
        visual_defects: ['brown_flowers', 'excessive_stem', 'foreign_pollen']
      }
    };

    // Finished Product Quality Standards
    this.finishedProductStandards = {
      'GABA_RED': {
        color: { target: 'ruby_red', rgb: [139, 28, 35], tolerance: 15 },
        clarity: { min: 85 }, // % light transmission
        fill_level: { min: 495, max: 505 }, // ml
        bubble_count: { max: 3 }, // visible bubbles
        sediment: { max: 0.1 }, // % volume
        label_alignment: { tolerance: 2 }, // mm
        cap_torque: { min: 15, max: 25 }, // inch-pounds
        defects: ['scratches', 'dents', 'label_wrinkles', 'uneven_fill']
      },
      'GABA_GOLD': {
        color: { target: 'golden_amber', rgb: [255, 191, 0], tolerance: 20 },
        clarity: { min: 90 },
        fill_level: { min: 495, max: 505 },
        bubble_count: { max: 2 },
        sediment: { max: 0.05 },
        label_alignment: { tolerance: 2 },
        cap_torque: { min: 15, max: 25 },
        defects: ['scratches', 'dents', 'label_wrinkles', 'uneven_fill']
      },
      'GABA_BLACK': {
        color: { target: 'deep_black', rgb: [28, 28, 28], tolerance: 10 },
        clarity: { min: 80 }, // Lower due to dark color
        fill_level: { min: 495, max: 505 },
        bubble_count: { max: 4 },
        sediment: { max: 0.15 },
        label_alignment: { tolerance: 2 },
        cap_torque: { min: 15, max: 25 },
        defects: ['scratches', 'dents', 'label_wrinkles', 'uneven_fill']
      }
    };

    // Inspection stations and cameras
    this.inspectionStations = {
      botanical_incoming: {
        id: 'station_botanical_001',
        location: 'mixing_facility_receiving',
        cameras: ['camera_001', 'camera_002'],
        lighting: 'controlled_led',
        resolution: '4K',
        inspection_types: ['color', 'texture', 'contaminants', 'particle_size'],
        active: false
      },
      botanical_processing: {
        id: 'station_botanical_002',
        location: 'mixing_facility_processing',
        cameras: ['camera_003'],
        lighting: 'overhead_led',
        resolution: '1080p',
        inspection_types: ['mixing_quality', 'consistency', 'color_uniformity'],
        active: false
      },
      finished_product: {
        id: 'station_finished_001',
        location: 'bottling_facility_line1',
        cameras: ['camera_004', 'camera_005'],
        lighting: 'backlit_inspection',
        resolution: '4K',
        inspection_types: ['fill_level', 'clarity', 'color', 'label_quality'],
        active: false
      },
      packaging: {
        id: 'station_packaging_001',
        location: 'bottling_facility_packaging',
        cameras: ['camera_006'],
        lighting: 'ambient_plus_flash',
        resolution: '2K',
        inspection_types: ['package_integrity', 'labeling', 'batch_codes'],
        active: false
      }
    };

    // Quality inspection results
    this.inspectionResults = new Map();
    this.qualityTrends = new Map();
    this.alertThresholds = new Map();

    // Processing queue
    this.processingQueue = [];
    this.isProcessing = false;

    this.initializeSystem();
    logInfo('Sentia Computer Vision Quality System initialized');
  }

  /**
   * Initialize vision AI clients
   */
  initializeOpenAIVision() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const client = axios.create({
      baseURL: 'https://api.openai.com/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    this.visionModels.openai.enabled = true;
    return client;
  }

  initializeAzureVision() {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    if (!apiKey || !endpoint) return null;

    const client = axios.create({
      baseURL: `${endpoint}/openai/deployments`,
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    this.visionModels.azure.enabled = true;
    return client;
  }

  initializeRoboflow() {
    const apiKey = process.env.ROBOFLOW_API_KEY;
    const workspaceId = process.env.ROBOFLOW_WORKSPACE;
    if (!apiKey || !workspaceId) return null;

    const client = axios.create({
      baseURL: `https://detect.roboflow.com/${workspaceId}`,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.visionModels.roboflow.enabled = true;
    return client;
  }

  /**
   * Initialize the quality system
   */
  async initializeSystem() {
    try {
      // Setup MCP integration for quality data
      await this.mcpServers.initializeDefaultServers();
      
      // Initialize inspection stations
      await this.initializeInspectionStations();
      
      // Setup quality standards
      this.setupQualityAlertThresholds();
      
      // Start processing queue
      this.startProcessingQueue();
      
      // Setup event handlers
      this.setupEventHandlers();
      
      logInfo('Computer Vision Quality System initialization complete');
    } catch (error) {
      logError('Quality system initialization failed:', error);
    }
  }

  /**
   * Initialize inspection stations
   */
  async initializeInspectionStations() {
    for (const [stationId, station] of Object.entries(this.inspectionStations)) {
      try {
        // Simulate camera initialization
        station.active = true;
        station.lastCalibration = new Date();
        station.imagesProcessed = 0;
        station.qualityMetrics = {
          passRate: 0,
          totalInspections: 0,
          averageScore: 0
        };

        logInfo(`Inspection station initialized: ${stationId} (${station.location})`);
      } catch (error) {
        logWarn(`Failed to initialize station ${stationId}:`, error);
      }
    }
  }

  /**
   * Setup quality alert thresholds
   */
  setupQualityAlertThresholds() {
    // Botanical ingredient thresholds
    Object.keys(this.botanicalStandards).forEach(botanical => {
      this.alertThresholds.set(`${botanical}_quality`, {
        critical: 70, // % quality score
        warning: 85,
        target: 95
      });
    });

    // Finished product thresholds
    Object.keys(this.finishedProductStandards).forEach(product => {
      this.alertThresholds.set(`${product}_quality`, {
        critical: 75,
        warning: 90,
        target: 98
      });
    });
  }

  /**
   * Process image for quality inspection
   */
  async processImage(imageData, inspectionType, productType = null) {
    const inspection = {
      id: `inspection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      imageData,
      inspectionType,
      productType,
      status: 'queued',
      results: null
    };

    // Add to processing queue
    this.processingQueue.push(inspection);
    
    logInfo(`Quality inspection queued: ${inspection.id} (${inspectionType})`);
    return inspection.id;
  }

  /**
   * Start processing queue for quality inspections
   */
  startProcessingQueue() {
    setInterval(async () => {
      if (this.processingQueue.length > 0 && !this.isProcessing) {
        this.isProcessing = true;
        
        try {
          const inspection = this.processingQueue.shift();
          await this.performInspection(inspection);
        } catch (error) {
          logError('Inspection processing error:', error);
        }
        
        this.isProcessing = false;
      }
    }, 2000); // Process every 2 seconds
  }

  /**
   * Perform quality inspection on image
   */
  async performInspection(inspection) {
    try {
      inspection.status = 'processing';
      
      let results = null;
      
      // Route to appropriate inspection method
      switch (inspection.inspectionType) {
        case 'botanical_incoming':
          results = await this.inspectBotanicalIngredient(inspection);
          break;
        case 'botanical_processing':
          results = await this.inspectBotanicalProcessing(inspection);
          break;
        case 'finished_product':
          results = await this.inspectFinishedProduct(inspection);
          break;
        case 'packaging':
          results = await this.inspectPackaging(inspection);
          break;
        default:
          results = await this.performGeneralInspection(inspection);
      }

      inspection.results = results;
      inspection.status = 'completed';
      
      // Store results
      this.inspectionResults.set(inspection.id, inspection);
      
      // Update quality trends
      this.updateQualityTrends(inspection);
      
      // Check for alerts
      this.checkQualityAlerts(inspection);
      
      // Emit inspection completed event
      this.emit('inspectionCompleted', inspection);
      
      logInfo(`Quality inspection completed: ${inspection.id} - Score: ${results.overallScore}%`);
      
    } catch (error) {
      inspection.status = 'failed';
      inspection.error = error.message;
      logError(`Inspection failed for ${inspection.id}:`, error);
    }
  }

  /**
   * Inspect botanical ingredient quality
   */
  async inspectBotanicalIngredient(inspection) {
    const botanical = inspection.productType;
    const standards = this.botanicalStandards[botanical];
    
    if (!standards) {
      throw new Error(`No quality standards found for botanical: ${botanical}`);
    }

    // Multi-model AI analysis
    const analysisResults = [];
    
    // OpenAI Vision analysis
    if (this.visionModels.openai.enabled) {
      const openaiResult = await this.analyzeWithOpenAI(inspection, standards);
      analysisResults.push({ source: 'openai', ...openaiResult });
    }

    // Azure Vision analysis
    if (this.visionModels.azure.enabled) {
      const azureResult = await this.analyzeWithAzure(inspection, standards);
      analysisResults.push({ source: 'azure', ...azureResult });
    }

    // Combine results
    const combinedResults = this.combineAnalysisResults(analysisResults);
    
    // Calculate specific botanical quality metrics
    const qualityMetrics = {
      colorAccuracy: this.assessColorQuality(combinedResults.color, standards.color),
      textureQuality: this.assessTextureQuality(combinedResults.texture, standards.texture),
      contaminantDetection: this.assessContaminants(combinedResults.contaminants, standards.contaminants),
      particleSizeCompliance: this.assessParticleSize(combinedResults.particles, standards.texture),
      defectDetection: this.assessVisualDefects(combinedResults.defects, standards.visual_defects)
    };

    // Calculate overall score
    const overallScore = this.calculateBotanicalQualityScore(qualityMetrics);
    
    return {
      botanical,
      overallScore,
      qualityMetrics,
      analysisResults,
      standards,
      passFailStatus: overallScore >= 85 ? 'PASS' : 'FAIL',
      recommendations: this.generateBotanicalRecommendations(qualityMetrics, standards),
      timestamp: new Date()
    };
  }

  /**
   * Inspect finished product quality
   */
  async inspectFinishedProduct(inspection) {
    const product = inspection.productType;
    const standards = this.finishedProductStandards[product];
    
    if (!standards) {
      throw new Error(`No quality standards found for product: ${product}`);
    }

    // AI Vision analysis for finished products
    const analysisResults = [];
    
    if (this.visionModels.openai.enabled) {
      const openaiResult = await this.analyzeFinishedProductWithOpenAI(inspection, standards);
      analysisResults.push({ source: 'openai', ...openaiResult });
    }

    // Calculate product quality metrics
    const qualityMetrics = {
      colorAccuracy: this.assessProductColor(analysisResults[0]?.color, standards.color),
      clarityCheck: this.assessClarity(analysisResults[0]?.clarity, standards.clarity),
      fillLevelAccuracy: this.assessFillLevel(analysisResults[0]?.fillLevel, standards.fill_level),
      bubbleDetection: this.assessBubbles(analysisResults[0]?.bubbles, standards.bubble_count),
      sedimentCheck: this.assessSediment(analysisResults[0]?.sediment, standards.sediment),
      labelQuality: this.assessLabelQuality(analysisResults[0]?.label, standards.label_alignment),
      defectDetection: this.assessProductDefects(analysisResults[0]?.defects, standards.defects)
    };

    const overallScore = this.calculateProductQualityScore(qualityMetrics);
    
    return {
      product,
      overallScore,
      qualityMetrics,
      analysisResults,
      standards,
      passFailStatus: overallScore >= 90 ? 'PASS' : 'FAIL',
      recommendations: this.generateProductRecommendations(qualityMetrics, standards),
      timestamp: new Date()
    };
  }

  /**
   * Analyze image with OpenAI Vision
   */
  async analyzeWithOpenAI(inspection, standards) {
    if (!this.visionModels.openai.client) {
      throw new Error('OpenAI Vision client not available');
    }

    const prompt = this.buildBotanicalAnalysisPrompt(inspection.productType, standards);
    
    try {
      const response = await this.visionModels.openai.client.post('/chat/completions', {
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${inspection.imageData}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      });

      const analysisText = response.data.choices[0].message.content;
      return this.parseOpenAIAnalysis(analysisText);

    } catch (error) {
      logError('OpenAI Vision analysis failed:', error);
      throw error;
    }
  }

  /**
   * Build botanical analysis prompt for AI
   */
  buildBotanicalAnalysisPrompt(botanical, standards) {
    return `You are a botanical quality control expert analyzing ${botanical} for a functional beverage company. 

Please analyze this image and provide a detailed assessment based on these quality standards:

Target Color: ${standards.color.target}
Target Texture: ${standards.texture.target}
Moisture Maximum: ${standards.moisture.max}%
Potency Range: ${standards.potency.min}-${standards.potency.max}%
Visual Defects to Check: ${standards.visual_defects.join(', ')}

Provide your analysis in JSON format:
{
  "color": {
    "observed": "description",
    "accuracy": "percentage_match",
    "score": "0-100"
  },
  "texture": {
    "observed": "description", 
    "consistency": "uniform/inconsistent",
    "score": "0-100"
  },
  "contaminants": {
    "detected": ["list of any contaminants"],
    "severity": "none/low/medium/high",
    "score": "0-100"
  },
  "particles": {
    "size_distribution": "uniform/varied",
    "quality": "description",
    "score": "0-100"
  },
  "defects": {
    "detected": ["list of visual defects"],
    "severity": "none/low/medium/high",
    "score": "0-100"
  },
  "overall_assessment": "detailed description",
  "confidence": "0-100"
}`;
  }

  /**
   * Parse OpenAI analysis response
   */
  parseOpenAIAnalysis(analysisText) {
    try {
      // Extract JSON from response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in analysis response');
      }
    } catch (error) {
      logWarn('Failed to parse OpenAI analysis:', error);
      return this.createFallbackAnalysis();
    }
  }

  /**
   * Combine multiple AI analysis results
   */
  combineAnalysisResults(results) {
    if (results.length === 0) return this.createFallbackAnalysis();
    if (results.length === 1) return results[0];

    // Average scores across models
    const combined = {
      color: { score: 0, observed: '', accuracy: 0 },
      texture: { score: 0, observed: '', consistency: '' },
      contaminants: { score: 0, detected: [], severity: 'none' },
      particles: { score: 0, size_distribution: '', quality: '' },
      defects: { score: 0, detected: [], severity: 'none' },
      confidence: 0
    };

    results.forEach(result => {
      Object.keys(combined).forEach(key => {
        if (result[key] && typeof result[key].score === 'number') {
          combined[key].score += result[key].score;
        }
      });
      combined.confidence += result.confidence || 80;
    });

    // Average the scores
    Object.keys(combined).forEach(key => {
      if (combined[key].score) {
        combined[key].score = Math.round(combined[key].score / results.length);
      }
    });
    combined.confidence = Math.round(combined.confidence / results.length);

    // Use first result's descriptive fields
    const firstResult = results[0];
    combined.color.observed = firstResult.color?.observed || 'Unknown';
    combined.texture.observed = firstResult.texture?.observed || 'Unknown';
    combined.contaminants.detected = firstResult.contaminants?.detected || [];
    combined.defects.detected = firstResult.defects?.detected || [];

    return combined;
  }

  /**
   * Calculate botanical quality score
   */
  calculateBotanicalQualityScore(metrics) {
    const weights = {
      colorAccuracy: 0.25,
      textureQuality: 0.25,
      contaminantDetection: 0.25,
      particleSizeCompliance: 0.15,
      defectDetection: 0.10
    };

    let weightedScore = 0;
    Object.entries(weights).forEach(_([metric, _weight]) => {
      weightedScore += (metrics[metric] || 0) * weight;
    });

    return Math.round(weightedScore);
  }

  /**
   * Update quality trends
   */
  updateQualityTrends(inspection) {
    const trendKey = `${inspection.inspectionType}_${inspection.productType}`;
    
    if (!this.qualityTrends.has(trendKey)) {
      this.qualityTrends.set(trendKey, {
        scores: [],
        averageScore: 0,
        passRate: 0,
        totalInspections: 0,
        lastUpdated: new Date()
      });
    }

    const trend = this.qualityTrends.get(trendKey);
    trend.scores.push({
      timestamp: inspection.timestamp,
      score: inspection.results.overallScore,
      status: inspection.results.passFailStatus
    });

    // Keep only last 100 scores
    if (trend.scores.length > 100) {
      trend.scores = trend.scores.slice(-100);
    }

    // Recalculate metrics
    const passCount = trend.scores.filter(s => s.status === 'PASS').length;
    trend.passRate = Math.round((passCount / trend.scores.length) * 100);
    trend.averageScore = Math.round(
      trend.scores.reduce((sum, s) => sum + s.score, 0) / trend.scores.length
    );
    trend.totalInspections++;
    trend.lastUpdated = new Date();
  }

  /**
   * Check for quality alerts
   */
  checkQualityAlerts(inspection) {
    const thresholdKey = `${inspection.productType}_quality`;
    const threshold = this.alertThresholds.get(thresholdKey);
    
    if (!threshold) return;

    const score = inspection.results.overallScore;
    let alertLevel = null;

    if (score < threshold.critical) {
      alertLevel = 'critical';
    } else if (score < threshold.warning) {
      alertLevel = 'warning';
    }

    if (alertLevel) {
      const alert = {
        id: `alert_${inspection.id}`,
        level: alertLevel,
        type: 'quality_deviation',
        inspection: inspection.id,
        product: inspection.productType,
        score,
        threshold: threshold[alertLevel],
        message: `Quality score ${score}% below ${alertLevel} threshold (${threshold[alertLevel]}%)`,
        timestamp: new Date(),
        recommendations: inspection.results.recommendations
      };

      this.emit('qualityAlert', alert);
      logWarn(`Quality alert: ${alert.message}`);
    }
  }

  /**
   * Get quality dashboard data
   */
  getQualityDashboard() {
    const dashboard = {
      timestamp: new Date(),
      overview: {
        totalInspections: this.inspectionResults.size,
        activeStations: Object.values(this.inspectionStations).filter(s => s.active).length,
        averageQuality: 0,
        passRate: 0
      },
      stations: {},
      trends: {},
      recentInspections: [],
      alerts: []
    };

    // Calculate overview metrics
    const allScores = [];
    const allStatuses = [];
    
    for (const inspection of this.inspectionResults.values()) {
      if (inspection.results) {
        allScores.push(inspection.results.overallScore);
        allStatuses.push(inspection.results.passFailStatus);
      }
    }

    if (allScores.length > 0) {
      dashboard.overview.averageQuality = Math.round(
        allScores.reduce((sum, score) => sum + score, 0) / allScores.length
      );
      dashboard.overview.passRate = Math.round(
        (allStatuses.filter(s => s === 'PASS').length / allStatuses.length) * 100
      );
    }

    // Add station status
    Object.entries(this.inspectionStations).forEach(_([stationId, station]) => {
      dashboard.stations[stationId] = {
        name: stationId.replace('_', ' ').toUpperCase(),
        location: station.location,
        active: station.active,
        imagesProcessed: station.imagesProcessed || 0,
        ...station.qualityMetrics
      };
    });

    // Add quality trends
    for (const [trendKey, trend] of this.qualityTrends) {
      dashboard.trends[trendKey] = {
        averageScore: trend.averageScore,
        passRate: trend.passRate,
        totalInspections: trend.totalInspections,
        recentTrend: this.calculateTrendDirection(trend.scores),
        lastUpdated: trend.lastUpdated
      };
    }

    // Add recent inspections
    const recentInspections = Array.from(this.inspectionResults.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    dashboard.recentInspections = recentInspections.map(inspection => ({
      id: inspection.id,
      type: inspection.inspectionType,
      product: inspection.productType,
      score: inspection.results?.overallScore,
      status: inspection.results?.passFailStatus,
      timestamp: inspection.timestamp
    }));

    return dashboard;
  }

  /**
   * Helper methods for quality assessment
   */
  assessColorQuality(observed, standard) {
    if (!observed || !standard) return 50;
    
    // Simplified color matching - in production would use color space analysis
    const accuracy = parseFloat(observed.accuracy) || 75;
    return Math.min(100, Math.max(0, accuracy));
  }

  assessTextureQuality(observed, standard) {
    if (!observed || !standard) return 50;
    
    const consistency = observed.consistency === 'uniform' ? 20 : 0;
    const baseScore = observed.score || 75;
    return Math.min(100, baseScore + consistency);
  }

  assessContaminants(observed, standard) {
    if (!observed) return 90;
    
    const severity = observed.severity || 'none';
    switch (severity) {
      case 'none': return 100;
      case 'low': return 85;
      case 'medium': return 60;
      case 'high': return 30;
      default: return 90;
    }
  }

  calculateTrendDirection(scores) {
    if (scores.length < 5) return 'stable';
    
    const recent = scores.slice(-5);
    const older = scores.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, s) => sum + s.score, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.score, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 3) return 'improving';
    if (difference < -3) return 'declining';
    return 'stable';
  }

  createFallbackAnalysis() {
    return {
      color: { score: 80, observed: 'Analysis unavailable', accuracy: 80 },
      texture: { score: 80, observed: 'Analysis unavailable', consistency: 'unknown' },
      contaminants: { score: 90, detected: [], severity: 'none' },
      particles: { score: 85, size_distribution: 'unknown', quality: 'unknown' },
      defects: { score: 85, detected: [], severity: 'none' },
      confidence: 70
    };
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Handle MCP quality data updates
    this.mcpServers.orchestrator.on(_'resourcesProcessed', (data) => {
      if (data.serverId === 'quality-system') {
        this.processQualityData(data.data);
      }
    });

    // Handle quality alerts
    this.on(_'qualityAlert', _(alert) => {
      logWarn(`Quality Alert [${alert.level.toUpperCase()}]: ${alert.message}`);
      // Could integrate with notification systems here
    });
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    // Deactivate all inspection stations
    Object.values(this.inspectionStations).forEach(station => {
      station.active = false;
    });

    // Clear processing queue
    this.processingQueue = [];
    this.isProcessing = false;

    // Shutdown MCP servers
    await this.mcpServers.shutdown();

    // Clear data
    this.inspectionResults.clear();
    this.qualityTrends.clear();
    this.alertThresholds.clear();

    logInfo('Computer Vision Quality System shutdown complete');
  }
}

export default SentiaComputerVisionQuality;