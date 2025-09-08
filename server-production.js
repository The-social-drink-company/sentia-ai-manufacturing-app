import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    'https://web-production-1f10.up.railway.app',
    'https://sentia-manufacturing-dashboard-production.up.railway.app'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Basic API endpoints with mock data
app.get('/api/production/status', (req, res) => {
  res.json({
    overallEfficiency: 94.2,
    efficiencyChange: 2.3,
    unitsProduced: 2847,
    unitsChange: 143,
    qualityRate: 98.1,
    qualityChange: 1.2,
    downtimeMinutes: 23,
    downtimeChange: 8,
    lines: [
      { id: 'line-a', name: 'Line A - GABA Red', status: 'running', efficiency: 96.1, outputRate: 456, target: 480 },
      { id: 'line-b', name: 'Line B - GABA Clear', status: 'running', efficiency: 92.3, outputRate: 387, target: 420 },
      { id: 'line-c', name: 'Line C - Packaging', status: 'paused', efficiency: 89.7, outputRate: 0, target: 350 }
    ],
    currentBatches: [
      { id: 'B2025001', product: 'GABA Red 500ml', status: 'processing', completion: 65, startTime: '2025-09-08T06:00:00Z' },
      { id: 'B2025002', product: 'GABA Clear 500ml', status: 'quality-check', completion: 89, startTime: '2025-09-08T04:30:00Z' }
    ],
    qualityAlerts: [
      { title: 'Temperature Variance', description: 'Line A temperature 2°C above target', time: '10 minutes ago' }
    ],
    maintenanceSchedule: [
      { equipment: 'Bottling Line A', type: 'Preventive Maintenance', priority: 'medium', scheduled: 'Tomorrow 8:00 AM' }
    ]
  });
});

app.get('/api/quality/metrics', (req, res) => {
  res.json({
    passRate: 98.1,
    defectRate: 1.9,
    activeTests: [
      { id: 'QT001', product: 'GABA Red', status: 'running', completion: 75 }
    ],
    alerts: []
  });
});

app.get('/api/forecasting/demand', (req, res) => {
  res.json({
    forecast: [2400, 2450, 2380, 2500, 2420, 2480, 2390],
    confidence: 0.85,
    model: 'AI Ensemble',
    insights: ['Demand expected to increase 3.2% next week']
  });
});

app.get('/api/working-capital/kpis', (req, res) => {
  res.json({
    cashFlow: 485000,
    accountsReceivable: 1200000,
    accountsPayable: 785000,
    inventory: 950000,
    workingCapitalRatio: 1.8
  });
});

app.get('/api/working-capital/kpis/trends', (req, res) => {
  res.json({
    trends: [
      { date: '2025-09-01', cashFlow: 450000 },
      { date: '2025-09-02', cashFlow: 465000 },
      { date: '2025-09-03', cashFlow: 470000 },
      { date: '2025-09-04', cashFlow: 475000 },
      { date: '2025-09-05', cashFlow: 480000 },
      { date: '2025-09-06', cashFlow: 485000 }
    ]
  });
});

app.get('/api/inventory/status', (req, res) => {
  res.json({
    totalValue: 950000,
    lowStockItems: 3,
    overStockItems: 1,
    categories: [
      { name: 'Raw Materials', value: 400000, status: 'good' },
      { name: 'Work in Progress', value: 250000, status: 'good' },
      { name: 'Finished Goods', value: 300000, status: 'low' }
    ]
  });
});

// Real-time monitoring endpoints
app.get('/api/monitoring/status', (req, res) => {
  res.json({
    productionLines: [
      {
        id: 'line-a',
        name: 'GABA Red Production Line A',
        status: 'running',
        efficiency: 94.2,
        currentBatch: 'B2025001',
        temperature: 22.5,
        pressure: 1.85,
        speed: 1250,
        targetSpeed: 1300,
        lastMaintenance: '2025-09-06T10:00:00Z',
        nextMaintenance: '2025-09-15T08:00:00Z',
        operatorCount: 3,
        alertLevel: 'normal'
      },
      {
        id: 'line-b',
        name: 'GABA Clear Production Line B',
        status: 'warning',
        efficiency: 87.8,
        currentBatch: 'B2025002',
        temperature: 24.2,
        pressure: 1.92,
        speed: 1100,
        targetSpeed: 1200,
        lastMaintenance: '2025-09-05T14:00:00Z',
        nextMaintenance: '2025-09-12T09:00:00Z',
        operatorCount: 2,
        alertLevel: 'warning'
      },
      {
        id: 'line-c',
        name: 'Packaging Line C',
        status: 'maintenance',
        efficiency: 0,
        currentBatch: null,
        temperature: 20.1,
        pressure: 0,
        speed: 0,
        targetSpeed: 800,
        lastMaintenance: '2025-09-08T06:00:00Z',
        nextMaintenance: '2025-09-08T16:00:00Z',
        operatorCount: 1,
        alertLevel: 'maintenance'
      }
    ],
    equipment: [
      {
        id: 'mixer-001',
        name: 'Primary Mixer',
        type: 'mixer',
        status: 'operational',
        temperature: 65.2,
        rpm: 150,
        vibration: 0.5,
        efficiency: 96.1,
        lastService: '2025-09-01T00:00:00Z',
        nextService: '2025-09-29T00:00:00Z'
      },
      {
        id: 'bottler-001',
        name: 'Bottling Unit #1',
        type: 'bottler',
        status: 'warning',
        temperature: 18.5,
        rpm: 300,
        vibration: 1.2,
        efficiency: 89.3,
        lastService: '2025-08-28T00:00:00Z',
        nextService: '2025-09-25T00:00:00Z'
      },
      {
        id: 'conveyor-001',
        name: 'Main Conveyor',
        type: 'conveyor',
        status: 'operational',
        temperature: 22.0,
        rpm: 45,
        vibration: 0.3,
        efficiency: 98.7,
        lastService: '2025-09-03T00:00:00Z',
        nextService: '2025-10-03T00:00:00Z'
      }
    ],
    systemMetrics: {
      overallEfficiency: 91.4,
      activeAlerts: 3,
      maintenanceItems: 2,
      powerConsumption: 2847.5,
      waterUsage: 1250.8,
      totalOutput: 15420,
      qualityScore: 97.2,
      uptimePercentage: 94.8
    },
    alerts: [
      {
        id: 'alert-001',
        type: 'warning',
        severity: 'medium',
        title: 'Temperature Variance - Line B',
        message: 'Temperature reading 2.2°C above optimal range',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        equipment: 'line-b',
        acknowledged: false
      },
      {
        id: 'alert-002',
        type: 'maintenance',
        severity: 'high',
        title: 'Scheduled Maintenance Due',
        message: 'Packaging Line C maintenance window started',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        equipment: 'line-c',
        acknowledged: true
      },
      {
        id: 'alert-003',
        type: 'quality',
        severity: 'low',
        title: 'Quality Check Required',
        message: 'Batch B2025001 requires final quality verification',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        equipment: 'line-a',
        acknowledged: false
      }
    ]
  });
});

// Server-Sent Events endpoint for real-time monitoring
app.get('/api/monitoring/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial data
  const sendData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      systemMetrics: {
        overallEfficiency: 90 + Math.random() * 10,
        activeAlerts: Math.floor(Math.random() * 5),
        totalOutput: 15000 + Math.floor(Math.random() * 1000),
        uptimePercentage: 90 + Math.random() * 10
      },
      alerts: [
        {
          id: `alert-${Date.now()}`,
          type: Math.random() > 0.7 ? 'warning' : 'normal',
          severity: Math.random() > 0.8 ? 'high' : 'low',
          title: 'Live System Update',
          message: `System status updated at ${new Date().toLocaleTimeString()}`,
          timestamp: new Date().toISOString(),
          acknowledged: false
        }
      ]
    };
    
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send data every 5 seconds
  sendData();
  const interval = setInterval(sendData, 5000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
});

// Advanced inventory management endpoint
app.get('/api/inventory/advanced', (req, res) => {
  res.json({
    overview: {
      totalItems: 245,
      totalValue: 2847500,
      lowStockItems: 12,
      outOfStockItems: 3,
      reorderAlerts: 8,
      turnoverRate: 4.2,
      warehouseUtilization: 78.5,
      averageAge: 32.4
    },
    categories: [
      {
        name: 'Raw Materials',
        items: 89,
        value: 1250000,
        status: 'good',
        turnover: 5.2,
        lowStock: 4
      },
      {
        name: 'Work in Progress',
        items: 45,
        value: 680000,
        status: 'warning',
        turnover: 3.8,
        lowStock: 2
      },
      {
        name: 'Finished Goods',
        items: 78,
        value: 750000,
        status: 'critical',
        turnover: 3.2,
        lowStock: 5
      },
      {
        name: 'Packaging Materials',
        items: 33,
        value: 167500,
        status: 'good',
        turnover: 6.1,
        lowStock: 1
      }
    ],
    items: [
      {
        id: 'INV001',
        name: 'GABA Extract Premium',
        category: 'Raw Materials',
        sku: 'RM-GABA-001',
        currentStock: 450,
        reorderPoint: 200,
        maxStock: 1000,
        unitCost: 125.50,
        totalValue: 56475,
        supplier: 'BioExtract Ltd',
        location: 'A1-B3',
        status: 'good',
        lastOrder: '2025-09-01',
        leadTime: 14,
        avgUsage: 25,
        turnoverRate: 5.8,
        daysToStockout: 18
      },
      {
        id: 'INV002',
        name: 'Natural Flavoring - Berry',
        category: 'Raw Materials',
        sku: 'RM-FLAV-002',
        currentStock: 85,
        reorderPoint: 100,
        maxStock: 500,
        unitCost: 45.25,
        totalValue: 3846.25,
        supplier: 'Flavor Corp',
        location: 'B2-C1',
        status: 'low',
        lastOrder: '2025-08-28',
        leadTime: 7,
        avgUsage: 12,
        turnoverRate: 4.2,
        daysToStockout: 7
      },
      {
        id: 'INV003',
        name: 'Glass Bottles 500ml',
        category: 'Packaging Materials',
        sku: 'PKG-BTL-500',
        currentStock: 2400,
        reorderPoint: 1000,
        maxStock: 5000,
        unitCost: 1.25,
        totalValue: 3000,
        supplier: 'Glass Solutions',
        location: 'C1-D2',
        status: 'good',
        lastOrder: '2025-09-05',
        leadTime: 10,
        avgUsage: 180,
        turnoverRate: 7.2,
        daysToStockout: 13
      },
      {
        id: 'INV004',
        name: 'Sentia Red - Finished Product',
        category: 'Finished Goods',
        sku: 'FG-SENT-RED',
        currentStock: 0,
        reorderPoint: 50,
        maxStock: 500,
        unitCost: 25.00,
        totalValue: 0,
        supplier: 'Internal Production',
        location: 'D1-E1',
        status: 'out_of_stock',
        lastOrder: '2025-09-03',
        leadTime: 3,
        avgUsage: 45,
        turnoverRate: 12.5,
        daysToStockout: 0
      },
      {
        id: 'INV005',
        name: 'Quality Control Labels',
        category: 'Packaging Materials',
        sku: 'PKG-LBL-QC',
        currentStock: 15000,
        reorderPoint: 5000,
        maxStock: 20000,
        unitCost: 0.08,
        totalValue: 1200,
        supplier: 'Label Pro',
        location: 'E2-F1',
        status: 'good',
        lastOrder: '2025-08-30',
        leadTime: 5,
        avgUsage: 850,
        turnoverRate: 8.9,
        daysToStockout: 18
      }
    ],
    recentMovements: [
      {
        id: 'MOV001',
        item: 'GABA Extract Premium',
        type: 'out',
        quantity: 125,
        timestamp: '2025-09-08T10:30:00Z',
        reference: 'Production Order #2025-001',
        user: 'Production Team'
      },
      {
        id: 'MOV002',
        item: 'Glass Bottles 500ml',
        type: 'in',
        quantity: 2000,
        timestamp: '2025-09-08T08:15:00Z',
        reference: 'Purchase Order #PO-2025-089',
        user: 'Warehouse Staff'
      },
      {
        id: 'MOV003',
        item: 'Natural Flavoring - Berry',
        type: 'out',
        quantity: 35,
        timestamp: '2025-09-08T07:45:00Z',
        reference: 'Production Order #2025-002',
        user: 'Production Team'
      }
    ],
    valueTrend: [
      { date: '2025-09-01', value: 2650000 },
      { date: '2025-09-02', value: 2720000 },
      { date: '2025-09-03', value: 2780000 },
      { date: '2025-09-04', value: 2825000 },
      { date: '2025-09-05', value: 2810000 },
      { date: '2025-09-06', value: 2835000 },
      { date: '2025-09-07', value: 2847500 }
    ],
    turnoverAnalysis: [
      { category: 'Raw Materials', turnover: 5.2, target: 6.0 },
      { category: 'Work in Progress', turnover: 3.8, target: 4.0 },
      { category: 'Finished Goods', turnover: 3.2, target: 8.0 },
      { category: 'Packaging Materials', turnover: 6.1, target: 7.0 }
    ],
    stockLevelDistribution: [
      { status: 'Good', count: 185, color: '#10B981' },
      { status: 'Low Stock', count: 43, color: '#F59E0B' },
      { status: 'Critical', count: 12, color: '#EF4444' },
      { status: 'Out of Stock', count: 5, color: '#DC2626' }
    ]
  });
});

// Catch all handler - serve React app for any route not handled above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Serving React app from: ${path.join(__dirname, 'dist')}`);
});

export default app;