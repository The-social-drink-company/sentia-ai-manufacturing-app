#!/usr/bin/env node

/**
 * EMERGENCY MINIMAL SERVER FOR RENDER
 * Absolute minimal server for emergency deployment
 * Only serves static files and basic health check
 */

import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🚨 EMERGENCY SERVER STARTING 🚨')
console.log('Time:', new Date().toISOString())
console.log('Port:', process.env.PORT || 5000)

const app = express()
const PORT = process.env.PORT || 5000

// Minimal middleware
app.use(express.static(path.join(__dirname, 'dist')))

// Health check - most basic possible
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', time: new Date().toISOString() })
})

// Catch all - serve index.html
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).send('App not found')
  }
})

// Start server immediately
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚨 EMERGENCY SERVER RUNNING ON PORT ${PORT} 🚨`)
})

// Handle errors
process.on('uncaughtException', err => {
  console.error('Emergency server error:', err)
  process.exit(1)
})

export default app
