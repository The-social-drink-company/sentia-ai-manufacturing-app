#!/usr/bin/env node

/**
 * Enterprise Database Backup and Recovery System
 * Automated backup with point-in-time recovery capability
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseBackupSystem {
  constructor() {
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.retentionDays = {
      daily: 7,
      weekly: 30,
      monthly: 365
    };

    // S3 configuration for offsite backups
    this.s3Client = process.env.AWS_ACCESS_KEY_ID ? new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    }) : null;

    this.s3Bucket = process.env.BACKUP_S3_BUCKET || 'sentia-db-backups';
  }

  /**
   * Create database backup
   */
  async createBackup(options = {}) {
    const startTime = Date.now();
    console.log('Starting database backup...');

    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true });

      // Generate backup filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const environment = options.environment || process.env.NODE_ENV || 'development';
      const backupType = this.determineBackupType();
      const filename = `backup-${environment}-${backupType}-${timestamp}.sql`;
      const filepath = path.join(this.backupDir, filename);

      // Get database URL
      const databaseUrl = this.getDatabaseUrl(environment);
      if (!databaseUrl) {
        throw new Error('Database URL not configured');
      }

      // Create backup
      console.log(`Creating ${backupType} backup: ${filename}`);

      // Use pg_dump for PostgreSQL
      const dumpCommand = this.buildDumpCommand(databaseUrl, filepath, options);
      execSync(dumpCommand, {
        stdio: options.verbose ? 'inherit' : 'pipe',
        maxBuffer: 1024 * 1024 * 100 // 100MB buffer
      });

      // Compress backup
      const compressedPath = await this.compressBackup(filepath);

      // Calculate checksum
      const checksum = await this.calculateChecksum(compressedPath);

      // Create metadata
      const metadata = {
        filename: path.basename(compressedPath),
        originalSize: (await fs.stat(filepath)).size,
        compressedSize: (await fs.stat(compressedPath)).size,
        checksum,
        timestamp: new Date().toISOString(),
        environment,
        backupType,
        databaseVersion: await this.getDatabaseVersion(databaseUrl),
        duration: Date.now() - startTime
      };

      // Save metadata
      const metadataPath = compressedPath.replace('.gz', '.json');
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      // Upload to S3 if configured
      if (this.s3Client && !options.skipUpload) {
        await this.uploadToS3(compressedPath, metadata);
      }

      // Clean up uncompressed file
      await fs.unlink(filepath);

      // Clean old backups
      await this.cleanOldBackups(backupType);

      console.log(`Backup completed successfully in ${(Date.now() - startTime) / 1000}s`);
      console.log(`Backup saved: ${compressedPath}`);
      console.log(`Size: ${(metadata.compressedSize / 1024 / 1024).toFixed(2)}MB (compressed)`);
      console.log(`Checksum: ${checksum}`);

      return {
        success: true,
        filepath: compressedPath,
        metadata
      };

    } catch (error) {
      console.error('Backup failed:', error.message);

      // Send alert for backup failure
      await this.sendBackupAlert('failure', error.message);

      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupFile, options = {}) {
    console.log(`Starting database restore from: ${backupFile}`);

    try {
      // Verify backup file exists
      const backupPath = path.isAbsolute(backupFile)
        ? backupFile
        : path.join(this.backupDir, backupFile);

      // Download from S3 if needed
      if (!await this.fileExists(backupPath) && this.s3Client) {
        console.log('Backup not found locally, downloading from S3...');
        await this.downloadFromS3(backupFile, backupPath);
      }

      // Verify checksum
      const metadataPath = backupPath.replace('.sql.gz', '.json').replace('.sql', '.json');
      if (await this.fileExists(metadataPath)) {
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
        const currentChecksum = await this.calculateChecksum(backupPath);

        if (metadata.checksum !== currentChecksum) {
          throw new Error('Backup checksum verification failed - file may be corrupted');
        }
        console.log('Checksum verified');
      }

      // Decompress if needed
      let sqlPath = backupPath;
      if (backupPath.endsWith('.gz')) {
        console.log('Decompressing backup...');
        sqlPath = await this.decompressBackup(backupPath);
      }

      // Get target database URL
      const environment = options.environment || process.env.NODE_ENV || 'development';
      const databaseUrl = this.getDatabaseUrl(environment);

      // Confirm restore in production
      if (environment === 'production' && !options.force) {
        console.error('WARNING: Attempting to restore production database!');
        console.error('This will overwrite all existing data.');
        console.error('Use --force flag to confirm.');
        return false;
      }

      // Create restore point
      if (!options.skipBackup) {
        console.log('Creating restore point...');
        await this.createBackup({
          environment,
          skipUpload: true,
          note: 'Pre-restore backup'
        });
      }

      // Restore database
      console.log('Restoring database...');
      const restoreCommand = this.buildRestoreCommand(databaseUrl, sqlPath, options);

      execSync(restoreCommand, {
        stdio: options.verbose ? 'inherit' : 'pipe',
        maxBuffer: 1024 * 1024 * 100 // 100MB buffer
      });

      // Run post-restore migrations
      if (!options.skipMigrations) {
        console.log('Running migrations...');
        execSync('npm run db:migrate:deploy', { stdio: 'inherit' });
      }

      // Verify restore
      if (!options.skipVerification) {
        console.log('Verifying restore...');
        await this.verifyRestore(databaseUrl);
      }

      // Clean up temporary files
      if (sqlPath !== backupPath) {
        await fs.unlink(sqlPath);
      }

      console.log('Database restore completed successfully');

      // Send success notification
      await this.sendBackupAlert('restore_success', `Database restored from ${backupFile}`);

      return true;

    } catch (error) {
      console.error('Restore failed:', error.message);

      // Send alert for restore failure
      await this.sendBackupAlert('restore_failure', error.message);

      throw error;
    }
  }

  /**
   * Build pg_dump command
   */
  buildDumpCommand(databaseUrl, filepath, options) {
    const url = new URL(databaseUrl);

    let command = `pg_dump "${databaseUrl}"`;

    // Add options
    if (options.schemaOnly) {
      command += ' --schema-only';
    }
    if (options.dataOnly) {
      command += ' --data-only';
    }
    if (options.table) {
      command += ` --table=${options.table}`;
    }

    // Standard options
    command += ' --no-owner --no-privileges --clean --if-exists';
    command += ' --exclude-table-data=audit_logs'; // Exclude large audit tables
    command += ` > "${filepath}"`;

    return command;
  }

  /**
   * Build pg_restore command
   */
  buildRestoreCommand(databaseUrl, filepath, options) {
    let command = `psql "${databaseUrl}"`;

    if (options.single) {
      command += ' --single-transaction';
    }

    command += ` < "${filepath}"`;

    return command;
  }

  /**
   * Compress backup file
   */
  async compressBackup(filepath) {
    const compressedPath = `${filepath}.gz`;

    console.log('Compressing backup...');
    execSync(`gzip -9 -c "${filepath}" > "${compressedPath}"`);

    return compressedPath;
  }

  /**
   * Decompress backup file
   */
  async decompressBackup(filepath) {
    const decompressedPath = filepath.replace('.gz', '');

    execSync(`gunzip -c "${filepath}" > "${decompressedPath}"`);

    return decompressedPath;
  }

  /**
   * Calculate file checksum
   */
  async calculateChecksum(filepath) {
    const fileBuffer = await fs.readFile(filepath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  /**
   * Upload backup to S3
   */
  async uploadToS3(filepath, metadata) {
    if (!this.s3Client) return;

    console.log('Uploading backup to S3...');

    try {
      const fileContent = await fs.readFile(filepath);
      const key = `backups/${metadata.environment}/${path.basename(filepath)}`;

      const command = new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
        Body: fileContent,
        ContentType: 'application/gzip',
        Metadata: {
          environment: metadata.environment,
          checksum: metadata.checksum,
          timestamp: metadata.timestamp
        }
      });

      await this.s3Client.send(command);

      // Upload metadata
      const metadataCommand = new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: key.replace('.sql.gz', '.json'),
        Body: JSON.stringify(metadata),
        ContentType: 'application/json'
      });

      await this.s3Client.send(metadataCommand);

      console.log('Backup uploaded to S3 successfully');
    } catch (error) {
      console.error('S3 upload failed:', error.message);
      // Don't throw - S3 upload is optional
    }
  }

  /**
   * Download backup from S3
   */
  async downloadFromS3(filename, localPath) {
    if (!this.s3Client) {
      throw new Error('S3 not configured');
    }

    const key = `backups/${process.env.NODE_ENV}/${filename}`;

    const command = new GetObjectCommand({
      Bucket: this.s3Bucket,
      Key: key
    });

    const response = await this.s3Client.send(command);
    const fileContent = await response.Body.transformToByteArray();

    await fs.writeFile(localPath, fileContent);
    console.log('Backup downloaded from S3');
  }

  /**
   * List available backups
   */
  async listBackups(options = {}) {
    const backups = [];

    // List local backups
    try {
      const files = await fs.readdir(this.backupDir);

      for (const file of files) {
        if (file.endsWith('.sql.gz')) {
          const filepath = path.join(this.backupDir, file);
          const stats = await fs.stat(filepath);

          // Read metadata if available
          const metadataPath = filepath.replace('.sql.gz', '.json');
          let metadata = {};

          if (await this.fileExists(metadataPath)) {
            metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
          }

          backups.push({
            filename: file,
            path: filepath,
            size: stats.size,
            created: stats.mtime,
            ...metadata
          });
        }
      }
    } catch (error) {
      console.error('Error listing local backups:', error.message);
    }

    // List S3 backups if configured
    if (this.s3Client && options.includeRemote) {
      try {
        const command = new ListObjectsV2Command({
          Bucket: this.s3Bucket,
          Prefix: `backups/${options.environment || process.env.NODE_ENV}/`
        });

        const response = await this.s3Client.send(command);

        if (response.Contents) {
          for (const object of response.Contents) {
            if (object.Key.endsWith('.sql.gz')) {
              backups.push({
                filename: path.basename(object.Key),
                path: `s3://${this.s3Bucket}/${object.Key}`,
                size: object.Size,
                created: object.LastModified,
                remote: true
              });
            }
          }
        }
      } catch (error) {
        console.error('Error listing S3 backups:', error.message);
      }
    }

    // Sort by creation date
    backups.sort((a, b) => new Date(b.created) - new Date(a.created));

    return backups;
  }

  /**
   * Clean old backups
   */
  async cleanOldBackups(backupType) {
    const retention = this.retentionDays[backupType] || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retention);

    console.log(`Cleaning ${backupType} backups older than ${retention} days...`);

    const backups = await this.listBackups();
    let cleaned = 0;

    for (const backup of backups) {
      if (!backup.remote && new Date(backup.created) < cutoffDate) {
        if (backup.backupType === backupType || !backup.backupType) {
          try {
            await fs.unlink(backup.path);

            // Remove metadata file
            const metadataPath = backup.path.replace('.sql.gz', '.json');
            if (await this.fileExists(metadataPath)) {
              await fs.unlink(metadataPath);
            }

            cleaned++;
          } catch (error) {
            console.error(`Failed to delete ${backup.filename}:`, error.message);
          }
        }
      }
    }

    if (cleaned > 0) {
      console.log(`Cleaned ${cleaned} old backup(s)`);
    }
  }

  /**
   * Verify database restore
   */
  async verifyRestore(databaseUrl) {
    try {
      // Check table count
      const tableCountResult = execSync(
        `psql "${databaseUrl}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"`,
        { encoding: 'utf8' }
      ).trim();

      const tableCount = parseInt(tableCountResult);

      if (tableCount === 0) {
        throw new Error('No tables found after restore');
      }

      console.log(`Verified: ${tableCount} tables restored`);

      // Check critical tables
      const criticalTables = ['users', 'products', 'forecasts'];

      for (const table of criticalTables) {
        const exists = execSync(
          `psql "${databaseUrl}" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${table}');"`,
          { encoding: 'utf8' }
        ).trim();

        if (exists !== 't') {
          throw new Error(`Critical table missing: ${table}`);
        }
      }

      console.log('All critical tables verified');

      return true;
    } catch (error) {
      throw new Error(`Restore verification failed: ${error.message}`);
    }
  }

  /**
   * Determine backup type based on schedule
   */
  determineBackupType() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();

    // Monthly backup on 1st
    if (dayOfMonth === 1) {
      return 'monthly';
    }

    // Weekly backup on Sunday
    if (dayOfWeek === 0) {
      return 'weekly';
    }

    // Daily backup
    return 'daily';
  }

  /**
   * Get database URL for environment
   */
  getDatabaseUrl(environment) {
    const envVarMap = {
      production: 'PRODUCTION_DATABASE_URL',
      testing: 'TEST_DATABASE_URL',
      development: 'DATABASE_URL'
    };

    return process.env[envVarMap[environment]] || process.env.DATABASE_URL;
  }

  /**
   * Get database version
   */
  async getDatabaseVersion(databaseUrl) {
    try {
      const version = execSync(
        `psql "${databaseUrl}" -t -c "SELECT version();"`,
        { encoding: 'utf8' }
      ).trim().split(' ')[1];

      return version;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filepath) {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Send backup alert
   */
  async sendBackupAlert(type, message) {
    // Integration with monitoring system
    if (process.env.BACKUP_WEBHOOK_URL) {
      try {
        await fetch(process.env.BACKUP_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            message,
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error('Failed to send backup alert:', error.message);
      }
    }
  }
}

// CLI execution
if (import.meta.url === `file://${__filename}`) {
  const backup = new DatabaseBackupSystem();
  const command = process.argv[2];

  switch (command) {
    case 'backup':
      backup.createBackup({
        environment: process.argv[3],
        verbose: process.argv.includes('--verbose')
      }).catch(console.error);
      break;

    case 'restore':
      backup.restoreBackup(process.argv[3], {
        environment: process.argv[4],
        force: process.argv.includes('--force'),
        skipBackup: process.argv.includes('--skip-backup'),
        skipMigrations: process.argv.includes('--skip-migrations'),
        verbose: process.argv.includes('--verbose')
      }).catch(console.error);
      break;

    case 'list':
      backup.listBackups({
        includeRemote: process.argv.includes('--remote')
      }).then(backups => {
        console.log('Available backups:');
        backups.forEach(b => {
          console.log(`  ${b.filename} (${(b.size / 1024 / 1024).toFixed(2)}MB) - ${b.created}`);
        });
      }).catch(console.error);
      break;

    default:
      console.log('Usage:');
      console.log('  node database-backup.js backup [environment]');
      console.log('  node database-backup.js restore <backup-file> [environment]');
      console.log('  node database-backup.js list [--remote]');
      process.exit(1);
  }
}

export default DatabaseBackupSystem;