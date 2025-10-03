/**
 * Example Tool for MCP Server
 * 
 * Demonstrates the tool structure and functionality for the MCP server.
 * This tool can be used for testing the integration between dashboard and MCP server.
 */

export default {
  name: 'example-tool',
  description: 'Example tool for testing MCP server functionality',
  category: 'system',
  version: '1.0.0',
  
  inputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'Message to process',
        minLength: 1,
        maxLength: 500
      },
      multiply: {
        type: 'number',
        description: 'Number to multiply by 2',
        minimum: 0,
        maximum: 1000
      },
      options: {
        type: 'object',
        properties: {
          uppercase: { type: 'boolean', default: false },
          timestamp: { type: 'boolean', default: true }
        }
      }
    },
    required: ['message']
  },

  async execute(params) {
    const { 
      message, 
      multiply = 0, 
      options = {}, 
      correlationId,
      timestamp,
      source,
      user 
    } = params;

    // Process the message
    let processedMessage = message;
    
    if (options.uppercase) {
      processedMessage = processedMessage.toUpperCase();
    }

    // Calculate result if multiply is provided
    const calculation = multiply > 0 ? multiply * 2 : null;

    // Build response
    const result = {
      originalMessage: message,
      processedMessage,
      calculation,
      metadata: {
        toolName: this.name,
        version: this.version,
        correlationId,
        executedAt: options.timestamp ? new Date().toISOString() : undefined,
        source: source || 'unknown',
        executedBy: user?.id || 'anonymous'
      }
    };

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    return result;
  }
};