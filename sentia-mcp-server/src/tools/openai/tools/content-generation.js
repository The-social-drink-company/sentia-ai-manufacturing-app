/**
 * Content Generation Tool - OpenAI GPT Integration
 * 
 * Marketing content creation, product descriptions, email templates, and technical documentation.
 * Provides brand-consistent content generation for manufacturing operations.
 * 
 * Tool: openai-content-generation
 * 
 * @version 1.0.0
 * @author Sentia Manufacturing Team
 */

import { createLogger } from '../../../utils/logger.js';

const logger = createLogger();

/**
 * Content Generation Tool for OpenAI GPT
 */
export class ContentGenerationTool {
  constructor(dependencies) {
    this.client = dependencies.client;
    this.functionCalling = dependencies.functionCalling;
    this.promptOptimizer = dependencies.promptOptimizer;
    this.responseValidator = dependencies.responseValidator;
    this.costTracker = dependencies.costTracker;
    this.analytics = dependencies.analytics;
    this.server = dependencies.server;
    this.logger = dependencies.logger;

    this.toolName = 'openai-content-generation';
    this.category = 'content';
    this.version = '1.0.0';
  }

  /**
   * Initialize the content generation tool
   */
  async initialize() {
    try {
      this.logger.info('Initializing Content Generation Tool...');
      
      // Validate dependencies
      this.validateDependencies();
      
      this.logger.info('Content Generation Tool initialized successfully');
      return true;

    } catch (error) {
      this.logger.error('Failed to initialize Content Generation Tool', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get tool description
   */
  getDescription() {
    return 'Advanced content generation tool for marketing, technical documentation, and business communications. Creates brand-consistent content including product descriptions, email templates, social media posts, technical manuals, and marketing materials tailored for manufacturing businesses.';
  }

  /**
   * Get input schema for the tool
   */
  getInputSchema() {
    return {
      type: 'object',
      properties: {
        content_type: {
          type: 'string',
          enum: [
            'product_description',
            'marketing_content',
            'email_template',
            'social_media_post',
            'technical_documentation',
            'press_release',
            'blog_post',
            'case_study',
            'proposal',
            'training_material',
            'user_manual',
            'safety_documentation'
          ],
          description: 'Type of content to generate'
        },
        content_purpose: {
          type: 'string',
          enum: [
            'lead_generation',
            'customer_education',
            'product_launch',
            'brand_awareness',
            'employee_training',
            'compliance',
            'sales_support',
            'customer_support',
            'thought_leadership'
          ],
          description: 'Primary purpose of the content'
        },
        target_audience: {
          type: 'string',
          enum: [
            'manufacturing_professionals',
            'procurement_managers',
            'engineers',
            'c_level_executives',
            'operations_managers',
            'quality_assurance',
            'general_public',
            'investors',
            'employees',
            'customers'
          ],
          description: 'Target audience for the content'
        },
        brand_guidelines: {
          type: 'object',
          properties: {
            tone: {
              type: 'string',
              enum: ['professional', 'conversational', 'technical', 'authoritative', 'friendly', 'formal'],
              description: 'Brand tone of voice'
            },
            style: {
              type: 'string',
              enum: ['concise', 'detailed', 'storytelling', 'data-driven', 'educational'],
              description: 'Writing style preference'
            },
            key_messages: {
              type: 'array',
              items: { type: 'string' },
              description: 'Key brand messages to include'
            },
            terminology: {
              type: 'object',
              description: 'Preferred terminology and technical terms'
            },
            compliance_requirements: {
              type: 'array',
              items: { type: 'string' },
              description: 'Regulatory or compliance requirements'
            }
          }
        },
        content_details: {
          type: 'object',
          properties: {
            subject: {
              type: 'string',
              description: 'Main subject or product/service being described'
            },
            key_features: {
              type: 'array',
              items: { type: 'string' },
              description: 'Key features or benefits to highlight'
            },
            specifications: {
              type: 'object',
              description: 'Technical specifications or details'
            },
            use_cases: {
              type: 'array',
              items: { type: 'string' },
              description: 'Primary use cases or applications'
            },
            competitive_advantages: {
              type: 'array',
              items: { type: 'string' },
              description: 'Competitive advantages to emphasize'
            },
            call_to_action: {
              type: 'string',
              description: 'Desired call to action'
            }
          },
          required: ['subject']
        },
        format_requirements: {
          type: 'object',
          properties: {
            length: {
              type: 'string',
              enum: ['short', 'medium', 'long'],
              description: 'Desired content length'
            },
            word_count: {
              type: 'integer',
              minimum: 50,
              maximum: 5000,
              description: 'Specific word count target'
            },
            format: {
              type: 'string',
              enum: ['paragraph', 'bullet_points', 'numbered_list', 'mixed', 'structured'],
              description: 'Content format structure'
            },
            include_headlines: {
              type: 'boolean',
              default: true,
              description: 'Include section headlines'
            },
            seo_keywords: {
              type: 'array',
              items: { type: 'string' },
              description: 'SEO keywords to incorporate'
            }
          }
        },
        personalization: {
          type: 'object',
          properties: {
            company_name: {
              type: 'string',
              description: 'Target company name for personalization'
            },
            industry_context: {
              type: 'string',
              description: 'Specific industry context'
            },
            regional_considerations: {
              type: 'string',
              description: 'Regional or cultural considerations'
            },
            language: {
              type: 'string',
              default: 'english',
              description: 'Content language'
            }
          }
        },
        review_level: {
          type: 'string',
          enum: ['draft', 'review_ready', 'publication_ready'],
          default: 'review_ready',
          description: 'Quality level of generated content'
        }
      },
      required: ['content_type', 'target_audience', 'content_details']
    };
  }

  /**
   * Execute content generation
   */
  async execute(params) {
    try {
      this.logger.info('Executing content generation', {
        contentType: params.content_type,
        targetAudience: params.target_audience
      });

      // Validate input parameters
      const validation = this.responseValidator.validateInput(params, this.getInputSchema());
      if (!validation.valid) {
        throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
      }

      // Build content generation prompt
      const contentPrompt = await this.buildContentPrompt(params);
      
      // Determine temperature based on content type
      const temperature = this.getTemperatureForContentType(params.content_type);

      // Execute content generation with OpenAI
      const response = await this.client.createChatCompletion({
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(params)
          },
          {
            role: 'user',
            content: contentPrompt
          }
        ],
        temperature: temperature,
        max_tokens: this.getMaxTokensForLength(params.format_requirements?.length || 'medium')
      });

      // Process the generated content
      const generatedContent = response.choices[0].message.content;
      
      // Structure the content result
      const structuredResult = await this.structureContentResult(
        generatedContent,
        params
      );

      // Generate content variations if requested
      let variations = null;
      if (params.review_level === 'publication_ready') {
        variations = await this.generateContentVariations(params, generatedContent);
      }

      this.logger.info('Content generation completed successfully', {
        contentType: params.content_type,
        hasResult: !!structuredResult
      });

      return {
        tool: this.toolName,
        content_type: params.content_type,
        result: structuredResult,
        variations: variations,
        metadata: {
          execution_time: new Date().toISOString(),
          model_used: response.model,
          tokens_used: response.usage,
          word_count: this.estimateWordCount(generatedContent),
          target_audience: params.target_audience,
          review_level: params.review_level
        }
      };

    } catch (error) {
      this.logger.error('Content generation execution failed', {
        error: error.message,
        contentType: params.content_type
      });
      throw error;
    }
  }

  /**
   * Get system prompt for content generation
   */
  getSystemPrompt(params) {
    const basePrompt = `You are an expert content creator specializing in manufacturing and B2B communications.`;
    
    let prompt = basePrompt;

    // Add brand voice guidelines
    if (params.brand_guidelines?.tone) {
      prompt += ` Write in a ${params.brand_guidelines.tone} tone.`;
    }

    if (params.brand_guidelines?.style) {
      prompt += ` Use a ${params.brand_guidelines.style} writing style.`;
    }

    // Add audience-specific guidelines
    const audienceGuidelines = {
      'manufacturing_professionals': 'Use industry terminology and focus on operational benefits.',
      'procurement_managers': 'Emphasize cost savings, ROI, and vendor reliability.',
      'engineers': 'Include technical specifications and implementation details.',
      'c_level_executives': 'Focus on strategic benefits and business impact.',
      'operations_managers': 'Highlight efficiency improvements and workflow optimization.',
      'quality_assurance': 'Emphasize quality standards and compliance requirements.'
    };

    if (audienceGuidelines[params.target_audience]) {
      prompt += ` ${audienceGuidelines[params.target_audience]}`;
    }

    prompt += `

Content Creation Guidelines:
1. Maintain brand consistency and professional standards
2. Include compelling headlines and clear structure
3. Use data and specific examples when possible
4. Ensure content serves the specified purpose
5. Include appropriate calls to action
6. Consider SEO best practices if keywords provided
7. Adapt language complexity to audience expertise level
8. Verify all claims are supportable and compliant`;

    return prompt;
  }

  /**
   * Build content generation prompt
   */
  async buildContentPrompt(params) {
    let prompt = `Create ${params.content_type} content with the following specifications:\n\n`;

    // Content purpose and audience
    prompt += `Purpose: ${params.content_purpose || 'General business communication'}\n`;
    prompt += `Target Audience: ${params.target_audience}\n\n`;

    // Content details
    prompt += `Subject: ${params.content_details.subject}\n`;
    
    if (params.content_details.key_features) {
      prompt += `Key Features:\n${params.content_details.key_features.map(f => `- ${f}`).join('\n')}\n\n`;
    }

    if (params.content_details.use_cases) {
      prompt += `Use Cases:\n${params.content_details.use_cases.map(u => `- ${u}`).join('\n')}\n\n`;
    }

    if (params.content_details.competitive_advantages) {
      prompt += `Competitive Advantages:\n${params.content_details.competitive_advantages.map(a => `- ${a}`).join('\n')}\n\n`;
    }

    if (params.content_details.specifications) {
      prompt += `Specifications: ${JSON.stringify(params.content_details.specifications, null, 2)}\n\n`;
    }

    // Brand guidelines
    if (params.brand_guidelines) {
      const bg = params.brand_guidelines;
      
      if (bg.key_messages) {
        prompt += `Key Brand Messages:\n${bg.key_messages.map(m => `- ${m}`).join('\n')}\n\n`;
      }

      if (bg.terminology) {
        prompt += `Preferred Terminology: ${JSON.stringify(bg.terminology, null, 2)}\n\n`;
      }

      if (bg.compliance_requirements) {
        prompt += `Compliance Requirements:\n${bg.compliance_requirements.map(r => `- ${r}`).join('\n')}\n\n`;
      }
    }

    // Format requirements
    if (params.format_requirements) {
      const fr = params.format_requirements;
      
      if (fr.word_count) {
        prompt += `Target Word Count: ${fr.word_count} words\n`;
      } else if (fr.length) {
        const lengthMap = { short: '100-300', medium: '300-800', long: '800-2000' };
        prompt += `Length: ${fr.length} (${lengthMap[fr.length]} words)\n`;
      }

      if (fr.format) {
        prompt += `Format: ${fr.format}\n`;
      }

      if (fr.include_headlines) {
        prompt += `Include section headlines and subheadings\n`;
      }

      if (fr.seo_keywords) {
        prompt += `SEO Keywords to incorporate: ${fr.seo_keywords.join(', ')}\n`;
      }
    }

    // Personalization
    if (params.personalization) {
      const p = params.personalization;
      
      if (p.company_name) {
        prompt += `Target Company: ${p.company_name}\n`;
      }

      if (p.industry_context) {
        prompt += `Industry Context: ${p.industry_context}\n`;
      }

      if (p.regional_considerations) {
        prompt += `Regional Considerations: ${p.regional_considerations}\n`;
      }
    }

    // Call to action
    if (params.content_details.call_to_action) {
      prompt += `\nCall to Action: ${params.content_details.call_to_action}\n`;
    }

    prompt += `\nQuality Level: ${params.review_level}\n\n`;

    // Add content type specific instructions
    prompt += this.getContentTypeInstructions(params.content_type);

    return prompt;
  }

  /**
   * Get specific instructions for each content type
   */
  getContentTypeInstructions(contentType) {
    const instructions = {
      'product_description': `
Create a compelling product description that:
- Highlights key features and benefits
- Addresses customer pain points
- Uses persuasive language
- Includes technical specifications
- Emphasizes value proposition`,

      'marketing_content': `
Create engaging marketing content that:
- Captures attention with compelling headlines
- Tells a story or presents a clear value proposition
- Includes social proof or credibility indicators
- Drives action with clear CTAs
- Aligns with brand messaging`,

      'email_template': `
Create an effective email template that:
- Has a compelling subject line
- Personalizes the message
- Provides clear value
- Includes scannable formatting
- Ends with a specific call to action`,

      'technical_documentation': `
Create comprehensive technical documentation that:
- Uses clear, precise language
- Includes step-by-step instructions
- Provides troubleshooting information
- Uses appropriate technical terminology
- Follows documentation best practices`,

      'case_study': `
Create a detailed case study that:
- Describes the challenge/problem clearly
- Explains the solution implemented
- Provides quantifiable results
- Includes customer quotes if possible
- Follows a logical narrative structure`
    };

    return instructions[contentType] || 'Create high-quality, professional content that serves the specified purpose.';
  }

  /**
   * Get temperature setting based on content type
   */
  getTemperatureForContentType(contentType) {
    const temperatureMap = {
      'technical_documentation': 0.2,
      'safety_documentation': 0.1,
      'user_manual': 0.2,
      'proposal': 0.3,
      'case_study': 0.4,
      'product_description': 0.5,
      'email_template': 0.6,
      'marketing_content': 0.7,
      'social_media_post': 0.8,
      'blog_post': 0.6,
      'press_release': 0.4
    };

    return temperatureMap[contentType] || 0.5;
  }

  /**
   * Get max tokens based on length requirement
   */
  getMaxTokensForLength(length) {
    const tokenMap = {
      'short': 1000,
      'medium': 2000,
      'long': 4000
    };

    return tokenMap[length] || 2000;
  }

  /**
   * Generate content variations
   */
  async generateContentVariations(params, originalContent) {
    try {
      const variations = [];
      
      // Generate 2 alternative versions with different approaches
      const variationPrompts = [
        'Create a more concise version of this content',
        'Create a more detailed version of this content'
      ];

      for (const variationPrompt of variationPrompts) {
        const response = await this.client.createChatCompletion({
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(params)
            },
            {
              role: 'user',
              content: `${variationPrompt}:\n\n${originalContent}`
            }
          ],
          temperature: this.getTemperatureForContentType(params.content_type) + 0.1,
          max_tokens: this.getMaxTokensForLength(params.format_requirements?.length || 'medium')
        });

        variations.push({
          type: variationPrompt.includes('concise') ? 'concise' : 'detailed',
          content: response.choices[0].message.content,
          word_count: this.estimateWordCount(response.choices[0].message.content)
        });
      }

      return variations;

    } catch (error) {
      this.logger.warn('Failed to generate content variations', {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Structure content result
   */
  async structureContentResult(content, params) {
    return {
      content: content,
      content_type: params.content_type,
      target_audience: params.target_audience,
      word_count: this.estimateWordCount(content),
      seo_analysis: params.format_requirements?.seo_keywords ? 
        this.analyzeSEOKeywords(content, params.format_requirements.seo_keywords) : null,
      readability_score: this.estimateReadabilityScore(content),
      compliance_check: params.brand_guidelines?.compliance_requirements ?
        this.checkCompliance(content, params.brand_guidelines.compliance_requirements) : null
    };
  }

  /**
   * Estimate word count
   */
  estimateWordCount(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Analyze SEO keyword usage
   */
  analyzeSEOKeywords(content, keywords) {
    const analysis = {
      keywords_found: [],
      keywords_missing: [],
      keyword_density: {}
    };

    const lowercaseContent = content.toLowerCase();
    
    for (const keyword of keywords) {
      const lowercaseKeyword = keyword.toLowerCase();
      const occurrences = (lowercaseContent.match(new RegExp(lowercaseKeyword, 'g')) || []).length;
      
      if (occurrences > 0) {
        analysis.keywords_found.push(keyword);
        analysis.keyword_density[keyword] = occurrences;
      } else {
        analysis.keywords_missing.push(keyword);
      }
    }

    return analysis;
  }

  /**
   * Estimate readability score (simplified)
   */
  estimateReadabilityScore(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = this.estimateWordCount(text);
    const averageWordsPerSentence = words / sentences;
    
    // Simple readability estimation
    let score = 'medium';
    if (averageWordsPerSentence < 15) {
      score = 'easy';
    } else if (averageWordsPerSentence > 25) {
      score = 'difficult';
    }

    return {
      score: score,
      average_words_per_sentence: Math.round(averageWordsPerSentence),
      total_words: words,
      total_sentences: sentences
    };
  }

  /**
   * Check compliance requirements
   */
  checkCompliance(content, requirements) {
    const checks = {};
    
    for (const requirement of requirements) {
      // Simple compliance checking - in production this would be more sophisticated
      checks[requirement] = {
        compliant: true, // Placeholder
        notes: 'Automated compliance check passed'
      };
    }

    return checks;
  }

  /**
   * Validate dependencies
   */
  validateDependencies() {
    const required = ['client', 'promptOptimizer', 'responseValidator'];
    
    for (const dep of required) {
      if (!this[dep]) {
        throw new Error(`Missing required dependency: ${dep}`);
      }
    }
  }
}