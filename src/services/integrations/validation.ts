// Integration validation service for all external APIs

import { ShopifyService } from './shopify';
import { AmazonService } from './amazon';
import { UnleashedService } from './unleashed';
import { XeroService } from './xero';
import { OpenAIService } from './openai';

export interface IntegrationStatus {
  name: string;
  status: 'connected' | 'error' | 'warning' | 'disabled';
  message: string;
  lastChecked: Date;
  responseTime?: number;
  details?: {
    version?: string;
    features?: string[];
    limits?: {
      rateLimitRemaining?: number;
      rateLimitReset?: Date;
    };
  };
}

export interface ValidationResult {
  overall: 'healthy' | 'degraded' | 'critical';
  integrations: IntegrationStatus[];
  summary: {
    total: number;
    connected: number;
    errors: number;
    warnings: number;
    disabled: number;
  };
}

export class IntegrationValidator {
  private static instance: IntegrationValidator;
  private services: Map<string, any> = new Map();
  private lastValidation: ValidationResult | null = null;

  constructor() {
    // Initialize services
    this.services.set('shopify', new ShopifyService());
    this.services.set('amazon', new AmazonService());
    this.services.set('unleashed', new UnleashedService());
    this.services.set('xero', new XeroService());
    this.services.set('openai', new OpenAIService());
  }

  static getInstance(): IntegrationValidator {
    if (!this.instance) {
      this.instance = new IntegrationValidator();
    }
    return this.instance;
  }

  async validateAllIntegrations(): Promise<ValidationResult> {
    console.log('Starting integration validation...');
    const startTime = performance.now();
    
    const integrationPromises = Array.from(this.services.entries()).map(
      ([name, service]) => this.validateSingleIntegration(name, service)
    );

    const integrations = await Promise.all(integrationPromises);
    
    const summary = this.calculateSummary(integrations);
    const overall = this.determineOverallHealth(summary);

    const result: ValidationResult = {
      overall,
      integrations,
      summary
    };

    this.lastValidation = result;
    const totalTime = performance.now() - startTime;
    
    console.log(`Integration validation completed in ${totalTime.toFixed(2)}ms:`, {
      overall,
      summary
    });

    return result;
  }

  private async validateSingleIntegration(
    name: string, 
    service: any
  ): Promise<IntegrationStatus> {
    const startTime = performance.now();
    
    try {
      // Check if service is configured
      if (!this.isServiceConfigured(name)) {
        return {
          name,
          status: 'disabled',
          message: `${name} integration is not configured`,
          lastChecked: new Date()
        };
      }

      // Perform health check
      const healthCheck = await this.performHealthCheck(name, service);
      const responseTime = performance.now() - startTime;

      return {
        name,
        status: healthCheck.status,
        message: healthCheck.message,
        lastChecked: new Date(),
        responseTime: Math.round(responseTime),
        details: healthCheck.details
      };

    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      return {
        name,
        status: 'error',
        message: `Failed to validate ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date(),
        responseTime: Math.round(responseTime)
      };
    }
  }

  private isServiceConfigured(name: string): boolean {
    const configKeys = {
      shopify: ['VITE_SHOPIFY_STORE_URL', 'VITE_SHOPIFY_ACCESS_TOKEN'],
      amazon: ['VITE_AMAZON_ACCESS_KEY_ID', 'VITE_AMAZON_SECRET_ACCESS_KEY'],
      unleashed: ['VITE_UNLEASHED_API_ID', 'VITE_UNLEASHED_API_KEY'],
      xero: ['VITE_XERO_CLIENT_ID', 'VITE_XERO_CLIENT_SECRET'],
      openai: ['VITE_OPENAI_API_KEY']
    };

    const keys = configKeys[name as keyof typeof configKeys] || [];
    return keys.every(key => !!import.meta.env[key]);
  }

  private async performHealthCheck(name: string, service: any): Promise<{
    status: IntegrationStatus['status'];
    message: string;
    details?: any;
  }> {
    try {
      switch (name) {
        case 'shopify':
          return await this.validateShopify(service);
        case 'amazon':
          return await this.validateAmazon(service);
        case 'unleashed':
          return await this.validateUnleashed(service);
        case 'xero':
          return await this.validateXero(service);
        case 'openai':
          return await this.validateOpenAI(service);
        default:
          return {
            status: 'error',
            message: `Unknown service: ${name}`
          };
      }
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Health check failed'
      };
    }
  }

  private async validateShopify(service: ShopifyService): Promise<{
    status: IntegrationStatus['status'];
    message: string;
    details?: any;
  }> {
    try {
      // Test basic connectivity with shop info
      const shopInfo = await service.getShopInfo();
      
      // Check rate limits
      const rateLimitInfo = service.getRateLimitInfo();
      
      return {
        status: 'connected',
        message: `Connected to ${shopInfo.name}`,
        details: {
          version: 'GraphQL Admin API 2024-01',
          features: ['Orders', 'Products', 'Customers', 'Inventory'],
          limits: {
            rateLimitRemaining: rateLimitInfo.remaining,
            rateLimitReset: rateLimitInfo.resetTime
          }
        }
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        return {
          status: 'warning',
          message: 'Shopify rate limit exceeded, service throttled'
        };
      }
      
      return {
        status: 'error',
        message: `Shopify validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async validateAmazon(service: AmazonService): Promise<{
    status: IntegrationStatus['status'];
    message: string;
    details?: any;
  }> {
    try {
      // Test basic connectivity with marketplace info
      const marketplaces = await service.getMarketplaces();
      
      return {
        status: 'connected',
        message: `Connected to ${marketplaces.length} marketplace(s)`,
        details: {
          version: 'SP-API v2021-06-30',
          features: ['Orders', 'Inventory', 'Reports', 'Feeds'],
          limits: {
            rateLimitRemaining: 100, // Example
            rateLimitReset: new Date(Date.now() + 3600000) // 1 hour from now
          }
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Amazon SP-API validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async validateUnleashed(service: UnleashedService): Promise<{
    status: IntegrationStatus['status'];
    message: string;
    details?: any;
  }> {
    try {
      // Test basic connectivity
      const companyInfo = await service.getCompanyInfo();
      
      return {
        status: 'connected',
        message: `Connected to ${companyInfo.companyName}`,
        details: {
          version: 'REST API v4.8',
          features: ['Products', 'Sales Orders', 'Purchase Orders', 'Stock'],
          limits: {
            rateLimitRemaining: 1000, // Example
            rateLimitReset: new Date(Date.now() + 3600000)
          }
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Unleashed validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async validateXero(service: XeroService): Promise<{
    status: IntegrationStatus['status'];
    message: string;
    details?: any;
  }> {
    try {
      // Test basic connectivity
      const tenantInfo = await service.getTenantInfo();
      
      return {
        status: 'connected',
        message: `Connected to ${tenantInfo.tenantName}`,
        details: {
          version: 'Accounting API 2.0',
          features: ['Accounting', 'Bank Feeds', 'Payroll', 'Fixed Assets'],
          limits: {
            rateLimitRemaining: 5000, // Daily limit example
            rateLimitReset: new Date(Date.now() + 86400000) // 24 hours
          }
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Xero validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async validateOpenAI(service: OpenAIService): Promise<{
    status: IntegrationStatus['status'];
    message: string;
    details?: any;
  }> {
    try {
      // Test with a simple completion
      const testResponse = await service.testConnection();
      
      return {
        status: 'connected',
        message: 'OpenAI API responding normally',
        details: {
          version: 'API v1',
          features: ['Chat Completions', 'Embeddings', 'Fine-tuning'],
          limits: {
            rateLimitRemaining: 1000, // Example
            rateLimitReset: new Date(Date.now() + 60000) // 1 minute
          }
        }
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('quota')) {
        return {
          status: 'warning',
          message: 'OpenAI quota exceeded or billing issue'
        };
      }
      
      return {
        status: 'error',
        message: `OpenAI validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private calculateSummary(integrations: IntegrationStatus[]) {
    return {
      total: integrations.length,
      connected: integrations.filter(i => i.status === 'connected').length,
      errors: integrations.filter(i => i.status === 'error').length,
      warnings: integrations.filter(i => i.status === 'warning').length,
      disabled: integrations.filter(i => i.status === 'disabled').length
    };
  }

  private determineOverallHealth(summary: ValidationResult['summary']): ValidationResult['overall'] {
    if (summary.errors > 0) {
      return 'critical';
    }
    
    if (summary.warnings > 0 || summary.connected < summary.total / 2) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  getLastValidation(): ValidationResult | null {
    return this.lastValidation;
  }

  async validateIntegration(name: string): Promise<IntegrationStatus> {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Unknown integration: ${name}`);
    }

    return await this.validateSingleIntegration(name, service);
  }

  // Continuous monitoring
  startContinuousMonitoring(intervalMinutes: number = 15): void {
    const intervalMs = intervalMinutes * 60 * 1000;
    
    setInterval(async () => {
      try {
        await this.validateAllIntegrations();
      } catch (error) {
        console.error('Continuous monitoring failed:', error);
      }
    }, intervalMs);

    console.log(`Started continuous integration monitoring (every ${intervalMinutes} minutes)`);
  }
}

// Singleton instance
export const integrationValidator = IntegrationValidator.getInstance();