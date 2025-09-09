/**
 * Manufacturing Analytics Service
 * Provides comprehensive analytics including OEE, variance analysis, and performance metrics
 */

import { v4 as uuidv4 } from 'uuid';

class ManufacturingAnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.analyticsData = new Map();
    this.oeeCalculations = new Map();
    this.varianceData = new Map();
    this.performanceMetrics = new Map();
    this.historicalData = [];
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize analytics data structures
      await this.setupBaselineData();
      await this.calculateInitialMetrics();
      
      this.isInitialized = true;
      console.log('Manufacturing Analytics Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Manufacturing Analytics Service:', error);
      throw error;
    }
  }

  async setupBaselineData() {
    // Initialize baseline production data for analytics
    const baselineData = {
      stations: [
        {
          id: 'STATION_001',
          name: 'Assembly Line 1',
          plannedProductionTime: 480, // 8 hours in minutes
          actualRunTime: 425,
          idealCycleTime: 2.5, // minutes per unit
          totalProduced: 165,
          qualityUnits: 158,
          downtime: {
            planned: 30, // maintenance
            unplanned: 25 // breakdowns
          },
          efficiency: 91.2,
          availability: 88.5,
          quality: 95.8,
          oee: 81.4
        },
        {
          id: 'STATION_002',
          name: 'Packaging Line 1',
          plannedProductionTime: 480,
          actualRunTime: 445,
          idealCycleTime: 1.8,
          totalProduced: 235,
          qualityUnits: 228,
          downtime: {
            planned: 20,
            unplanned: 15
          },
          efficiency: 86.7,
          availability: 92.7,
          quality: 97.0,
          oee: 77.8
        },
        {
          id: 'STATION_003',
          name: 'Quality Control Station',
          plannedProductionTime: 480,
          actualRunTime: 465,
          idealCycleTime: 3.2,
          totalProduced: 142,
          qualityUnits: 140,
          downtime: {
            planned: 10,
            unplanned: 5
          },
          efficiency: 88.9,
          availability: 96.9,
          quality: 98.6,
          oee: 84.9
        }
      ]
    };

    // Store baseline data
    baselineData.stations.forEach(station => {
      this.analyticsData.set(station.id, station);
    });

    // Generate historical data for trend analysis
    await this.generateHistoricalData();
  }

  async generateHistoricalData() {
    const days = 30;
    const stations = Array.from(this.analyticsData.values());
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      stations.forEach(station => {
        // Generate realistic variations
        const variation = 0.1; // 10% variation
        const availability = station.availability + (Math.random() - 0.5) * variation * 20;
        const performance = station.efficiency + (Math.random() - 0.5) * variation * 20;
        const quality = station.quality + (Math.random() - 0.5) * variation * 10;
        const oee = (availability * performance * quality) / 10000;
        
        this.historicalData.push({
          id: uuidv4(),
          stationId: station.id,
          stationName: station.name,
          date: date.toISOString().split('T')[0],
          timestamp: date.toISOString(),
          availability: Math.max(75, Math.min(98, availability)),
          performance: Math.max(70, Math.min(95, performance)),
          quality: Math.max(90, Math.min(100, quality)),
          oee: Math.max(60, Math.min(90, oee)),
          production: {
            planned: station.totalProduced + Math.floor((Math.random() - 0.5) * 40),
            actual: station.totalProduced + Math.floor((Math.random() - 0.5) * 30),
            rejected: Math.floor(Math.random() * 8)
          },
          downtime: {
            planned: station.downtime.planned + Math.floor((Math.random() - 0.5) * 20),
            unplanned: station.downtime.unplanned + Math.floor((Math.random() - 0.5) * 15)
          }
        });
      });
    }
  }

  async calculateInitialMetrics() {
    // Calculate OEE for all stations
    const stations = Array.from(this.analyticsData.values());
    
    stations.forEach(station => {
      const oeeData = this.calculateOEE(station);
      this.oeeCalculations.set(station.id, oeeData);
      
      const variance = this.calculateVarianceAnalysis(station);
      this.varianceData.set(station.id, variance);
      
      const performance = this.calculatePerformanceMetrics(station);
      this.performanceMetrics.set(station.id, performance);
    });
  }

  calculateOEE(station) {
    // OEE = Availability × Performance × Quality
    const availability = (station.actualRunTime / station.plannedProductionTime) * 100;
    const performance = ((station.totalProduced * station.idealCycleTime) / station.actualRunTime) * 100;
    const quality = (station.qualityUnits / station.totalProduced) * 100;
    const oee = (availability * performance * quality) / 10000;
    
    return {
      stationId: station.id,
      stationName: station.name,
      availability: Math.round(availability * 10) / 10,
      performance: Math.round(performance * 10) / 10,
      quality: Math.round(quality * 10) / 10,
      oee: Math.round(oee * 10) / 10,
      benchmarks: {
        worldClass: 85,
        good: 70,
        fair: 60
      },
      classification: this.classifyOEE(oee),
      losses: {
        availabilityLoss: (100 - availability) * (performance / 100) * (quality / 100),
        performanceLoss: availability * (100 - performance) * (quality / 100) / 100,
        qualityLoss: availability * performance * (100 - quality) / 10000
      }
    };
  }

  classifyOEE(oee) {
    if (oee >= 85) return 'World Class';
    if (oee >= 70) return 'Good';
    if (oee >= 60) return 'Fair';
    return 'Needs Improvement';
  }

  calculateVarianceAnalysis(station) {
    // Calculate various production variances
    const plannedProduction = Math.floor(station.plannedProductionTime / station.idealCycleTime);
    const actualProduction = station.totalProduced;
    
    const productionVariance = actualProduction - plannedProduction;
    const productionVariancePercent = (productionVariance / plannedProduction) * 100;
    
    const plannedEfficiency = 90; // Target efficiency
    const efficiencyVariance = station.efficiency - plannedEfficiency;
    
    const plannedDowntime = 30; // Expected downtime in minutes
    const actualDowntime = station.downtime.planned + station.downtime.unplanned;
    const downtimeVariance = actualDowntime - plannedDowntime;
    
    return {
      stationId: station.id,
      stationName: station.name,
      production: {
        planned: plannedProduction,
        actual: actualProduction,
        variance: productionVariance,
        variancePercent: Math.round(productionVariancePercent * 10) / 10,
        status: productionVariance >= 0 ? 'favorable' : 'unfavorable'
      },
      efficiency: {
        planned: plannedEfficiency,
        actual: station.efficiency,
        variance: Math.round(efficiencyVariance * 10) / 10,
        status: efficiencyVariance >= 0 ? 'favorable' : 'unfavorable'
      },
      downtime: {
        planned: plannedDowntime,
        actual: actualDowntime,
        variance: downtimeVariance,
        status: downtimeVariance <= 0 ? 'favorable' : 'unfavorable'
      },
      quality: {
        planned: 98, // Target quality
        actual: (station.qualityUnits / station.totalProduced) * 100,
        variance: ((station.qualityUnits / station.totalProduced) * 100) - 98,
        status: ((station.qualityUnits / station.totalProduced) * 100) >= 98 ? 'favorable' : 'unfavorable'
      }
    };
  }

  calculatePerformanceMetrics(station) {
    return {
      stationId: station.id,
      stationName: station.name,
      productivity: {
        unitsPerHour: Math.round((station.totalProduced / (station.actualRunTime / 60)) * 10) / 10,
        unitsPerMinute: Math.round((station.totalProduced / station.actualRunTime) * 10) / 10,
        cycleTime: Math.round((station.actualRunTime / station.totalProduced) * 10) / 10,
        idealCycleTime: station.idealCycleTime,
        cycleTimeVariance: Math.round(((station.actualRunTime / station.totalProduced) - station.idealCycleTime) * 10) / 10
      },
      utilization: {
        timeUtilization: Math.round((station.actualRunTime / station.plannedProductionTime) * 1000) / 10,
        equipmentEffectiveness: Math.round(station.oee * 10) / 10,
        capacityUtilization: Math.round((station.totalProduced / (station.plannedProductionTime / station.idealCycleTime)) * 1000) / 10
      },
      quality: {
        yieldRate: Math.round((station.qualityUnits / station.totalProduced) * 1000) / 10,
        defectRate: Math.round(((station.totalProduced - station.qualityUnits) / station.totalProduced) * 1000) / 10,
        firstPassYield: Math.round((station.qualityUnits / station.totalProduced) * 1000) / 10
      }
    };
  }

  async getAnalyticsDashboard() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const stations = Array.from(this.analyticsData.values());
    const oeeData = Array.from(this.oeeCalculations.values());
    const varianceData = Array.from(this.varianceData.values());
    
    // Calculate overall plant metrics
    const totalAvailability = oeeData.reduce((sum, data) => sum + data.availability, 0) / oeeData.length;
    const totalPerformance = oeeData.reduce((sum, data) => sum + data.performance, 0) / oeeData.length;
    const totalQuality = oeeData.reduce((sum, data) => sum + data.quality, 0) / oeeData.length;
    const overallOEE = (totalAvailability * totalPerformance * totalQuality) / 10000;
    
    return {
      timestamp: new Date().toISOString(),
      summary: {
        overallOEE: Math.round(overallOEE * 10) / 10,
        availability: Math.round(totalAvailability * 10) / 10,
        performance: Math.round(totalPerformance * 10) / 10,
        quality: Math.round(totalQuality * 10) / 10,
        classification: this.classifyOEE(overallOEE),
        totalStations: stations.length,
        activeStations: stations.filter(s => s.efficiency > 0).length
      },
      stationOEE: oeeData,
      varianceAnalysis: varianceData,
      trends: this.getTrendAnalysis(),
      recommendations: this.generateRecommendations(oeeData, varianceData)
    };
  }

  getTrendAnalysis() {
    // Analyze last 7 days of data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentData = this.historicalData.filter(
      record => new Date(record.timestamp) >= sevenDaysAgo
    );
    
    const stations = [...new Set(recentData.map(r => r.stationId))];
    const trends = {};
    
    stations.forEach(stationId => {
      const stationData = recentData.filter(r => r.stationId === stationId);
      const stationName = stationData[0]?.stationName || stationId;
      
      // Calculate trends
      const oeeValues = stationData.map(d => d.oee);
      const oeeSlope = this.calculateTrend(oeeValues);
      
      trends[stationId] = {
        stationName,
        oee: {
          current: oeeValues[oeeValues.length - 1] || 0,
          trend: oeeSlope > 0.1 ? 'improving' : oeeSlope < -0.1 ? 'declining' : 'stable',
          change: Math.round(oeeSlope * 100) / 100
        },
        availability: {
          current: stationData[stationData.length - 1]?.availability || 0,
          trend: this.calculateTrend(stationData.map(d => d.availability)) > 0 ? 'improving' : 'stable'
        },
        performance: {
          current: stationData[stationData.length - 1]?.performance || 0,
          trend: this.calculateTrend(stationData.map(d => d.performance)) > 0 ? 'improving' : 'stable'
        }
      };
    });
    
    return trends;
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const xSum = n * (n - 1) / 2; // Sum of 0,1,2,...,n-1
    const ySum = values.reduce((sum, val) => sum + val, 0);
    const xySum = values.reduce((sum, val, idx) => sum + (val * idx), 0);
    const xSquaredSum = n * (n - 1) * (2 * n - 1) / 6; // Sum of squares
    
    const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum);
    return slope;
  }

  generateRecommendations(oeeData, varianceData) {
    const recommendations = [];
    
    oeeData.forEach(station => {
      if (station.oee < 70) {
        recommendations.push({
          type: 'critical',
          stationId: station.stationId,
          stationName: station.stationName,
          category: 'OEE',
          title: 'Low OEE Performance',
          description: `OEE of ${station.oee}% is below industry standard`,
          impact: 'High',
          actions: [
            'Investigate root causes of downtime',
            'Review maintenance schedules',
            'Analyze quality issues'
          ]
        });
      }
      
      if (station.availability < 85) {
        recommendations.push({
          type: 'warning',
          stationId: station.stationId,
          stationName: station.stationName,
          category: 'Availability',
          title: 'Low Equipment Availability',
          description: `Availability of ${station.availability}% indicates excessive downtime`,
          impact: 'Medium',
          actions: [
            'Implement preventive maintenance',
            'Reduce setup times',
            'Minimize unplanned stops'
          ]
        });
      }
      
      if (station.performance < 80) {
        recommendations.push({
          type: 'warning',
          stationId: station.stationId,
          stationName: station.stationName,
          category: 'Performance',
          title: 'Performance Below Target',
          description: `Performance efficiency of ${station.performance}% needs improvement`,
          impact: 'Medium',
          actions: [
            'Optimize cycle times',
            'Reduce minor stops',
            'Improve operator training'
          ]
        });
      }
    });
    
    return recommendations;
  }

  async getHistoricalAnalytics(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return this.historicalData.filter(
      record => new Date(record.timestamp) >= startDate
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  async getStationAnalytics(stationId) {
    const station = this.analyticsData.get(stationId);
    const oee = this.oeeCalculations.get(stationId);
    const variance = this.varianceData.get(stationId);
    const performance = this.performanceMetrics.get(stationId);
    
    if (!station) {
      throw new Error(`Station ${stationId} not found`);
    }
    
    return {
      station,
      oee,
      variance,
      performance,
      historical: this.historicalData.filter(r => r.stationId === stationId).slice(-30)
    };
  }
}

// Create singleton instance
export const manufacturingAnalyticsService = new ManufacturingAnalyticsService();
export default ManufacturingAnalyticsService;