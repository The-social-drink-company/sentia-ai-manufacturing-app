/**
 * ExportGenerator Service
 *
 * Generates exports in multiple formats: CSV, Excel, PDF, JSON
 * Supports filtering, sorting, pagination, and custom formatting
 *
 * @module services/import/ExportGenerator
 */

const fs = require('fs').promises
const path = require('path')
const { createObjectCsvWriter } = require('csv-writer')
const ExcelJS = require('exceljs')
const PDFDocument = require('pdfkit')
const { logAudit } = require('../audit/AuditLogger')
const { EXPORT_ACTIONS, STATUS, SEVERITY } = require('../audit/AuditCategories')
const { transformForExport } = require('./DataTransformer')

// ============================================================================
// Constants
// ============================================================================

const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'xlsx',
  PDF: 'pdf',
  JSON: 'json',
}

const DEFAULT_OPTIONS = {
  includeHeaders: true,
  dateFormat: 'ISO',
  numberFormat: { decimals: 2 },
  encoding: 'utf8',
  bom: false, // Byte Order Mark for UTF-8
}

// Ensure exports directory exists
const EXPORTS_DIR = path.join(__dirname, '../../../exports')

// ============================================================================
// CSV Export
// ============================================================================

/**
 * Generate CSV export
 */
async function generateCSV(data, options = {}) {
  const { filename, headers, delimiter = ',', encoding = 'utf8', bom = false } = options

  if (!data || data.length === 0) {
    throw new Error('No data provided for CSV export')
  }

  // Ensure exports directory exists
  await fs.mkdir(EXPORTS_DIR, { recursive: true })

  const filepath = path.join(EXPORTS_DIR, filename)

  // Determine headers from data if not provided
  const csvHeaders =
    headers ||
    Object.keys(data[0]).map(key => ({
      id: key,
      title: key,
    }))

  // Create CSV writer
  const csvWriter = createObjectCsvWriter({
    path: filepath,
    header: csvHeaders,
    fieldDelimiter: delimiter,
    encoding,
    append: false,
  })

  // Write data
  await csvWriter.writeRecords(data)

  // Add BOM for UTF-8 if needed (helps Excel recognize UTF-8)
  if (bom && encoding === 'utf8') {
    const content = await fs.readFile(filepath, 'utf8')
    await fs.writeFile(filepath, '\ufeff' + content, 'utf8')
  }

  const stats = await fs.stat(filepath)

  return {
    format: EXPORT_FORMATS.CSV,
    filepath,
    filename,
    size: stats.size,
    rowCount: data.length,
    encoding,
  }
}

// ============================================================================
// Excel Export
// ============================================================================

/**
 * Generate Excel export
 */
async function generateExcel(data, options = {}) {
  const {
    filename,
    sheetName = 'Sheet1',
    headers,
    includeHeaders = true,
    autoFilter = true,
    freezeHeader = true,
    columnWidths = {},
    styles = {},
  } = options

  if (!data || data.length === 0) {
    throw new Error('No data provided for Excel export')
  }

  // Ensure exports directory exists
  await fs.mkdir(EXPORTS_DIR, { recursive: true })

  const filepath = path.join(EXPORTS_DIR, filename)

  // Create workbook
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Sentia AI Manufacturing Dashboard'
  workbook.created = new Date()

  // Add worksheet
  const worksheet = workbook.addWorksheet(sheetName)

  // Determine columns from data if not provided
  const columns =
    headers ||
    Object.keys(data[0]).map(key => ({
      header: key,
      key,
      width: columnWidths[key] || 15,
    }))

  worksheet.columns = columns

  // Apply header styles
  if (includeHeaders) {
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 20
  }

  // Add data rows
  data.forEach(row => {
    const excelRow = worksheet.addRow(row)

    // Apply custom styles if provided
    if (styles.row) {
      excelRow.eachCell(cell => {
        Object.assign(cell, styles.row)
      })
    }
  })

  // Apply auto-filter
  if (autoFilter && includeHeaders) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length },
    }
  }

  // Freeze header row
  if (freezeHeader && includeHeaders) {
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  }

  // Apply borders to all cells
  worksheet.eachRow(row => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      }
    })
  })

  // Write to file
  await workbook.xlsx.writeFile(filepath)

  const stats = await fs.stat(filepath)

  return {
    format: EXPORT_FORMATS.EXCEL,
    filepath,
    filename,
    size: stats.size,
    rowCount: data.length,
    sheetName,
  }
}

// ============================================================================
// PDF Export
// ============================================================================

/**
 * Generate PDF export
 */
async function generatePDF(data, options = {}) {
  const {
    filename,
    title = 'Export Report',
    headers,
    includeHeaders = true,
    orientation = 'landscape', // landscape or portrait
    pageSize = 'A4',
    fontSize = 10,
    includeFooter = true,
  } = options

  if (!data || data.length === 0) {
    throw new Error('No data provided for PDF export')
  }

  // Ensure exports directory exists
  await fs.mkdir(EXPORTS_DIR, { recursive: true })

  const filepath = path.join(EXPORTS_DIR, filename)

  // Create PDF document
  const doc = new PDFDocument({
    size: pageSize,
    layout: orientation,
    margin: 50,
    info: {
      Title: title,
      Author: 'Sentia AI Manufacturing Dashboard',
      Subject: 'Data Export',
      CreationDate: new Date(),
    },
  })

  // Pipe to file
  const writeStream = require('fs').createWriteStream(filepath)
  doc.pipe(writeStream)

  // Add title
  doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' })
  doc.moveDown()

  // Add generation timestamp
  doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, {
    align: 'right',
  })
  doc.moveDown()

  // Determine columns
  const columns = headers || Object.keys(data[0])

  // Calculate column widths
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const columnWidth = pageWidth / columns.length

  // Draw table
  await drawPDFTable(doc, data, columns, columnWidth, fontSize, includeHeaders)

  // Add footer with page numbers
  if (includeFooter) {
    const pages = doc.bufferedPageRange()
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i)
      doc
        .fontSize(8)
        .text(
          `Page ${i + 1} of ${pages.count}`,
          doc.page.margins.left,
          doc.page.height - doc.page.margins.bottom + 10,
          { align: 'center' }
        )
    }
  }

  // Finalize PDF
  doc.end()

  // Wait for write to complete
  await new Promise(resolve => writeStream.on('finish', resolve))

  const stats = await fs.stat(filepath)

  return {
    format: EXPORT_FORMATS.PDF,
    filepath,
    filename,
    size: stats.size,
    rowCount: data.length,
    pageCount: doc.bufferedPageRange().count,
  }
}

/**
 * Draw table in PDF
 */
async function drawPDFTable(doc, data, columns, columnWidth, fontSize, includeHeaders) {
  const startX = doc.page.margins.left
  let startY = doc.y

  const rowHeight = fontSize + 5
  const headerHeight = rowHeight + 5

  // Draw header row
  if (includeHeaders) {
    doc.font('Helvetica-Bold').fontSize(fontSize)

    // Header background
    doc.rect(startX, startY, columnWidth * columns.length, headerHeight).fill('#4472C4')

    // Header text
    doc.fillColor('#FFFFFF')
    columns.forEach((column, i) => {
      const x = startX + i * columnWidth
      doc.text(String(column).toUpperCase(), x + 5, startY + 5, {
        width: columnWidth - 10,
        align: 'left',
      })
    })

    startY += headerHeight
    doc.fillColor('#000000')
  }

  // Draw data rows
  doc.font('Helvetica').fontSize(fontSize)

  data.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (startY + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage()
      startY = doc.page.margins.top

      // Redraw header on new page
      if (includeHeaders) {
        doc.font('Helvetica-Bold').fontSize(fontSize)
        doc.rect(startX, startY, columnWidth * columns.length, headerHeight).fill('#4472C4')
        doc.fillColor('#FFFFFF')
        columns.forEach((column, i) => {
          const x = startX + i * columnWidth
          doc.text(String(column).toUpperCase(), x + 5, startY + 5, {
            width: columnWidth - 10,
            align: 'left',
          })
        })
        startY += headerHeight
        doc.fillColor('#000000')
        doc.font('Helvetica').fontSize(fontSize)
      }
    }

    // Alternate row background
    if (rowIndex % 2 === 0) {
      doc
        .rect(startX, startY, columnWidth * columns.length, rowHeight)
        .fill('#F8F9FA')
        .fillColor('#000000')
    }

    // Row data
    columns.forEach((column, i) => {
      const x = startX + i * columnWidth
      const value = row[column]
      const displayValue = value !== null && value !== undefined ? String(value) : ''

      doc.text(displayValue, x + 5, startY + 3, {
        width: columnWidth - 10,
        height: rowHeight,
        ellipsis: true,
        align: 'left',
      })
    })

    startY += rowHeight
  })
}

// ============================================================================
// JSON Export
// ============================================================================

/**
 * Generate JSON export
 */
async function generateJSON(data, options = {}) {
  const { filename, pretty = true, encoding = 'utf8' } = options

  if (!data) {
    throw new Error('No data provided for JSON export')
  }

  // Ensure exports directory exists
  await fs.mkdir(EXPORTS_DIR, { recursive: true })

  const filepath = path.join(EXPORTS_DIR, filename)

  // Convert to JSON string
  const jsonString = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)

  // Write to file
  await fs.writeFile(filepath, jsonString, encoding)

  const stats = await fs.stat(filepath)

  return {
    format: EXPORT_FORMATS.JSON,
    filepath,
    filename,
    size: stats.size,
    rowCount: Array.isArray(data) ? data.length : 1,
    encoding,
  }
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Generate export in specified format
 */
async function generateExport(data, format, options = {}) {
  const startTime = Date.now()

  try {
    // Apply transformations if provided
    let exportData = data
    if (options.transformations) {
      exportData = await transformForExport(data, options.transformations, options)
    }

    // Apply filtering if provided
    if (options.filter) {
      exportData = applyFilter(exportData, options.filter)
    }

    // Apply sorting if provided
    if (options.sort) {
      exportData = applySort(exportData, options.sort)
    }

    // Apply pagination if provided
    if (options.limit || options.offset) {
      exportData = applyPagination(exportData, options.limit, options.offset)
    }

    // Generate export based on format
    let result

    switch (format) {
      case EXPORT_FORMATS.CSV:
        result = await generateCSV(exportData, options)
        break

      case EXPORT_FORMATS.EXCEL:
        result = await generateExcel(exportData, options)
        break

      case EXPORT_FORMATS.PDF:
        result = await generatePDF(exportData, options)
        break

      case EXPORT_FORMATS.JSON:
        result = await generateJSON(exportData, options)
        break

      default:
        throw new Error(`Unsupported export format: ${format}`)
    }

    const duration = Date.now() - startTime

    // Log audit trail
    await logAudit({
      userId: options.userId || 'SYSTEM',
      action: EXPORT_ACTIONS.DATA_EXPORTED,
      category: 'EXPORT',
      resourceType: 'FILE',
      resourceId: result.filename,
      status: STATUS.SUCCESS,
      metadata: {
        format,
        rowCount: result.rowCount,
        size: result.size,
        duration,
      },
    })

    return {
      ...result,
      success: true,
      duration,
    }
  } catch (error) {
    // Log failure
    await logAudit({
      userId: options.userId || 'SYSTEM',
      action: EXPORT_ACTIONS.DATA_EXPORTED,
      category: 'EXPORT',
      resourceType: 'FILE',
      resourceId: options.filename,
      status: STATUS.FAILURE,
      severity: SEVERITY.ERROR,
      errorMessage: error.message,
    })

    throw error
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Apply filter to data
 */
function applyFilter(data, filter) {
  if (!filter || typeof filter !== 'object') {
    return data
  }

  return data.filter(row => {
    return Object.entries(filter).every(([field, condition]) => {
      const value = row[field]

      // Simple equality
      if (typeof condition !== 'object') {
        return value === condition
      }

      // Operators: $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $contains
      if (condition.$eq !== undefined) return value === condition.$eq
      if (condition.$ne !== undefined) return value !== condition.$ne
      if (condition.$gt !== undefined) return value > condition.$gt
      if (condition.$gte !== undefined) return value >= condition.$gte
      if (condition.$lt !== undefined) return value < condition.$lt
      if (condition.$lte !== undefined) return value <= condition.$lte
      if (condition.$in !== undefined) return condition.$in.includes(value)
      if (condition.$nin !== undefined) return !condition.$nin.includes(value)
      if (condition.$contains !== undefined) {
        return String(value).toLowerCase().includes(String(condition.$contains).toLowerCase())
      }

      return true
    })
  })
}

/**
 * Apply sorting to data
 */
function applySort(data, sort) {
  if (!sort) return data

  // Clone to avoid mutating original
  const sortedData = [...data]

  // sort can be:
  // 1. String: "field" (ascending) or "-field" (descending)
  // 2. Object: { field: 'asc' | 'desc' }
  // 3. Array: [{ field: 'asc' }, { field2: 'desc' }]

  if (typeof sort === 'string') {
    const descending = sort.startsWith('-')
    const field = descending ? sort.slice(1) : sort

    sortedData.sort((a, b) => {
      const aVal = a[field]
      const bVal = b[field]
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      return descending ? -comparison : comparison
    })
  } else if (Array.isArray(sort)) {
    // Multi-field sort
    sortedData.sort((a, b) => {
      for (const sortField of sort) {
        const field = Object.keys(sortField)[0]
        const direction = sortField[field]
        const aVal = a[field]
        const bVal = b[field]
        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0

        if (comparison !== 0) {
          return direction === 'desc' ? -comparison : comparison
        }
      }
      return 0
    })
  } else if (typeof sort === 'object') {
    const field = Object.keys(sort)[0]
    const direction = sort[field]

    sortedData.sort((a, b) => {
      const aVal = a[field]
      const bVal = b[field]
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      return direction === 'desc' ? -comparison : comparison
    })
  }

  return sortedData
}

/**
 * Apply pagination to data
 */
function applyPagination(data, limit, offset = 0) {
  if (!limit) return data

  return data.slice(offset, offset + limit)
}

/**
 * Get export file metadata
 */
async function getExportMetadata(filename) {
  const filepath = path.join(EXPORTS_DIR, filename)

  try {
    const stats = await fs.stat(filepath)
    const ext = path.extname(filename).slice(1).toLowerCase()

    return {
      filename,
      filepath,
      size: stats.size,
      format: ext,
      created: stats.birthtime,
      modified: stats.mtime,
      exists: true,
    }
  } catch (error) {
    return {
      filename,
      exists: false,
      error: error.message,
    }
  }
}

/**
 * Delete export file
 */
async function deleteExport(filename) {
  const filepath = path.join(EXPORTS_DIR, filename)

  try {
    await fs.unlink(filepath)

    await logAudit({
      userId: 'SYSTEM',
      action: EXPORT_ACTIONS.EXPORT_DELETED,
      category: 'EXPORT',
      resourceType: 'FILE',
      resourceId: filename,
      status: STATUS.SUCCESS,
    })

    return { success: true, filename }
  } catch (error) {
    await logAudit({
      userId: 'SYSTEM',
      action: EXPORT_ACTIONS.EXPORT_DELETED,
      category: 'EXPORT',
      resourceType: 'FILE',
      resourceId: filename,
      status: STATUS.FAILURE,
      errorMessage: error.message,
    })

    throw error
  }
}

/**
 * List all exports
 */
async function listExports(options = {}) {
  try {
    await fs.mkdir(EXPORTS_DIR, { recursive: true })
    const files = await fs.readdir(EXPORTS_DIR)

    const exports = await Promise.all(files.map(filename => getExportMetadata(filename)))

    // Apply filtering if provided
    let filtered = exports.filter(exp => exp.exists)

    if (options.format) {
      filtered = filtered.filter(exp => exp.format === options.format)
    }

    // Apply sorting
    if (options.sortBy === 'date') {
      filtered.sort((a, b) => b.created - a.created)
    } else if (options.sortBy === 'size') {
      filtered.sort((a, b) => b.size - a.size)
    } else {
      filtered.sort((a, b) => a.filename.localeCompare(b.filename))
    }

    return {
      exports: filtered,
      totalCount: filtered.length,
      totalSize: filtered.reduce((sum, exp) => sum + exp.size, 0),
    }
  } catch (error) {
    throw new Error(`Failed to list exports: ${error.message}`)
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  // Constants
  EXPORT_FORMATS,
  EXPORTS_DIR,

  // Core functions
  generateExport,
  generateCSV,
  generateExcel,
  generatePDF,
  generateJSON,

  // Utility functions
  applyFilter,
  applySort,
  applyPagination,
  getExportMetadata,
  deleteExport,
  listExports,
}
