const APIBASE = import.meta.env?.VITE_API_BASE_URL || '/api'
const MCP_BASE = import.meta.env?.VITE_MCP_SERVER_URL || 'https://mcp-server-tkyu.onrender.com'

// Import structured logger
import { logWarn } from '../../../utils/structuredLogger.js'

// Mock data generator for production metrics
const generateMockProductionData = (timeRange = '24h', line = 'all', shift = 'current') => {
  const now = new Date()

  // Production lines configuration
  const allLines = [
    { id: 'line-1', name: 'Production Line 1', capacity: 1000, type: 'filling' },
    { id: 'line-2', name: 'Production Line 2', capacity: 800, type: 'bottling' },
    { id: 'line-3', name: 'Production Line 3', capacity: 1200, type: 'packaging' },
    { id: 'line-4', name: 'Production Line 4', capacity: 900, type: 'labeling' }
  ]

  // Filter lines based on selection
  const selectedLines = line === 'all' ? allLines : allLines.filter(l => l.id === line)

  // Generate OEE data
  const generateOEEData = (lineData) => {
    const availability = 85 + Math.random() * 10 // 85-95%
    const performance = 80 + Math.random() * 15 // 80-95%
    const quality = 92 + Math.random() * 6 // 92-98%
    const overall = (availability * performance * quality) / 10000

    return {
      overall,
      availability,
      performance,
      quality,
      availabilityChange: (Math.random() - 0.5) * 5,
      performanceChange: (Math.random() - 0.5) * 8,
      qualityChange: (Math.random() - 0.5) * 3,
      target: 85,
      worldClass: 90,
      lineBreakdown: lineData.map(line => ({
        lineId: line.id,
        lineName: line.name,
        availability: 80 + Math.random() * 15,
        performance: 75 + Math.random() * 20,
        quality: 90 + Math.random() * 8,
        overall: 75 + Math.random() * 15,
        status: Math.random() > 0.8 ? 'down' : Math.random() > 0.6 ? 'setup' : 'running',
        currentJob: `JOB-${1000 + Math.floor(Math.random() * 999)}`
      }))
    }
  }

  // Generate machine status data
  const generateMachineData = () => {
    return selectedLines.map(line => ({
      id: line.id,
      name: line.name,
      type: line.type,
      status: Math.random() > 0.85 ? 'down' : Math.random() > 0.7 ? 'setup' : Math.random() > 0.6 ? 'idle' : 'running',
      efficiency: 75 + Math.random() * 20,
      currentSpeed: Math.floor(line.capacity * (0.7 + Math.random() * 0.25)),
      targetSpeed: line.capacity,
      temperature: 18 + Math.random() * 8, // 18-26°C
      pressure: 2.0 + Math.random() * 1.5, // 2.0-3.5 bar
      vibration: Math.random() * 2, // 0-2 mm/s
      runtime: Math.floor(Math.random() * 480), // minutes
      lastMaintenance: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      nextMaintenance: new Date(now.getTime() + (7 + Math.random() * 14) * 24 * 60 * 60 * 1000).toISOString(),
      alerts: Math.random() > 0.8 ? [{
        severity: Math.random() > 0.5 ? 'warning' : 'critical',
        message: Math.random() > 0.5 ? 'Temperature above normal' : 'Vibration levels high',
        timestamp: new Date(now.getTime() - Math.random() * 60 * 60 * 1000).toISOString()
      }] : []
    }))
  }

  // Generate production schedule
  const generateScheduleData = () => {
    const products = ['SNTG-001', 'SNTG-002', 'SNTB-001', 'SNTB-002', 'SNTR-001']
    const jobs = []

    for (let i = 0; i < 15; i++) {
      const startTime = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000)
      const duration = 2 + Math.random() * 6 // 2-8 hours
      const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000)

      jobs.push({
        id: `JOB-${1000 + i}`,
        product: products[Math.floor(Math.random() * products.length)],
        quantity: Math.floor(Math.random() * 5000) + 1000,
        plannedStart: startTime.toISOString(),
        plannedEnd: endTime.toISOString(),
        actualStart: Math.random() > 0.3 ? new Date(startTime.getTime() + (Math.random() - 0.5) * 60 * 60 * 1000).toISOString() : null,
        actualEnd: Math.random() > 0.6 ? new Date(endTime.getTime() + (Math.random() - 0.5) * 60 * 60 * 1000).toISOString() : null,
        status: Math.random() > 0.7 ? 'completed' : Math.random() > 0.4 ? 'in-progress' : Math.random() > 0.2 ? 'scheduled' : 'delayed',
        lineId: selectedLines[Math.floor(Math.random() * selectedLines.length)].id,
        priority: Math.random() > 0.8 ? 'high' : Math.random() > 0.6 ? 'medium' : 'low',
        progress: Math.floor(Math.random() * 100),
        operator: `Operator ${Math.floor(Math.random() * 10) + 1}`,
        notes: Math.random() > 0.7 ? 'Setup required' : Math.random() > 0.8 ? 'Quality check pending' : null
      })
    }

    return {
      jobs: jobs.sort((a, b) => new Date(a.plannedStart) - new Date(b.plannedStart)),
      plannedProduction: jobs.reduce((sum, job) => sum + job.quantity, 0),
      actualProduction: jobs.filter(j => j.status === 'completed').reduce((sum, job) => sum + job.quantity, 0),
      onTimeDelivery: Math.round((jobs.filter(j => j.status === 'completed' && j.actualEnd <= j.plannedEnd).length / jobs.filter(j => j.status === 'completed').length) * 100) || 0,
      variance: {
        schedule: (Math.random() - 0.5) * 20,
        efficiency: (Math.random() - 0.5) * 15
      }
    }
  }

  // Generate quality metrics
  const generateQualityData = () => {
    return {
      overallQuality: 95 + Math.random() * 4, // 95-99%
      defectRate: Math.random() * 2, // 0-2%
      firstPassYield: 92 + Math.random() * 6, // 92-98%
      reworkRate: Math.random() * 3, // 0-3%
      scrapRate: Math.random() * 1, // 0-1%
      customerComplaints: Math.floor(Math.random() * 5),
      qualityTrends: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        quality: 90 + Math.random() * 8,
        defects: Math.floor(Math.random() * 20),
        inspections: Math.floor(50 + Math.random() * 100)
      })),
      defectCategories: [
        { category: 'Visual Defects', count: Math.floor(Math.random() * 15), percentage: 35 },
        { category: 'Dimensional', count: Math.floor(Math.random() * 10), percentage: 25 },
        { category: 'Functional', count: Math.floor(Math.random() * 8), percentage: 20 },
        { category: 'Packaging', count: Math.floor(Math.random() * 6), percentage: 15 },
        { category: 'Other', count: Math.floor(Math.random() * 4), percentage: 5 }
      ],
      correctionActions: [
        {
          id: 'CA-001',
          issue: 'High visual defect rate on Line 2',
          action: 'Adjust lighting and inspector training',
          status: 'in-progress',
          dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          assignee: 'Quality Manager'
        },
        {
          id: 'CA-002',
          issue: 'Packaging seal failures',
          action: 'Replace sealing element and recalibrate',
          status: 'completed',
          completedDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          assignee: 'Maintenance Team'
        }
      ]
    }
  }

  // Generate capacity planning data
  const generateCapacityData = () => {
    const dailyCapacity = selectedLines.reduce((sum, line) => sum + line.capacity * 16, 0) // 16 hours operation
    const currentUtilization = 70 + Math.random() * 20 // 70-90%

    return {
      totalCapacity: dailyCapacity,
      currentUtilization,
      availableCapacity: dailyCapacity * (1 - currentUtilization / 100),
      bottlenecks: selectedLines
        .filter(() => Math.random() > 0.6)
        .map(line => ({
          lineId: line.id,
          lineName: line.name,
          utilizationRate: 95 + Math.random() * 5,
          impact: 'High',
          recommendation: `Consider adding parallel capacity or optimizing ${line.type} process`
        })),
      forecast: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(now.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        plannedUtilization: 60 + Math.random() * 30,
        forecastDemand: Math.floor(dailyCapacity * (0.5 + Math.random() * 0.4)),
        capacity: dailyCapacity
      })),
      constraints: [
        { type: 'Equipment', description: 'Line 2 scheduled maintenance', impact: 'Medium', duration: '4 hours' },
        { type: 'Material', description: 'Glass bottle shortage expected', impact: 'High', duration: '2 days' },
        { type: 'Staff', description: 'Reduced crew on night shift', impact: 'Low', duration: '1 week' }
      ]
    }
  }

  // Generate shift handover data
  const generateShiftData = () => {
    const shifts = ['shift-1', 'shift-2', 'shift-3']
    return {
      current: {
        id: 'shift-2',
        name: 'Afternoon Shift (14:00-22:00)',
        supervisor: 'Sarah Johnson',
        startTime: '14:00',
        endTime: '22:00',
        staffCount: 12,
        status: 'active'
      },
      previous: {
        id: 'shift-1',
        name: 'Morning Shift (06:00-14:00)',
        supervisor: 'Mike Chen',
        production: 8500,
        quality: 96.5,
        incidents: 1,
        notes: 'Line 3 had a 30-minute downtime for bearing replacement. Production target met despite delay.',
        handoverItems: [
          'Line 3 bearing replacement completed - monitor vibration levels',
          'Quality inspector reported slight color variation in batch 2024-0926-01',
          'New operator John Smith completed first week training'
        ]
      },
      upcoming: {
        id: 'shift-3',
        name: 'Night Shift (22:00-06:00)',
        supervisor: 'David Williams',
        plannedProduction: 7200,
        criticalTasks: [
          'Complete quality audit on finished goods',
          'Perform preventive maintenance on Line 1',
          'Train replacement operator on Line 4'
        ]
      }
    }
  }

  // Generate alerts
  const generateAlerts = () => {
    const alerts = []

    // Critical alerts (rare)
    if (Math.random() > 0.8) {
      alerts.push({
        severity: 'critical',
        title: 'Emergency Stop Activated',
        description: 'Line 2 emergency stop triggered - safety inspection required',
        action: 'Contact Safety Manager',
        timestamp: new Date(now.getTime() - Math.random() * 60 * 60 * 1000).toISOString()
      })
    }

    // Warning alerts (more common)
    if (Math.random() > 0.5) {
      alerts.push({
        severity: 'warning',
        title: 'High Temperature Alert',
        description: 'Production Line 3 temperature above normal operating range',
        action: 'Check Cooling System',
        timestamp: new Date(now.getTime() - Math.random() * 30 * 60 * 1000).toISOString()
      })
    }

    if (Math.random() > 0.6) {
      alerts.push({
        severity: 'warning',
        title: 'Production Behind Schedule',
        description: 'Current shift production 15% behind target',
        action: 'Review Schedule',
        timestamp: new Date(now.getTime() - Math.random() * 120 * 60 * 1000).toISOString()
      })
    }

    // Info alerts
    if (Math.random() > 0.4) {
      alerts.push({
        severity: 'info',
        title: 'Maintenance Scheduled',
        description: 'Line 1 preventive maintenance scheduled for tonight',
        action: 'Review Maintenance Plan',
        timestamp: new Date(now.getTime() - Math.random() * 60 * 60 * 1000).toISOString()
      })
    }

    return alerts
  }

  return {
    summary: {
      totalProduction: 25000 + Math.floor(Math.random() * 10000),
      productionChange: (Math.random() - 0.5) * 15,
      averageOEE: 78 + Math.random() * 15,
      oeeChange: (Math.random() - 0.5) * 5,
      qualityRate: 95 + Math.random() * 4,
      qualityChange: (Math.random() - 0.5) * 3,
      onTimeDelivery: 88 + Math.random() * 10,
      deliveryChange: (Math.random() - 0.5) * 8
    },
    oee: generateOEEData(selectedLines),
    machines: generateMachineData(),
    schedule: generateScheduleData(),
    quality: generateQualityData(),
    capacity: generateCapacityData(),
    shifts: generateShiftData(),
    alerts: generateAlerts(),
    lastUpdated: new Date().toISOString()
  }
}

export async function fetchProductionMetrics(timeRange = '24h', line = 'all', shift = 'current') {
  try {
    // Try MCP server first
    const response = await fetch(`${MCP_BASE}/v1/production/metrics?timeRange=${timeRange}&line=${line}&shift=${shift}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    })

    if (response.ok) {
      const data = await response.json()
      return {
        ...data,
        source: 'mcp'
      }
    }
  } catch (error) {
    // Log MCP server fallback in development only
    if (import.meta.env.DEV) {
      logWarn('MCP server unavailable, falling back to mock data', { error: error.message })
    }
  }

  // Try main API
  try {
    const response = await fetch(`${API_BASE}/production/metrics?timeRange=${timeRange}&line=${line}&shift=${shift}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      signal: AbortSignal.timeout(5000)
    })

    if (response.ok) {
      const data = await response.json()
      return {
        ...data,
        source: 'api'
      }
    }
  } catch (error) {
    // Log API fallback in development only
    if (import.meta.env.DEV) {
      logWarn('API unavailable, using mock data', { error: error.message })
    }
  }

  // Return mock data
  return {
    ...generateMockProductionData(timeRange, line, shift),
    source: 'mock'
  }
}

export async function exportProductionData(format = 'csv', timeRange = '24h', line = 'all', shift = 'current') {
  const data = await fetchProductionMetrics(timeRange, line, shift)

  if (format === 'csv') {
    const csv = convertProductionToCSV(data)
    downloadFile(csv, `production-${timeRange}-${line}-${shift}-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
  } else if (format === 'excel') {
    // For Excel, we'll use CSV for now but could implement proper Excel export later
    const csv = convertProductionToCSV(data)
    downloadFile(csv, `production-${timeRange}-${line}-${shift}-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
  } else if (format === 'pdf') {
    // For PDF, export as JSON for now
    const json = JSON.stringify(data, null, 2)
    downloadFile(json, `production-${timeRange}-${line}-${shift}-${new Date().toISOString().split('T')[0]}.json`, 'application/json')
  }
}

function convertProductionToCSV(data) {
  let csv = 'Metric,Value,Change,Status\n'

  // Summary metrics
  csv += `Total Production,${data.summary.totalProduction},${data.summary.productionChange?.toFixed(1)}%,Current\n`
  csv += `Average OEE,${data.summary.averageOEE?.toFixed(1)}%,${data.summary.oeeChange?.toFixed(1)}%,Current\n`
  csv += `Quality Rate,${data.summary.qualityRate?.toFixed(1)}%,${data.summary.qualityChange?.toFixed(1)}%,Current\n`
  csv += `On-Time Delivery,${data.summary.onTimeDelivery?.toFixed(1)}%,${data.summary.deliveryChange?.toFixed(1)}%,Current\n`

  // OEE breakdown
  csv += '\nOEE Component,Value,Target,Status\n'
  csv += `Overall OEE,${data.oee.overall?.toFixed(1)}%,${data.oee.target}%,${data.oee.overall >= data.oee.target ? 'Good' : 'Below Target'}\n`
  csv += `Availability,${data.oee.availability?.toFixed(1)}%,90%,${data.oee.availability >= 90 ? 'Good' : 'Below Target'}\n`
  csv += `Performance,${data.oee.performance?.toFixed(1)}%,95%,${data.oee.performance >= 95 ? 'Good' : 'Below Target'}\n`
  csv += `Quality,${data.oee.quality?.toFixed(1)}%,99%,${data.oee.quality >= 99 ? 'Good' : 'Below Target'}\n`

  // Machine status
  csv += '\nMachine,Status,Efficiency,Current Speed,Target Speed\n'
  data.machines.forEach(machine => {
    csv += `${machine.name},${machine.status},${machine.efficiency?.toFixed(1)}%,${machine.currentSpeed},${machine.targetSpeed}\n`
  })

  // Production schedule
  csv += '\nJob ID,Product,Status,Planned Quantity,Progress,Line\n'
  data.schedule.jobs.forEach(job => {
    csv += `${job.id},${job.product},${job.status},${job.quantity},${job.progress}%,${job.lineId}\n`
  })

  return csv
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}