/**
 * SENTIA AI CHATBOT INTERACTION LEARNING SYSTEM
 * 
 * This system captures, analyzes, and learns from user interactions to continuously
 * improve the chatbot's knowledge base and response quality.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logDebug, logInfo, logWarn, logError } from '../../src/utils/logger';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class InteractionLearningSystem {
  
  constructor(logDirectory = path.join(__dirname, '../logs/interactions')) {
    this.logDirectory = logDirectory;
    this.interactionDatabase = new Map(); // In-memory storage for sessions
    this.learningPatterns = new Map(); // Common patterns and responses
    this.userFeedback = new Map(); // User satisfaction ratings
    this.topicFrequency = new Map(); // Topic popularity tracking
    
    this.initializeSystem();
  }

  async initializeSystem() {
    try {
      // Ensure log directory exists
      await fs.mkdir(this.logDirectory, { recursive: true });
      
      // Load existing learning patterns if available
      await this.loadLearningData();
      
      logDebug('✅ Interaction Learning System initialized');
    } catch (error) {
      logError('❌ Failed to initialize Interaction Learning System:', error);
    }
  }

  // Store and analyze user interactions
  async storeInteraction(interaction) {
    try {
      const enrichedInteraction = this.enrichInteraction(interaction);
      
      // Store in memory for real-time analysis
      if (!this.interactionDatabase.has(enrichedInteraction.session_id)) {
        this.interactionDatabase.set(enrichedInteraction.session_id, []);
      }
      this.interactionDatabase.get(enrichedInteraction.session_id).push(enrichedInteraction);
      
      // Update learning patterns
      await this.updateLearningPatterns(enrichedInteraction);
      
      // Persist to file for durability
      await this.persistInteraction(enrichedInteraction);
      
      // Analyze for knowledge gaps
      await this.identifyKnowledgeGaps(enrichedInteraction);
      
      return enrichedInteraction;
    } catch (error) {
      logError('Failed to store interaction:', error);
      throw error;
    }
  }

  // Enrich interaction with metadata and analysis
  enrichInteraction(interaction) {
    const enriched = {
      ...interaction,
      enriched_timestamp: new Date().toISOString(),
      message_length: interaction.user_message.length,
      response_length: interaction.ai_response.length,
      topic_detected: this.detectTopic(interaction.user_message),
      intent_detected: this.detectIntent(interaction.user_message),
      complexity_score: this.calculateComplexity(interaction.user_message),
      user_satisfaction: null, // To be filled by feedback
      response_time: null, // To be filled by response timing
      follow_up_questions: this.detectFollowUp(interaction.user_message)
    };

    return enriched;
  }

  // Detect the main topic of user message
  detectTopic(message) {
    const topicKeywords = {
      inventory: ['inventory', 'stock', 'warehouse', 'items', 'products', 'reorder', 'abc analysis'],
      forecasting: ['forecast', 'demand', 'prediction', 'future', 'trend', 'seasonal', 'arima'],
      working_capital: ['working capital', 'cash flow', 'ar', 'ap', 'receivables', 'payables', 'dso', 'dpo'],
      production: ['production', 'manufacturing', 'oee', 'throughput', 'capacity', 'scheduling', 'efficiency'],
      quality: ['quality', 'defects', 'control', 'inspection', 'compliance', 'iso', 'standards'],
      navigation: ['navigate', 'menu', 'dashboard', 'page', 'section', 'shortcut', 'interface'],
      integration: ['integration', 'api', 'xero', 'shopify', 'amazon', 'sync', 'connect', 'import'],
      troubleshooting: ['error', 'problem', 'issue', 'bug', 'not working', 'failed', 'trouble', 'help'],
      onboarding: ['onboard', 'getting started', 'new user', 'setup', 'configure', 'tutorial', 'guide']
    };

    const lowerMessage = message.toLowerCase();
    let maxScore = 0;
    let detectedTopic = 'general';

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      const score = keywords.reduce(_(count, _keyword) => {
        return count + (lowerMessage.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        detectedTopic = topic;
      }
    }

    return detectedTopic;
  }

  // Detect user intent
  detectIntent(message) {
    const intentPatterns = {
      question: ['what', 'how', 'why', 'when', 'where', 'which', '?'],
      help: ['help', 'assist', 'support', 'guide', 'show me', 'explain'],
      troubleshooting: ['fix', 'solve', 'error', 'problem', 'not working', 'failed'],
      information: ['tell me about', 'information', 'details', 'more about', 'explain'],
      navigation: ['go to', 'navigate', 'find', 'where is', 'how to get to'],
      setup: ['setup', 'configure', 'install', 'connect', 'initialize'],
      comparison: ['difference', 'compare', 'vs', 'versus', 'better than', 'alternative']
    };

    const lowerMessage = message.toLowerCase();
    
    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      for (const pattern of patterns) {
        if (lowerMessage.includes(pattern)) {
          return intent;
        }
      }
    }

    return 'general';
  }

  // Calculate message complexity
  calculateComplexity(message) {
    const factors = {
      length: message.length > 100 ? 1 : 0,
      technical_terms: this.countTechnicalTerms(message),
      multiple_questions: (message.match(/\?/g) || []).length,
      specific_numbers: (message.match(/\b\d+\b/g) || []).length
    };

    return Object.values(factors).reduce((sum, _value) => sum + value, 0);
  }

  // Count technical terms in message
  countTechnicalTerms(message) {
    const technicalTerms = [
      'api', 'integration', 'webhook', 'json', 'oauth', 'ssl', 'https',
      'arima', 'forecasting', 'algorithm', 'machine learning', 'ai',
      'kpi', 'roi', 'dso', 'dpo', 'oee', 'erp', 'crm', 'edi',
      'inventory turnover', 'safety stock', 'reorder point', 'abc analysis',
      'cash conversion cycle', 'working capital ratio', 'current ratio'
    ];

    const lowerMessage = message.toLowerCase();
    return technicalTerms.reduce(_(count, _term) => {
      return count + (lowerMessage.includes(term) ? 1 : 0);
    }, 0);
  }

  // Detect if message contains follow-up questions
  detectFollowUp(message) {
    const followUpIndicators = [
      'also', 'additionally', 'furthermore', 'what about', 'and then',
      'next', 'after that', 'another question', 'one more thing'
    ];

    const lowerMessage = message.toLowerCase();
    return followUpIndicators.some(indicator => lowerMessage.includes(indicator));
  }

  // Update learning patterns based on interactions
  async updateLearningPatterns(interaction) {
    const topic = interaction.topic_detected;
    const intent = interaction.intent_detected;
    const key = `${topic}_${intent}`;

    // Update topic frequency
    this.topicFrequency.set(topic, (this.topicFrequency.get(topic) || 0) + 1);

    // Update learning patterns
    if (!this.learningPatterns.has(key)) {
      this.learningPatterns.set(key, {
        topic,
        intent,
        common_questions: [],
        effective_responses: [],
        user_satisfaction_avg: null,
        frequency: 0
      });
    }

    const pattern = this.learningPatterns.get(key);
    pattern.frequency += 1;
    
    // Store unique questions for this pattern
    if (!pattern.common_questions.includes(interaction.user_message)) {
      pattern.common_questions.push(interaction.user_message);
      
      // Keep only top 10 most recent questions
      if (pattern.common_questions.length > 10) {
        pattern.common_questions = pattern.common_questions.slice(-10);
      }
    }

    // Store effective responses
    if (interaction.ai_response && !pattern.effective_responses.includes(interaction.ai_response)) {
      pattern.effective_responses.push(interaction.ai_response);
      
      // Keep only top 5 most recent responses
      if (pattern.effective_responses.length > 5) {
        pattern.effective_responses = pattern.effective_responses.slice(-5);
      }
    }
  }

  // Identify knowledge gaps from interactions
  async identifyKnowledgeGaps(interaction) {
    const indicators = {
      unclear_response: interaction.ai_response.length < 50,
      high_complexity: interaction.complexity_score > 3,
      multiple_follow_ups: interaction.follow_up_questions,
      unknown_topic: interaction.topic_detected === 'general'
    };

    const gapDetected = Object.values(indicators).some(Boolean);
    
    if (gapDetected) {
      await this.logKnowledgeGap({
        interaction_id: `${interaction.session_id}_${interaction.timestamp}`,
        gap_indicators: indicators,
        user_message: interaction.user_message,
        ai_response: interaction.ai_response,
        suggested_improvements: this.suggestImprovements(indicators)
      });
    }
  }

  // Suggest improvements for knowledge gaps
  suggestImprovements(indicators) {
    const improvements = [];

    if (indicators.unclear_response) {
      improvements.push('Enhance response detail and provide more comprehensive information');
    }
    
    if (indicators.high_complexity) {
      improvements.push('Break down complex questions into simpler components');
    }
    
    if (indicators.multiple_follow_ups) {
      improvements.push('Anticipate follow-up questions in initial response');
    }
    
    if (indicators.unknown_topic) {
      improvements.push('Expand knowledge base coverage for this topic area');
    }

    return improvements;
  }

  // Persist interaction to file system
  async persistInteraction(interaction) {
    try {
      const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const filename = `interactions-${dateStr}.jsonl`;
      const filepath = path.join(this.logDirectory, filename);
      
      const logEntry = JSON.stringify(interaction) + '\n';
      await fs.appendFile(filepath, logEntry);
    } catch (error) {
      logError('Failed to persist interaction:', error);
    }
  }

  // Log knowledge gaps for analysis
  async logKnowledgeGap(gap) {
    try {
      const filename = 'knowledge-gaps.jsonl';
      const filepath = path.join(this.logDirectory, filename);
      
      const gapEntry = {
        ...gap,
        logged_at: new Date().toISOString()
      };
      
      const logEntry = JSON.stringify(gapEntry) + '\n';
      await fs.appendFile(filepath, logEntry);
    } catch (error) {
      logError('Failed to log knowledge gap:', error);
    }
  }

  // Load existing learning data
  async loadLearningData() {
    try {
      const patternsFile = path.join(this.logDirectory, 'learning-patterns.json');
      const data = await fs.readFile(patternsFile, 'utf8');
      const patterns = JSON.parse(data);
      
      // Convert to Map
      for (const [key, value] of Object.entries(patterns)) {
        this.learningPatterns.set(key, value);
      }
      
      logDebug(`Loaded ${this.learningPatterns.size} learning patterns`);
    } catch (error) {
      // File doesn't exist yet, which is fine for first run
      if (error.code !== 'ENOENT') {
        logError('Error loading learning data:', error);
      }
    }
  }

  // Save learning data periodically
  async saveLearningData() {
    try {
      const patternsFile = path.join(this.logDirectory, 'learning-patterns.json');
      
      // Convert Map to object for serialization
      const patternsObj = Object.fromEntries(this.learningPatterns);
      
      await fs.writeFile(patternsFile, JSON.stringify(patternsObj, null, 2));
      logDebug('Learning patterns saved successfully');
    } catch (error) {
      logError('Failed to save learning data:', error);
    }
  }

  // Get analytics and insights
  getAnalytics() {
    const totalInteractions = Array.from(this.interactionDatabase.values())
      .reduce((sum, sessions) => sum + sessions.length, 0);

    const topTopics = Array.from(this.topicFrequency.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const topPatterns = Array.from(this.learningPatterns.entries())
      .sort(([, a], [, b]) => b.frequency - a.frequency)
      .slice(0, 10);

    return {
      total_interactions: totalInteractions,
      active_sessions: this.interactionDatabase.size,
      top_topics: topTopics,
      top_patterns: topPatterns.map(([key, pattern]) => ({
        pattern_key: key,
        frequency: pattern.frequency,
        topic: pattern.topic,
        intent: pattern.intent
      })),
      learning_patterns_count: this.learningPatterns.size
    };
  }

  // Provide intelligent suggestions based on learning
  getSuggestions(currentMessage) {
    const topic = this.detectTopic(currentMessage);
    const intent = this.detectIntent(currentMessage);
    const key = `${topic}_${intent}`;
    
    const pattern = this.learningPatterns.get(key);
    if (pattern) {
      return {
        similar_questions: pattern.common_questions.slice(0, 3),
        suggested_responses: pattern.effective_responses.slice(0, 2),
        frequency: pattern.frequency,
        confidence: Math.min(pattern.frequency / 10, 1.0) // Max confidence at 10+ interactions
      };
    }

    return null;
  }

  // Start periodic data saving
  startPeriodicSaving(intervalMinutes = 5) {
    setInterval(() => {
      this.saveLearningData();
    }, intervalMinutes * 60 * 1000);
  }
}

export default InteractionLearningSystem;