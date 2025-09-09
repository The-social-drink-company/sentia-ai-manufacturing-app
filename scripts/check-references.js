#!/usr/bin/env node
/**
 * Check available reference data in database
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkReferences() {
  try {
    console.log('Available Currencies:')
    const currencies = await prisma.currency.findMany({ 
      select: { code: true, name: true },
      orderBy: { code: 'asc' }
    })
    
    if (currencies.length === 0) {
      console.log('  No currencies found - need to seed database')
    } else {
      currencies.forEach(c => console.log(`  ${c.code} - ${c.name}`))
    }
    
    console.log('\nAvailable Markets:')  
    const markets = await prisma.market.findMany({ 
      select: { code: true, name: true },
      orderBy: { code: 'asc' }
    })
    
    if (markets.length === 0) {
      console.log('  No markets found - need to seed database')
    } else {
      markets.forEach(m => console.log(`  ${m.code} - ${m.name}`))
    }
    
  } catch (error) {
    console.error('Error checking references:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkReferences()