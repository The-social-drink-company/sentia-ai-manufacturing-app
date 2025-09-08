#!/usr/bin/env node

/**
 * Test script to verify Clerk connection and list existing users
 */

import { clerkClient } from '@clerk/clerk-sdk-node';
import dotenv from 'dotenv';

dotenv.config();

async function testClerkConnection() {
  try {
    console.log('🔍 Testing Clerk connection...\n');
    
    // Check environment
    if (!process.env.CLERK_SECRET_KEY) {
      console.error('❌ CLERK_SECRET_KEY not found');
      process.exit(1);
    }
    
    console.log('✅ Secret key found:', process.env.CLERK_SECRET_KEY.substring(0, 15) + '...');
    
    // Test API connection by listing users
    console.log('📋 Fetching existing users...');
    const users = await clerkClient.users.getUserList();
    
    console.log(`✅ Connection successful! Found ${users.data.length} existing users:`);
    
    if (users.data.length > 0) {
      users.data.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.emailAddresses[0]?.emailAddress || 'No email'} (${user.firstName} ${user.lastName})`);
        if (user.publicMetadata?.role) {
          console.log(`      Role: ${user.publicMetadata.role}`);
        }
      });
    } else {
      console.log('   No users found in this Clerk application');
    }
    
    // Test creating a simple user with minimal data
    console.log('\n🧪 Testing user creation with minimal data...');
    
    try {
      const testUser = await clerkClient.users.createUser({
        emailAddress: ['test@sentia.local'],
        firstName: 'Test',
        lastName: 'User'
      });
      
      console.log('✅ Test user created successfully:', testUser.id);
      
      // Clean up test user
      await clerkClient.users.deleteUser(testUser.id);
      console.log('✅ Test user cleaned up');
      
    } catch (createError) {
      console.log('❌ User creation failed:');
      console.log('   Status:', createError.status);
      console.log('   Message:', createError.message);
      if (createError.errors) {
        console.log('   Errors:', createError.errors);
      }
    }
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('   Status:', error.status);
    console.error('   Message:', error.message);
    if (error.errors) {
      console.error('   Errors:', error.errors);
    }
  }
}

testClerkConnection();