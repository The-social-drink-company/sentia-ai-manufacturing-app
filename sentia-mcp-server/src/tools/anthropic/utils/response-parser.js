/**
 * Claude Response Parser
 * 
 * Advanced response processing and formatting for Claude AI outputs:
 * - Structured JSON response parsing
 * - Executive summary extraction
 * - Actionable recommendations parsing
 * - Visual data representation suggestions
 * - Export-ready format generation
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Advanced Response Parser for Business Intelligence
 */
export class ResponseParser {
  constructor() {
    this.parsingStrategies = new Map();
    this.validationRules = new Map();
    this.formatters = new Map();
    
    this.initializeParsingStrategies();
    this.initializeValidationRules();
    this.initializeFormatters();
  }

  /**
   * Initialize parsing strategies for different analysis types
   */
  initializeParsingStrategies() {
    // Financial Analysis Parsing
    this.parsingStrategies.set('financial-analysis', {
      extractStructure: (response) => this.extractFinancialStructure(response),
      validateContent: (parsed) => this.validateFinancialContent(parsed),
      enrichData: (parsed) => this.enrichFinancialData(parsed)
    });

    // Sales Performance Parsing
    this.parsingStrategies.set('sales-performance', {
      extractStructure: (response) => this.extractSalesStructure(response),
      validateContent: (parsed) => this.validateSalesContent(parsed),
      enrichData: (parsed) => this.enrichSalesData(parsed)
    });

    // Business Reports Parsing
    this.parsingStrategies.set('business-reports', {
      extractStructure: (response) => this.extractReportStructure(response),
      validateContent: (parsed) => this.validateReportContent(parsed),
      enrichData: (parsed) => this.enrichReportData(parsed)
    });

    // Inventory Optimization Parsing
    this.parsingStrategies.set('inventory-optimization', {
      extractStructure: (response) => this.extractInventoryStructure(response),
      validateContent: (parsed) => this.validateInventoryContent(parsed),
      enrichData: (parsed) => this.enrichInventoryData(parsed)
    });

    // Competitive Analysis Parsing
    this.parsingStrategies.set('competitive-analysis', {
      extractStructure: (response) => this.extractCompetitiveStructure(response),
      validateContent: (parsed) => this.validateCompetitiveContent(parsed),
      enrichData: (parsed) => this.enrichCompetitiveData(parsed)
    });

    // Strategic Planning Parsing
    this.parsingStrategies.set('strategic-planning', {
      extractStructure: (response) => this.extractStrategicStructure(response),
      validateContent: (parsed) => this.validateStrategicContent(parsed),
      enrichData: (parsed) => this.enrichStrategicData(parsed)
    });
  }

  /**
   * Initialize validation rules
   */
  initializeValidationRules() {
    this.validationRules.set('executiveSummary', {
      required: true,
      type: 'array',
      minItems: 1,
      maxItems: 5,
      itemType: 'string'
    });

    this.validationRules.set('keyInsights', {
      required: true,
      type: 'array',
      minItems: 3,
      maxItems: 10,
      itemType: 'string'
    });

    this.validationRules.set('recommendations', {
      required: true,
      type: 'array',
      minItems: 1,
      itemStructure: {
        title: 'string',
        description: 'string',
        priority: 'string',
        timeline: 'string',
        impact: 'string'
      }
    });

    this.validationRules.set('supportingData', {
      required: false,
      type: 'object',
      allowedTypes: ['metrics', 'calculations', 'trends', 'benchmarks']
    });
  }

  /**
   * Initialize output formatters
   */
  initializeFormatters() {
    this.formatters.set('executive', (data) => this.formatForExecutives(data));
    this.formatters.set('detailed', (data) => this.formatDetailed(data));
    this.formatters.set('dashboard', (data) => this.formatForDashboard(data));
    this.formatters.set('export', (data) => this.formatForExport(data));
  }

  /**
   * Parse Claude response with advanced processing
   */
  async parseResponse(response, analysisType, options = {}) {
    try {
      logger.info('Parsing Claude response', {
        analysisType,
        responseLength: response.content?.[0]?.text?.length || 0
      });

      // Extract text content
      const textContent = this.extractTextContent(response);
      
      // Parse JSON structure
      const parsedStructure = this.parseJSONStructure(textContent);
      
      // Apply analysis-specific parsing strategy
      const strategy = this.parsingStrategies.get(analysisType);
      let processedData;
      
      if (strategy) {
        processedData = await strategy.extractStructure(parsedStructure);
        processedData = await strategy.validateContent(processedData);
        processedData = await strategy.enrichData(processedData);
      } else {
        processedData = this.applyGenericParsing(parsedStructure);
      }

      // Add metadata
      processedData.metadata = this.buildMetadata(response, analysisType, options);
      
      // Format according to output requirements
      const formattedData = this.formatOutput(processedData, options.outputFormat);
      
      // Validate final structure
      this.validateFinalStructure(formattedData, analysisType);
      
      logger.info('Response parsing completed successfully', {
        analysisType,
        sections: Object.keys(formattedData).length,
        recommendationsCount: formattedData.recommendations?.length || 0
      });

      return formattedData;

    } catch (error) {
      logger.error('Failed to parse Claude response', {
        analysisType,
        error: error.message,
        responsePreview: response.content?.[0]?.text?.substring(0, 200)
      });
      
      // Return fallback structure
      return this.createFallbackResponse(response, analysisType, error);
    }
  }

  /**
   * Extract text content from Claude response
   */
  extractTextContent(response) {
    if (!response || !response.content) {
      throw new Error('Invalid response structure');
    }

    const textBlocks = response.content.filter(block => block.type === 'text');
    
    if (textBlocks.length === 0) {
      throw new Error('No text content found in response');
    }

    return textBlocks.map(block => block.text).join('\n');
  }

  /**
   * Parse JSON structure from text content
   */
  parseJSONStructure(textContent) {
    try {
      // Try to extract JSON from code blocks first
      const jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to extract JSON from the text directly
      const jsonStartIndex = textContent.indexOf('{');
      const jsonEndIndex = textContent.lastIndexOf('}');
      
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        const jsonText = textContent.substring(jsonStartIndex, jsonEndIndex + 1);
        return JSON.parse(jsonText);
      }

      // If no JSON found, create structure from text
      return this.createStructureFromText(textContent);

    } catch (error) {
      logger.warn('Failed to parse JSON structure, falling back to text parsing', {
        error: error.message
      });
      
      return this.createStructureFromText(textContent);
    }
  }

  /**
   * Create structure from plain text when JSON parsing fails
   */
  createStructureFromText(textContent) {
    const lines = textContent.split('\n').filter(line => line.trim());
    
    const structure = {
      executiveSummary: [],
      keyInsights: [],
      detailedAnalysis: {},
      recommendations: [],
      supportingData: {},
      rawContent: textContent
    };

    let currentSection = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detect section headers
      if (this.isSectionHeader(trimmedLine)) {
        currentSection = this.getSectionName(trimmedLine);
        continue;
      }
      
      // Process content based on current section
      if (currentSection && trimmedLine) {
        this.addToSection(structure, currentSection, trimmedLine);
      }
    }

    return structure;
  }

  /**
   * Detect if line is a section header
   */
  isSectionHeader(line) {
    const headerPatterns = [
      /^##?\s*(executive|summary|insight|analysis|recommendation|data)/i,
      /^\d+\.\s*(EXECUTIVE|SUMMARY|INSIGHT|ANALYSIS|RECOMMENDATION|DATA)/i,
      /^[A-Z\s]{3,}:?\s*$/
    ];

    return headerPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Get section name from header
   */
  getSectionName(header) {
    const normalizedHeader = header.toLowerCase()
      .replace(/^##?\s*/, '')
      .replace(/^\d+\.\s*/, '')
      .replace(/:$/, '');

    if (normalizedHeader.includes('executive') || normalizedHeader.includes('summary')) {
      return 'executiveSummary';
    }
    if (normalizedHeader.includes('insight') || normalizedHeader.includes('finding')) {
      return 'keyInsights';
    }
    if (normalizedHeader.includes('recommendation') || normalizedHeader.includes('action')) {
      return 'recommendations';
    }
    if (normalizedHeader.includes('analysis') || normalizedHeader.includes('detail')) {
      return 'detailedAnalysis';
    }
    if (normalizedHeader.includes('data') || normalizedHeader.includes('metric')) {
      return 'supportingData';
    }

    return 'other';
  }

  /**
   * Add content to appropriate section
   */
  addToSection(structure, sectionName, content) {
    switch (sectionName) {
      case 'executiveSummary':
      case 'keyInsights':
        if (content.startsWith('-') || content.startsWith('•')) {
          structure[sectionName].push(content.substring(1).trim());
        } else {
          structure[sectionName].push(content);
        }
        break;
        
      case 'recommendations':
        structure.recommendations.push({
          title: content,
          description: '',
          priority: 'medium',
          timeline: 'TBD',
          impact: 'TBD'
        });
        break;
        
      case 'detailedAnalysis':
      case 'supportingData':
        if (!structure[sectionName].content) {
          structure[sectionName].content = [];
        }
        structure[sectionName].content.push(content);
        break;
    }
  }

  /**
   * Extract financial analysis structure
   */
  extractFinancialStructure(parsed) {
    return {
      ...parsed,
      financialMetrics: this.extractFinancialMetrics(parsed),
      ratioAnalysis: this.extractRatioAnalysis(parsed),
      trendAnalysis: this.extractTrendAnalysis(parsed)
    };
  }

  /**
   * Extract sales performance structure
   */
  extractSalesStructure(parsed) {
    return {
      ...parsed,
      salesMetrics: this.extractSalesMetrics(parsed),
      customerInsights: this.extractCustomerInsights(parsed),
      productPerformance: this.extractProductPerformance(parsed)
    };
  }

  /**
   * Extract business report structure
   */
  extractReportStructure(parsed) {
    return {
      ...parsed,
      kpiDashboard: this.extractKPIs(parsed),
      performanceMetrics: this.extractPerformanceMetrics(parsed),
      strategicInsights: this.extractStrategicInsights(parsed)
    };
  }

  /**
   * Extract inventory optimization structure
   */
  extractInventoryStructure(parsed) {
    return {
      ...parsed,
      currentState: this.extractCurrentState(parsed),
      optimizationOpportunities: this.extractOptimization(parsed),
      forecastingInsights: this.extractForecasting(parsed)
    };
  }

  /**
   * Extract competitive analysis structure
   */
  extractCompetitiveStructure(parsed) {
    return {
      ...parsed,
      competitivePosition: this.extractCompetitivePosition(parsed),
      marketInsights: this.extractMarketInsights(parsed),
      strategicRecommendations: this.extractStrategicRecommendations(parsed)
    };
  }

  /**
   * Extract strategic planning structure
   */
  extractStrategicStructure(parsed) {
    return {
      ...parsed,
      strategicAnalysis: this.extractStrategicAnalysis(parsed),
      growthOpportunities: this.extractGrowthOpportunities(parsed),
      implementationRoadmap: this.extractImplementationRoadmap(parsed)
    };
  }

  /**
   * Build metadata for parsed response
   */
  buildMetadata(response, analysisType, options) {
    return {
      analysisType,
      model: response.model,
      timestamp: new Date().toISOString(),
      processingTime: response.metadata?.processingTime || 0,
      tokensUsed: response.usage?.total_tokens || 0,
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
      parsingVersion: '1.0.0',
      options: {
        outputFormat: options.outputFormat,
        audience: options.audience,
        includeDetails: options.includeDetails
      }
    };
  }

  /**
   * Format output according to requirements
   */
  formatOutput(data, outputFormat = 'detailed') {
    const formatter = this.formatters.get(outputFormat);
    
    if (formatter) {
      return formatter(data);
    }

    return this.formatDetailed(data);
  }

  /**
   * Format for executive audience
   */
  formatForExecutives(data) {
    return {
      executiveSummary: data.executiveSummary || [],
      keyRecommendations: (data.recommendations || [])
        .filter(rec => rec.priority === 'high' || rec.priority === 'critical')
        .slice(0, 5),
      criticalInsights: (data.keyInsights || []).slice(0, 3),
      nextSteps: data.nextSteps || [],
      metadata: data.metadata
    };
  }

  /**
   * Format detailed analysis
   */
  formatDetailed(data) {
    return {
      executiveSummary: data.executiveSummary || [],
      keyInsights: data.keyInsights || [],
      detailedAnalysis: data.detailedAnalysis || {},
      recommendations: data.recommendations || [],
      supportingData: data.supportingData || {},
      riskAssessment: data.riskAssessment || {},
      nextSteps: data.nextSteps || [],
      visualizations: this.suggestVisualizations(data),
      exportFormats: this.generateExportOptions(data),
      metadata: data.metadata
    };
  }

  /**
   * Format for dashboard display
   */
  formatForDashboard(data) {
    return {
      summary: {
        title: this.generateTitle(data),
        insights: (data.keyInsights || []).slice(0, 3),
        recommendations: (data.recommendations || []).slice(0, 3)
      },
      metrics: this.extractDashboardMetrics(data),
      alerts: this.extractAlerts(data),
      actions: this.extractQuickActions(data),
      metadata: data.metadata
    };
  }

  /**
   * Format for export
   */
  formatForExport(data) {
    return {
      report: {
        title: this.generateTitle(data),
        generatedOn: new Date().toISOString(),
        analysisType: data.metadata?.analysisType,
        sections: {
          executiveSummary: data.executiveSummary,
          keyInsights: data.keyInsights,
          detailedFindings: data.detailedAnalysis,
          recommendations: data.recommendations,
          appendix: data.supportingData
        }
      },
      exportMetadata: {
        format: 'structured',
        version: '1.0.0',
        compatibility: ['PDF', 'Excel', 'PowerPoint']
      }
    };
  }

  /**
   * Suggest visualizations based on data
   */
  suggestVisualizations(data) {
    const suggestions = [];

    if (data.financialMetrics) {
      suggestions.push({
        type: 'financial-dashboard',
        title: 'Financial Performance Dashboard',
        charts: ['ratio-trends', 'profitability-analysis', 'cash-flow-waterfall']
      });
    }

    if (data.salesMetrics) {
      suggestions.push({
        type: 'sales-analytics',
        title: 'Sales Performance Analytics',
        charts: ['revenue-trends', 'customer-segmentation', 'product-performance']
      });
    }

    if (data.recommendations) {
      suggestions.push({
        type: 'action-priority-matrix',
        title: 'Recommendation Priority Matrix',
        charts: ['impact-effort-matrix', 'timeline-gantt', 'roi-projections']
      });
    }

    return suggestions;
  }

  /**
   * Generate export options
   */
  generateExportOptions(data) {
    return {
      pdf: {
        format: 'Executive Report',
        sections: ['summary', 'insights', 'recommendations'],
        styling: 'professional'
      },
      excel: {
        format: 'Data Analysis Workbook',
        sheets: ['Summary', 'Detailed Data', 'Calculations'],
        includeCharts: true
      },
      powerpoint: {
        format: 'Executive Presentation',
        slides: ['Executive Summary', 'Key Insights', 'Recommendations'],
        template: 'corporate'
      }
    };
  }

  /**
   * Validate final structure
   */
  validateFinalStructure(data, analysisType) {
    const requiredSections = ['executiveSummary', 'keyInsights', 'recommendations'];
    
    for (const section of requiredSections) {
      if (!data[section] || !Array.isArray(data[section]) || data[section].length === 0) {
        logger.warn(`Missing or empty required section: ${section}`, {
          analysisType,
          availableSections: Object.keys(data)
        });
      }
    }

    return true;
  }

  /**
   * Create fallback response on parsing failure
   */
  createFallbackResponse(response, analysisType, error) {
    const textContent = this.extractTextContent(response);
    
    return {
      executiveSummary: ['Analysis completed with parsing limitations'],
      keyInsights: ['Please review the raw content for detailed insights'],
      detailedAnalysis: {
        rawContent: textContent,
        parsingError: error.message
      },
      recommendations: [{
        title: 'Review Analysis Output',
        description: 'Manual review required due to parsing limitations',
        priority: 'medium',
        timeline: 'immediate'
      }],
      supportingData: {
        originalResponse: response,
        parsingStatus: 'failed'
      },
      metadata: {
        analysisType,
        parsingError: error.message,
        fallbackUsed: true,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Helper methods for extracting specific data types
  extractFinancialMetrics(data) { return data.financialMetrics || {}; }
  extractRatioAnalysis(data) { return data.ratioAnalysis || {}; }
  extractTrendAnalysis(data) { return data.trendAnalysis || {}; }
  extractSalesMetrics(data) { return data.salesMetrics || {}; }
  extractCustomerInsights(data) { return data.customerInsights || {}; }
  extractProductPerformance(data) { return data.productPerformance || {}; }
  extractKPIs(data) { return data.kpiDashboard || {}; }
  extractPerformanceMetrics(data) { return data.performanceMetrics || {}; }
  extractStrategicInsights(data) { return data.strategicInsights || {}; }
  extractCurrentState(data) { return data.currentState || {}; }
  extractOptimization(data) { return data.optimizationOpportunities || {}; }
  extractForecasting(data) { return data.forecastingInsights || {}; }
  extractCompetitivePosition(data) { return data.competitivePosition || {}; }
  extractMarketInsights(data) { return data.marketInsights || {}; }
  extractStrategicRecommendations(data) { return data.strategicRecommendations || []; }
  extractStrategicAnalysis(data) { return data.strategicAnalysis || {}; }
  extractGrowthOpportunities(data) { return data.growthOpportunities || []; }
  extractImplementationRoadmap(data) { return data.implementationRoadmap || {}; }
  extractDashboardMetrics(data) { return data.metrics || {}; }
  extractAlerts(data) { return data.alerts || []; }
  extractQuickActions(data) { return data.quickActions || []; }
  
  generateTitle(data) {
    const analysisType = data.metadata?.analysisType || 'Business Analysis';
    return `${analysisType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Report`;
  }

  // Validation methods for different content types
  validateFinancialContent(data) { return data; }
  validateSalesContent(data) { return data; }
  validateReportContent(data) { return data; }
  validateInventoryContent(data) { return data; }
  validateCompetitiveContent(data) { return data; }
  validateStrategicContent(data) { return data; }

  // Enrichment methods for different data types
  enrichFinancialData(data) { return data; }
  enrichSalesData(data) { return data; }
  enrichReportData(data) { return data; }
  enrichInventoryData(data) { return data; }
  enrichCompetitiveData(data) { return data; }
  enrichStrategicData(data) { return data; }

  applyGenericParsing(data) { return data; }
}