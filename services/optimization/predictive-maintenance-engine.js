/**
 * Predictive Maintenance and Resource Optimization Engine
 * AI-powered equipment monitoring and maintenance scheduling system
 */

import { EventEmitter } from 'events';
import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';

export class PredictiveMaintenanceEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      predictionHorizon: options.predictionHorizon || 30, // days
      confidenceThreshold: options.confidenceThreshold || 0.8,
      alertThresholds: {
        critical: options.criticalThreshold || 0.9,
        warning: options.warningThreshold || 0.7,
        maintenance: options.maintenanceThreshold || 0.5
      },
      samplingInterval: options.samplingInterval || 300000, // 5 minutes
      historicalWindow: options.historicalWindow || 90, // days
      enableRealTimeMonitoring: options.enableRealTimeMonitoring !== false,
      ...options
    };
    
    this.equipmentRegistry = new Map();
    this.sensorData = new Map();
    this.predictionModels = new Map();
    this.maintenanceSchedule = new Map();
    this.resourceOptimizer = new ResourceOptimizer(options.resourceConfig);
    this.isMonitoring = false;
  }

  /**
   * Initialize predictive maintenance system
   */
  async initialize() {
    try {
      logInfo('Initializing predictive maintenance engine');
      
      // Load equipment configurations
      await this.loadEquipmentRegistry();
      
      // Initialize prediction models
      await this.initializePredictionModels();
      
      // Start real-time monitoring
      if (this.config.enableRealTimeMonitoring) {
        await this.startRealTimeMonitoring();
      }
      
      logInfo('Predictive maintenance engine initialized');
      
    } catch (error) {
      logError('Failed to initialize predictive maintenance engine', { error: error.message });
      throw error;
    }
  }

  /**
   * Register equipment for monitoring
   */
  async registerEquipment(equipmentConfig) {
    try {
      const equipment = {
        id: equipmentConfig.id,
        name: equipmentConfig.name,
        type: equipmentConfig.type,
        location: equipmentConfig.location,
        manufacturer: equipmentConfig.manufacturer,
        model: equipmentConfig.model,
        installDate: equipmentConfig.installDate,
        specifications: equipmentConfig.specifications,
        sensors: equipmentConfig.sensors || [],
        maintenanceHistory: equipmentConfig.maintenanceHistory || [],
        operatingParameters: equipmentConfig.operatingParameters || {},
        criticalComponents: equipmentConfig.criticalComponents || [],
        failureModes: equipmentConfig.failureModes || [],
        registeredAt: new Date().toISOString()
      };
      
      this.equipmentRegistry.set(equipment.id, equipment);
      
      // Initialize sensor data storage
      this.sensorData.set(equipment.id, []);
      
      // Create prediction model for this equipment
      await this.createPredictionModel(equipment);
      
      logInfo('Equipment registered', { equipmentId: equipment.id, name: equipment.name });
      
      return equipment;
      
    } catch (error) {
      logError('Equipment registration failed', { 
        equipmentId: equipmentConfig.id, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Process sensor data and generate predictions
   */
  async processSensorData(equipmentId, sensorReadings) {
    try {
      const equipment = this.equipmentRegistry.get(equipmentId);
      if (!equipment) {
        throw new Error(`Equipment not found: ${equipmentId}`);
      }
      
      // Store sensor data
      const dataPoint = {
        timestamp: new Date().toISOString(),
        equipmentId,
        readings: sensorReadings,
        processed: false
      };
      
      const equipmentData = this.sensorData.get(equipmentId);
      equipmentData.push(dataPoint);
      
      // Keep only recent data within historical window
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.historicalWindow);
      const filteredData = equipmentData.filter(data => 
        new Date(data.timestamp) >= cutoffDate
      );
      this.sensorData.set(equipmentId, filteredData);
      
      // Analyze sensor data for anomalies
      const anomalies = await this.detectAnomalies(equipmentId, sensorReadings);
      
      // Generate failure predictions
      const predictions = await this.generateFailurePredictions(equipmentId);
      
      // Update maintenance recommendations
      const maintenanceRecommendations = await this.updateMaintenanceRecommendations(
        equipmentId, 
        predictions, 
        anomalies
      );
      
      // Emit real-time updates
      this.emit('sensorUpdate', {
        equipmentId,
        timestamp: dataPoint.timestamp,
        readings: sensorReadings,
        anomalies,
        predictions,
        recommendations: maintenanceRecommendations
      });
      
      return {
        equipmentId,
        anomalies,
        predictions,
        recommendations: maintenanceRecommendations
      };
      
    } catch (error) {
      logError('Sensor data processing failed', { 
        equipmentId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Generate comprehensive equipment health assessment
   */
  async assessEquipmentHealth(equipmentId) {
    try {
      const equipment = this.equipmentRegistry.get(equipmentId);
      if (!equipment) {
        throw new Error(`Equipment not found: ${equipmentId}`);
      }
      
      const recentData = this.sensorData.get(equipmentId)?.slice(-100) || [];
      
      if (recentData.length === 0) {
        return {
          equipmentId,
          healthScore: 0.5,
          status: 'unknown',
          confidence: 0,
          assessment: 'Insufficient data for health assessment'
        };
      }
      
      // Calculate health indicators
      const healthIndicators = await this.calculateHealthIndicators(equipmentId, recentData);
      
      // Generate overall health score
      const healthScore = await this.calculateOverallHealthScore(healthIndicators);
      
      // Determine equipment status
      const status = this.determineEquipmentStatus(healthScore);
      
      // Calculate prediction confidence
      const confidence = await this.calculatePredictionConfidence(equipmentId, recentData);
      
      return {
        equipmentId,
        name: equipment.name,
        healthScore,
        status,
        confidence,
        indicators: healthIndicators,
        lastUpdated: new Date().toISOString(),
        nextAssessment: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      
    } catch (error) {
      logError('Equipment health assessment failed', { 
        equipmentId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Generate failure predictions using multiple models
   */
  async generateFailurePredictions(equipmentId) {
    try {
      const equipment = this.equipmentRegistry.get(equipmentId);
      const historicalData = this.sensorData.get(equipmentId) || [];
      
      if (historicalData.length < 10) {
        return {
          equipmentId,
          predictions: [],
          confidence: 0,
          message: 'Insufficient historical data'
        };
      }
      
      const predictions = [];
      
      // Generate predictions for each failure mode
      for (const failureMode of equipment.failureModes) {
        const prediction = await this.predictFailureMode(
          equipmentId, 
          failureMode, 
          historicalData
        );
        predictions.push(prediction);
      }
      
      // Sort by probability and proximity
      predictions.sort((a, b) => {
        const scoreA = a.probability * (1 / Math.max(a.daysToFailure, 1));
        const scoreB = b.probability * (1 / Math.max(b.daysToFailure, 1));
        return scoreB - scoreA;
      });
      
      return {
        equipmentId,
        predictions,
        confidence: predictions.length > 0 ? predictions[0].confidence : 0,
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      logError('Failure prediction generation failed', { 
        equipmentId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Optimize maintenance scheduling
   */
  async optimizeMaintenanceSchedule(equipmentIds = null) {
    try {
      logInfo('Optimizing maintenance schedule');
      
      const equipmentToProcess = equipmentIds || Array.from(this.equipmentRegistry.keys());
      const scheduleOptimization = {
        totalEquipment: equipmentToProcess.length,
        optimizedSchedules: [],
        resourceRequirements: {},
        costSavings: 0,
        efficiency: 0
      };
      
      for (const equipmentId of equipmentToProcess) {
        const predictions = await this.generateFailurePredictions(equipmentId);
        const currentSchedule = this.maintenanceSchedule.get(equipmentId) || {};
        
        const optimizedSchedule = await this.optimizeEquipmentMaintenance(
          equipmentId,
          predictions,
          currentSchedule
        );
        
        scheduleOptimization.optimizedSchedules.push(optimizedSchedule);
        
        // Aggregate resource requirements
        this.aggregateResourceRequirements(
          scheduleOptimization.resourceRequirements,
          optimizedSchedule.resourceRequirements
        );
        
        // Calculate cost savings
        scheduleOptimization.costSavings += optimizedSchedule.costSavings || 0;
      }
      
      // Optimize resource allocation
      const resourceOptimization = await this.resourceOptimizer.optimizeAllocation(
        scheduleOptimization.resourceRequirements
      );
      
      scheduleOptimization.efficiency = resourceOptimization.efficiency;
      scheduleOptimization.resourceOptimization = resourceOptimization;
      
      return scheduleOptimization;
      
    } catch (error) {
      logError('Maintenance schedule optimization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Detect sensor anomalies using statistical analysis
   */
  async detectAnomalies(equipmentId, currentReadings) {
    try {
      const historicalData = this.sensorData.get(equipmentId) || [];
      
      if (historicalData.length < 20) {
        return []; // Need sufficient data for anomaly detection
      }
      
      const anomalies = [];
      
      // Calculate statistical baselines for each sensor
      const sensorBaselines = this.calculateSensorBaselines(historicalData);
      
      // Check each current reading against baseline
      for (const [sensorId, value] of Object.entries(currentReadings)) {
        const baseline = sensorBaselines[sensorId];
        
        if (baseline) {
          const zScore = Math.abs((value - baseline.mean) / baseline.stdDev);
          const anomalyScore = Math.min(zScore / 3, 1); // Normalize to 0-1
          
          if (zScore > 2.5) { // 99% confidence interval
            anomalies.push({
              sensorId,
              type: 'statistical_outlier',
              severity: zScore > 3 ? 'critical' : 'warning',
              currentValue: value,
              expectedValue: baseline.mean,
              anomalyScore,
              description: `${sensorId} reading (${value.toFixed(2)}) is ${zScore.toFixed(1)} standard deviations from normal`
            });
          }
        }
      }
      
      return anomalies;
      
    } catch (error) {
      logError('Anomaly detection failed', { equipmentId, error: error.message });
      return [];
    }
  }

  /**
   * Calculate health indicators from sensor data
   */
  async calculateHealthIndicators(equipmentId, recentData) {
    const equipment = this.equipmentRegistry.get(equipmentId);
    const indicators = {};
    
    // Vibration analysis (if available)
    if (equipment.sensors.includes('vibration')) {
      indicators.vibration = this.analyzeVibrationHealth(recentData);
    }
    
    // Temperature analysis
    if (equipment.sensors.includes('temperature')) {
      indicators.temperature = this.analyzeTemperatureHealth(recentData);
    }
    
    // Performance indicators
    if (equipment.sensors.includes('speed') && equipment.sensors.includes('load')) {
      indicators.performance = this.analyzePerformanceHealth(recentData);
    }
    
    // Lubrication health (if applicable)
    if (equipment.sensors.includes('oil_pressure') || equipment.sensors.includes('oil_temperature')) {
      indicators.lubrication = this.analyzeLubricationHealth(recentData);
    }
    
    return indicators;
  }

  /**
   * Predict specific failure mode
   */
  async predictFailureMode(equipmentId, failureMode, historicalData) {
    const features = this.extractFailureModeFeatures(failureMode, historicalData);
    const model = this.predictionModels.get(`${equipmentId}_${failureMode.id}`);
    
    if (!model || features.length === 0) {
      return {
        failureMode: failureMode.id,
        probability: 0.1, // Default low probability
        daysToFailure: 365,
        confidence: 0.3,
        factors: []
      };
    }
    
    // Simplified prediction logic (in production, use ML models)
    const trendAnalysis = this.analyzeTrends(features, failureMode.indicators);
    const probability = this.calculateFailureProbability(trendAnalysis, failureMode);
    const daysToFailure = this.estimateDaysToFailure(probability, trendAnalysis);
    
    return {
      failureMode: failureMode.id,
      description: failureMode.description,
      probability,
      daysToFailure,
      confidence: Math.min(trendAnalysis.dataQuality, 0.9),
      factors: trendAnalysis.contributingFactors,
      recommendation: this.generateFailureModeRecommendation(failureMode, probability, daysToFailure)
    };
  }

  /**
   * Start real-time monitoring
   */
  async startRealTimeMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Simulate real-time sensor data collection
    this.monitoringInterval = setInterval(async () => {
      try {
        for (const [equipmentId, equipment] of this.equipmentRegistry) {
          const sensorReadings = this.simulateSensorReadings(equipment);
          await this.processSensorData(equipmentId, sensorReadings);
        }
      } catch (error) {
        logError('Real-time monitoring error', { error: error.message });
      }
    }, this.config.samplingInterval);
    
    logInfo('Real-time monitoring started');
  }

  /**
   * Stop real-time monitoring
   */
  stopRealTimeMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    
    logInfo('Real-time monitoring stopped');
  }

  // Helper methods for calculations and analysis
  calculateSensorBaselines(historicalData) {
    const baselines = {};
    
    // Group data by sensor
    const sensorGroups = {};
    for (const dataPoint of historicalData) {
      for (const [sensorId, value] of Object.entries(dataPoint.readings)) {
        if (!sensorGroups[sensorId]) sensorGroups[sensorId] = [];
        sensorGroups[sensorId].push(value);
      }
    }
    
    // Calculate statistics for each sensor
    for (const [sensorId, values] of Object.entries(sensorGroups)) {
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      baselines[sensorId] = {
        mean,
        stdDev,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    }
    
    return baselines;
  }

  simulateSensorReadings(equipment) {
    const readings = {};
    
    // Simulate different sensor types
    for (const sensorType of equipment.sensors) {
      switch (sensorType) {
        case 'temperature':
          readings[sensorType] = 85 + Math.random() * 10; // 85-95°C
          break;
        case 'vibration':
          readings[sensorType] = 2.5 + Math.random() * 1.5; // 2.5-4.0 mm/s
          break;
        case 'speed':
          readings[sensorType] = 1800 + Math.random() * 200; // 1800-2000 RPM
          break;
        case 'load':
          readings[sensorType] = 0.7 + Math.random() * 0.25; // 70-95% load
          break;
        case 'oil_pressure':
          readings[sensorType] = 25 + Math.random() * 10; // 25-35 PSI
          break;
        default:
          readings[sensorType] = Math.random() * 100;
      }
    }
    
    return readings;
  }

  async loadEquipmentRegistry() {
    // In production, this would load from database
    // For now, create sample equipment
    const sampleEquipment = [
      {
        id: 'pump_001',
        name: 'Primary Circulation Pump',
        type: 'centrifugal_pump',
        location: 'Building A - Floor 1',
        manufacturer: 'Grundfos',
        model: 'CR 32-4',
        installDate: '2022-03-15',
        sensors: ['temperature', 'vibration', 'speed', 'load'],
        failureModes: [
          {
            id: 'bearing_failure',
            description: 'Bearing wear and failure',
            indicators: ['vibration', 'temperature'],
            mtbf: 8760 // hours
          },
          {
            id: 'impeller_wear',
            description: 'Impeller degradation',
            indicators: ['performance', 'vibration'],
            mtbf: 17520
          }
        ]
      },
      {
        id: 'compressor_001',
        name: 'Main Air Compressor',
        type: 'rotary_screw',
        location: 'Utility Room',
        manufacturer: 'Atlas Copco',
        model: 'GA 30 VSD',
        installDate: '2021-08-22',
        sensors: ['temperature', 'vibration', 'oil_pressure', 'load'],
        failureModes: [
          {
            id: 'oil_system_failure',
            description: 'Oil system degradation',
            indicators: ['oil_pressure', 'temperature'],
            mtbf: 13140
          }
        ]
      }
    ];
    
    for (const equipment of sampleEquipment) {
      await this.registerEquipment(equipment);
    }
  }

  async initializePredictionModels() {
    // Initialize prediction models for each equipment
    for (const [equipmentId, equipment] of this.equipmentRegistry) {
      for (const failureMode of equipment.failureModes) {
        const modelId = `${equipmentId}_${failureMode.id}`;
        this.predictionModels.set(modelId, {
          id: modelId,
          type: 'statistical_trend',
          parameters: failureMode,
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  determineEquipmentStatus(healthScore) {
    if (healthScore >= 0.8) return 'excellent';
    if (healthScore >= 0.6) return 'good';
    if (healthScore >= 0.4) return 'fair';
    if (healthScore >= 0.2) return 'poor';
    return 'critical';
  }
}

/**
 * Resource Optimization Engine
 * Optimizes maintenance crew scheduling and parts inventory
 */
export class ResourceOptimizer {
  constructor(config = {}) {
    this.config = {
      maxConcurrentJobs: config.maxConcurrentJobs || 4,
      technicians: config.technicians || [
        { id: 'tech_1', name: 'John Smith', skills: ['mechanical', 'electrical'], availability: 40 },
        { id: 'tech_2', name: 'Jane Doe', skills: ['mechanical', 'hydraulic'], availability: 40 },
        { id: 'tech_3', name: 'Bob Wilson', skills: ['electrical', 'controls'], availability: 35 }
      ],
      partsInventory: config.partsInventory || new Map(),
      ...config
    };
  }

  async optimizeAllocation(resourceRequirements) {
    // Optimize technician scheduling
    const technicianSchedule = await this.optimizeTechnicianScheduling(resourceRequirements.labor);
    
    // Optimize parts allocation
    const partsAllocation = await this.optimizePartsAllocation(resourceRequirements.parts);
    
    return {
      efficiency: this.calculateAllocationEfficiency(technicianSchedule, partsAllocation),
      technicianSchedule,
      partsAllocation,
      recommendations: this.generateResourceRecommendations()
    };
  }

  async optimizeTechnicianScheduling(laborRequirements = []) {
    const schedule = [];
    const availableTechnicians = [...this.config.technicians];
    
    // Sort jobs by priority and skill requirements
    const sortedJobs = laborRequirements.sort((a, b) => b.priority - a.priority);
    
    for (const job of sortedJobs) {
      const assignedTech = this.findBestTechnician(job, availableTechnicians);
      
      if (assignedTech) {
        schedule.push({
          jobId: job.id,
          technicianId: assignedTech.id,
          estimatedHours: job.estimatedHours,
          skillMatch: this.calculateSkillMatch(job.requiredSkills, assignedTech.skills)
        });
        
        // Update technician availability
        assignedTech.availability -= job.estimatedHours;
      }
    }
    
    return schedule;
  }

  findBestTechnician(job, availableTechnicians) {
    let bestMatch = null;
    let bestScore = 0;
    
    for (const technician of availableTechnicians) {
      if (technician.availability >= job.estimatedHours) {
        const skillScore = this.calculateSkillMatch(job.requiredSkills, technician.skills);
        const availabilityScore = technician.availability / 40; // Normalize to 0-1
        const totalScore = skillScore * 0.7 + availabilityScore * 0.3;
        
        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestMatch = technician;
        }
      }
    }
    
    return bestMatch;
  }

  calculateSkillMatch(requiredSkills, technicianSkills) {
    if (requiredSkills.length === 0) return 1;
    
    const matches = requiredSkills.filter(skill => technicianSkills.includes(skill));
    return matches.length / requiredSkills.length;
  }
}

export default PredictiveMaintenanceEngine;