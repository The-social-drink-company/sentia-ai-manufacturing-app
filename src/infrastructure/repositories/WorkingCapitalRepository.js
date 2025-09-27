/**
 * Working Capital Repository Implementation
 * Handles data persistence for working capital entities
 */

import { PrismaClient } from '@prisma/client';

export class WorkingCapitalRepository {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Save working capital calculation
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async save(data) {
    try {
      const result = await this.prisma.workingCapital.create({
        data: {
          companyId: data.companyId,
          periodId: data.periodId,
          value: data.value,
          currentRatio: data.currentRatio,
          quickRatio: data.quickRatio,
          healthStatus: data.healthStatus,
          timestamp: data.timestamp
        }
      });

      return this.mapToEntity(result);
    } catch (error) {
      throw new Error(`Failed to save working capital: ${error.message}`);
    }
  }

  /**
   * Find by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    try {
      const result = await this.prisma.workingCapital.findUnique({
        where: { id }
      });

      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      throw new Error(`Failed to find working capital: ${error.message}`);
    }
  }

  /**
   * Find by company and period
   * @param {string} companyId
   * @param {string} periodId
   * @returns {Promise<Array>}
   */
  async findByCompanyAndPeriod(companyId, periodId) {
    try {
      const results = await this.prisma.workingCapital.findMany({
        where: {
          companyId,
          periodId
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      return results.map(this.mapToEntity);
    } catch (error) {
      throw new Error(`Failed to find working capital records: ${error.message}`);
    }
  }

  /**
   * Get latest calculation for company
   * @param {string} companyId
   * @returns {Promise<Object|null>}
   */
  async getLatest(companyId) {
    try {
      const result = await this.prisma.workingCapital.findFirst({
        where: { companyId },
        orderBy: {
          timestamp: 'desc'
        }
      });

      return result ? this.mapToEntity(result) : null;
    } catch (error) {
      throw new Error(`Failed to get latest working capital: ${error.message}`);
    }
  }

  /**
   * Get historical data
   * @param {string} companyId
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Array>}
   */
  async getHistorical(companyId, startDate, endDate) {
    try {
      const results = await this.prisma.workingCapital.findMany({
        where: {
          companyId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      return results.map(this.mapToEntity);
    } catch (error) {
      throw new Error(`Failed to get historical data: ${error.message}`);
    }
  }

  /**
   * Update working capital record
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    try {
      const result = await this.prisma.workingCapital.update({
        where: { id },
        data: {
          value: data.value,
          currentRatio: data.currentRatio,
          quickRatio: data.quickRatio,
          healthStatus: data.healthStatus,
          updatedAt: new Date()
        }
      });

      return this.mapToEntity(result);
    } catch (error) {
      throw new Error(`Failed to update working capital: ${error.message}`);
    }
  }

  /**
   * Delete working capital record
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      await this.prisma.workingCapital.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      throw new Error(`Failed to delete working capital: ${error.message}`);
    }
  }

  /**
   * Map database result to entity
   * @private
   * @param {Object} dbRecord
   * @returns {Object}
   */
  mapToEntity(dbRecord) {
    return {
      id: dbRecord.id,
      companyId: dbRecord.companyId,
      periodId: dbRecord.periodId,
      value: dbRecord.value,
      currentRatio: dbRecord.currentRatio,
      quickRatio: dbRecord.quickRatio,
      healthStatus: dbRecord.healthStatus,
      timestamp: dbRecord.timestamp,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt
    };
  }

  /**
   * Disconnect database connection
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}