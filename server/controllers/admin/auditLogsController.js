/**
 * Audit Logs Controller
 *
 * REST API endpoints for audit log querying and export
 *
 * Endpoints (3):
 * - GET /admin/audit-logs - List audit logs with filters
 * - GET /admin/audit-logs/:id - Get audit log details
 * - POST /admin/audit-logs/export - Export audit logs (CSV, Excel, JSON)
 *
 * @module controllers/admin/auditLogsController
 */

import AuditLogService from '../../services/admin/AuditLogService.js'
import logger from '../../utils/logger.js'

/**
 * GET /admin/audit-logs
 * List audit logs with filters and pagination
 *
 * Query params:
 * - userId: Filter by user ID
 * - action: Filter by action (CREATE, UPDATE, DELETE, VIEW, EXPORT)
 * - entityType: Filter by entity type
 * - entityId: Filter by entity ID
 * - startDate: Filter by start date (ISO 8601)
 * - endDate: Filter by end date (ISO 8601)
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 50)
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getAuditLogs(req, res) {
  try {
    const { userId, action, entityType, entityId, startDate, endDate, page, limit } = req.query

    const filters = {}
    if (userId) filters.userId = userId
    if (action) filters.action = action
    if (entityType) filters.entityType = entityType
    if (entityId) filters.entityId = entityId

    if (startDate || endDate) {
      filters.dateRange = {}
      if (startDate) filters.dateRange.start = startDate
      if (endDate) filters.dateRange.end = endDate
    }

    const options = {}
    if (page) options.page = parseInt(page, 10)
    if (limit) options.limit = parseInt(limit, 10)

    const result = await AuditLogService.getAuditLogs(filters, options)

    res.json({
      success: true,
      logs: result.logs,
      pagination: result.pagination,
    })
  } catch (error) {
    logger.error('[AuditLogsController] Failed to get audit logs:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * GET /admin/audit-logs/:id
 * Get audit log entry by ID
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function getAuditLogById(req, res) {
  try {
    const { id } = req.params

    const log = await AuditLogService.getAuditLogById(id)

    res.json({
      success: true,
      log,
    })
  } catch (error) {
    logger.error(`[AuditLogsController] Failed to get audit log ${req.params.id}:`, error)

    const statusCode = error.message.includes('not found') ? 404 : 500

    res.status(statusCode).json({
      success: false,
      error: error.message,
    })
  }
}

/**
 * POST /admin/audit-logs/export
 * Export audit logs to specified format
 *
 * Body:
 * - format: Export format ('CSV', 'EXCEL', 'JSON') - REQUIRED
 * - filters: Same filters as GET /audit-logs (optional)
 * - maxRecords: Max records to export (default: 10000)
 *
 * Response:
 * - For CSV/JSON: Plain text/JSON response with appropriate Content-Type
 * - For Excel: Binary XLSX file download
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export async function exportAuditLogs(req, res) {
  try {
    const { format, filters = {}, maxRecords } = req.body

    if (!format) {
      return res.status(400).json({
        success: false,
        error: 'Export format is required (CSV, EXCEL, or JSON)',
      })
    }

    const options = {}
    if (maxRecords) options.maxRecords = parseInt(maxRecords, 10)

    const exportResult = await AuditLogService.exportAuditLogs(format, filters, options)

    // Set headers for download
    res.setHeader('Content-Type', exportResult.contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`)

    // For Excel, send as buffer
    if (format.toUpperCase() === 'EXCEL') {
      res.send(exportResult.content)
    } else {
      // For CSV/JSON, send as text
      res.send(exportResult.content)
    }
  } catch (error) {
    logger.error('[AuditLogsController] Failed to export audit logs:', error)

    const statusCode = error.message.includes('No audit logs found') ? 404 : 500

    res.status(statusCode).json({
      success: false,
      error: error.message,
    })
  }
}
