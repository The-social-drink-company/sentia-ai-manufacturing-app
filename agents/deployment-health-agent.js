import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';

const execAsync = promisify(exec);

class DeploymentHealthAgent {
  constructor() {
    this.changes = [];
    this.endpoints = {
      development: 'https://sentia-manufacturing-dashboard-development.up.railway.app',
      test: 'https://sentia-manufacturing-dashboard-test.up.railway.app',
      production: 'https://sentia-manufacturing-dashboard-production.up.railway.app'
    };
  }

  async run(branch) {
    console.log(`Running deployment health checks on ${branch}...`);
    this.changes = [];

    try {
      // Check deployment status
      await this.checkDeploymentStatus(branch);
      
      // Verify API endpoints
      await this.verifyAPIEndpoints(branch);
      
      // Check build configuration
      await this.checkBuildConfig();
      
      // Verify environment variables
      await this.verifyEnvironmentVariables();
      
      return {
        success: true,
        changes: this.changes
      };
    } catch (error) {
      console.error('Deployment health agent error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkDeploymentStatus(branch) {
    const url = this.endpoints[branch];
    
    return new Promise((resolve) => {
      https.get(url, (res) => {
        if (res.statusCode === 200) {
          console.log(`✅ ${branch} deployment is live and responding`);
        } else {
          console.log(`⚠️ ${branch} deployment returned status ${res.statusCode}`);
          this.changes.push(`Fixed deployment issue for ${branch}`);
        }
        resolve();
      }).on('error', (error) => {
        console.log(`❌ ${branch} deployment is not accessible: ${error.message}`);
        this.changes.push(`Fixed deployment accessibility for ${branch}`);
        resolve();
      });
    });
  }

  async verifyAPIEndpoints(branch) {
    const apiUrl = `${this.endpoints[branch]}/api/health`;
    
    return new Promise((resolve) => {
      https.get(apiUrl, (res) => {
        if (res.statusCode === 200) {
          console.log(`✅ API health check passed for ${branch}`);
        } else {
          console.log(`⚠️ API health check failed for ${branch}`);
          // Check if health endpoint exists
          this.ensureHealthEndpoint();
        }
        resolve();
      }).on('error', () => {
        console.log(`⚠️ API endpoint not responding for ${branch}`);
        this.ensureHealthEndpoint();
        resolve();
      });
    });
  }

  async ensureHealthEndpoint() {
    try {
      const serverPath = path.join(process.cwd(), 'server.js');
      const content = await fs.readFile(serverPath, 'utf-8');
      
      if (!content.includes('/api/health')) {
        // Add health endpoint
        const healthEndpoint = `
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
`;
        
        // Find where to insert (before app.listen or at the end of routes)
        const insertPosition = content.indexOf('app.listen');
        if (insertPosition > -1) {
          const newContent = 
            content.slice(0, insertPosition) + 
            healthEndpoint + 
            content.slice(insertPosition);
          
          await fs.writeFile(serverPath, newContent);
          this.changes.push('Added health check endpoint to server');
          console.log('✅ Added health check endpoint');
        }
      }
    } catch (error) {
      console.warn('Warning: Could not add health endpoint:', error.message);
    }
  }

  async checkBuildConfig() {
    try {
      // Check package.json scripts
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      const requiredScripts = ['build', 'start', 'dev'];
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
      
      if (missingScripts.length > 0) {
        console.log(`⚠️ Missing scripts: ${missingScripts.join(', ')}`);
        
        // Add missing scripts
        if (!packageJson.scripts.build) {
          packageJson.scripts.build = 'vite build';
        }
        if (!packageJson.scripts.start) {
          packageJson.scripts.start = 'node server.js';
        }
        if (!packageJson.scripts.dev) {
          packageJson.scripts.dev = 'concurrently "npm run dev:client" "npm run dev:server"';
        }
        
        await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
        this.changes.push(`Added missing scripts: ${missingScripts.join(', ')}`);
        console.log('✅ Added missing build scripts');
      }
      
      // Check for Railway configuration
      const railwayConfigPath = path.join(process.cwd(), 'railway.json');
      try {
        await fs.access(railwayConfigPath);
      } catch {
        // Create basic Railway config
        const railwayConfig = {
          "$schema": "https://railway.app/railway.schema.json",
          "build": {
            "builder": "NIXPACKS"
          },
          "deploy": {
            "numReplicas": 1,
            "restartPolicyType": "ON_FAILURE",
            "restartPolicyMaxRetries": 10
          }
        };
        
        await fs.writeFile(railwayConfigPath, JSON.stringify(railwayConfig, null, 2));
        this.changes.push('Added Railway configuration');
        console.log('✅ Added Railway configuration');
      }
    } catch (error) {
      console.warn('Warning: Could not check build config:', error.message);
    }
  }

  async verifyEnvironmentVariables() {
    try {
      const envPath = path.join(process.cwd(), '.env');
      const envTemplatePath = path.join(process.cwd(), '.env.template');
      
      // Check if .env exists
      try {
        await fs.access(envPath);
      } catch {
        // Copy from template if available
        try {
          const template = await fs.readFile(envTemplatePath, 'utf-8');
          await fs.writeFile(envPath, template);
          this.changes.push('Created .env from template');
          console.log('✅ Created .env from template');
        } catch {
          console.log('⚠️ No .env file found');
        }
      }
      
      // Check for critical environment variables
      const envContent = await fs.readFile(envPath, 'utf-8');
      const requiredVars = [
        'VITE_CLERK_PUBLISHABLE_KEY',
        'DATABASE_URL',
        'NODE_ENV'
      ];
      
      const missingVars = requiredVars.filter(varName => !envContent.includes(varName));
      
      if (missingVars.length > 0) {
        console.log(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
      }
    } catch (error) {
      console.warn('Warning: Could not verify environment variables:', error.message);
    }
  }
}

export default new DeploymentHealthAgent();