/**
 * Prompt Builder System for Claude AI
 * 
 * Advanced prompt engineering with sophisticated business intelligence capabilities:
 * - Industry-specific prompt templates
 * - Context-aware prompt generation
 * - Multi-step reasoning workflows
 * - Data integration prompts
 * - Quality validation prompts
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Advanced Prompt Builder for Business Intelligence
 */
export class PromptBuilder {
  constructor() {
    this.templates = new Map();
    this.systemPrompts = new Map();
    this.contextStrategies = new Map();
    
    this.initializeTemplates();
    this.initializeSystemPrompts();
    this.initializeContextStrategies();
  }

  /**
   * Initialize prompt templates for different analysis types
   */
  initializeTemplates() {
    // Financial Analysis Templates
    this.templates.set('financial-analysis', {
      system: `You are an expert financial analyst specializing in manufacturing operations. You provide comprehensive financial analysis with actionable insights and strategic recommendations.

Key Responsibilities:
- Analyze financial statements, ratios, and trends
- Identify risks, opportunities, and performance gaps
- Provide specific, actionable recommendations
- Generate executive-level summaries with clear priorities
- Consider manufacturing industry benchmarks and best practices`,

      userPrompt: (data, analysisType, timeframe) => `
Conduct a comprehensive financial analysis based on the following data:

FINANCIAL DATA:
${this.formatFinancialData(data)}

ANALYSIS REQUIREMENTS:
- Analysis Type: ${analysisType}
- Time Frame: ${timeframe}
- Focus Areas: ${data.focusAreas || 'General financial health assessment'}

Please provide:

1. EXECUTIVE SUMMARY (2-3 bullet points)
   - Most critical insights
   - Immediate action items
   - Overall financial health assessment

2. DETAILED ANALYSIS
   - Key financial metrics and trends
   - Performance vs. industry benchmarks
   - Risk assessment and mitigation strategies

3. STRATEGIC RECOMMENDATIONS
   - Prioritized action items with timeline
   - Expected impact and ROI
   - Implementation considerations

4. SUPPORTING DATA
   - Relevant calculations and ratios
   - Trend analysis with projections
   - Comparative analysis

Format the response as structured JSON with clear sections and actionable insights.`
    });

    // Sales Performance Templates
    this.templates.set('sales-performance', {
      system: `You are a senior sales analyst with expertise in manufacturing and B2B sales operations. You specialize in identifying sales patterns, customer behavior insights, and revenue optimization opportunities.

Core Competencies:
- Sales trend analysis and forecasting
- Customer segmentation and behavior analysis
- Product performance evaluation
- Revenue optimization strategies
- Market opportunity identification`,

      userPrompt: (data, analysisScope, period) => `
Analyze the following sales performance data to identify trends, opportunities, and optimization strategies:

SALES DATA:
${this.formatSalesData(data)}

ANALYSIS SCOPE:
- Analysis Focus: ${analysisScope}
- Time Period: ${period}
- Key Metrics: ${data.keyMetrics || 'Revenue, conversion rates, customer acquisition'}

Provide comprehensive analysis including:

1. PERFORMANCE OVERVIEW
   - Key performance indicators and trends
   - Achievement vs. targets
   - Period-over-period comparisons

2. CUSTOMER INSIGHTS
   - Customer behavior patterns
   - Segmentation analysis
   - Retention and churn analysis

3. PRODUCT PERFORMANCE
   - Best and worst performing products
   - Seasonal trends and patterns
   - Cross-selling opportunities

4. OPTIMIZATION RECOMMENDATIONS
   - Revenue growth strategies
   - Process improvement opportunities
   - Resource allocation suggestions

5. MARKET OPPORTUNITIES
   - Untapped market segments
   - Competitive positioning
   - Expansion possibilities

Present findings in structured JSON format with clear metrics and actionable recommendations.`
    });

    // Business Reports Templates
    this.templates.set('business-reports', {
      system: `You are an executive business analyst specializing in manufacturing operations reporting. You create comprehensive business reports that combine financial, operational, and strategic insights for senior leadership.

Expertise Areas:
- Executive dashboard creation
- KPI analysis and interpretation
- Strategic planning support
- Performance measurement
- Business intelligence synthesis`,

      userPrompt: (data, reportType, audience) => `
Generate a comprehensive business report based on the provided data:

BUSINESS DATA:
${this.formatBusinessData(data)}

REPORT SPECIFICATIONS:
- Report Type: ${reportType}
- Target Audience: ${audience}
- Key Focus Areas: ${data.focusAreas || 'Overall business performance'}

Create a structured report including:

1. EXECUTIVE SUMMARY
   - Key highlights and critical insights
   - Major achievements and challenges
   - Strategic priorities and recommendations

2. PERFORMANCE METRICS
   - KPI dashboard with trend analysis
   - Benchmark comparisons
   - Target achievement status

3. OPERATIONAL INSIGHTS
   - Manufacturing efficiency metrics
   - Supply chain performance
   - Quality and productivity indicators

4. FINANCIAL PERFORMANCE
   - Revenue and profitability analysis
   - Cost structure examination
   - Cash flow and working capital insights

5. STRATEGIC OUTLOOK
   - Market position and competitive analysis
   - Growth opportunities and risks
   - Resource allocation recommendations

6. ACTION ITEMS
   - Prioritized recommendations
   - Implementation timelines
   - Success metrics and monitoring

Format as a professional JSON structure suitable for executive presentation.`
    });

    // Inventory Optimization Templates
    this.templates.set('inventory-optimization', {
      system: `You are a supply chain optimization expert specializing in inventory management for manufacturing operations. You provide data-driven insights for inventory optimization, demand forecasting, and supply chain efficiency.

Specializations:
- Demand forecasting and planning
- Inventory level optimization
- Supply chain risk assessment
- Seasonal trend analysis
- Cost optimization strategies`,

      userPrompt: (data, optimizationGoals, constraints) => `
Analyze inventory data and provide optimization recommendations:

INVENTORY DATA:
${this.formatInventoryData(data)}

OPTIMIZATION PARAMETERS:
- Primary Goals: ${optimizationGoals}
- Business Constraints: ${constraints}
- Analysis Period: ${data.analysisPeriod || 'Last 12 months'}

Deliver comprehensive analysis with:

1. CURRENT STATE ASSESSMENT
   - Inventory turnover analysis
   - Stock level efficiency
   - Carrying cost evaluation

2. DEMAND FORECASTING
   - Historical trend analysis
   - Seasonal pattern identification
   - Demand variability assessment

3. OPTIMIZATION OPPORTUNITIES
   - Optimal stock level recommendations
   - Reorder point calculations
   - Safety stock optimization

4. SUPPLY CHAIN INSIGHTS
   - Supplier performance analysis
   - Lead time optimization
   - Risk mitigation strategies

5. FINANCIAL IMPACT
   - Cost reduction potential
   - Working capital optimization
   - ROI projections

6. IMPLEMENTATION ROADMAP
   - Phased optimization approach
   - Quick wins and long-term strategies
   - Monitoring and control measures

Structure response as actionable JSON with specific recommendations and metrics.`
    });

    // Add more templates for competitive analysis and strategic planning...
    this.initializeAdditionalTemplates();
  }

  /**
   * Initialize additional specialized templates
   */
  initializeAdditionalTemplates() {
    // Competitive Analysis Template
    this.templates.set('competitive-analysis', {
      system: `You are a strategic market analyst with deep expertise in competitive intelligence and market positioning for manufacturing companies. You provide comprehensive competitive analysis and strategic recommendations.`,
      
      userPrompt: (data, competitorScope, analysisDepth) => `
Conduct competitive analysis based on available market data:

MARKET DATA:
${this.formatMarketData(data)}

ANALYSIS PARAMETERS:
- Competitor Scope: ${competitorScope}
- Analysis Depth: ${analysisDepth}
- Market Focus: ${data.marketFocus || 'Primary market segments'}

Provide structured competitive intelligence including market positioning, pricing strategies, and competitive advantages.`
    });

    // Strategic Planning Template
    this.templates.set('strategic-planning', {
      system: `You are a senior strategy consultant specializing in manufacturing business strategy. You develop comprehensive strategic plans with clear execution roadmaps and measurable outcomes.`,
      
      userPrompt: (data, planningHorizon, strategicFocus) => `
Develop strategic recommendations based on comprehensive business analysis:

STRATEGIC CONTEXT:
${this.formatStrategicContext(data)}

PLANNING PARAMETERS:
- Planning Horizon: ${planningHorizon}
- Strategic Focus: ${strategicFocus}
- Key Objectives: ${data.objectives || 'Growth and operational excellence'}

Create comprehensive strategic analysis with actionable recommendations and implementation roadmap.`
    });
  }

  /**
   * Initialize system prompts for different contexts
   */
  initializeSystemPrompts() {
    this.systemPrompts.set('manufacturing', `
You are an expert manufacturing analyst with deep knowledge of:
- Manufacturing operations and efficiency metrics (OEE, cycle time, throughput)
- Supply chain management and optimization
- Quality control and Six Sigma methodologies
- Lean manufacturing principles
- Industry 4.0 technologies and automation
- Manufacturing cost accounting and financial analysis
- Regulatory compliance and safety standards

Always consider manufacturing-specific context in your analysis and recommendations.`);

    this.systemPrompts.set('financial', `
You are a senior financial analyst specializing in manufacturing enterprises with expertise in:
- Financial statement analysis and ratio interpretation
- Manufacturing cost accounting (direct/indirect costs, overhead allocation)
- Working capital management and cash flow optimization
- Capital budgeting and investment analysis
- Financial planning and forecasting
- Risk assessment and mitigation strategies
- Industry financial benchmarks and best practices

Provide analysis that considers manufacturing industry financial dynamics.`);

    this.systemPrompts.set('strategic', `
You are a strategic business consultant with extensive experience in manufacturing strategy:
- Strategic planning and execution
- Market analysis and competitive positioning
- Business model innovation
- Operational excellence and continuous improvement
- Technology adoption and digital transformation
- Merger & acquisition analysis
- Stakeholder management and change leadership

Focus on strategic insights that drive long-term competitive advantage.`);
  }

  /**
   * Initialize context strategies for different data types
   */
  initializeContextStrategies() {
    this.contextStrategies.set('financial', (data) => {
      return {
        dataFormatting: this.formatFinancialData(data),
        relevantMetrics: this.extractFinancialMetrics(data),
        industryContext: this.getIndustryFinancialContext(),
        analysisFramework: 'DuPont Analysis, Ratio Analysis, Trend Analysis'
      };
    });

    this.contextStrategies.set('operational', (data) => {
      return {
        dataFormatting: this.formatOperationalData(data),
        relevantMetrics: this.extractOperationalMetrics(data),
        industryContext: this.getManufacturingContext(),
        analysisFramework: 'OEE Analysis, Value Stream Mapping, Lean Principles'
      };
    });

    this.contextStrategies.set('market', (data) => {
      return {
        dataFormatting: this.formatMarketData(data),
        relevantMetrics: this.extractMarketMetrics(data),
        industryContext: this.getMarketContext(),
        analysisFramework: 'Porter\'s Five Forces, SWOT Analysis, Market Positioning'
      };
    });
  }

  /**
   * Build comprehensive prompt for Claude analysis
   */
  buildPrompt(analysisType, data, options = {}) {
    try {
      const template = this.templates.get(analysisType);
      
      if (!template) {
        throw new Error(`Template not found for analysis type: ${analysisType}`);
      }

      // Get context strategy
      const contextType = options.contextType || this.inferContextType(analysisType);
      const context = this.contextStrategies.get(contextType)?.(data) || {};

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(analysisType, contextType, options);

      // Build user prompt with context
      const userPrompt = template.userPrompt(data, options.analysisScope, options.timeframe);

      // Add context and formatting instructions
      const enhancedUserPrompt = this.enhanceUserPrompt(userPrompt, context, options);

      return {
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: enhancedUserPrompt
          }
        ],
        metadata: {
          analysisType,
          contextType,
          templateVersion: '1.0.0',
          buildTimestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Failed to build prompt', {
        analysisType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Build system prompt with context
   */
  buildSystemPrompt(analysisType, contextType, options) {
    const baseTemplate = this.templates.get(analysisType);
    const contextPrompt = this.systemPrompts.get(contextType) || '';

    return `${baseTemplate.system}

${contextPrompt}

RESPONSE REQUIREMENTS:
- Provide analysis in structured JSON format
- Include executive summary with key insights
- Offer specific, actionable recommendations
- Support conclusions with data and calculations
- Consider manufacturing industry context and benchmarks
- Prioritize recommendations by impact and feasibility

OUTPUT FORMAT:
Return a JSON object with the following structure:
{
  "executiveSummary": [],
  "keyInsights": [],
  "detailedAnalysis": {},
  "recommendations": [],
  "supportingData": {},
  "riskAssessment": {},
  "nextSteps": []
}`;
  }

  /**
   * Enhance user prompt with context and formatting
   */
  enhanceUserPrompt(basePrompt, context, options) {
    let enhancedPrompt = basePrompt;

    // Add context information
    if (context.industryContext) {
      enhancedPrompt += `\n\nINDUSTRY CONTEXT:\n${context.industryContext}`;
    }

    // Add analysis framework
    if (context.analysisFramework) {
      enhancedPrompt += `\n\nANALYSIS FRAMEWORK:\nApply ${context.analysisFramework} methodologies where applicable.`;
    }

    // Add formatting requirements
    enhancedPrompt += `\n\nFORMATTING REQUIREMENTS:
- Use clear, concise language appropriate for ${options.audience || 'executive leadership'}
- Include specific numbers, percentages, and metrics where available
- Prioritize recommendations by business impact
- Provide implementation timelines where applicable
- Consider resource requirements and constraints`;

    return enhancedPrompt;
  }

  /**
   * Format financial data for analysis
   */
  formatFinancialData(data) {
    if (!data) return 'No financial data provided';

    const formatted = [];
    
    if (data.financialStatements) {
      formatted.push('FINANCIAL STATEMENTS:');
      formatted.push(JSON.stringify(data.financialStatements, null, 2));
    }
    
    if (data.ratios) {
      formatted.push('\nFINANCIAL RATIOS:');
      formatted.push(JSON.stringify(data.ratios, null, 2));
    }
    
    if (data.trends) {
      formatted.push('\nTREND DATA:');
      formatted.push(JSON.stringify(data.trends, null, 2));
    }
    
    return formatted.join('\n');
  }

  /**
   * Format sales data for analysis
   */
  formatSalesData(data) {
    if (!data) return 'No sales data provided';

    const formatted = [];
    
    if (data.revenue) {
      formatted.push('REVENUE DATA:');
      formatted.push(JSON.stringify(data.revenue, null, 2));
    }
    
    if (data.customers) {
      formatted.push('\nCUSTOMER DATA:');
      formatted.push(JSON.stringify(data.customers, null, 2));
    }
    
    if (data.products) {
      formatted.push('\nPRODUCT PERFORMANCE:');
      formatted.push(JSON.stringify(data.products, null, 2));
    }
    
    return formatted.join('\n');
  }

  /**
   * Format business data for reporting
   */
  formatBusinessData(data) {
    if (!data) return 'No business data provided';

    return Object.entries(data)
      .map(([key, value]) => `${key.toUpperCase()}:\n${JSON.stringify(value, null, 2)}`)
      .join('\n\n');
  }

  /**
   * Format inventory data for optimization
   */
  formatInventoryData(data) {
    if (!data) return 'No inventory data provided';

    const formatted = [];
    
    if (data.currentLevels) {
      formatted.push('CURRENT INVENTORY LEVELS:');
      formatted.push(JSON.stringify(data.currentLevels, null, 2));
    }
    
    if (data.movements) {
      formatted.push('\nINVENTORY MOVEMENTS:');
      formatted.push(JSON.stringify(data.movements, null, 2));
    }
    
    if (data.costs) {
      formatted.push('\nCOST DATA:');
      formatted.push(JSON.stringify(data.costs, null, 2));
    }
    
    return formatted.join('\n');
  }

  /**
   * Format market data for competitive analysis
   */
  formatMarketData(data) {
    if (!data) return 'No market data provided';

    const formatted = [];
    
    if (data.marketShare) {
      formatted.push('MARKET SHARE DATA:');
      formatted.push(JSON.stringify(data.marketShare, null, 2));
    }
    
    if (data.competitors) {
      formatted.push('\nCOMPETITOR INFORMATION:');
      formatted.push(JSON.stringify(data.competitors, null, 2));
    }
    
    if (data.pricing) {
      formatted.push('\nPRICING DATA:');
      formatted.push(JSON.stringify(data.pricing, null, 2));
    }
    
    return formatted.join('\n');
  }

  /**
   * Format strategic context data
   */
  formatStrategicContext(data) {
    if (!data) return 'No strategic context provided';

    return JSON.stringify(data, null, 2);
  }

  /**
   * Extract relevant financial metrics
   */
  extractFinancialMetrics(data) {
    // Implementation for extracting key financial metrics
    return data.metrics || {};
  }

  /**
   * Extract operational metrics
   */
  extractOperationalMetrics(data) {
    // Implementation for extracting operational metrics
    return data.operationalMetrics || {};
  }

  /**
   * Extract market metrics
   */
  extractMarketMetrics(data) {
    // Implementation for extracting market metrics
    return data.marketMetrics || {};
  }

  /**
   * Get industry financial context
   */
  getIndustryFinancialContext() {
    return `Manufacturing Industry Financial Benchmarks:
- Gross Margin: 25-35%
- Operating Margin: 8-15%
- Current Ratio: 1.5-3.0
- Inventory Turnover: 6-12x annually
- Days Sales Outstanding: 30-60 days`;
  }

  /**
   * Get manufacturing operational context
   */
  getManufacturingContext() {
    return `Manufacturing Excellence Standards:
- Overall Equipment Effectiveness (OEE): >85%
- First Pass Yield: >95%
- On-Time Delivery: >95%
- Inventory Accuracy: >99%
- Customer Satisfaction: >90%`;
  }

  /**
   * Get market analysis context
   */
  getMarketContext() {
    return `Market Analysis Framework:
- Industry growth rates and trends
- Competitive landscape analysis
- Customer segmentation and needs
- Technology disruption factors
- Regulatory and economic impacts`;
  }

  /**
   * Infer context type from analysis type
   */
  inferContextType(analysisType) {
    const contextMapping = {
      'financial-analysis': 'financial',
      'sales-performance': 'operational',
      'business-reports': 'strategic',
      'inventory-optimization': 'operational',
      'competitive-analysis': 'market',
      'strategic-planning': 'strategic'
    };

    return contextMapping[analysisType] || 'strategic';
  }

  /**
   * Get available template types
   */
  getAvailableTemplates() {
    return Array.from(this.templates.keys());
  }

  /**
   * Validate prompt data
   */
  validatePromptData(analysisType, data) {
    const template = this.templates.get(analysisType);
    
    if (!template) {
      throw new Error(`Unknown analysis type: ${analysisType}`);
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Data must be a valid object');
    }

    return true;
  }
}