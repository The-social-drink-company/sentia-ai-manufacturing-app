/**
 * DataTransformer Service
 *
 * Handles data transformation during import/export operations
 * Supports 10+ transformation types with validation and error handling
 *
 * @module services/import/DataTransformer
 */

// ============================================================================
// Transformation Type Registry
// ============================================================================

const TRANSFORMATION_TYPES = {
  TRIM: 'trim',
  UPPERCASE: 'uppercase',
  LOWERCASE: 'lowercase',
  CAPITALIZE: 'capitalize',
  DATE_FORMAT: 'date_format',
  NUMBER_FORMAT: 'number_format',
  BOOLEAN_CONVERT: 'boolean_convert',
  DEFAULT_VALUE: 'default_value',
  CONCATENATE: 'concatenate',
  SPLIT: 'split',
  REPLACE: 'replace',
  CUSTOM: 'custom',
};

// ============================================================================
// Transformation Functions
// ============================================================================

/**
 * Trim whitespace from string values
 */
function transformTrim(value, options = {}) {
  if (value === null || value === undefined) return value;

  const strValue = String(value);

  switch (options.type) {
    case 'start':
      return strValue.trimStart();
    case 'end':
      return strValue.trimEnd();
    default:
      return strValue.trim();
  }
}

/**
 * Convert string to uppercase
 */
function transformUppercase(value) {
  if (value === null || value === undefined) return value;
  return String(value).toUpperCase();
}

/**
 * Convert string to lowercase
 */
function transformLowercase(value) {
  if (value === null || value === undefined) return value;
  return String(value).toLowerCase();
}

/**
 * Capitalize first letter of each word
 */
function transformCapitalize(value, options = {}) {
  if (value === null || value === undefined) return value;

  const strValue = String(value);

  if (options.allWords) {
    // Capitalize first letter of each word
    return strValue.replace(/\b\w/g, (char) => char.toUpperCase());
  } else {
    // Capitalize only first letter
    return strValue.charAt(0).toUpperCase() + strValue.slice(1).toLowerCase();
  }
}

/**
 * Transform date formats
 */
function transformDateFormat(value, options = {}) {
  if (!value) return value;

  const {
    inputFormat = 'auto', // auto-detect, ISO, US (MM/DD/YYYY), UK (DD/MM/YYYY), custom
    outputFormat = 'ISO', // ISO, US, UK, timestamp, custom
    customOutputFormat,
  } = options;

  // Parse input date
  let date;

  if (inputFormat === 'auto') {
    // Try to parse various formats
    date = new Date(value);

    // If invalid, try manual parsing
    if (isNaN(date.getTime())) {
      // Try DD/MM/YYYY
      const ukMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
      if (ukMatch) {
        const [, day, month, year] = ukMatch;
        date = new Date(`${year}-${month}-${day}`);
      }
    }
  } else if (inputFormat === 'timestamp') {
    date = new Date(parseInt(value));
  } else {
    date = new Date(value);
  }

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }

  // Format output
  switch (outputFormat) {
    case 'ISO':
      return date.toISOString();

    case 'US':
      // MM/DD/YYYY
      return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;

    case 'UK':
      // DD/MM/YYYY
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

    case 'timestamp':
      return date.getTime();

    case 'custom':
      if (!customOutputFormat) {
        throw new Error('Custom output format required');
      }
      return formatDateCustom(date, customOutputFormat);

    default:
      return date.toISOString();
  }
}

/**
 * Custom date formatting
 */
function formatDateCustom(date, format) {
  const tokens = {
    YYYY: date.getFullYear(),
    YY: String(date.getFullYear()).slice(-2),
    MM: String(date.getMonth() + 1).padStart(2, '0'),
    M: date.getMonth() + 1,
    DD: String(date.getDate()).padStart(2, '0'),
    D: date.getDate(),
    HH: String(date.getHours()).padStart(2, '0'),
    H: date.getHours(),
    mm: String(date.getMinutes()).padStart(2, '0'),
    m: date.getMinutes(),
    ss: String(date.getSeconds()).padStart(2, '0'),
    s: date.getSeconds(),
  };

  let result = format;
  Object.entries(tokens).forEach(([token, value]) => {
    result = result.replace(new RegExp(token, 'g'), value);
  });

  return result;
}

/**
 * Transform number formats
 */
function transformNumberFormat(value, options = {}) {
  if (value === null || value === undefined || value === '') return value;

  const {
    decimals,
    thousandsSeparator = ',',
    decimalSeparator = '.',
    prefix = '',
    suffix = '',
    removeNonNumeric = true,
  } = options;

  // Parse number
  let numValue;

  if (typeof value === 'string') {
    // Remove non-numeric characters if needed
    let cleanValue = value;
    if (removeNonNumeric) {
      cleanValue = value.replace(/[^0-9.-]/g, '');
    }
    numValue = parseFloat(cleanValue);
  } else {
    numValue = Number(value);
  }

  if (isNaN(numValue)) {
    throw new Error(`Invalid number value: ${value}`);
  }

  // Apply decimal precision
  if (decimals !== undefined) {
    numValue = Number(numValue.toFixed(decimals));
  }

  // Format with separators
  let formatted = String(numValue);

  if (thousandsSeparator) {
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
    formatted = parts.join(decimalSeparator);
  }

  // Add prefix/suffix
  return `${prefix}${formatted}${suffix}`;
}

/**
 * Convert value to boolean
 */
function transformBooleanConvert(value, options = {}) {
  if (value === null || value === undefined) return value;

  const {
    trueValues = ['true', '1', 'yes', 'y', 'on'],
    falseValues = ['false', '0', 'no', 'n', 'off'],
    caseSensitive = false,
  } = options;

  let checkValue = String(value);

  if (!caseSensitive) {
    checkValue = checkValue.toLowerCase();
  }

  if (trueValues.includes(checkValue)) {
    return true;
  }

  if (falseValues.includes(checkValue)) {
    return false;
  }

  // If not in predefined lists, use JavaScript's truthy/falsy
  return Boolean(value);
}

/**
 * Set default value if empty
 */
function transformDefaultValue(value, options = {}) {
  const { defaultValue } = options;

  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  return value;
}

/**
 * Concatenate multiple fields
 */
function transformConcatenate(row, options = {}) {
  const {
    fields = [],
    separator = ' ',
    skipEmpty = true,
  } = options;

  const values = fields.map((field) => row[field]);

  if (skipEmpty) {
    return values.filter((v) => v !== null && v !== undefined && v !== '').join(separator);
  }

  return values.join(separator);
}

/**
 * Split string into parts
 */
function transformSplit(value, options = {}) {
  if (!value) return value;

  const {
    separator = ',',
    index, // If specified, return only this index
    trim = true,
  } = options;

  let parts = String(value).split(separator);

  if (trim) {
    parts = parts.map((part) => part.trim());
  }

  if (index !== undefined) {
    return parts[index] || null;
  }

  return parts;
}

/**
 * Replace string patterns
 */
function transformReplace(value, options = {}) {
  if (!value) return value;

  const {
    find,
    replace,
    regex = false,
    flags = 'g', // global, case-insensitive, etc.
  } = options;

  if (!find) return value;

  const strValue = String(value);

  if (regex) {
    const pattern = new RegExp(find, flags);
    return strValue.replace(pattern, replace);
  }

  return strValue.replace(new RegExp(find, 'g'), replace);
}

/**
 * Apply custom transformation function
 */
function transformCustom(value, options = {}) {
  const { function: customFn, context = {} } = options;

  if (!customFn || typeof customFn !== 'function') {
    throw new Error('Custom transformation requires a function');
  }

  return customFn(value, context);
}

// ============================================================================
// Transformation Registry
// ============================================================================

const TRANSFORMERS = {
  [TRANSFORMATION_TYPES.TRIM]: transformTrim,
  [TRANSFORMATION_TYPES.UPPERCASE]: transformUppercase,
  [TRANSFORMATION_TYPES.LOWERCASE]: transformLowercase,
  [TRANSFORMATION_TYPES.CAPITALIZE]: transformCapitalize,
  [TRANSFORMATION_TYPES.DATE_FORMAT]: transformDateFormat,
  [TRANSFORMATION_TYPES.NUMBER_FORMAT]: transformNumberFormat,
  [TRANSFORMATION_TYPES.BOOLEAN_CONVERT]: transformBooleanConvert,
  [TRANSFORMATION_TYPES.DEFAULT_VALUE]: transformDefaultValue,
  [TRANSFORMATION_TYPES.CONCATENATE]: transformConcatenate,
  [TRANSFORMATION_TYPES.SPLIT]: transformSplit,
  [TRANSFORMATION_TYPES.REPLACE]: transformReplace,
  [TRANSFORMATION_TYPES.CUSTOM]: transformCustom,
};

// ============================================================================
// Main Transformation Functions
// ============================================================================

/**
 * Apply a single transformation to a value
 */
function applyTransformation(value, transformation, row = {}) {
  const { type, options = {} } = transformation;

  if (!type) {
    throw new Error('Transformation type is required');
  }

  const transformer = TRANSFORMERS[type];

  if (!transformer) {
    throw new Error(`Unknown transformation type: ${type}`);
  }

  try {
    // Special case: concatenate needs the entire row
    if (type === TRANSFORMATION_TYPES.CONCATENATE) {
      return transformer(row, options);
    }

    return transformer(value, options);
  } catch (error) {
    throw new Error(`Transformation failed (${type}): ${error.message}`);
  }
}

/**
 * Apply multiple transformations in sequence
 */
function applyTransformations(value, transformations, row = {}) {
  let transformedValue = value;

  for (const transformation of transformations) {
    transformedValue = applyTransformation(transformedValue, transformation, row);
  }

  return transformedValue;
}

/**
 * Transform a single row of data
 */
async function transformRow(row, columnMapping, options = {}) {
  const { skipErrors = false } = options;

  const transformedRow = {};
  const errors = [];

  for (const [sourceColumn, mapping] of Object.entries(columnMapping)) {
    try {
      let value = row[sourceColumn];

      // Apply transformations if defined
      if (mapping.transformations && mapping.transformations.length > 0) {
        value = applyTransformations(value, mapping.transformations, row);
      }

      // Map to target column
      const targetColumn = mapping.targetColumn || sourceColumn;
      transformedRow[targetColumn] = value;

    } catch (error) {
      const errorDetail = {
        sourceColumn,
        targetColumn: mapping.targetColumn,
        value: row[sourceColumn],
        error: error.message,
      };

      errors.push(errorDetail);

      if (!skipErrors) {
        throw new Error(`Transformation error in column "${sourceColumn}": ${error.message}`);
      }

      // Set null if skipping errors
      transformedRow[mapping.targetColumn || sourceColumn] = null;
    }
  }

  return {
    transformedRow,
    errors,
    success: errors.length === 0,
  };
}

/**
 * Transform multiple rows in batch
 */
async function transformBatch(rows, columnMapping, options = {}) {
  const { skipErrors = false } = options;

  const results = {
    transformedRows: [],
    errors: [],
    totalRows: rows.length,
    successfulRows: 0,
    failedRows: 0,
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      const { transformedRow, errors, success } = await transformRow(row, columnMapping, options);

      results.transformedRows.push({
        rowNumber: i + 1,
        data: transformedRow,
        success,
        errors,
      });

      if (success) {
        results.successfulRows++;
      } else {
        results.failedRows++;
        results.errors.push({
          rowNumber: i + 1,
          errors,
        });
      }

    } catch (error) {
      results.failedRows++;
      results.errors.push({
        rowNumber: i + 1,
        errors: [{ error: error.message }],
      });

      if (!skipErrors) {
        throw error;
      }
    }
  }

  return results;
}

/**
 * Transform data for export
 */
async function transformForExport(data, exportMapping) {
  const transformedData = [];

  for (const row of data) {
    const transformedRow = {};

    for (const [sourceField, mapping] of Object.entries(exportMapping)) {
      let value = row[sourceField];

      // Apply transformations
      if (mapping.transformations && mapping.transformations.length > 0) {
        value = applyTransformations(value, mapping.transformations, row);
      }

      // Use export name or source field
      const exportField = mapping.exportName || sourceField;
      transformedRow[exportField] = value;
    }

    transformedData.push(transformedRow);
  }

  return transformedData;
}

/**
 * Create transformation pipeline
 */
function createTransformationPipeline(transformations) {
  return (value, row = {}) => {
    return applyTransformations(value, transformations, row);
  };
}

/**
 * Validate transformation configuration
 */
function validateTransformationConfig(transformations) {
  const errors = [];

  if (!Array.isArray(transformations)) {
    errors.push('Transformations must be an array');
    return { valid: false, errors };
  }

  transformations.forEach((transformation, index) => {
    if (!transformation.type) {
      errors.push(`Transformation at index ${index} missing type`);
    } else if (!TRANSFORMERS[transformation.type]) {
      errors.push(`Unknown transformation type at index ${index}: ${transformation.type}`);
    }

    // Type-specific validation
    if (transformation.type === TRANSFORMATION_TYPES.CONCATENATE) {
      if (!transformation.options?.fields || !Array.isArray(transformation.options.fields)) {
        errors.push(`Concatenate transformation at index ${index} requires fields array`);
      }
    }

    if (transformation.type === TRANSFORMATION_TYPES.DEFAULT_VALUE) {
      if (transformation.options?.defaultValue === undefined) {
        errors.push(`Default value transformation at index ${index} requires defaultValue`);
      }
    }

    if (transformation.type === TRANSFORMATION_TYPES.REPLACE) {
      if (!transformation.options?.find) {
        errors.push(`Replace transformation at index ${index} requires find pattern`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get available transformation types
 */
function getAvailableTransformations() {
  return Object.keys(TRANSFORMATION_TYPES).map((key) => ({
    type: TRANSFORMATION_TYPES[key],
    name: key.toLowerCase().replace(/_/g, ' '),
    description: getTransformationDescription(TRANSFORMATION_TYPES[key]),
  }));
}

/**
 * Get transformation description
 */
function getTransformationDescription(type) {
  const descriptions = {
    [TRANSFORMATION_TYPES.TRIM]: 'Remove whitespace from start/end of string',
    [TRANSFORMATION_TYPES.UPPERCASE]: 'Convert text to uppercase',
    [TRANSFORMATION_TYPES.LOWERCASE]: 'Convert text to lowercase',
    [TRANSFORMATION_TYPES.CAPITALIZE]: 'Capitalize first letter(s)',
    [TRANSFORMATION_TYPES.DATE_FORMAT]: 'Transform date to specified format',
    [TRANSFORMATION_TYPES.NUMBER_FORMAT]: 'Format numbers with separators and decimals',
    [TRANSFORMATION_TYPES.BOOLEAN_CONVERT]: 'Convert value to boolean',
    [TRANSFORMATION_TYPES.DEFAULT_VALUE]: 'Set default value if empty',
    [TRANSFORMATION_TYPES.CONCATENATE]: 'Combine multiple fields',
    [TRANSFORMATION_TYPES.SPLIT]: 'Split string into parts',
    [TRANSFORMATION_TYPES.REPLACE]: 'Find and replace text patterns',
    [TRANSFORMATION_TYPES.CUSTOM]: 'Apply custom transformation function',
  };

  return descriptions[type] || 'No description available';
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  // Constants
  TRANSFORMATION_TYPES,

  // Core functions
  applyTransformation,
  applyTransformations,
  transformRow,
  transformBatch,
  transformForExport,

  // Utility functions
  createTransformationPipeline,
  validateTransformationConfig,
  getAvailableTransformations,

  // Individual transformers (for testing)
  transformers: TRANSFORMERS,
};
