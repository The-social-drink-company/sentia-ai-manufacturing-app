// Prisma Client with Railway environment support
import { PrismaClient } from '@prisma/client';

// Create database URL with Railway environment priority
function getDatabaseUrl() {
  // Priority 1: Railway provides DATABASE_URL directly
  if (process.env.DATABASE_URL) {
    console.log('✅ Using DATABASE_URL from environment');
    return process.env.DATABASE_URL;
  }
  
  // Priority 2: Development/fallback URL
  if (process.env.DEV_DATABASE_URL) {
    console.log('⚠️  Using DEV_DATABASE_URL as fallback');
    return process.env.DEV_DATABASE_URL;
  }
  
  // No fallback - return a dummy URL to prevent startup failure
  console.error('❌ No database URL found in environment variables');
  console.log('⚠️  Using dummy database URL - application will run but database features will not work');
  return 'postgresql://dummy:dummy@localhost:5432/dummy?sslmode=disable';
}

const databaseUrl = getDatabaseUrl();
console.log('Database connection configured:', databaseUrl.substring(0, 50) + '...');

// Create Prisma client with error handling
let prisma;

try {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty'
  });

  // Test connection stability on startup
  await prisma.$connect();
  
  console.log('✅ Prisma client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Prisma client:', error);
  
  // Create a mock Prisma client for graceful degradation
  prisma = {
    user: {
      findUnique: async () => null,
      findMany: async () => [],
      create: async () => ({ id: 'mock', email: 'mock@example.com' }),
      update: async () => ({ id: 'mock', email: 'mock@example.com' }),
      delete: async () => ({ id: 'mock', email: 'mock@example.com' })
    },
    $disconnect: async () => console.log('Mock Prisma disconnect')
  };
  console.log('⚠️  Using mock Prisma client for graceful degradation');
}

// Test database connection on startup
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}

// Export both the client and connection test
export { prisma, testDatabaseConnection };
export default prisma;