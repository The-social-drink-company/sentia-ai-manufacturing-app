/**
 * Evidence Collection Module for Compliance
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class EvidenceCollector {
  constructor(config = {}) {
    this.config = {
      storageDir: './evidence/compliance',
      maxRetention: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years in ms
      encryption: true,
      ...config
    };

    this.evidenceCache = new Map();
  }

  async collect(evidence) {
    const id = this.generateEvidenceId(evidence);

    const evidenceRecord = {
      id,
      timestamp: new Date(),
      type: evidence.type,
      data: evidence.data,
      metadata: {
        source: evidence.source || 'system',
        standard: evidence.standard,
        control: evidence.control,
        hash: this.hashEvidence(evidence)
      }
    };

    // Store in cache
    this.evidenceCache.set(id, evidenceRecord);

    // Persist to storage
    await this.store(evidenceRecord);

    return evidenceRecord;
  }

  generateEvidenceId(evidence) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `${evidence.type}-${timestamp}-${random}`;
  }

  hashEvidence(evidence) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(evidence));
    return hash.digest('hex');
  }

  async store(evidence) {
    const filepath = path.join(
      this.config.storageDir,
      evidence.metadata.standard || 'general',
      `${evidence.id}.json`
    );

    // Ensure directory exists
    await fs.mkdir(path.dirname(filepath), { recursive: true });

    // Optionally encrypt before storing
    const data = this.config.encryption
      ? await this.encrypt(evidence)
      : evidence;

    await fs.writeFile(filepath, JSON.stringify(data, null, 2));

    return filepath;
  }

  async retrieve(evidenceId) {
    // Check cache first
    if (this.evidenceCache.has(evidenceId)) {
      return this.evidenceCache.get(evidenceId);
    }

    // Search in storage
    const files = await this.findEvidenceFiles(evidenceId);
    if (files.length > 0) {
      const data = await fs.readFile(files[0], 'utf-8');
      const evidence = JSON.parse(data);

      // Decrypt if needed
      return this.config.encryption
        ? await this.decrypt(evidence)
        : evidence;
    }

    return null;
  }

  async findEvidenceFiles(evidenceId) {
    const files = [];
    const baseDir = this.config.storageDir;

    try {
      const standards = await fs.readdir(baseDir);
      for (const standard of standards) {
        const standardDir = path.join(baseDir, standard);
        const stat = await fs.stat(standardDir);

        if (stat.isDirectory()) {
          const evidenceFile = path.join(standardDir, `${evidenceId}.json`);
          try {
            await fs.access(evidenceFile);
            files.push(evidenceFile);
          } catch {
            // File doesn't exist, continue
          }
        }
      }
    } catch {
      // Directory doesn't exist
    }

    return files;
  }

  async encrypt(data) {
    // Simple encryption placeholder - implement proper encryption in production
    return {
      encrypted: true,
      data: Buffer.from(JSON.stringify(data)).toString('base64')
    };
  }

  async decrypt(encryptedData) {
    if (!encryptedData.encrypted) {
      return encryptedData;
    }

    // Simple decryption placeholder - implement proper decryption in production
    return JSON.parse(Buffer.from(encryptedData.data, 'base64').toString());
  }

  async cleanup() {
    const cutoffDate = Date.now() - this.config.maxRetention;

    // Clean cache
    for (const [id, evidence] of this.evidenceCache.entries()) {
      if (new Date(evidence.timestamp).getTime() < cutoffDate) {
        this.evidenceCache.delete(id);
      }
    }

    // Clean storage
    await this.cleanupStorage(cutoffDate);
  }

  async cleanupStorage(cutoffDate) {
    // Implement storage cleanup based on retention policy
    return true;
  }

  async generateChainOfCustody(evidenceIds) {
    const chain = {
      generated: new Date(),
      evidence: []
    };

    for (const id of evidenceIds) {
      const evidence = await this.retrieve(id);
      if (evidence) {
        chain.evidence.push({
          id: evidence.id,
          timestamp: evidence.timestamp,
          hash: evidence.metadata.hash,
          verified: await this.verifyIntegrity(evidence)
        });
      }
    }

    return chain;
  }

  async verifyIntegrity(evidence) {
    const currentHash = this.hashEvidence(evidence);
    return currentHash === evidence.metadata.hash;
  }
}

export default EvidenceCollector;