import { VectorStore, VectorDocument } from '../context/vector-store';
import { KnowledgeBase } from '../context/knowledge-base';
import { logInfo, logWarn, logError } from '../../logger';

/**
 * Enhanced Memory System for long-term learning and contextual awareness
 */

export interface MemoryEntry {
  id: string;
  type: 'episodic' | 'semantic' | 'procedural' | 'working';
  content: string;
  context: {
    userId?: string;
    sessionId?: string;
    timestamp: Date;
    location?: string;
    activity?: string;
    entities?: string[];
    emotions?: string[];
  };
  associations: string[]; // IDs of related memories
  importance: number; // 0-1 scale
  accessCount: number;
  lastAccessed: Date;
  decay: number; // Memory decay factor
  reinforcement: number; // How often memory is reinforced
  metadata?: Record<string, any>;
}

export interface LearningPattern {
  id: string;
  pattern: string;
  frequency: number;
  contexts: string[];
  outcomes: Array<{
    action: string;
    success: boolean;
    feedback?: string;
  }>;
  confidence: number;
  lastObserved: Date;
}

export interface UserPreference {
  userId: string;
  category: string;
  preference: any;
  confidence: number;
  observations: number;
  lastUpdated: Date;
}

export interface ProactiveSuggestion {
  id: string;
  type: 'action' | 'information' | 'warning' | 'optimization';
  suggestion: string;
  reason: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  context: Record<string, any>;
  actions?: Array<{
    label: string;
    action: string;
    params?: any;
  }>;
}

export class EnhancedMemorySystem {
  private vectorStore: VectorStore;
  private knowledgeBase: KnowledgeBase;
  private memories: Map<string, MemoryEntry> = new Map();
  private learningPatterns: Map<string, LearningPattern> = new Map();
  private userPreferences: Map<string, Map<string, UserPreference>> = new Map();
  private workingMemory: Map<string, any> = new Map();
  private memoryConsolidationInterval: NodeJS.Timeout | null = null;

  constructor(vectorStore: VectorStore, knowledgeBase: KnowledgeBase) {
    this.vectorStore = vectorStore;
    this.knowledgeBase = knowledgeBase;
    this.startMemoryConsolidation();
  }

  /**
   * Store episodic memory (specific events)
   */
  async storeEpisodicMemory(
    content: string,
    context: MemoryEntry['context'],
    importance: number = 0.5
  ): Promise<string> {
    const memoryId = `mem_episodic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const memory: MemoryEntry = {
      id: memoryId,
      type: 'episodic',
      content,
      context,
      associations: await this.findAssociations(content),
      importance,
      accessCount: 0,
      lastAccessed: new Date(),
      decay: 0.1, // Episodic memories decay faster
      reinforcement: 0
    };

    this.memories.set(memoryId, memory);
    
    // Store in vector store for similarity search
    await this.vectorStore.addDocument({
      id: memoryId,
      content,
      metadata: {
        type: 'memory',
        timestamp: context.timestamp,
        userId: context.userId,
        tags: ['episodic', ...(context.entities || [])],
        importance
      }
    });

    logInfo('Episodic memory stored', { memoryId, importance });
    
    return memoryId;
  }

  /**
   * Store semantic memory (facts and knowledge)
   */
  async storeSemanticMemory(
    content: string,
    category: string,
    confidence: number = 0.8
  ): Promise<string> {
    const memoryId = `mem_semantic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const memory: MemoryEntry = {
      id: memoryId,
      type: 'semantic',
      content,
      context: {
        timestamp: new Date()
      },
      associations: await this.findAssociations(content),
      importance: confidence,
      accessCount: 0,
      lastAccessed: new Date(),
      decay: 0.01, // Semantic memories decay slowly
      reinforcement: 0,
      metadata: { category, confidence }
    };

    this.memories.set(memoryId, memory);
    
    // Also add to knowledge base
    await this.knowledgeBase.addKnowledgeItem({
      id: memoryId,
      category: 'domain_knowledge',
      title: category,
      content,
      confidence,
      source: 'learned',
      tags: [category],
      examples: [],
      relatedItems: memory.associations
    });

    logInfo('Semantic memory stored', { memoryId, category, confidence });
    
    return memoryId;
  }

  /**
   * Store procedural memory (how to do things)
   */
  async storeProceduralMemory(
    procedure: string,
    steps: string[],
    context: Record<string, any>
  ): Promise<string> {
    const memoryId = `mem_procedural_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const content = `${procedure}: ${steps.join(' -> ')}`;
    
    const memory: MemoryEntry = {
      id: memoryId,
      type: 'procedural',
      content,
      context: {
        timestamp: new Date(),
        activity: procedure
      },
      associations: [],
      importance: 0.7,
      accessCount: 0,
      lastAccessed: new Date(),
      decay: 0.05, // Procedural memories have moderate decay
      reinforcement: 0,
      metadata: { procedure, steps, context }
    };

    this.memories.set(memoryId, memory);
    
    logInfo('Procedural memory stored', { memoryId, procedure });
    
    return memoryId;
  }

  /**
   * Update working memory (temporary, active information)
   */
  updateWorkingMemory(key: string, value: any): void {
    this.workingMemory.set(key, {
      value,
      timestamp: new Date(),
      accessCount: 1
    });

    // Limit working memory size
    if (this.workingMemory.size > 20) {
      // Remove least recently used
      const entries = Array.from(this.workingMemory.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      this.workingMemory.delete(entries[0][0]);
    }
  }

  /**
   * Retrieve memories by query
   */
  async retrieveMemories(
    query: string,
    options: {
      types?: MemoryEntry['type'][];
      limit?: number;
      minImportance?: number;
      userId?: string;
    } = {}
  ): Promise<MemoryEntry[]> {
    const { types, limit = 10, minImportance = 0, userId } = options;
    
    // Search in vector store
    const searchResults = await this.vectorStore.search(query, {
      topK: limit * 2, // Get more to filter
      filter: userId ? { userId } : undefined
    });

    const memories: MemoryEntry[] = [];
    
    for (const result of searchResults) {
      const memory = this.memories.get(result.document.id);
      
      if (memory && 
          memory.importance >= minImportance &&
          (!types || types.includes(memory.type))) {
        
        // Update access count and timestamp
        memory.accessCount++;
        memory.lastAccessed = new Date();
        
        // Reinforce important memories
        if (result.score > 0.8) {
          memory.reinforcement++;
        }
        
        memories.push(memory);
        
        if (memories.length >= limit) break;
      }
    }

    logInfo('Memories retrieved', { 
      query: query.substring(0, 50), 
      found: memories.length 
    });
    
    return memories;
  }

  /**
   * Learn from user interactions
   */
  async learnFromInteraction(
    userId: string,
    action: string,
    context: Record<string, any>,
    outcome: { success: boolean; feedback?: string }
  ): Promise<void> {
    // Identify or create pattern
    const patternKey = `${action}_${JSON.stringify(context).substring(0, 50)}`;
    const patternId = `pattern_${patternKey}`;
    
    let pattern = this.learningPatterns.get(patternId);
    
    if (!pattern) {
      pattern = {
        id: patternId,
        pattern: patternKey,
        frequency: 0,
        contexts: [],
        outcomes: [],
        confidence: 0.5,
        lastObserved: new Date()
      };
      this.learningPatterns.set(patternId, pattern);
    }
    
    // Update pattern
    pattern.frequency++;
    pattern.contexts.push(JSON.stringify(context));
    pattern.outcomes.push({ action, ...outcome });
    pattern.lastObserved = new Date();
    
    // Calculate confidence based on success rate
    const successCount = pattern.outcomes.filter(o => o.success).length;
    pattern.confidence = successCount / pattern.outcomes.length;
    
    // Store as episodic memory
    await this.storeEpisodicMemory(
      `User ${userId} performed ${action} with ${outcome.success ? 'success' : 'failure'}`,
      {
        userId,
        timestamp: new Date(),
        activity: action
      },
      outcome.success ? 0.7 : 0.3
    );
    
    // Update user preferences if pattern is strong
    if (pattern.frequency > 5 && pattern.confidence > 0.7) {
      await this.updateUserPreference(userId, action, context);
    }
    
    logInfo('Learned from interaction', { userId, action, success: outcome.success });
  }

  /**
   * Update user preferences
   */
  async updateUserPreference(
    userId: string,
    category: string,
    preference: any
  ): Promise<void> {
    if (!this.userPreferences.has(userId)) {
      this.userPreferences.set(userId, new Map());
    }
    
    const userPrefs = this.userPreferences.get(userId)!;
    let pref = userPrefs.get(category);
    
    if (!pref) {
      pref = {
        userId,
        category,
        preference,
        confidence: 0.5,
        observations: 0,
        lastUpdated: new Date()
      };
      userPrefs.set(category, pref);
    }
    
    // Update preference (simple averaging for now)
    pref.observations++;
    pref.confidence = Math.min(0.95, pref.confidence + 0.05);
    pref.lastUpdated = new Date();
    
    // Merge preferences intelligently
    if (typeof preference === 'object' && typeof pref.preference === 'object') {
      pref.preference = { ...pref.preference, ...preference };
    } else {
      pref.preference = preference;
    }
    
    logInfo('User preference updated', { userId, category });
  }

  /**
   * Get user preferences
   */
  getUserPreferences(userId: string): UserPreference[] {
    const userPrefs = this.userPreferences.get(userId);
    return userPrefs ? Array.from(userPrefs.values()) : [];
  }

  /**
   * Generate proactive suggestions
   */
  async generateProactiveSuggestions(
    userId: string,
    currentContext: Record<string, any>
  ): Promise<ProactiveSuggestion[]> {
    const suggestions: ProactiveSuggestion[] = [];
    
    // Get user preferences
    const preferences = this.getUserPreferences(userId);
    
    // Get relevant patterns
    const relevantPatterns = Array.from(this.learningPatterns.values())
      .filter(p => p.confidence > 0.7 && p.frequency > 3)
      .sort((a, b) => b.confidence - a.confidence);
    
    // Get recent memories
    const recentMemories = await this.retrieveMemories(
      JSON.stringify(currentContext),
      { userId, limit: 5, minImportance: 0.5 }
    );
    
    // Generate suggestions based on patterns
    for (const pattern of relevantPatterns.slice(0, 3)) {
      const successRate = pattern.outcomes.filter(o => o.success).length / pattern.outcomes.length;
      
      if (successRate > 0.8) {
        suggestions.push({
          id: `suggest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'action',
          suggestion: `Consider ${pattern.pattern.split('_')[0]}`,
          reason: `This action has ${Math.round(successRate * 100)}% success rate in similar contexts`,
          confidence: pattern.confidence,
          priority: pattern.confidence > 0.9 ? 'high' : 'medium',
          context: currentContext
        });
      }
    }
    
    // Generate warnings based on negative patterns
    const negativePatterns = relevantPatterns.filter(p => {
      const failureRate = p.outcomes.filter(o => !o.success).length / p.outcomes.length;
      return failureRate > 0.5;
    });
    
    for (const pattern of negativePatterns.slice(0, 2)) {
      suggestions.push({
        id: `warn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'warning',
        suggestion: `Avoid ${pattern.pattern.split('_')[0]} in current context`,
        reason: 'High failure rate observed in similar situations',
        confidence: pattern.confidence,
        priority: 'medium',
        context: currentContext
      });
    }
    
    // Generate optimization suggestions based on preferences
    for (const pref of preferences) {
      if (pref.confidence > 0.8) {
        suggestions.push({
          id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'optimization',
          suggestion: `Optimize ${pref.category} based on your preferences`,
          reason: `Strong preference pattern detected (${pref.observations} observations)`,
          confidence: pref.confidence,
          priority: 'low',
          context: { ...currentContext, preference: pref.preference }
        });
      }
    }
    
    logInfo('Proactive suggestions generated', { 
      userId, 
      count: suggestions.length 
    });
    
    return suggestions;
  }

  /**
   * Find associations with existing memories
   */
  private async findAssociations(content: string): Promise<string[]> {
    const searchResults = await this.vectorStore.search(content, {
      topK: 5,
      filter: { type: 'memory' }
    });
    
    return searchResults
      .filter(r => r.score > 0.7)
      .map(r => r.document.id);
  }

  /**
   * Consolidate memories (background process)
   */
  private startMemoryConsolidation(): void {
    // Run every hour
    this.memoryConsolidationInterval = setInterval(() => {
      this.consolidateMemories();
    }, 60 * 60 * 1000);
  }

  /**
   * Consolidate and decay memories
   */
  private async consolidateMemories(): Promise<void> {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [id, memory] of this.memories.entries()) {
      // Apply decay based on time and access patterns
      const timeSinceAccess = now - memory.lastAccessed.getTime();
      const decayFactor = memory.decay * (timeSinceAccess / (24 * 60 * 60 * 1000)); // Days
      
      // Reduce importance based on decay, but boost by reinforcement
      memory.importance = Math.max(
        0,
        memory.importance - decayFactor + (memory.reinforcement * 0.01)
      );
      
      // Mark for deletion if importance is too low
      if (memory.importance < 0.1 && memory.type !== 'semantic') {
        toDelete.push(id);
      }
      
      // Convert important episodic memories to semantic
      if (memory.type === 'episodic' && 
          memory.reinforcement > 10 && 
          memory.importance > 0.8) {
        
        await this.storeSemanticMemory(
          memory.content,
          'consolidated_knowledge',
          memory.importance
        );
        
        logInfo('Episodic memory consolidated to semantic', { memoryId: id });
      }
    }
    
    // Delete decayed memories
    for (const id of toDelete) {
      this.memories.delete(id);
      await this.vectorStore.deleteDocument(id);
    }
    
    if (toDelete.length > 0) {
      logInfo('Memories consolidated', { 
        deleted: toDelete.length,
        remaining: this.memories.size 
      });
    }
  }

  /**
   * Export memory system
   */
  export(): string {
    return JSON.stringify({
      memories: Array.from(this.memories.values()),
      patterns: Array.from(this.learningPatterns.values()),
      preferences: Array.from(this.userPreferences.entries()).map(([userId, prefs]) => ({
        userId,
        preferences: Array.from(prefs.values())
      }))
    });
  }

  /**
   * Import memory system
   */
  import(json: string): void {
    try {
      const data = JSON.parse(json);
      
      // Import memories
      this.memories.clear();
      for (const memory of data.memories || []) {
        memory.context.timestamp = new Date(memory.context.timestamp);
        memory.lastAccessed = new Date(memory.lastAccessed);
        this.memories.set(memory.id, memory);
      }
      
      // Import patterns
      this.learningPatterns.clear();
      for (const pattern of data.patterns || []) {
        pattern.lastObserved = new Date(pattern.lastObserved);
        this.learningPatterns.set(pattern.id, pattern);
      }
      
      // Import preferences
      this.userPreferences.clear();
      for (const userPref of data.preferences || []) {
        const prefMap = new Map<string, UserPreference>();
        for (const pref of userPref.preferences) {
          pref.lastUpdated = new Date(pref.lastUpdated);
          prefMap.set(pref.category, pref);
        }
        this.userPreferences.set(userPref.userId, prefMap);
      }
      
      logInfo('Memory system imported', {
        memories: this.memories.size,
        patterns: this.learningPatterns.size,
        users: this.userPreferences.size
      });
      
    } catch (error: any) {
      logError('Failed to import memory system', error);
      throw error;
    }
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    totalMemories: number;
    byType: Record<string, number>;
    totalPatterns: number;
    strongPatterns: number;
    totalUsers: number;
    workingMemorySize: number;
    averageImportance: number;
  } {
    const byType: Record<string, number> = {
      episodic: 0,
      semantic: 0,
      procedural: 0,
      working: 0
    };
    
    let totalImportance = 0;
    
    for (const memory of this.memories.values()) {
      byType[memory.type]++;
      totalImportance += memory.importance;
    }
    
    const strongPatterns = Array.from(this.learningPatterns.values())
      .filter(p => p.confidence > 0.8 && p.frequency > 5).length;
    
    return {
      totalMemories: this.memories.size,
      byType,
      totalPatterns: this.learningPatterns.size,
      strongPatterns,
      totalUsers: this.userPreferences.size,
      workingMemorySize: this.workingMemory.size,
      averageImportance: this.memories.size > 0 
        ? totalImportance / this.memories.size 
        : 0
    };
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.memoryConsolidationInterval) {
      clearInterval(this.memoryConsolidationInterval);
    }
  }
}

// Export factory function
export const createEnhancedMemory = (
  vectorStore: VectorStore,
  knowledgeBase: KnowledgeBase
) => new EnhancedMemorySystem(vectorStore, knowledgeBase);