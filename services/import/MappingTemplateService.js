/**
 * Mapping Template Service - Prompt 4 Enhancement
 * Intelligent column detection, mapping templates, and field suggestions
 * 
 * Features:
 * - Smart column detection using fuzzy matching
 * - Reusable mapping templates
 * - Data type inference from sample data
 * - Multi-language column name support
 * - Template versioning and sharing
 */

import { logInfo, logWarn, logError } from '../logger.js';
import dbService from '../../src/services/db/index.js';

class MappingTemplateService {
  constructor() {
    // Predefined mappings for common column variations
    this.columnMappings = {
      products: {
        // SKU variations
        sku: [
          'sku', 'product_code', 'item_code', 'part_number', 'product_id',
          'code', 'item_number', 'product_ref', 'reference', 'artikel_nr',
          'codigo', 'référence', 'artikelnummer', 'codigo_producto'
        ],
        
        // Name variations
        name: [
          'name', 'product_name', 'item_name', 'title', 'description',
          'product_title', 'item_description', 'nom', 'nombre', 'nome',
          'produktname', 'naam', 'nazwa'
        ],
        
        // Weight variations
        weight_kg: [
          'weight', 'weight_kg', 'weight_grams', 'mass', 'peso', 'poids',
          'gewicht', 'waga', 'vikt', 'paino', 'vægt'
        ],
        
        // Dimensions
        dimensions_cm: [
          'dimensions', 'size', 'measurements', 'dimensiones', 'dimensões',
          'abmessungen', 'afmetingen', 'wymiary', 'mått'
        ],
        
        // Cost variations
        unit_cost: [
          'cost', 'unit_cost', 'purchase_cost', 'buy_price', 'wholesale_price',
          'coste', 'custo', 'kosten', 'kostnad', 'koszt', 'costo'
        ],
        
        // Price variations
        selling_price: [
          'price', 'selling_price', 'retail_price', 'sale_price', 'list_price',
          'precio', 'preço', 'preis', 'pris', 'cena', 'prezzo'
        ]
      },

      historical_sales: {
        sku: [
          'sku', 'product_code', 'item_code', 'product_id', 'item_id'
        ],
        
        sale_date: [
          'date', 'sale_date', 'order_date', 'transaction_date', 'fecha',
          'data', 'datum', 'dato', 'päivämäärä'
        ],
        
        quantity_sold: [
          'quantity', 'qty', 'amount', 'units', 'count', 'cantidad',
          'quantidade', 'menge', 'antal', 'ilość'
        ],
        
        unit_price: [
          'price', 'unit_price', 'item_price', 'selling_price', 'precio_unitario'
        ],
        
        currency: [
          'currency', 'curr', 'currency_code', 'moneda', 'moeda', 'währung'
        ],
        
        gross_revenue: [
          'revenue', 'total', 'gross_revenue', 'total_revenue', 'ingresos',
          'receita', 'umsatz', 'omsätning'
        ]
      },

      inventory_levels: {
        sku: [
          'sku', 'product_code', 'item_code', 'product_id'
        ],
        
        warehouse_location: [
          'warehouse', 'location', 'site', 'facility', 'depot', 'almacén',
          'armazém', 'lager', 'magazyn'
        ],
        
        quantity_on_hand: [
          'stock', 'inventory', 'on_hand', 'available', 'quantity', 'existencias',
          'estoque', 'bestand', 'lager'
        ],
        
        reserved_quantity: [
          'reserved', 'allocated', 'committed', 'reservado', 'reserviert'
        ]
      },

      manufacturing_data: {
        job_number: [
          'job', 'job_number', 'work_order', 'order_number', 'batch_id',
          'lote', 'auftrag', 'ordre'
        ],
        
        product_sku: [
          'sku', 'product_code', 'item_code', 'product_id'
        ],
        
        batch_number: [
          'batch', 'lot', 'batch_number', 'lot_number', 'lote', 'charge'
        ]
      }
    };

    // Common data patterns for type inference
    this.dataPatterns = {
      date: [
        /^\d{4}-\d{2}-\d{2}$/,           // YYYY-MM-DD
        /^\d{2}/\d{2}/\d{4}$/,         // MM/DD/YYYY
        /^\d{2}-\d{2}-\d{4}$/,           // DD-MM-YYYY
        /^\d{2}.\d{2}.\d{4}$/          // DD.MM.YYYY
      ],
      currency: [
        /^[A-Z]{3}$/,                    // ISO 4217 codes
        /^(GBP|EUR|USD|CAD|AUD)$/        // Common currencies
      ],
      sku: [
        /^[A-Z0-9\-_]{3,50}$/,          // Alphanumeric with separators
        /^[A-Z]{2,5}-[A-Z0-9]{3,10}$/   // Prefix pattern
      ],
      email: [
        /^[^\s@]+@[^\s@]+.[^\s@]+$/     // Basic email pattern
      ],
      phone: [
        /^+?[\d\s\-()]{10,20}$/       // Phone number pattern
      ]
    };
  }

  /**
   * Analyze uploaded file headers and suggest mappings
   */
  async analyzeFileStructure(filePath, dataType, sampleRows = 10) {
    try {
      // This would integrate with the file parser from QueueService
      // For now, we'll simulate analysis
      logInfo('Analyzing file structure', { filePath, dataType });

      // Read file headers and sample data
      const headers = await this.extractFileHeaders(filePath);
      const sampleData = await this.extractSampleData(filePath, sampleRows);

      // Generate mapping suggestions
      const mappingSuggestions = this.generateMappingSuggestions(headers, sampleData, dataType);
      
      // Infer data types
      const dataTypeInferences = this.inferDataTypes(headers, sampleData);
      
      // Check for potential issues
      const qualityIssues = this.identifyQualityIssues(headers, sampleData);

      return {
        success: true,
        analysis: {
          headers: headers,
          sampleRowCount: sampleData.length,
          mappingSuggestions: mappingSuggestions,
          dataTypeInferences: dataTypeInferences,
          qualityIssues: qualityIssues,
          confidenceScore: this.calculateMappingConfidence(mappingSuggestions)
        }
      };
    } catch (error) {
      logError('File structure analysis failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract headers from file (simplified implementation)
   */
  async extractFileHeaders(filePath) {
    // In real implementation, this would parse the actual file
    // For now, return sample headers for different data types
    const sampleHeaders = {
      products: ['Product Code', 'Item Name', 'Weight (kg)', 'Dimensions', 'Cost Price', 'Retail Price'],
      historical_sales: ['SKU', 'Sale Date', 'Quantity', 'Unit Price', 'Currency', 'Total Revenue'],
      inventory_levels: ['Item Code', 'Warehouse', 'Stock Level', 'Reserved', 'Available'],
      manufacturing_data: ['Work Order', 'Product SKU', 'Batch', 'Production Date', 'Quantity']
    };

    return sampleHeaders.products; // Default to products for demo
  }

  /**
   * Extract sample data for analysis
   */
  async extractSampleData(filePath, sampleRows) {
    // Sample data for demonstration
    return [
      {
        'Product Code': 'GABA-RED-UK-001',
        'Item Name': 'Red GABA Tea UK',
        'Weight (kg)': '0.125',
        'Dimensions': '15.0x10.0x5.0',
        'Cost Price': '3.50',
        'Retail Price': '8.99'
      },
      {
        'Product Code': 'GABA-GREEN-US-002',
        'Item Name': 'Green GABA Tea US',
        'Weight (kg)': '0.100',
        'Dimensions': '14.0x9.0x4.5',
        'Cost Price': '3.25',
        'Retail Price': '7.99'
      }
    ];
  }

  /**
   * Generate intelligent mapping suggestions using fuzzy matching
   */
  generateMappingSuggestions(headers, sampleData, dataType) {
    const suggestions = {};
    const mappings = this.columnMappings[dataType] || {};

    headers.forEach(header => {
      const normalizedHeader = this.normalizeColumnName(header);
      let bestMatch = null;
      let bestScore = 0;

      // Check each target field for best match
      Object.entries(mappings).forEach(_([targetField, _variations]) => {
        const score = this.calculateMatchScore(normalizedHeader, variations);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = targetField;
        }
      });

      // Also check sample data patterns
      if (sampleData.length > 0) {
        const sampleValues = sampleData.map(row => row[header]).filter(val => val != null);
        const dataTypeHints = this.analyzeDataPatterns(sampleValues);
        
        if (dataTypeHints.length > 0) {
          // Boost confidence if data pattern matches expected field type
          if (bestMatch && this.doesPatternMatchField(dataTypeHints[0], bestMatch)) {
            bestScore = Math.min(bestScore * 1.2, 1.0);
          }
        }
      }

      if (bestMatch && bestScore > 0.3) { // Confidence threshold
        suggestions[bestMatch] = {
          sourceColumn: header,
          confidence: Number(bestScore.toFixed(3)),
          reasoning: this.generateMappingReasoning(header, bestMatch, bestScore)
        };
      }
    });

    return suggestions;
  }

  /**
   * Normalize column names for better matching
   */
  normalizeColumnName(columnName) {
    return columnName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Calculate match score between header and known variations
   */
  calculateMatchScore(normalizedHeader, variations) {
    let maxScore = 0;

    variations.forEach(variation => {
      const normalizedVariation = this.normalizeColumnName(variation);
      
      // Exact match
      if (normalizedHeader === normalizedVariation) {
        maxScore = Math.max(maxScore, 1.0);
        return;
      }

      // Contains match
      if (normalizedHeader.includes(normalizedVariation) || normalizedVariation.includes(normalizedHeader)) {
        maxScore = Math.max(maxScore, 0.8);
        return;
      }

      // Fuzzy match using Levenshtein-like scoring
      const similarity = this.calculateStringSimilarity(normalizedHeader, normalizedVariation);
      maxScore = Math.max(maxScore, similarity);
    });

    return maxScore;
  }

  /**
   * Calculate string similarity score
   */
  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Analyze data patterns in sample values
   */
  analyzeDataPatterns(sampleValues) {
    const patterns = [];

    // Check against known patterns
    Object.entries(this.dataPatterns).forEach(_([patternType, _regexes]) => {
      const matchCount = sampleValues.filter(value => {
        if (typeof value !== 'string') return false;
        return regexes.some(regex => regex.test(value.toString()));
      }).length;

      if (matchCount > 0) {
        patterns.push({
          type: patternType,
          confidence: matchCount / sampleValues.length,
          matches: matchCount,
          total: sampleValues.length
        });
      }
    });

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Check if data pattern matches expected field type
   */
  doesPatternMatchField(dataPattern, fieldName) {
    const expectedPatterns = {
      'sale_date': 'date',
      'created_at': 'date',
      'updated_at': 'date',
      'currency': 'currency',
      'sku': 'sku',
      'email': 'email',
      'phone': 'phone'
    };

    return expectedPatterns[fieldName] === dataPattern.type;
  }

  /**
   * Generate human-readable reasoning for mapping suggestions
   */
  generateMappingReasoning(sourceColumn, targetField, score) {
    const reasons = [];

    if (score >= 0.9) {
      reasons.push('Exact or near-exact match');
    } else if (score >= 0.7) {
      reasons.push('Strong semantic match');
    } else if (score >= 0.5) {
      reasons.push('Partial keyword match');
    } else {
      reasons.push('Weak similarity match');
    }

    return reasons.join(', ');
  }

  /**
   * Calculate overall mapping confidence
   */
  calculateMappingConfidence(suggestions) {
    if (Object.keys(suggestions).length === 0) return 0;

    const totalConfidence = Object.values(suggestions)
      .reduce((sum, suggestion) => sum + suggestion.confidence, 0);
    
    return Number((totalConfidence / Object.keys(suggestions).length).toFixed(3));
  }

  /**
   * Infer data types from sample data
   */
  inferDataTypes(headers, sampleData) {
    const inferences = {};

    headers.forEach(header => {
      if (sampleData.length === 0) {
        inferences[header] = { type: 'string', confidence: 0 };
        return;
      }

      const values = sampleData.map(row => row[header]).filter(val => val != null && val !== '');
      const inference = this.inferColumnDataType(values);
      inferences[header] = inference;
    });

    return inferences;
  }

  /**
   * Infer data type for a column
   */
  inferColumnDataType(values) {
    if (values.length === 0) {
      return { type: 'string', confidence: 0 };
    }

    const typeScores = {
      integer: 0,
      number: 0,
      date: 0,
      boolean: 0,
      string: 0
    };

    values.forEach(value => {
      const strValue = value.toString().trim();

      // Integer check
      if (/^\d+$/.test(strValue)) {
        typeScores.integer += 1;
        typeScores.number += 1;
      }
      // Float check
      else if (/^\d*.\d+$/.test(strValue)) {
        typeScores.number += 1;
      }
      // Date check
      else if (this.dataPatterns.date.some(pattern => pattern.test(strValue))) {
        typeScores.date += 1;
      }
      // Boolean check
      else if (/^(true|false|yes|no|0|1)$/i.test(strValue)) {
        typeScores.boolean += 1;
      }
      // Default to string
      else {
        typeScores.string += 1;
      }
    });

    // Find type with highest score
    const maxScore = Math.max(...Object.values(typeScores));
    const inferredType = Object.entries(typeScores)
      .find(([type, score]) => score === maxScore)[0];

    return {
      type: inferredType,
      confidence: Number((maxScore / values.length).toFixed(3)),
      sampleSize: values.length
    };
  }

  /**
   * Identify potential data quality issues
   */
  identifyQualityIssues(headers, sampleData) {
    const issues = [];

    // Check for duplicate headers
    const headerCounts = {};
    headers.forEach(header => {
      headerCounts[header] = (headerCounts[header] || 0) + 1;
    });

    Object.entries(headerCounts).forEach(_([header, _count]) => {
      if (count > 1) {
        issues.push({
          type: 'duplicate_headers',
          severity: 'error',
          message: `Header "${header}" appears ${count} times`,
          header: header
        });
      }
    });

    // Check for empty columns
    headers.forEach(header => {
      const values = sampleData.map(row => row[header]).filter(val => val != null && val !== '');
      if (values.length === 0) {
        issues.push({
          type: 'empty_column',
          severity: 'warning',
          message: `Column "${header}" appears to be empty`,
          header: header
        });
      }
    });

    // Check for inconsistent data formats
    headers.forEach(header => {
      const values = sampleData.map(row => row[header]).filter(val => val != null && val !== '');
      if (values.length > 1) {
        const formats = new Set(values.map(val => this.getValueFormat(val)));
        if (formats.size > 1 && values.length >= 3) {
          issues.push({
            type: 'inconsistent_format',
            severity: 'warning',
            message: `Column "${header}" has inconsistent data formats`,
            header: header,
            formats: Array.from(formats)
          });
        }
      }
    });

    return issues;
  }

  /**
   * Get format pattern for a value
   */
  getValueFormat(value) {
    const strValue = value.toString();

    if (/^\d+$/.test(strValue)) return 'integer';
    if (/^\d*.\d+$/.test(strValue)) return 'decimal';
    if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) return 'date_iso';
    if (/^\d{2}/\d{2}/\d{4}$/.test(strValue)) return 'date_us';
    if (/^[A-Z]{3}$/.test(strValue)) return 'currency_code';
    if (strValue.includes('@')) return 'email_like';
    
    return 'text';
  }

  /**
   * Save mapping template for reuse
   */
  async saveMappingTemplate(templateData) {
    try {
      await dbService.initialize();
      const prisma = dbService.getClient();

      const template = await prisma.mapping_template.create({
        data: {
          id: crypto.randomUUID(),
          name: templateData.name,
          description: templateData.description,
          data_type: templateData.dataType,
          mapping_config: templateData.mappingConfig,
          column_patterns: templateData.columnPatterns || {},
          created_by: templateData.createdBy,
          is_public: templateData.isPublic || false,
          usage_count: 0,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      logInfo('Mapping template saved', { 
        templateId: template.id, 
        name: template.name 
      });

      return { success: true, templateId: template.id };
    } catch (error) {
      logError('Failed to save mapping template', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get available mapping templates
   */
  async getMappingTemplates(dataType, userId) {
    try {
      await dbService.initialize();
      const prisma = dbService.getClient();

      const templates = await prisma.mapping_template.findMany({
        where: {
          OR: [
            { data_type: dataType, is_public: true },
            { data_type: dataType, created_by: userId }
          ]
        },
        select: {
          id: true,
          name: true,
          description: true,
          mapping_config: true,
          usage_count: true,
          created_at: true,
          is_public: true,
          created_by: true
        },
        orderBy: [
          { usage_count: 'desc' },
          { created_at: 'desc' }
        ]
      });

      return { success: true, templates };
    } catch (error) {
      logError('Failed to get mapping templates', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply mapping template to file
   */
  async applyMappingTemplate(templateId, headers) {
    try {
      await dbService.initialize();
      const prisma = dbService.getClient();

      const template = await prisma.mapping_template.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new Error('Template not found');
      }

      // Increment usage count
      await prisma.mapping_template.update({
        where: { id: templateId },
        data: { usage_count: { increment: 1 } }
      });

      // Apply template mapping to current headers
      const appliedMapping = this.applyTemplateToHeaders(
        template.mapping_config,
        headers,
        template.column_patterns || {}
      );

      return {
        success: true,
        appliedMapping: appliedMapping,
        templateName: template.name
      };
    } catch (error) {
      logError('Failed to apply mapping template', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply template patterns to current file headers
   */
  applyTemplateToHeaders(templateMapping, currentHeaders, columnPatterns) {
    const appliedMapping = {};

    Object.entries(templateMapping).forEach(_([targetField, _templateSourceField]) => {
      // Try exact match first
      const exactMatch = currentHeaders.find(header => 
        this.normalizeColumnName(header) === this.normalizeColumnName(templateSourceField)
      );

      if (exactMatch) {
        appliedMapping[targetField] = {
          sourceColumn: exactMatch,
          confidence: 1.0,
          reasoning: 'Exact template match'
        };
        return;
      }

      // Try pattern-based matching
      if (columnPatterns[targetField]) {
        const pattern = columnPatterns[targetField];
        const patternMatch = currentHeaders.find(header => {
          const normalizedHeader = this.normalizeColumnName(header);
          return pattern.some(p => normalizedHeader.includes(p.toLowerCase()));
        });

        if (patternMatch) {
          appliedMapping[targetField] = {
            sourceColumn: patternMatch,
            confidence: 0.8,
            reasoning: 'Pattern-based template match'
          };
        }
      }
    });

    return appliedMapping;
  }
}

export default MappingTemplateService;