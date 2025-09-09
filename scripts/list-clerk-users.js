#!/usr/bin/env node

import { createClerkClient } from '@clerk/backend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

async function listAllUsers() {
  try {
    console.log('=================================');
    console.log('Sentia Manufacturing Dashboard');
    console.log('Clerk User List');
    console.log('=================================\n');

    if (!process.env.CLERK_SECRET_KEY) {
      console.error('ERROR: CLERK_SECRET_KEY not found in environment variables');
      console.log('Please set CLERK_SECRET_KEY in your .env file');
      process.exit(1);
    }

    console.log('Fetching users from Clerk...\n');

    // Get all users
    const users = await clerk.users.getUserList({
      limit: 100,
      offset: 0
    });

    if (!users.data || users.data.length === 0) {
      console.log('No users found in Clerk application.');
      return;
    }

    console.log(`Found ${users.data.length} user(s) in Clerk:\n`);
    console.log('=================================');

    users.data.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.emailAddresses?.[0]?.emailAddress || 'No email'}`);
      console.log(`  Name: ${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name');
      console.log(`  Username: ${user.username || 'No username'}`);
      console.log(`  Role: ${user.publicMetadata?.role || 'No role set'}`);
      console.log(`  Permissions: ${user.publicMetadata?.permissions ? JSON.stringify(user.publicMetadata.permissions) : 'No permissions'}`);
      console.log(`  Created: ${new Date(user.createdAt).toLocaleString()}`);
      console.log(`  Last Sign In: ${user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : 'Never'}`);
      console.log(`  Status: ${user.banned ? 'Banned' : 'Active'}`);
      console.log('  ---');
    });

    console.log('\n=================================');
    console.log(`Total Users: ${users.data.length}`);
    console.log('=================================');

  } catch (error) {
    console.error('Error fetching users from Clerk:', error);
    console.error('Error details:', error.message);
    if (error.status) {
      console.error('Status code:', error.status);
    }
  }
}

// Run the script
listAllUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});