/**
 * Mock for exceljs module (optional dependency)
 *
 * AuditLogService uses dynamic import for exceljs:
 * const ExcelJS = await import('exceljs').catch(() => null)
 *
 * This mock allows the import to succeed but returns null,
 * which causes the service to gracefully fall back to JSON export.
 */

export default null;
