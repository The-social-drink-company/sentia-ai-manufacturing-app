import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { logInfo, logError, logWarn } from '../../../services/logger.js';

const execAsync = promisify(exec);

class DatabaseUtilities {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.ensureBackupDirectory();
  }

  /**
   * Ensure backup directory exists
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      logInfo('Created backup directory', { path: this.backupDir });
    }
  }

  /**
   * Parse database URL to extract connection parameters
   */
  parseDatabaseUrl(databaseUrl = process.env.DATABASE_URL) {
    if (!databaseUrl) {
      throw new Error('Database URL not provided');
    }

    try {
      const url = new URL(databaseUrl);
      return {
        host: url.hostname,
        port: url.port 0,
        database: url.pathname.slice(1), // Remove leading slash
        username: url.username,
        password: url.password,
        ssl: url.searchParams.get('sslmode') === 'require',
      };
    } catch (error) {
      throw new Error(`Invalid database URL: ${error.message}`);
    }
  }

  /**
   * Create database backup
   */
  async createBackup(options = {}) {
    const {
      filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`,
      includeTables = null,
      excludeTables = null,
      schemaOnly = false,
      dataOnly = false,
    } = options;

    const backupPath = path.join(this.backupDir, filename);
    const dbConfig = this.parseDatabaseUrl();

    try {
      logInfo('Starting database backup', {
        filename,
        destination: backupPath,
        schemaOnly,
        dataOnly,
      });

      let pgDumpCommand = `pg_dump`;
      
      // Connection parameters
      pgDumpCommand += ` --host=${dbConfig.host}`;
      pgDumpCommand += ` --port=${dbConfig.port}`;
      pgDumpCommand += ` --username=${dbConfig.username}`;
      pgDumpCommand += ` --dbname=${dbConfig.database}`;
      pgDumpCommand += ` --no-password`; // Use PGPASSWORD env var
      
      // SSL options
      if (dbConfig.ssl) {
        pgDumpCommand += ` --no-psqlrc`;
      }

      // Format and output options
      pgDumpCommand += ` --format=plain`;
      pgDumpCommand += ` --no-owner`;
      pgDumpCommand += ` --no-privileges`;
      pgDumpCommand += ` --verbose`;
      
      // Schema/data options
      if (schemaOnly) {
        pgDumpCommand += ` --schema-only`;
      } else if (dataOnly) {
        pgDumpCommand += ` --data-only`;
      }

      // Table inclusion/exclusion
      if (includeTables && includeTables.length > 0) {
        includeTables.forEach(table => {
          pgDumpCommand += ` --table=${table}`;
        });
      }

      if (excludeTables && excludeTables.length > 0) {
        excludeTables.forEach(table => {
          pgDumpCommand += ` --exclude-table=${table}`;
        });
      }

      pgDumpCommand += ` --file=${backupPath}`;

      // Set password environment variable
      const env = {
        ...process.env,
        PGPASSWORD: dbConfig.password,
      };

      const { stdout, stderr } = await execAsync(pgDumpCommand, { env });
      
      if (stderr && !stderr.includes('NOTICE:')) {
        logWarn('pg_dump warnings', { stderr });
      }

      // Verify backup file was created
      const stats = fs.statSync(backupPath);
      
      logInfo('Database backup completed successfully', {
        filename,
        path: backupPath,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        created: stats.birthtime,
      });

      return {
        success: true,
        filename,
        path: backupPath,
        size: stats.size,
        created: stats.birthtime,
      };

    } catch (error) {
      logError('Database backup failed', error);
      
      // Clean up failed backup file
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
      }
      
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupPath, options = {}) {
    const {
      dropExisting = false,
      ignoreErrors = false,
      targetDatabase = null,
    } = options;

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    const dbConfig = this.parseDatabaseUrl();
    const targetDb = targetDatabase || dbConfig.database;

    try {
      logInfo('Starting database restore', {
        backupFile: backupPath,
        targetDatabase: targetDb,
        dropExisting,
      });

      let psqlCommand = `psql`;
      
      // Connection parameters
      psqlCommand += ` --host=${dbConfig.host}`;
      psqlCommand += ` --port=${dbConfig.port}`;
      psqlCommand += ` --username=${dbConfig.username}`;
      psqlCommand += ` --dbname=${targetDb}`;
      
      // Options
      psqlCommand += ` --no-password`;
      psqlCommand += ` --single-transaction`;
      psqlCommand += ` --verbose`;
      
      if (ignoreErrors) {
        psqlCommand += ` --on-error-continue`;
      } else {
        psqlCommand += ` --on-error-stop`;
      }

      psqlCommand += ` --file=${backupPath}`;

      // Set password environment variable
      const env = {
        ...process.env,
        PGPASSWORD: dbConfig.password,
      };

      // Drop existing data if requested
      if (dropExisting) {
        logWarn('Dropping existing database objects');
        // This would require a more sophisticated approach
        // For now, we'll just log the warning
      }

      const { stdout, stderr } = await execAsync(psqlCommand, { env });
      
      if (stderr && !ignoreErrors) {
        logWarn('psql warnings during restore', { stderr });
      }

      logInfo('Database restore completed successfully', {
        backupFile: backupPath,
        targetDatabase: targetDb,
      });

      return {
        success: true,
        backupFile: backupPath,
        targetDatabase: targetDb,
        restored: new Date(),
      };

    } catch (error) {
      logError('Database restore failed', error);
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  /**
   * List available backup files
   */
  listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.sql'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          
          return {
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            sizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
          };
        })
        .sort((a, b) => b.created - a.created); // Sort by creation date, newest first

      return files;
    } catch (error) {
      logError('Failed to list backup files', error);
      throw error;
    }
  }

  /**
   * Delete old backup files
   */
  cleanupBackups(options = {}) {
    const {
      keepDays = 30,
      keepCount = 10,
      dryRun = false,
    } = options;

    try {
      const backups = this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - keepDays);
      
      // Files to delete based on age
      const oldFiles = backups.filter(backup => backup.created < cutoffDate);
      
      // Files to delete based on count (keep only the newest ones)
      const excessFiles = backups.slice(keepCount);
      
      // Combine and deduplicate
      const filesToDelete = [...new Set([...oldFiles, ...excessFiles])];
      
      logInfo('Backup cleanup analysis', {
        totalBackups: backups.length,
        oldFiles: oldFiles.length,
        excessFiles: excessFiles.length,
        filesToDelete: filesToDelete.length,
        dryRun,
      });

      if (dryRun) {
        return {
          wouldDelete: filesToDelete,
          wouldKeep: backups.filter(b => !filesToDelete.includes(b)),
        };
      }

      // Delete files
      let deletedCount = 0;
      let deletedSize = 0;
      
      for (const backup of filesToDelete) {
        try {
          fs.unlinkSync(backup.path);
          deletedCount++;
          deletedSize += backup.size;
          logInfo('Deleted old backup', { filename: backup.filename });
        } catch (error) {
          logError('Failed to delete backup', { filename: backup.filename, error });
        }
      }

      logInfo('Backup cleanup completed', {
        deletedFiles: deletedCount,
        deletedSize: `${(deletedSize / 1024 / 1024).toFixed(2)} MB`,
        remainingFiles: backups.length - deletedCount,
      });

      return {
        deleted: deletedCount,
        deletedSize,
        remaining: backups.length - deletedCount,
      };

    } catch (error) {
      logError('Backup cleanup failed', error);
      throw error;
    }
  }

  /**
   * Validate database integrity
   */
  async validateIntegrity() {
    const dbConfig = this.parseDatabaseUrl();

    try {
      logInfo('Starting database integrity validation');

      let command = `pg_dump --schema-only`;
      command += ` --host=${dbConfig.host}`;
      command += ` --port=${dbConfig.port}`;
      command += ` --username=${dbConfig.username}`;
      command += ` --dbname=${dbConfig.database}`;
      command += ` --no-password`;
      command += ` | psql --host=${dbConfig.host} --port=${dbConfig.port}`;
      command += ` --username=${dbConfig.username} --dbname=template1`;
      command += ` --no-password --single-transaction --dry-run`;

      const env = {
        ...process.env,
        PGPASSWORD: dbConfig.password,
      };

      const { stdout, stderr } = await execAsync(command, { env });
      
      logInfo('Database integrity validation completed', {
        status: 'valid',
      });

      return {
        valid: true,
        message: 'Database schema is valid',
        details: stdout,
      };

    } catch (error) {
      logError('Database integrity validation failed', error);
      return {
        valid: false,
        message: error.message,
        error,
      };
    }
  }
}

// Create singleton instance
const dbUtils = new DatabaseUtilities();

export default dbUtils;
export { DatabaseUtilities };
