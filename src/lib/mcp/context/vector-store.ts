import { logInfo, logWarn, logError } from '../../logger';

/**
 * Vector Store for semantic search and memory
 * Provides embedding-based storage and retrieval
 */

export interface VectorDocument {
  id: string;
  content: string;
  embedding?: number[];
  metadata: {
    type: 'conversation' | 'knowledge' | 'rule' | 'preference' | 'memory';
    timestamp: Date;
    userId?: string;
    sessionId?: string;
    source?: string;
    tags?: string[];
    importance?: number;
    expiresAt?: Date;
  };
}

export interface VectorSearchResult {
  document: VectorDocument;
  score: number;
  distance: number;
}

export interface VectorStoreConfig {
  dimensions: number;
  maxDocuments: number;
  similarityThreshold: number;
  embeddingModel?: string;
}

export class VectorStore {
  private documents: Map<string, VectorDocument> = new Map();
  private embeddings: Map<string, number[]> = new Map();
  private config: VectorStoreConfig;
  private index: Map<string, Set<string>> = new Map(); // Tag-based index

  constructor(config?: Partial<VectorStoreConfig>) {
    this.config = {
      dimensions: 768, // Default for many embedding models
      maxDocuments: 10000,
      similarityThreshold: 0.7,
      embeddingModel: 'text-embedding-3-small',
      ...config
    };
  }

  /**
   * Add document to vector store
   */
  async addDocument(document: VectorDocument): Promise<void> {
    try {
      // Generate embedding if not provided
      if (!document.embedding) {
        document.embedding = await this.generateEmbedding(document.content);
      }

      // Check document limit
      if (this.documents.size >= this.config.maxDocuments) {
        this.evictOldestDocuments();
      }

      // Store document and embedding
      this.documents.set(document.id, document);
      this.embeddings.set(document.id, document.embedding);

      // Update indices
      this.updateIndices(document);

      logInfo('Document added to vector store', {
        documentId: document.id,
        type: document.metadata.type,
        tags: document.metadata.tags
      });

    } catch (error: any) {
      logError('Failed to add document to vector store', error);
      throw error;
    }
  }

  /**
   * Search for similar documents
   */
  async search(
    query: string | number[],
    options: {
      topK?: number;
      filter?: Partial<VectorDocument['metadata']>;
      includeMetadata?: boolean;
    } = {}
  ): Promise<VectorSearchResult[]> {
    const { topK = 10, filter, includeMetadata = true } = options;

    try {
      // Get query embedding
      const queryEmbedding = typeof query === 'string' 
        ? await this.generateEmbedding(query)
        : query;

      // Calculate similarities
      const results: VectorSearchResult[] = [];

      for (const [docId, embedding] of this.embeddings.entries()) {
        const document = this.documents.get(docId);
        if (!document) continue;

        // Apply filters
        if (filter && !this.matchesFilter(document, filter)) continue;

        // Calculate similarity
        const similarity = this.cosineSimilarity(queryEmbedding, embedding);
        
        if (similarity >= this.config.similarityThreshold) {
          results.push({
            document: includeMetadata ? document : { ...document, metadata: {} as any },
            score: similarity,
            distance: 1 - similarity
          });
        }
      }

      // Sort by score and return top K
      results.sort((a, b) => b.score - a.score);
      
      const topResults = results.slice(0, topK);
      
      logInfo('Vector search completed', {
        query: typeof query === 'string' ? query.substring(0, 50) : 'embedding',
        resultsFound: topResults.length,
        topScore: topResults[0]?.score
      });

      return topResults;

    } catch (error: any) {
      logError('Vector search failed', error);
      throw error;
    }
  }

  /**
   * Get document by ID
   */
  getDocument(id: string): VectorDocument | undefined {
    return this.documents.get(id);
  }

  /**
   * Update document
   */
  async updateDocument(id: string, updates: Partial<VectorDocument>): Promise<void> {
    const existing = this.documents.get(id);
    if (!existing) {
      throw new Error(`Document ${id} not found`);
    }

    const updated: VectorDocument = {
      ...existing,
      ...updates,
      id // Ensure ID doesn't change
    };

    // Re-generate embedding if content changed
    if (updates.content && updates.content !== existing.content) {
      updated.embedding = await this.generateEmbedding(updates.content);
      this.embeddings.set(id, updated.embedding);
    }

    this.documents.set(id, updated);
    this.updateIndices(updated);

    logInfo('Document updated in vector store', { documentId: id });
  }

  /**
   * Delete document
   */
  deleteDocument(id: string): boolean {
    const document = this.documents.get(id);
    if (!document) return false;

    this.documents.delete(id);
    this.embeddings.delete(id);
    
    // Remove from indices
    if (document.metadata.tags) {
      for (const tag of document.metadata.tags) {
        const tagDocs = this.index.get(tag);
        if (tagDocs) {
          tagDocs.delete(id);
          if (tagDocs.size === 0) {
            this.index.delete(tag);
          }
        }
      }
    }

    logInfo('Document deleted from vector store', { documentId: id });
    return true;
  }

  /**
   * Get documents by metadata filter
   */
  getDocumentsByFilter(filter: Partial<VectorDocument['metadata']>): VectorDocument[] {
    const results: VectorDocument[] = [];

    for (const document of this.documents.values()) {
      if (this.matchesFilter(document, filter)) {
        results.push(document);
      }
    }

    return results;
  }

  /**
   * Get documents by tag
   */
  getDocumentsByTag(tag: string): VectorDocument[] {
    const docIds = this.index.get(tag);
    if (!docIds) return [];

    const documents: VectorDocument[] = [];
    for (const id of docIds) {
      const doc = this.documents.get(id);
      if (doc) documents.push(doc);
    }

    return documents;
  }

  /**
   * Clear expired documents
   */
  clearExpired(): number {
    const now = new Date();
    let cleared = 0;

    for (const [id, document] of this.documents.entries()) {
      if (document.metadata.expiresAt && document.metadata.expiresAt < now) {
        this.deleteDocument(id);
        cleared++;
      }
    }

    if (cleared > 0) {
      logInfo('Cleared expired documents', { count: cleared });
    }

    return cleared;
  }

  /**
   * Get store statistics
   */
  getStats(): {
    documentCount: number;
    embeddingCount: number;
    indexCount: number;
    averageEmbeddingSize: number;
    memoryUsage: number;
  } {
    let totalEmbeddingSize = 0;
    for (const embedding of this.embeddings.values()) {
      totalEmbeddingSize += embedding.length;
    }

    const avgEmbeddingSize = this.embeddings.size > 0 
      ? totalEmbeddingSize / this.embeddings.size 
      : 0;

    // Rough memory estimation
    const memoryUsage = (
      this.documents.size * 1024 + // ~1KB per document
      totalEmbeddingSize * 4 // 4 bytes per float
    );

    return {
      documentCount: this.documents.size,
      embeddingCount: this.embeddings.size,
      indexCount: this.index.size,
      averageEmbeddingSize: avgEmbeddingSize,
      memoryUsage
    };
  }

  /**
   * Generate embedding for text (mock implementation)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // In production, this would call OpenAI or another embedding API
    // Mock implementation: generate random embedding
    
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate API call
    
    // Simple hash-based pseudo-embedding for consistency
    const embedding = new Array(this.config.dimensions);
    let hash = 0;
    
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Generate deterministic pseudo-random values
    for (let i = 0; i < this.config.dimensions; i++) {
      const seed = hash + i;
      embedding[i] = (Math.sin(seed) * 10000) % 1;
    }
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same dimensions');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Check if document matches filter
   */
  private matchesFilter(
    document: VectorDocument,
    filter: Partial<VectorDocument['metadata']>
  ): boolean {
    for (const [key, value] of Object.entries(filter)) {
      if (key === 'tags' && Array.isArray(value)) {
        // Check if any filter tags are in document tags
        const docTags = document.metadata.tags || [];
        if (!value.some(tag => docTags.includes(tag))) {
          return false;
        }
      } else if (document.metadata[key as keyof VectorDocument['metadata']] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Update indices for document
   */
  private updateIndices(document: VectorDocument): void {
    // Update tag index
    if (document.metadata.tags) {
      for (const tag of document.metadata.tags) {
        if (!this.index.has(tag)) {
          this.index.set(tag, new Set());
        }
        this.index.get(tag)!.add(document.id);
      }
    }
  }

  /**
   * Evict oldest documents when at capacity
   */
  private evictOldestDocuments(): void {
    const toEvict = Math.floor(this.config.maxDocuments * 0.1); // Evict 10%
    
    // Sort by timestamp and importance
    const sorted = Array.from(this.documents.values()).sort((a, b) => {
      // Prioritize by importance if set
      if (a.metadata.importance && b.metadata.importance) {
        const importanceDiff = b.metadata.importance - a.metadata.importance;
        if (importanceDiff !== 0) return importanceDiff;
      }
      
      // Then by timestamp (older first)
      return a.metadata.timestamp.getTime() - b.metadata.timestamp.getTime();
    });

    // Evict oldest/least important
    for (let i = 0; i < toEvict && i < sorted.length; i++) {
      this.deleteDocument(sorted[i].id);
    }

    logWarn('Evicted documents due to capacity', { count: toEvict });
  }

  /**
   * Export store to JSON
   */
  export(): string {
    const data = {
      documents: Array.from(this.documents.values()),
      embeddings: Array.from(this.embeddings.entries()),
      config: this.config
    };
    return JSON.stringify(data);
  }

  /**
   * Import store from JSON
   */
  import(json: string): void {
    try {
      const data = JSON.parse(json);
      
      this.documents.clear();
      this.embeddings.clear();
      this.index.clear();

      // Restore documents
      for (const doc of data.documents) {
        doc.metadata.timestamp = new Date(doc.metadata.timestamp);
        if (doc.metadata.expiresAt) {
          doc.metadata.expiresAt = new Date(doc.metadata.expiresAt);
        }
        this.documents.set(doc.id, doc);
        this.updateIndices(doc);
      }

      // Restore embeddings
      for (const [id, embedding] of data.embeddings) {
        this.embeddings.set(id, embedding);
      }

      // Update config if provided
      if (data.config) {
        this.config = { ...this.config, ...data.config };
      }

      logInfo('Vector store imported', {
        documentCount: this.documents.size,
        embeddingCount: this.embeddings.size
      });

    } catch (error: any) {
      logError('Failed to import vector store', error);
      throw error;
    }
  }
}

// Create singleton instance
export const defaultVectorStore = new VectorStore();