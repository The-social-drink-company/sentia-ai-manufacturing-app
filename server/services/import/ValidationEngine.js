/**
 * Validation Engine Service
 *
 * Validates imported data against schemas with comprehensive validation rules.
 *
 * Validation Types:
 * - Type validation (string, number, date, email, boolean)
 * - Required field validation
 * - Range validation (min/max)
 * - Lookup validation (foreign keys)
 * - Business rule validation
 * - Format validation (regex patterns)
 *
 * Returns detailed validation results with suggestions for fixes.
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * ============================================================================
 * MAIN VALIDATION FUNCTION
 * ============================================================================
 */

/**
 * Validate row against schema
 *
 * @param {Object} row - Row data
 * @param {Object} schema - Validation schema
 * @returns {Promise<Object>} Validation result
 */
async function validateRow(row, schema) {
  const errors = []
  const warnings = []

  for (const field of schema.fields) {
    const value = row[field.name]

    // 1. Required field validation
    if (field.required && !validateRequired(value)) {
      errors.push({
        field: field.name,
        type: 'REQUIRED',
        message: `${field.name} is required`,
        value,
      })
      continue // Skip other validations if required field is missing
    }

    // Skip further validation if field is empty and not required
    if (!value && !field.required) {
      continue
    }

    // 2. Type validation
    if (field.type && !validateType(value, field.type)) {
      errors.push({
        field: field.name,
        type: 'TYPE',
        message: `Invalid ${field.type} format`,
        value,
        suggestion: `Expected ${field.type}`,
      })
      continue
    }

    // 3. Range validation (min/max)
    if (
      (field.min !== undefined || field.max !== undefined) &&
      !validateRange(value, field.min, field.max)
    ) {
      errors.push({
        field: field.name,
        type: 'RANGE',
        message: `Value out of range`,
        value,
        expectedRange: { min: field.min, max: field.max },
      })
    }

    // 4. Format validation (regex)
    if (field.pattern && !validatePattern(value, field.pattern)) {
      errors.push({
        field: field.name,
        type: 'PATTERN',
        message: `Value does not match required pattern`,
        value,
        pattern: field.pattern,
      })
    }

    // 5. Enum validation
    if (field.enum && !validateEnum(value, field.enum)) {
      errors.push({
        field: field.name,
        type: 'ENUM',
        message: `Invalid value. Must be one of: ${field.enum.join(', ')}`,
        value,
        allowedValues: field.enum,
      })
    }

    // 6. Lookup validation (foreign key)
    if (field.lookup) {
      const lookupValid = await validateLookup(value, field.lookup)
      if (!lookupValid) {
        errors.push({
          field: field.name,
          type: 'LOOKUP',
          message: `${value} not found in ${field.lookup.table}`,
          value,
          suggestion: 'Check spelling or create record first',
        })
      }
    }

    // 7. Business rule validation
    if (field.businessRules) {
      for (const rule of field.businessRules) {
        if (!validateBusinessRule(row, rule)) {
          warnings.push({
            field: field.name,
            type: 'BUSINESS_RULE',
            message: rule.message,
            value,
            rule: rule.name,
          })
        }
      }
    }

    // 8. Length validation
    if (field.minLength || field.maxLength) {
      if (!validateLength(value, field.minLength, field.maxLength)) {
        errors.push({
          field: field.name,
          type: 'LENGTH',
          message: `Length must be between ${field.minLength || 0} and ${field.maxLength || 'unlimited'}`,
          value,
          currentLength: value?.length,
        })
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * ============================================================================
 * VALIDATION HELPERS
 * ============================================================================
 */

/**
 * Validate required field
 *
 * @param {*} value - Field value
 * @returns {boolean} True if valid
 */
function validateRequired(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && value.trim() === '') return false
  return true
}

/**
 * Validate type
 *
 * @param {*} value - Field value
 * @param {string} type - Expected type
 * @returns {boolean} True if valid
 */
function validateType(value, type) {
  switch (type.toLowerCase()) {
    case 'string':
      return typeof value === 'string'

    case 'number':
      return !isNaN(parseFloat(value)) && isFinite(value)

    case 'integer':
      return Number.isInteger(Number(value))

    case 'boolean':
      return typeof value === 'boolean' || value === 'true' || value === 'false'

    case 'date':
      return !isNaN(Date.parse(value))

    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

    case 'url':
      try {
        new URL(value)
        return true
      } catch {
        return false
      }

    case 'phone':
      return /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(value)

    default:
      return true
  }
}

/**
 * Validate range
 *
 * @param {number} value - Field value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if valid
 */
function validateRange(value, min, max) {
  const num = Number(value)

  if (isNaN(num)) return false
  if (min !== undefined && num < min) return false
  if (max !== undefined && num > max) return false

  return true
}

/**
 * Validate pattern (regex)
 *
 * @param {string} value - Field value
 * @param {string|RegExp} pattern - Regex pattern
 * @returns {boolean} True if valid
 */
function validatePattern(value, pattern) {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
  return regex.test(value)
}

/**
 * Validate enum
 *
 * @param {*} value - Field value
 * @param {Array} allowedValues - Allowed values
 * @returns {boolean} True if valid
 */
function validateEnum(value, allowedValues) {
  return allowedValues.includes(value)
}

/**
 * Validate lookup (foreign key)
 *
 * @param {*} value - Field value
 * @param {Object} lookup - Lookup configuration
 * @returns {Promise<boolean>} True if valid
 */
async function validateLookup(value, lookup) {
  try {
    const { table, field = 'id' } = lookup

    const record = await prisma[table].findFirst({
      where: {
        [field]: value,
      },
    })

    return !!record
  } catch (error) {
    console.error('Lookup validation error:', error)
    return false
  }
}

/**
 * Validate business rule
 *
 * @param {Object} row - Row data
 * @param {Object} rule - Business rule
 * @returns {boolean} True if valid
 */
function validateBusinessRule(row, rule) {
  try {
    // Execute rule function
    if (typeof rule.validate === 'function') {
      return rule.validate(row)
    }

    // Execute rule expression
    if (rule.expression) {
      // Simple expression evaluation (can be expanded)
      return eval(rule.expression)
    }

    return true
  } catch (error) {
    console.error('Business rule validation error:', error)
    return false
  }
}

/**
 * Validate length
 *
 * @param {string} value - Field value
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {boolean} True if valid
 */
function validateLength(value, minLength, maxLength) {
  const str = String(value)

  if (minLength !== undefined && str.length < minLength) return false
  if (maxLength !== undefined && str.length > maxLength) return false

  return true
}

/**
 * ============================================================================
 * BATCH VALIDATION
 * ============================================================================
 */

/**
 * Validate multiple rows
 *
 * @param {Array} rows - Rows to validate
 * @param {Object} schema - Validation schema
 * @returns {Promise<Object>} Validation results
 */
async function validateBatch(rows, schema) {
  const results = {
    totalRows: rows.length,
    validRows: 0,
    invalidRows: 0,
    results: [],
  }

  for (let i = 0; i < rows.length; i++) {
    const validation = await validateRow(rows[i], schema)

    results.results.push({
      row: i + 1,
      data: rows[i],
      ...validation,
    })

    if (validation.valid) {
      results.validRows++
    } else {
      results.invalidRows++
    }
  }

  return results
}

/**
 * ============================================================================
 * EXPORTS
 * ============================================================================
 */

module.exports = {
  validateRow,
  validateBatch,
  validateRequired,
  validateType,
  validateRange,
  validatePattern,
  validateEnum,
  validateLookup,
  validateBusinessRule,
  validateLength,
}
