import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';

export class ProductionDataIntegrator {
  constructor(databaseService) {
    this.databaseService = databaseService;
    this.metricsCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // Production line configurations
    this.productionLines = {
      'line-1': { name: 'Assembly Line 1', capacity: 100, efficiency: 0.85 },
      'line-2': { name: 'Assembly Line 2', capacity: 120, efficiency: 0.82 },
      'line-3': { name: 'Packaging Line', capacity: 200, efficiency: 0.90 },
      'line-4': { name: 'Quality Control', capacity: 80, efficiency: 0.95 }
    };

    // KPI thresholds
    this.thresholds = {
      efficiency: { excellent: 0.90, good: 0.80, poor: 0.70 },
      availability: { excellent: 0.95, good: 0.85, poor: 0.75 },
      quality: { excellent: 0.98, good: 0.95, poor: 0.90 },
      oee: { excellent: 0.85, good: 0.65, poor: 0.40 }
    };
  }

  async getProductionMetrics(companyId = 'default', options = {}) {
    const cacheKey = `production_metrics_${companyId}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.metricsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      logInfo('Returning cached production metrics');
      return cached.data;
    }

    try {
      const { 
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate = new Date(),
        lineId = null,
        includeDowntime = true,
        includeQuality = true
      } = options;

      logInfo('Calculating production metrics', { companyId, startDate, endDate, lineId });

      // Get production data from multiple sources
      const [
        batchProductions,
        downtimeEvents,
        qualityMetrics,
        resourceUtilization,
        maintenanceSchedule
      ] = await Promise.all([
        this.getProductionJobs(companyId, startDate, endDate, lineId),
        includeDowntime ? this.getDowntimeEvents(companyId, startDate, endDate, lineId) : [],
        includeQuality ? this.getQualityMetrics(companyId, startDate, endDate, lineId) : null,
        this.getResourceUtilization(companyId, startDate, endDate, lineId),
        this.getMaintenanceSchedule(companyId, startDate, endDate, lineId)
      ]);

      // Calculate comprehensive metrics
      const metrics = await this.calculateComprehensiveMetrics({
        batchProductions,
        downtimeEvents,
        qualityMetrics,
        resourceUtilization,
        maintenanceSchedule,
        startDate,
        endDate,
        lineId
      });

      // Cache the results
      this.metricsCache.set(cacheKey, {
        data: metrics,
        timestamp: Date.now()
      });

      logInfo('Production metrics calculated successfully', {
        totalJobs: batchProductions.length,
        oeeScore: metrics.oee?.overall || 0,
        efficiency: metrics.efficiency?.overall || 0
      });

      return metrics;

    } catch (error) {
      logError('Failed to get production metrics', error);
      return this.getFallbackMetrics(companyId, error);
    }
  }

  async getProductionJobs(companyId, startDate, endDate, lineId) {
    if (!this.databaseService.isConnected) {
      return this.getMockProductionJobs(startDate, endDate, lineId);
    }

    try {
      const whereClause = {
        companyId,
        startTime: {
          gte: startDate,
          lte: endDate
        }
      };

      if (lineId) {
        whereClause.lineId = lineId;
      }

      const jobs = await this.databaseService.prisma.batchProduction.findMany({
        where: whereClause,
        include: {
          product: true,
          line: true
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      return jobs;
    } catch (error) {
      logError('Failed to get production jobs from database', error);
      return this.getMockProductionJobs(startDate, endDate, lineId);
    }
  }

  async getDowntimeEvents(companyId, startDate, endDate, lineId) {
    if (!this.databaseService.isConnected) {
      return this.getMockDowntimeEvents(startDate, endDate, lineId);
    }

    try {
      const whereClause = {
        companyId,
        startTime: {
          gte: startDate,
          lte: endDate
        }
      };

      if (lineId) {
        whereClause.lineId = lineId;
      }

      const downtimeEvents = await this.databaseService.prisma.downtimeEvent.findMany({
        where: whereClause,
        include: {
          line: true
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      return downtimeEvents;
    } catch (error) {
      logError('Failed to get downtime events from database', error);
      return this.getMockDowntimeEvents(startDate, endDate, lineId);
    }
  }

  async getQualityMetrics(companyId, startDate, endDate, lineId) {
    if (!this.databaseService.isConnected) {
      return this.getMockQualityMetrics(startDate, endDate, lineId);
    }

    try {
      const whereClause = {
        companyId,
        date: {
          gte: startDate,
          lte: endDate
        }
      };

      if (lineId) {
        whereClause.lineId = lineId;
      }

      const qualityData = await this.databaseService.prisma.qualityMetric.findMany({
        where: whereClause,
        include: {
          line: true,
          product: true
        },
        orderBy: {
          date: 'asc'
        }
      });

      return this.processQualityData(qualityData);
    } catch (error) {
      logError('Failed to get quality metrics from database', error);
      return this.getMockQualityMetrics(startDate, endDate, lineId);
    }
  }

  async getResourceUtilization(companyId, startDate, endDate, lineId) {
    if (!this.databaseService.isConnected) {
      return this.getMockResourceUtilization(startDate, endDate, lineId);
    }

    try {
      const whereClause = {
        companyId,
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      };

      if (lineId) {
        whereClause.lineId = lineId;
      }

      const utilizationData = await this.databaseService.prisma.resourceUtilization.findMany({
        where: whereClause,
        include: {
          resource: true,
          line: true
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      return this.processUtilizationData(utilizationData);
    } catch (error) {
      logError('Failed to get resource utilization from database', error);
      return this.getMockResourceUtilization(startDate, endDate, lineId);
    }
  }

  async getMaintenanceSchedule(companyId, startDate, endDate, lineId) {
    if (!this.databaseService.isConnected) {
      return this.getMockMaintenanceSchedule(startDate, endDate, lineId);
    }

    try {
      const whereClause = {
        companyId,
        scheduledDate: {
          gte: startDate,
          lte: endDate
        }
      };

      if (lineId) {
        whereClause.lineId = lineId;
      }

      const maintenanceEvents = await this.databaseService.prisma.maintenanceEvent.findMany({
        where: whereClause,
        include: {
          line: true,
          equipment: true
        },
        orderBy: {
          scheduledDate: 'asc'
        }
      });

      return maintenanceEvents;
    } catch (error) {
      logError('Failed to get maintenance schedule from database', error);
      return this.getMockMaintenanceSchedule(startDate, endDate, lineId);
    }
  }

  async calculateComprehensiveMetrics(data) {
    const {
      batchProductions,
      downtimeEvents,
      qualityMetrics,
      resourceUtilization,
      maintenanceSchedule,
      startDate,
      endDate,
      lineId
    } = data;

    // Calculate OEE (Overall Equipment Effectiveness)
    const oee = this.calculateOEE(batchProductions, downtimeEvents, qualityMetrics, startDate, endDate);
    
    // Calculate production efficiency
    const efficiency = this.calculateEfficiency(batchProductions, resourceUtilization);
    
    // Calculate availability metrics
    const availability = this.calculateAvailability(batchProductions, downtimeEvents, startDate, endDate);
    
    // Calculate quality metrics
    const quality = this.calculateQualityMetrics(qualityMetrics, batchProductions);
    
    // Calculate throughput metrics
    const throughput = this.calculateThroughput(batchProductions, startDate, endDate);
    
    // Calculate cost metrics
    const costs = this.calculateProductionCosts(batchProductions, resourceUtilization, downtimeEvents);
    
    // Calculate performance trends
    const trends = this.calculateTrends(batchProductions, downtimeEvents, qualityMetrics);

    // Generate alerts and recommendations
    const alerts = this.generateAlerts(oee, efficiency, availability, quality, maintenanceSchedule);
    const recommendations = this.generateRecommendations(oee, efficiency, availability, quality, costs);

    return {
      companyId: data.companyId || 'default',
      period: {
        startDate,
        endDate,
        durationHours: (endDate - startDate) / (1000 * 60 * 60)
      },
      lineId,
      
      // Core KPIs
      oee,
      efficiency,
      availability,
      quality,
      throughput,
      costs,
      
      // Operational data
      production: {
        totalJobs: batchProductions.length,
        completedJobs: batchProductions.filter(j => j.status === 'COMPLETED').length,
        inProgressJobs: batchProductions.filter(j => j.status === 'IN_PROGRESS').length,
        totalUnitsProduced: batchProductions.reduce((sum, job) => sum + (job.actualQuantity || job.plannedQuantity), 0),
        totalPlannedQuantity: batchProductions.reduce((sum, job) => sum + job.plannedQuantity, 0)
      },
      
      downtime: {
        totalEvents: downtimeEvents.length,
        totalDurationMinutes: downtimeEvents.reduce((sum, event) => sum + this.calculateEventDuration(event), 0),
        byCategory: this.categorizeDowntimeEvents(downtimeEvents),
        averageDurationMinutes: downtimeEvents.length > 0 ? 
          downtimeEvents.reduce((sum, event) => sum + this.calculateEventDuration(event), 0) / downtimeEvents.length : 0
      },
      
      maintenance: {
        scheduledEvents: maintenanceSchedule.filter(m => m.type === 'PREVENTIVE').length,
        emergencyEvents: maintenanceSchedule.filter(m => m.type === 'CORRECTIVE').length,
        upcomingMaintenance: maintenanceSchedule.filter(m => 
          new Date(m.scheduledDate) > new Date() && 
          new Date(m.scheduledDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        )
      },
      
      // Performance analysis
      trends,
      alerts,
      recommendations,
      
      // Data quality indicators
      dataQuality: {
        batchProductions: batchProductions.length > 0 ? 'good' : 'poor',
        downtimeEvents: downtimeEvents.length >= 0 ? 'good' : 'poor',
        qualityMetrics: qualityMetrics ? 'good' : 'limited',
        resourceUtilization: resourceUtilization ? 'good' : 'limited',
        overall: this.assessOverallDataQuality(batchProductions, downtimeEvents, qualityMetrics, resourceUtilization)
      },
      
      calculatedAt: new Date(),
      cacheExpiresAt: new Date(Date.now() + this.cacheTimeout)
    };
  }

  calculateOEE(batchProductions, downtimeEvents, qualityMetrics, startDate, endDate) {
    // OEE = Availability × Performance × Quality
    
    const totalTime = (endDate - startDate) / (1000 * 60); // Total time in minutes
    const downtimeMinutes = downtimeEvents.reduce((sum, event) => sum + this.calculateEventDuration(event), 0);
    const availableTime = totalTime - downtimeMinutes;
    
    // Availability = (Planned Production Time - Downtime) / Planned Production Time
    const availability = totalTime > 0 ? availableTime / totalTime : 0;
    
    // Performance = (Total Count × Ideal Cycle Time) / Operating Time
    const totalProduced = batchProductions.reduce((sum, job) => sum + (job.actualQuantity || job.plannedQuantity), 0);
    const totalPlanned = batchProductions.reduce((sum, job) => sum + job.plannedQuantity, 0);
    const performance = totalPlanned > 0 ? totalProduced / totalPlanned : 0;
    
    // Quality = Good Units / Total Units
    const qualityRate = qualityMetrics?.overallQualityRate || 0.95;
    
    const oeeScore = availability * performance * qualityRate;
    
    return {
      overall: oeeScore,
      availability,
      performance,
      quality: qualityRate,
      rating: this.getRating(oeeScore, this.thresholds.oee),
      benchmark: this.thresholds.oee,
      components: {
        totalTimeMinutes: totalTime,
        downtimeMinutes,
        availableTimeMinutes: availableTime,
        totalProduced,
        totalPlanned,
        qualityRate
      }
    };
  }

  calculateEfficiency(batchProductions, resourceUtilization) {
    const completedJobs = batchProductions.filter(j => j.status === 'COMPLETED');
    
    if (completedJobs.length === 0) {
      return {
        overall: 0,
        rating: 'poor',
        details: { message: 'No completed jobs found' }
      };
    }

    // Calculate efficiency based on actual vs planned times
    const totalPlannedTime = completedJobs.reduce((sum, job) => sum + (job.plannedDurationMinutes || 60), 0);
    const totalActualTime = completedJobs.reduce((sum, job) => sum + this.calculateJobDuration(job), 0);
    
    const efficiency = totalActualTime > 0 ? totalPlannedTime / totalActualTime : 0;
    
    // Resource efficiency from utilization data
    const resourceEfficiency = resourceUtilization?.averageUtilization || 0.8;

    const overallEfficiency = (efficiency + resourceEfficiency) / 2;

    return {
      overall: Math.min(1.0, overallEfficiency),
      timeEfficiency: Math.min(1.0, efficiency),
      resourceEfficiency,
      rating: this.getRating(overallEfficiency, this.thresholds.efficiency),
      benchmark: this.thresholds.efficiency,
      details: {
        totalPlannedTimeMinutes: totalPlannedTime,
        totalActualTimeMinutes: totalActualTime,
        completedJobs: completedJobs.length
      }
    };
  }

  calculateAvailability(batchProductions, downtimeEvents, startDate, endDate) {
    const totalTime = (endDate - startDate) / (1000 * 60 * 60); // Total time in hours
    const downtimeHours = downtimeEvents.reduce((sum, event) => sum + this.calculateEventDuration(event) / 60, 0);
    const availableTime = totalTime - downtimeHours;
    
    const availability = totalTime > 0 ? availableTime / totalTime : 0;
    
    return {
      overall: availability,
      rating: this.getRating(availability, this.thresholds.availability),
      benchmark: this.thresholds.availability,
      details: {
        totalTimeHours: totalTime,
        downtimeHours,
        availableTimeHours: availableTime,
        downtimeEvents: downtimeEvents.length
      }
    };
  }

  calculateQualityMetrics(qualityMetrics, batchProductions) {
    if (!qualityMetrics) {
      return {
        overall: 0.95, // Default assumption
        rating: 'good',
        details: { source: 'estimated' }
      };
    }

    return {
      overall: qualityMetrics.overallQualityRate || 0.95,
      defectRate: qualityMetrics.defectRate || 0.05,
      reworkRate: qualityMetrics.reworkRate || 0.02,
      scrapRate: qualityMetrics.scrapRate || 0.01,
      rating: this.getRating(qualityMetrics.overallQualityRate || 0.95, this.thresholds.quality),
      benchmark: this.thresholds.quality,
      details: qualityMetrics
    };
  }

  calculateThroughput(batchProductions, startDate, endDate) {
    const totalUnits = batchProductions.reduce((sum, job) => sum + (job.actualQuantity || job.plannedQuantity), 0);
    const totalHours = (endDate - startDate) / (1000 * 60 * 60);
    
    return {
      unitsPerHour: totalHours > 0 ? totalUnits / totalHours : 0,
      totalUnits,
      totalHours,
      unitsPerJob: batchProductions.length > 0 ? totalUnits / batchProductions.length : 0
    };
  }

  calculateProductionCosts(batchProductions, resourceUtilization, downtimeEvents) {
    // Simplified cost calculation
    const laborCostPerHour = 25; // £25/hour average
    const downtimeCostPerHour = 500; // £500/hour downtime cost
    
    const totalLaborHours = batchProductions.reduce((sum, job) => sum + this.calculateJobDuration(job) / 60, 0);
    const totalDowntimeHours = downtimeEvents.reduce((sum, event) => sum + this.calculateEventDuration(event) / 60, 0);
    
    const laborCosts = totalLaborHours * laborCostPerHour;
    const downtimeCosts = totalDowntimeHours * downtimeCostPerHour;
    const totalCosts = laborCosts + downtimeCosts;
    
    const totalUnits = batchProductions.reduce((sum, job) => sum + (job.actualQuantity || job.plannedQuantity), 0);
    const costPerUnit = totalUnits > 0 ? totalCosts / totalUnits : 0;

    return {
      totalCosts,
      laborCosts,
      downtimeCosts,
      costPerUnit,
      currency: 'GBP',
      breakdown: {
        laborHours: totalLaborHours,
        downtimeHours: totalDowntimeHours,
        totalUnits
      }
    };
  }

  calculateTrends(batchProductions, downtimeEvents, qualityMetrics) {
    // Simple trend analysis - compare first half vs second half
    const midPoint = Math.floor(batchProductions.length / 2);
    const firstHalf = batchProductions.slice(0, midPoint);
    const secondHalf = batchProductions.slice(midPoint);
    
    const firstHalfEfficiency = this.calculateJobsEfficiency(firstHalf);
    const secondHalfEfficiency = this.calculateJobsEfficiency(secondHalf);
    
    const efficiencyTrend = secondHalfEfficiency - firstHalfEfficiency;
    
    return {
      efficiency: {
        trend: efficiencyTrend > 0.05 ? 'improving' : efficiencyTrend < -0.05 ? 'declining' : 'stable',
        change: efficiencyTrend
      },
      production: {
        trend: secondHalf.length > firstHalf.length ? 'increasing' : 
               secondHalf.length < firstHalf.length ? 'decreasing' : 'stable'
      },
      downtime: {
        trend: downtimeEvents.length > 5 ? 'increasing' : 'stable'
      }
    };
  }

  generateAlerts(oee, efficiency, availability, quality, maintenanceSchedule) {
    const alerts = [];
    
    // OEE alerts
    if (oee.overall < this.thresholds.oee.poor) {
      alerts.push({
        type: 'performance',
        severity: 'high',
        message: `OEE is critically low at ${(oee.overall * 100).toFixed(1)}%`,
        metric: 'oee',
        value: oee.overall,
        threshold: this.thresholds.oee.poor
      });
    }
    
    // Efficiency alerts
    if (efficiency.overall < this.thresholds.efficiency.poor) {
      alerts.push({
        type: 'efficiency',
        severity: 'medium',
        message: `Production efficiency is below target at ${(efficiency.overall * 100).toFixed(1)}%`,
        metric: 'efficiency',
        value: efficiency.overall,
        threshold: this.thresholds.efficiency.poor
      });
    }
    
    // Availability alerts
    if (availability.overall < this.thresholds.availability.poor) {
      alerts.push({
        type: 'availability',
        severity: 'high',
        message: `Equipment availability is low at ${(availability.overall * 100).toFixed(1)}%`,
        metric: 'availability',
        value: availability.overall,
        threshold: this.thresholds.availability.poor
      });
    }
    
    // Quality alerts
    if (quality.overall < this.thresholds.quality.poor) {
      alerts.push({
        type: 'quality',
        severity: 'high',
        message: `Quality rate has dropped to ${(quality.overall * 100).toFixed(1)}%`,
        metric: 'quality',
        value: quality.overall,
        threshold: this.thresholds.quality.poor
      });
    }
    
    // Maintenance alerts
    const upcomingMaintenance = maintenanceSchedule.filter(m => 
      new Date(m.scheduledDate) > new Date() && 
      new Date(m.scheduledDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000)
    );
    
    if (upcomingMaintenance.length > 0) {
      alerts.push({
        type: 'maintenance',
        severity: 'medium',
        message: `${upcomingMaintenance.length} maintenance event(s) scheduled within 24 hours`,
        details: upcomingMaintenance
      });
    }
    
    return alerts;
  }

  generateRecommendations(oee, efficiency, availability, quality, costs) {
    const recommendations = [];
    
    // OEE improvement recommendations
    if (oee.overall < this.thresholds.oee.good) {
      if (oee.availability < 0.8) {
        recommendations.push({
          type: 'availability_improvement',
          priority: 'high',
          message: 'Focus on reducing unplanned downtime to improve OEE',
          expectedImpact: 'Increase OEE by 10-15%',
          actions: ['Implement predictive maintenance', 'Improve equipment reliability', 'Reduce changeover times']
        });
      }
      
      if (oee.performance < 0.8) {
        recommendations.push({
          type: 'performance_improvement',
          priority: 'medium',
          message: 'Optimize production speed and eliminate micro-stops',
          expectedImpact: 'Increase OEE by 5-10%',
          actions: ['Eliminate bottlenecks', 'Improve operator training', 'Optimize process parameters']
        });
      }
    }
    
    // Cost optimization recommendations
    if (costs.costPerUnit > 50) { // £50 threshold
      recommendations.push({
        type: 'cost_optimization',
        priority: 'medium',
        message: 'Production costs per unit are high',
        expectedImpact: 'Reduce costs by 15-20%',
        actions: ['Improve labor efficiency', 'Reduce downtime costs', 'Optimize resource utilization']
      });
    }
    
    // Quality improvement recommendations
    if (quality.overall < this.thresholds.quality.good) {
      recommendations.push({
        type: 'quality_improvement',
        priority: 'high',
        message: 'Implement quality control measures',
        expectedImpact: 'Reduce defects by 30-50%',
        actions: ['Enhance inspection procedures', 'Improve process control', 'Train quality operators']
      });
    }
    
    return recommendations;
  }

  // Helper methods
  calculateEventDuration(event) {
    if (event.endTime && event.startTime) {
      return (new Date(event.endTime) - new Date(event.startTime)) / (1000 * 60); // Minutes
    }
    return event.durationMinutes || 30; // Default 30 minutes
  }

  calculateJobDuration(job) {
    if (job.endTime && job.startTime) {
      return (new Date(job.endTime) - new Date(job.startTime)) / (1000 * 60); // Minutes
    }
    return job.actualDurationMinutes || job.plannedDurationMinutes || 60; // Default 60 minutes
  }

  calculateJobsEfficiency(jobs) {
    if (jobs.length === 0) return 0;
    
    const totalPlanned = jobs.reduce((sum, job) => sum + (job.plannedDurationMinutes || 60), 0);
    const totalActual = jobs.reduce((sum, job) => sum + this.calculateJobDuration(job), 0);
    
    return totalActual > 0 ? totalPlanned / totalActual : 0;
  }

  categorizeDowntimeEvents(events) {
    const categories = {
      'EQUIPMENT_FAILURE': 0,
      'MAINTENANCE': 0,
      'CHANGEOVER': 0,
      'MATERIAL_SHORTAGE': 0,
      'QUALITY_ISSUE': 0,
      'OTHER': 0
    };

    events.forEach(event => {
      const category = event.category || 'OTHER';
      const duration = this.calculateEventDuration(event);
      categories[category] = (categories[category] || 0) + duration;
    });

    return categories;
  }

  getRating(value, thresholds) {
    if (value >= thresholds.excellent) return 'excellent';
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.poor) return 'fair';
    return 'poor';
  }

  assessOverallDataQuality(batchProductions, downtimeEvents, qualityMetrics, resourceUtilization) {
    const scores = [];
    
    if (batchProductions.length > 10) scores.push(3);
    else if (batchProductions.length > 5) scores.push(2);
    else if (batchProductions.length > 0) scores.push(1);
    else scores.push(0);
    
    if (downtimeEvents.length >= 0) scores.push(2);
    if (qualityMetrics) scores.push(2);
    if (resourceUtilization) scores.push(2);
    
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    if (averageScore >= 2.5) return 'excellent';
    if (averageScore >= 2) return 'good';
    if (averageScore >= 1) return 'fair';
    return 'poor';
  }

  // Mock data methods for when database is not available
  getMockProductionJobs(startDate, endDate, lineId) {
    const jobs = [];
    const lines = lineId ? [lineId] : Object.keys(this.productionLines);
    
    lines.forEach(line => {
      for (let i = 0; i < 10; i++) {
        const jobStart = new Date(startDate.getTime() + Math.random() * (endDate - startDate));
        const plannedDuration = 60 + Math.random() * 120; // 60-180 minutes
        const actualDuration = plannedDuration * (0.8 + Math.random() * 0.4); // 80-120% of planned
        
        jobs.push({
          id: `job-${line}-${i}`,
          lineId: line,
          productId: `PROD-${Math.floor(Math.random() * 5) + 1}`,
          status: Math.random() > 0.1 ? 'COMPLETED' : 'IN_PROGRESS',
          startTime: jobStart,
          endTime: new Date(jobStart.getTime() + actualDuration * 60 * 1000),
          plannedQuantity: Math.floor(50 + Math.random() * 100),
          actualQuantity: Math.floor(45 + Math.random() * 105),
          plannedDurationMinutes: plannedDuration,
          actualDurationMinutes: actualDuration
        });
      }
    });
    
    return jobs;
  }

  getMockDowntimeEvents(startDate, endDate, lineId) {
    const events = [];
    const lines = lineId ? [lineId] : Object.keys(this.productionLines);
    const categories = ['EQUIPMENT_FAILURE', 'MAINTENANCE', 'CHANGEOVER', 'MATERIAL_SHORTAGE', 'QUALITY_ISSUE'];
    
    lines.forEach(line => {
      for (let i = 0; i < 5; i++) {
        const eventStart = new Date(startDate.getTime() + Math.random() * (endDate - startDate));
        const duration = 15 + Math.random() * 120; // 15-135 minutes
        
        events.push({
          id: `downtime-${line}-${i}`,
          lineId: line,
          category: categories[Math.floor(Math.random() * categories.length)],
          startTime: eventStart,
          endTime: new Date(eventStart.getTime() + duration * 60 * 1000),
          durationMinutes: duration,
          description: `Downtime event on ${line}`
        });
      }
    });
    
    return events;
  }

  getMockQualityMetrics() {
    return {
      overallQualityRate: 0.92 + Math.random() * 0.06, // 92-98%
      defectRate: 0.02 + Math.random() * 0.06, // 2-8%
      reworkRate: 0.01 + Math.random() * 0.03, // 1-4%
      scrapRate: 0.005 + Math.random() * 0.015 // 0.5-2%
    };
  }

  getMockResourceUtilization() {
    return {
      averageUtilization: 0.7 + Math.random() * 0.25, // 70-95%
      details: {
        laborUtilization: 0.8 + Math.random() * 0.15,
        equipmentUtilization: 0.75 + Math.random() * 0.2
      }
    };
  }

  getMockMaintenanceSchedule(startDate, endDate) {
    const events = [];
    const currentDate = new Date();
    
    // Add some maintenance events
    for (let i = 0; i < 3; i++) {
      const schedDate = new Date(currentDate.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
      events.push({
        id: `maint-${i}`,
        lineId: `line-${(i % 4) + 1}`,
        type: Math.random() > 0.7 ? 'CORRECTIVE' : 'PREVENTIVE',
        scheduledDate: schedDate,
        description: `Scheduled maintenance ${i + 1}`
      });
    }
    
    return events;
  }

  processQualityData(qualityData) {
    if (!qualityData || qualityData.length === 0) {
      return this.getMockQualityMetrics();
    }
    
    const totalInspected = qualityData.reduce((sum, item) => sum + (item.inspectedQuantity || 0), 0);
    const totalDefects = qualityData.reduce((sum, item) => sum + (item.defectQuantity || 0), 0);
    const totalRework = qualityData.reduce((sum, item) => sum + (item.reworkQuantity || 0), 0);
    const totalScrap = qualityData.reduce((sum, item) => sum + (item.scrapQuantity || 0), 0);
    
    return {
      overallQualityRate: totalInspected > 0 ? (totalInspected - totalDefects) / totalInspected : 0.95,
      defectRate: totalInspected > 0 ? totalDefects / totalInspected : 0.05,
      reworkRate: totalInspected > 0 ? totalRework / totalInspected : 0.02,
      scrapRate: totalInspected > 0 ? totalScrap / totalInspected : 0.01
    };
  }

  processUtilizationData(utilizationData) {
    if (!utilizationData || utilizationData.length === 0) {
      return this.getMockResourceUtilization();
    }
    
    const averageUtilization = utilizationData.reduce((sum, item) => sum + (item.utilizationRate || 0.8), 0) / utilizationData.length;
    
    return {
      averageUtilization,
      details: utilizationData
    };
  }

  getFallbackMetrics(companyId, error) {
    return {
      companyId,
      error: error.message,
      fallback: true,
      oee: { overall: 0.65, rating: 'fair' },
      efficiency: { overall: 0.78, rating: 'good' },
      availability: { overall: 0.85, rating: 'good' },
      quality: { overall: 0.94, rating: 'good' },
      alerts: [{
        type: 'system_error',
        severity: 'medium',
        message: `Production data integration failed: ${error.message}`
      }],
      calculatedAt: new Date()
    };
  }

  clearCache() {
    this.metricsCache.clear();
    logInfo('Production metrics cache cleared');
  }

  getCacheStats() {
    return {
      size: this.metricsCache.size,
      timeout: this.cacheTimeout,
      keys: Array.from(this.metricsCache.keys())
    };
  }
}

export default ProductionDataIntegrator;