#!/usr/bin/env node

/**
 * Sentia MCP Server - Railway Deployment
 * Multi-provider MCP server supporting Xero, OpenAI, and Anthropic
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import winston from 'winston';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { XeroProvider } from './providers/xero.js';
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';

// Load environment variables
dotenv.config();

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/mcp-server.log' })
  ]
});

class SentiaMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'sentia-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.providers = {
      xero: new XeroProvider(logger),
      openai: new OpenAIProvider(logger),
      anthropic: new AnthropicProvider(logger)
    };

    this.setupHandlers();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = [];

      // Xero tools
      if (this.providers.xero.isConfigured()) {
        tools.push(
          {
            name: 'xero_get_organizations',
            description: 'Get connected Xero organizations',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'xero_get_contacts',
            description: 'Get contacts from Xero',
            inputSchema: {
              type: 'object',
              properties: {
                tenantId: { type: 'string', description: 'Xero organization ID' },
                page: { type: 'number', description: 'Page number', default: 1 },
                limit: { type: 'number', description: 'Items per page', default: 100 }
              },
              required: ['tenantId']
            }
          },
          {
            name: 'xero_create_contact',
            description: 'Create a new contact in Xero',
            inputSchema: {
              type: 'object',
              properties: {
                tenantId: { type: 'string', description: 'Xero organization ID' },
                name: { type: 'string', description: 'Contact name' },
                email: { type: 'string', description: 'Contact email' },
                phone: { type: 'string', description: 'Contact phone' }
              },
              required: ['tenantId', 'name']
            }
          },
          {
            name: 'xero_get_invoices',
            description: 'Get invoices from Xero',
            inputSchema: {
              type: 'object',
              properties: {
                tenantId: { type: 'string', description: 'Xero organization ID' },
                page: { type: 'number', description: 'Page number', default: 1 },
                limit: { type: 'number', description: 'Items per page', default: 100 }
              },
              required: ['tenantId']
            }
          },
          {
            name: 'xero_create_invoice',
            description: 'Create a new invoice in Xero',
            inputSchema: {
              type: 'object',
              properties: {
                tenantId: { type: 'string', description: 'Xero organization ID' },
                contactId: { type: 'string', description: 'Contact ID' },
                description: { type: 'string', description: 'Invoice description' },
                amount: { type: 'number', description: 'Invoice amount' },
                date: { type: 'string', description: 'Invoice date (YYYY-MM-DD)' }
              },
              required: ['tenantId', 'contactId', 'description', 'amount']
            }
          },
          {
            name: 'xero_get_items',
            description: 'Get items/products from Xero',
            inputSchema: {
              type: 'object',
              properties: {
                tenantId: { type: 'string', description: 'Xero organization ID' },
                page: { type: 'number', description: 'Page number', default: 1 },
                limit: { type: 'number', description: 'Items per page', default: 100 }
              },
              required: ['tenantId']
            }
          }
        );
      }

      // OpenAI tools
      if (this.providers.openai.isConfigured()) {
        tools.push(
          {
            name: 'openai_chat',
            description: 'Generate text using OpenAI GPT models',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: { type: 'string', description: 'The prompt to send to OpenAI' },
                model: { type: 'string', description: 'Model to use', default: 'gpt-4' },
                maxTokens: { type: 'number', description: 'Maximum tokens to generate', default: 1000 },
                temperature: { type: 'number', description: 'Temperature for generation', default: 0.7 }
              },
              required: ['prompt']
            }
          },
          {
            name: 'openai_embeddings',
            description: 'Generate embeddings using OpenAI',
            inputSchema: {
              type: 'object',
              properties: {
                text: { type: 'string', description: 'Text to generate embeddings for' },
                model: { type: 'string', description: 'Embedding model to use', default: 'text-embedding-3-small' }
              },
              required: ['text']
            }
          },
          {
            name: 'openai_analyze_data',
            description: 'Analyze manufacturing data using OpenAI',
            inputSchema: {
              type: 'object',
              properties: {
                data: { type: 'object', description: 'Data to analyze' },
                analysisType: { type: 'string', description: 'Type of analysis to perform' },
                context: { type: 'string', description: 'Additional context for analysis' }
              },
              required: ['data', 'analysisType']
            }
          }
        );
      }

      // Anthropic tools
      if (this.providers.anthropic.isConfigured()) {
        tools.push(
          {
            name: 'anthropic_chat',
            description: 'Generate text using Anthropic Claude models',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: { type: 'string', description: 'The prompt to send to Anthropic' },
                model: { type: 'string', description: 'Model to use', default: 'claude-3-sonnet-20240229' },
                maxTokens: { type: 'number', description: 'Maximum tokens to generate', default: 1000 }
              },
              required: ['prompt']
            }
          },
          {
            name: 'anthropic_analyze_manufacturing',
            description: 'Analyze manufacturing processes using Claude',
            inputSchema: {
              type: 'object',
              properties: {
                processData: { type: 'object', description: 'Manufacturing process data' },
                analysisType: { type: 'string', description: 'Type of analysis' },
                optimizationGoals: { type: 'array', items: { type: 'string' }, description: 'Optimization goals' }
              },
              required: ['processData', 'analysisType']
            }
          }
        );
      }

      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        logger.info(`Tool called: ${name}`, { args });

        let result;

        // Route to appropriate provider
        if (name.startsWith('xero_')) {
          result = await this.handleXeroTool(name, args);
        } else if (name.startsWith('openai_')) {
          result = await this.handleOpenAITool(name, args);
        } else if (name.startsWith('anthropic_')) {
          result = await this.handleAnthropicTool(name, args);
        } else {
          throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        logger.error(`Tool execution failed: ${name}`, { error: error.message, args });
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async handleXeroTool(name, args) {
    const xero = this.providers.xero;
    
    switch (name) {
      case 'xero_get_organizations':
        return await xero.getOrganizations();
      
      case 'xero_get_contacts':
        return await xero.getContacts(args.tenantId, args.page, args.limit);
      
      case 'xero_create_contact':
        return await xero.createContact(args.tenantId, {
          name: args.name,
          email: args.email,
          phone: args.phone
        });
      
      case 'xero_get_invoices':
        return await xero.getInvoices(args.tenantId, args.page, args.limit);
      
      case 'xero_create_invoice':
        return await xero.createInvoice(args.tenantId, {
          contactId: args.contactId,
          description: args.description,
          amount: args.amount,
          date: args.date
        });
      
      case 'xero_get_items':
        return await xero.getItems(args.tenantId, args.page, args.limit);
      
      default:
        throw new Error(`Unknown Xero tool: ${name}`);
    }
  }

  async handleOpenAITool(name, args) {
    const openai = this.providers.openai;
    
    switch (name) {
      case 'openai_chat':
        return await openai.chat(args.prompt, {
          model: args.model,
          maxTokens: args.maxTokens,
          temperature: args.temperature
        });
      
      case 'openai_embeddings':
        return await openai.embeddings(args.text, args.model);
      
      case 'openai_analyze_data':
        return await openai.analyzeData(args.data, args.analysisType, args.context);
      
      default:
        throw new Error(`Unknown OpenAI tool: ${name}`);
    }
  }

  async handleAnthropicTool(name, args) {
    const anthropic = this.providers.anthropic;
    
    switch (name) {
      case 'anthropic_chat':
        return await anthropic.chat(args.prompt, {
          model: args.model,
          maxTokens: args.maxTokens
        });
      
      case 'anthropic_analyze_manufacturing':
        return await anthropic.analyzeManufacturing(args.processData, args.analysisType, args.optimizationGoals);
      
      default:
        throw new Error(`Unknown Anthropic tool: ${name}`);
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Sentia MCP Server started successfully');
  }
}

// Create HTTP server for Railway health checks
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    providers: {
      xero: process.env.XERO_CLIENT_ID ? 'configured' : 'not configured',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
      anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not configured'
    }
  });
});

// API endpoints for direct access
app.get('/api/providers', (req, res) => {
  res.json({
    xero: process.env.XERO_CLIENT_ID ? 'available' : 'not configured',
    openai: process.env.OPENAI_API_KEY ? 'available' : 'not configured',
    anthropic: process.env.ANTHROPIC_API_KEY ? 'available' : 'not configured'
  });
});

// Start HTTP server
app.listen(port, '0.0.0.0', () => {
  logger.info(`HTTP server started on port ${port}`);
});

// Start MCP server
const server = new SentiaMCPServer();
server.start().catch((error) => {
  logger.error('Failed to start MCP server', { error: error.message });
  process.exit(1);
});
