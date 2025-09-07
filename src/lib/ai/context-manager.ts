import { logInfo, logWarn, logError } from '../logger';

export interface ConversationContext {
  id: string;
  userId?: string;
  sessionId: string;
  messages: ChatMessage[];
  metadata: {
    createdAt: Date;
    lastActivity: Date;
    totalTokens: number;
    totalCost: number;
    topic?: string;
    intent?: string;
    priority: 'low' | 'medium' | 'high';
  };
  state: {
    currentMode: 'chat' | 'analysis' | 'forecasting' | 'recommendation';
    activeFilters: Record<string, any>;
    selectedMetrics: string[];
    timeRange: { start: Date; end: Date };
    context: Record<string, any>;
  };
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokens?: number;
  metadata?: {
    intent?: string;
    entities?: Array<{ type: string; value: string; confidence: number }>;
    sentiment?: 'positive' | 'negative' | 'neutral';
    confidence?: number;
  };
}

export interface ContextSummary {
  keyTopics: string[];
  entities: Array<{ type: string; value: string; frequency: number }>;
  intent: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  summary: string;
  tokensSaved: number;
}

export class ContextManager {
  private contexts: Map<string, ConversationContext> = new Map();
  private readonly maxContextLength: number;
  private readonly summarizationThreshold: number;
  private readonly maxContextAge: number; // milliseconds

  constructor(
    maxContextLength: number = 4000,
    summarizationThreshold: number = 8000,
    maxContextAge: number = 24 * 60 * 60 * 1000 // 24 hours
  ) {
    this.maxContextLength = maxContextLength;
    this.summarizationThreshold = summarizationThreshold;
    this.maxContextAge = maxContextAge;
    
    // Cleanup old contexts every hour
    setInterval(() => this.cleanupOldContexts(), 60 * 60 * 1000);
  }

  createContext(sessionId: string, userId?: string): ConversationContext {
    const context: ConversationContext = {
      id: `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      sessionId,
      messages: [],
      metadata: {
        createdAt: new Date(),
        lastActivity: new Date(),
        totalTokens: 0,
        totalCost: 0,
        priority: 'medium'
      },
      state: {
        currentMode: 'chat',
        activeFilters: {},
        selectedMetrics: [],
        timeRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          end: new Date()
        },
        context: {}
      }
    };

    this.contexts.set(context.id, context);
    logInfo('Created new conversation context', { contextId: context.id, sessionId });
    
    return context;
  }

  getContext(contextId: string): ConversationContext | undefined {
    return this.contexts.get(contextId);
  }

  addMessage(contextId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error(`Context ${contextId} not found`);
    }

    const chatMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    context.messages.push(chatMessage);
    context.metadata.lastActivity = new Date();
    
    if (chatMessage.tokens) {
      context.metadata.totalTokens += chatMessage.tokens;
    }

    // Check if context needs summarization
    if (context.metadata.totalTokens > this.summarizationThreshold) {
      this.summarizeContext(contextId);
    }

    logInfo('Added message to context', { 
      contextId, 
      messageId: chatMessage.id, 
      role: chatMessage.role,
      tokens: chatMessage.tokens 
    });

    return chatMessage;
  }

  updateContextState(contextId: string, updates: Partial<ConversationContext['state']>): void {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error(`Context ${contextId} not found`);
    }

    context.state = { ...context.state, ...updates };
    context.metadata.lastActivity = new Date();

    logInfo('Updated context state', { contextId, updates });
  }

  getRecentMessages(contextId: string, limit: number = 10): ChatMessage[] {
    const context = this.contexts.get(contextId);
    if (!context) {
      return [];
    }

    return context.messages.slice(-limit);
  }

  getMessagesInTokenBudget(contextId: string, maxTokens: number): ChatMessage[] {
    const context = this.contexts.get(contextId);
    if (!context) {
      return [];
    }

    const messages: ChatMessage[] = [];
    let tokenCount = 0;

    // Start from most recent messages and work backwards
    for (let i = context.messages.length - 1; i >= 0; i--) {
      const message = context.messages[i];
      const messageTokens = message.tokens || this.estimateTokens(message.content);
      
      if (tokenCount + messageTokens > maxTokens) {
        break;
      }

      messages.unshift(message);
      tokenCount += messageTokens;
    }

    return messages;
  }

  summarizeContext(contextId: string): ContextSummary {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error(`Context ${contextId} not found`);
    }

    // Simple summarization logic (in a real implementation, this would use AI)
    const keyTopics = this.extractKeyTopics(context.messages);
    const entities = this.extractEntities(context.messages);
    const intent = this.detectIntent(context.messages);
    const sentiment = this.analyzeSentiment(context.messages);
    
    const summary = this.generateSummary(context.messages, keyTopics, entities, intent);
    
    const originalTokens = context.metadata.totalTokens;
    const summaryTokens = this.estimateTokens(summary);
    
    // Keep only the last few messages and the summary
    const recentMessages = context.messages.slice(-5);
    const systemSummaryMessage: ChatMessage = {
      id: `summary_${Date.now()}`,
      role: 'system',
      content: `[CONTEXT_SUMMARY] ${summary}`,
      timestamp: new Date(),
      tokens: summaryTokens
    };

    context.messages = [systemSummaryMessage, ...recentMessages];
    context.metadata.totalTokens = summaryTokens + recentMessages.reduce((sum, msg) => 
      sum + (msg.tokens || this.estimateTokens(msg.content)), 0
    );

    const contextSummary: ContextSummary = {
      keyTopics,
      entities,
      intent,
      sentiment,
      summary,
      tokensSaved: originalTokens - context.metadata.totalTokens
    };

    logInfo('Summarized context', { 
      contextId, 
      originalTokens, 
      newTokens: context.metadata.totalTokens,
      tokensSaved: contextSummary.tokensSaved 
    });

    return contextSummary;
  }

  private extractKeyTopics(messages: ChatMessage[]): string[] {
    const topics = new Set<string>();
    const businessKeywords = [
      'inventory', 'supply', 'demand', 'forecast', 'supplier', 'cost', 'revenue',
      'profit', 'cash flow', 'working capital', 'roi', 'budget', 'pricing',
      'quality', 'delivery', 'lead time', 'capacity', 'efficiency', 'performance'
    ];

    messages.forEach(message => {
      if (message.role === 'user' || message.role === 'assistant') {
        const content = message.content.toLowerCase();
        businessKeywords.forEach(keyword => {
          if (content.includes(keyword)) {
            topics.add(keyword);
          }
        });
      }
    });

    return Array.from(topics).slice(0, 10); // Top 10 topics
  }

  private extractEntities(messages: ChatMessage[]): Array<{ type: string; value: string; frequency: number }> {
    const entities = new Map<string, { type: string; frequency: number }>();
    
    // Simple regex patterns for business entities
    const patterns = {
      date: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g,
      currency: /\$[\d,]+(?:\.\d{2})?/g,
      percentage: /\d+(?:\.\d+)?%/g,
      quantity: /\b\d+(?:,\d{3})*\s*(?:units?|pieces?|items?)\b/g,
      supplier: /\b[A-Z][a-zA-Z\s&]+(?:Ltd|Inc|Corp|Company|Co\.)\b/g
    };

    messages.forEach(message => {
      if (message.role === 'user' || message.role === 'assistant') {
        Object.entries(patterns).forEach(([type, pattern]) => {
          const matches = message.content.match(pattern);
          if (matches) {
            matches.forEach(match => {
              const key = `${type}:${match}`;
              if (entities.has(key)) {
                entities.get(key)!.frequency++;
              } else {
                entities.set(key, { type, frequency: 1 });
              }
            });
          }
        });
      }
    });

    return Array.from(entities.entries())
      .map(([value, info]) => ({ 
        type: info.type, 
        value: value.split(':')[1], 
        frequency: info.frequency 
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);
  }

  private detectIntent(messages: ChatMessage[]): string {
    const userMessages = messages.filter(msg => msg.role === 'user');
    if (userMessages.length === 0) return 'unknown';

    const recentContent = userMessages.slice(-3).map(msg => msg.content.toLowerCase()).join(' ');

    if (recentContent.includes('forecast') || recentContent.includes('predict')) {
      return 'forecasting';
    }
    if (recentContent.includes('recommend') || recentContent.includes('suggest')) {
      return 'recommendation';
    }
    if (recentContent.includes('analyze') || recentContent.includes('analysis')) {
      return 'analysis';
    }
    if (recentContent.includes('report') || recentContent.includes('dashboard')) {
      return 'reporting';
    }
    
    return 'general_inquiry';
  }

  private analyzeSentiment(messages: ChatMessage[]): 'positive' | 'negative' | 'neutral' {
    const userMessages = messages.filter(msg => msg.role === 'user');
    if (userMessages.length === 0) return 'neutral';

    const positiveWords = ['good', 'great', 'excellent', 'improve', 'better', 'increase', 'grow'];
    const negativeWords = ['bad', 'poor', 'decrease', 'decline', 'problem', 'issue', 'concern'];

    let positiveScore = 0;
    let negativeScore = 0;

    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      positiveWords.forEach(word => {
        if (content.includes(word)) positiveScore++;
      });
      negativeWords.forEach(word => {
        if (content.includes(word)) negativeScore++;
      });
    });

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  private generateSummary(
    messages: ChatMessage[], 
    topics: string[], 
    entities: Array<{ type: string; value: string; frequency: number }>,
    intent: string
  ): string {
    const userMessages = messages.filter(msg => msg.role === 'user').length;
    const assistantMessages = messages.filter(msg => msg.role === 'assistant').length;
    
    const topTopics = topics.slice(0, 5).join(', ');
    const topEntities = entities.slice(0, 5).map(e => e.value).join(', ');

    return `Conversation with ${userMessages} user messages and ${assistantMessages} responses. ` +
           `Primary intent: ${intent}. Key topics discussed: ${topTopics}. ` +
           `Notable entities: ${topEntities}. Context maintained for efficient querying.`;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private cleanupOldContexts(): void {
    const cutoffTime = Date.now() - this.maxContextAge;
    let cleaned = 0;

    for (const [contextId, context] of this.contexts.entries()) {
      if (context.metadata.lastActivity.getTime() < cutoffTime) {
        this.contexts.delete(contextId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logInfo('Cleaned up old contexts', { cleaned, total: this.contexts.size });
    }
  }

  getActiveContexts(): ConversationContext[] {
    return Array.from(this.contexts.values())
      .sort((a, b) => b.metadata.lastActivity.getTime() - a.metadata.lastActivity.getTime());
  }

  deleteContext(contextId: string): boolean {
    const deleted = this.contexts.delete(contextId);
    if (deleted) {
      logInfo('Deleted context', { contextId });
    }
    return deleted;
  }

  getContextStats(): {
    totalContexts: number;
    totalMessages: number;
    totalTokens: number;
    averageTokensPerContext: number;
    oldestContext: Date | null;
    newestContext: Date | null;
  } {
    const contexts = Array.from(this.contexts.values());
    
    return {
      totalContexts: contexts.length,
      totalMessages: contexts.reduce((sum, ctx) => sum + ctx.messages.length, 0),
      totalTokens: contexts.reduce((sum, ctx) => sum + ctx.metadata.totalTokens, 0),
      averageTokensPerContext: contexts.length > 0 
        ? contexts.reduce((sum, ctx) => sum + ctx.metadata.totalTokens, 0) / contexts.length 
        : 0,
      oldestContext: contexts.length > 0 
        ? new Date(Math.min(...contexts.map(ctx => ctx.metadata.createdAt.getTime())))
        : null,
      newestContext: contexts.length > 0 
        ? new Date(Math.max(...contexts.map(ctx => ctx.metadata.createdAt.getTime())))
        : null
    };
  }
}

export const defaultContextManager = new ContextManager();