/**
 * Claude AI Client Wrapper
 * 
 * Enterprise-grade wrapper for Anthropic Claude API with advanced features:
 * - Streaming support for long analyses
 * - Rate limiting and retry logic
 * - Token usage optimization
 * - Error handling and fallbacks
 * - Response caching strategies
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import Anthropic from '@anthropic-ai/sdk';
import { createLogger } from '../../../utils/logger.js';
import NodeCache from 'node-cache';

const logger = createLogger();

/**
 * Claude Client with Advanced Features
 */
export class ClaudeClient {
  constructor(config, auth) {
    this.config = config;
    this.auth = auth;
    this.client = null;
    this.isInitialized = false;
    
    // Response cache (TTL: 5 minutes)
    this.responseCache = new NodeCache({ 
      stdTTL: 300, 
      checkperiod: 60,
      maxKeys: 1000 
    });
    
    // Rate limiting
    this.rateLimiter = {
      requests: 0,
      windowStart: Date.now(),
      windowMs: 60000, // 1 minute window
      maxRequests: 50  // Conservative limit
    };
    
    // Retry configuration
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      exponentialBase: 2
    };
    
    // Usage tracking
    this.usage = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageResponseTime: 0,
      errorCount: 0
    };
  }

  /**
   * Initialize Claude client
   */
  async initialize() {
    try {
      if (!this.auth.isValid()) {
        await this.auth.validateApiKey();
      }

      this.client = new Anthropic({
        apiKey: this.auth.getApiKey(),
        timeout: 60000, // 60 seconds timeout
        maxRetries: 0   // We handle retries ourselves
      });

      this.isInitialized = true;
      
      logger.info('Claude client initialized successfully', {
        model: this.config.model,
        maxTokens: this.config.maxTokens
      });

    } catch (error) {
      this.isInitialized = false;
      logger.error('Failed to initialize Claude client', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Test connection to Claude API
   */
  async testConnection() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const response = await this.sendMessage({
        messages: [{ role: 'user', content: 'Hello' }],
        maxTokens: 10,
        model: 'claude-3-haiku-20240307' // Use fastest model for testing
      });

      return !!response;

    } catch (error) {
      logger.error('Claude connection test failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Send message to Claude with advanced features
   */
  async sendMessage(params) {
    const startTime = Date.now();
    
    try {
      // Check rate limiting
      await this.checkRateLimit();
      
      // Validate client
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Check cache
      const cacheKey = this.getCacheKey(params);
      const cachedResponse = this.responseCache.get(cacheKey);
      
      if (cachedResponse && params.enableCache !== false) {
        logger.info('Returning cached Claude response', { cacheKey });
        this.updateUsage(startTime, 0, true);
        return cachedResponse;
      }

      // Prepare request parameters
      const requestParams = this.prepareRequestParams(params);
      
      // Send request with retries
      const response = await this.sendWithRetry(requestParams);
      
      // Process response
      const processedResponse = this.processResponse(response, startTime);
      
      // Cache response if enabled
      if (params.enableCache !== false && requestParams.max_tokens > 100) {
        this.responseCache.set(cacheKey, processedResponse, 300); // 5 minutes
      }
      
      // Update usage statistics
      this.updateUsage(startTime, processedResponse.usage?.total_tokens || 0, false);
      
      return processedResponse;

    } catch (error) {
      this.usage.errorCount++;
      logger.error('Claude message send failed', {
        error: error.message,
        params: this.sanitizeParams(params)
      });
      throw error;
    }
  }

  /**
   * Send streaming message for long analyses
   */
  async sendStreamingMessage(params, onChunk) {
    const startTime = Date.now();
    
    try {
      await this.checkRateLimit();
      
      if (!this.isInitialized) {
        await this.initialize();
      }

      const requestParams = this.prepareRequestParams(params);
      requestParams.stream = true;

      let fullContent = '';
      let usage = null;

      const stream = await this.client.messages.create(requestParams);

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          const text = chunk.delta?.text || '';
          fullContent += text;
          
          if (onChunk) {
            onChunk({
              type: 'content',
              text: text,
              fullContent: fullContent
            });
          }
        } else if (chunk.type === 'message_delta') {
          usage = chunk.usage;
          
          if (onChunk) {
            onChunk({
              type: 'usage',
              usage: usage
            });
          }
        }
      }

      const response = {
        content: [{ type: 'text', text: fullContent }],
        usage: usage,
        model: requestParams.model,
        role: 'assistant',
        streaming: true
      };

      this.updateUsage(startTime, usage?.total_tokens || 0, false);
      
      return response;

    } catch (error) {
      this.usage.errorCount++;
      logger.error('Claude streaming message failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Prepare request parameters with optimizations
   */
  prepareRequestParams(params) {
    return {
      model: params.model || this.config.model || 'claude-3-5-sonnet-20241022',
      max_tokens: Math.min(
        params.maxTokens || this.config.maxTokens || 4096,
        8192 // Hard limit
      ),
      temperature: params.temperature !== undefined ? 
        params.temperature : (this.config.temperature || 0.7),
      messages: params.messages,
      system: params.system,
      tools: params.tools,
      tool_choice: params.tool_choice,
      metadata: {
        user_id: params.userId || 'anonymous',
        ...params.metadata
      }
    };
  }

  /**
   * Send request with retry logic
   */
  async sendWithRetry(params, retryCount = 0) {
    try {
      return await this.client.messages.create(params);
      
    } catch (error) {
      if (retryCount >= this.retryConfig.maxRetries) {
        throw error;
      }

      // Check if error is retryable
      if (this.isRetryableError(error)) {
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.exponentialBase, retryCount),
          this.retryConfig.maxDelay
        );

        logger.warn('Retrying Claude request', {
          retryCount: retryCount + 1,
          delay,
          error: error.message
        });

        await this.sleep(delay);
        return this.sendWithRetry(params, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    if (!error.status) return false;
    
    // Retry on rate limits, server errors, and timeouts
    return [429, 500, 502, 503, 504].includes(error.status);
  }

  /**
   * Process response and add metadata
   */
  processResponse(response, startTime) {
    const processingTime = Date.now() - startTime;
    
    return {
      ...response,
      metadata: {
        processingTime,
        model: response.model,
        usage: response.usage,
        timestamp: new Date().toISOString(),
        cached: false
      }
    };
  }

  /**
   * Check rate limiting
   */
  async checkRateLimit() {
    const now = Date.now();
    
    // Reset window if needed
    if (now - this.rateLimiter.windowStart >= this.rateLimiter.windowMs) {
      this.rateLimiter.requests = 0;
      this.rateLimiter.windowStart = now;
    }

    // Check if we've exceeded the limit
    if (this.rateLimiter.requests >= this.rateLimiter.maxRequests) {
      const waitTime = this.rateLimiter.windowMs - (now - this.rateLimiter.windowStart);
      
      logger.warn('Rate limit reached, waiting', { waitTime });
      await this.sleep(waitTime);
      
      // Reset after waiting
      this.rateLimiter.requests = 0;
      this.rateLimiter.windowStart = Date.now();
    }

    this.rateLimiter.requests++;
  }

  /**
   * Generate cache key for request
   */
  getCacheKey(params) {
    const key = JSON.stringify({
      model: params.model || this.config.model,
      messages: params.messages,
      system: params.system,
      temperature: params.temperature || this.config.temperature,
      maxTokens: params.maxTokens || this.config.maxTokens
    });
    
    // Create hash of the key
    return require('crypto').createHash('md5').update(key).digest('hex');
  }

  /**
   * Update usage statistics
   */
  updateUsage(startTime, tokens, cached) {
    const responseTime = Date.now() - startTime;
    
    this.usage.totalRequests++;
    this.usage.totalTokens += tokens;
    
    // Estimate cost (rough calculation)
    if (tokens > 0) {
      const costPerToken = 0.000015; // Approximate cost
      this.usage.totalCost += tokens * costPerToken;
    }
    
    // Update average response time
    this.usage.averageResponseTime = 
      (this.usage.averageResponseTime + responseTime) / 2;

    if (!cached) {
      logger.info('Claude request completed', {
        responseTime,
        tokens,
        totalRequests: this.usage.totalRequests,
        cached
      });
    }
  }

  /**
   * Get client status and usage statistics
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      rateLimiter: {
        ...this.rateLimiter,
        remainingRequests: Math.max(0, this.rateLimiter.maxRequests - this.rateLimiter.requests)
      },
      cache: {
        size: this.responseCache.keys().length,
        hits: this.responseCache.getStats().hits,
        misses: this.responseCache.getStats().misses
      },
      usage: { ...this.usage },
      config: {
        model: this.config.model,
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature
      }
    };
  }

  /**
   * Clear response cache
   */
  clearCache() {
    this.responseCache.flushAll();
    logger.info('Claude response cache cleared');
  }

  /**
   * Sanitize parameters for logging
   */
  sanitizeParams(params) {
    return {
      model: params.model,
      maxTokens: params.maxTokens,
      temperature: params.temperature,
      messageCount: params.messages?.length,
      hasSystem: !!params.system
    };
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.responseCache.close();
    this.isInitialized = false;
    
    logger.info('Claude client cleaned up', {
      totalRequests: this.usage.totalRequests,
      totalTokens: this.usage.totalTokens,
      totalCost: this.usage.totalCost.toFixed(4)
    });
  }
}