#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function listDatabaseUsers() {
  try {
    console.log('=================================');
    console.log('CapLiquify Manufacturing Platform');
    console.log('Database User List (Prisma)');
    console.log('=================================\n');

    if (!process.env.DATABASE_URL) {
      console.error('ERROR: DATABASE_URL not found in environment variables');
      console.log('Please set DATABASE_URL in your .env file');
      process.exit(1);
    }

    console.log('Connecting to database...\n');

    // Connect to database
    await prisma.$connect();
    console.log('Database connected successfully\n');

    // Get all users from database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        display_name: true,
        role: true,
        permissions: true,
        isActive: true,
        is_admin: true,
        department: true,
        last_login: true,
        login_count: true,
        createdAt: true,
        approved: true,
        sso_provider: true,
        created_via_jit: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!users || users.length === 0) {
      console.log('No users found in application database.');
      return;
    }

    console.log(`Found ${users.length} user(s) in database:\n`);
    console.log('=================================');

    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Username: ${user.username || 'No username'}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.first_name || ''} ${user.last_name || ''}`.trim() || user.display_name || 'No name');
      console.log(`  Role: ${user.role}`);
      console.log(`  Admin: ${user.is_admin ? 'Yes' : 'No'}`);
      console.log(`  Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`  Approved: ${user.approved ? 'Yes' : 'No'}`);
      console.log(`  Department: ${user.department || 'Not specified'}`);
      console.log(`  SSO Provider: ${user.sso_provider || 'None'}`);
      console.log(`  Created via JIT: ${user.created_via_jit ? 'Yes' : 'No'}`);
      console.log(`  Permissions: ${user.permissions ? JSON.stringify(user.permissions) : 'None specified'}`);
      console.log(`  Login Count: ${user.login_count || 0}`);
      console.log(`  Last Login: ${user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}`);
      console.log(`  Created: ${new Date(user.createdAt).toLocaleString()}`);
      console.log('  ---');
    });

    // Statistics
    const stats = {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      admins: users.filter(u => u.is_admin).length,
      approved: users.filter(u => u.approved).length,
      ssoUsers: users.filter(u => u.sso_provider).length,
      jitUsers: users.filter(u => u.created_via_jit).length,
      loggedInUsers: users.filter(u => u.last_login).length
    };

    console.log('\n=================================');
    console.log('Database User Statistics:');
    console.log('=================================');
    console.log(`Total Users: ${stats.total}`);
    console.log(`Active Users: ${stats.active}`);
    console.log(`Administrators: ${stats.admins}`);
    console.log(`Approved Users: ${stats.approved}`);
    console.log(`SSO Users: ${stats.ssoUsers}`);
    console.log(`JIT Provisioned: ${stats.jitUsers}`);
    console.log(`Users Who Logged In: ${stats.loggedInUsers}`);
    console.log('=================================');

  } catch (error) {
    console.error('Error fetching users from database:', error);
    console.error('Error details:', error.message);
    
    if (error.code === 'P1001') {
      console.error('Database connection failed - check DATABASE_URL');
    } else if (error.code === 'P2021') {
      console.error('Table "User" does not exist - run prisma db push or migrations');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
listDatabaseUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});