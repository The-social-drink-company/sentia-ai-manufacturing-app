/**
 * Model/Artifact Registry Service
 * Manages model artifacts and baselines with versioning and rollback
 */

import { PrismaClient } from '@prisma/client';
import { logInfo, logError, logWarn } from '../logger.js';

const prisma = new PrismaClient();

export class ModelRegistry {
  constructor() {
    this.baselineChangeRequireApproval = process.env.BASELINE_CHANGE_REQUIRE_APPROVAL !== 'false';
  }

  /**
   * Register a new model artifact
   */
  async registerArtifact(type, data) {
    try {
      const artifact = await prisma.modelArtifacts.create({
        data: {
          type,
          runId: data.runId,
          entityId: data.entityId,
          region: data.region,
          createdBy: data.userId,
          metricsJson: data.metrics || {},
          paramsJson: data.params || {},
          artifactUrl: data.artifactUrl,
          status: 'ACTIVE',
          tags: data.tags || [],
          version: data.version || this.generateVersion()
        }
      });

      logInfo('Model artifact registered', {
        artifactId: artifact.id,
        type,
        entityId: data.entityId,
        region: data.region
      });

      return artifact;
    } catch (error) {
      logError('Failed to register artifact', error);
      throw error;
    }
  }

  /**
   * Get artifacts by type and scope
   */
  async getArtifacts(filters = {}) {
    const { type, entityId, region, from, to, status = 'ACTIVE' } = filters;
    
    const where = {
      ...(type && { type }),
      ...(entityId && { entityId }),
      ...(region && { region }),
      ...(status && { status }),
      ...(from && { createdAt: { gte: new Date(from) } }),
      ...(to && { createdAt: { lte: new Date(to) } })
    };

    const artifacts = await prisma.modelArtifacts.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return artifacts;
  }

  /**
   * Get current baseline for a type/scope
   */
  async getCurrentBaseline(type, entityId = null, region = null) {
    const baseline = await prisma.modelBaselines.findFirst({
      where: {
        type,
        entityId,
        region,
        activeTo: null
      },
      include: {
        artifact: true
      }
    });

    return baseline;
  }

  /**
   * Propose a baseline change
   */
  async proposeBaselineChange(type, artifactId, data) {
    try {
      // Get the artifact
      const artifact = await prisma.modelArtifacts.findUnique({
        where: { id: artifactId }
      });

      if (!artifact) {
        throw new Error('Artifact not found');
      }

      // Get current baseline for comparison
      const currentBaseline = await this.getCurrentBaseline(
        type,
        artifact.entityId,
        artifact.region
      );

      // Create snapshot of current vs proposed
      const snapshot = {
        timestamp: new Date().toISOString(),
        current: currentBaseline ? {
          artifactId: currentBaseline.artifactId,
          metrics: currentBaseline.artifact.metricsJson,
          activeFrom: currentBaseline.activeFrom
        } : null,
        proposed: {
          artifactId: artifact.id,
          metrics: artifact.metricsJson,
          params: artifact.paramsJson
        },
        deltas: this.calculateDeltas(
          currentBaseline?.artifact.metricsJson,
          artifact.metricsJson
        )
      };

      // If approval required, create pending baseline
      if (this.baselineChangeRequireApproval && !data.approved) {
        logInfo('Baseline change proposed (requires approval)', {
          type,
          artifactId,
          entityId: artifact.entityId
        });

        // Store proposal in snapshot for later approval
        return {
          status: 'PENDING_APPROVAL',
          type,
          artifactId,
          snapshot,
          requiresApproval: true
        };
      }

      // Apply baseline change immediately
      return await this.applyBaselineChange(type, artifactId, data, snapshot);

    } catch (error) {
      logError('Failed to propose baseline change', error);
      throw error;
    }
  }

  /**
   * Apply a baseline change
   */
  async applyBaselineChange(type, artifactId, data, snapshot = null) {
    try {
      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        // Get artifact
        const artifact = await tx.modelArtifacts.findUnique({
          where: { id: artifactId }
        });

        if (!artifact) {
          throw new Error('Artifact not found');
        }

        // Deactivate current baseline
        const currentBaseline = await tx.modelBaselines.findFirst({
          where: {
            type,
            entityId: artifact.entityId,
            region: artifact.region,
            activeTo: null
          }
        });

        if (currentBaseline) {
          await tx.modelBaselines.update({
            where: { id: currentBaseline.id },
            data: { activeTo: new Date() }
          });
        }

        // Create new baseline
        const newBaseline = await tx.modelBaselines.create({
          data: {
            type,
            entityId: artifact.entityId,
            region: artifact.region,
            activeFrom: new Date(),
            artifactId: artifact.id,
            approverId: data.approverId,
            approvedAt: data.approverId ? new Date() : null,
            notes: data.notes,
            snapshotJson: snapshot || {}
          }
        });

        // Create audit log entry
        await tx.auditLog.create({
          data: {
            action: 'baseline_change',
            entityType: 'model',
            entityId: artifactId,
            userId: data.approverId || data.userId,
            details: {
              type,
              previousBaseline: currentBaseline?.id,
              newBaseline: newBaseline.id,
              notes: data.notes
            },
            timestamp: new Date()
          }
        });

        return newBaseline;
      });

      logInfo('Baseline change applied', {
        baselineId: result.id,
        type,
        artifactId
      });

      return result;

    } catch (error) {
      logError('Failed to apply baseline change', error);
      throw error;
    }
  }

  /**
   * Rollback to a previous baseline
   */
  async rollbackBaseline(baselineId, userId, reason) {
    try {
      // Get the baseline to rollback to
      const targetBaseline = await prisma.modelBaselines.findUnique({
        where: { id: baselineId },
        include: { artifact: true }
      });

      if (!targetBaseline) {
        throw new Error('Target baseline not found');
      }

      // Apply the rollback as a new baseline change
      const result = await this.applyBaselineChange(
        targetBaseline.type,
        targetBaseline.artifactId,
        {
          approverId: userId,
          notes: `Rollback: ${reason}`
        },
        {
          timestamp: new Date().toISOString(),
          rollback: true,
          targetBaseline: baselineId,
          reason
        }
      );

      logInfo('Baseline rolled back', {
        baselineId: result.id,
        targetBaseline: baselineId,
        type: targetBaseline.type
      });

      return result;

    } catch (error) {
      logError('Failed to rollback baseline', error);
      throw error;
    }
  }

  /**
   * Get baseline history
   */
  async getBaselineHistory(type, entityId = null, region = null, limit = 10) {
    const baselines = await prisma.modelBaselines.findMany({
      where: {
        type,
        entityId,
        region
      },
      include: {
        artifact: true
      },
      orderBy: { activeFrom: 'desc' },
      take: limit
    });

    return baselines;
  }

  /**
   * Calculate metric deltas between baselines
   */
  calculateDeltas(currentMetrics, proposedMetrics) {
    if (!currentMetrics || !proposedMetrics) {
      return null;
    }

    const deltas = {};

    // Common metrics across all model types
    const metricKeys = [
      'mape', 'coverage', 'piCoverage',           // Forecast
      'serviceLevel', 'stockouts', 'inventoryValue', // Optimization
      'ccc', 'minCash', 'breachMonths'           // Working Capital
    ];

    for (const key of metricKeys) {
      if (key in currentMetrics && key in proposedMetrics) {
        const current = parseFloat(currentMetrics[key]) || 0;
        const proposed = parseFloat(proposedMetrics[key]) || 0;
        
        deltas[key] = {
          current,
          proposed,
          delta: proposed - current,
          deltaPercent: current !== 0 ? ((proposed - current) / current) * 100 : null
        };
      }
    }

    return deltas;
  }

  /**
   * Generate version string
   */
  generateVersion() {
    const now = new Date();
    return `v${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  }

  /**
   * Export baseline change note
   */
  async exportBaselineChangeNote(baselineId) {
    const baseline = await prisma.modelBaselines.findUnique({
      where: { id: baselineId },
      include: { artifact: true }
    });

    if (!baseline) {
      throw new Error('Baseline not found');
    }

    const note = {
      title: 'Baseline Change Note',
      timestamp: new Date().toISOString(),
      baseline: {
        id: baseline.id,
        type: baseline.type,
        activeFrom: baseline.activeFrom,
        entity: baseline.entityId,
        region: baseline.region
      },
      artifact: {
        id: baseline.artifactId,
        version: baseline.artifact.version,
        createdAt: baseline.artifact.createdAt,
        metrics: baseline.artifact.metricsJson
      },
      approval: {
        approvedBy: baseline.approverId,
        approvedAt: baseline.approvedAt,
        notes: baseline.notes
      },
      snapshot: baseline.snapshotJson
    };

    return note;
  }

  /**
   * Get model performance trends
   */
  async getPerformanceTrends(type, entityId = null, region = null, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const artifacts = await prisma.modelArtifacts.findMany({
      where: {
        type,
        entityId,
        region,
        createdAt: { gte: since }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Extract metrics over time
    const trends = artifacts.map(a => ({
      date: a.createdAt,
      metrics: a.metricsJson
    }));

    return trends;
  }

  /**
   * Archive old artifacts
   */
  async archiveOldArtifacts(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Find artifacts not associated with active baselines
    const result = await prisma.modelArtifacts.updateMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: 'ACTIVE',
        baselines: {
          none: {
            activeTo: null
          }
        }
      },
      data: {
        status: 'ARCHIVED'
      }
    });

    logInfo('Archived old model artifacts', {
      count: result.count,
      daysToKeep
    });

    return result.count;
  }
}

// Singleton instance
export const modelRegistry = new ModelRegistry();

export default {
  ModelRegistry,
  modelRegistry
};