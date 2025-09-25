/**
 * Shop Floor Service - Mobile Manufacturing Dashboard
 * Optimized for shop floor operations with touch-friendly interface
 * Provides quick access to critical production data for operators
 */

import { logInfo, logWarn, logError } from './observability/structuredLogger.js';

class ShopFloorService {
  constructor() {
    this.currentShift = null;
    this.activeStations = new Map();
    this.workOrders = new Map();
    this.operatorActions = [];
    this.alerts = [];
    this.dashboardConfig = {
      refreshInterval: 15000, // 15 seconds for mobile
      maxAlerts: 10,
      quickActions: true
    };
    this.isConnected = false;
  }

  /**
   * Initialize shop floor dashboard
   */
  async initialize() {
    try {
      logInfo('Initializing shop floor dashboard service');
      
      // Load current shift information
      await this.loadCurrentShift();
      
      // Initialize work orders
      await this.loadActiveWorkOrders();
      
      // Connect to shop floor systems
      await this.connectToShopFloorSystems();
      
      // Start mobile-optimized monitoring
      await this.startMobileMonitoring();
      
      this.isConnected = true;
      logInfo('Shop floor dashboard service initialized successfully');
      return { success: true, message: 'Shop floor systems connected' };
    } catch (error) {
      logError('Failed to initialize shop floor service', error);
      throw new Error(`Shop floor integration failed: ${error.message}`);
    }
  }

  /**
   * Get mobile dashboard overview
   */
  async getMobileDashboardOverview() {
    try {
      const overview = {
        timestamp: new Date().toISOString(),
        shift: await this.getCurrentShiftInfo(),
        production: await this.getProductionSummary(),
        workOrders: await this.getActiveWorkOrdersSummary(),
        alerts: await this.getCriticalAlerts(),
        quickStats: await this.getQuickStats(),
        operatorActions: await this.getRecentOperatorActions(),
        stationStatus: await this.getStationStatusSummary()
      };

      return overview;
    } catch (error) {
      logError('Failed to get mobile dashboard overview', error);
      throw error;
    }
  }

  /**
   * Get current shift information
   */
  async getCurrentShiftInfo() {
    try {
      const shift = {
        id: `SHIFT_${new Date().toISOString().slice(0, 10)}_${this.getCurrentShiftNumber()}`,
        number: this.getCurrentShiftNumber(),
        startTime: this.getShiftStartTime(),
        endTime: this.getShiftEndTime(),
        supervisor: await this.getShiftSupervisor(),
        operators: await this.getShiftOperators(),
        status: 'active',
        duration: this.getShiftDuration(),
        timeRemaining: this.getTimeRemaining()
      };

      return shift;
    } catch (error) {
      logError('Failed to get current shift info', error);
      return null;
    }
  }

  /**
   * Get production summary for mobile view
   */
  async getProductionSummary() {
    try {
      const summary = {
        totalProduced: await this.getTotalProduced(),
        target: await this.getShiftTarget(),
        completionRate: 0,
        efficiency: await this.calculateShiftEfficiency(),
        qualityRate: await this.getShiftQualityRate(),
        activeLines: await this.getActiveProductionLines(),
        topProducts: await this.getTopProductsThisShift()
      };

      // Calculate completion rate
      if (summary.target > 0) {
        summary.completionRate = (summary.totalProduced / summary.target) * 100;
      }

      return summary;
    } catch (error) {
      logError('Failed to get production summary', error);
      return null;
    }
  }

  /**
   * Get active work orders for mobile display
   */
  async getActiveWorkOrdersSummary() {
    try {
      const workOrders = [];
      
      // Mock work orders for shop floor
      const mockWorkOrders = [
        {
          id: 'WO-2025-090801',
          product: 'GABA Red 500mg',
          quantity: 5000,
          completed: 3750,
          priority: 'high',
          dueTime: new Date(Date.now() + 2 * 3600000).toISOString(), // 2 hours
          station: 'Line A',
          operator: 'John Smith',
          status: 'in_progress'
        },
        {
          id: 'WO-2025-090802',
          product: 'Whey Protein Vanilla',
          quantity: 2000,
          completed: 500,
          priority: 'medium',
          dueTime: new Date(Date.now() + 6 * 3600000).toISOString(), // 6 hours
          station: 'Line B',
          operator: 'Sarah Johnson',
          status: 'in_progress'
        },
        {
          id: 'WO-2025-090803',
          product: 'Omega-3 Liquid',
          quantity: 1500,
          completed: 0,
          priority: 'low',
          dueTime: new Date(Date.now() + 8 * 3600000).toISOString(), // 8 hours
          station: 'Line C',
          operator: 'Mike Davis',
          status: 'pending'
        }
      ];

      return mockWorkOrders.map(wo => ({
        ...wo,
        completionRate: (wo.completed / wo.quantity) * 100,
        timeLeft: this.formatTimeRemaining(new Date(wo.dueTime) - new Date()),
        isOverdue: new Date(wo.dueTime) < new Date()
      }));
    } catch (error) {
      logError('Failed to get work orders summary', error);
      return [];
    }
  }

  /**
   * Get critical alerts for mobile display
   */
  async getCriticalAlerts() {
    try {
      const alerts = [
        {
          id: 'ALT-001',
          type: 'quality',
          severity: 'high',
          message: 'Quality check required on Line A',
          station: 'Line A',
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
          acknowledged: false,
          action: 'quality_check'
        },
        {
          id: 'ALT-002',
          type: 'maintenance',
          severity: 'medium',
          message: 'Scheduled maintenance due in 30 minutes',
          station: 'Line B',
          timestamp: new Date(Date.now() - 600000).toISOString(), // 10 min ago
          acknowledged: false,
          action: 'schedule_maintenance'
        },
        {
          id: 'ALT-003',
          type: 'inventory',
          severity: 'medium',
          message: 'Raw material running low - Capsule shells',
          station: 'Warehouse',
          timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
          acknowledged: true,
          action: 'reorder_material'
        }
      ];

      return alerts.map(alert => ({
        ...alert,
        timeAgo: this.formatTimeAgo(new Date() - new Date(alert.timestamp))
      }));
    } catch (error) {
      logError('Failed to get critical alerts', error);
      return [];
    }
  }

  /**
   * Record operator action from mobile interface
   */
  async recordOperatorAction(action) {
    try {
      logInfo('Recording operator action', action);

      const actionRecord = {
        id: `ACTION_${Date.now()}_${crypto.randomUUID().substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        operator: action.operator || 'Unknown',
        type: action.type,
        description: action.description,
        station: action.station,
        workOrder: action.workOrder,
        data: action.data || {},
        success: true
      };

      // Process different action types
      switch (action.type) {
        case 'start_production':
          await this.handleStartProduction(actionRecord);
          break;
        case 'complete_work_order':
          await this.handleCompleteWorkOrder(actionRecord);
          break;
        case 'quality_check':
          await this.handleQualityCheck(actionRecord);
          break;
        case 'material_request':
          await this.handleMaterialRequest(actionRecord);
          break;
        case 'acknowledge_alert':
          await this.handleAcknowledgeAlert(actionRecord);
          break;
        default:
          logWarn('Unknown operator action type', action);
      }

      this.operatorActions.unshift(actionRecord);
      
      // Keep only last 100 actions
      if (this.operatorActions.length > 100) {
        this.operatorActions = this.operatorActions.slice(0, 100);
      }

      logInfo(`Operator action recorded successfully: ${action.type}`);
      return actionRecord;
    } catch (error) {
      logError('Failed to record operator action', error);
      throw error;
    }
  }

  /**
   * Get quick stats for mobile dashboard
   */
  async getQuickStats() {
    try {
      const stats = {
        hourlyRate: await this.getHourlyProductionRate(),
        efficiency: await this.getCurrentEfficiency(),
        qualityRate: await this.getCurrentQualityRate(),
        oeeScore: await this.getCurrentOEE(),
        downtime: await this.getTotalDowntimeToday(),
        defectRate: await this.getCurrentDefectRate()
      };

      return stats;
    } catch (error) {
      logError('Failed to get quick stats', error);
      return {};
    }
  }

  /**
   * Get station status summary for mobile
   */
  async getStationStatusSummary() {
    try {
      const stations = [
        {
          id: 'LINE_A',
          name: 'Production Line A',
          status: 'running',
          operator: 'John Smith',
          currentProduct: 'GABA Red 500mg',
          efficiency: 94.5,
          lastUpdate: new Date().toISOString()
        },
        {
          id: 'LINE_B',
          name: 'Production Line B',
          status: 'idle',
          operator: 'Sarah Johnson',
          currentProduct: 'Whey Protein Vanilla',
          efficiency: 0,
          lastUpdate: new Date(Date.now() - 600000).toISOString()
        },
        {
          id: 'LINE_C',
          name: 'Production Line C',
          status: 'maintenance',
          operator: 'Mike Davis',
          currentProduct: null,
          efficiency: 0,
          lastUpdate: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: 'QC_STATION',
          name: 'Quality Control',
          status: 'active',
          operator: 'Lisa Chen',
          currentProduct: 'Various Testing',
          efficiency: 87.2,
          lastUpdate: new Date(Date.now() - 300000).toISOString()
        }
      ];

      return stations;
    } catch (error) {
      logError('Failed to get station status summary', error);
      return [];
    }
  }

  // Private helper methods

  async loadCurrentShift() {
    logInfo('Loading current shift information');
    this.currentShift = this.getCurrentShiftNumber();
  }

  async loadActiveWorkOrders() {
    logInfo('Loading active work orders');
    // This would connect to actual work order system
  }

  async connectToShopFloorSystems() {
    logInfo('Connecting to shop floor systems');
    await this.delay(500);
    logInfo('Shop floor system connections established');
  }

  async startMobileMonitoring() {
    logInfo('Starting mobile-optimized monitoring');
    
    // Shorter intervals for mobile responsiveness
    setInterval(() => this.updateMobileData(), this.dashboardConfig.refreshInterval);
    setInterval(() => this.cleanupOldData(), 3600000); // Cleanup every hour
  }

  getCurrentShiftNumber() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return 1; // Day shift
    if (hour >= 14 && hour < 22) return 2; // Afternoon shift
    return 3; // Night shift
  }

  getShiftStartTime() {
    const hour = new Date().getHours();
    const today = new Date();
    today.setMinutes(0, 0, 0);
    
    if (hour >= 6 && hour < 14) today.setHours(6);
    else if (hour >= 14 && hour < 22) today.setHours(14);
    else today.setHours(22);
    
    return today.toISOString();
  }

  getShiftEndTime() {
    const start = new Date(this.getShiftStartTime());
    start.setHours(start.getHours() + 8);
    return start.toISOString();
  }

  getShiftDuration() {
    const start = new Date(this.getShiftStartTime());
    const now = new Date();
    return Math.floor((now - start) / 3600000); // Hours elapsed
  }

  getTimeRemaining() {
    const end = new Date(this.getShiftEndTime());
    const now = new Date();
    const remaining = Math.max(0, end - now);
    return Math.floor(remaining / 3600000); // Hours remaining
  }

  formatTimeRemaining(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }

  formatTimeAgo(ms) {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Action handlers
  async handleStartProduction(action) { logInfo('Production started', action); }
  async handleCompleteWorkOrder(action) { logInfo('Work order completed', action); }
  async handleQualityCheck(action) { logInfo('Quality check performed', action); }
  async handleMaterialRequest(action) { logInfo('Material requested', action); }
  async handleAcknowledgeAlert(action) { logInfo('Alert acknowledged', action); }

  // Placeholder methods for real integration
  async getShiftSupervisor() { return 'David Wilson'; }
  async getShiftOperators() { return ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Chen']; }
  async getTotalProduced() { return 3750; }
  async getShiftTarget() { return 5000; }
  async calculateShiftEfficiency() { return 92.5; }
  async getShiftQualityRate() { return 98.1; }
  async getActiveProductionLines() { return 2; }
  async getTopProductsThisShift() { return ['GABA Red 500mg', 'Whey Protein Vanilla']; }
  async getHourlyProductionRate() { return 625; }
  async getCurrentEfficiency() { return 94.2; }
  async getCurrentQualityRate() { return 97.8; }
  async getCurrentOEE() { return 89.3; }
  async getTotalDowntimeToday() { return 45; } // minutes
  async getCurrentDefectRate() { return 1.2; }
  async getRecentOperatorActions() { return this.operatorActions.slice(0, 5); }
  async updateMobileData() { return; }
  async cleanupOldData() { return; }
}

// Export singleton instance
export const shopFloorService = new ShopFloorService();
export default shopFloorService;
