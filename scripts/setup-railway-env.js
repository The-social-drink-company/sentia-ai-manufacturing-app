#!/usr/bin/env node

/**
 * Railway Environment Setup Script
 * Sets up environment variables and configurations for all three Railway environments
 */

import { execSync } from 'child_process';
import fs from 'fs';

const environments = {
  development: {
    domain: 'dev.sentia-manufacturing.railway.app',
    nodeEnv: 'development',
    clerkPublishableKey: 'pk_test_Z3VpZGluZy1zbG90aC04Ni5jbGVyay5hY2NvdW50cy5kZXYk',
    clerkSecretKey: 'sk_test_VAYZffZP043cqbgUJQgAPmCTziMcZVbfTPfXUIKlrx'
  },
  testing: {
    domain: 'test.sentia-manufacturing.railway.app', 
    nodeEnv: 'test',
    clerkPublishableKey: 'pk_test_Z3VpZGluZy1zbG90aC04Ni5jbGVyay5hY2NvdW50cy5kZXYk',
    clerkSecretKey: 'sk_test_VAYZffZP043cqbgUJQgAPmCTziMcZVbfTPfXUIKlrx'
  },
  production: {
    domain: 'sentia-manufacturing.railway.app',
    nodeEnv: 'production',
    clerkPublishableKey: 'pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY',
    clerkSecretKey: 'sk_live_YOUR_PRODUCTION_SECRET_KEY'
  }
};

class RailwayEnvironmentSetup {
  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    try {
      execSync('railway --version', { stdio: 'pipe' });
      console.log('✅ Railway CLI is installed');
    } catch (error) {
      console.error('❌ Railway CLI not found. Installing...');
      execSync('npm install -g @railway/cli', { stdio: 'inherit' });
    }

    try {
      const result = execSync('railway whoami', { stdio: 'pipe' });
      console.log(`✅ Logged in as: ${result.toString().trim()}`);
    } catch (error) {
      console.error('❌ Not logged in to Railway. Please run: railway login');
      process.exit(1);
    }

    try {
      const result = execSync('railway status', { stdio: 'pipe' });
      console.log(`✅ Railway project linked: ${result.toString().trim()}`);
    } catch (error) {
      console.error('❌ No Railway project linked. Please run: railway link');
      process.exit(1);
    }
  }

  async setupEnvironmentVariables(envName, env) {
    console.log(`\n🔧 Setting up ${envName.toUpperCase()} environment...`);
    
    const variables = {
      NODE_ENV: env.nodeEnv,
      PORT: '3000',
      VITE_CLERK_PUBLISHABLE_KEY: env.clerkPublishableKey,
      CLERK_SECRET_KEY: env.clerkSecretKey,
      DATABASE_URL: 'postgresql://neondb_owner:npg_2wXVD9gdintm@ep-shiny-dream-ab2zho2p-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
      CORS_ORIGINS: `https://${env.domain}`,
      UNLEASHED_API_ID: 'd5313df6-db35-430c-a69e-ae27dffe0c5a',
      UNLEASHED_API_KEY: '2bJcHlDhIV04ScdqT60c3zlnG7hOER7aoPSh2IF2hWQluOi7ZaGkeu4SGeseYexAqOGfcRmyl9c6QYueJHyQ==',
      LOG_LEVEL: 'info'
    };

    let successCount = 0;
    for (const [key, value] of Object.entries(variables)) {
      try {
        execSync(`railway variables set ${key}="${value}"`, { stdio: 'pipe' });
        console.log(`  ✅ Set ${key}`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ Failed to set ${key}`);
      }
    }

    console.log(`📊 ${successCount}/${Object.keys(variables).length} variables set successfully`);
    return successCount === Object.keys(variables).length;
  }

  async setupAllEnvironments() {
    console.log('🚀 Setting up all Railway environments...\n');
    
    await this.checkPrerequisites();
    
    const results = {};
    for (const [envName, env] of Object.entries(environments)) {
      const success = await this.setupEnvironmentVariables(envName, env);
      results[envName] = success;
    }
    
    console.log('\n📊 Setup Summary:');
    for (const [env, success] of Object.entries(results)) {
      const emoji = success ? '✅' : '❌';
      const domain = environments[env].domain;
      console.log(`${emoji} ${env.toUpperCase()}: https://${domain}`);
    }
    
    const successCount = Object.values(results).filter(s => s).length;
    if (successCount === Object.keys(results).length) {
      console.log('\n🎉 All environments configured successfully!');
    } else {
      console.log(`\n⚠️  ${successCount}/${Object.keys(results).length} environments configured`);
    }
  }
}

const setup = new RailwayEnvironmentSetup();
setup.setupAllEnvironments().catch(console.error);