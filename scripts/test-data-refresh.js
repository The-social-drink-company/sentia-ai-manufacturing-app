#!/usr/bin/env node
/**
 * Data Refresh Test Script
 * Tests and triggers comprehensive data refresh from all APIs
 */

import dataRefreshService from '../services/dataRefreshService.js'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const prisma = new PrismaClient()

async function testDataRefresh() {
  console.log('🔄 Testing Data Refresh System\n')
  
  try {
    // Show current data state
    console.log('📊 Current Data State:')
    console.log('─'.repeat(40))
    
    const currentStats = await getCurrentStats()
    displayStats('BEFORE REFRESH', currentStats)
    
    console.log('\n🚀 Starting Comprehensive Data Refresh...\n')
    
    // Trigger data refresh
    const refreshResults = await dataRefreshService.refreshAllData()
    
    console.log('✅ Data Refresh Results:')
    console.log('─'.repeat(40))
    Object.entries(refreshResults).forEach(_([service, _result]) => {
      if (service !== 'timestamp') {
        console.log(`${service.toUpperCase()}:`)
        if (result && typeof result === 'object' && !result.error) {
          Object.entries(result).forEach(_([key, _value]) => {
            console.log(`  ${key}: ${typeof value === 'number' ? value.toLocaleString() : value}`)
          })
        } else {
          console.log(`  Status: ${result?.error || 'Not configured'}`)
        }
        console.log('')
      }
    })
    
    // Show updated data state
    const updatedStats = await getCurrentStats()
    displayStats('AFTER REFRESH', updatedStats)
    
    // Compare before and after
    console.log('\n📈 Data Changes:')
    console.log('─'.repeat(40))
    const changes = compareStats(currentStats, updatedStats)
    Object.entries(changes).forEach(_([metric, _change]) => {
      const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '→'
      const color = change > 0 ? '🟢' : change < 0 ? '🔴' : '🔵'
      console.log(`${color} ${metric}: ${arrow} ${Math.abs(change).toLocaleString()}`)
    })
    
    console.log('\n✅ Data refresh test completed successfully!')
    
  } catch (error) {
    console.error('❌ Data refresh test failed:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

async function getCurrentStats() {
  const [
    totalRevenue,
    totalOrders,
    totalInventoryValue,
    totalUsers,
    avgWorkingCapital
  ] = await Promise.all([
    prisma.historicalSale.aggregate({
      _sum: { netRevenue: true }
    }),
    prisma.historicalSale.count(),
    prisma.inventoryLevel.aggregate({
      _sum: { total_value: true }
    }),
    prisma.user.count({
      where: { isActive: true }
    }),
    prisma.workingCapital.aggregate({
      _avg: { workingCapitalRequirement: true }
    })
  ])
  
  return {
    revenue: totalRevenue._sum.netRevenue || 0,
    orders: totalOrders || 0,
    inventoryValue: totalInventoryValue._sum.total_value || 0,
    users: totalUsers || 0,
    workingCapital: avgWorkingCapital._avg.workingCapitalRequirement || 0
  }
}

function displayStats(title, stats) {
  console.log(`\n${title}:`)
  console.log(`Revenue: $${stats.revenue.toLocaleString()}`)
  console.log(`Orders: ${stats.orders.toLocaleString()}`)
  console.log(`Inventory Value: $${stats.inventoryValue.toLocaleString()}`)
  console.log(`Active Users: ${stats.users}`)
  console.log(`Avg Working Capital: $${stats.workingCapital.toLocaleString()}`)
}

function compareStats(before, after) {
  return {
    'Revenue': after.revenue - before.revenue,
    'Orders': after.orders - before.orders,
    'Inventory Value': after.inventoryValue - before.inventoryValue,
    'Working Capital': after.workingCapital - before.workingCapital
  }
}

// Run the test
testDataRefresh()