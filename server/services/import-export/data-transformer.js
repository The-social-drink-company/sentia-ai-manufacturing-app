/**
 * Data Transformer
 * Transforms imported data to internal format and prepares export data
 */

import { logInfo, logDebug } from '../../utils/logger.js'

class DataTransformer {
  /**
   * Transform CSV data to internal format
   * @param {Array} csvData - Parsed CSV data
   * @param {Object} mapping - Field mapping configuration
   * @returns {Array} Transformed data
   */
  transformImportData(csvData, mapping) {
    logDebug(`Transforming ${csvData.length} rows with mapping`, mapping)

    return csvData.map((row, index) => {
      const transformed = {}

      for (const [internalField, externalField] of Object.entries(mapping)) {
        let value = row[externalField]

        // Apply transformations
        value = this.applyTransformations(internalField, value)

        transformed[internalField] = value
      }

      transformed._rowIndex = index + 1
      return transformed
    })
  }

  /**
   * Apply field-specific transformations
   */
  applyTransformations(field, value) {
    if (value === null || value === undefined || value === '') {
      return null
    }

    // Date transformations
    if (field.toLowerCase().includes('date') || field.toLowerCase().includes('time')) {
      return this.parseDate(value)
    }

    // Number transformations
    if (
      field.toLowerCase().includes('quantity') ||
      field.toLowerCase().includes('amount') ||
      field.toLowerCase().includes('revenue') ||
      field.toLowerCase().includes('price')
    ) {
      return this.parseNumber(value)
    }

    // Boolean transformations
    if (field.toLowerCase().includes('active') || field.toLowerCase().includes('enabled')) {
      return this.parseBoolean(value)
    }

    // String trimming
    if (typeof value === 'string') {
      return value.trim()
    }

    return value
  }

  /**
   * Parse date value
   */
  parseDate(value) {
    if (value instanceof Date) return value

    const parsed = Date.parse(value)
    return isNaN(parsed) ? null : new Date(parsed)
  }

  /**
   * Parse number value
   */
  parseNumber(value) {
    if (typeof value === 'number') return value

    // Remove currency symbols and commas
    const cleaned = String(value).replace(/[$,]/g, '')
    const parsed = parseFloat(cleaned)

    return isNaN(parsed) ? null : parsed
  }

  /**
   * Parse boolean value
   */
  parseBoolean(value) {
    if (typeof value === 'boolean') return value

    const str = String(value).toLowerCase()
    return ['true', '1', 'yes', 'y'].includes(str)
  }

  /**
   * Transform internal data for export
   * @param {Array} data - Internal data
   * @param {string} format - Export format (csv, xlsx, json)
   * @param {Object} options - Export options
   * @returns {Object} Transformed export data
   */
  transformExportData(data, format, options = {}) {
    logDebug(`Transforming ${data.length} rows for ${format} export`)

    if (format === 'json') {
      return this.transformToJSON(data, options)
    }

    if (format === 'csv' || format === 'xlsx') {
      return this.transformToTabular(data, options)
    }

    throw new Error(`Unsupported export format: ${format}`)
  }

  /**
   * Transform to JSON format
   */
  transformToJSON(data, options) {
    let transformed = data

    // Apply field filtering
    if (options.fields) {
      transformed = data.map(row => {
        const filtered = {}
        options.fields.forEach(field => {
          filtered[field] = row[field]
        })
        return filtered
      })
    }

    return {
      data: transformed,
      metadata: {
        totalRecords: transformed.length,
        exportedAt: new Date().toISOString(),
        format: 'json',
      },
    }
  }

  /**
   * Transform to tabular format (CSV/XLSX)
   */
  transformToTabular(data, options) {
    if (data.length === 0) {
      return { headers: [], rows: [] }
    }

    // Determine headers
    const headers = options.fields || Object.keys(data[0])

    // Transform rows
    const rows = data.map(row => {
      return headers.map(header => {
        let value = row[header]

        // Format dates
        if (value instanceof Date) {
          return value.toISOString().split('T')[0]
        }

        // Format nulls
        if (value === null || value === undefined) {
          return ''
        }

        // Format numbers
        if (typeof value === 'number') {
          return options.formatNumbers ? value.toLocaleString() : value
        }

        return value
      })
    })

    return { headers, rows }
  }

  /**
   * Detect column types from sample data
   * @param {Array} data - Sample data
   * @param {number} sampleSize - Number of rows to sample
   * @returns {Object} Detected column types
   */
  detectColumnTypes(data, sampleSize = 100) {
    const sample = data.slice(0, sampleSize)
    const types = {}

    if (sample.length === 0) return types

    const headers = Object.keys(sample[0])
    logInfo(
      `Detecting column types for ${headers.length} columns from ${sample.length} sample rows`
    )

    headers.forEach(header => {
      const values = sample.map(row => row[header]).filter(v => v !== null && v !== undefined)

      if (values.length === 0) {
        types[header] = 'string'
        return
      }

      // Check if all values are numbers
      const allNumbers = values.every(v => typeof v === 'number' || !isNaN(parseFloat(v)))
      if (allNumbers) {
        types[header] = 'number'
        return
      }

      // Check if all values are dates
      const allDates = values.every(v => !isNaN(Date.parse(v)))
      if (allDates) {
        types[header] = 'date'
        return
      }

      // Check if all values are booleans
      const allBooleans = values.every(v =>
        ['true', 'false', '1', '0', 'yes', 'no'].includes(String(v).toLowerCase())
      )
      if (allBooleans) {
        types[header] = 'boolean'
        return
      }

      types[header] = 'string'
    })

    logInfo('Column type detection complete', { types })
    return types
  }
}

export default DataTransformer
