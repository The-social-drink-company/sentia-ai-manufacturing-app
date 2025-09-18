import { Server } from 'socket.io';
import prisma from '../lib/prisma.js';
import { logInfo, logError, logWarn } from './observability/structuredLogger.js';

class WebSocketService {
  constructor() {
    this.io = null;
    this.productionIO = null;
    this.inventoryIO = null;
    this.qualityIO = null;
    this.maintenanceIO = null;
    this.intervals = [];
    this.connections = new Map();
  }

  initialize(httpServer) {
    try {
      // Initialize Socket.io server
      this.io = new Server(httpServer, {
        cors: {
          origin: [
            process.env.FRONTEND_URL,
            'https://sentia-manufacturing-development.onrender.com',
            'https://sentia-manufacturing-testing.onrender.com',
            'https://sentia-manufacturing-production.onrender.com',
            'http://localhost:3000',
            'http://localhost:5173'
          ].filter(Boolean),
          credentials: true,
          methods: ['GET', 'POST']
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000,
        upgradeTimeout: 30000,
        maxHttpBufferSize: 1e6,
        allowEIO3: true
      });

      // Create namespaces for different data streams
      this.productionIO = this.io.of('/production');
      this.inventoryIO = this.io.of('/inventory');
      this.qualityIO = this.io.of('/quality');
      this.maintenanceIO = this.io.of('/maintenance');

      // Set up connection handlers
      this.setupConnectionHandlers();

      // Start data streaming
      this.startDataStreaming();

      logInfo('WebSocket service initialized successfully', {
        namespaces: ['/production', '/inventory', '/quality', '/maintenance']
      });

      return true;
    } catch (error) {
      logError('Failed to initialize WebSocket service', error);
      return false;
    }
  }

  setupConnectionHandlers() {
    // Production namespace
    this.productionIO.on('connection', (socket) => {
      this.handleConnection('production', socket);

      socket.on('subscribe:metrics', (data) => {
        socket.join('metrics');
        this.sendInitialProductionData(socket);
      });

      socket.on('subscribe:schedule', (data) => {
        socket.join('schedule');
        this.sendInitialScheduleData(socket);
      });
    });

    // Inventory namespace
    this.inventoryIO.on('connection', (socket) => {
      this.handleConnection('inventory', socket);

      socket.on('subscribe:levels', (data) => {
        socket.join('levels');
        this.sendInitialInventoryData(socket);
      });

      socket.on('subscribe:movements', (data) => {
        socket.join('movements');
      });
    });

    // Quality namespace
    this.qualityIO.on('connection', (socket) => {
      this.handleConnection('quality', socket);

      socket.on('subscribe:inspections', (data) => {
        socket.join('inspections');
      });

      socket.on('subscribe:defects', (data) => {
        socket.join('defects');
        this.sendInitialQualityData(socket);
      });
    });

    // Maintenance namespace
    this.maintenanceIO.on('connection', (socket) => {
      this.handleConnection('maintenance', socket);

      socket.on('subscribe:schedule', (data) => {
        socket.join('schedule');
      });

      socket.on('subscribe:alerts', (data) => {
        socket.join('alerts');
      });
    });
  }

  handleConnection(namespace, socket) {
    const connectionId = `${namespace}:${socket.id}`;
    this.connections.set(connectionId, {
      namespace,
      socketId: socket.id,
      connectedAt: new Date(),
      rooms: []
    });

    logInfo(`WebSocket client connected to ${namespace}`, {
      socketId: socket.id,
      address: socket.handshake.address,
      totalConnections: this.connections.size
    });

    socket.on('disconnect', (reason) => {
      this.connections.delete(connectionId);
      logInfo(`WebSocket client disconnected from ${namespace}`, {
        socketId: socket.id,
        reason,
        remainingConnections: this.connections.size
      });
    });

    socket.on('error', (error) => {
      logError(`WebSocket error in ${namespace}`, {
        socketId: socket.id,
        error: error.message
      });
    });
  }

  startDataStreaming() {
    // Production metrics - every 1 second
    const productionInterval = setInterval(async () => {
      try {
        const metrics = await this.getLatestProductionMetrics();
        this.productionIO.to('metrics').emit('metrics:update', metrics);
      } catch (error) {
        logError('Failed to stream production metrics', error);
      }
    }, 1000);

    // Production schedule - every 30 seconds
    const scheduleInterval = setInterval(async () => {
      try {
        const schedule = await this.getProductionSchedule();
        this.productionIO.to('schedule').emit('schedule:update', schedule);
      } catch (error) {
        logError('Failed to stream production schedule', error);
      }
    }, 30000);

    // Inventory levels - every 5 seconds
    const inventoryInterval = setInterval(async () => {
      try {
        const levels = await this.getInventoryLevels();
        this.inventoryIO.to('levels').emit('levels:update', levels);

        // Check for low stock alerts
        const alerts = this.checkInventoryAlerts(levels);
        if (alerts.length > 0) {
          this.inventoryIO.to('levels').emit('alerts:inventory', alerts);
        }
      } catch (error) {
        logError('Failed to stream inventory levels', error);
      }
    }, 5000);

    // Quality metrics - every 10 seconds
    const qualityInterval = setInterval(async () => {
      try {
        const defects = await this.getRecentDefects();
        this.qualityIO.to('defects').emit('defects:update', defects);

        // Check for quality alerts
        const qualityAlerts = await this.checkQualityAlerts();
        if (qualityAlerts.length > 0) {
          this.qualityIO.to('defects').emit('alerts:quality', qualityAlerts);
        }
      } catch (error) {
        logError('Failed to stream quality data', error);
      }
    }, 10000);

    // Maintenance alerts - every 30 seconds
    const maintenanceInterval = setInterval(async () => {
      try {
        const maintenance = await this.getMaintenanceSchedule();
        this.maintenanceIO.to('schedule').emit('schedule:update', maintenance);

        // Check for maintenance alerts
        const maintenanceAlerts = this.checkMaintenanceAlerts(maintenance);
        if (maintenanceAlerts.length > 0) {
          this.maintenanceIO.to('alerts').emit('alerts:maintenance', maintenanceAlerts);
        }
      } catch (error) {
        logError('Failed to stream maintenance data', error);
      }
    }, 30000);

    // Store intervals for cleanup
    this.intervals = [
      productionInterval,
      scheduleInterval,
      inventoryInterval,
      qualityInterval,
      maintenanceInterval
    ];
  }

  // Data fetching methods
  async getLatestProductionMetrics() {
    try {
      const metrics = await prisma.productionMetrics.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: {
          line: true
        }
      });

      // Calculate real-time stats
      const totalUnits = metrics.reduce((sum, m) => sum + m.unitsProduced, 0);
      const avgEfficiency = metrics.reduce((sum, m) => sum + m.efficiency, 0) / metrics.length;
      const avgOEE = metrics.reduce((sum, m) => sum + m.oee, 0) / metrics.length;

      return {
        metrics,
        realTime: {
          totalUnits,
          avgEfficiency,
          avgOEE,
          timestamp: new Date()
        }
      };
    } catch (error) {
      logError('Error fetching production metrics', error);
      return { metrics: [], realTime: {} };
    }
  }

  async getProductionSchedule() {
    try {
      const schedule = await prisma.productionSchedule.findMany({
        where: {
          scheduledDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
          }
        },
        orderBy: { scheduledDate: 'asc' },
        include: {
          line: true
        }
      });

      return schedule;
    } catch (error) {
      logError('Error fetching production schedule', error);
      return [];
    }
  }

  async getInventoryLevels() {
    try {
      // Get all inventory items and filter in memory for low stock
      // Updated: Fixed query to not use status field directly
      const allInventory = await prisma.inventory.findMany({
        where: {
          OR: [
            // Out of stock: quantity is 0
            { quantity: 0 },
            // Low stock: has reorder point set (we'll filter quantity comparison in memory)
            { reorderPoint: { not: null } }
          ]
        },
        orderBy: { quantity: 'asc' },
        take: 50 // Get more to filter in memory
      });

      // Filter for actual low stock items
      const inventory = allInventory.filter(item => 
        item.quantity === 0 || 
        (item.reorderPoint && item.quantity <= item.reorderPoint)
      ).slice(0, 20);

      return inventory.map(item => ({
        ...item,
        stockPercentage: item.reorderPoint ? (item.quantity / item.reorderPoint) * 100 : 0,
        criticalLevel: item.reorderPoint ? item.quantity <= item.reorderPoint * 0.5 : false,
        status: item.quantity === 0 ? 'out-of-stock' : 'low-stock'
      }));
    } catch (error) {
      logError('Error fetching inventory levels', error);
      return [];
    }
  }

  async getRecentDefects() {
    try {
      const defects = await prisma.qualityDefect.findMany({
        where: {
          status: { in: ['open', 'investigating'] }
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          batch: true
        }
      });

      return defects;
    } catch (error) {
      logError('Error fetching quality defects', error);
      return [];
    }
  }

  async getMaintenanceSchedule() {
    try {
      const maintenance = await prisma.maintenanceSchedule.findMany({
        where: {
          scheduledDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
          },
          status: { in: ['scheduled', 'overdue'] }
        },
        orderBy: { scheduledDate: 'asc' },
        // Note: equipment relation not defined in schema
      });

      return maintenance;
    } catch (error) {
      logError('Error fetching maintenance schedule', error);
      return [];
    }
  }

  // Alert checking methods
  checkInventoryAlerts(inventory) {
    const alerts = [];

    inventory.forEach(item => {
      if (item.availableQuantity === 0) {
        alerts.push({
          type: 'critical',
          category: 'inventory',
          message: `${item.productName || item.name} is OUT OF STOCK`,
          sku: item.productCode || item.sku,
          timestamp: new Date()
        });
      } else if (item.criticalLevel) {
        alerts.push({
          type: 'warning',
          category: 'inventory',
          message: `${item.productName || item.name} is critically low (${item.availableQuantity} units)`,
          sku: item.productCode || item.sku,
          timestamp: new Date()
        });
      }
    });

    return alerts;
  }

  async checkQualityAlerts() {
    try {
      // Check for high defect rate
      const recentDefects = await prisma.qualityDefect.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        }
      });

      const alerts = [];
      if (recentDefects > 10) {
        alerts.push({
          type: 'critical',
          category: 'quality',
          message: `High defect rate detected: ${recentDefects} defects in the last hour`,
          count: recentDefects,
          timestamp: new Date()
        });
      }

      return alerts;
    } catch (error) {
      logError('Error checking quality alerts', error);
      return [];
    }
  }

  checkMaintenanceAlerts(maintenance) {
    const alerts = [];
    const now = new Date();

    maintenance.forEach(task => {
      const hoursUntilDue = (task.scheduledDate - now) / (1000 * 60 * 60);

      if (task.status === 'overdue') {
        alerts.push({
          type: 'critical',
          category: 'maintenance',
          message: `OVERDUE: ${task.equipment.name} maintenance`,
          equipmentId: task.equipmentId,
          timestamp: new Date()
        });
      } else if (hoursUntilDue <= 24) {
        alerts.push({
          type: 'warning',
          category: 'maintenance',
          message: `${task.equipment.name} maintenance due in ${Math.round(hoursUntilDue)} hours`,
          equipmentId: task.equipmentId,
          timestamp: new Date()
        });
      }
    });

    return alerts;
  }

  // Send initial data when client subscribes
  async sendInitialProductionData(socket) {
    const data = await this.getLatestProductionMetrics();
    socket.emit('metrics:initial', data);
  }

  async sendInitialScheduleData(socket) {
    const data = await this.getProductionSchedule();
    socket.emit('schedule:initial', data);
  }

  async sendInitialInventoryData(socket) {
    const data = await this.getInventoryLevels();
    socket.emit('levels:initial', data);
  }

  async sendInitialQualityData(socket) {
    const data = await this.getRecentDefects();
    socket.emit('defects:initial', data);
  }

  // Broadcast methods for external triggers
  broadcastProductionUpdate(data) {
    this.productionIO.to('metrics').emit('metrics:realtime', data);
  }

  broadcastInventoryUpdate(data) {
    this.inventoryIO.to('levels').emit('levels:realtime', data);
  }

  broadcastQualityAlert(alert) {
    this.qualityIO.emit('alert:quality', alert);
  }

  broadcastMaintenanceAlert(alert) {
    this.maintenanceIO.emit('alert:maintenance', alert);
  }

  // Get connection stats
  getConnectionStats() {
    return {
      totalConnections: this.connections.size,
      byNamespace: {
        production: Array.from(this.connections.values()).filter(c => c.namespace === 'production').length,
        inventory: Array.from(this.connections.values()).filter(c => c.namespace === 'inventory').length,
        quality: Array.from(this.connections.values()).filter(c => c.namespace === 'quality').length,
        maintenance: Array.from(this.connections.values()).filter(c => c.namespace === 'maintenance').length
      },
      connections: Array.from(this.connections.values())
    };
  }

  // Cleanup
  cleanup() {
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    // Disconnect all clients
    if (this.io) {
      this.io.disconnectSockets(true);
    }

    logInfo('WebSocket service cleaned up');
  }
}

// Export singleton instance
const websocketService = new WebSocketService();
export default websocketService;