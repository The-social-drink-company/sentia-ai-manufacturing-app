import { Client } from '@microsoft/microsoft-graph-client';
import ExcelJS from 'exceljs';
import { logDebug, logInfo, logWarn, logError } from '../src/utils/logger';


class MicrosoftGraphService {
  constructor() {
    this.graphClient = null;
  }

  // Initialize Graph client with access token
  initializeGraphClient(accessToken) {
    this.graphClient = Client.init({
      authProvider: _(done) => {
        done(null, accessToken);
      }
    });
  }

  // Get user's OneDrive files
  async getOneDriveFiles(accessToken, folderPath = '/') {
    this.initializeGraphClient(accessToken);
    
    try {
      const response = await this.graphClient
        .api('/me/drive/root/children')
        .filter("file/mimeType eq 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or file/mimeType eq 'application/vnd.ms-excel'")
        .get();
        
      return response.value.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        lastModified: file.lastModifiedDateTime,
        downloadUrl: file['@microsoft.graph.downloadUrl'],
        mimeType: file.file?.mimeType,
        webUrl: file.webUrl
      }));
    } catch (error) {
      logError('Error fetching OneDrive files:', error);
      throw new Error('Failed to fetch OneDrive files');
    }
  }

  // Get SharePoint sites accessible to user
  async getSharePointSites(accessToken) {
    this.initializeGraphClient(accessToken);
    
    try {
      const response = await this.graphClient
        .api('/sites')
        .filter("siteCollection/hostname eq 'yourorg.sharepoint.com'") // Replace with actual domain
        .get();
        
      return response.value.map(site => ({
        id: site.id,
        name: site.displayName,
        description: site.description,
        webUrl: site.webUrl,
        createdDateTime: site.createdDateTime
      }));
    } catch (error) {
      logError('Error fetching SharePoint sites:', error);
      throw new Error('Failed to fetch SharePoint sites');
    }
  }

  // Get Excel files from a specific SharePoint site
  async getSharePointExcelFiles(accessToken, siteId) {
    this.initializeGraphClient(accessToken);
    
    try {
      const response = await this.graphClient
        .api(`/sites/${siteId}/drive/root/children`)
        .filter("file/mimeType eq 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'")
        .get();
        
      return response.value.map(file => ({
        id: file.id,
        name: file.name,
        size: file.size,
        lastModified: file.lastModifiedDateTime,
        downloadUrl: file['@microsoft.graph.downloadUrl'],
        parentPath: file.parentReference?.path,
        webUrl: file.webUrl
      }));
    } catch (error) {
      logError('Error fetching SharePoint Excel files:', error);
      throw new Error('Failed to fetch SharePoint Excel files');
    }
  }

  // Download and parse Excel file data
  async downloadAndParseExcelFile(accessToken, fileId, isSharePoint = false, siteId = null) {
    this.initializeGraphClient(accessToken);
    
    try {
      let apiPath;
      if (isSharePoint && siteId) {
        apiPath = `/sites/${siteId}/drive/items/${fileId}/content`;
      } else {
        apiPath = `/me/drive/items/${fileId}/content`;
      }
      
      const fileBuffer = await this.graphClient
        .api(apiPath)
        .getStream();
        
      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of fileBuffer) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      
      // Parse Excel file
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const result = {};
      
      // Process each worksheet
      workbook.worksheets.forEach(worksheet => {
        const jsonData = [];
        _worksheet.eachRow((row, _rowNumber) => {
          jsonData.push(row.values.slice(1)); // slice(1) because ExcelJS uses 1-based indexing
        });
        
        // Skip empty sheets
        if (jsonData.length > 0) {
          result[worksheet.name] = {
            headers: jsonData[0] || [],
            data: jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''))
          };
        }
      });
      
      return result;
    } catch (error) {
      logError('Error downloading and parsing Excel file:', error);
      throw new Error('Failed to download and parse Excel file');
    }
  }

  // Get real-time Excel workbook data (for connected spreadsheets)
  async getExcelWorkbookData(accessToken, fileId, worksheetName, isSharePoint = false, siteId = null) {
    this.initializeGraphClient(accessToken);
    
    try {
      let apiPath;
      if (isSharePoint && siteId) {
        apiPath = `/sites/${siteId}/drive/items/${fileId}/workbook/worksheets/${worksheetName}/usedRange`;
      } else {
        apiPath = `/me/drive/items/${fileId}/workbook/worksheets/${worksheetName}/usedRange`;
      }
      
      const response = await this.graphClient
        .api(apiPath)
        .get();
        
      if (!response || !response.values) {
        return { headers: [], data: [] };
      }
      
      const [headers, ...data] = response.values;
      
      return {
        headers: headers || [],
        data: data.filter(row => row.some(cell => cell !== null && cell !== ''))
      };
    } catch (error) {
      logError('Error fetching Excel workbook data:', error);
      throw new Error('Failed to fetch Excel workbook data');
    }
  }

  // Get list of worksheets in an Excel file
  async getExcelWorksheets(accessToken, fileId, isSharePoint = false, siteId = null) {
    this.initializeGraphClient(accessToken);
    
    try {
      let apiPath;
      if (isSharePoint && siteId) {
        apiPath = `/sites/${siteId}/drive/items/${fileId}/workbook/worksheets`;
      } else {
        apiPath = `/me/drive/items/${fileId}/workbook/worksheets`;
      }
      
      const response = await this.graphClient
        .api(apiPath)
        .get();
        
      return response.value.map(worksheet => ({
        id: worksheet.id,
        name: worksheet.name,
        position: worksheet.position,
        visibility: worksheet.visibility
      }));
    } catch (error) {
      logError('Error fetching Excel worksheets:', error);
      throw new Error('Failed to fetch Excel worksheets');
    }
  }

  // Process manufacturing data from Excel
  processManufacturingData(excelData, dataType) {
    try {
      const processedData = [];
      
      if (!excelData.data || excelData.data.length === 0) {
        return processedData;
      }
      
      const headers = excelData.headers.map(h => h?.toString().toLowerCase().trim());
      
      excelData.data.forEach(row => {
        const record = {};
        
        _headers.forEach((header, index) => {
          if (row[index] !== null && row[index] !== undefined) {
            record[header] = row[index];
          }
        });
        
        // Only add records that have meaningful data
        if (Object.keys(record).length > 0) {
          record.importedAt = new Date().toISOString();
          record.dataType = dataType;
          processedData.push(record);
        }
      });
      
      return processedData;
    } catch (error) {
      logError('Error processing manufacturing data:', error);
      throw new Error('Failed to process manufacturing data');
    }
  }

  // Validate data structure for manufacturing
  validateManufacturingData(data, requiredFields) {
    const errors = [];
    const warnings = [];
    
    if (!Array.isArray(data) || data.length === 0) {
      errors.push('No data found to validate');
      return { isValid: false, errors, warnings };
    }
    
    // Check for required fields
    const firstRecord = data[0];
    const availableFields = Object.keys(firstRecord);
    
    requiredFields.forEach(field => {
      const fieldVariants = [
        field.toLowerCase(),
        field.toLowerCase().replace(/\s+/g, '_'),
        field.toLowerCase().replace(/\s+/g, ''),
        field.replace(/([A-Z])/g, ' $1').toLowerCase().trim()
      ];
      
      const hasField = fieldVariants.some(variant => 
        availableFields.some(available => 
          available.toLowerCase().includes(variant)
        )
      );
      
      if (!hasField) {
        errors.push(`Required field '${field}' not found. Available fields: ${availableFields.join(', ')}`);
      }
    });
    
    // Check data types and ranges for manufacturing data
    data.forEach(_(record, index) => {
      Object.entries(record).forEach(_([key, _value]) => {
        if (key.includes('efficiency') && value !== null) {
          const numValue = parseFloat(value);
          if (isNaN(numValue) || numValue < 0 || numValue > 100) {
            warnings.push(`Row ${index + 1}: Efficiency value '${value}' seems invalid (should be 0-100)`);
          }
        }
        
        if (key.includes('temperature') && value !== null) {
          const numValue = parseFloat(value);
          if (isNaN(numValue) || numValue < -50 || numValue > 200) {
            warnings.push(`Row ${index + 1}: Temperature value '${value}' seems invalid`);
          }
        }
        
        if (key.includes('quantity') && value !== null) {
          const numValue = parseFloat(value);
          if (isNaN(numValue) || numValue < 0) {
            warnings.push(`Row ${index + 1}: Quantity value '${value}' should be a positive number`);
          }
        }
      });
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recordCount: data.length,
      fieldCount: availableFields.length
    };
  }
}

export default new MicrosoftGraphService();