#!/usr/bin/env node

/**
 * Comprehensive User Report
 * Combines data from Clerk authentication system and application database
 * Provides complete view of all registered users across systems
 */

import { createClerkClient } from '@clerk/backend';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});
const prisma = new PrismaClient();

async function generateComprehensiveUserReport() {
  console.log('=========================================');
  console.log('SENTIA MANUFACTURING DASHBOARD');
  console.log('COMPREHENSIVE USER REPORT');
  console.log('=========================================\n');

  try {
    // Check environment variables
    if (!process.env.CLERK_SECRET_KEY) {
      console.error('ERROR: CLERK_SECRET_KEY not found');
      process.exit(1);
    }
    if (!process.env.DATABASE_URL) {
      console.error('ERROR: DATABASE_URL not found');
      process.exit(1);
    }

    console.log('Fetching users from all systems...\n');

    // Fetch from Clerk
    console.log('1. CLERK AUTHENTICATION SYSTEM');
    console.log('=====================================');
    
    const clerkUsers = await clerk.users.getUserList({
      limit: 100,
      offset: 0
    });

    if (!clerkUsers.data || clerkUsers.data.length === 0) {
      console.log('No users found in Clerk.\n');
    } else {
      console.log(`Found ${clerkUsers.data.length} user(s) in Clerk:\n`);
      
      clerkUsers.data.forEach((user, index) => {
        console.log(`Clerk User ${index + 1}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  Email: ${user.emailAddresses?.[0]?.emailAddress || 'No email'}`);
        console.log(`  Name: ${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name');
        console.log(`  Username: ${user.username || 'No username'}`);
        console.log(`  Role: ${user.publicMetadata?.role || 'No role set'}`);
        console.log(`  Created: ${new Date(user.createdAt).toLocaleString()}`);
        console.log(`  Last Sign In: ${user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : 'Never'}`);
        console.log(`  Status: ${user.banned ? 'Banned' : 'Active'}`);
        console.log('  ---');
      });
    }

    // Fetch from Database
    console.log('\n2. APPLICATION DATABASE (PRISMA)');
    console.log('=====================================');

    await prisma.$connect();
    
    const dbUsers = await prisma.user.findMany({
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

    if (!dbUsers || dbUsers.length === 0) {
      console.log('No users found in database.\n');
    } else {
      console.log(`Found ${dbUsers.length} user(s) in database:\n`);
      
      // Group users by role for better organization
      const usersByRole = dbUsers.reduce((acc, user) => {
        const role = user.role || 'unknown';
        if (!acc[role]) acc[role] = [];
        acc[role].push(user);
        return acc;
      }, {});

      Object.entries(usersByRole).forEach(([role, users]) => {
        console.log(`${role.toUpperCase()} USERS (${users.length}):`);
        console.log('----------------------------');
        
        users.forEach((user, index) => {
          const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.display_name || 'No name';
          console.log(`  ${index + 1}. ${fullName} (${user.email})`);
          console.log(`     Username: ${user.username}`);
          console.log(`     ID: ${user.id}`);
          console.log(`     Active: ${user.isActive ? 'Yes' : 'No'} | Admin: ${user.is_admin ? 'Yes' : 'No'} | Approved: ${user.approved ? 'Yes' : 'No'}`);
          console.log(`     Department: ${user.department || 'Not specified'}`);
          console.log(`     Login Count: ${user.login_count || 0} | Last Login: ${user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}`);
          console.log(`     Created: ${new Date(user.createdAt).toLocaleString()}`);
          if (user.permissions) {
            const perms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
            console.log(`     Permissions: ${Object.keys(perms).join(', ')}`);
          }
          console.log('');
        });
      });
    }

    // Generate comprehensive statistics
    console.log('\n3. COMPREHENSIVE STATISTICS');
    console.log('=====================================');

    const clerkStats = {
      total: clerkUsers.data ? clerkUsers.data.length : 0,
      active: clerkUsers.data ? clerkUsers.data.filter(u => !u.banned).length : 0,
      loggedIn: clerkUsers.data ? clerkUsers.data.filter(u => u.lastSignInAt).length : 0
    };

    const dbStats = {
      total: dbUsers.length,
      active: dbUsers.filter(u => u.isActive).length,
      admins: dbUsers.filter(u => u.is_admin).length,
      approved: dbUsers.filter(u => u.approved).length,
      loggedIn: dbUsers.filter(u => u.last_login).length,
      byRole: {}
    };

    // Count by role
    dbUsers.forEach(user => {
      const role = user.role || 'unknown';
      dbStats.byRole[role] = (dbStats.byRole[role] || 0) + 1;
    });

    console.log('Clerk Authentication System:');
    console.log(`  Total Users: ${clerkStats.total}`);
    console.log(`  Active Users: ${clerkStats.active}`);
    console.log(`  Users Who Signed In: ${clerkStats.loggedIn}`);
    console.log('');

    console.log('Application Database:');
    console.log(`  Total Users: ${dbStats.total}`);
    console.log(`  Active Users: ${dbStats.active}`);
    console.log(`  Administrators: ${dbStats.admins}`);
    console.log(`  Approved Users: ${dbStats.approved}`);
    console.log(`  Users Who Logged In: ${dbStats.loggedIn}`);
    console.log(`  User Distribution by Role:`);
    Object.entries(dbStats.byRole).forEach(([role, count]) => {
      console.log(`    ${role}: ${count} users`);
    });

    // Cross-reference analysis
    console.log('\n4. CROSS-SYSTEM ANALYSIS');
    console.log('=====================================');

    const clerkEmails = new Set(clerkUsers.data ? clerkUsers.data.map(u => u.emailAddresses?.[0]?.emailAddress).filter(e => e) : []);
    const dbEmails = new Set(dbUsers.map(u => u.email));

    const inBothSystems = [...clerkEmails].filter(email => dbEmails.has(email));
    const onlyInClerk = [...clerkEmails].filter(email => !dbEmails.has(email));
    const onlyInDatabase = [...dbEmails].filter(email => !clerkEmails.has(email));

    console.log(`Users in both Clerk and Database: ${inBothSystems.length}`);
    if (inBothSystems.length > 0) {
      inBothSystems.forEach(email => console.log(`  - ${email}`));
    }

    console.log(`\nUsers only in Clerk: ${onlyInClerk.length}`);
    if (onlyInClerk.length > 0) {
      onlyInClerk.forEach(email => console.log(`  - ${email}`));
    }

    console.log(`\nUsers only in Database: ${onlyInDatabase.length}`);
    if (onlyInDatabase.length > 0) {
      onlyInDatabase.forEach(email => console.log(`  - ${email}`));
    }

    // Key findings and recommendations
    console.log('\n5. KEY FINDINGS & RECOMMENDATIONS');
    console.log('=====================================');

    console.log('KEY FINDINGS:');
    console.log(`- Total unique users across both systems: ${new Set([...clerkEmails, ...dbEmails]).size}`);
    console.log(`- Clerk has ${clerkStats.total} users, Database has ${dbStats.total} users`);
    console.log(`- ${inBothSystems.length} users exist in both systems (synchronized)`);
    console.log(`- ${onlyInClerk.length} users only exist in Clerk (may need database sync)`);
    console.log(`- ${onlyInDatabase.length} users only exist in database (may need Clerk sync)`);
    console.log(`- ${dbStats.admins} users have admin privileges in the application`);
    console.log(`- ${dbStats.loggedIn} users have logged into the application at least once`);

    console.log('\nRECOMMendations:');
    if (onlyInClerk.length > 0) {
      console.log('- Consider syncing Clerk-only users to the database for full application access');
    }
    if (onlyInDatabase.length > 0) {
      console.log('- Database-only users may not be able to authenticate via Clerk');
    }
    if (dbStats.total - dbStats.loggedIn > 0) {
      console.log(`- ${dbStats.total - dbStats.loggedIn} users have never logged in - consider follow-up`);
    }
    if (dbStats.total - dbStats.approved > 0) {
      console.log(`- ${dbStats.total - dbStats.approved} users are not approved - review approval status`);
    }

    console.log('\n=========================================');
    console.log('REPORT COMPLETE');
    console.log('=========================================');

  } catch (error) {
    console.error('\nERROR generating user report:', error);
    console.error('Details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the report
generateComprehensiveUserReport().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});