import express from 'express'

const router = express.Router()

<<<<<<< HEAD
const mockTrend = [
  { date: '2024-01-01', cash: 520000, inflow: 250000, outflow: 180000 },
  { date: '2024-02-01', cash: 545000, inflow: 260000, outflow: 190000 },
  { date: '2024-03-01', cash: 568000, inflow: 275000, outflow: 200000 }
]
=======
import { sendSSEEvent } from './sse.js';
import { ensureDatabaseConnection } from '../database/client.js';
import { buildTimeSeries, summarizeSeries, toCurrency, determineTrend } from '../utils/dataTransforms.js';


const router = express.Router();
>>>>>>> branch-23-bulletproof

router.get('/dashboard/summary', (_req, res) => {
  res.json({
    revenue: {
      monthly: 2480000,
      quarterly: 7450000,
      yearly: 31200000,
      growth: 11.4
    },
    workingCapital: {
      current: 1880000,
      ratio: 2.6,
      cashFlow: 830000,
      daysReceivable: 44
    },
    production: {
      efficiency: 92.5,
      unitsProduced: 11840,
      defectRate: 0.9,
      oeeScore: 86.1
    },
    inventory: {
      value: 1180000,
      turnover: 4.1,
      skuCount: 328,
      lowStock: 9
    },
    timestamp: new Date().toISOString()
  })
})

router.get('/financial/working-capital', (_req, res) => {
  res.json({
    history: mockTrend,
    latest: mockTrend[mockTrend.length - 1]
  })
})

router.get('/financial/cash-flow', (_req, res) => {
  res.json({
    entries: mockTrend.map((point) => ({
      date: point.date,
      inflow: point.inflow,
      outflow: point.outflow,
      net: point.inflow - point.outflow
    }))
  })
})

router.get('/mcp/status', (_req, res) => {
  res.json({
    connected: false,
    message: 'MCP integration disabled in mock API router'
  })
})

export default router
