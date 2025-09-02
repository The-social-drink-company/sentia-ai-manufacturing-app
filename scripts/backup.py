#!/usr/bin/env python3
"""
Database backup script for production environments.
Supports PostgreSQL and includes backup rotation.
"""

import os
import sys
import subprocess
import datetime
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_backup():
    """Create a database backup."""
    try:
        # Get database URL from environment
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            logger.error("DATABASE_URL environment variable not set")
            return False
        
        # Create backup directory
        backup_dir = Path('backups')
        backup_dir.mkdir(exist_ok=True)
        
        # Generate backup filename
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = backup_dir / f'sentia_backup_{timestamp}.sql'
        
        # Create backup using pg_dump
        cmd = [
            'pg_dump',
            database_url,
            '--no-password',
            '--format=custom',
            '--compress=9',
            '--file', str(backup_file)
        ]
        
        logger.info(f"Creating backup: {backup_file}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info(f"Backup created successfully: {backup_file}")
            cleanup_old_backups(backup_dir)
            return True
        else:
            logger.error(f"Backup failed: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"Backup error: {e}")
        return False

def cleanup_old_backups(backup_dir, keep_days=30):
    """Remove backups older than keep_days."""
    try:
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=keep_days)
        
        for backup_file in backup_dir.glob('sentia_backup_*.sql'):
            if backup_file.stat().st_mtime < cutoff_date.timestamp():
                logger.info(f"Removing old backup: {backup_file}")
                backup_file.unlink()
                
    except Exception as e:
        logger.error(f"Cleanup error: {e}")

def restore_backup(backup_file):
    """Restore from a backup file."""
    try:
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            logger.error("DATABASE_URL environment variable not set")
            return False
        
        if not Path(backup_file).exists():
            logger.error(f"Backup file not found: {backup_file}")
            return False
        
        # Confirm restore operation
        confirm = input(f"Are you sure you want to restore from {backup_file}? (yes/no): ")
        if confirm.lower() != 'yes':
            logger.info("Restore cancelled")
            return False
        
        # Restore using pg_restore
        cmd = [
            'pg_restore',
            '--clean',
            '--if-exists',
            '--no-owner',
            '--role=postgres',
            '--dbname', database_url,
            backup_file
        ]
        
        logger.info(f"Restoring from backup: {backup_file}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info("Restore completed successfully")
            return True
        else:
            logger.error(f"Restore failed: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"Restore error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "restore" and len(sys.argv) > 2:
            restore_backup(sys.argv[2])
        else:
            print("Usage: python backup.py [restore <backup_file>]")
    else:
        create_backup()