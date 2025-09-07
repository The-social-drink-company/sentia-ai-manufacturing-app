/**
 * Real-time Cash Flow Monitoring and Alert System
 * Enterprise-grade cash flow tracking with intelligent alerting
 */

import { EventEmitter } from 'events';
import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';

export class CashFlowMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      monitoringInterval: options.monitoringInterval || 60000, // 1 minute
      alertThresholds: {
        critical: options.criticalThreshold || 50000, // $50k
        warning: options.warningThreshold || 100000,  // $100k
        low: options.lowThreshold || 250000          // $250k
      },
      forecastHorizon: options.forecastHorizon || 30, // days
      volatilityWindow: options.volatilityWindow || 14, // days for volatility calc
      enablePredictiveAlerts: options.enablePredictiveAlerts !== false,
      enableRealTimeUpdates: options.enableRealTimeUpdates !== false,
      ...options
    };
    
    this.cashPositions = new Map();
    this.cashFlowHistory = new Map();
    this.activeAlerts = new Map();
    this.subscribers = new Set();
    this.monitoringTimer = null;
    this.isMonitoring = false;
  }

  /**
   * Start real-time cash flow monitoring
   */
  async startMonitoring(companyId) {
    try {
      logInfo('Starting cash flow monitoring', { companyId });
      
      this.isMonitoring = true;
      this.companyId = companyId;
      
      // Initial cash position update
      await this.updateCashPosition(companyId);
      
      // Start periodic monitoring
      this.monitoringTimer = setInterval(async () => {
        try {
          await this.monitorCashFlow(companyId);
        } catch (error) {
          logError('Cash flow monitoring error', { companyId, error: error.message });
        }
      }, this.config.monitoringInterval);
      
      logInfo('Cash flow monitoring started', { 
        companyId, 
        interval: this.config.monitoringInterval 
      });
      
    } catch (error) {
      logError('Failed to start cash flow monitoring', { companyId, error: error.message });
      throw error;
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    this.isMonitoring = false;
    
    logInfo('Cash flow monitoring stopped', { companyId: this.companyId });
  }

  /**
   * Core monitoring logic
   */
  async monitorCashFlow(companyId) {
    try {
      // Update current cash position
      const currentPosition = await this.updateCashPosition(companyId);
      
      // Analyze cash flow trends
      const trendAnalysis = await this.analyzeCashFlowTrends(companyId);
      
      // Generate cash flow forecast
      const forecast = await this.generateCashFlowForecast(companyId, trendAnalysis);
      
      // Check for alert conditions
      const alerts = await this.checkAlertConditions(companyId, currentPosition, forecast);
      
      // Process and dispatch alerts
      if (alerts.length > 0) {
        await this.processAlerts(companyId, alerts);
      }
      
      // Emit real-time updates
      this.emit('cashFlowUpdate', {
        companyId,
        timestamp: new Date().toISOString(),
        currentPosition,
        trendAnalysis,
        forecast,
        alerts
      });
      
      // Notify subscribers
      if (this.config.enableRealTimeUpdates) {
        this.notifySubscribers(companyId, {
          currentPosition,
          trendAnalysis,
          forecast,
          alerts
        });
      }
      
    } catch (error) {
      logError('Cash flow monitoring cycle failed', { companyId, error: error.message });
      throw error;
    }
  }

  /**
   * Update current cash position
   */
  async updateCashPosition(companyId) {
    try {
      // Fetch current cash position from multiple sources
      const [
        bankAccounts,
        pendingReceivables,
        pendingPayables,
        creditFacilities
      ] = await Promise.all([
        this.fetchBankAccountBalances(companyId),
        this.fetchPendingReceivables(companyId),
        this.fetchPendingPayables(companyId),
        this.fetchCreditFacilities(companyId)
      ]);
      
      // Calculate total available cash
      const totalCash = bankAccounts.reduce((sum, account) => sum + account.balance, 0);
      const availableCredit = creditFacilities.reduce((sum, facility) => 
        sum + (facility.limit - facility.used), 0
      );
      
      // Calculate net working capital
      const totalReceivables = pendingReceivables.reduce((sum, ar) => sum + ar.amount, 0);
      const totalPayables = pendingPayables.reduce((sum, ap) => sum + ap.amount, 0);
      const netWorkingCapital = totalReceivables - totalPayables;
      
      // Calculate effective liquidity
      const effectiveLiquidity = totalCash + availableCredit + (netWorkingCapital * 0.7);
      
      const position = {
        timestamp: new Date().toISOString(),
        cash: {
          total: totalCash,
          byAccount: bankAccounts,
          available: totalCash
        },
        credit: {
          totalLimit: creditFacilities.reduce((sum, f) => sum + f.limit, 0),
          totalUsed: creditFacilities.reduce((sum, f) => sum + f.used, 0),
          available: availableCredit,
          facilities: creditFacilities
        },
        workingCapital: {
          receivables: totalReceivables,
          payables: totalPayables,
          net: netWorkingCapital
        },
        liquidity: {
          effective: effectiveLiquidity,
          runway: await this.calculateCashRunway(companyId, effectiveLiquidity),
          riskLevel: this.assessLiquidityRisk(effectiveLiquidity, totalCash)
        }
      };
      
      // Store position history
      this.cashPositions.set(companyId, position);
      this.updateCashFlowHistory(companyId, position);
      
      return position;
      
    } catch (error) {
      logError('Failed to update cash position', { companyId, error: error.message });
      throw error;
    }
  }

  /**
   * Analyze cash flow trends
   */
  async analyzeCashFlowTrends(companyId) {
    const history = this.cashFlowHistory.get(companyId) || [];
    
    if (history.length < 2) {
      return {
        trend: 'insufficient_data',
        velocity: 0,
        volatility: 0,
        patterns: []
      };
    }
    
    // Calculate cash flow velocity (rate of change)
    const recentPositions = history.slice(-7); // Last 7 data points
    const velocity = this.calculateCashVelocity(recentPositions);
    
    // Calculate volatility
    const volatilityWindow = history.slice(-this.config.volatilityWindow);
    const volatility = this.calculateCashVolatility(volatilityWindow);
    
    // Identify patterns
    const patterns = this.identifyCashFlowPatterns(history);
    
    // Determine overall trend
    const trend = this.determineCashFlowTrend(history, velocity, volatility);
    
    return {
      trend,
      velocity,
      volatility,
      patterns,
      confidence: this.calculateTrendConfidence(history),
      analysis: {
        direction: velocity > 0 ? 'improving' : velocity < 0 ? 'declining' : 'stable',
        strength: Math.abs(velocity) > 10000 ? 'strong' : Math.abs(velocity) > 5000 ? 'moderate' : 'weak',
        stability: volatility < 0.1 ? 'stable' : volatility < 0.2 ? 'moderate' : 'volatile'
      }
    };
  }

  /**
   * Generate cash flow forecast
   */
  async generateCashFlowForecast(companyId, trendAnalysis) {
    try {
      const currentPosition = this.cashPositions.get(companyId);
      const forecast = [];
      
      // Base forecast on current position and trend
      let projectedCash = currentPosition.cash.total;
      const dailyVelocity = trendAnalysis.velocity / 30; // Convert monthly to daily
      
      for (let day = 1; day <= this.config.forecastHorizon; day++) {
        // Apply trend with some regression to mean
        const trendFactor = Math.pow(0.98, day); // Gradual regression
        const dailyChange = dailyVelocity * trendFactor;
        
        // Add seasonality and volatility adjustments
        const seasonalAdjustment = this.getSeasonalAdjustment(day, trendAnalysis.patterns);
        const volatilityAdjustment = this.getVolatilityAdjustment(trendAnalysis.volatility);
        
        projectedCash += dailyChange + seasonalAdjustment + volatilityAdjustment;
        
        // Calculate confidence (decreases with time)
        const confidence = Math.max(0.5, 0.95 - (day * 0.015));
        
        forecast.push({
          day,
          date: new Date(Date.now() + day * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          projectedCash: Math.max(0, projectedCash),
          confidence,
          riskLevel: this.assessDailyRisk(projectedCash, currentPosition.liquidity.effective)
        });
      }
      
      // Add scenario analysis
      const scenarios = this.generateScenarioForecasts(currentPosition, trendAnalysis);
      
      return {
        baseline: forecast,
        scenarios,
        assumptions: {
          basedOnTrend: trendAnalysis.trend,
          velocity: trendAnalysis.velocity,
          volatility: trendAnalysis.volatility,
          forecastHorizon: this.config.forecastHorizon
        },
        keyInsights: this.generateForecastInsights(forecast, scenarios)
      };
      
    } catch (error) {
      logError('Cash flow forecast generation failed', { companyId, error: error.message });
      throw error;
    }
  }

  /**
   * Check for alert conditions
   */
  async checkAlertConditions(companyId, currentPosition, forecast) {
    const alerts = [];
    const now = new Date();
    
    // Current position alerts
    if (currentPosition.cash.total <= this.config.alertThresholds.critical) {
      alerts.push({
        id: `critical_cash_${companyId}_${now.getTime()}`,
        type: 'critical_cash_shortage',
        severity: 'critical',
        title: 'Critical Cash Shortage',
        message: `Cash position critically low: $${(currentPosition.cash.total / 1000).toFixed(0)}k`,
        currentValue: currentPosition.cash.total,
        threshold: this.config.alertThresholds.critical,
        timestamp: now.toISOString(),
        actionRequired: true,
        recommendations: [
          'Immediate cash injection required',
          'Activate emergency credit facilities',
          'Accelerate receivables collection',
          'Defer non-critical payments'
        ]
      });
    } else if (currentPosition.cash.total <= this.config.alertThresholds.warning) {
      alerts.push({
        id: `warning_cash_${companyId}_${now.getTime()}`,
        type: 'low_cash_warning',
        severity: 'warning',
        title: 'Low Cash Warning',
        message: `Cash position below warning threshold: $${(currentPosition.cash.total / 1000).toFixed(0)}k`,
        currentValue: currentPosition.cash.total,
        threshold: this.config.alertThresholds.warning,
        timestamp: now.toISOString(),
        actionRequired: true,
        recommendations: [
          'Monitor cash position closely',
          'Review upcoming payables',
          'Consider drawing on credit facilities',
          'Accelerate collection efforts'
        ]
      });
    }
    
    // Cash runway alerts
    if (currentPosition.liquidity.runway < 30) {
      alerts.push({
        id: `runway_${companyId}_${now.getTime()}`,
        type: 'short_cash_runway',
        severity: currentPosition.liquidity.runway < 14 ? 'critical' : 'warning',
        title: 'Short Cash Runway',
        message: `Current cash runway: ${currentPosition.liquidity.runway.toFixed(0)} days`,
        currentValue: currentPosition.liquidity.runway,
        threshold: 30,
        timestamp: now.toISOString(),
        actionRequired: true,
        recommendations: [
          'Secure additional funding',
          'Reduce operational expenses',
          'Accelerate revenue collection',
          'Review investment priorities'
        ]
      });
    }
    
    // Predictive alerts based on forecast
    if (this.config.enablePredictiveAlerts && forecast.baseline) {
      const futureShortages = forecast.baseline.filter(day => 
        day.projectedCash < this.config.alertThresholds.warning && day.day <= 14
      );
      
      if (futureShortages.length > 0) {
        const firstShortage = futureShortages[0];
        alerts.push({
          id: `predicted_shortage_${companyId}_${now.getTime()}`,
          type: 'predicted_cash_shortage',
          severity: 'warning',
          title: 'Predicted Cash Shortage',
          message: `Cash shortage predicted in ${firstShortage.day} days: $${(firstShortage.projectedCash / 1000).toFixed(0)}k`,
          currentValue: firstShortage.projectedCash,
          daysAhead: firstShortage.day,
          confidence: firstShortage.confidence,
          timestamp: now.toISOString(),
          actionRequired: true,
          recommendations: [
            'Plan cash injection before shortage date',
            'Accelerate invoicing and collections',
            'Negotiate payment deferrals',
            'Consider short-term financing'
          ]
        });
      }
    }
    
    // Working capital alerts
    if (currentPosition.workingCapital.net < 0) {
      alerts.push({
        id: `negative_wc_${companyId}_${now.getTime()}`,
        type: 'negative_working_capital',
        severity: 'warning',
        title: 'Negative Working Capital',
        message: `Working capital is negative: $${(currentPosition.workingCapital.net / 1000).toFixed(0)}k`,
        currentValue: currentPosition.workingCapital.net,
        timestamp: now.toISOString(),
        actionRequired: true,
        recommendations: [
          'Review payment terms with suppliers',
          'Accelerate customer collections',
          'Optimize inventory levels',
          'Consider working capital financing'
        ]
      });
    }
    
    return alerts;
  }

  /**
   * Process and manage alerts
   */
  async processAlerts(companyId, newAlerts) {
    const existingAlerts = this.activeAlerts.get(companyId) || new Map();
    const processedAlerts = [];
    
    for (const alert of newAlerts) {
      // Check if this alert already exists
      const existingAlert = existingAlerts.get(alert.type);
      
      if (existingAlert) {
        // Update existing alert if values changed significantly
        if (this.shouldUpdateAlert(existingAlert, alert)) {
          alert.updated = true;
          alert.previousValue = existingAlert.currentValue;
          existingAlerts.set(alert.type, alert);
          processedAlerts.push(alert);
          
          logInfo('Alert updated', { companyId, alertType: alert.type, severity: alert.severity });
        }
      } else {
        // New alert
        alert.isNew = true;
        existingAlerts.set(alert.type, alert);
        processedAlerts.push(alert);
        
        logWarn('New alert generated', { companyId, alertType: alert.type, severity: alert.severity });
      }
    }
    
    // Clean up resolved alerts
    for (const [alertType, alert] of existingAlerts) {
      if (!newAlerts.find(newAlert => newAlert.type === alertType)) {
        // Alert resolved
        alert.resolved = true;
        alert.resolvedAt = new Date().toISOString();
        processedAlerts.push(alert);
        existingAlerts.delete(alertType);
        
        logInfo('Alert resolved', { companyId, alertType, severity: alert.severity });
      }
    }
    
    this.activeAlerts.set(companyId, existingAlerts);
    
    // Emit alert events
    if (processedAlerts.length > 0) {
      this.emit('alerts', {
        companyId,
        alerts: processedAlerts,
        timestamp: new Date().toISOString()
      });
    }
    
    return processedAlerts;
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of updates
   */
  notifySubscribers(companyId, data) {
    const notification = {
      type: 'cashFlowUpdate',
      companyId,
      timestamp: new Date().toISOString(),
      data
    };
    
    this.subscribers.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        logError('Subscriber notification failed', { error: error.message });
      }
    });
  }

  // Helper methods for calculations
  async calculateCashRunway(companyId, effectiveLiquidity) {
    // Get monthly burn rate from historical data
    const history = this.cashFlowHistory.get(companyId) || [];
    
    if (history.length < 2) {
      return Infinity; // Unable to calculate without historical data
    }
    
    // Calculate average monthly cash flow
    const monthlyChanges = [];
    for (let i = 1; i < Math.min(history.length, 13); i++) {
      const change = history[i].cash.total - history[i - 1].cash.total;
      monthlyChanges.push(change);
    }
    
    const avgMonthlyChange = monthlyChanges.reduce((sum, change) => sum + change, 0) / monthlyChanges.length;
    
    if (avgMonthlyChange >= 0) {
      return Infinity; // Positive cash flow
    }
    
    const monthlyBurn = Math.abs(avgMonthlyChange);
    return (effectiveLiquidity / monthlyBurn) * 30; // Convert to days
  }

  calculateCashVelocity(positions) {
    if (positions.length < 2) return 0;
    
    const first = positions[0].cash.total;
    const last = positions[positions.length - 1].cash.total;
    const timeSpan = positions.length;
    
    return (last - first) / timeSpan; // Cash change per time period
  }

  calculateCashVolatility(positions) {
    if (positions.length < 3) return 0;
    
    const changes = [];
    for (let i = 1; i < positions.length; i++) {
      const change = positions[i].cash.total - positions[i - 1].cash.total;
      changes.push(change);
    }
    
    const mean = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const variance = changes.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / changes.length;
    const standardDeviation = Math.sqrt(variance);
    
    const averageCash = positions.reduce((sum, pos) => sum + pos.cash.total, 0) / positions.length;
    
    return standardDeviation / averageCash; // Coefficient of variation
  }

  assessLiquidityRisk(effectiveLiquidity, totalCash) {
    const cashToLiquidityRatio = totalCash / effectiveLiquidity;
    
    if (effectiveLiquidity < this.config.alertThresholds.critical) {
      return 'critical';
    } else if (effectiveLiquidity < this.config.alertThresholds.warning) {
      return 'high';
    } else if (cashToLiquidityRatio < 0.3) {
      return 'medium'; // Too dependent on credit
    } else {
      return 'low';
    }
  }

  // Integration methods for fetching real data
  async fetchBankAccountBalances(companyId) {
    // This would integrate with banking APIs or database
    // For now, return mock structure
    return [
      { id: 'acc_1', name: 'Operating Account', balance: 150000 },
      { id: 'acc_2', name: 'Savings Account', balance: 75000 }
    ];
  }

  async fetchPendingReceivables(companyId) {
    // This would integrate with accounting system
    return [
      { id: 'ar_1', customer: 'Customer A', amount: 45000, dueDate: '2025-01-15' },
      { id: 'ar_2', customer: 'Customer B', amount: 32000, dueDate: '2025-01-20' }
    ];
  }

  async fetchPendingPayables(companyId) {
    // This would integrate with accounting system
    return [
      { id: 'ap_1', supplier: 'Supplier X', amount: 28000, dueDate: '2025-01-18' },
      { id: 'ap_2', supplier: 'Supplier Y', amount: 15000, dueDate: '2025-01-25' }
    ];
  }

  async fetchCreditFacilities(companyId) {
    // This would integrate with banking/lending systems
    return [
      { id: 'credit_1', type: 'Line of Credit', limit: 100000, used: 25000, rate: 0.065 }
    ];
  }
}

export default CashFlowMonitor;