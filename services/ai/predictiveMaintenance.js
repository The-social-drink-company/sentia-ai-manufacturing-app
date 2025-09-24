import { EventEmitter } from 'events';
import axios from 'axios';
import logger, { logInfo, logError, logWarn } from '../logger.js';
import ManufacturingMCPServers from '../mcp/manufacturingMCPServers.js';

/**
 * Enterprise Predictive Maintenance System
 * AI-powered equipment failure prediction and maintenance optimization
 * Integrates IoT sensors, digital twins, and machine learning models
 */
class PredictiveMaintenanceSystem extends EventEmitter {
  constructor() {
    super();
    
    this.mcpServers = new ManufacturingMCPServers();
    this.sensorDataBuffer = new Map();
    this.equipmentModels = new Map();
    this.maintenanceAlerts = new Map();
    this.anomalyDetectors = new Map();
    this.digitalTwins = new Map();
    
    // ML Models for different failure types
    this.mlModels = {
      vibration: {
        type: 'isolation_forest',
        threshold: 0.1,
        trained: false
      },
      temperature: {
        type: 'lstm_autoencoder',
        threshold: 0.15,
        trained: false
      },
      pressure: {
        type: 'svm_one_class',
        threshold: 0.12,
        trained: false
      },
      flow: {
        type: 'gaussian_mixture',
        threshold: 0.08,
        trained: false
      }
    };

    // Maintenance prediction algorithms
    this.algorithms = {
      remainingUsefulLife: this.calculateRUL.bind(this),
      failureProbability: this.calculateFailureProbability.bind(this),
      optimalMaintenanceTime: this.calculateOptimalMaintenance.bind(this),
      costBenefitAnalysis: this.performCostBenefitAnalysis.bind(this)
    };

    this.initializeSystem();
    logInfo('Predictive Maintenance System initialized');
  }

  /**
   * Initialize the predictive maintenance system
   */
  async initializeSystem() {
    try {
      // Register for IoT sensor data
      await this.setupIoTIntegration();
      
      // Initialize equipment models
      await this.initializeEquipmentModels();
      
      // Setup anomaly detection
      this.setupAnomalyDetection();
      
      // Start real-time monitoring
      this.startRealTimeMonitoring();
      
      logInfo('Predictive Maintenance System startup complete');
    } catch (error) {
      logError('Failed to initialize Predictive Maintenance System:', error);
    }
  }

  /**
   * Setup IoT sensor integration via MCP servers
   */
  async setupIoTIntegration() {
    try {
      // Initialize MCP servers for IoT data
      await this.mcpServers.initializeDefaultServers();
      
      // Subscribe to IoT sensor updates
      this.mcpServers.orchestrator.on('resourcesProcessed', (data) => {
        if (data.serverId === 'iot-sensors') {
          this.processSensorData(data.data);
        }
      });

      // Subscribe to equipment status updates from MES
      this.mcpServers.orchestrator.on('resourcesProcessed', (data) => {
        if (data.serverId === 'mes-system') {
          this.processEquipmentStatus(data.data);
        }
      });

      logInfo('IoT integration setup complete');
    } catch (error) {
      logError('IoT integration setup failed:', error);
    }
  }

  /**
   * Initialize equipment models and digital twins
   */
  async initializeEquipmentModels() {
    const equipmentList = [
      {
        id: 'pump_001',
        name: 'Primary Water Pump',
        type: 'centrifugal_pump',
        sensors: ['temperature', 'vibration', 'pressure', 'flow'],
        criticalParameters: {
          maxTemperature: 85, // Celsius
          maxVibration: 10,   // mm/s
          maxPressure: 150,   // PSI
          minFlow: 50         // GPM
        },
        maintenanceHistory: []
      },
      {
        id: 'motor_001',
        name: 'Production Line Motor A',
        type: 'induction_motor',
        sensors: ['temperature', 'vibration', 'current', 'power'],
        criticalParameters: {
          maxTemperature: 90,
          maxVibration: 8,
          maxCurrent: 25,
          maxPower: 15000
        },
        maintenanceHistory: []
      },
      {
        id: 'conveyor_001',
        name: 'Main Conveyor Belt',
        type: 'belt_conveyor',
        sensors: ['speed', 'tension', 'alignment', 'temperature'],
        criticalParameters: {
          maxSpeed: 120,      // m/min
          maxTension: 500,    // N
          maxAlignment: 5,    // mm
          maxTemperature: 60
        },
        maintenanceHistory: []
      },
      {
        id: 'compressor_001',
        name: 'Air Compressor System',
        type: 'rotary_screw',
        sensors: ['pressure', 'temperature', 'vibration', 'oil_level'],
        criticalParameters: {
          maxPressure: 175,
          maxTemperature: 95,
          maxVibration: 12,
          minOilLevel: 20
        },
        maintenanceHistory: []
      }
    ];

    for (const equipment of equipmentList) {
      // Initialize equipment model
      this.equipmentModels.set(equipment.id, {
        ...equipment,
        status: 'normal',
        lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        nextScheduledMaintenance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        operatingHours: 0,
        failurePredictions: [],
        anomalyScores: {},
        digitalTwin: null
      });

      // Create digital twin
      await this.createDigitalTwin(equipment.id, equipment);
      
      // Initialize sensor data buffer
      this.sensorDataBuffer.set(equipment.id, {
        data: [],
        maxSize: 1000, // Keep last 1000 data points
        lastUpdate: null
      });

      logInfo(`Equipment model initialized: ${equipment.name} (${equipment.id})`);
    }
  }

  /**
   * Create digital twin for equipment
   */
  async createDigitalTwin(equipmentId, equipmentConfig) {
    const digitalTwin = {
      id: equipmentId,
      type: 'digital_twin',
      physicalAsset: equipmentConfig,
      virtualModel: {
        parameters: { ...equipmentConfig.criticalParameters },
        state: 'normal',
        predictions: {},
        simulations: []
      },
      synchronization: {
        lastSync: new Date(),
        syncInterval: 60000, // 1 minute
        enabled: true
      },
      analytics: {
        performanceMetrics: {},
        degradationTrends: {},
        failureScenarios: []
      }
    };

    this.digitalTwins.set(equipmentId, digitalTwin);
    logInfo(`Digital twin created for ${equipmentId}`);
  }

  /**
   * Process incoming sensor data
   */
  processSensorData(sensorData) {
    sensorData.forEach(data => {
      if (data.metadata?.dataType === 'sensor-telemetry') {
        const equipmentId = this.extractEquipmentId(data);
        if (equipmentId && this.equipmentModels.has(equipmentId)) {
          this.updateSensorBuffer(equipmentId, data);
          this.runAnomalyDetection(equipmentId, data);
          this.updateDigitalTwin(equipmentId, data);
          this.checkThresholds(equipmentId, data);
        }
      }
    });
  }

  /**
   * Update sensor data buffer for equipment
   */
  updateSensorBuffer(equipmentId, sensorData) {
    const buffer = this.sensorDataBuffer.get(equipmentId);
    if (!buffer) return;

    // Add new data point
    buffer.data.push({
      timestamp: new Date(sensorData.timestamp || Date.now()),
      sensorType: sensorData.resourceType,
      value: this.extractSensorValue(sensorData),
      unit: this.extractSensorUnit(sensorData),
      quality: this.assessDataQuality(sensorData)
    });

    // Maintain buffer size
    if (buffer.data.length > buffer.maxSize) {
      buffer.data = buffer.data.slice(-buffer.maxSize);
    }

    buffer.lastUpdate = new Date();

    // Trigger predictive analysis if enough data
    if (buffer.data.length >= 50) {
      this.scheduleAnalysis(equipmentId);
    }
  }

  /**
   * Run anomaly detection on sensor data
   */
  async runAnomalyDetection(equipmentId, sensorData) {
    const sensorType = sensorData.resourceType;
    const value = this.extractSensorValue(sensorData);
    
    if (!this.anomalyDetectors.has(equipmentId)) {
      this.anomalyDetectors.set(equipmentId, new Map());
    }

    const equipmentDetectors = this.anomalyDetectors.get(equipmentId);
    
    if (!equipmentDetectors.has(sensorType)) {
      // Initialize anomaly detector for this sensor type
      equipmentDetectors.set(sensorType, {
        algorithm: this.mlModels[sensorType]?.type || 'statistical',
        baseline: [],
        threshold: this.mlModels[sensorType]?.threshold || 0.1,
        lastTraining: null,
        anomalyCount: 0
      });
    }

    const detector = equipmentDetectors.get(sensorType);
    
    // Add to baseline if not enough data
    if (detector.baseline.length < 100) {
      detector.baseline.push(value);
      return;
    }

    // Perform anomaly detection
    const anomalyScore = await this.calculateAnomalyScore(detector, value);
    
    if (anomalyScore > detector.threshold) {
      await this.handleAnomaly(equipmentId, sensorType, value, anomalyScore);
      detector.anomalyCount++;
    }

    // Update equipment model
    const equipment = this.equipmentModels.get(equipmentId);
    if (equipment) {
      equipment.anomalyScores[sensorType] = anomalyScore;
    }
  }

  /**
   * Calculate anomaly score based on detector algorithm
   */
  async calculateAnomalyScore(detector, value) {
    switch (detector.algorithm) {
      case 'statistical':
        return this.statisticalAnomalyScore(detector.baseline, value);
      case 'isolation_forest':
        return this.isolationForestScore(detector.baseline, value);
      case 'lstm_autoencoder':
        return this.lstmAnomalyScore(detector.baseline, value);
      default:
        return this.statisticalAnomalyScore(detector.baseline, value);
    }
  }

  /**
   * Statistical anomaly detection (Z-score based)
   */
  statisticalAnomalyScore(baseline, value) {
    const mean = baseline.reduce((sum, val) => sum + val, 0) / baseline.length;
    const variance = baseline.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / baseline.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return 0;
    
    const zScore = Math.abs(value - mean) / stdDev;
    return Math.min(zScore / 3, 1); // Normalize to 0-1 range
  }

  /**
   * Handle detected anomaly
   */
  async handleAnomaly(equipmentId, sensorType, value, anomalyScore) {
    const equipment = this.equipmentModels.get(equipmentId);
    if (!equipment) return;

    const anomaly = {
      id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      equipmentId,
      equipmentName: equipment.name,
      sensorType,
      value,
      anomalyScore,
      timestamp: new Date(),
      severity: this.classifyAnomalySeverity(anomalyScore),
      description: `Anomalous ${sensorType} reading detected: ${value}`,
      recommendations: await this.generateAnomalyRecommendations(equipmentId, sensorType, anomalyScore)
    };

    // Store anomaly
    if (!this.maintenanceAlerts.has(equipmentId)) {
      this.maintenanceAlerts.set(equipmentId, []);
    }
    this.maintenanceAlerts.get(equipmentId).push(anomaly);

    // Emit anomaly event
    this.emit('anomalyDetected', anomaly);

    // Log anomaly
    logWarn(`Anomaly detected on ${equipment.name}: ${sensorType} = ${value} (score: ${anomalyScore.toFixed(3)})`);

    // Generate failure prediction
    const failurePrediction = await this.predictFailure(equipmentId, anomaly);
    if (failurePrediction.riskLevel === 'high') {
      this.emit('highRiskFailure', { equipmentId, anomaly, prediction: failurePrediction });
    }
  }

  /**
   * Predict equipment failure based on current conditions
   */
  async predictFailure(equipmentId, anomaly = null) {
    const equipment = this.equipmentModels.get(equipmentId);
    if (!equipment) return null;

    const sensorData = this.sensorDataBuffer.get(equipmentId);
    if (!sensorData || sensorData.data.length < 50) {
      return { prediction: 'insufficient_data', confidence: 0 };
    }

    try {
      // Calculate Remaining Useful Life (RUL)
      const rul = await this.algorithms.remainingUsefulLife(equipmentId, sensorData.data);
      
      // Calculate failure probability
      const failureProbability = await this.algorithms.failureProbability(equipmentId, sensorData.data);
      
      // Calculate optimal maintenance timing
      const optimalMaintenance = await this.algorithms.optimalMaintenanceTime(equipmentId, rul, failureProbability);
      
      // Perform cost-benefit analysis
      const costBenefit = await this.algorithms.costBenefitAnalysis(equipmentId, optimalMaintenance);

      const prediction = {
        equipmentId,
        timestamp: new Date(),
        remainingUsefulLife: rul,
        failureProbability,
        optimalMaintenanceDate: optimalMaintenance.date,
        riskLevel: this.calculateRiskLevel(rul, failureProbability),
        confidence: this.calculatePredictionConfidence(sensorData.data),
        recommendations: this.generateMaintenanceRecommendations(rul, failureProbability, costBenefit),
        costBenefit,
        triggerAnomaly: anomaly
      };

      // Store prediction
      equipment.failurePredictions.push(prediction);
      
      // Keep only recent predictions
      if (equipment.failurePredictions.length > 10) {
        equipment.failurePredictions = equipment.failurePredictions.slice(-10);
      }

      return prediction;

    } catch (error) {
      logError(`Failure prediction failed for ${equipmentId}:`, error);
      return { prediction: 'error', error: error.message, confidence: 0 };
    }
  }

  /**
   * Calculate Remaining Useful Life (RUL)
   */
  async calculateRUL(equipmentId, sensorData) {
    const equipment = this.equipmentModels.get(equipmentId);
    if (!equipment) return 0;

    // Simple degradation model based on sensor trends
    const recentData = sensorData.slice(-100); // Last 100 data points
    const degradationRate = this.calculateDegradationRate(recentData);
    
    // Estimate based on critical parameters
    const criticalThresholds = equipment.criticalParameters;
    const currentValues = this.getCurrentSensorValues(equipmentId);
    
    let minRUL = Infinity;
    
    Object.keys(criticalThresholds).forEach(param => {
      const threshold = criticalThresholds[param];
      const current = currentValues[param];
      const rate = degradationRate[param] || 0;
      
      if (rate > 0 && current < threshold) {
        const timeToThreshold = (threshold - current) / rate;
        minRUL = Math.min(minRUL, timeToThreshold);
      }
    });

    // Convert to days (assuming rate is per hour)
    return minRUL === Infinity ? 365 : Math.max(1, Math.floor(minRUL / 24));
  }

  /**
   * Calculate failure probability
   */
  async calculateFailureProbability(equipmentId, sensorData) {
    const equipment = this.equipmentModels.get(equipmentId);
    if (!equipment) return 0;

    // Factors affecting failure probability
    let probability = 0.01; // Base probability

    // Age factor
    const daysSinceLastMaintenance = (Date.now() - equipment.lastMaintenance.getTime()) / (1000 * 60 * 60 * 24);
    probability += Math.min(daysSinceLastMaintenance / 365, 0.5); // Max 50% from age

    // Anomaly factor
    const avgAnomalyScore = Object.values(equipment.anomalyScores || {})
      .reduce((sum, score) => sum + score, 0) / Object.keys(equipment.anomalyScores || {}).length || 0;
    probability += avgAnomalyScore * 0.3; // Max 30% from anomalies

    // Operating hours factor
    const operatingHoursRisk = Math.min(equipment.operatingHours / 8760, 1) * 0.2; // Max 20% from hours
    probability += operatingHoursRisk;

    return Math.min(probability, 0.95); // Cap at 95%
  }

  /**
   * Calculate optimal maintenance timing
   */
  async calculateOptimalMaintenance(equipmentId, rul, failureProbability) {
    const equipment = this.equipmentModels.get(equipmentId);
    if (!equipment) return { date: new Date(), reason: 'equipment_not_found' };

    // Consider multiple factors
    const factors = {
      rul_urgency: rul < 30 ? 0.8 : rul < 60 ? 0.5 : 0.2,
      failure_risk: failureProbability,
      scheduled_maintenance: this.getScheduledMaintenanceUrgency(equipment),
      operational_impact: this.getOperationalImpact(equipmentId),
      resource_availability: this.getResourceAvailability()
    };

    // Weight factors
    const weights = {
      rul_urgency: 0.3,
      failure_risk: 0.25,
      scheduled_maintenance: 0.2,
      operational_impact: 0.15,
      resource_availability: 0.1
    };

    // Calculate weighted urgency score
    const urgencyScore = Object.keys(factors).reduce((sum, factor) => {
      return sum + (factors[factor] * weights[factor]);
    }, 0);

    // Determine optimal date based on urgency
    let daysFromNow;
    if (urgencyScore > 0.8) {
      daysFromNow = Math.min(rul * 0.5, 7); // Within a week for high urgency
    } else if (urgencyScore > 0.6) {
      daysFromNow = Math.min(rul * 0.7, 30); // Within a month for medium urgency
    } else {
      daysFromNow = Math.min(rul * 0.8, 60); // Within two months for low urgency
    }

    const optimalDate = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);

    return {
      date: optimalDate,
      urgencyScore,
      factors,
      reasoning: this.generateMaintenanceReasoning(factors, urgencyScore)
    };
  }

  /**
   * Perform cost-benefit analysis for maintenance timing
   */
  async performCostBenefitAnalysis(equipmentId, optimalMaintenance) {
    const equipment = this.equipmentModels.get(equipmentId);
    if (!equipment) return null;

    // Cost estimates (these would be configured per equipment type)
    const costs = {
      preventiveMaintenance: 1000,    // Base preventive maintenance cost
      correctiveMaintenance: 5000,    // Emergency repair cost
      downtime: 2000,                // Cost per day of downtime
      replacement: 50000              // Equipment replacement cost
    };

    // Calculate scenarios
    const scenarios = {
      immediate: this.calculateMaintenanceCost(costs, 0, 0.1),
      optimal: this.calculateMaintenanceCost(costs, optimalMaintenance.urgencyScore, 0.3),
      delayed: this.calculateMaintenanceCost(costs, 0.8, 0.7),
      reactive: this.calculateMaintenanceCost(costs, 1.0, 0.9)
    };

    return {
      recommendedScenario: 'optimal',
      scenarios,
      savings: scenarios.reactive.totalCost - scenarios.optimal.totalCost,
      riskReduction: scenarios.reactive.risk - scenarios.optimal.risk
    };
  }

  /**
   * Calculate maintenance cost for a scenario
   */
  calculateMaintenanceCost(baseCosts, urgency, failureRisk) {
    const maintenanceCost = baseCosts.preventiveMaintenance * (1 + urgency * 0.5);
    const downtimeCost = baseCosts.downtime * (1 + urgency * 2);
    const failureCost = baseCosts.correctiveMaintenance * failureRisk;
    const replacementCost = baseCosts.replacement * failureRisk * 0.1;

    return {
      maintenanceCost,
      downtimeCost,
      failureCost,
      replacementCost,
      totalCost: maintenanceCost + downtimeCost + failureCost + replacementCost,
      risk: failureRisk
    };
  }

  /**
   * Update digital twin with real-time sensor data
   */
  updateDigitalTwin(equipmentId, sensorData) {
    const digitalTwin = this.digitalTwins.get(equipmentId);
    if (!digitalTwin) return;

    const sensorType = sensorData.resourceType;
    const value = this.extractSensorValue(sensorData);
    
    // Update virtual model parameters
    digitalTwin.virtualModel.parameters[sensorType] = value;
    digitalTwin.synchronization.lastSync = new Date();

    // Update performance metrics
    if (!digitalTwin.analytics.performanceMetrics[sensorType]) {
      digitalTwin.analytics.performanceMetrics[sensorType] = [];
    }

    digitalTwin.analytics.performanceMetrics[sensorType].push({
      timestamp: new Date(),
      value,
      anomalyScore: this.equipmentModels.get(equipmentId)?.anomalyScores[sensorType] || 0
    });

    // Keep only recent metrics
    const maxPoints = 1000;
    if (digitalTwin.analytics.performanceMetrics[sensorType].length > maxPoints) {
      digitalTwin.analytics.performanceMetrics[sensorType] = 
        digitalTwin.analytics.performanceMetrics[sensorType].slice(-maxPoints);
    }

    // Update state based on current conditions
    digitalTwin.virtualModel.state = this.calculateTwinState(equipmentId);

    this.emit('digitalTwinUpdated', { equipmentId, digitalTwin });
  }

  /**
   * Start real-time monitoring loop
   */
  startRealTimeMonitoring() {
    const monitoringInterval = 60000; // 1 minute

    setInterval(async () => {
      try {
        // Check all equipment for alerts
        for (const [equipmentId, equipment] of this.equipmentModels) {
          await this.performRoutineCheck(equipmentId);
        }

        // Clean up old data
        this.cleanupOldData();
        
      } catch (error) {
        logError('Real-time monitoring error:', error);
      }
    }, monitoringInterval);

    logInfo('Real-time monitoring started');
  }

  /**
   * Perform routine check on equipment
   */
  async performRoutineCheck(equipmentId) {
    const equipment = this.equipmentModels.get(equipmentId);
    if (!equipment) return;

    const sensorBuffer = this.sensorDataBuffer.get(equipmentId);
    if (!sensorBuffer || sensorBuffer.data.length === 0) return;

    // Check if data is stale
    const dataAge = Date.now() - (sensorBuffer.lastUpdate?.getTime() || 0);
    if (dataAge > 300000) { // 5 minutes
      this.emit('dataStale', { equipmentId, age: dataAge });
      return;
    }

    // Generate predictions if needed
    const lastPrediction = equipment.failurePredictions[equipment.failurePredictions.length - 1];
    const timeSinceLastPrediction = lastPrediction ? 
      Date.now() - lastPrediction.timestamp.getTime() : Infinity;

    if (timeSinceLastPrediction > 3600000) { // 1 hour
      const prediction = await this.predictFailure(equipmentId);
      if (prediction && prediction.riskLevel === 'high') {
        this.emit('maintenanceRequired', { equipmentId, prediction });
      }
    }
  }

  /**
   * Get comprehensive maintenance dashboard data
   */
  getMaintenanceDashboard() {
    const dashboard = {
      timestamp: new Date(),
      overview: {
        totalEquipment: this.equipmentModels.size,
        activeAlerts: 0,
        highRiskEquipment: 0,
        maintenanceScheduled: 0
      },
      equipment: [],
      upcomingMaintenance: [],
      alerts: [],
      systemHealth: this.getSystemHealth()
    };

    // Process each equipment
    for (const [equipmentId, equipment] of this.equipmentModels) {
      const alerts = this.maintenanceAlerts.get(equipmentId) || [];
      const activeAlerts = alerts.filter(alert => 
        Date.now() - alert.timestamp.getTime() < 86400000 // 24 hours
      );

      const latestPrediction = equipment.failurePredictions[equipment.failurePredictions.length - 1];
      const riskLevel = latestPrediction?.riskLevel || 'low';

      dashboard.overview.activeAlerts += activeAlerts.length;
      if (riskLevel === 'high') dashboard.overview.highRiskEquipment++;

      dashboard.equipment.push({
        id: equipmentId,
        name: equipment.name,
        type: equipment.type,
        status: equipment.status,
        riskLevel,
        alerts: activeAlerts.length,
        lastMaintenance: equipment.lastMaintenance,
        nextMaintenance: equipment.nextScheduledMaintenance,
        operatingHours: equipment.operatingHours,
        prediction: latestPrediction
      });

      // Add to upcoming maintenance if within next 30 days
      if (equipment.nextScheduledMaintenance && 
          equipment.nextScheduledMaintenance.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000) {
        dashboard.overview.maintenanceScheduled++;
        dashboard.upcomingMaintenance.push({
          equipmentId,
          equipmentName: equipment.name,
          scheduledDate: equipment.nextScheduledMaintenance,
          type: 'scheduled',
          urgency: riskLevel
        });
      }

      // Add alerts
      dashboard.alerts.push(...activeAlerts);
    }

    // Sort upcoming maintenance by date
    dashboard.upcomingMaintenance.sort((a, b) => 
      a.scheduledDate.getTime() - b.scheduledDate.getTime()
    );

    // Sort alerts by severity
    dashboard.alerts.sort((a, b) => {
      const severityOrder = { 'critical': 3, 'high': 2, 'medium': 1, 'low': 0 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    return dashboard;
  }

  /**
   * Helper methods
   */
  extractEquipmentId(data) {
    // Extract equipment ID from sensor data metadata
    return data.metadata?.equipmentId || data.resourceUri?.split('/')[1];
  }

  extractSensorValue(data) {
    if (typeof data.data === 'object' && data.data.value !== undefined) {
      return parseFloat(data.data.value);
    }
    return parseFloat(data.data) || 0;
  }

  extractSensorUnit(data) {
    return data.data?.unit || 'unknown';
  }

  assessDataQuality(data) {
    // Simple data quality assessment
    const value = this.extractSensorValue(data);
    if (isNaN(value) || !isFinite(value)) return 'poor';
    if (data.timestamp && Date.now() - new Date(data.timestamp).getTime() > 300000) return 'stale';
    return 'good';
  }

  classifyAnomalySeverity(anomalyScore) {
    if (anomalyScore > 0.8) return 'critical';
    if (anomalyScore > 0.6) return 'high';
    if (anomalyScore > 0.4) return 'medium';
    return 'low';
  }

  calculateRiskLevel(rul, failureProbability) {
    if (rul < 14 || failureProbability > 0.7) return 'critical';
    if (rul < 30 || failureProbability > 0.5) return 'high';
    if (rul < 60 || failureProbability > 0.3) return 'medium';
    return 'low';
  }

  getSystemHealth() {
    const connectedEquipment = Array.from(this.equipmentModels.values())
      .filter(eq => eq.status === 'normal').length;
    
    return {
      overallHealth: Math.round((connectedEquipment / this.equipmentModels.size) * 100),
      dataStreams: this.sensorDataBuffer.size,
      activeDigitalTwins: this.digitalTwins.size,
      mcpConnection: this.mcpServers.getManufacturingSystemStatus().connectedServers > 0
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    await this.mcpServers.shutdown();
    this.sensorDataBuffer.clear();
    this.equipmentModels.clear();
    this.maintenanceAlerts.clear();
    this.anomalyDetectors.clear();
    this.digitalTwins.clear();
    
    logInfo('Predictive Maintenance System shutdown complete');
  }
}

export default PredictiveMaintenanceSystem;