import { PrismaClient } from '@prisma/client'

const globalKey = Symbol.for('sentia.prisma')

/**
 * Ensure PrismaClient is a singleton across reloads (tests, dev server).
 * Under test environment, consumers usually mock this module, so the
 * instantiated client will not be exercised.
 */
const globalCache = globalThis[globalKey] || {}

if (!globalCache.prisma) {
  const logLevels = process.env.NODE_ENV === 'development' ? ['info', 'warn', 'error'] : ['error']

  globalCache.prisma = new PrismaClient({
    log: logLevels,
  })

  if (process.env.NODE_ENV !== 'production') {
    globalThis[globalKey] = globalCache
  }
}

const prisma = globalCache.prisma

export default prisma
export { PrismaClient }
