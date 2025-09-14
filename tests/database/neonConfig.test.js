import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  NeonDatabaseService, 
  VectorSearchService, 
  DatabaseMaintenanceService,
  databaseConfig 
} from '../../services/database/neonConfig.js';

// Mock Prisma Client
const mockPrisma = {
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $executeRaw: vi.fn(),
  $queryRaw: vi.fn(),
  $queryRawUnsafe: vi.fn(),
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  product: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  performanceMetric: {
    deleteMany: vi.fn()
  },
  securityAuditLog: {
    deleteMany: vi.fn()
  }
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma)
}));

describe('NeonDatabaseService', () => {
  let neonService;

  beforeEach(() => {
    vi.clearAllMocks();
    neonService = new NeonDatabaseService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration', () => {
    it('should have different configurations for different environments', () => {
      expect(databaseConfig).toHaveProperty('development');
      expect(databaseConfig).toHaveProperty('testing');
      expect(databaseConfig).toHaveProperty('production');
      
      // Development should have more verbose logging
      expect(databaseConfig.development.log).toContain('query');
      expect(databaseConfig.development.log).toContain('info');
      
      // Production should have minimal logging
      expect(databaseConfig.production.log).toEqual(['error']);
      
      // Production should have higher connection limits
      expect(databaseConfig.production.pool.max).toBeGreaterThan(databaseConfig.development.pool.max);
    });

    it('should initialize with correct environment configuration', () => {
      const originalEnv = process.env.NODE_ENV;
      
      process.env.NODE_ENV = 'production';
      const prodService = new NeonDatabaseService();
      expect(prodService.environment).toBe('production');
      expect(prodService.config).toEqual(databaseConfig.production);
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid configuration', async () => {
      mockPrisma.$connect.mockResolvedValue();
      mockPrisma.$executeRaw.mockResolvedValue();
      
      const result = await neonService.initialize();
      
      expect(mockPrisma.$connect).toHaveBeenCalled();
      expect(neonService.isConnected).toBe(true);
      expect(result).toBe(mockPrisma);
    });

    it('should handle initialization errors gracefully', async () => {
      const error = new Error('Connection failed');
      mockPrisma.$connect.mockRejectedValue(error);
      
      await expect(neonService.initialize()).rejects.toThrow('Connection failed');
      expect(neonService.isConnected).toBe(false);
    });

    it('should enable vector extension during initialization', async () => {
      mockPrisma.$connect.mockResolvedValue();
      mockPrisma.$executeRaw.mockResolvedValue();
      
      await neonService.initialize();
      
      expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('CREATE EXTENSION IF NOT EXISTS vector')])
      );
    });

    it('should handle vector extension errors gracefully', async () => {
      mockPrisma.$connect.mockResolvedValue();
      mockPrisma.$executeRaw
        .mockRejectedValueOnce(new Error('Extension already exists'))
        .mockResolvedValue(); // For other calls
      
      // Should not throw error even if vector extension fails
      await expect(neonService.initialize()).resolves.toBeDefined();
    });
  });

  describe('Health Check', () => {
    beforeEach(async () => {
      mockPrisma.$connect.mockResolvedValue();
      mockPrisma.$executeRaw.mockResolvedValue();
      await neonService.initialize();
    });

    it('should return healthy status when database is accessible', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ health_check: 1 }]);
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ 
        active_connections: 5, 
        max_connections: 100 
      }]);
      
      const health = await neonService.healthCheck();
      
      expect(health.status).toBe('healthy');
      expect(health).toHaveProperty('responseTime');
      expect(health).toHaveProperty('connectionInfo');
      expect(health).toHaveProperty('timestamp');
      expect(health.environment).toBe(neonService.environment);
    });

    it('should return unhealthy status when database query fails', async () => {
      const error = new Error('Database connection lost');
      mockPrisma.$queryRaw.mockRejectedValue(error);
      
      const health = await neonService.healthCheck();
      
      expect(health.status).toBe('unhealthy');
      expect(health.error).toBe('Database connection lost');
      expect(health).toHaveProperty('timestamp');
    });

    it('should measure response time accurately', async () => {
      mockPrisma.$queryRaw.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([{ health_check: 1 }]), 100))
      );
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ 
        active_connections: 5, 
        max_connections: 100 
      }]);
      
      const health = await neonService.healthCheck();
      
      expect(health.responseTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(async () => {
      mockPrisma.$connect.mockResolvedValue();
      mockPrisma.$executeRaw.mockResolvedValue();
      await neonService.initialize();
    });

    it('should retrieve query performance statistics', async () => {
      const mockQueryStats = [
        {
          query: 'SELECT * FROM users',
          calls: 100,
          total_exec_time: 1000,
          mean_exec_time: 10,
          max_exec_time: 50,
          rows: 1000
        }
      ];
      
      const mockDbStats = [{
        database_size: '10 MB',
        total_connections: 10,
        active_connections: 5
      }];
      
      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockQueryStats)
        .mockResolvedValueOnce(mockDbStats);
      
      const metrics = await neonService.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('queryStats');
      expect(metrics).toHaveProperty('databaseStats');
      expect(metrics).toHaveProperty('timestamp');
      expect(metrics.queryStats).toEqual(mockQueryStats);
      expect(metrics.databaseStats).toEqual(mockDbStats[0]);
    });

    it('should handle performance metrics errors gracefully', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Query failed'));
      
      const metrics = await neonService.getPerformanceMetrics();
      
      expect(metrics).toBeNull();
    });
  });

  describe('Connection Management', () => {
    it('should disconnect properly', async () => {
      mockPrisma.$connect.mockResolvedValue();
      mockPrisma.$executeRaw.mockResolvedValue();
      mockPrisma.$disconnect.mockResolvedValue();
      
      await neonService.initialize();
      expect(neonService.isConnected).toBe(true);
      
      await neonService.disconnect();
      
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
      expect(neonService.isConnected).toBe(false);
    });

    it('should handle disconnect errors gracefully', async () => {
      mockPrisma.$connect.mockResolvedValue();
      mockPrisma.$executeRaw.mockResolvedValue();
      mockPrisma.$disconnect.mockRejectedValue(new Error('Disconnect failed'));
      
      await neonService.initialize();
      
      // Should not throw error
      await expect(neonService.disconnect()).resolves.toBeUndefined();
    });
  });
});

describe('VectorSearchService', () => {
  let vectorService;
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = {
      $queryRawUnsafe: vi.fn(),
      product: {
        update: vi.fn()
      }
    };
    vectorService = new VectorSearchService(mockPrisma);
    
    // Mock fetch for OpenAI API
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Similarity Search', () => {
    it('should perform vector similarity search successfully', async () => {
      const mockResults = [
        { id: '1', name: 'Product 1', similarity: 0.95 },
        { id: '2', name: 'Product 2', similarity: 0.87 }
      ];
      
      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResults);
      
      const embedding = new Array(1536).fill(0.1);
      const results = await vectorService.similaritySearch(embedding, 'products', 10, 0.8);
      
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('SELECT *, 1 - (embedding <=> $1::vector) as similarity'),
        embedding,
        10,
        0.8
      );
      expect(results).toEqual(mockResults);
    });

    it('should handle similarity search errors', async () => {
      const error = new Error('Vector search failed');
      mockPrisma.$queryRawUnsafe.mockRejectedValue(error);
      
      const embedding = new Array(1536).fill(0.1);
      
      await expect(
        vectorService.similaritySearch(embedding, 'products')
      ).rejects.toThrow('Vector search failed');
    });
  });

  describe('Embedding Generation', () => {
    it('should generate embeddings using OpenAI API', async () => {
      const mockEmbedding = new Array(1536).fill(0.1);
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          data: [{ embedding: mockEmbedding }]
        })
      };
      
      global.fetch.mockResolvedValue(mockResponse);
      
      const result = await vectorService.generateEmbedding('test text');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/embeddings',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('test text')
        })
      );
      expect(result).toEqual(mockEmbedding);
    });

    it('should handle OpenAI API errors', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Unauthorized'
      };
      
      global.fetch.mockResolvedValue(mockResponse);
      
      await expect(
        vectorService.generateEmbedding('test text')
      ).rejects.toThrow('OpenAI API error: Unauthorized');
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      
      await expect(
        vectorService.generateEmbedding('test text')
      ).rejects.toThrow('Network error');
    });
  });

  describe('Product Indexing', () => {
    it('should index product with vector embedding', async () => {
      const mockProduct = {
        id: 'product-1',
        name: 'Test Product',
        description: 'A test product',
        category: 'Test Category'
      };
      
      const mockEmbedding = new Array(1536).fill(0.1);
      
      vi.spyOn(vectorService, 'generateEmbedding').mockResolvedValue(mockEmbedding);
      mockPrisma.product.update.mockResolvedValue(mockProduct);
      
      await vectorService.indexProduct(mockProduct);
      
      expect(vectorService.generateEmbedding).toHaveBeenCalledWith(
        'Test Product A test product Test Category'
      );
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: { embedding: mockEmbedding }
      });
    });

    it('should handle product indexing errors gracefully', async () => {
      const mockProduct = { id: 'product-1', name: 'Test Product' };
      
      vi.spyOn(vectorService, 'generateEmbedding').mockRejectedValue(new Error('API error'));
      
      // Should not throw error
      await expect(vectorService.indexProduct(mockProduct)).resolves.toBeUndefined();
    });
  });

  describe('Product Search', () => {
    it('should search products using vector similarity', async () => {
      const mockEmbedding = new Array(1536).fill(0.1);
      const mockResults = [
        { id: '1', name: 'Product 1', similarity: 0.95 }
      ];
      
      vi.spyOn(vectorService, 'generateEmbedding').mockResolvedValue(mockEmbedding);
      vi.spyOn(vectorService, 'similaritySearch').mockResolvedValue(mockResults);
      
      const results = await vectorService.searchProducts('test query', 5);
      
      expect(vectorService.generateEmbedding).toHaveBeenCalledWith('test query');
      expect(vectorService.similaritySearch).toHaveBeenCalledWith(mockEmbedding, 'products', 5);
      expect(results).toEqual(mockResults);
    });
  });

  describe('Vector Index Creation', () => {
    it('should create vector indexes for performance', async () => {
      mockPrisma.$executeRaw.mockResolvedValue();
      
      await vectorService.createVectorIndexes();
      
      expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_embedding_cosine')])
      );
      expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_insight_embedding_l2')])
      );
      expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_business_insight_embedding_cosine')])
      );
    });

    it('should handle index creation errors gracefully', async () => {
      mockPrisma.$executeRaw.mockRejectedValue(new Error('Index already exists'));
      
      // Should not throw error
      await expect(vectorService.createVectorIndexes()).resolves.toBeUndefined();
    });
  });
});

describe('DatabaseMaintenanceService', () => {
  let maintenanceService;
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = {
      $executeRaw: vi.fn(),
      performanceMetric: {
        deleteMany: vi.fn()
      },
      securityAuditLog: {
        deleteMany: vi.fn()
      }
    };
    maintenanceService = new DatabaseMaintenanceService(mockPrisma);
  });

  describe('Maintenance Operations', () => {
    it('should run database maintenance successfully', async () => {
      mockPrisma.$executeRaw.mockResolvedValue();
      mockPrisma.performanceMetric.deleteMany.mockResolvedValue({ count: 100 });
      mockPrisma.securityAuditLog.deleteMany.mockResolvedValue({ count: 50 });
      
      await maintenanceService.runMaintenance();
      
      expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('ANALYZE')])
      );
    });

    it('should handle maintenance errors gracefully', async () => {
      mockPrisma.$executeRaw.mockRejectedValue(new Error('Maintenance failed'));
      
      // Should not throw error
      await expect(maintenanceService.runMaintenance()).resolves.toBeUndefined();
    });
  });

  describe('Data Cleanup', () => {
    it('should clean up old performance metrics and audit logs', async () => {
      const deletedMetrics = { count: 100 };
      const deletedAuditLogs = { count: 50 };
      
      mockPrisma.performanceMetric.deleteMany.mockResolvedValue(deletedMetrics);
      mockPrisma.securityAuditLog.deleteMany.mockResolvedValue(deletedAuditLogs);
      
      await maintenanceService.cleanupOldData();
      
      expect(mockPrisma.performanceMetric.deleteMany).toHaveBeenCalledWith({
        where: {
          created_at: {
            lt: expect.any(Date)
          }
        }
      });
      
      expect(mockPrisma.securityAuditLog.deleteMany).toHaveBeenCalledWith({
        where: {
          created_at: {
            lt: expect.any(Date)
          }
        }
      });
    });

    it('should handle cleanup errors gracefully', async () => {
      mockPrisma.performanceMetric.deleteMany.mockRejectedValue(new Error('Cleanup failed'));
      
      // Should not throw error
      await expect(maintenanceService.cleanupOldData()).resolves.toBeUndefined();
    });
  });

  describe('Database Backup', () => {
    it('should initiate database backup', async () => {
      const result = await maintenanceService.backupDatabase();
      
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('status', 'initiated');
    });
  });
});

