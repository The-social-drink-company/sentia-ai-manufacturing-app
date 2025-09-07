import ExcelJS from 'exceljs';

class DataImportService {
  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  }

  // Import data from uploaded file
  async importFromFile(file, dataType, authToken) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataType', dataType);

      const response = await fetch(`${this.apiBaseUrl}/data/import/file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File import error:', error);
      throw error;
    }
  }

  // Import data from Microsoft Excel/OneDrive
  async importFromMicrosoft(microsoftAccessToken, fileId, worksheetName, dataType, authToken, options = {}) {
    try {
      const requestBody = {
        microsoftAccessToken,
        fileId,
        worksheetName,
        dataType,
        options: {
          isSharePoint: options.isSharePoint || false,
          siteId: options.siteId || null,
          skipValidation: options.skipValidation || false,
          headerRow: options.headerRow || 1,
          startRow: options.startRow || 2
        }
      };

      const response = await fetch(`${this.apiBaseUrl}/data/import/microsoft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Microsoft import failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Microsoft import error:', error);
      throw error;
    }
  }

  // Get available Microsoft files
  async getMicrosoftFiles(microsoftAccessToken, authToken, options = {}) {
    try {
      const queryParams = new URLSearchParams({
        microsoftAccessToken,
        includeSharePoint: options.includeSharePoint || false
      });

      const response = await fetch(`${this.apiBaseUrl}/data/microsoft/files?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Microsoft files: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Microsoft files:', error);
      throw error;
    }
  }

  // Get worksheets from a Microsoft Excel file
  async getMicrosoftWorksheets(microsoftAccessToken, fileId, authToken, options = {}) {
    try {
      const requestBody = {
        microsoftAccessToken,
        fileId,
        isSharePoint: options.isSharePoint || false,
        siteId: options.siteId || null
      };

      const response = await fetch(`${this.apiBaseUrl}/data/microsoft/worksheets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch worksheets: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching worksheets:', error);
      throw error;
    }
  }

  // Preview data before import
  async previewData(microsoftAccessToken, fileId, worksheetName, authToken, options = {}) {
    try {
      const requestBody = {
        microsoftAccessToken,
        fileId,
        worksheetName,
        options: {
          isSharePoint: options.isSharePoint || false,
          siteId: options.siteId || null,
          headerRow: options.headerRow || 1,
          previewRows: options.previewRows || 10
        }
      };

      const response = await fetch(`${this.apiBaseUrl}/data/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Preview failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Preview error:', error);
      throw error;
    }
  }

  // Validate data structure
  async validateDataStructure(data, dataType) {
    const validationRules = this.getValidationRules(dataType);
    
    const errors = [];
    const warnings = [];
    
    if (!Array.isArray(data) || data.length === 0) {
      errors.push('No data found to validate');
      return { isValid: false, errors, warnings };
    }

    const headers = Object.keys(data[0]);
    
    // Check required fields
    validationRules.requiredFields.forEach(field => {
      const fieldVariants = this.generateFieldVariants(field);
      const hasField = fieldVariants.some(variant => 
        headers.some(header => 
          header.toLowerCase().includes(variant.toLowerCase())
        )
      );
      
      if (!hasField) {
        errors.push(`Required field '${field}' not found. Available: ${headers.join(', ')}`);
      }
    });

    // Validate data types and ranges
    data.forEach((record, index) => {
      this.validateRecord(record, index, validationRules, warnings);
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recordCount: data.length,
      fieldCount: headers.length
    };
  }

  // Get validation rules for different data types
  getValidationRules(dataType) {
    const rules = {
      production: {
        requiredFields: ['date', 'line', 'product', 'quantity'],
        numericFields: ['quantity', 'efficiency', 'downtime'],
        dateFields: ['date', 'start_time', 'end_time'],
        ranges: {
          efficiency: [0, 100],
          quantity: [0, Number.MAX_VALUE],
          downtime: [0, 24 * 60] // Max 24 hours in minutes
        }
      },
      quality: {
        requiredFields: ['batch_id', 'test_name', 'result'],
        numericFields: ['result_value', 'specification_min', 'specification_max'],
        dateFields: ['test_date', 'completed_date'],
        statusFields: ['status', 'pass_fail'],
        validStatuses: ['pass', 'fail', 'pending', 'retest']
      },
      inventory: {
        requiredFields: ['item_name', 'sku', 'quantity'],
        numericFields: ['quantity', 'unit_price', 'reorder_point', 'max_stock'],
        ranges: {
          quantity: [0, Number.MAX_VALUE],
          unit_price: [0, Number.MAX_VALUE],
          reorder_point: [0, Number.MAX_VALUE]
        }
      },
      financial: {
        requiredFields: ['date', 'account', 'amount'],
        numericFields: ['amount', 'balance'],
        dateFields: ['date', 'due_date', 'paid_date']
      }
    };

    return rules[dataType] || rules.production;
  }

  // Generate field name variants for flexible matching
  generateFieldVariants(field) {
    const base = field.toLowerCase();
    return [
      base,
      base.replace(/\s+/g, '_'),
      base.replace(/\s+/g, ''),
      base.replace(/_/g, ' '),
      base.replace(/([A-Z])/g, ' $1').trim()
    ];
  }

  // Validate individual record
  validateRecord(record, index, rules, warnings) {
    Object.entries(record).forEach(([key, value]) => {
      const keyLower = key.toLowerCase();
      
      // Check numeric fields
      rules.numericFields?.forEach(numField => {
        if (keyLower.includes(numField.toLowerCase()) && value !== null && value !== '') {
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            warnings.push(`Row ${index + 1}: '${key}' should be numeric (got '${value}')`);
          } else if (rules.ranges && rules.ranges[numField]) {
            const [min, max] = rules.ranges[numField];
            if (numValue < min || numValue > max) {
              warnings.push(`Row ${index + 1}: '${key}' value ${numValue} outside expected range [${min}, ${max}]`);
            }
          }
        }
      });
      
      // Check date fields
      rules.dateFields?.forEach(dateField => {
        if (keyLower.includes(dateField.toLowerCase()) && value !== null && value !== '') {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            warnings.push(`Row ${index + 1}: '${key}' should be a valid date (got '${value}')`);
          }
        }
      });
      
      // Check status fields
      if (rules.validStatuses && rules.statusFields?.some(statusField => 
        keyLower.includes(statusField.toLowerCase())
      )) {
        if (value && !rules.validStatuses.includes(value.toLowerCase())) {
          warnings.push(`Row ${index + 1}: '${key}' has invalid status '${value}'. Valid options: ${rules.validStatuses.join(', ')}`);
        }
      }
    });
  }

  // Parse Excel file on client side for preview
  async parseExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data);
          
          const result = {};
          
          workbook.worksheets.forEach(worksheet => {
            const jsonData = [];
            worksheet.eachRow((row, rowNumber) => {
              jsonData.push(row.values.slice(1)); // slice(1) because ExcelJS uses 1-based indexing
            });
            
            if (jsonData.length > 0) {
              result[worksheet.name] = {
                headers: jsonData[0] || [],
                data: jsonData.slice(1).filter(row => 
                  row.some(cell => cell !== null && cell !== '')
                ),
                rowCount: jsonData.length - 1
              };
            }
          });
          
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Excel file: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Get import history
  async getImportHistory(authToken, limit = 50) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/data/import/history?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch import history: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching import history:', error);
      throw error;
    }
  }

  // Delete imported data
  async deleteImportedData(importId, authToken) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/data/import/${importId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete imported data: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting imported data:', error);
      throw error;
    }
  }
}

export default new DataImportService();