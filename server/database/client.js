import { PrismaClient } from '@prisma/client';
import { performance } from 'node:perf_hooks';

let prisma = null;
let connecting = null;

function buildPrismaClient() {
  const logLevels = process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'];
  const connectionString = process.env.DATABASE_URL || process.env.DEV_DATABASE_URL;
  if (!connectionString) {
    console.warn('[database] DATABASE_URL not set - Prisma will use default configuration');
  }

  return new PrismaClient({
    datasources: connectionString
      ? { db: { url: connectionString } }
      : undefined,
    log: logLevels
  });
}

export function getPrismaClient() {
  if (!prisma) {
    prisma = buildPrismaClient();
  }
  return prisma;
}

export async function ensureDatabaseConnection() {
  const client = getPrismaClient();

  if (!client) {
    throw new Error('Unable to initialize Prisma client');
  }

  if (connecting) {
    return connecting;
  }

  connecting = client.$connect().then(() => client).catch((error) => {
    console.error('[database] Failed to connect to PostgreSQL', error);
    throw error;
  }).finally(() => {
    connecting = null;
  });

  return connecting;
}

export async function disconnectDatabase() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

export async function getDatabaseHealth() {
  try {
    const client = await ensureDatabaseConnection();
    const start = performance.now();
    await client.$queryRawUnsafe('SELECT 1');
    const duration = performance.now() - start;
    return { healthy: true, latencyMs: Math.round(duration) };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}
