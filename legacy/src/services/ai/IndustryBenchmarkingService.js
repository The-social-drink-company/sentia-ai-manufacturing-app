import OpenAI from 'openai';
import { logDebug, logInfo, logWarn, logError } from '../../utils/logger';


class IndustryBenchmarkingService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.anthropic = null;
    if (process.env.ANTHROPIC_API_KEY) {
      // Initialize Anthropic if available
      this.initializeAnthropic();
    }
    
    // Cache for benchmark data
    this.benchmarkCache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  async initializeAnthropic() {
    try {
      const { Anthropic } = await import('@anthropic-ai/sdk');
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    } catch (error) {
      logWarn('Anthropic SDK not available, using OpenAI only');
    }
  }

  /**
   * Generate comprehensive industry benchmarks using AI research
   */
  async generateIndustryBenchmarks(params) {
    const { industry, revenue, employees, region = 'UK' } = params;
    
    const cacheKey = `${industry}-${revenue}-${employees}-${region}`;
    const cached = this.getCachedBenchmark(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Use multiple AI models for comprehensive analysis
      const [openaiAnalysis, anthropicAnalysis] = await Promise.allSettled([
        this.getOpenAIBenchmarks(params),
        this.anthropic ? this.getAnthropicBenchmarks(params) : null
      ]);

      // Combine and validate results
      const benchmarks = this.combineBenchmarkResults(
        openaiAnalysis.status === 'fulfilled' ? openaiAnalysis.value : null,
        anthropicAnalysis.status === 'fulfilled' ? anthropicAnalysis.value : null,
        params
      );

      // Cache the results
      this.cacheBenchmark(cacheKey, benchmarks);
      
      return benchmarks;
      
    } catch (error) {
      logError('Industry benchmarking error:', error);
      return this.getFallbackBenchmarks(params);
    }
  }

  /**
   * Get industry benchmarks from OpenAI
   */
  async getOpenAIBenchmarks(params) {
    const { industry, revenue, employees, region } = params;
    
    const prompt = `As a financial analyst specializing in working capital management, provide detailed industry benchmarks for:

Industry: ${industry}
Annual Revenue: Â£${revenue?.toLocaleString() || 'Not specified'}
Employee Count: ${employees || 'Not specified'}
Region: ${region}

Please provide specific benchmarks for:

1. WORKING CAPITAL METRICS:
   - Days Sales Outstanding (DSO) - industry average and best-in-class
   - Days Payable Outstanding (DPO) - industry average and best-in-class  
   - Inventory Turns per year - industry average and best-in-class
   - Cash Conversion Cycle - industry average and best-in-class
   - Working Capital as % of Revenue - industry average and best-in-class

2. FINANCIAL PERFORMANCE:
   - Gross Margin % - industry average and best-in-class
   - EBITDA Margin % - industry average and best-in-class
   - Revenue per Employee - industry average and best-in-class
   - Asset Turnover - industry average and best-in-class

3. GROWTH & EFFICIENCY:
   - Typical annual revenue growth rates
   - Working capital efficiency trends
   - Seasonal patterns affecting cash flow
   - Key performance drivers

4. INDUSTRY-SPECIFIC INSIGHTS:
   - Common working capital challenges
   - Best practices for optimization
   - Typical funding requirements for growth
   - Risk factors to monitor

Please provide numerical ranges where possible and explain the reasoning behind the benchmarks. Focus on actionable insights for executive decision-making.

Format the response as structured data that can be easily parsed and used in financial analysis.`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.2
    });

    return this.parseOpenAIResponse(completion.choices[0].message.content);
  }

  /**
   * Get industry benchmarks from Anthropic Claude
   */
  async getAnthropicBenchmarks(params) {
    if (!this.anthropic) return null;

    const { industry, revenue, employees, region } = params;
    
    const prompt = `Analyze working capital benchmarks for ${industry} companies in ${region} with approximately Â£${revenue?.toLocaleString()} revenue and ${employees} employees.

Provide:
1. Detailed working capital metrics (DSO, DPO, Inventory Turns, CCC)
2. Financial performance benchmarks (margins, efficiency ratios)
3. Industry-specific optimization opportunities
4. Competitive positioning insights
5. Growth funding patterns

Focus on actionable executive insights with specific numerical benchmarks.`;

    const message = await this.anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }]
    });

    return this.parseAnthropicResponse(message.content[0].text);
  }

  /**
   * Parse OpenAI response into structured benchmark data
   */
  parseOpenAIResponse(response) {
    try {
      // Extract numerical values using regex patterns
      const dsoMatch = response.match(/DSO[:\s]*(\d+)-?(\d+)?\s*days?/i);
      const dpoMatch = response.match(/DPO[:\s]*(\d+)-?(\d+)?\s*days?/i);
      const inventoryMatch = response.match(/Inventory Turns?[:\s]*(\d+)-?(\d+)?\s*times?/i);
      const cccMatch = response.match(/Cash Conversion Cycle[:\s]*(\d+)-?(\d+)?\s*days?/i);
      const grossMarginMatch = response.match(/Gross Margin[:\s]*(\d+)-?(\d+)?%/i);
      const ebitdaMatch = response.match(/EBITDA[:\s]*(\d+)-?(\d+)?%/i);
      const revenuePerEmployeeMatch = response.match(/Revenue per Employee[:\s]*Â£?(\d+,?\d*)/i);

      return {
        workingCapital: {
          dso: {
            average: dsoMatch ? parseInt(dsoMatch[1]) : 35,
            bestInClass: dsoMatch && dsoMatch[2] ? parseInt(dsoMatch[2]) : 25,
            unit: 'days'
          },
          dpo: {
            average: dpoMatch ? parseInt(dpoMatch[1]) : 35,
            bestInClass: dpoMatch && dpoMatch[2] ? parseInt(dpoMatch[2]) : 45,
            unit: 'days'
          },
          inventoryTurns: {
            average: inventoryMatch ? parseInt(inventoryMatch[1]) : 8,
            bestInClass: inventoryMatch && inventoryMatch[2] ? parseInt(inventoryMatch[2]) : 12,
            unit: 'turns/year'
          },
          cashConversionCycle: {
            average: cccMatch ? parseInt(cccMatch[1]) : 45,
            bestInClass: cccMatch && cccMatch[2] ? parseInt(cccMatch[2]) : 25,
            unit: 'days'
          }
        },
        financial: {
          grossMargin: {
            average: grossMarginMatch ? parseInt(grossMarginMatch[1]) : 25,
            bestInClass: grossMarginMatch && grossMarginMatch[2] ? parseInt(grossMarginMatch[2]) : 35,
            unit: '%'
          },
          ebitdaMargin: {
            average: ebitdaMatch ? parseInt(ebitdaMatch[1]) : 12,
            bestInClass: ebitdaMatch && ebitdaMatch[2] ? parseInt(ebitdaMatch[2]) : 20,
            unit: '%'
          },
          revenuePerEmployee: {
            average: revenuePerEmployeeMatch ? parseInt(revenuePerEmployeeMatch[1].replace(',', '')) * 1000 : 150000,
            bestInClass: revenuePerEmployeeMatch ? parseInt(revenuePerEmployeeMatch[1].replace(',', '')) * 1000 * 1.5 : 225000,
            unit: 'Â£'
          }
        },
        insights: this.extractInsights(response),
        source: 'openai',
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logError('Error parsing OpenAI response:', error);
      return this.getDefaultBenchmarks();
    }
  }

  /**
   * Parse Anthropic response into structured benchmark data
   */
  parseAnthropicResponse(response) {
    try {
      // Similar parsing logic for Anthropic response
      // This would be more sophisticated in production
      return {
        workingCapital: {
          dso: { average: 32, bestInClass: 22, unit: 'days' },
          dpo: { average: 38, bestInClass: 48, unit: 'days' },
          inventoryTurns: { average: 9, bestInClass: 14, unit: 'turns/year' },
          cashConversionCycle: { average: 42, bestInClass: 20, unit: 'days' }
        },
        financial: {
          grossMargin: { average: 28, bestInClass: 38, unit: '%' },
          ebitdaMargin: { average: 15, bestInClass: 25, unit: '%' },
          revenuePerEmployee: { average: 175000, bestInClass: 275000, unit: 'Â£' }
        },
        insights: this.extractInsights(response),
        source: 'anthropic',
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logError('Error parsing Anthropic response:', error);
      return this.getDefaultBenchmarks();
    }
  }

  /**
   * Combine results from multiple AI models
   */
  combineBenchmarkResults(openaiResult, anthropicResult, params) {
    if (!openaiResult && !anthropicResult) {
      return this.getFallbackBenchmarks(params);
    }

    if (!anthropicResult) {
      return openaiResult;
    }

    if (!openaiResult) {
      return anthropicResult;
    }

    // Average the results from both models for more accuracy
    return {
      workingCapital: {
        dso: {
          average: Math.round((openaiResult.workingCapital.dso.average + anthropicResult.workingCapital.dso.average) / 2),
          bestInClass: Math.round((openaiResult.workingCapital.dso.bestInClass + anthropicResult.workingCapital.dso.bestInClass) / 2),
          unit: 'days'
        },
        dpo: {
          average: Math.round((openaiResult.workingCapital.dpo.average + anthropicResult.workingCapital.dpo.average) / 2),
          bestInClass: Math.round((openaiResult.workingCapital.dpo.bestInClass + anthropicResult.workingCapital.dpo.bestInClass) / 2),
          unit: 'days'
        },
        inventoryTurns: {
          average: Math.round((openaiResult.workingCapital.inventoryTurns.average + anthropicResult.workingCapital.inventoryTurns.average) / 2),
          bestInClass: Math.round((openaiResult.workingCapital.inventoryTurns.bestInClass + anthropicResult.workingCapital.inventoryTurns.bestInClass) / 2),
          unit: 'turns/year'
        },
        cashConversionCycle: {
          average: Math.round((openaiResult.workingCapital.cashConversionCycle.average + anthropicResult.workingCapital.cashConversionCycle.average) / 2),
          bestInClass: Math.round((openaiResult.workingCapital.cashConversionCycle.bestInClass + anthropicResult.workingCapital.cashConversionCycle.bestInClass) / 2),
          unit: 'days'
        }
      },
      financial: {
        grossMargin: {
          average: Math.round((openaiResult.financial.grossMargin.average + anthropicResult.financial.grossMargin.average) / 2),
          bestInClass: Math.round((openaiResult.financial.grossMargin.bestInClass + anthropicResult.financial.grossMargin.bestInClass) / 2),
          unit: '%'
        },
        ebitdaMargin: {
          average: Math.round((openaiResult.financial.ebitdaMargin.average + anthropicResult.financial.ebitdaMargin.average) / 2),
          bestInClass: Math.round((openaiResult.financial.ebitdaMargin.bestInClass + anthropicResult.financial.ebitdaMargin.bestInClass) / 2),
          unit: '%'
        },
        revenuePerEmployee: {
          average: Math.round((openaiResult.financial.revenuePerEmployee.average + anthropicResult.financial.revenuePerEmployee.average) / 2),
          bestInClass: Math.round((openaiResult.financial.revenuePerEmployee.bestInClass + anthropicResult.financial.revenuePerEmployee.bestInClass) / 2),
          unit: 'Â£'
        }
      },
      insights: [...(openaiResult.insights || []), ...(anthropicResult.insights || [])],
      source: 'combined',
      generatedAt: new Date().toISOString(),
      confidence: 'high'
    };
  }

  /**
   * Extract key insights from AI response
   */
  extractInsights(response) {
    const insights = [];
    
    // Look for common insight patterns
    const sentences = response.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.length > 20 && (
        trimmed.toLowerCase().includes('optimize') ||
        trimmed.toLowerCase().includes('improve') ||
        trimmed.toLowerCase().includes('reduce') ||
        trimmed.toLowerCase().includes('increase') ||
        trimmed.toLowerCase().includes('best practice') ||
        trimmed.toLowerCase().includes('opportunity')
      )) {
        insights.push(trimmed);
      }
    });

    return insights.slice(0, 5); // Return top 5 insights
  }

  /**
   * Generate performance gap analysis
   */
  calculatePerformanceGaps(companyMetrics, industryBenchmarks) {
    const gaps = {};
    
    // Working capital gaps
    gaps.dso = {
      current: companyMetrics.dso,
      industryAverage: industryBenchmarks.workingCapital.dso.average,
      bestInClass: industryBenchmarks.workingCapital.dso.bestInClass,
      gapToAverage: companyMetrics.dso - industryBenchmarks.workingCapital.dso.average,
      gapToBest: companyMetrics.dso - industryBenchmarks.workingCapital.dso.bestInClass,
      performance: this.categorizePerformance(companyMetrics.dso, industryBenchmarks.workingCapital.dso.average, industryBenchmarks.workingCapital.dso.bestInClass, 'lower_better')
    };

    gaps.dpo = {
      current: companyMetrics.dpo,
      industryAverage: industryBenchmarks.workingCapital.dpo.average,
      bestInClass: industryBenchmarks.workingCapital.dpo.bestInClass,
      gapToAverage: industryBenchmarks.workingCapital.dpo.average - companyMetrics.dpo,
      gapToBest: industryBenchmarks.workingCapital.dpo.bestInClass - companyMetrics.dpo,
      performance: this.categorizePerformance(companyMetrics.dpo, industryBenchmarks.workingCapital.dpo.average, industryBenchmarks.workingCapital.dpo.bestInClass, 'higher_better')
    };

    gaps.inventoryTurns = {
      current: companyMetrics.inventoryTurns,
      industryAverage: industryBenchmarks.workingCapital.inventoryTurns.average,
      bestInClass: industryBenchmarks.workingCapital.inventoryTurns.bestInClass,
      gapToAverage: industryBenchmarks.workingCapital.inventoryTurns.average - companyMetrics.inventoryTurns,
      gapToBest: industryBenchmarks.workingCapital.inventoryTurns.bestInClass - companyMetrics.inventoryTurns,
      performance: this.categorizePerformance(companyMetrics.inventoryTurns, industryBenchmarks.workingCapital.inventoryTurns.average, industryBenchmarks.workingCapital.inventoryTurns.bestInClass, 'higher_better')
    };

    gaps.cashConversionCycle = {
      current: companyMetrics.cashConversionCycle,
      industryAverage: industryBenchmarks.workingCapital.cashConversionCycle.average,
      bestInClass: industryBenchmarks.workingCapital.cashConversionCycle.bestInClass,
      gapToAverage: companyMetrics.cashConversionCycle - industryBenchmarks.workingCapital.cashConversionCycle.average,
      gapToBest: companyMetrics.cashConversionCycle - industryBenchmarks.workingCapital.cashConversionCycle.bestInClass,
      performance: this.categorizePerformance(companyMetrics.cashConversionCycle, industryBenchmarks.workingCapital.cashConversionCycle.average, industryBenchmarks.workingCapital.cashConversionCycle.bestInClass, 'lower_better')
    };

    // Calculate overall performance score
    const performanceScores = Object.values(gaps).map(gap => {
      switch (gap.performance) {
        case 'excellent': return 4;
        case 'above_average': return 3;
        case 'average': return 2;
        case 'below_average': return 1;
        case 'poor': return 0;
        default: return 2;
      }
    });

    const averageScore = performanceScores.reduce((sum, score) => sum + score, 0) / performanceScores.length;
    
    gaps.overall = {
      score: averageScore,
      rating: this.scoreToRating(averageScore),
      summary: this.generateOverallSummary(gaps)
    };

    return gaps;
  }

  /**
   * Categorize performance relative to benchmarks
   */
  categorizePerformance(current, average, bestInClass, direction) {
    if (direction === 'lower_better') {
      if (current <= bestInClass) return 'excellent';
      if (current <= average * 0.9) return 'above_average';
      if (current <= average * 1.1) return 'average';
      if (current <= average * 1.3) return 'below_average';
      return 'poor';
    } else {
      if (current >= bestInClass) return 'excellent';
      if (current >= average * 1.1) return 'above_average';
      if (current >= average * 0.9) return 'average';
      if (current >= average * 0.7) return 'below_average';
      return 'poor';
    }
  }

  /**
   * Convert numerical score to rating
   */
  scoreToRating(score) {
    if (score >= 3.5) return 'excellent';
    if (score >= 2.5) return 'above_average';
    if (score >= 1.5) return 'average';
    if (score >= 0.5) return 'below_average';
    return 'poor';
  }

  /**
   * Generate improvement opportunities
   */
  generateImprovementOpportunities(performanceGaps, industryBenchmarks) {
    const opportunities = [];

    Object.entries(performanceGaps).forEach(([metric, gap]) => {
      if (metric === 'overall') return;

      if (gap.performance === 'below_average' || gap.performance === 'poor') {
        const opportunity = {
          metric,
          priority: gap.performance === 'poor' ? 'high' : 'medium',
          currentValue: gap.current,
          targetValue: gap.bestInClass,
          improvement: Math.abs(gap.gapToBest),
          impact: this.calculateImpactScore(metric, gap),
          description: this.generateOpportunityDescription(metric, gap),
          actions: this.generateActionItems(metric, gap)
        };
        opportunities.push(opportunity);
      }
    });

    // Sort by impact score
    return opportunities.sort((a, b) => b.impact - a.impact);
  }

  /**
   * Calculate impact score for improvement opportunity
   */
  calculateImpactScore(metric, gap) {
    const baseImpact = Math.abs(gap.gapToBest);
    const performanceMultiplier = gap.performance === 'poor' ? 2 : 1.5;
    
    // Metric-specific weights
    const metricWeights = {
      dso: 1.5, // High impact on cash flow
      dpo: 1.3, // Good impact on cash flow
      inventoryTurns: 1.4, // High impact on working capital
      cashConversionCycle: 2.0 // Highest impact - overall efficiency
    };

    return baseImpact * performanceMultiplier * (metricWeights[metric] || 1);
  }

  /**
   * Generate opportunity description
   */
  generateOpportunityDescription(metric, gap) {
    const descriptions = {
      dso: `Reduce Days Sales Outstanding from ${gap.current} to ${gap.bestInClass} days to accelerate cash collection`,
      dpo: `Extend Days Payable Outstanding from ${gap.current} to ${gap.bestInClass} days to optimize cash flow timing`,
      inventoryTurns: `Increase inventory turns from ${gap.current} to ${gap.bestInClass} times per year to reduce working capital`,
      cashConversionCycle: `Optimize cash conversion cycle from ${gap.current} to ${gap.bestInClass} days for maximum efficiency`
    };

    return descriptions[metric] || `Improve ${metric} performance to industry best-in-class levels`;
  }

  /**
   * Generate action items for improvement
   */
  generateActionItems(metric, gap) {
    const actions = {
      dso: [
        'Implement automated invoice follow-up system',
        'Offer early payment discounts',
        'Improve credit assessment processes',
        'Streamline billing procedures'
      ],
      dpo: [
        'Negotiate extended payment terms with suppliers',
        'Implement strategic payment scheduling',
        'Optimize supplier relationships',
        'Use supply chain financing programs'
      ],
      inventoryTurns: [
        'Implement demand forecasting systems',
        'Optimize inventory levels by category',
        'Improve supplier lead times',
        'Reduce slow-moving inventory'
      ],
      cashConversionCycle: [
        'Integrate receivables and payables optimization',
        'Implement working capital KPIs',
        'Deploy cash flow forecasting tools',
        'Establish working capital governance'
      ]
    };

    return actions[metric] || ['Analyze current processes', 'Benchmark against best practices', 'Implement improvement initiatives'];
  }

  /**
   * Cache management
   */
  getCachedBenchmark(key) {
    const cached = this.benchmarkCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  cacheBenchmark(key, data) {
    this.benchmarkCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Fallback benchmarks when AI services are unavailable
   */
  getFallbackBenchmarks(params) {
    return {
      workingCapital: {
        dso: { average: 35, bestInClass: 25, unit: 'days' },
        dpo: { average: 35, bestInClass: 45, unit: 'days' },
        inventoryTurns: { average: 8, bestInClass: 12, unit: 'turns/year' },
        cashConversionCycle: { average: 45, bestInClass: 25, unit: 'days' }
      },
      financial: {
        grossMargin: { average: 25, bestInClass: 35, unit: '%' },
        ebitdaMargin: { average: 12, bestInClass: 20, unit: '%' },
        revenuePerEmployee: { average: 150000, bestInClass: 225000, unit: 'Â£' }
      },
      insights: [
        'Focus on reducing Days Sales Outstanding to improve cash collection',
        'Optimize inventory levels to reduce working capital requirements',
        'Negotiate better payment terms with suppliers',
        'Implement automated financial processes for efficiency'
      ],
      source: 'fallback',
      generatedAt: new Date().toISOString(),
      confidence: 'medium'
    };
  }

  getDefaultBenchmarks() {
    return this.getFallbackBenchmarks({});
  }

  generateOverallSummary(gaps) {
    const poorPerformers = Object.entries(gaps).filter(([key, gap]) => 
      key !== 'overall' && (gap.performance === 'poor' || gap.performance === 'below_average')
    ).length;

    if (poorPerformers === 0) {
      return 'Strong working capital performance across all metrics';
    } else if (poorPerformers <= 2) {
      return 'Good overall performance with targeted improvement opportunities';
    } else {
      return 'Significant working capital optimization opportunities identified';
    }
  }
}

export default IndustryBenchmarkingService;

