import { VectorStore, VectorDocument } from './vector-store';
import { logInfo, logError } from '../../logger';

/**
 * Knowledge Base for domain-specific information
 * Manages business rules, domain knowledge, and contextual information
 */

export interface KnowledgeItem {
  id: string;
  category: 'business_rule' | 'domain_knowledge' | 'best_practice' | 'constraint' | 'definition';
  title: string;
  content: string;
  context?: string;
  examples?: string[];
  relatedItems?: string[];
  confidence: number;
  source: string;
  validFrom?: Date;
  validUntil?: Date;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  priority: number;
  category: string;
  active: boolean;
  exceptions?: string[];
  dependencies?: string[];
}

export interface DomainConcept {
  id: string;
  term: string;
  definition: string;
  synonyms: string[];
  relatedTerms: string[];
  category: string;
  importance: number;
}

export class KnowledgeBase {
  private vectorStore: VectorStore;
  private businessRules: Map<string, BusinessRule> = new Map();
  private domainConcepts: Map<string, DomainConcept> = new Map();
  private knowledgeItems: Map<string, KnowledgeItem> = new Map();

  constructor(vectorStore?: VectorStore) {
    this.vectorStore = vectorStore || new VectorStore({
      dimensions: 768,
      maxDocuments: 5000,
      similarityThreshold: 0.6
    });
    
    this.initializeDefaultKnowledge();
  }

  /**
   * Initialize with default domain knowledge
   */
  private initializeDefaultKnowledge(): void {
    // Add manufacturing domain concepts
    const concepts: DomainConcept[] = [
      {
        id: 'concept_001',
        term: 'Lead Time',
        definition: 'The time between initiating and completing a production process',
        synonyms: ['cycle time', 'processing time'],
        relatedTerms: ['delivery time', 'production schedule'],
        category: 'manufacturing',
        importance: 0.9
      },
      {
        id: 'concept_002',
        term: 'Safety Stock',
        definition: 'Extra inventory held to mitigate risk of stockouts',
        synonyms: ['buffer stock', 'reserve inventory'],
        relatedTerms: ['reorder point', 'service level'],
        category: 'inventory',
        importance: 0.85
      },
      {
        id: 'concept_003',
        term: 'EOQ',
        definition: 'Economic Order Quantity - optimal order quantity to minimize total inventory costs',
        synonyms: ['economic order quantity', 'optimal order size'],
        relatedTerms: ['holding cost', 'ordering cost'],
        category: 'inventory',
        importance: 0.8
      },
      {
        id: 'concept_004',
        term: 'OEE',
        definition: 'Overall Equipment Effectiveness - measure of manufacturing productivity',
        synonyms: ['overall equipment efficiency'],
        relatedTerms: ['availability', 'performance', 'quality'],
        category: 'performance',
        importance: 0.95
      }
    ];

    concepts.forEach(concept => this.addDomainConcept(concept));

    // Add business rules
    const rules: BusinessRule[] = [
      {
        id: 'rule_001',
        name: 'Minimum Stock Level',
        description: 'Trigger reorder when inventory falls below safety stock',
        condition: 'inventory_level < safety_stock',
        action: 'create_purchase_order',
        priority: 1,
        category: 'inventory',
        active: true,
        exceptions: ['discontinued_items']
      },
      {
        id: 'rule_002',
        name: 'Supplier Performance Threshold',
        description: 'Flag suppliers with poor performance',
        condition: 'on_time_delivery_rate < 0.95',
        action: 'flag_supplier_review',
        priority: 2,
        category: 'supplier',
        active: true,
        dependencies: ['rule_001']
      },
      {
        id: 'rule_003',
        name: 'Quality Control Alert',
        description: 'Alert when defect rate exceeds threshold',
        condition: 'defect_rate > 0.02',
        action: 'quality_alert',
        priority: 1,
        category: 'quality',
        active: true
      },
      {
        id: 'rule_004',
        name: 'Cash Flow Warning',
        description: 'Warn when cash flow projection is negative',
        condition: 'projected_cash_flow < 0',
        action: 'financial_alert',
        priority: 1,
        category: 'financial',
        active: true
      }
    ];

    rules.forEach(rule => this.addBusinessRule(rule));

    // Add knowledge items
    const knowledge: KnowledgeItem[] = [
      {
        id: 'knowledge_001',
        category: 'best_practice',
        title: 'Optimal Safety Stock Calculation',
        content: 'Safety stock should be calculated using demand variability and desired service level. Formula: SS = Z × σ × √LT',
        examples: ['For 95% service level, Z = 1.65', 'For 99% service level, Z = 2.33'],
        confidence: 0.95,
        source: 'Industry Standard',
        tags: ['inventory', 'safety_stock', 'calculation']
      },
      {
        id: 'knowledge_002',
        category: 'constraint',
        title: 'Maximum Lead Time Constraint',
        content: 'Lead time for critical components should not exceed 30 days to maintain production schedule',
        context: 'Manufacturing operations',
        confidence: 0.9,
        source: 'Company Policy',
        tags: ['lead_time', 'constraint', 'production']
      },
      {
        id: 'knowledge_003',
        category: 'business_rule',
        title: 'Supplier Diversification Policy',
        content: 'No single supplier should account for more than 40% of critical component supply',
        examples: ['Component A: Max 40% from Supplier X', 'Maintain at least 3 qualified suppliers'],
        confidence: 0.85,
        source: 'Risk Management Policy',
        tags: ['supplier', 'risk', 'diversification']
      }
    ];

    knowledge.forEach(item => this.addKnowledgeItem(item));

    logInfo('Knowledge base initialized with default knowledge');
  }

  /**
   * Add business rule
   */
  addBusinessRule(rule: BusinessRule): void {
    this.businessRules.set(rule.id, rule);
    
    // Add to vector store for semantic search
    const document: VectorDocument = {
      id: `rule_${rule.id}`,
      content: `${rule.name}: ${rule.description}. Condition: ${rule.condition}. Action: ${rule.action}`,
      metadata: {
        type: 'rule',
        timestamp: new Date(),
        tags: [rule.category, 'business_rule'],
        importance: rule.priority / 10
      }
    };
    
    this.vectorStore.addDocument(document);
    logInfo('Business rule added', { ruleId: rule.id, name: rule.name });
  }

  /**
   * Add domain concept
   */
  addDomainConcept(concept: DomainConcept): void {
    this.domainConcepts.set(concept.id, concept);
    
    // Add to vector store
    const document: VectorDocument = {
      id: `concept_${concept.id}`,
      content: `${concept.term}: ${concept.definition}. Synonyms: ${concept.synonyms.join(', ')}`,
      metadata: {
        type: 'knowledge',
        timestamp: new Date(),
        tags: [concept.category, 'domain_concept'],
        importance: concept.importance
      }
    };
    
    this.vectorStore.addDocument(document);
    logInfo('Domain concept added', { conceptId: concept.id, term: concept.term });
  }

  /**
   * Add knowledge item
   */
  addKnowledgeItem(item: KnowledgeItem): void {
    this.knowledgeItems.set(item.id, item);
    
    // Add to vector store
    const document: VectorDocument = {
      id: `knowledge_${item.id}`,
      content: `${item.title}: ${item.content}`,
      metadata: {
        type: 'knowledge',
        timestamp: new Date(),
        tags: item.tags,
        importance: item.confidence,
        expiresAt: item.validUntil
      }
    };
    
    this.vectorStore.addDocument(document);
    logInfo('Knowledge item added', { itemId: item.id, title: item.title });
  }

  /**
   * Query knowledge base
   */
  async query(
    question: string,
    options: {
      topK?: number;
      category?: string;
      includeRules?: boolean;
      includeConcepts?: boolean;
    } = {}
  ): Promise<{
    answer?: string;
    relevantRules: BusinessRule[];
    relevantConcepts: DomainConcept[];
    relevantKnowledge: KnowledgeItem[];
    confidence: number;
  }> {
    const { 
      topK = 5, 
      category, 
      includeRules = true, 
      includeConcepts = true 
    } = options;

    try {
      // Search vector store
      const searchResults = await this.vectorStore.search(question, {
        topK,
        filter: category ? { tags: [category] } : undefined
      });

      const relevantRules: BusinessRule[] = [];
      const relevantConcepts: DomainConcept[] = [];
      const relevantKnowledge: KnowledgeItem[] = [];

      // Categorize results
      for (const result of searchResults) {
        const docId = result.document.id;
        
        if (docId.startsWith('rule_') && includeRules) {
          const ruleId = docId.replace('rule_', '');
          const rule = this.businessRules.get(ruleId);
          if (rule && rule.active) {
            relevantRules.push(rule);
          }
        } else if (docId.startsWith('concept_') && includeConcepts) {
          const conceptId = docId.replace('concept_', '');
          const concept = this.domainConcepts.get(conceptId);
          if (concept) {
            relevantConcepts.push(concept);
          }
        } else if (docId.startsWith('knowledge_')) {
          const knowledgeId = docId.replace('knowledge_', '');
          const knowledge = this.knowledgeItems.get(knowledgeId);
          if (knowledge) {
            relevantKnowledge.push(knowledge);
          }
        }
      }

      // Generate answer based on found knowledge
      const answer = this.generateAnswer(question, {
        rules: relevantRules,
        concepts: relevantConcepts,
        knowledge: relevantKnowledge
      });

      const confidence = searchResults.length > 0 
        ? searchResults[0].score 
        : 0;

      logInfo('Knowledge base query completed', {
        question: question.substring(0, 50),
        rulesFound: relevantRules.length,
        conceptsFound: relevantConcepts.length,
        knowledgeFound: relevantKnowledge.length,
        confidence
      });

      return {
        answer,
        relevantRules,
        relevantConcepts,
        relevantKnowledge,
        confidence
      };

    } catch (error: any) {
      logError('Knowledge base query failed', error);
      throw error;
    }
  }

  /**
   * Get applicable business rules
   */
  getApplicableRules(context: Record<string, any>): BusinessRule[] {
    const applicable: BusinessRule[] = [];

    for (const rule of this.businessRules.values()) {
      if (!rule.active) continue;

      // Simple condition evaluation (in production, use proper expression evaluator)
      try {
        if (this.evaluateCondition(rule.condition, context)) {
          applicable.push(rule);
        }
      } catch (error) {
        // Skip rules that can't be evaluated
        continue;
      }
    }

    // Sort by priority
    applicable.sort((a, b) => a.priority - b.priority);

    return applicable;
  }

  /**
   * Get concept by term
   */
  getConceptByTerm(term: string): DomainConcept | undefined {
    // Check exact match
    for (const concept of this.domainConcepts.values()) {
      if (concept.term.toLowerCase() === term.toLowerCase()) {
        return concept;
      }
      
      // Check synonyms
      if (concept.synonyms.some(syn => syn.toLowerCase() === term.toLowerCase())) {
        return concept;
      }
    }
    
    return undefined;
  }

  /**
   * Explain concept
   */
  explainConcept(term: string): string | null {
    const concept = this.getConceptByTerm(term);
    
    if (!concept) {
      return null;
    }

    let explanation = `${concept.term}: ${concept.definition}`;
    
    if (concept.synonyms.length > 0) {
      explanation += `\nAlso known as: ${concept.synonyms.join(', ')}`;
    }
    
    if (concept.relatedTerms.length > 0) {
      explanation += `\nRelated concepts: ${concept.relatedTerms.join(', ')}`;
    }

    return explanation;
  }

  /**
   * Generate answer from knowledge
   */
  private generateAnswer(
    question: string,
    context: {
      rules: BusinessRule[];
      concepts: DomainConcept[];
      knowledge: KnowledgeItem[];
    }
  ): string {
    const parts: string[] = [];

    // Add relevant knowledge
    if (context.knowledge.length > 0) {
      const topKnowledge = context.knowledge[0];
      parts.push(topKnowledge.content);
      
      if (topKnowledge.examples && topKnowledge.examples.length > 0) {
        parts.push(`Examples: ${topKnowledge.examples.join('; ')}`);
      }
    }

    // Add relevant concepts
    if (context.concepts.length > 0) {
      const concepts = context.concepts
        .slice(0, 2)
        .map(c => `${c.term}: ${c.definition}`)
        .join('. ');
      parts.push(concepts);
    }

    // Add relevant rules
    if (context.rules.length > 0) {
      const rules = context.rules
        .slice(0, 2)
        .map(r => `${r.name}: ${r.description}`)
        .join('. ');
      parts.push(`Applicable rules: ${rules}`);
    }

    return parts.join('\n\n') || 'No specific answer found in knowledge base.';
  }

  /**
   * Simple condition evaluator
   */
  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    // Very simplified evaluation - in production, use proper expression parser
    // This only handles simple comparisons like "inventory_level < safety_stock"
    
    const match = condition.match(/(\w+)\s*([<>=!]+)\s*([\w.]+)/);
    if (!match) return false;

    const [, left, operator, right] = match;
    const leftValue = context[left];
    const rightValue = context[right] || parseFloat(right);

    if (leftValue === undefined || rightValue === undefined) {
      return false;
    }

    switch (operator) {
      case '<': return leftValue < rightValue;
      case '>': return leftValue > rightValue;
      case '<=': return leftValue <= rightValue;
      case '>=': return leftValue >= rightValue;
      case '=': 
      case '==': return leftValue == rightValue;
      case '!=': return leftValue != rightValue;
      default: return false;
    }
  }

  /**
   * Get knowledge statistics
   */
  getStats(): {
    totalRules: number;
    activeRules: number;
    totalConcepts: number;
    totalKnowledge: number;
    vectorStoreStats: any;
  } {
    const activeRules = Array.from(this.businessRules.values())
      .filter(r => r.active).length;

    return {
      totalRules: this.businessRules.size,
      activeRules,
      totalConcepts: this.domainConcepts.size,
      totalKnowledge: this.knowledgeItems.size,
      vectorStoreStats: this.vectorStore.getStats()
    };
  }

  /**
   * Export knowledge base
   */
  export(): string {
    return JSON.stringify({
      businessRules: Array.from(this.businessRules.values()),
      domainConcepts: Array.from(this.domainConcepts.values()),
      knowledgeItems: Array.from(this.knowledgeItems.values()),
      vectorStore: this.vectorStore.export()
    });
  }

  /**
   * Import knowledge base
   */
  import(json: string): void {
    try {
      const data = JSON.parse(json);
      
      // Import business rules
      this.businessRules.clear();
      for (const rule of data.businessRules || []) {
        this.businessRules.set(rule.id, rule);
      }

      // Import domain concepts
      this.domainConcepts.clear();
      for (const concept of data.domainConcepts || []) {
        this.domainConcepts.set(concept.id, concept);
      }

      // Import knowledge items
      this.knowledgeItems.clear();
      for (const item of data.knowledgeItems || []) {
        if (item.validFrom) item.validFrom = new Date(item.validFrom);
        if (item.validUntil) item.validUntil = new Date(item.validUntil);
        this.knowledgeItems.set(item.id, item);
      }

      // Import vector store
      if (data.vectorStore) {
        this.vectorStore.import(data.vectorStore);
      }

      logInfo('Knowledge base imported', this.getStats());

    } catch (error: any) {
      logError('Failed to import knowledge base', error);
      throw error;
    }
  }
}

// Create singleton instance
export const defaultKnowledgeBase = new KnowledgeBase();