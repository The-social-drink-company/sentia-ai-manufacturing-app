#!/usr/bin/env node

/**
 * Clear Mock Data Script
 * Removes all mock/demo data from the database and prepares for real API integration
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearMockData() {
  try {
    console.log('🗑️  Starting mock data cleanup...');
    
    // Clear working capital mock data
    const deletedWorkingCapital = await prisma.workingCapital.deleteMany({
      where: {
        // Delete all records - these are currently mock data
      }
    });
    console.log(`✅ Cleared ${deletedWorkingCapital.count} working capital records`);
    
    // Clear other financial mock data tables if they exist
    try {
      const deletedTransactions = await prisma.transaction.deleteMany({});
      console.log(`✅ Cleared ${deletedTransactions.count} transaction records`);
    } catch (error) {
      console.log('ℹ️  No transaction table found (skipping)');
    }
    
    try {
      const deletedInventory = await prisma.inventory.deleteMany({});
      console.log(`✅ Cleared ${deletedInventory.count} inventory records`);
    } catch (error) {
      console.log('ℹ️  No inventory table found (skipping)');
    }
    
    try {
      const deletedSales = await prisma.sale.deleteMany({});
      console.log(`✅ Cleared ${deletedSales.count} sales records`);
    } catch (error) {
      console.log('ℹ️  No sales table found (skipping)');
    }
    
    console.log('🎉 Mock data cleanup completed successfully!');
    console.log('📡 Ready for real API integration');
    
  } catch (error) {
    console.error('❌ Error clearing mock data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function when script is run directly
clearMockData();

export default clearMockData;