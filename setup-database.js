import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 ENTERPRISE DATABASE SETUP SCRIPT');
console.log('====================================');

try {
  // Check if Prisma is installed
  console.log('📦 Checking Prisma installation...');
  
  // Install Prisma if not already installed
  try {
    execSync('npx prisma --version', { stdio: 'pipe' });
    console.log('✅ Prisma CLI is available');
  } catch (error) {
    console.log('📦 Installing Prisma CLI...');
    execSync('npm install prisma @prisma/client', { stdio: 'inherit' });
  }

  // Generate Prisma client
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated successfully');

  // Push database schema
  console.log('🗄️ Pushing database schema to production...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Database schema deployed to production');

  // Check if seed file exists and run it
  const seedFile = path.join(process.cwd(), 'prisma', 'seed.js');
  if (fs.existsSync(seedFile)) {
    console.log('🌱 Running database seed...');
    execSync('npm run db:seed', { stdio: 'inherit' });
    console.log('✅ Database seeded successfully');
  }

  console.log('\n🎉 ENTERPRISE DATABASE SETUP COMPLETE!');
  console.log('    Database: Connected and schema deployed');
  console.log('    Prisma Client: Generated and ready');
  console.log('    Production: Ready for full application deployment');

} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  process.exit(1);
}