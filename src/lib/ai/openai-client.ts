import OpenAI from 'openai';
import { logInfo, logWarn, logError } from '../logger';

export interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
  project?: string;
  maxRetries: number;
  timeout: number;
  rateLimitRpm: number;
  rateLimitTpm: number;
  costBudget: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  model: string;
  timestamp: Date;
}

export interface AIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: TokenUsage;
  responseTime: number;
  retryCount: number;
}

export interface StreamingResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
      function_call?: any;
      tool_calls?: any[];
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class RateLimiter {
  private requestQueue: Array<{ timestamp: number; tokens: number }> = [];
  private readonly windowMs = 60000; // 1 minute window

  constructor(
    private maxRequestsPerMinute: number,
    private maxTokensPerMinute: number
  ) {}

  async canMakeRequest(estimatedTokens: number): Promise<boolean> {
    const now = Date.now();
    
    // Remove requests outside the window
    this.requestQueue = this.requestQueue.filter(
      req => now - req.timestamp < this.windowMs
    );

    // Check rate limits
    const requestsInWindow = this.requestQueue.length;
    const tokensInWindow = this.requestQueue.reduce((sum, req) => sum + req.tokens, 0);

    return (
      requestsInWindow < this.maxRequestsPerMinute &&
      tokensInWindow + estimatedTokens < this.maxTokensPerMinute
    );
  }

  recordRequest(tokens: number): void {
    this.requestQueue.push({
      timestamp: Date.now(),
      tokens
    });
  }

  async waitForAvailability(estimatedTokens: number): Promise<void> {
    while (!(await this.canMakeRequest(estimatedTokens))) {
      logInfo('Rate limit reached, waiting...', { estimatedTokens });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

class CostTracker {
  private totalCost = 0;
  private monthlyUsage: Map<string, number> = new Map();
  private modelPricing = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'text-embedding-3-small': { input: 0.00002, output: 0 },
    'text-embedding-3-large': { input: 0.00013, output: 0 }
  };

  calculateCost(usage: Omit<TokenUsage, 'cost' | 'timestamp'>): number {
    const pricing = this.modelPricing[usage.model as keyof typeof this.modelPricing];
    if (!pricing) {
      logWarn('Unknown model pricing', { model: usage.model });
      return 0;
    }

    const inputCost = (usage.promptTokens / 1000) * pricing.input;
    const outputCost = (usage.completionTokens / 1000) * pricing.output;
    
    return inputCost + outputCost;
  }

  recordUsage(usage: TokenUsage): void {
    this.totalCost += usage.cost;
    
    const monthKey = new Date().toISOString().substring(0, 7); // YYYY-MM
    this.monthlyUsage.set(monthKey, (this.monthlyUsage.get(monthKey) || 0) + usage.cost);
  }

  getTotalCost(): number {
    return this.totalCost;
  }

  getMonthlyUsage(): Map<string, number> {
    return new Map(this.monthlyUsage);
  }

  checkBudget(budget: number): { withinBudget: boolean; usage: number; remaining: number } {
    const monthKey = new Date().toISOString().substring(0, 7);
    const monthlySpend = this.monthlyUsage.get(monthKey) || 0;
    
    return {
      withinBudget: monthlySpend <= budget,
      usage: monthlySpend,
      remaining: Math.max(0, budget - monthlySpend)
    };
  }
}

export class OpenAIClient {
  private client: OpenAI;
  private rateLimiter: RateLimiter;
  private costTracker: CostTracker;
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = config;
    
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      organization: config.organization,
      project: config.project,
      maxRetries: 0, // We handle retries ourselves
      timeout: config.timeout
    });

    this.rateLimiter = new RateLimiter(config.rateLimitRpm, config.rateLimitTpm);
    this.costTracker = new CostTracker();
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries,
    baseDelay: number = 1000
  ): Promise<{ result: T; retryCount: number }> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        return { result, retryCount: attempt };
      } catch (error: any) {
        lastError = error;
        
        if (attempt === maxRetries) break;
        
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + (() => { throw new Error("REAL DATA REQUIRED") })() * 1000;
        
        logWarn('API request failed, retrying...', {
          attempt: attempt + 1,
          maxRetries,
          delay,
          error: error.message
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  private estimateTokens(prompt: string, model: string = 'gpt-3.5-turbo'): number {
    // Rough estimation: ~4 characters per token for GPT models
    const estimatedPromptTokens = Math.ceil(prompt.length / 4);
    const estimatedCompletionTokens = Math.ceil(estimatedPromptTokens * 0.5); // Estimate 50% of prompt length
    
    return estimatedPromptTokens + estimatedCompletionTokens;
  }

  async createChatCompletion(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    options: Partial<OpenAI.Chat.Completions.ChatCompletionCreateParams> = {}
  ): Promise<AIResponse<OpenAI.Chat.Completions.ChatCompletion>> {
    const startTime = Date.now();
    const model = options.model || 'gpt-3.5-turbo';
    
    try {
      // Check budget
      const budgetCheck = this.costTracker.checkBudget(this.config.costBudget);
      if (!budgetCheck.withinBudget) {
        logError('AI budget exceeded', budgetCheck);
        return {
          success: false,
          error: 'Monthly AI budget exceeded',
          responseTime: 0,
          retryCount: 0
        };
      }

      // Estimate tokens and check rate limits
      const promptText = messages.map(m => typeof m.content === 'string' ? m.content : '').join(' ');
      const estimatedTokens = this.estimateTokens(promptText, model);
      
      await this.rateLimiter.waitForAvailability(estimatedTokens);

      const { result: completion, retryCount } = await this.executeWithRetry(async () => {
        return await this.client.chat.completions.create({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
          top_p: 0.9,
          frequency_penalty: 0,
          presence_penalty: 0,
          ...options
        });
      });

      const responseTime = Date.now() - startTime;

      // Record usage and costs
      if (completion.usage) {
        const tokenUsage: TokenUsage = {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
          cost: this.costTracker.calculateCost({
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
            model
          }),
          model,
          timestamp: new Date()
        };

        this.costTracker.recordUsage(tokenUsage);
        this.rateLimiter.recordRequest(tokenUsage.totalTokens);

        logInfo('OpenAI API call successful', {
          model,
          tokens: tokenUsage.totalTokens,
          cost: tokenUsage.cost,
          responseTime,
          retryCount
        });

        return {
          success: true,
          data: completion,
          usage: tokenUsage,
          responseTime,
          retryCount
        };
      }

      return {
        success: true,
        data: completion,
        responseTime,
        retryCount
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      logError('OpenAI API call failed', {
        error: error.message,
        model,
        responseTime
      });

      return {
        success: false,
        error: error.message,
        responseTime,
        retryCount: this.config.maxRetries
      };
    }
  }

  async createStreamingChatCompletion(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    options: Partial<OpenAI.Chat.Completions.ChatCompletionCreateParams> = {}
  ): Promise<AsyncIterable<StreamingResponse>> {
    const model = options.model || 'gpt-3.5-turbo';
    
    // Check budget and rate limits (same as regular completion)
    const budgetCheck = this.costTracker.checkBudget(this.config.costBudget);
    if (!budgetCheck.withinBudget) {
      throw new Error('Monthly AI budget exceeded');
    }

    const promptText = messages.map(m => typeof m.content === 'string' ? m.content : '').join(' ');
    const estimatedTokens = this.estimateTokens(promptText, model);
    
    await this.rateLimiter.waitForAvailability(estimatedTokens);

    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: true,
        ...options
      });

      // Record estimated usage immediately (will be corrected at the end if usage info is provided)
      this.rateLimiter.recordRequest(estimatedTokens);

      logInfo('OpenAI streaming API call initiated', {
        model,
        estimatedTokens
      });

      return stream as AsyncIterable<StreamingResponse>;

    } catch (error: any) {
      logError('OpenAI streaming API call failed', {
        error: error.message,
        model
      });
      throw error;
    }
  }

  async createEmbeddings(
    input: string | string[],
    model: string = 'text-embedding-3-small'
  ): Promise<AIResponse<OpenAI.Embeddings.CreateEmbeddingResponse>> {
    const startTime = Date.now();
    
    try {
      const budgetCheck = this.costTracker.checkBudget(this.config.costBudget);
      if (!budgetCheck.withinBudget) {
        return {
          success: false,
          error: 'Monthly AI budget exceeded',
          responseTime: 0,
          retryCount: 0
        };
      }

      const inputText = Array.isArray(input) ? input.join(' ') : input;
      const estimatedTokens = this.estimateTokens(inputText, model);
      
      await this.rateLimiter.waitForAvailability(estimatedTokens);

      const { result: embeddings, retryCount } = await this.executeWithRetry(async () => {
        return await this.client.embeddings.create({
          model,
          input,
          encoding_format: 'float'
        });
      });

      const responseTime = Date.now() - startTime;

      if (embeddings.usage) {
        const tokenUsage: TokenUsage = {
          promptTokens: embeddings.usage.prompt_tokens,
          completionTokens: 0,
          totalTokens: embeddings.usage.total_tokens,
          cost: this.costTracker.calculateCost({
            promptTokens: embeddings.usage.prompt_tokens,
            completionTokens: 0,
            totalTokens: embeddings.usage.total_tokens,
            model
          }),
          model,
          timestamp: new Date()
        };

        this.costTracker.recordUsage(tokenUsage);
        this.rateLimiter.recordRequest(tokenUsage.totalTokens);

        return {
          success: true,
          data: embeddings,
          usage: tokenUsage,
          responseTime,
          retryCount
        };
      }

      return {
        success: true,
        data: embeddings,
        responseTime,
        retryCount
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      logError('OpenAI embeddings call failed', {
        error: error.message,
        model,
        responseTime
      });

      return {
        success: false,
        error: error.message,
        responseTime,
        retryCount: this.config.maxRetries
      };
    }
  }

  getCostTracker(): CostTracker {
    return this.costTracker;
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const response = await this.createChatCompletion([
        { role: 'user', content: 'Hello' }
      ], { max_tokens: 5 });

      const budgetCheck = this.costTracker.checkBudget(this.config.costBudget);

      return {
        status: response.success ? 'healthy' : 'unhealthy',
        details: {
          apiResponse: response.success,
          budget: budgetCheck,
          totalCost: this.costTracker.getTotalCost(),
          rateLimitStatus: await this.rateLimiter.canMakeRequest(100)
        }
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message
        }
      };
    }
  }
}