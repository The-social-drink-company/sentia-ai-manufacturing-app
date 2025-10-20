#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

/**
 * Extract API endpoints from server files
 */
async function extractEndpoints() {
  const serverFiles = glob.sync('../server.js', { cwd: __dirname });
  const serviceFiles = glob.sync('../services/**/*.js', { cwd: __dirname });
  const allFiles = [...serverFiles, ...serviceFiles];
  
  const endpoints = [];
  
  for (const file of allFiles) {
    const content = await fs.readFile(path.join(__dirname, file), 'utf8');
    
    // Parse Express routes
    const routePatterns = [
      /app\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g
    ];
    
    for (const pattern of routePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const [, method, path] = match;
        
        // Extract JSDoc comments if present
        const lineStart = content.lastIndexOf('\n', match.index);
        const previousLines = content.substring(Math.max(0, lineStart - 500), match.index);
        const jsdocMatch = previousLines.match(/\/\*\*[\s\S]*?\*\//);
        
        let description = '';
        let parameters = [];
        let responses = [];
        let tags = [];
        
        if (jsdocMatch) {
          const jsdoc = jsdocMatch[0];
          
          // Extract description
          const descMatch = jsdoc.match(/\/\*\*\s*\n\s*\*\s*([^@\n]+)/);
          if (descMatch) {
            description = descMatch[1].trim();
          }
          
          // Extract parameters
          const paramMatches = jsdoc.matchAll(/@param\s+{([^}]+)}\s+(\S+)\s+(.+)/g);
          for (const paramMatch of paramMatches) {
            parameters.push({
              type: paramMatch[1],
              name: paramMatch[2],
              description: paramMatch[3]
            });
          }
          
          // Extract responses
          const responseMatches = jsdoc.matchAll(/@returns?\s+{([^}]+)}\s+(.+)/g);
          for (const responseMatch of responseMatches) {
            responses.push({
              type: responseMatch[1],
              description: responseMatch[2]
            });
          }
          
          // Extract tags
          const tagMatches = jsdoc.matchAll(/@tag\s+(\S+)/g);
          for (const tagMatch of tagMatches) {
            tags.push(tagMatch[1]);
          }
        }
        
        endpoints.push({
          method: method.toUpperCase(),
          path,
          description: description || 'No description available',
          parameters,
          responses,
          tags,
          file: file.replace('../', ''),
          authentication: path.includes('admin') || path.includes('auth')
        });
      }
    }
  }
  
  return endpoints;
}

/**
 * Generate OpenAPI specification
 */
function generateOpenAPISpec(endpoints) {
  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'CapLiquify Manufacturing Platform API',
      version: '1.0.0',
      description: 'Complete API reference for the CapLiquify Manufacturing Platform',
      contact: {
        name: 'API Support',
        email: 'api@sentia.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://sentia-manufacturing.railway.app',
        description: 'Production server'
      }
    ],
    tags: [
      { name: 'Authentication', description: 'Authentication endpoints' },
      { name: 'Dashboard', description: 'Dashboard data endpoints' },
      { name: 'Forecasting', description: 'Demand forecasting endpoints' },
      { name: 'Optimization', description: 'Stock optimization endpoints' },
      { name: 'Working Capital', description: 'Working capital management' },
      { name: 'Admin', description: 'Administrative endpoints' },
      { name: 'Import', description: 'Data import endpoints' },
      { name: 'Health', description: 'Health and monitoring endpoints' }
    ],
    paths: {},
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        ApiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      schemas: {}
    }
  };
  
  // Group endpoints by path
  const pathGroups = {};
  
  for (const endpoint of endpoints) {
    if (!pathGroups[endpoint.path]) {
      pathGroups[endpoint.path] = {};
    }
    
    const method = endpoint.method.toLowerCase();
    
    // Determine tag based on path
    let tag = 'General';
    if (endpoint.path.includes('/auth')) tag = 'Authentication';
    else if (endpoint.path.includes('/admin')) tag = 'Admin';
    else if (endpoint.path.includes('/forecast')) tag = 'Forecasting';
    else if (endpoint.path.includes('/optimiz')) tag = 'Optimization';
    else if (endpoint.path.includes('/working-capital')) tag = 'Working Capital';
    else if (endpoint.path.includes('/import')) tag = 'Import';
    else if (endpoint.path.includes('/health') || endpoint.path.includes('/metrics')) tag = 'Health';
    else if (endpoint.path.includes('/dashboard')) tag = 'Dashboard';
    
    pathGroups[endpoint.path][method] = {
      summary: endpoint.description,
      tags: [tag],
      security: endpoint.authentication ? [{ BearerAuth: [] }] : [],
      parameters: endpoint.parameters.map(param => ({
        name: param.name,
        in: param.name.startsWith('req.body') ? 'body' : 
            param.name.startsWith('req.params') ? 'path' : 'query',
        required: !param.description.includes('optional'),
        schema: {
          type: param.type.toLowerCase()
        },
        description: param.description
      })),
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                type: 'object'
              }
            }
          }
        },
        '400': {
          description: 'Bad request'
        },
        '401': {
          description: 'Unauthorized'
        },
        '404': {
          description: 'Not found'
        },
        '500': {
          description: 'Internal server error'
        }
      }
    };
  }
  
  spec.paths = pathGroups;
  
  return spec;
}

/**
 * Generate Markdown documentation
 */
function generateMarkdown(endpoints) {
  const grouped = {};
  
  // Group by category
  endpoints.forEach(endpoint => {
    let category = 'Other';
    
    if (endpoint.path.includes('/auth')) category = 'Authentication';
    else if (endpoint.path.includes('/admin')) category = 'Admin';
    else if (endpoint.path.includes('/forecast')) category = 'Forecasting';
    else if (endpoint.path.includes('/optimiz')) category = 'Optimization';
    else if (endpoint.path.includes('/working-capital')) category = 'Working Capital';
    else if (endpoint.path.includes('/import')) category = 'Data Import';
    else if (endpoint.path.includes('/health') || endpoint.path.includes('/metrics')) category = 'Health & Monitoring';
    else if (endpoint.path.includes('/dashboard')) category = 'Dashboard';
    
    if (!grouped[category]) {
      grouped[category] = [];
    }
    
    grouped[category].push(endpoint);
  });
  
  let markdown = `---
title: API Reference
description: Complete API documentation for CapLiquify Manufacturing Platform
owner: engineering
lastReviewed: ${new Date().toISOString().split('T')[0]}
role: Developer
stage: ga
---

import { ApiEndpoint, Note, Warning, CodeBlock, Tabs, Tab } from '../src/components/MDXComponents';

# API Reference

<Note title="Base URL">
  Production: \`https://sentia-manufacturing.railway.app/api\`
  Development: \`http://localhost:5000/api\`
</Note>

## Authentication

Most endpoints require authentication using a Bearer token. Include the token in the Authorization header:

<CodeBlock language="bash">
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.example.com/endpoint
</CodeBlock>

`;
  
  // Generate sections for each category
  Object.keys(grouped).sort().forEach(category => {
    markdown += `\n## ${category}\n\n`;
    
    grouped[category].forEach(endpoint => {
      markdown += `<ApiEndpoint 
  method="${endpoint.method}" 
  path="${endpoint.path}" 
  description="${endpoint.description}"
/>\n\n`;
      
      if (endpoint.parameters.length > 0) {
        markdown += '**Parameters:**\n\n';
        markdown += '| Name | Type | Description |\n';
        markdown += '|------|------|-------------|\n';
        endpoint.parameters.forEach(param => {
          markdown += `| ${param.name} | ${param.type} | ${param.description} |\n`;
        });
        markdown += '\n';
      }
      
      // Add example request/response
      markdown += `<Tabs defaultTab={0}>
  <Tab label="Request">
    <CodeBlock language="bash">
curl -X ${endpoint.method} \\
  ${endpoint.authentication ? '-H "Authorization: Bearer $TOKEN" \\' : ''}
  -H "Content-Type: application/json" \\
  https://api.example.com${endpoint.path}
    </CodeBlock>
  </Tab>
  <Tab label="Response">
    <CodeBlock language="json">
{
  "success": true,
  "data": {}
}
    </CodeBlock>
  </Tab>
</Tabs>\n\n`;
    });
  });
  
  return markdown;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Extracting API endpoints...');
    const endpoints = await extractEndpoints();
    console.log(`Found ${endpoints.length} endpoints`);
    
    // Generate OpenAPI spec
    console.log('Generating OpenAPI specification...');
    const openApiSpec = generateOpenAPISpec(endpoints);
    await fs.writeFile(
      path.join(__dirname, '../public/api/openapi.json'),
      JSON.stringify(openApiSpec, null, 2)
    );
    
    // Generate Markdown documentation
    console.log('Generating Markdown documentation...');
    const markdown = generateMarkdown(endpoints);
    await fs.writeFile(
      path.join(__dirname, '../developer/api-reference.mdx'),
      markdown
    );
    
    console.log('API documentation generated successfully!');
    console.log('- OpenAPI spec: docs/public/api/openapi.json');
    console.log('- Markdown docs: docs/developer/api-reference.mdx');
  } catch (error) {
    console.error('Error generating API documentation:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { extractEndpoints, generateOpenAPISpec, generateMarkdown };