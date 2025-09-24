#!/usr/bin/env node
/**
 * Seed reference data (currencies, markets) required for data refresh
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedReferences() {
  try {
    console.log('Seeding reference data...\n')
    
    // Seed currencies
    console.log('Creating currencies...')
    const currencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
    ]
    
    for (const currency of currencies) {
      await prisma.currency.upsert({
        where: { code: currency.code },
        create: currency,
        update: currency
      })
      console.log(`  ✓ ${currency.code} - ${currency.name}`)
    }
    
    // Seed markets
    console.log('\nCreating markets...')
    const markets = [
      { code: 'US', name: 'United States', region: 'North America', currencyCode: 'USD' },
      { code: 'CA', name: 'Canada', region: 'North America', currencyCode: 'CAD' },
      { code: 'UK', name: 'United Kingdom', region: 'Europe', currencyCode: 'GBP' },
      { code: 'EU', name: 'European Union', region: 'Europe', currencyCode: 'EUR' },
      { code: 'AU', name: 'Australia', region: 'Oceania', currencyCode: 'AUD' }
    ]
    
    for (const market of markets) {
      await prisma.market.upsert({
        where: { code: market.code },
        create: {
          ...market,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        update: {
          ...market,
          updatedAt: new Date()
        }
      })
      console.log(`  ✓ ${market.code} - ${market.name}`)
    }
    
    console.log('\n✅ Reference data seeded successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding reference data:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

seedReferences()