/**
 * API Credentials Routes (TypeScript Multi-Tenant)
 *
 * Handles secure storage and management of third-party API credentials.
 *
 * @module server/routes/api-credentials.routes
 */

import express, { Request, Response } from 'express'
import { z } from 'zod'
import { tenantContext, requireRole, preventReadOnly, auditLog } from '../middleware/tenantContext.js'
import { asyncHandler } from '../middleware/error.middleware.js'
import { ValidationError, NotFoundError, ConflictError } from '../errors/AppError.js'
import { tenantPrisma } from '../services/tenantPrisma.js'
import { encrypt, decrypt, maskValue } from '../utils/encryption.js'
import { PaginatedResponse, ApiCredential } from '../types/api.types.js'

const router = express.Router()

// Apply tenant context to all routes
router.use(tenantContext)

// ==================== VALIDATION SCHEMAS ====================

const ApiCredentialQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  serviceName: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional()
})

const CreateApiCredentialSchema = z.object({
  serviceName: z.string().min(1).max(100),
  apiKey: z.string().min(1),
  apiSecret: z.string().optional(),
  additionalConfig: z.record(z.any()).optional(),
  isActive: z.boolean().default(true)
})

const UpdateApiCredentialSchema = z.object({
  serviceName: z.string().min(1).max(100).optional(),
  apiKey: z.string().min(1).optional(),
  apiSecret: z.string().optional().nullable(),
  additionalConfig: z.record(z.any()).optional().nullable(),
  isActive: z.boolean().optional()
})

const TestConnectionSchema = z.object({
  serviceName: z.string().min(1).max(100),
  apiKey: z.string().min(1),
  apiSecret: z.string().optional()
})

// ==================== ROUTE HANDLERS ====================

/**
 * GET /api/api-credentials
 * Get all API credentials (with masked keys)
 */
router.get('/',
  requireRole(['owner', 'admin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    // Validate query parameters
    const query = ApiCredentialQuerySchema.parse(req.query)
    const { page, limit, serviceName, isActive } = query

    // Build WHERE clause
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (serviceName) {
      conditions.push(`service_name = $${paramIndex}`)
      params.push(serviceName)
      paramIndex++
    }

    if (isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex}`)
      params.push(isActive === 'true')
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM api_credentials ${whereClause}`
    const [{ count }] = await tenantPrisma.queryRaw<{ count: string }>(
      tenantSchema,
      countQuery,
      params
    )
    const total = parseInt(count)

    // Get paginated data
    const offset = (page - 1) * limit
    const dataQuery = `
      SELECT
        id,
        service_name,
        api_key,
        api_secret,
        is_active,
        last_used,
        created_at,
        updated_at
      FROM api_credentials
      ${whereClause}
      ORDER BY service_name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    params.push(limit, offset)

    const credentials = await tenantPrisma.queryRaw<any[]>(
      tenantSchema,
      dataQuery,
      params
    )

    // Mask sensitive values
    const maskedCredentials = credentials.map(cred => ({
      ...cred,
      api_key: maskValue(decrypt(cred.api_key)),
      api_secret: cred.api_secret ? maskValue(decrypt(cred.api_secret)) : null
    }))

    const response: PaginatedResponse<any> = {
      success: true,
      data: maskedCredentials,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    }

    res.json(response)
  })
)

/**
 * POST /api/api-credentials
 * Create new API credentials
 */
router.post('/',
  requireRole(['owner', 'admin']),
  preventReadOnly,
  auditLog('api_credentials.create', 'api_credential'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    // Validate request body
    const credentialData = CreateApiCredentialSchema.parse(req.body)

    // Check for duplicate service name
    const [existing] = await tenantPrisma.queryRaw<ApiCredential[]>(
      tenantSchema,
      `SELECT id FROM api_credentials WHERE service_name = $1`,
      [credentialData.serviceName]
    )

    if (existing) {
      throw new ConflictError(`Credentials for service '${credentialData.serviceName}' already exist`)
    }

    // Encrypt sensitive values
    const encryptedApiKey = encrypt(credentialData.apiKey)
    const encryptedApiSecret = credentialData.apiSecret
      ? encrypt(credentialData.apiSecret)
      : null

    // Insert credential
    const insertQuery = `
      INSERT INTO api_credentials (
        service_name, api_key, api_secret, is_active
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, service_name, is_active, created_at, updated_at
    `
    const [credential] = await tenantPrisma.queryRaw<any[]>(
      tenantSchema,
      insertQuery,
      [
        credentialData.serviceName,
        encryptedApiKey,
        encryptedApiSecret,
        credentialData.isActive
      ]
    )

    res.status(201).json({
      success: true,
      data: {
        ...credential,
        api_key: maskValue(credentialData.apiKey),
        api_secret: credentialData.apiSecret ? maskValue(credentialData.apiSecret) : null
      },
      message: 'API credentials created successfully'
    })
  })
)

/**
 * GET /api/api-credentials/:id
 * Get single API credential (admin only, with masked keys)
 */
router.get('/:id',
  requireRole(['owner', 'admin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    const { id } = req.params

    const [credential] = await tenantPrisma.queryRaw<any[]>(
      tenantSchema,
      `SELECT * FROM api_credentials WHERE id = $1`,
      [id]
    )

    if (!credential) {
      throw new NotFoundError(`API credential not found: ${id}`)
    }

    res.json({
      success: true,
      data: {
        ...credential,
        api_key: maskValue(decrypt(credential.api_key)),
        api_secret: credential.api_secret ? maskValue(decrypt(credential.api_secret)) : null
      }
    })
  })
)

/**
 * GET /api/api-credentials/:id/reveal
 * Reveal actual API credentials (owner only)
 */
router.get('/:id/reveal',
  requireRole(['owner']),
  auditLog('api_credentials.reveal', 'api_credential'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    const { id } = req.params

    const [credential] = await tenantPrisma.queryRaw<any[]>(
      tenantSchema,
      `SELECT * FROM api_credentials WHERE id = $1`,
      [id]
    )

    if (!credential) {
      throw new NotFoundError(`API credential not found: ${id}`)
    }

    // Decrypt values
    const decryptedApiKey = decrypt(credential.api_key)
    const decryptedApiSecret = credential.api_secret
      ? decrypt(credential.api_secret)
      : null

    res.json({
      success: true,
      data: {
        ...credential,
        api_key: decryptedApiKey,
        api_secret: decryptedApiSecret
      },
      warning: 'These are sensitive credentials. Handle with care.'
    })
  })
)

/**
 * PUT /api/api-credentials/:id
 * Update API credentials
 */
router.put('/:id',
  requireRole(['owner', 'admin']),
  preventReadOnly,
  auditLog('api_credentials.update', 'api_credential'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    const { id } = req.params

    // Validate request body
    const updateData = UpdateApiCredentialSchema.parse(req.body)

    // Verify credential exists
    const [existing] = await tenantPrisma.queryRaw<ApiCredential[]>(
      tenantSchema,
      `SELECT * FROM api_credentials WHERE id = $1`,
      [id]
    )

    if (!existing) {
      throw new NotFoundError(`API credential not found: ${id}`)
    }

    // Check for service name conflict
    if (updateData.serviceName && updateData.serviceName !== existing.serviceName) {
      const [duplicate] = await tenantPrisma.queryRaw<ApiCredential[]>(
        tenantSchema,
        `SELECT id FROM api_credentials WHERE service_name = $1 AND id != $2`,
        [updateData.serviceName, id]
      )

      if (duplicate) {
        throw new ConflictError(`Credentials for service '${updateData.serviceName}' already exist`)
      }
    }

    // Build UPDATE query dynamically
    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (updateData.serviceName !== undefined) {
      updates.push(`service_name = $${paramIndex}`)
      params.push(updateData.serviceName)
      paramIndex++
    }

    if (updateData.apiKey !== undefined) {
      updates.push(`api_key = $${paramIndex}`)
      params.push(encrypt(updateData.apiKey))
      paramIndex++
    }

    if (updateData.apiSecret !== undefined) {
      updates.push(`api_secret = $${paramIndex}`)
      params.push(updateData.apiSecret ? encrypt(updateData.apiSecret) : null)
      paramIndex++
    }

    if (updateData.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`)
      params.push(updateData.isActive)
      paramIndex++
    }

    if (updates.length === 0) {
      throw new ValidationError('No valid fields to update')
    }

    updates.push(`updated_at = NOW()`)

    const updateQuery = `
      UPDATE api_credentials
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, service_name, is_active, created_at, updated_at
    `
    params.push(id)

    const [credential] = await tenantPrisma.queryRaw<any[]>(
      tenantSchema,
      updateQuery,
      params
    )

    res.json({
      success: true,
      data: credential,
      message: 'API credentials updated successfully'
    })
  })
)

/**
 * DELETE /api/api-credentials/:id
 * Delete API credentials
 */
router.delete('/:id',
  requireRole(['owner']),
  preventReadOnly,
  auditLog('api_credentials.delete', 'api_credential'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    const { id } = req.params

    // Verify credential exists
    const [credential] = await tenantPrisma.queryRaw<ApiCredential[]>(
      tenantSchema,
      `SELECT * FROM api_credentials WHERE id = $1`,
      [id]
    )

    if (!credential) {
      throw new NotFoundError(`API credential not found: ${id}`)
    }

    // Delete credential
    await tenantPrisma.executeRaw(
      tenantSchema,
      `DELETE FROM api_credentials WHERE id = $1`,
      [id]
    )

    res.json({
      success: true,
      message: 'API credentials deleted successfully'
    })
  })
)

/**
 * POST /api/api-credentials/test-connection
 * Test API credentials before saving
 */
router.post('/test-connection',
  requireRole(['owner', 'admin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { tenantSchema } = req
    if (!tenantSchema) {
      throw new ValidationError('Tenant schema not found')
    }

    // Validate request body
    const testData = TestConnectionSchema.parse(req.body)

    // In production, implement actual connection tests for each service
    // For now, return a mock success response
    const isValid = testData.apiKey && testData.apiKey.length > 10

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid API credentials',
        error: 'Connection test failed'
      })
    }

    res.json({
      success: true,
      message: 'Connection test successful',
      data: {
        serviceName: testData.serviceName,
        connectionStatus: 'active',
        testedAt: new Date().toISOString()
      }
    })
  })
)

export default router
