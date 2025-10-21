import { PrismaClient, Prisma } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const isProduction = process.env.NODE_ENV === 'production'

const prismaInstance = global.prisma
  ?? new PrismaClient({
    log: isProduction
      ? ['error']
      : [{ emit: 'stdout', level: 'error' }, { emit: 'stdout', level: 'warn' }]
  })

if (!isProduction && !global.prisma) {
  global.prisma = prismaInstance
}

if (!isProduction && process.env.DEBUG_TENANT_SQL === 'true') {
  prismaInstance.$on('query', event => {
    console.log(`[Prisma] ${event.query}`)
    if (event.params) {
      console.log(`[Prisma] params: ${event.params}`)
    }
    console.log(`[Prisma] duration: ${event.duration}ms`)
  })
}

function quoteSchema(schemaName: string): string {
  if (!schemaName) {
    throw new Error('Schema name is required for tenant operations')
  }

  const trimmed = schemaName.trim()
  if (trimmed.length === 0) {
    throw new Error('Schema name cannot be an empty string')
  }

  return '"' + trimmed.replace(/"/g, '""') + '"'
}

export type TenantTransactionClient = Prisma.TransactionClient

export const prisma = prismaInstance

export async function setTenantSearchPath(schemaName: string): Promise<void> {
  const quotedSchema = quoteSchema(schemaName)
  await prismaInstance.$executeRawUnsafe(`SET search_path TO ${quotedSchema}, public`)
}

export async function resetSearchPath(): Promise<void> {
  await prismaInstance.$executeRawUnsafe('SET search_path TO public')
}

export async function withTenantSchema<T>(
  schemaName: string,
  callback: (client: TenantTransactionClient) => Promise<T>
): Promise<T> {
  const quotedSchema = quoteSchema(schemaName)
  return prismaInstance.$transaction(async tx => {
    await tx.$executeRawUnsafe(`SET LOCAL search_path TO ${quotedSchema}, public`)
    return callback(tx)
  })
}

export async function getCurrentSearchPath(
  client: TenantTransactionClient | PrismaClient = prismaInstance
): Promise<string> {
  const result = await client.$queryRaw<Array<{ search_path: string }>>`SHOW search_path`
  return result[0]?.search_path ?? 'public'
}

export async function disconnect(): Promise<void> {
  await prismaInstance.$disconnect()
}
