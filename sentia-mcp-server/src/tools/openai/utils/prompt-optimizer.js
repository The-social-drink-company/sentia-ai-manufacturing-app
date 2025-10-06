/**
 * Prompt Optimizer - OpenAI Integration
 * 
 * Advanced prompt engineering and optimization for manufacturing AI tasks.
 * Provides prompt templates, optimization strategies, and token management.
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

export class PromptOptimizer {
  constructor() {
    this.templates = new Map();
    this.optimizationStrategies = new Map();
    this.tokenLimits = new Map();
    this.isInitialized = false;
    
    logger.info('Prompt Optimizer initialized');
  }

  async initialize() {
    try {
      logger.info('Initializing Prompt Optimizer...');
      
      this.loadPromptTemplates();
      this.loadOptimizationStrategies();
      this.configureTokenLimits();
      
      this.isInitialized = true;
      logger.info('Prompt Optimizer initialized successfully');
      return true;

    } catch (error) {
      logger.error('Failed to initialize Prompt Optimizer', { error: error.message });
      throw error;
    }
  }

  loadPromptTemplates() {
    // Manufacturing-specific prompt templates
    this.templates.set('manufacturing_analysis', {
      system: `You are an expert manufacturing analyst with deep knowledge of operations, quality, and efficiency optimization.`,
      structure: `Analyze the following manufacturing scenario:\n\n{context}\n\nProvide detailed analysis including:\n1. Current state assessment\n2. Key performance indicators\n3. Identified issues and opportunities\n4. Specific recommendations\n5. Implementation roadmap`,
      variables: ['context']
    });

    this.templates.set('business_intelligence', {
      system: `You are a senior business intelligence analyst specializing in data-driven insights for manufacturing operations.`,
      structure: `Generate business intelligence insights for:\n\n{data_description}\n\nFocus on:\n- Key trends and patterns\n- Performance metrics\n- Risk assessment\n- Strategic recommendations\n- Action priorities`,
      variables: ['data_description']
    });

    this.templates.set('process_optimization', {
      system: `You are a process improvement consultant with expertise in lean manufacturing and operational excellence.`,
      structure: `Optimize the following process:\n\n{process_details}\n\nConsider:\n- Current inefficiencies\n- Resource utilization\n- Quality impact\n- Cost implications\n- Implementation feasibility`,
      variables: ['process_details']
    });

    logger.info('Prompt templates loaded', { templateCount: this.templates.size });
  }

  loadOptimizationStrategies() {
    this.optimizationStrategies.set('token_efficiency', {
      name: 'Token Efficiency',
      description: 'Optimize prompts for minimal token usage while maintaining quality',
      apply: (prompt) => this.optimizeForTokens(prompt)
    });

    this.optimizationStrategies.set('clarity_enhancement', {
      name: 'Clarity Enhancement', 
      description: 'Enhance prompt clarity and specificity',
      apply: (prompt) => this.enhanceClarity(prompt)
    });

    this.optimizationStrategies.set('context_enrichment', {
      name: 'Context Enrichment',
      description: 'Add relevant context for better responses',
      apply: (prompt) => this.enrichContext(prompt)
    });

    logger.info('Optimization strategies loaded', { strategyCount: this.optimizationStrategies.size });
  }

  configureTokenLimits() {
    this.tokenLimits.set('gpt-4o', { input: 128000, output: 4096 });
    this.tokenLimits.set('gpt-4o-mini', { input: 128000, output: 16384 });
    this.tokenLimits.set('gpt-4-turbo', { input: 128000, output: 4096 });
    this.tokenLimits.set('gpt-3.5-turbo', { input: 16385, output: 4096 });
    
    logger.info('Token limits configured');
  }

  optimizePrompt(prompt, options = {}) {
    try {
      const {
        strategy = 'clarity_enhancement',
        model = 'gpt-4o',
        target_length = null,
        preserve_meaning = true
      } = options;

      logger.debug('Optimizing prompt', { strategy, model, targetLength: target_length });

      let optimizedPrompt = prompt;

      // Apply optimization strategy
      if (this.optimizationStrategies.has(strategy)) {
        const strategyFunc = this.optimizationStrategies.get(strategy);
        optimizedPrompt = strategyFunc.apply(optimizedPrompt);
      }

      // Check token limits
      const tokenInfo = this.estimateTokens(optimizedPrompt, model);
      if (tokenInfo.estimated_tokens > this.getTokenLimit(model, 'input')) {
        optimizedPrompt = this.truncateToLimit(optimizedPrompt, model);
      }

      // Apply target length if specified
      if (target_length) {
        optimizedPrompt = this.adjustToTargetLength(optimizedPrompt, target_length, preserve_meaning);
      }

      logger.debug('Prompt optimization completed', {
        originalLength: prompt.length,
        optimizedLength: optimizedPrompt.length,
        estimatedTokens: this.estimateTokens(optimizedPrompt, model).estimated_tokens
      });

      return {
        optimized_prompt: optimizedPrompt,
        original_length: prompt.length,
        optimized_length: optimizedPrompt.length,
        token_info: this.estimateTokens(optimizedPrompt, model),
        optimization_applied: strategy
      };

    } catch (error) {
      logger.error('Prompt optimization failed', { error: error.message });
      throw error;
    }
  }

  buildFromTemplate(templateName, variables = {}) {
    try {
      if (!this.templates.has(templateName)) {
        throw new Error(`Template '${templateName}' not found`);
      }

      const template = this.templates.get(templateName);
      
      // Validate required variables
      for (const variable of template.variables) {
        if (!(variable in variables)) {
          throw new Error(`Missing required variable: ${variable}`);
        }
      }

      // Replace variables in template
      let prompt = template.structure;
      for (const [key, value] of Object.entries(variables)) {
        prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value);
      }

      logger.debug('Prompt built from template', { templateName, variableCount: Object.keys(variables).length });

      return {
        system_prompt: template.system,
        user_prompt: prompt,
        template_used: templateName,
        variables_applied: Object.keys(variables)
      };

    } catch (error) {
      logger.error('Template prompt building failed', { error: error.message, templateName });
      throw error;
    }
  }

  optimizeForTokens(prompt) {
    // Remove redundant words and phrases
    let optimized = prompt
      .replace(/\b(very|really|quite|pretty|rather)\s+/gi, '')
      .replace(/\b(in order to|for the purpose of)\b/gi, 'to')
      .replace(/\b(due to the fact that|owing to the fact that)\b/gi, 'because')
      .replace(/\s+/g, ' ')
      .trim();

    // Remove excessive punctuation
    optimized = optimized.replace(/[.]{2,}/g, '.');
    optimized = optimized.replace(/[!]{2,}/g, '!');
    optimized = optimized.replace(/[?]{2,}/g, '?');

    return optimized;
  }

  enhanceClarity(prompt) {
    // Add structure and clarity markers
    let enhanced = prompt;

    // Add clear section markers if not present
    if (!enhanced.includes('1.') && !enhanced.includes('•') && enhanced.length > 200) {
      enhanced = `Please provide a structured response addressing the following:\n\n${enhanced}\n\nStructure your response with clear sections and specific details.`;
    }

    // Enhance with specific instructions
    if (!enhanced.toLowerCase().includes('specific') && !enhanced.toLowerCase().includes('detailed')) {
      enhanced += '\n\nProvide specific, actionable insights with supporting details.';
    }

    return enhanced;
  }

  enrichContext(prompt) {
    // Add manufacturing context if not present
    let enriched = prompt;

    if (!enriched.toLowerCase().includes('manufacturing') && !enriched.toLowerCase().includes('production')) {
      enriched = `In the context of manufacturing and production operations:\n\n${enriched}`;
    }

    // Add business context
    if (!enriched.toLowerCase().includes('business') && !enriched.toLowerCase().includes('roi')) {
      enriched += '\n\nConsider business impact, ROI, and operational feasibility in your analysis.';
    }

    return enriched;
  }

  estimateTokens(text, model = 'gpt-4o') {
    // Simple token estimation (4 characters ≈ 1 token for English)
    const estimatedTokens = Math.ceil(text.length / 4);
    const limit = this.getTokenLimit(model, 'input');
    
    return {
      estimated_tokens: estimatedTokens,
      character_count: text.length,
      model: model,
      within_limit: estimatedTokens <= limit,
      limit: limit,
      utilization_percentage: (estimatedTokens / limit) * 100
    };
  }

  getTokenLimit(model, type = 'input') {
    const limits = this.tokenLimits.get(model);
    return limits ? limits[type] : 4096; // Default fallback
  }

  truncateToLimit(prompt, model) {
    const limit = this.getTokenLimit(model, 'input');
    const maxChars = limit * 4 * 0.9; // 90% of limit to be safe
    
    if (prompt.length <= maxChars) {
      return prompt;
    }

    // Truncate at sentence boundary if possible
    const truncated = prompt.substring(0, maxChars);
    const lastPeriod = truncated.lastIndexOf('.');
    
    if (lastPeriod > maxChars * 0.8) {
      return truncated.substring(0, lastPeriod + 1);
    }
    
    return truncated + '...';
  }

  adjustToTargetLength(prompt, targetLength, preserveMeaning = true) {
    if (prompt.length <= targetLength) {
      return prompt;
    }

    if (preserveMeaning) {
      // Intelligent truncation preserving key information
      const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
      let result = '';
      
      for (const sentence of sentences) {
        if ((result + sentence).length > targetLength) {
          break;
        }
        result += sentence + '.';
      }
      
      return result.trim();
    } else {
      // Simple truncation
      return prompt.substring(0, targetLength - 3) + '...';
    }
  }

  getAvailableTemplates() {
    return Array.from(this.templates.keys()).map(name => ({
      name,
      description: this.templates.get(name).system,
      variables: this.templates.get(name).variables
    }));
  }

  getOptimizationStrategies() {
    return Array.from(this.optimizationStrategies.keys()).map(name => ({
      name,
      description: this.optimizationStrategies.get(name).description
    }));
  }

  getStatistics() {
    return {
      templates_available: this.templates.size,
      strategies_available: this.optimizationStrategies.size,
      models_supported: this.tokenLimits.size,
      initialized: this.isInitialized
    };
  }

  async cleanup() {
    try {
      logger.info('Cleaning up Prompt Optimizer...');
      
      this.templates.clear();
      this.optimizationStrategies.clear();
      this.tokenLimits.clear();
      this.isInitialized = false;
      
      logger.info('Prompt Optimizer cleanup completed');
      
    } catch (error) {
      logger.error('Error during Prompt Optimizer cleanup', { error: error.message });
    }
  }
}