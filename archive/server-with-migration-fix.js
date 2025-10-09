import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function startWithMigrationFix() {
  console.log('🚀 Starting Sentia Manufacturing Dashboard with migration resolution...');

  try {
    // First, try to resolve the failed migration
    console.log('📋 Resolving failed migration 20250909_api_keys_management...');
    try {
      const { stdout, stderr } = await execAsync('pnpm prisma migrate resolve --rolled-back 20250909_api_keys_management');
      console.log('✅ Migration resolved:', stdout);
    } catch (error) {
      console.log('⚠️  Migration resolution failed or not needed:', error.message);
      // Continue anyway - the migration might not need resolution
    }

    // Deploy all migrations
    console.log('🔄 Deploying migrations...');
    const { stdout: deployOut } = await execAsync('pnpm prisma migrate deploy');
    console.log('✅ Migrations deployed:', deployOut);

    // Import and start the server
    console.log('🌟 Starting server...');
    const serverModule = await import('./server-enterprise-complete.js');
    
  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
}

startWithMigrationFix();