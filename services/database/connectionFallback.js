/**
 * Database Connection Fallback System
 * Provides graceful handling of database connectivity issues
 * with automatic reconnection and fallback mechanisms
 */

import { PrismaClient } from '@prisma/client';
import { logInfo, logWarn, logError } from '../observability/structuredLogger.js';

class DatabaseConnectionFallback {
  constructor() {
    this.prisma = null;
    this.isConnected = false;
    this.reconnectionAttempts = 0;
    this.maxReconnectionAttempts = 5;
    this.reconnectionTimeout = 30000; // 30 seconds
    this.lastConnectionAttempt = null;
    this.fallbackData = new Map(); // In-memory fallback storage
    
    this.initialize();
  }

  async initialize() {
    try {
      await this.connect();
    } catch (error) {
      logWarn('Database connection failed during initialization, running in fallback mode', {
        error: error.message
      });
    }
  }

  async connect() {
    try {
      this.prisma = new PrismaClient({
        errorFormat: 'minimal',
        log: ['error'],
      });

      // Test connection with a simple query
      await this.prisma.$queryRaw`SELECT 1 as test`;
      
      this.isConnected = true;
      this.reconnectionAttempts = 0;
      
      logInfo('Database connection established successfully');
      return true;
    } catch (error) {
      this.isConnected = false;
      this.prisma = null;
      
      logError('Database connection failed', {
        error: error.message,
        attempts: this.reconnectionAttempts
      });
      
      // Schedule reconnection attempt if we haven't exceeded max attempts
      if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
        this.scheduleReconnection();
      }
      
      throw error;
    }
  }

  scheduleReconnection() {
    if (this.lastConnectionAttempt && 
        Date.now() - this.lastConnectionAttempt < this.reconnectionTimeout) {
      return; // Don't spam reconnection attempts
    }

    this.lastConnectionAttempt = Date.now();
    this.reconnectionAttempts++;

    setTimeout(async _() => {
      logInfo('Attempting database reconnection', {
        attempt: this.reconnectionAttempts,
        maxAttempts: this.maxReconnectionAttempts
      });

      try {
        await this.connect();
        logInfo('Database reconnection successful');
      } catch (error) {
        logWarn('Database reconnection failed', {
          attempt: this.reconnectionAttempts,
          error: error.message
        });
      }
    }, this.reconnectionTimeout);
  }

  /**
   * Execute a database operation with fallback handling
   */
  async execute(operation, fallbackValue = null, cacheKey = null) {
    if (!this.isConnected || !this.prisma) {
      logWarn('Database not connected, using fallback value', { cacheKey });
      
      // Try to return cached data if available
      if (cacheKey && this.fallbackData.has(cacheKey)) {
        return this.fallbackData.get(cacheKey);
      }
      
      return fallbackValue;
    }

    try {
      const result = await operation(this.prisma);
      
      // Cache successful results
      if (cacheKey) {
        this.fallbackData.set(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      logError('Database operation failed', {
        error: error.message,
        cacheKey
      });

      // Mark as disconnected if it's a connection error
      if (error.message.includes("Can't reach database server") || 
          error.message.includes("connection") ||
          error.code === 'P1001') {
        this.isConnected = false;
        this.scheduleReconnection();
      }

      // Return cached data if available
      if (cacheKey && this.fallbackData.has(cacheKey)) {
        logWarn('Returning cached data due to database error', { cacheKey });
        return this.fallbackData.get(cacheKey);
      }

      return fallbackValue;
    }
  }

  /**
   * Get connection status for health checks
   */
  getStatus() {
    return {
      connected: this.isConnected,
      reconnectionAttempts: this.reconnectionAttempts,
      maxReconnectionAttempts: this.maxReconnectionAttempts,
      lastConnectionAttempt: this.lastConnectionAttempt,
      cacheSize: this.fallbackData.size
    };
  }

  /**
   * Force a reconnection attempt
   */
  async forceReconnect() {
    this.reconnectionAttempts = 0;
    this.lastConnectionAttempt = null;
    
    try {
      await this.connect();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Graceful shutdown
   */
  async disconnect() {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
      this.isConnected = false;
    }
    
    logInfo('Database connection closed');
  }

  /**
   * Clear fallback cache
   */
  clearCache() {
    this.fallbackData.clear();
    logInfo('Database fallback cache cleared');
  }
}

// Singleton instance
let dbFallback = null;

export function getDatabaseFallback() {
  if (!dbFallback) {
    dbFallback = new DatabaseConnectionFallback();
  }
  return dbFallback;
}

export default getDatabaseFallback;