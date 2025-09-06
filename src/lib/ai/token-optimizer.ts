import { logInfo, logWarn } from '../logger';

export interface TokenOptimizationConfig {
  maxTokens: number;
  reserveTokens: number;
  compressionRatio: number;
  priorityWeights: {
    system: number;
    user: number;
    assistant: number;
    recent: number;
    relevant: number;
  };
}

export interface OptimizedPrompt {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    tokens: number;
    priority: number;
  }>;
  totalTokens: number;
  compressionApplied: boolean;
  optimizationSummary: {
    originalTokens: number;
    reducedTokens: number;
    reductionPercentage: number;
    messagesRemoved: number;
    compressionTechniques: string[];
  };
}

export interface MessagePriority {
  messageIndex: number;
  priority: number;
  factors: {
    recency: number;
    role: number;
    relevance: number;
    length: number;
    keywords: number;
  };
}

export class TokenOptimizer {
  private config: TokenOptimizationConfig;
  private businessKeywords: Set<string>;
  private stopWords: Set<string>;

  constructor(config?: Partial<TokenOptimizationConfig>) {
    this.config = {
      maxTokens: 3000,
      reserveTokens: 500,
      compressionRatio: 0.7,
      priorityWeights: {
        system: 0.9,
        user: 0.8,
        assistant: 0.6,
        recent: 0.8,
        relevant: 0.9
      },
      ...config
    };

    this.businessKeywords = new Set([
      'inventory', 'demand', 'supply', 'forecast', 'supplier', 'cost', 'revenue',
      'profit', 'roi', 'budget', 'pricing', 'quality', 'delivery', 'lead time',
      'capacity', 'efficiency', 'performance', 'analytics', 'dashboard', 'kpi',
      'working capital', 'cash flow', 'receivables', 'payables', 'variance',
      'optimization', 'recommendation', 'risk', 'opportunity', 'trend'
    ]);

    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'among', 'is', 'are',
      'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can'
    ]);
  }

  optimizePrompt(
    messages: Array<{ role: string; content: string }>,
    maxTokens?: number
  ): OptimizedPrompt {
    const targetTokens = maxTokens || this.config.maxTokens;
    const originalMessages = messages.map(msg => ({
      ...msg,
      role: msg.role as 'system' | 'user' | 'assistant',
      tokens: this.estimateTokens(msg.content),
      priority: 0
    }));

    const originalTokens = originalMessages.reduce((sum, msg) => sum + msg.tokens, 0);

    if (originalTokens <= targetTokens) {
      return {
        messages: originalMessages,
        totalTokens: originalTokens,
        compressionApplied: false,
        optimizationSummary: {
          originalTokens,
          reducedTokens: originalTokens,
          reductionPercentage: 0,
          messagesRemoved: 0,
          compressionTechniques: []
        }
      };
    }

    logInfo('Optimizing prompt tokens', { originalTokens, targetTokens });

    // Step 1: Calculate message priorities
    const prioritizedMessages = this.calculateMessagePriorities(originalMessages);

    // Step 2: Apply compression techniques
    let optimizedMessages = this.applyCompressionTechniques(prioritizedMessages);

    // Step 3: Remove low-priority messages if still over budget
    if (this.getTotalTokens(optimizedMessages) > targetTokens) {
      optimizedMessages = this.removeMessagesByPriority(optimizedMessages, targetTokens);
    }

    // Step 4: Final compression if still needed
    if (this.getTotalTokens(optimizedMessages) > targetTokens) {
      optimizedMessages = this.aggressiveCompression(optimizedMessages, targetTokens);
    }

    const finalTokens = this.getTotalTokens(optimizedMessages);
    const compressionTechniques = this.getAppliedTechniques(originalMessages, optimizedMessages);

    return {
      messages: optimizedMessages,
      totalTokens: finalTokens,
      compressionApplied: true,
      optimizationSummary: {
        originalTokens,
        reducedTokens: finalTokens,
        reductionPercentage: Math.round(((originalTokens - finalTokens) / originalTokens) * 100),
        messagesRemoved: originalMessages.length - optimizedMessages.length,
        compressionTechniques
      }
    };
  }

  private calculateMessagePriorities(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string; tokens: number }>
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string; tokens: number; priority: number }> {
    return messages.map((msg, index) => {
      const factors = {
        recency: this.calculateRecencyScore(index, messages.length),
        role: this.getRoleScore(msg.role),
        relevance: this.calculateRelevanceScore(msg.content),
        length: this.calculateLengthScore(msg.tokens),
        keywords: this.calculateKeywordScore(msg.content)
      };

      const priority = 
        factors.recency * this.config.priorityWeights.recent +
        factors.role * this.config.priorityWeights[msg.role] +
        factors.relevance * this.config.priorityWeights.relevant +
        factors.length * 0.1 +
        factors.keywords * 0.2;

      return { ...msg, priority };
    });
  }

  private calculateRecencyScore(index: number, totalMessages: number): number {
    // More recent messages (higher index) get higher scores
    return Math.pow(index / (totalMessages - 1), 0.5);
  }

  private getRoleScore(role: 'system' | 'user' | 'assistant'): number {
    const scores = { system: 1.0, user: 0.9, assistant: 0.7 };
    return scores[role];
  }

  private calculateRelevanceScore(content: string): number {
    const words = this.tokenizeContent(content);
    const relevantWords = words.filter(word => 
      this.businessKeywords.has(word.toLowerCase())
    );
    
    return Math.min(relevantWords.length / Math.max(words.length, 1), 1.0);
  }

  private calculateLengthScore(tokens: number): number {
    // Prefer messages that are not too short or too long
    const optimal = 50;
    const penalty = Math.abs(tokens - optimal) / optimal;
    return Math.max(0, 1 - penalty);
  }

  private calculateKeywordScore(content: string): number {
    const words = this.tokenizeContent(content);
    const keywordCount = words.filter(word => 
      this.businessKeywords.has(word.toLowerCase())
    ).length;
    
    return Math.min(keywordCount / 10, 1.0);
  }

  private applyCompressionTechniques(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string; tokens: number; priority: number }>
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string; tokens: number; priority: number }> {
    return messages.map(msg => ({
      ...msg,
      content: this.compressContent(msg.content),
      tokens: this.estimateTokens(this.compressContent(msg.content))
    }));
  }

  private compressContent(content: string): string {
    let compressed = content;

    // Remove excessive whitespace
    compressed = compressed.replace(/\s+/g, ' ').trim();

    // Remove redundant phrases
    compressed = compressed.replace(/\b(please|thank you|thanks)\b/gi, '');
    compressed = compressed.replace(/\b(I think|I believe|it seems|perhaps)\b/gi, '');

    // Abbreviate common business terms
    const abbreviations: Record<string, string> = {
      'inventory': 'inv',
      'management': 'mgmt',
      'analysis': 'analysis',
      'recommendation': 'rec',
      'opportunity': 'opp',
      'performance': 'perf',
      'optimization': 'opt'
    };

    Object.entries(abbreviations).forEach(([full, abbrev]) => {
      compressed = compressed.replace(new RegExp(`\\b${full}\\b`, 'gi'), abbrev);
    });

    // Remove filler words but preserve business keywords
    const words = compressed.split(' ');
    const filtered = words.filter(word => {
      const lower = word.toLowerCase();
      return !this.stopWords.has(lower) || this.businessKeywords.has(lower);
    });

    compressed = filtered.join(' ');

    // Ensure minimum readability
    if (compressed.length < content.length * 0.3) {
      return content; // Don't over-compress
    }

    return compressed;
  }

  private removeMessagesByPriority(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string; tokens: number; priority: number }>,
    targetTokens: number
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string; tokens: number; priority: number }> {
    // Sort by priority (descending) and keep highest priority messages
    const sorted = [...messages].sort((a, b) => b.priority - a.priority);
    const kept: typeof messages = [];
    let tokenCount = 0;

    for (const message of sorted) {
      if (tokenCount + message.tokens <= targetTokens) {
        kept.push(message);
        tokenCount += message.tokens;
      } else if (message.role === 'system') {
        // Always try to keep system messages, even if we go slightly over budget
        kept.push(message);
        tokenCount += message.tokens;
      }
    }

    // Restore original order
    return kept.sort((a, b) => {
      const aIndex = messages.findIndex(msg => msg === a);
      const bIndex = messages.findIndex(msg => msg === b);
      return aIndex - bIndex;
    });
  }

  private aggressiveCompression(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string; tokens: number; priority: number }>,
    targetTokens: number
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string; tokens: number; priority: number }> {
    const compressionRatio = targetTokens / this.getTotalTokens(messages);
    
    return messages.map(msg => {
      const targetLength = Math.floor(msg.content.length * compressionRatio);
      const compressed = this.truncateIntelligently(msg.content, targetLength);
      
      return {
        ...msg,
        content: compressed,
        tokens: this.estimateTokens(compressed)
      };
    });
  }

  private truncateIntelligently(content: string, targetLength: number): string {
    if (content.length <= targetLength) return content;

    // Try to truncate at sentence boundaries
    const sentences = content.split(/[.!?]+/);
    let result = '';
    
    for (const sentence of sentences) {
      if ((result + sentence).length <= targetLength) {
        result += sentence + '.';
      } else {
        break;
      }
    }

    if (result.length === 0) {
      // Fallback: truncate at word boundaries
      const words = content.split(' ');
      result = '';
      
      for (const word of words) {
        if ((result + ' ' + word).length <= targetLength) {
          result += (result ? ' ' : '') + word;
        } else {
          break;
        }
      }
    }

    return result || content.substring(0, targetLength);
  }

  private getTotalTokens(messages: Array<{ tokens: number }>): number {
    return messages.reduce((sum, msg) => sum + msg.tokens, 0);
  }

  private getAppliedTechniques(
    original: Array<{ content: string }>,
    optimized: Array<{ content: string }>
  ): string[] {
    const techniques: string[] = [];
    
    if (original.length > optimized.length) {
      techniques.push('message_removal');
    }
    
    const originalLength = original.reduce((sum, msg) => sum + msg.content.length, 0);
    const optimizedLength = optimized.reduce((sum, msg) => sum + msg.content.length, 0);
    
    if (optimizedLength < originalLength * 0.8) {
      techniques.push('content_compression');
    }
    
    if (optimizedLength < originalLength * 0.6) {
      techniques.push('aggressive_truncation');
    }

    return techniques;
  }

  private tokenizeContent(content: string): string[] {
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private estimateTokens(text: string): number {
    // More accurate token estimation
    const chars = text.length;
    const words = text.split(/\s+/).length;
    const punctuation = (text.match(/[^\w\s]/g) || []).length;
    
    // GPT models generally use ~4 characters per token, but varies
    const charBasedEstimate = Math.ceil(chars / 4);
    const wordBasedEstimate = Math.ceil(words * 1.3); // Average ~1.3 tokens per word
    
    // Use the higher estimate for safety
    return Math.max(charBasedEstimate, wordBasedEstimate) + Math.ceil(punctuation / 4);
  }

  buildSystemPrompt(
    basePrompt: string,
    context: {
      userRole?: string;
      currentMode?: string;
      availableData?: string[];
      recentActions?: string[];
    },
    maxTokens?: number
  ): string {
    const systemPromptParts = [basePrompt];

    if (context.userRole) {
      systemPromptParts.push(`User role: ${context.userRole}`);
    }

    if (context.currentMode) {
      systemPromptParts.push(`Current mode: ${context.currentMode}`);
    }

    if (context.availableData?.length) {
      systemPromptParts.push(`Available data: ${context.availableData.join(', ')}`);
    }

    if (context.recentActions?.length) {
      systemPromptParts.push(`Recent actions: ${context.recentActions.slice(-3).join('; ')}`);
    }

    let systemPrompt = systemPromptParts.join('\n\n');
    const targetTokens = maxTokens || Math.floor(this.config.maxTokens * 0.3); // Reserve 30% for system

    if (this.estimateTokens(systemPrompt) > targetTokens) {
      systemPrompt = this.truncateIntelligently(systemPrompt, targetTokens * 4); // Rough char estimate
    }

    return systemPrompt;
  }

  optimizeQueryForEmbeddings(query: string, maxLength: number = 200): string {
    // Remove stop words and keep only relevant terms for embeddings
    const words = this.tokenizeContent(query);
    const filtered = words.filter(word => 
      !this.stopWords.has(word) || this.businessKeywords.has(word)
    );

    let optimized = filtered.join(' ');
    
    if (optimized.length > maxLength) {
      // Prioritize business keywords
      const businessWords = filtered.filter(word => this.businessKeywords.has(word));
      const otherWords = filtered.filter(word => !this.businessKeywords.has(word));
      
      optimized = businessWords.join(' ');
      
      // Add other words if space allows
      for (const word of otherWords) {
        if ((optimized + ' ' + word).length <= maxLength) {
          optimized += ' ' + word;
        } else {
          break;
        }
      }
    }

    return optimized || query.substring(0, maxLength);
  }
}

export const defaultTokenOptimizer = new TokenOptimizer();