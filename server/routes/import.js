/**
 * Import API Routes - Multi-Tenant
 *
 * Handles file upload, column mapping, validation, and import job management
 * for tenant-specific data imports with entity limit enforcement.
 * All routes are tenant-scoped using tenantContext middleware.
 *
 * @module routes/import
 */

import express from 'express'
import multer from 'multer'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { parseFile, previewFile } from '../services/import/ImportProcessor.js'
import { validateRow, getSchemaForDataType } from '../services/import/ValidationEngine.js'
import {
  addImportJob,
  getImportJobStatus,
  cancelImportJob,
  retryImportJob,
} from '../queues/importQueue.js'
import { logAudit } from '../services/audit/AuditLogger.js'
import { IMPORT_ACTIONS, STATUS } from '../services/audit/AuditCategories.js'
import { tenantContext, preventReadOnly, checkEntityLimit } from '../middleware/tenantContext.js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = express.Router()
const prisma = new PrismaClient()

// Apply tenant middleware to all routes in this file
router.use(tenantContext)

// ============================================================================
// File Upload Configuration
// ============================================================================

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads')

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    cb(null, `import-${uniqueSuffix}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls']
    const ext = path.extname(file.originalname).toLowerCase()

    if (allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`))
    }
  },
})

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/import/upload
 * Upload file for import (tenant-scoped)
 */
router.post('/upload', preventReadOnly, upload.single('file'), async (req, res) => {
  try {
    const { dataType } = req.body
    const { tenant } = req
    const tenantId = tenant.id
    const userId = req.user?.id || 'ANONYMOUS'

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    if (!dataType) {
      return res.status(400).json({ success: false, error: 'Data type is required' })
    }

    // Determine file type
    const ext = path.extname(req.file.originalname).toLowerCase()
    const fileType = ext === '.csv' ? 'CSV' : 'EXCEL'

    // Create File record (in public schema with tenant association)
    const file = await prisma.file.create({
      data: {
        filename: req.file.originalname,
        filePath: req.file.path,
        fileType,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: userId,
        tenantId, // Associate with tenant
      },
    })

    // Parse file to get preview
    const preview = await previewFile(req.file.path, fileType, { limit: 10 })

    // Log audit trail
    await logAudit({
      tenantId,
      userId,
      action: IMPORT_ACTIONS.FILE_UPLOADED,
      category: 'IMPORT',
      resourceType: 'FILE',
      resourceId: file.id,
      status: STATUS.SUCCESS,
      metadata: {
        filename: file.filename,
        fileSize: file.fileSize,
        dataType,
        rowCount: preview.totalRows,
      },
    })

    res.json({
      success: true,
      file: {
        id: file.id,
        filename: file.filename,
        fileSize: file.fileSize,
        fileType: file.fileType,
      },
      preview: {
        columns: preview.columns,
        rows: preview.rows,
        totalRows: preview.totalRows,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        tier: tenant.subscriptionTier
      }
    })
  } catch (error) {
    console.error('File upload error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/import/preview
 * Preview uploaded file (tenant-scoped)
 */
router.post('/preview', async (req, res) => {
  try {
    const { fileId, limit = 10 } = req.body
    const { tenant } = req
    const tenantId = tenant.id

    if (!fileId) {
      return res.status(400).json({ success: false, error: 'File ID is required' })
    }

    // Get file record (tenant-scoped query)
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        tenantId, // Ensure file belongs to tenant
      },
    })

    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' })
    }

    // Preview file
    const preview = await previewFile(file.filePath, file.fileType, { limit })

    res.json({
      success: true,
      preview: {
        columns: preview.columns,
        rows: preview.rows,
        totalRows: preview.totalRows,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        tier: tenant.subscriptionTier
      }
    })
  } catch (error) {
    console.error('File preview error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/import/auto-map
 * Auto-generate column mapping (tenant-scoped)
 */
router.post('/auto-map', async (req, res) => {
  try {
    const { fileId, dataType } = req.body
    const { tenant } = req
    const tenantId = tenant.id

    if (!fileId || !dataType) {
      return res.status(400).json({ success: false, error: 'File ID and data type are required' })
    }

    // Get file record (tenant-scoped query)
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        tenantId, // Ensure file belongs to tenant
      },
    })

    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' })
    }

    // Parse file to get columns
    const preview = await previewFile(file.filePath, file.fileType, { limit: 1 })
    const sourceColumns = preview.columns

    // Get schema for data type
    const schema = getSchemaForDataType(dataType)
    const targetColumns = schema.fields.map(f => f.name)

    // Auto-map columns
    const mapping = generateAutoMapping(sourceColumns, schema.fields)

    res.json({
      success: true,
      mapping,
      sourceColumns,
      targetColumns,
      confidence: calculateMappingConfidence(mapping),
      tenant: {
        id: tenant.id,
        name: tenant.name,
        tier: tenant.subscriptionTier
      }
    })
  } catch (error) {
    console.error('Auto-mapping error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/import/validate
 * Validate import data (tenant-scoped)
 */
router.post('/validate', async (req, res) => {
  try {
    const { fileId, dataType, mapping, limit = 100 } = req.body
    const { tenant } = req
    const tenantId = tenant.id
    const userId = req.user?.id || 'ANONYMOUS'

    if (!fileId || !dataType || !mapping) {
      return res.status(400).json({ success: false, error: 'File ID, data type, and mapping are required' })
    }

    // Get file record (tenant-scoped query)
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        tenantId, // Ensure file belongs to tenant
      },
    })

    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' })
    }

    // Parse file
    const rows = await parseFile(file.filePath, file.fileType)
    const sampleRows = rows.slice(0, limit)

    // Get schema
    const schema = getSchemaForDataType(dataType)

    // Validate rows
    const validationResults = {
      totalRows: sampleRows.length,
      validRows: 0,
      invalidRows: 0,
      errors: [],
      warnings: [],
    }

    for (let i = 0; i < sampleRows.length; i++) {
      const row = sampleRows[i]

      // Map columns
      const mappedRow = {}
      for (const [sourceCol, targetCol] of Object.entries(mapping)) {
        mappedRow[targetCol] = row[sourceCol]
      }

      // Validate
      const { valid, errors, warnings } = await validateRow(mappedRow, schema)

      if (valid) {
        validationResults.validRows++
      } else {
        validationResults.invalidRows++
        validationResults.errors.push({
          rowNumber: i + 1,
          errors,
        })
      }

      if (warnings && warnings.length > 0) {
        validationResults.warnings.push({
          rowNumber: i + 1,
          warnings,
        })
      }
    }

    // Log audit trail
    await logAudit({
      tenantId,
      userId,
      action: IMPORT_ACTIONS.VALIDATION_COMPLETED,
      category: 'IMPORT',
      resourceType: 'FILE',
      resourceId: file.id,
      status: STATUS.SUCCESS,
      metadata: {
        totalRows: validationResults.totalRows,
        validRows: validationResults.validRows,
        invalidRows: validationResults.invalidRows,
      },
    })

    res.json({
      success: true,
      validation: validationResults,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        tier: tenant.subscriptionTier
      }
    })
  } catch (error) {
    console.error('Validation error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/import/start
 * Start import job (tenant-scoped with entity limit check)
 */
router.post('/start', preventReadOnly, async (req, res) => {
  try {
    const { fileId, dataType, mapping, transformations, options } = req.body
    const { tenant } = req
    const tenantId = tenant.id
    const userId = req.user?.id || 'ANONYMOUS'

    if (!fileId || !dataType || !mapping) {
      return res.status(400).json({ success: false, error: 'File ID, data type, and mapping are required' })
    }

    // Get file to check row count
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        tenantId,
      },
    })

    if (!file) {
      return res.status(404).json({ success: false, error: 'File not found' })
    }

    // Parse file to get total row count
    const rows = await parseFile(file.filePath, file.fileType)
    const importCount = rows.length

    // Check entity limits for bulk import
    // Note: This will check against tenant's subscription tier limits
    try {
      await checkEntityLimit(tenantId, dataType, importCount)
    } catch (limitError) {
      await logAudit({
        tenantId,
        userId,
        action: IMPORT_ACTIONS.IMPORT_STARTED,
        category: 'IMPORT',
        resourceType: 'IMPORT_JOB',
        status: STATUS.FAILED,
        metadata: {
          fileId,
          dataType,
          importCount,
          reason: 'entity_limit_exceeded',
          error: limitError.message,
        },
      })

      return res.status(403).json({
        success: false,
        error: 'Entity limit exceeded',
        message: limitError.message,
        importCount,
      })
    }

    // Create ImportJob record (with tenant association)
    const importJob = await prisma.importJob.create({
      data: {
        fileId,
        dataType,
        mapping,
        transformations: transformations || [],
        options: options || {},
        status: 'PENDING',
        userId,
        tenantId, // Associate with tenant
        totalRows: importCount,
      },
    })

    // Add to queue
    await addImportJob(importJob.id, userId, { ...options, tenantId })

    // Log audit trail
    await logAudit({
      tenantId,
      userId,
      action: IMPORT_ACTIONS.IMPORT_STARTED,
      category: 'IMPORT',
      resourceType: 'IMPORT_JOB',
      resourceId: importJob.id,
      status: STATUS.SUCCESS,
      metadata: {
        fileId,
        dataType,
        importCount,
      },
    })

    res.json({
      success: true,
      importJob: {
        id: importJob.id,
        status: importJob.status,
        dataType: importJob.dataType,
        totalRows: importJob.totalRows,
        createdAt: importJob.createdAt,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        tier: tenant.subscriptionTier
      }
    })
  } catch (error) {
    console.error('Start import error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/import/status/:jobId
 * Get import job status (tenant-scoped)
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params
    const { tenant } = req
    const tenantId = tenant.id

    // Get database record (tenant-scoped query)
    const importJob = await prisma.importJob.findFirst({
      where: {
        id: jobId,
        tenantId, // Ensure job belongs to tenant
      },
      include: {
        file: true,
      },
    })

    if (!importJob) {
      return res.status(404).json({ success: false, error: 'Import job not found' })
    }

    // Get queue status
    const queueStatus = await getImportJobStatus(jobId)

    res.json({
      success: true,
      importJob: {
        id: importJob.id,
        status: importJob.status,
        dataType: importJob.dataType,
        totalRows: importJob.totalRows,
        processedRows: importJob.processedRows,
        succeededRows: importJob.succeededRows,
        failedRows: importJob.failedRows,
        errors: importJob.errors,
        startedAt: importJob.startedAt,
        completedAt: importJob.completedAt,
        file: {
          filename: importJob.file.filename,
          fileSize: importJob.file.fileSize,
        },
      },
      queueStatus,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        tier: tenant.subscriptionTier
      }
    })
  } catch (error) {
    console.error('Get import status error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/import/cancel/:jobId
 * Cancel import job (tenant-scoped)
 */
router.post('/cancel/:jobId', preventReadOnly, async (req, res) => {
  try {
    const { jobId } = req.params
    const { tenant } = req
    const tenantId = tenant.id
    const userId = req.user?.id || 'ANONYMOUS'

    // Verify job belongs to tenant before cancelling
    const importJob = await prisma.importJob.findFirst({
      where: {
        id: jobId,
        tenantId,
      },
    })

    if (!importJob) {
      return res.status(404).json({ success: false, error: 'Import job not found' })
    }

    await cancelImportJob(jobId, userId)

    // Log audit trail
    await logAudit({
      tenantId,
      userId,
      action: IMPORT_ACTIONS.IMPORT_CANCELLED,
      category: 'IMPORT',
      resourceType: 'IMPORT_JOB',
      resourceId: jobId,
      status: STATUS.SUCCESS,
    })

    res.json({
      success: true,
      message: 'Import job cancelled',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        tier: tenant.subscriptionTier
      }
    })
  } catch (error) {
    console.error('Cancel import error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * POST /api/import/retry/:jobId
 * Retry failed import job (tenant-scoped)
 */
router.post('/retry/:jobId', preventReadOnly, async (req, res) => {
  try {
    const { jobId } = req.params
    const { tenant } = req
    const tenantId = tenant.id
    const userId = req.user?.id || 'ANONYMOUS'

    // Verify job belongs to tenant before retrying
    const importJob = await prisma.importJob.findFirst({
      where: {
        id: jobId,
        tenantId,
      },
    })

    if (!importJob) {
      return res.status(404).json({ success: false, error: 'Import job not found' })
    }

    await retryImportJob(jobId, userId)

    // Log audit trail
    await logAudit({
      tenantId,
      userId,
      action: IMPORT_ACTIONS.IMPORT_RETRIED,
      category: 'IMPORT',
      resourceType: 'IMPORT_JOB',
      resourceId: jobId,
      status: STATUS.SUCCESS,
    })

    res.json({
      success: true,
      message: 'Import job retried',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        tier: tenant.subscriptionTier
      }
    })
  } catch (error) {
    console.error('Retry import error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/import/jobs
 * List import jobs (tenant-scoped)
 */
router.get('/jobs', async (req, res) => {
  try {
    const { status, dataType, limit = 50, offset = 0 } = req.query
    const { tenant } = req
    const tenantId = tenant.id
    const userId = req.user?.id

    // Build tenant-scoped query
    const where = { tenantId } // Always filter by tenant
    if (status) where.status = status
    if (dataType) where.dataType = dataType
    // Optionally filter by user if not admin role
    if (userId && req.user?.role !== 'ADMIN') where.userId = userId

    const [jobs, totalCount] = await Promise.all([
      prisma.importJob.findMany({
        where,
        include: {
          file: true,
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.importJob.count({ where }),
    ])

    res.json({
      success: true,
      jobs: jobs.map(job => ({
        id: job.id,
        status: job.status,
        dataType: job.dataType,
        totalRows: job.totalRows,
        processedRows: job.processedRows,
        succeededRows: job.succeededRows,
        failedRows: job.failedRows,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        file: {
          filename: job.file.filename,
          fileSize: job.file.fileSize,
        },
      })),
      totalCount,
      limit: parseInt(limit),
      offset: parseInt(offset),
      tenant: {
        id: tenant.id,
        name: tenant.name,
        tier: tenant.subscriptionTier
      }
    })
  } catch (error) {
    console.error('List import jobs error:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate auto-mapping from source columns to target schema
 */
function generateAutoMapping(sourceColumns, targetFields) {
  const mapping = {}

  sourceColumns.forEach(sourceCol => {
    // 1. Exact match (case-insensitive)
    let match = targetFields.find(target => target.name.toLowerCase() === sourceCol.toLowerCase())

    // 2. Fuzzy match (partial match)
    if (!match) {
      match = targetFields.find(
        target =>
          sourceCol.toLowerCase().includes(target.name.toLowerCase()) ||
          target.name.toLowerCase().includes(sourceCol.toLowerCase())
      )
    }

    // 3. Alias match (common variations)
    if (!match) {
      const aliases = {
        sku: ['product_code', 'item_code', 'code'],
        name: ['product_name', 'item_name', 'title'],
        price: ['unit_price', 'cost', 'amount'],
        quantity: ['qty', 'stock', 'amount'],
        description: ['desc', 'details'],
      }

      for (const [targetName, aliasList] of Object.entries(aliases)) {
        if (aliasList.some(alias => sourceCol.toLowerCase().includes(alias))) {
          match = targetFields.find(target => target.name.toLowerCase() === targetName)
          if (match) break
        }
      }
    }

    if (match) {
      mapping[sourceCol] = match.name
    }
  })

  return mapping
}

/**
 * Calculate mapping confidence score
 */
function calculateMappingConfidence(mapping) {
  const mappedCount = Object.keys(mapping).length
  const totalCount = Object.keys(mapping).length

  if (totalCount === 0) return 0

  return Math.round((mappedCount / totalCount) * 100)
}

// ============================================================================
// Export Router
// ============================================================================

export default router
