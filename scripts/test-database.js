import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('Testing database connectivity...');

  try {
    // Test connection
    await prisma.$connect();
    console.log('SUCCESS: Connected to database');

    // List all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('\nDatabase tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    // Check if EnterpriseCashCoverage table exists
    const cashCoverageExists = tables.some(t => t.table_name === 'EnterpriseCashCoverage');
    console.log(`\nEnterpriseCashCoverage table exists: ${cashCoverageExists}`);

    // Test a simple query on EnterpriseCashCoverage
    if (cashCoverageExists) {
      const count = await prisma.enterpriseCashCoverage.count();
      console.log(`EnterpriseCashCoverage record count: ${count}`);
    }

    // Check other key tables
    const keyTables = [
      'User',
      'WorkingCapitalRecord',
      'CashFlowRecord',
      'OrderProjectionRecord',
      'WhatIfScenario',
      'Dashboard',
      'Widget'
    ];

    console.log('\nKey table counts:');
    for (const tableName of keyTables) {
      try {
        const model = tableName.charAt(0).toLowerCase() + tableName.slice(1);
        if (prisma[model]) {
          const count = await prisma[model].count();
          console.log(`  ${tableName}: ${count} records`);
        }
      } catch (error) {
        console.log(`  ${tableName}: Not found or error`);
      }
    }

    console.log('\nDatabase test completed successfully!');

  } catch (error) {
    console.error('Database test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);