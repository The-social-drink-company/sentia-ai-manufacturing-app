/**
 * Data Analysis Tool - OpenAI GPT Integration
 * 
 * Statistical analysis and insights with pattern recognition and predictive modeling.
 * Provides comprehensive data intelligence for manufacturing operations.
 * 
 * Tool: openai-data-analysis
 * 
 * @version 1.0.0
 * @author CapLiquify Platform Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Data Analysis Tool for OpenAI GPT
 */
export class DataAnalysisTool {
  constructor(dependencies) {
    this.client = dependencies.client;
    this.functionCalling = dependencies.functionCalling;
    this.promptOptimizer = dependencies.promptOptimizer;
    this.responseValidator = dependencies.responseValidator;
    this.costTracker = dependencies.costTracker;
    this.analytics = dependencies.analytics;
    this.server = dependencies.server;
    this.logger = dependencies.logger;

    this.toolName = 'openai-data-analysis';
    this.category = 'analytics';
    this.version = '1.0.0';
  }

  /**
   * Initialize the data analysis tool
   */
  async initialize() {
    try {
      this.logger.info('Initializing Data Analysis Tool...');
      
      // Validate dependencies
      this.validateDependencies();
      
      this.logger.info('Data Analysis Tool initialized successfully');
      return true;

    } catch (error) {
      this.logger.error('Failed to initialize Data Analysis Tool', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get tool description
   */
  getDescription() {
    return 'Advanced statistical analysis and data insights tool. Provides pattern recognition, correlation analysis, trend identification, and predictive modeling for manufacturing data. Capable of processing large datasets and generating actionable business intelligence.';
  }

  /**
   * Get input schema for the tool
   */
  getInputSchema() {
    return {
      type: 'object',
      properties: {
        analysis_type: {
          type: 'string',
          enum: [
            'statistical_summary',
            'correlation_analysis', 
            'trend_analysis',
            'pattern_recognition',
            'anomaly_detection',
            'predictive_modeling',
            'comparative_analysis',
            'time_series_analysis'
          ],
          description: 'Type of data analysis to perform'
        },
        data_source: {
          type: 'string',
          enum: ['database_query', 'csv_data', 'json_data', 'api_endpoint'],
          description: 'Source of data for analysis'
        },
        dataset: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'SQL query for database data source'
            },
            data: {
              type: 'array',
              description: 'Direct data input for analysis'
            },
            file_path: {
              type: 'string',
              description: 'Path to data file'
            },
            api_config: {
              type: 'object',
              description: 'API configuration for data retrieval'
            }
          }
        },
        analysis_parameters: {
          type: 'object',
          properties: {
            variables: {
              type: 'array',
              items: { type: 'string' },
              description: 'Variables to include in analysis'
            },
            target_variable: {
              type: 'string',
              description: 'Target variable for predictive modeling'
            },
            time_column: {
              type: 'string',
              description: 'Time/date column for time series analysis'
            },
            grouping_variables: {
              type: 'array',
              items: { type: 'string' },
              description: 'Variables to group analysis by'
            },
            filters: {
              type: 'object',
              description: 'Data filters to apply'
            },
            confidence_level: {
              type: 'number',
              minimum: 0.8,
              maximum: 0.99,
              default: 0.95,
              description: 'Statistical confidence level'
            }
          }
        },
        output_format: {
          type: 'string',
          enum: ['detailed_report', 'executive_summary', 'technical_analysis', 'visual_insights'],
          default: 'detailed_report',
          description: 'Format of analysis output'
        },
        include_visualizations: {
          type: 'boolean',
          default: true,
          description: 'Include visualization recommendations'
        },
        business_context: {
          type: 'string',
          description: 'Business context and objectives for the analysis'
        }
      },
      required: ['analysis_type', 'data_source', 'dataset']
    };
  }

  /**
   * Execute data analysis
   */
  async execute(params) {
    try {
      this.logger.info('Executing data analysis', {
        analysisType: params.analysis_type,
        dataSource: params.data_source
      });

      // Validate input parameters
      const validation = this.responseValidator.validateInput(params, this.getInputSchema());
      if (!validation.valid) {
        throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
      }

      // Prepare data analysis prompt
      const analysisPrompt = await this.buildAnalysisPrompt(params);
      
      // Include function calling if needed
      const functions = params.analysis_type === 'predictive_modeling' 
        ? this.functionCalling.getFunctionDefinitions()
        : null;

      // Execute analysis with OpenAI
      const response = await this.client.createChatCompletion({
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        functions: functions,
        function_call: functions ? 'auto' : undefined,
        temperature: 0.3, // Lower temperature for analytical consistency
        max_tokens: 4096
      });

      // Process function calls if present
      let analysisResult = response.choices[0].message.content;
      let functionResults = null;

      if (response.choices[0].message.function_call) {
        functionResults = await this.handleFunctionCall(response.choices[0].message.function_call);
        
        // Get follow-up analysis with function results
        const followUpResponse = await this.client.createChatCompletion({
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: analysisPrompt
            },
            response.choices[0].message,
            {
              role: 'function',
              name: response.choices[0].message.function_call.name,
              content: JSON.stringify(functionResults)
            }
          ],
          temperature: 0.3,
          max_tokens: 4096
        });

        analysisResult = followUpResponse.choices[0].message.content;
      }

      // Parse and structure the analysis result
      const structuredResult = await this.structureAnalysisResult(
        analysisResult, 
        params, 
        functionResults
      );

      this.logger.info('Data analysis completed successfully', {
        analysisType: params.analysis_type,
        hasResult: !!structuredResult
      });

      return {
        tool: this.toolName,
        analysis_type: params.analysis_type,
        result: structuredResult,
        metadata: {
          execution_time: new Date().toISOString(),
          model_used: response.model,
          tokens_used: response.usage,
          confidence_level: params.analysis_parameters?.confidence_level || 0.95
        }
      };

    } catch (error) {
      this.logger.error('Data analysis execution failed', {
        error: error.message,
        analysisType: params.analysis_type
      });
      throw error;
    }
  }

  /**
   * Get system prompt for data analysis
   */
  getSystemPrompt() {
    return `You are an expert data analyst specializing in manufacturing and business intelligence. 

Your capabilities include:
- Statistical analysis and hypothesis testing
- Pattern recognition and anomaly detection
- Predictive modeling and forecasting
- Time series analysis
- Correlation and regression analysis
- Data visualization recommendations

Guidelines:
1. Always provide statistical rigor and mention confidence levels
2. Explain methodology and assumptions clearly
3. Include actionable business insights
4. Recommend appropriate visualizations
5. Highlight key findings and limitations
6. Use proper statistical terminology
7. Provide specific recommendations based on findings

Focus on manufacturing and business contexts. Always structure your analysis with:
- Executive Summary
- Methodology
- Key Findings
- Statistical Results
- Business Implications
- Recommendations
- Next Steps`;
  }

  /**
   * Build analysis prompt based on parameters
   */
  async buildAnalysisPrompt(params) {
    let prompt = `Please perform a ${params.analysis_type} on the provided dataset.\n\n`;

    // Add business context
    if (params.business_context) {
      prompt += `Business Context: ${params.business_context}\n\n`;
    }

    // Add data information
    prompt += `Data Source: ${params.data_source}\n`;
    
    if (params.dataset.query) {
      prompt += `SQL Query: ${params.dataset.query}\n`;
    }
    
    if (params.dataset.data) {
      prompt += `Dataset Sample: ${JSON.stringify(params.dataset.data.slice(0, 10))}\n`;
      prompt += `Total Records: ${params.dataset.data.length}\n`;
    }

    // Add analysis parameters
    if (params.analysis_parameters) {
      const ap = params.analysis_parameters;
      prompt += `\nAnalysis Parameters:\n`;
      
      if (ap.variables) {
        prompt += `- Variables: ${ap.variables.join(', ')}\n`;
      }
      if (ap.target_variable) {
        prompt += `- Target Variable: ${ap.target_variable}\n`;
      }
      if (ap.time_column) {
        prompt += `- Time Column: ${ap.time_column}\n`;
      }
      if (ap.grouping_variables) {
        prompt += `- Grouping: ${ap.grouping_variables.join(', ')}\n`;
      }
      if (ap.confidence_level) {
        prompt += `- Confidence Level: ${ap.confidence_level * 100}%\n`;
      }
    }

    prompt += `\nOutput Format: ${params.output_format}\n`;
    prompt += `Include Visualizations: ${params.include_visualizations}\n\n`;

    // Add specific analysis instructions
    prompt += this.getAnalysisInstructions(params.analysis_type);

    return prompt;
  }

  /**
   * Get specific instructions for each analysis type
   */
  getAnalysisInstructions(analysisType) {
    const instructions = {
      'statistical_summary': `
Provide comprehensive descriptive statistics including:
- Central tendency measures (mean, median, mode)
- Variability measures (standard deviation, variance, range)
- Distribution shape (skewness, kurtosis)
- Quartiles and percentiles
- Outlier detection
- Data quality assessment`,

      'correlation_analysis': `
Perform correlation analysis including:
- Pearson correlation coefficients
- Spearman rank correlations for non-parametric data
- Correlation matrix and heatmap recommendations
- Significance testing
- Interpretation of correlation strengths
- Causal relationship warnings`,

      'trend_analysis': `
Analyze trends including:
- Linear and non-linear trend identification
- Seasonal patterns
- Cyclical components
- Trend strength and direction
- Change point detection
- Trend projection and confidence intervals`,

      'pattern_recognition': `
Identify patterns including:
- Recurring patterns and cycles
- Behavioral patterns
- Clustering analysis
- Association rules
- Sequential patterns
- Anomalous pattern detection`,

      'anomaly_detection': `
Detect anomalies using:
- Statistical outlier methods (IQR, Z-score)
- Machine learning approaches
- Time series anomaly detection
- Multivariate anomaly detection
- Severity classification
- Root cause analysis suggestions`,

      'predictive_modeling': `
Build predictive models including:
- Model selection rationale
- Feature importance analysis
- Model performance metrics
- Cross-validation results
- Prediction intervals
- Model limitations and assumptions`,

      'comparative_analysis': `
Compare groups/periods including:
- Statistical significance testing
- Effect size calculations
- Confidence intervals for differences
- Practical significance assessment
- Segment performance comparison
- Benchmark analysis`,

      'time_series_analysis': `
Analyze time series including:
- Trend decomposition
- Seasonality analysis
- Autocorrelation analysis
- Stationarity testing
- Forecasting models
- Residual analysis`
    };

    return instructions[analysisType] || 'Perform comprehensive analysis with statistical rigor.';
  }

  /**
   * Handle function calls for complex analysis
   */
  async handleFunctionCall(functionCall) {
    try {
      const functionName = functionCall.name;
      const parameters = JSON.parse(functionCall.arguments);
      
      this.logger.info('Executing function call for analysis', {
        function: functionName,
        parameters
      });

      return await this.functionCalling.executeFunction(functionName, parameters);
      
    } catch (error) {
      this.logger.error('Function call execution failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Structure analysis result into consistent format
   */
  async structureAnalysisResult(analysisText, params, functionResults) {
    try {
      // Extract structured information from the analysis text
      const sections = this.parseAnalysisSections(analysisText);
      
      return {
        executive_summary: sections.executive_summary || 'Analysis completed successfully',
        methodology: sections.methodology || 'Standard statistical analysis',
        key_findings: sections.key_findings || [],
        statistical_results: sections.statistical_results || {},
        business_implications: sections.business_implications || [],
        recommendations: sections.recommendations || [],
        visualizations: sections.visualizations || [],
        limitations: sections.limitations || [],
        next_steps: sections.next_steps || [],
        raw_analysis: analysisText,
        function_results: functionResults,
        analysis_parameters: params.analysis_parameters
      };

    } catch (error) {
      this.logger.warn('Failed to structure analysis result', {
        error: error.message
      });
      
      // Return unstructured result as fallback
      return {
        raw_analysis: analysisText,
        function_results: functionResults,
        analysis_parameters: params.analysis_parameters
      };
    }
  }

  /**
   * Parse analysis text into structured sections
   */
  parseAnalysisSections(text) {
    const sections = {};
    
    // Simple section parsing - in production this would be more sophisticated
    const sectionPatterns = {
      executive_summary: /Executive Summary[:\n](.*?)(?=\n[A-Z]|$)/is,
      methodology: /Methodology[:\n](.*?)(?=\n[A-Z]|$)/is,
      key_findings: /Key Findings[:\n](.*?)(?=\n[A-Z]|$)/is,
      recommendations: /Recommendations[:\n](.*?)(?=\n[A-Z]|$)/is,
      limitations: /Limitations[:\n](.*?)(?=\n[A-Z]|$)/is
    };

    for (const [section, pattern] of Object.entries(sectionPatterns)) {
      const match = text.match(pattern);
      if (match) {
        sections[section] = match[1].trim();
      }
    }

    return sections;
  }

  /**
   * Validate dependencies
   */
  validateDependencies() {
    const required = ['client', 'functionCalling', 'promptOptimizer', 'responseValidator'];
    
    for (const dep of required) {
      if (!this[dep]) {
        throw new Error(`Missing required dependency: ${dep}`);
      }
    }
  }
}