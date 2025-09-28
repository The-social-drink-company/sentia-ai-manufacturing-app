import express from 'express'

const router = express.Router()

import { sendSSEEvent } from './sse.js';
import { ensureDatabaseConnection } from '../database/client.js';
import { buildTimeSeries, summarizeSeries, toCurrency, determineTrend } from '../utils/dataTransforms.js';


const router = express.Router();

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
