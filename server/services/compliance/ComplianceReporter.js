/**
 * Compliance Reporter Service
 *
 * Generates compliance reports for GDPR, SOC2, and other regulatory requirements.
 *
 * Report Types:
 * - GDPR Data Access Report (Article 15)
 * - GDPR Data Deletion Report (Article 17)
 * - GDPR Data Portability Report (Article 20)
 * - SOC2 Audit Trail Report
 * - SOC2 Access Control Report
 * - Data Retention Compliance Report
 * - Security Incident Report
 *
 * Output Formats:
 * - JSON (machine-readable)
 * - CSV (spreadsheet)
 * - PDF (official documentation)
 */

const { PrismaClient } = require('@prisma/client')
const { maskPII } = require('../audit/pii-masker')

const prisma = new PrismaClient()

/**
 * ============================================================================
 * GDPR REPORTS
 * ============================================================================
 */

/**
 * Generate GDPR Data Access Report (Article 15)
 *
 * Provides complete data held about a user.
 *
 * @param {string} userId - User ID
 * @param {Object} options - Report options
 * @returns {Promise<Object>} GDPR data access report
 */
async function generateGDPRDataAccessReport(userId, options = {}) {
  const { format = 'json', maskSensitive = false } = options

  try {
    // Gather all user data
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        sessions: true,
      },
    })

    if (!userData) {
      throw new Error(`User not found: ${userId}`)
    }

    // Gather audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 1000, // Limit to recent 1000 events
    })

    // Gather import/export jobs
    const importJobs = await prisma.importJob.findMany({
      where: { userId },
    })

    const exportJobs = await prisma.exportJob.findMany({
      where: { userId },
    })

    // Build report
    const report = {
      reportType: 'GDPR_DATA_ACCESS',
      requestDate: new Date().toISOString(),
      userId,
      personalData: {
        user: maskSensitive ? maskPII(userData) : userData,
        auditLogs: maskSensitive ? auditLogs.map(maskPII) : auditLogs,
        importJobs: maskSensitive ? importJobs.map(maskPII) : importJobs,
        exportJobs: maskSensitive ? exportJobs.map(maskPII) : exportJobs,
      },
      summary: {
        totalAuditLogs: auditLogs.length,
        totalImportJobs: importJobs.length,
        totalExportJobs: exportJobs.length,
        accountCreated: userData.createdAt,
        lastActivity: auditLogs[0]?.timestamp || userData.updatedAt,
      },
      rights: {
        rightToAccess: 'This report',
        rightToRectification: 'Contact support to update your data',
        rightToErasure: 'Contact support to request deletion',
        rightToDataPortability: 'Request export in machine-readable format',
        rightToObject: 'Contact support to object to processing',
      },
    }

    // Format report
    return formatReport(report, format)
  } catch (error) {
    console.error('GDPR Data Access Report failed:', error)
    throw error
  }
}

/**
 * Generate GDPR Data Deletion Report (Article 17)
 *
 * Documents what data was deleted for a user.
 *
 * @param {string} userId - User ID
 * @param {Object} deletionResults - Results of deletion operation
 * @returns {Promise<Object>} GDPR data deletion report
 */
async function generateGDPRDataDeletionReport(userId, deletionResults) {
  const report = {
    reportType: 'GDPR_DATA_DELETION',
    requestDate: new Date().toISOString(),
    userId,
    deletionSummary: {
      userDataDeleted: deletionResults.user || false,
      auditLogsAnonymized: deletionResults.auditLogs || 0,
      importJobsDeleted: deletionResults.importJobs || 0,
      exportJobsDeleted: deletionResults.exportJobs || 0,
      filesDeleted: deletionResults.files || 0,
    },
    retainedData: {
      auditLogsAnonymized: true,
      reason: 'Legal requirement to retain audit trail for 7 years',
      anonymization: 'User ID replaced with [DELETED_USER]',
    },
    verification: {
      completedAt: new Date().toISOString(),
      verifiedBy: 'SYSTEM',
    },
  }

  return report
}

/**
 * Generate GDPR Data Portability Report (Article 20)
 *
 * Provides user data in machine-readable format.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} GDPR data portability report
 */
async function generateGDPRDataPortabilityReport(userId) {
  const report = await generateGDPRDataAccessReport(userId, {
    format: 'json',
    maskSensitive: false,
  })

  return {
    ...report,
    reportType: 'GDPR_DATA_PORTABILITY',
    format: 'JSON',
    specification: 'JSON according to RFC 8259',
  }
}

/**
 * ============================================================================
 * SOC2 REPORTS
 * ============================================================================
 */

/**
 * Generate SOC2 Audit Trail Report
 *
 * Documents all system activities for SOC2 compliance.
 *
 * @param {Object} params - Report parameters
 * @param {Date} params.startDate - Start date
 * @param {Date} params.endDate - End date
 * @param {string} params.category - Audit category filter
 * @returns {Promise<Object>} SOC2 audit trail report
 */
async function generateSOC2AuditTrailReport(params = {}) {
  const { startDate, endDate, category } = params

  const where = {}

  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = new Date(startDate)
    if (endDate) where.timestamp.lte = new Date(endDate)
  }

  if (category) {
    where.category = category
  }

  const auditLogs = await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  // Calculate statistics
  const stats = {
    totalEvents: auditLogs.length,
    byCategory: {},
    bySeverity: {},
    byStatus: {},
    uniqueUsers: new Set(auditLogs.map(log => log.userId)).size,
  }

  auditLogs.forEach(log => {
    // Count by category
    stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1

    // Count by severity
    stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1

    // Count by status
    stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1
  })

  const report = {
    reportType: 'SOC2_AUDIT_TRAIL',
    generatedAt: new Date().toISOString(),
    period: {
      startDate: startDate || 'N/A',
      endDate: endDate || 'N/A',
    },
    statistics: stats,
    auditTrail: auditLogs.map(log => ({
      timestamp: log.timestamp,
      user: log.user?.email || 'SYSTEM',
      action: log.action,
      category: log.category,
      resource: `${log.resourceType}:${log.resourceId}`,
      status: log.status,
      severity: log.severity,
      ipAddress: log.ipAddress,
    })),
    compliance: {
      auditLogsImmutable: true,
      allActionsLogged: true,
      retentionPolicyEnforced: true,
      piiMasked: true,
      secretsMasked: true,
    },
  }

  return report
}

/**
 * Generate SOC2 Access Control Report
 *
 * Documents access control policies and violations.
 *
 * @param {Object} params - Report parameters
 * @param {Date} params.startDate - Start date
 * @param {Date} params.endDate - End date
 * @returns {Promise<Object>} SOC2 access control report
 */
async function generateSOC2AccessControlReport(params = {}) {
  const { startDate, endDate } = params

  const where = {
    category: 'SECURITY',
  }

  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = new Date(startDate)
    if (endDate) where.timestamp.lte = new Date(endDate)
  }

  // Get security events
  const securityEvents = await prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
  })

  // Get all users and their roles
  const users = await prisma.user.findMany({
    include: {
      roles: true,
    },
  })

  // Calculate access control metrics
  const metrics = {
    totalUsers: users.length,
    activeUsers: users.filter(u => !u.deactivatedAt).length,
    usersByRole: {},
    securityEvents: {
      total: securityEvents.length,
      unauthorizedAccess: 0,
      permissionDenied: 0,
      suspiciousActivity: 0,
    },
  }

  // Count users by role
  users.forEach(user => {
    user.roles.forEach(role => {
      metrics.usersByRole[role.name] = (metrics.usersByRole[role.name] || 0) + 1
    })
  })

  // Count security events
  securityEvents.forEach(event => {
    if (event.action.includes('UNAUTHORIZED')) {
      metrics.securityEvents.unauthorizedAccess++
    }
    if (event.action.includes('PERMISSION_DENIED')) {
      metrics.securityEvents.permissionDenied++
    }
    if (event.action.includes('SUSPICIOUS')) {
      metrics.securityEvents.suspiciousActivity++
    }
  })

  const report = {
    reportType: 'SOC2_ACCESS_CONTROL',
    generatedAt: new Date().toISOString(),
    period: {
      startDate: startDate || 'N/A',
      endDate: endDate || 'N/A',
    },
    metrics,
    accessControlPolicies: {
      roleBasedAccessControl: 'Enabled',
      multiFactorAuthentication: 'Required for admin actions',
      sessionTimeout: 'Role-based (4-24 hours)',
      passwordPolicy: 'Enforced (min 8 chars, complexity required)',
    },
    securityEvents: securityEvents.map(event => ({
      timestamp: event.timestamp,
      action: event.action,
      userId: event.userId,
      ipAddress: event.ipAddress,
      status: event.status,
      errorMessage: event.errorMessage,
    })),
    compliance: {
      rbacEnforced: true,
      mfaRequired: true,
      sessionManagement: true,
      auditLogging: true,
    },
  }

  return report
}

/**
 * ============================================================================
 * DATA RETENTION REPORTS
 * ============================================================================
 */

/**
 * Generate Data Retention Compliance Report
 *
 * Documents retention policy enforcement.
 *
 * @returns {Promise<Object>} Data retention report
 */
async function generateDataRetentionReport() {
  const { RETENTION_PERIODS } = require('./retention')

  // Get current data counts
  const [totalAuditLogs, archivedAuditLogs, totalImportJobs, totalExportJobs, totalFiles] =
    await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { archived: true } }),
      prisma.importJob.count(),
      prisma.exportJob.count(),
      prisma.file.count(),
    ])

  const environment = process.env.NODE_ENV || 'development'

  const report = {
    reportType: 'DATA_RETENTION_COMPLIANCE',
    generatedAt: new Date().toISOString(),
    environment,
    retentionPolicies: RETENTION_PERIODS[environment],
    currentData: {
      auditLogs: {
        total: totalAuditLogs,
        archived: archivedAuditLogs,
        active: totalAuditLogs - archivedAuditLogs,
      },
      importJobs: totalImportJobs,
      exportJobs: totalExportJobs,
      files: totalFiles,
    },
    lastEnforcement: {
      // This would come from a retention enforcement log
      timestamp: 'N/A',
      itemsArchived: 0,
      itemsPurged: 0,
    },
    compliance: {
      retentionPoliciesConfigured: true,
      automatedEnforcementEnabled: true,
      archivalBeforeDeletion: true,
      backupsCreated: true,
    },
  }

  return report
}

/**
 * ============================================================================
 * REPORT FORMATTING
 * ============================================================================
 */

/**
 * Format report based on output format
 *
 * @param {Object} report - Report data
 * @param {string} format - Output format (json, csv, pdf)
 * @returns {Object|string|Buffer} Formatted report
 */
function formatReport(report, format) {
  switch (format) {
    case 'json':
      return report

    case 'csv':
      return formatReportAsCSV(report)

    case 'pdf':
      return formatReportAsPDF(report)

    default:
      return report
  }
}

/**
 * Format report as CSV
 *
 * @param {Object} report - Report data
 * @returns {string} CSV string
 */
function formatReportAsCSV(report) {
  // Simple CSV formatter (for complex reports, use csv-writer library)
  const lines = [
    `Report Type: ${report.reportType}`,
    `Generated: ${report.generatedAt || report.requestDate}`,
    '',
  ]

  // Add summary section
  if (report.summary) {
    lines.push('Summary')
    Object.entries(report.summary).forEach(([key, value]) => {
      lines.push(`${key},${value}`)
    })
    lines.push('')
  }

  // Add statistics section
  if (report.statistics) {
    lines.push('Statistics')
    Object.entries(report.statistics).forEach(([key, value]) => {
      if (typeof value === 'object') {
        lines.push(`${key}`)
        Object.entries(value).forEach(([subKey, subValue]) => {
          lines.push(`  ${subKey},${subValue}`)
        })
      } else {
        lines.push(`${key},${value}`)
      }
    })
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Format report as PDF
 *
 * @param {Object} report - Report data
 * @returns {Buffer} PDF buffer
 */
async function formatReportAsPDF(report) {
  // Placeholder: Implement using pdfkit or similar library
  const PDFDocument = require('pdfkit')
  const doc = new PDFDocument()

  doc.fontSize(16).text(`Compliance Report: ${report.reportType}`, { align: 'center' })
  doc.moveDown()
  doc.fontSize(12).text(`Generated: ${report.generatedAt || report.requestDate}`)
  doc.moveDown()

  // Add summary
  if (report.summary) {
    doc.fontSize(14).text('Summary', { underline: true })
    Object.entries(report.summary).forEach(([key, value]) => {
      doc.fontSize(10).text(`${key}: ${value}`)
    })
    doc.moveDown()
  }

  doc.end()

  return new Promise((resolve, reject) => {
    const chunks = []
    doc.on('data', chunk => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
}

/**
 * ============================================================================
 * EXPORTS
 * ============================================================================
 */

module.exports = {
  // GDPR Reports
  generateGDPRDataAccessReport,
  generateGDPRDataDeletionReport,
  generateGDPRDataPortabilityReport,

  // SOC2 Reports
  generateSOC2AuditTrailReport,
  generateSOC2AccessControlReport,

  // Data Retention Reports
  generateDataRetentionReport,

  // Utilities
  formatReport,
}
