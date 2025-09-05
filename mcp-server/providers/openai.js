/**
 * OpenAI Provider for MCP Server
 * Handles OpenAI API operations
 */

import OpenAI from 'openai';

export class OpenAIProvider {
  constructor(logger) {
    this.logger = logger;
    this.apiKey = process.env.OPENAI_API_KEY;
    this.openai = null;

    if (this.isConfigured()) {
      this.initializeClient();
    }
  }

  isConfigured() {
    return !!this.apiKey;
  }

  initializeClient() {
    this.openai = new OpenAI({
      apiKey: this.apiKey,
    });
  }

  async chat(prompt, options = {}) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not configured');
      }

      const {
        model = 'gpt-4',
        maxTokens = 1000,
        temperature = 0.7
      } = options;

      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature
      });

      return {
        success: true,
        content: response.choices[0].message.content,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        }
      };
    } catch (error) {
      this.logger.error('OpenAI chat failed', { error: error.message });
      throw new Error(`OpenAI chat failed: ${error.message}`);
    }
  }

  async embeddings(text, model = 'text-embedding-3-small') {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not configured');
      }

      const response = await this.openai.embeddings.create({
        model,
        input: text
      });

      return {
        success: true,
        embeddings: response.data[0].embedding,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          totalTokens: response.usage.total_tokens
        }
      };
    } catch (error) {
      this.logger.error('OpenAI embeddings failed', { error: error.message });
      throw new Error(`OpenAI embeddings failed: ${error.message}`);
    }
  }

  async analyzeData(data, analysisType, context = '') {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not configured');
      }

      const systemPrompt = `You are an AI assistant specialized in manufacturing data analysis. 
      Analyze the provided data and provide insights based on the analysis type requested.
      ${context ? `Additional context: ${context}` : ''}`;

      const userPrompt = `Please analyze the following ${analysisType} data:
      
      Data: ${JSON.stringify(data, null, 2)}
      
      Provide:
      1. Key insights and patterns
      2. Potential issues or anomalies
      3. Recommendations for improvement
      4. Summary of findings`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      return {
        success: true,
        analysis: {
          type: analysisType,
          insights: response.choices[0].message.content,
          dataPoints: Array.isArray(data) ? data.length : Object.keys(data).length
        },
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        }
      };
    } catch (error) {
      this.logger.error('OpenAI data analysis failed', { error: error.message });
      throw new Error(`Data analysis failed: ${error.message}`);
    }
  }

  async generateManufacturingReport(data, reportType) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not configured');
      }

      const systemPrompt = `You are a manufacturing operations analyst. Generate a comprehensive ${reportType} report based on the provided manufacturing data.`;

      const userPrompt = `Generate a ${reportType} report for the following manufacturing data:
      
      ${JSON.stringify(data, null, 2)}
      
      Include:
      1. Executive summary
      2. Key performance indicators
      3. Production metrics
      4. Quality metrics
      5. Efficiency analysis
      6. Recommendations
      7. Next steps`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.2
      });

      return {
        success: true,
        report: {
          type: reportType,
          content: response.choices[0].message.content,
          generatedAt: new Date().toISOString()
        },
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        }
      };
    } catch (error) {
      this.logger.error('OpenAI report generation failed', { error: error.message });
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }
}

