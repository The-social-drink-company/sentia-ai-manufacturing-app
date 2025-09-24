#!/usr/bin/env node

/**
 * Script to add users to Clerk application
 * Uses Clerk Backend API to programmatically create users
 */

import { createClerkClient } from '@clerk/backend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Clerk client with secret key from environment
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Default users to add (you can modify these)
const defaultUsers = [
  {
    emailAddress: 'admin@sentia.com',
    firstName: 'Admin',
    lastName: 'User',
    password: 'SentiaAdmin123!',
    role: 'admin'
  },
  {
    emailAddress: 'manager@sentia.com',
    firstName: 'Manager',
    lastName: 'User',
    password: 'SentiaManager123!',
    role: 'manager'
  },
  {
    emailAddress: 'operator@sentia.com',
    firstName: 'Operator',
    lastName: 'User',
    password: 'SentiaOperator123!',
    role: 'operator'
  },
  {
    emailAddress: 'viewer@sentia.com',
    firstName: 'Viewer',
    lastName: 'User',
    password: 'SentiaViewer123!',
    role: 'viewer'
  }
];

async function addUser(userData) {
  try {
    console.log(`Adding user: ${userData.emailAddress}`);
    
    const user = await clerk.users.createUser({
      emailAddress: [userData.emailAddress],
      firstName: userData.firstName,
      lastName: userData.lastName,
      publicMetadata: {
        role: userData.role
      },
      privateMetadata: {
        createdBy: 'admin-script',
        createdAt: new Date().toISOString()
      }
    });

    console.log(`✅ Successfully created user: ${userData.emailAddress} (ID: ${user.id})`);
    return user;
    
  } catch (error) {
    console.error(`❌ Error creating user ${userData.emailAddress}:`, error.message);
    
    // Handle specific error cases
    if (error.status === 422 && error.message?.includes('email_address')) {
      console.log(`   User ${userData.emailAddress} may already exist`);
    }
    
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Clerk user creation script...\n');
  
  // Verify Clerk configuration
  if (!process.env.CLERK_SECRET_KEY) {
    console.error('❌ CLERK_SECRET_KEY not found in environment variables');
    process.exit(1);
  }
  
  console.log(`📊 Adding ${defaultUsers.length} users to Clerk application\n`);
  
  // Add each user
  const results = [];
  for (const userData of defaultUsers) {
    const user = await addUser(userData);
    results.push({ userData, user, success: !!user });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n📋 Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  console.log(`✅ Successfully created: ${successful} users`);
  console.log(`❌ Failed to create: ${failed} users`);
  
  if (successful > 0) {
    console.log('\n👥 Created users:');
    results
      .filter(r => r.success)
      .forEach(r => {
        console.log(`  - ${r.userData.emailAddress} (${r.userData.role})`);
      });
  }
  
  if (failed > 0) {
    console.log('\n⚠️  Failed users:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  - ${r.userData.emailAddress}`);
      });
  }
  
  console.log('\n🎉 User creation script completed!');
}

// Handle command line arguments for custom users
if (process.argv.length > 2) {
  const email = process.argv[2];
  const firstName = process.argv[3] || 'User';
  const lastName = process.argv[4] || 'Name';
  const role = process.argv[5] || 'viewer';
  const password = process.argv[6] || 'DefaultPass123!';
  
  console.log('📝 Adding custom user from command line arguments...');
  addUser({
    emailAddress: email,
    firstName,
    lastName,
    password,
    role
  }).then(() => {
    console.log('✨ Custom user creation completed!');
  });
} else {
  // Run main script with default users
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}