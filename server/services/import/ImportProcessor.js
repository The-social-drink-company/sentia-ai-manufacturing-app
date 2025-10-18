/**
 * Import Processor Service
 *
 * Handles file parsing, validation, and data import operations.
 *
 * Features:
 * - CSV/Excel file parsing
 * - Batch processing for large files
 * - Progress tracking
 * - Error handling and recovery
 * - Transaction support
 *
 * Used by: BullMQ import-queue workers
 */

const { PrismaClient } = require('@prisma/client');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const { validateRow } = require('./ValidationEngine');
const { transformRow } = require('./DataTransformer');

const prisma = new PrismaClient();

/**
 * ============================================================================
 * FILE PARSING
 * ============================================================================
 */

/**
 * Parse CSV file
 *
 * @param {string} filePath - Path to CSV file
 * @returns {Promise<Array>} Parsed rows
 */
async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', (error) => reject(error));
  });
}

/**
 * Parse Excel file
 *
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<Array>} Parsed rows
 */
async function parseExcel(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    return rows;
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
}

/**
 * Parse file based on type
 *
 * @param {string} filePath - Path to file
 * @param {string} fileType - File type (CSV, EXCEL)
 * @returns {Promise<Array>} Parsed rows
 */
async function parseFile(filePath, fileType) {
  switch (fileType.toUpperCase()) {
    case 'CSV':
      return parseCSV(filePath);
    case 'EXCEL':
    case 'XLSX':
    case 'XLS':
      return parseExcel(filePath);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * ============================================================================
 * IMPORT PROCESSING
 * ============================================================================
 */

/**
 * Process import job
 *
 * @param {string} jobId - Import job ID
 * @param {Object} progressCallback - Progress callback function
 * @returns {Promise<Object>} Import results
 */
async function processImportJob(jobId, progressCallback) {
  const job = await prisma.importJob.findUnique({
    where: { id: jobId },
    include: { file: true },
  });

  if (!job) {
    throw new Error(`Import job not found: ${jobId}`);
  }

  // Update job status
  await prisma.importJob.update({
    where: { id: jobId },
    data: {
      status: 'IMPORTING',
      startedAt: new Date(),
    },
  });

  try {
    // Parse file
    const rows = await parseFile(job.file.filePath, job.file.fileType);

    // Get schema for validation
    const schema = getSchemaForDataType(job.dataType);

    // Process rows in batches
    const batchSize = 100;
    const results = {
      totalRows: rows.length,
      processedRows: 0,
      succeededRows: 0,
      failedRows: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      const batchResults = await processBatch(
        batch,
        job.mapping,
        job.transformations,
        schema,
        job.dataType,
        job.options
      );

      // Update results
      results.processedRows += batchResults.processed;
      results.succeededRows += batchResults.succeeded;
      results.failedRows += batchResults.failed;
      results.errors.push(...batchResults.errors);

      // Update job progress
      await prisma.importJob.update({
        where: { id: jobId },
        data: {
          processedRows: results.processedRows,
          succeededRows: results.succeededRows,
          failedRows: results.failedRows,
        },
      });

      // Report progress
      if (progressCallback) {
        progressCallback({
          jobId,
          progress: Math.floor((results.processedRows / results.totalRows) * 100),
          processedRows: results.processedRows,
          totalRows: results.totalRows,
        });
      }
    }

    // Mark job as completed
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        errors: results.errors.length > 0 ? results.errors : null,
        summary: {
          totalRows: results.totalRows,
          succeededRows: results.succeededRows,
          failedRows: results.failedRows,
        },
      },
    });

    return results;
  } catch (error) {
    // Mark job as failed
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errors: [{ error: error.message }],
      },
    });

    throw error;
  }
}

/**
 * Process batch of rows
 *
 * @param {Array} rows - Rows to process
 * @param {Object} mapping - Column mapping
 * @param {Object} transformations - Data transformations
 * @param {Object} schema - Validation schema
 * @param {string} dataType - Data type (PRODUCTS, INVENTORY, etc.)
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Batch results
 */
async function processBatch(rows, mapping, transformations, schema, dataType, options) {
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  for (const row of rows) {
    try {
      // Transform row using mapping
      const transformedRow = transformRow(row, mapping, transformations);

      // Validate row
      const validation = await validateRow(transformedRow, schema);

      if (!validation.valid) {
        if (options?.skipErrors) {
          results.failed++;
          results.errors.push({
            row: results.processed + 1,
            errors: validation.errors,
            data: transformedRow,
          });
        } else {
          throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
      } else {
        // Insert data based on type
        await insertData(dataType, transformedRow);
        results.succeeded++;
      }

      results.processed++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: results.processed + 1,
        error: error.message,
        data: row,
      });

      if (!options?.skipErrors) {
        throw error;
      }
    }
  }

  return results;
}

/**
 * ============================================================================
 * DATA INSERTION
 * ============================================================================
 */

/**
 * Insert data based on type
 *
 * @param {string} dataType - Data type
 * @param {Object} data - Data to insert
 * @returns {Promise<Object>} Inserted record
 */
async function insertData(dataType, data) {
  switch (dataType) {
    case 'PRODUCTS':
      return prisma.product.create({ data });

    case 'INVENTORY':
      return prisma.inventory.create({ data });

    case 'ORDERS':
      return prisma.order.create({ data });

    case 'CUSTOMERS':
      return prisma.customer.create({ data });

    case 'SUPPLIERS':
      return prisma.supplier.create({ data });

    default:
      throw new Error(`Unsupported data type: ${dataType}`);
  }
}

/**
 * ============================================================================
 * SCHEMA DEFINITIONS
 * ============================================================================
 */

/**
 * Get validation schema for data type
 *
 * @param {string} dataType - Data type
 * @returns {Object} Validation schema
 */
function getSchemaForDataType(dataType) {
  const schemas = {
    PRODUCTS: {
      fields: [
        { name: 'sku', type: 'string', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'price', type: 'number', required: true, min: 0 },
        { name: 'cost', type: 'number', required: false, min: 0 },
        { name: 'category', type: 'string', required: false },
        { name: 'description', type: 'string', required: false },
      ],
    },
    INVENTORY: {
      fields: [
        { name: 'sku', type: 'string', required: true },
        { name: 'quantity', type: 'number', required: true, min: 0 },
        { name: 'location', type: 'string', required: false },
        { name: 'warehouse', type: 'string', required: false },
      ],
    },
    ORDERS: {
      fields: [
        { name: 'orderNumber', type: 'string', required: true },
        { name: 'customerEmail', type: 'email', required: true },
        { name: 'total', type: 'number', required: true, min: 0 },
        { name: 'status', type: 'string', required: true },
        { name: 'orderDate', type: 'date', required: true },
      ],
    },
  };

  return schemas[dataType] || { fields: [] };
}

/**
 * ============================================================================
 * EXPORTS
 * ============================================================================
 */

module.exports = {
  parseFile,
  parseCSV,
  parseExcel,
  processImportJob,
  processBatch,
  insertData,
  getSchemaForDataType,
};
