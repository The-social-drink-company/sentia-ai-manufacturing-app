/**
 * Manufacturing Analytics Service
 * Provides comprehensive manufacturing analytics, KPIs, trends, and anomaly detection
 */

class ManufacturingAnalyticsService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get key performance indicators for manufacturing operations
   */
  async getKPIs(timeframe = '7d') {
    const cacheKey = `kpis-${timeframe}`;
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      // In production, this would fetch from API
      // For now, return realistic mock data
      const kpis = {
        oee: {
          value: 78.5,
          target: 85,
          trend: 'up',
          change: 2.3,
          components: {
            availability: 92.1,
            performance: 88.4,
            quality: 96.2
          }
        },
        production: {
          totalOutput: 15234,
          plannedOutput: 16000,
          efficiency: 95.2,
          utilization: 87.3
        },
        quality: {
          defectRate: 2.3,
          firstPassYield: 94.5,
          reworkRate: 3.2,
          scrapRate: 1.8
        },
        inventory: {
          turnoverRatio: 12.5,
          stockoutRate: 0.8,
          carryingCost: 125000,
          daysOnHand: 28
        },
        delivery: {
          onTimeDelivery: 96.7,
          orderFulfillment: 98.2,
          leadTime: 4.2,
          cycleTime: 2.8
        },
        cost: {
          unitCost: 45.23,
          laborCost: 28.5,
          materialCost: 62.3,
          overheadCost: 9.2
        }
      };

      this.setCache(cacheKey, kpis);
      return kpis;
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      throw error;
    }
  }

  /**
   * Get production trends over time
   */
  async getProductionTrends(period = '30d', granularity = 'daily') {
    const cacheKey = `trends-${period}-${granularity}`;
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      // Generate trend data based on period
      const dataPoints = this.generateTrendData(period, granularity);

      const trends = {
        production: dataPoints.map(dp => ({
          date: dp.date,
          volume: dp.production,
          efficiency: dp.efficiency,
          quality: dp.quality
        })),
        oee: dataPoints.map(dp => ({
          date: dp.date,
          overall: dp.oee,
          availability: dp.availability,
          performance: dp.performance,
          quality: dp.quality
        })),
        costs: dataPoints.map(dp => ({
          date: dp.date,
          total: dp.totalCost,
          labor: dp.laborCost,
          material: dp.materialCost,
          overhead: dp.overheadCost
        }))
      };

      this.setCache(cacheKey, trends);
      return trends;
    } catch (error) {
      console.error('Error fetching production trends:', error);
      throw error;
    }
  }

  /**
   * Detect anomalies in manufacturing data
   */
  async detectAnomalies(metrics = ['all']) {
    const cacheKey = `anomalies-${metrics.join('-')}`;
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const anomalies = [
        {
          id: 'ANO-001',
          timestamp: new Date().toISOString(),
          metric: 'Machine Efficiency',
          severity: 'high',
          description: 'Machine L2-04 efficiency dropped to 45% (normal: 85-90%)',
          impact: 'Production delay of 2 hours expected',
          recommendation: 'Immediate maintenance inspection required'
        },
        {
          id: 'ANO-002',
          timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
          metric: 'Quality Defect Rate',
          severity: 'medium',
          description: 'Defect rate increased to 4.2% on Product Line A',
          impact: 'Additional QC resources needed',
          recommendation: 'Review recent process changes and material batch'
        },
        {
          id: 'ANO-003',
          timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
          metric: 'Material Consumption',
          severity: 'low',
          description: 'Raw material usage 8% higher than forecast',
          impact: 'Potential inventory shortage in 5 days',
          recommendation: 'Adjust procurement schedule'
        }
      ];

      this.setCache(cacheKey, anomalies);
      return anomalies;
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      throw error;
    }
  }

  /**
   * Get predictive maintenance insights
   */
  async getPredictiveMaintenance() {
    const cacheKey = 'predictive-maintenance';
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const maintenance = {
        alerts: [
          {
            machineId: 'MCH-001',
            name: 'CNC Machine A',
            predictedFailure: '2025-10-05',
            confidence: 87,
            component: 'Spindle Bearing',
            hoursToFailure: 168,
            recommendation: 'Schedule maintenance within 5 days'
          },
          {
            machineId: 'MCH-005',
            name: 'Assembly Robot 2',
            predictedFailure: '2025-10-12',
            confidence: 72,
            component: 'Servo Motor',
            hoursToFailure: 336,
            recommendation: 'Monitor closely, plan maintenance'
          }
        ],
        maintenanceSchedule: [
          {
            date: '2025-09-28',
            machines: ['MCH-002', 'MCH-007'],
            type: 'Preventive',
            duration: 4
          },
          {
            date: '2025-10-02',
            machines: ['MCH-001'],
            type: 'Predictive',
            duration: 6
          }
        ],
        healthScores: {
          'MCH-001': 65,
          'MCH-002': 88,
          'MCH-003': 92,
          'MCH-004': 76,
          'MCH-005': 71
        }
      };

      this.setCache(cacheKey, maintenance);
      return maintenance;
    } catch (error) {
      console.error('Error fetching predictive maintenance:', error);
      throw error;
    }
  }

  /**
   * Get production line performance metrics
   */
  async getLinePerformance(lineId = 'all') {
    const cacheKey = `line-performance-${lineId}`;
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const lines = [
        {
          id: 'LINE-01',
          name: 'Assembly Line A',
          status: 'running',
          oee: 82.3,
          currentSpeed: 120,
          targetSpeed: 150,
          unitsProduced: 4523,
          targetUnits: 5000,
          efficiency: 90.5,
          downtime: 12,
          qualityRate: 98.2
        },
        {
          id: 'LINE-02',
          name: 'Packaging Line B',
          status: 'running',
          oee: 76.8,
          currentSpeed: 200,
          targetSpeed: 220,
          unitsProduced: 8234,
          targetUnits: 9000,
          efficiency: 91.5,
          downtime: 8,
          qualityRate: 97.5
        },
        {
          id: 'LINE-03',
          name: 'Processing Line C',
          status: 'maintenance',
          oee: 0,
          currentSpeed: 0,
          targetSpeed: 180,
          unitsProduced: 0,
          targetUnits: 0,
          efficiency: 0,
          downtime: 120,
          qualityRate: 0
        }
      ];

      const performance = lineId === 'all' ? lines : lines.filter(l => l.id === lineId);

      this.setCache(cacheKey, performance);
      return performance;
    } catch (error) {
      console.error('Error fetching line performance:', error);
      throw error;
    }
  }

  /**
   * Get shift performance analysis
   */
  async getShiftAnalysis(date = new Date()) {
    const cacheKey = `shift-analysis-${date.toISOString().split('T')[0]}`;
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const shifts = {
        morning: {
          shift: 'Morning (6AM - 2PM)',
          production: 5234,
          efficiency: 88.5,
          quality: 97.2,
          downtime: 25,
          incidents: 1,
          oee: 81.3
        },
        afternoon: {
          shift: 'Afternoon (2PM - 10PM)',
          production: 4892,
          efficiency: 84.2,
          quality: 96.8,
          downtime: 35,
          incidents: 2,
          oee: 77.8
        },
        night: {
          shift: 'Night (10PM - 6AM)',
          production: 4123,
          efficiency: 79.5,
          quality: 95.5,
          downtime: 45,
          incidents: 0,
          oee: 72.4
        },
        comparison: {
          bestShift: 'morning',
          worstShift: 'night',
          avgOEE: 77.2,
          totalProduction: 14249,
          totalDowntime: 105
        }
      };

      this.setCache(cacheKey, shifts);
      return shifts;
    } catch (error) {
      console.error('Error fetching shift analysis:', error);
      throw error;
    }
  }

  /**
   * Get energy consumption analytics
   */
  async getEnergyAnalytics(period = '7d') {
    const cacheKey = `energy-${period}`;
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const energy = {
        total: {
          consumption: 45678,
          cost: 12345,
          efficiency: 82.3,
          trend: 'down',
          change: -5.2
        },
        byLine: [
          { line: 'LINE-01', consumption: 15234, cost: 4123 },
          { line: 'LINE-02', consumption: 18456, cost: 4987 },
          { line: 'LINE-03', consumption: 11988, cost: 3235 }
        ],
        byTime: this.generateEnergyData(period),
        recommendations: [
          'Optimize Line 2 scheduling to avoid peak rates',
          'Consider upgrading Line 1 motors to high-efficiency models',
          'Implement automated shutdown during idle periods'
        ]
      };

      this.setCache(cacheKey, energy);
      return energy;
    } catch (error) {
      console.error('Error fetching energy analytics:', error);
      throw error;
    }
  }

  /**
   * Get waste and scrap analysis
   */
  async getWasteAnalysis(period = '30d') {
    const cacheKey = `waste-${period}`;
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const waste = {
        summary: {
          totalWaste: 2345,
          wasteRate: 3.2,
          recycled: 1876,
          recycleRate: 80,
          costImpact: 34567
        },
        byCategory: [
          { category: 'Material Defects', amount: 890, percentage: 38 },
          { category: 'Process Waste', amount: 567, percentage: 24 },
          { category: 'Setup Scrap', amount: 445, percentage: 19 },
          { category: 'Overproduction', amount: 234, percentage: 10 },
          { category: 'Other', amount: 209, percentage: 9 }
        ],
        byProduct: [
          { product: 'Product A', wasteRate: 2.8, amount: 678 },
          { product: 'Product B', wasteRate: 3.5, amount: 892 },
          { product: 'Product C', wasteRate: 3.1, amount: 775 }
        ],
        trends: this.generateWasteTrends(period)
      };

      this.setCache(cacheKey, waste);
      return waste;
    } catch (error) {
      console.error('Error fetching waste analysis:', error);
      throw error;
    }
  }

  /**
   * Get supply chain analytics
   */
  async getSupplyChainAnalytics() {
    const cacheKey = 'supply-chain';
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const supplyChain = {
        suppliers: {
          total: 24,
          onTime: 21,
          delayed: 3,
          performance: 87.5
        },
        inventory: {
          rawMaterials: 456789,
          wip: 123456,
          finished: 234567,
          turnover: 12.5
        },
        leadTimes: {
          average: 4.2,
          min: 2,
          max: 8,
          trend: 'improving'
        },
        risks: [
          {
            supplier: 'Supplier A',
            risk: 'Delivery delays',
            impact: 'medium',
            mitigation: 'Secondary supplier identified'
          },
          {
            supplier: 'Supplier C',
            risk: 'Quality issues',
            impact: 'low',
            mitigation: 'Enhanced QC implemented'
          }
        ]
      };

      this.setCache(cacheKey, supplyChain);
      return supplyChain;
    } catch (error) {
      console.error('Error fetching supply chain analytics:', error);
      throw error;
    }
  }

  /**
   * Get workforce analytics
   */
  async getWorkforceAnalytics() {
    const cacheKey = 'workforce';
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      const workforce = {
        summary: {
          totalWorkers: 156,
          present: 148,
          absent: 8,
          productivity: 92.3
        },
        byDepartment: [
          { department: 'Production', workers: 89, productivity: 94.2 },
          { department: 'Quality', workers: 23, productivity: 91.5 },
          { department: 'Maintenance', workers: 18, productivity: 88.7 },
          { department: 'Logistics', workers: 26, productivity: 90.1 }
        ],
        skills: {
          certified: 134,
          trainingNeeded: 22,
          crossTrained: 67
        },
        safety: {
          daysWithoutIncident: 45,
          nearMisses: 3,
          safetyScore: 94.5
        }
      };

      this.setCache(cacheKey, workforce);
      return workforce;
    } catch (error) {
      console.error('Error fetching workforce analytics:', error);
      throw error;
    }
  }

  // Helper methods

  /**
   * Generate trend data for specified period
   */
  generateTrendData(period, granularity) {
    const dataPoints = [];
    const numPoints = period === '7d' ? 7 : period === '30d' ? 30 : 90;

    for (let i = 0; i < numPoints; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (numPoints - i - 1));

      dataPoints.push({
        date: date.toISOString().split('T')[0],
        production: 4500 + Math.random() * 1000,
        efficiency: 85 + Math.random() * 10,
        quality: 95 + Math.random() * 4,
        oee: 75 + Math.random() * 15,
        availability: 90 + Math.random() * 8,
        performance: 85 + Math.random() * 10,
        totalCost: 45000 + Math.random() * 10000,
        laborCost: 15000 + Math.random() * 3000,
        materialCost: 25000 + Math.random() * 5000,
        overheadCost: 5000 + Math.random() * 2000
      });
    }

    return dataPoints;
  }

  /**
   * Generate energy consumption data
   */
  generateEnergyData(period) {
    const numPoints = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const data = [];

    for (let i = 0; i < numPoints; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (numPoints - i - 1));

      data.push({
        date: date.toISOString().split('T')[0],
        consumption: 6000 + Math.random() * 2000,
        cost: 1500 + Math.random() * 500,
        peakDemand: 800 + Math.random() * 200
      });
    }

    return data;
  }

  /**
   * Generate waste trend data
   */
  generateWasteTrends(period) {
    const numPoints = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const trends = [];

    for (let i = 0; i < numPoints; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (numPoints - i - 1));

      trends.push({
        date: date.toISOString().split('T')[0],
        waste: 70 + Math.random() * 30,
        recycled: 50 + Math.random() * 25,
        rate: 2.5 + Math.random() * 1.5
      });
    }

    return trends;
  }

  /**
   * Cache management
   */
  isCacheValid(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;

    return Date.now() - cached.timestamp < this.cacheTimeout;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const manufacturingAnalyticsService = new ManufacturingAnalyticsService();

// Export class for testing
export default ManufacturingAnalyticsService;