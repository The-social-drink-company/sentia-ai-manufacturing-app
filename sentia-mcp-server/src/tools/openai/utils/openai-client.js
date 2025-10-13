/**
 * OpenAI Client Wrapper
 * 
 * Advanced client wrapper for OpenAI GPT API with enhanced error handling,
 * rate limiting, retry logic, streaming support, and cost optimization.
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import OpenAI from 'openai';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * OpenAI Client Wrapper with Enhanced Features
 * Provides rate limiting, retry logic, streaming, and function calling support
 */
export class OpenAIClient {
  constructor(config, auth) {
    this.config = config;
    this.auth = auth;
    this.client = null;
    this.isInitialized = false;
    this.requestCount = 0;
    this.errorCount = 0;
    this.lastRequestTime = 0;
    this.rateLimitDelay = 1000; // 1 second base delay
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 30000;
    
    // Model configurations
    this.modelConfigs = {
      'gpt-4o': {
        maxTokens: 128000,
        costPer1KInputTokens: 0.0025,
        costPer1KOutputTokens: 0.01,
        contextWindow: 128000
      },
      'gpt-4o-mini': {
        maxTokens: 128000,
        costPer1KInputTokens: 0.00015,
        costPer1KOutputTokens: 0.0006,
        contextWindow: 128000
      },
      'gpt-4-turbo': {
        maxTokens: 4096,
        costPer1KInputTokens: 0.01,
        costPer1KOutputTokens: 0.03,
        contextWindow: 128000
      },
      'gpt-3.5-turbo': {
        maxTokens: 4096,
        costPer1KInputTokens: 0.0005,
        costPer1KOutputTokens: 0.0015,
        contextWindow: 16385
      }
    };
    
    logger.info('OpenAI Client initialized', {
      model: config.model,
      maxRetries: this.maxRetries,
      timeout: this.timeout
    });
  }

  /**
   * Initialize the OpenAI client
   */
  async initialize() {
    try {
      if (!this.auth.isValidated) {
        await this.auth.validateApiKey();
      }

      this.client = this.auth.createClient();
      this.isInitialized = true;
      
      // Test connection with a simple model list request
      await this.testConnection();
      
      logger.info('OpenAI Client initialized successfully', {
        model: this.config.model,
        hasClient: !!this.client
      });
      
      return true;

    } catch (error) {
      logger.error('Failed to initialize OpenAI Client', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Test client connection
   */
  async testConnection() {
    try {
      const models = await this.client.models.list();
      logger.info('OpenAI connection test successful', {
        modelCount: models.data.length
      });
      return true;
    } catch (error) {
      logger.error('OpenAI connection test failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create chat completion with enhanced error handling and retries
   */
  async createChatCompletion(params, options = {}) {
    this.validateInitialization();
    
    const {
      retries = this.maxRetries,
      streaming = false,
      trackUsage = true,
      optimizeForCost = this.config.costOptimization
    } = options;

    // Apply rate limiting
    await this.applyRateLimit();

    // Optimize parameters for cost if enabled
    if (optimizeForCost) {
      params = this.optimizeParameters(params);
    }

    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        this.requestCount++;
        const startTime = Date.now();
        
        logger.debug('Creating OpenAI chat completion', {
          attempt: attempt + 1,
          model: params.model || this.config.model,
          streaming: streaming,
          maxTokens: params.max_tokens
        });

        // Prepare request parameters
        const requestParams = {
          model: params.model || this.config.model,
          messages: params.messages,
          max_tokens: params.max_tokens || this.config.maxTokens,
          temperature: params.temperature ?? this.config.temperature,
          top_p: params.top_p ?? this.config.topP,
          frequency_penalty: params.frequency_penalty ?? this.config.frequencyPenalty,
          presence_penalty: params.presence_penalty ?? this.config.presencePenalty,
          stream: streaming,
          ...params
        };

        // Remove undefined values
        Object.keys(requestParams).forEach(key => {
          if (requestParams[key] === undefined) {
            delete requestParams[key];
          }
        });

        let response;
        
        if (streaming) {
          response = await this.handleStreamingResponse(requestParams);
        } else {
          response = await this.client.chat.completions.create(requestParams);
        }

        // Track metrics
        const duration = Date.now() - startTime;
        if (trackUsage && response.usage) {
          this.trackUsage(response.usage, duration, params.model || this.config.model);
        }

        logger.debug('OpenAI chat completion successful', {
          duration,
          model: response.model,
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens
        });

        return response;

      } catch (error) {
        lastError = error;
        this.errorCount++;
        
        logger.warn('OpenAI request failed', {
          attempt: attempt + 1,
          error: error.message,
          type: error.type,
          code: error.code
        });

        // Check if error is retryable
        if (!this.isRetryableError(error) || attempt === retries) {
          break;
        }

        // Calculate retry delay with exponential backoff
        const delay = this.calculateRetryDelay(attempt);
        logger.debug(`Retrying OpenAI request in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    // All retries exhausted
    logger.error('OpenAI request failed after all retries', {
      retries: retries + 1,
      lastError: lastError.message
    });
    
    throw lastError;
  }

  /**
   * Handle streaming responses
   */
  async handleStreamingResponse(params) {
    try {
      const stream = await this.client.chat.completions.create(params);
      
      let fullContent = '';
      let usage = null;
      let model = null;
      const chunks = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
        
        if (chunk.choices?.[0]?.delta?.content) {
          fullContent += chunk.choices[0].delta.content;
        }
        
        if (chunk.model) {
          model = chunk.model;
        }
        
        if (chunk.usage) {
          usage = chunk.usage;
        }
      }

      // Reconstruct response format
      return {
        id: chunks[0]?.id,
        object: 'chat.completion',
        created: chunks[0]?.created,
        model: model || params.model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: fullContent
          },
          finish_reason: chunks[chunks.length - 1]?.choices?.[0]?.finish_reason || 'stop'
        }],
        usage: usage || this.estimateUsage(params.messages, fullContent, model),
        stream_chunks: chunks
      };

    } catch (error) {
      logger.error('Streaming response failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create embeddings
   */
  async createEmbeddings(params, options = {}) {
    this.validateInitialization();
    
    const { retries = this.maxRetries } = options;
    
    await this.applyRateLimit();
    
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.client.embeddings.create({
          model: params.model || 'text-embedding-3-small',
          input: params.input,
          encoding_format: params.encoding_format || 'float',
          dimensions: params.dimensions
        });

        logger.debug('OpenAI embeddings created successfully', {
          model: response.model,
          inputCount: Array.isArray(params.input) ? params.input.length : 1
        });

        return response;

      } catch (error) {
        lastError = error;
        
        if (!this.isRetryableError(error) || attempt === retries) {
          break;
        }
        
        const delay = this.calculateRetryDelay(attempt);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Optimize parameters for cost efficiency
   */
  optimizeParameters(params) {
    const optimized = { ...params };
    
    // Use cost-effective model if not specified
    if (!optimized.model) {
      optimized.model = 'gpt-4o-mini'; // Most cost-effective option
    }
    
    // Optimize max_tokens
    if (!optimized.max_tokens) {
      const modelConfig = this.modelConfigs[optimized.model];
      if (modelConfig) {
        // Use 25% of max tokens as default for cost optimization
        optimized.max_tokens = Math.min(1024, Math.floor(modelConfig.maxTokens * 0.25));
      }
    }
    
    // Optimize temperature for more deterministic responses (saves retries)
    if (optimized.temperature === undefined) {
      optimized.temperature = 0.3;
    }
    
    return optimized;
  }

  /**
   * Apply rate limiting
   */
  async applyRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delayNeeded = this.rateLimitDelay - timeSinceLastRequest;
      await this.sleep(delayNeeded);
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    // Rate limit errors
    if (error.status === 429) return true;
    
    // Server errors
    if (error.status >= 500) return true;
    
    // Timeout errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
    
    // Specific OpenAI error types
    if (error.type === 'server_error') return true;
    if (error.type === 'timeout') return true;
    
    return false;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt) {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = baseDelay * Math.pow(2, attempt);
    return Math.min(delay, maxDelay);
  }

  /**
   * Estimate token usage for streaming responses
   */
  estimateUsage(messages, response, model) {
    // Simple estimation - in production you'd want more accurate counting
    const inputText = messages.map(m => m.content).join(' ');
    const inputTokens = Math.ceil(inputText.length / 4); // Rough estimation
    const outputTokens = Math.ceil(response.length / 4);
    
    return {
      prompt_tokens: inputTokens,
      completion_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens
    };
  }

  /**
   * Track usage metrics
   */
  trackUsage(usage, duration, model) {
    const modelConfig = this.modelConfigs[model] || {};
    
    const cost = 
      (usage.prompt_tokens / 1000) * (modelConfig.costPer1KInputTokens || 0) +
      (usage.completion_tokens / 1000) * (modelConfig.costPer1KOutputTokens || 0);

    logger.debug('OpenAI usage tracked', {
      model,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      estimatedCost: cost,
      duration
    });
  }

  /**
   * Validate client initialization
   */
  validateInitialization() {
    if (!this.isInitialized || !this.client) {
      throw new Error('OpenAI Client not initialized. Call initialize() first.');
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get client status and metrics
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      model: this.config.model,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) : 0,
      lastRequestTime: this.lastRequestTime,
      rateLimitDelay: this.rateLimitDelay,
      maxRetries: this.maxRetries,
      timeout: this.timeout
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      logger.info('Cleaning up OpenAI Client...');
      
      this.client = null;
      this.isInitialized = false;
      
      logger.info('OpenAI Client cleanup completed');
      
    } catch (error) {
      logger.error('Error during OpenAI Client cleanup', {
        error: error.message
      });
    }
  }
}