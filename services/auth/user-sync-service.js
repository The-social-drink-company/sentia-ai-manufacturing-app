#!/usr/bin/env node

/**
 * User Authentication Sync Service
 * Synchronizes users between Clerk authentication and application database
 */

import { createClerkClient } from '@clerk/backend';
import { PrismaClient } from '@prisma/client';
import { logInfo, logError, logWarn } from '../observability/structuredLogger.js';

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});
const prisma = new PrismaClient();

class UserSyncService {
  constructor() {
    this.isConfigured = false;
    this.syncStats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      lastSyncTime: null
    };

    this.checkConfiguration();
  }

  checkConfiguration() {
    if (process.env.CLERK_SECRET_KEY && 
        process.env.CLERK_SECRET_KEY !== 'your_key_here' &&
        process.env.CLERK_SECRET_KEY.length > 10) {
      this.isConfigured = true;
      logInfo('User sync service configured');
    } else {
      this.isConfigured = false;
      logWarn('User sync service not configured - missing CLERK_SECRET_KEY');
    }
  }

  async syncAllUsers() {
    if (!this.isConfigured) {
      logWarn('Cannot sync users - service not configured');
      return { success: false, error: 'Service not configured' };
    }

    try {
      logInfo('Starting complete user synchronization');
      this.syncStats.totalSyncs++;

      // Get all users from Clerk
      const clerkUsers = await this.getAllClerkUsers();
      logInfo(`Found ${clerkUsers.length} users in Clerk`);

      // Get all users from database
      const dbUsers = await this.getAllDatabaseUsers();
      logInfo(`Found ${dbUsers.length} users in database`);

      // Sync Clerk users to database
      const syncResults = await this.syncClerkUsersToDatabase(clerkUsers, dbUsers);

      // Update sync statistics
      this.syncStats.successfulSyncs++;
      this.syncStats.lastSyncTime = new Date();

      logInfo('User synchronization completed successfully', syncResults);

      return {
        success: true,
        ...syncResults,
        timestamp: this.syncStats.lastSyncTime
      };

    } catch (error) {
      this.syncStats.failedSyncs++;
      logError('User synchronization failed', error);

      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async getAllClerkUsers() {
    const users = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await clerk.users.getUserList({
          limit,
          offset
        });

        if (response.data && response.data.length > 0) {
          users.push(...response.data);
          offset += limit;
          
          // Check if there are more users
          hasMore = response.data.length === limit;
        } else {
          hasMore = false;
        }

      } catch (error) {
        logError('Failed to fetch Clerk users', error);
        throw error;
      }
    }

    return users;
  }

  async getAllDatabaseUsers() {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
          isActive: true,
          is_admin: true,
          permissions: true,
          clerk_user_id: true, // If this field exists
          created_via_jit: true,
          createdAt: true,
          last_login: true
        }
      });

      return users;
    } catch (error) {
      logError('Failed to fetch database users', error);
      throw error;
    }
  }

  async syncClerkUsersToDatabase(clerkUsers, dbUsers) {
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      details: []
    };

    // Create a map of database users by email for quick lookup
    const dbUserMap = new Map();
    dbUsers.forEach(user => {
      if (user.email) {
        dbUserMap.set(user.email.toLowerCase(), user);
      }
    });

    for (const clerkUser of clerkUsers) {
      try {
        const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
        
        if (!primaryEmail) {
          results.skipped++;
          results.details.push({
            action: 'skipped',
            reason: 'No email address',
            clerkUserId: clerkUser.id
          });
          continue;
        }

        const existingUser = dbUserMap.get(primaryEmail.toLowerCase());

        if (existingUser) {
          // Update existing user
          const updateResult = await this.updateDatabaseUser(existingUser, clerkUser);
          if (updateResult.success) {
            results.updated++;
            results.details.push({
              action: 'updated',
              email: primaryEmail,
              clerkUserId: clerkUser.id,
              dbUserId: existingUser.id
            });
          } else {
            results.errors.push(updateResult.error);
          }
        } else {
          // Create new user
          const createResult = await this.createDatabaseUser(clerkUser);
          if (createResult.success) {
            results.created++;
            results.details.push({
              action: 'created',
              email: primaryEmail,
              clerkUserId: clerkUser.id,
              dbUserId: createResult.userId
            });
          } else {
            results.errors.push(createResult.error);
          }
        }

      } catch (error) {
        results.errors.push(`Error processing user ${clerkUser.id}: ${error.message}`);
        logError('Error processing Clerk user', error);
      }
    }

    return results;
  }

  async updateDatabaseUser(dbUser, clerkUser) {
    try {
      const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
      
      const updateData = {
        first_name: clerkUser.firstName || dbUser.first_name,
        last_name: clerkUser.lastName || dbUser.last_name,
        clerk_user_id: clerkUser.id, // Store Clerk ID for reference
        updatedAt: new Date()
      };

      // Only update if there are actual changes
      const hasChanges = 
        updateData.first_name !== dbUser.first_name ||
        updateData.last_name !== dbUser.last_name ||
        !dbUser.clerk_user_id;

      if (hasChanges) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: updateData
        });

        logInfo('Updated database user from Clerk', {
          email: primaryEmail,
          dbUserId: dbUser.id,
          clerkUserId: clerkUser.id
        });
      }

      return { success: true };

    } catch (error) {
      logError('Failed to update database user', error);
      return { success: false, error: error.message };
    }
  }

  async createDatabaseUser(clerkUser) {
    try {
      const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
      
      if (!primaryEmail) {
        throw new Error('No email address found for Clerk user');
      }

      // Determine role based on email domain or other criteria
      const role = this.determineUserRole(primaryEmail, clerkUser);
      const isAdmin = role === 'admin';

      const userData = {
        username: clerkUser.username || primaryEmail,
        email: primaryEmail,
        first_name: clerkUser.firstName,
        last_name: clerkUser.lastName,
        role: role,
        isActive: true,
        is_admin: isAdmin,
        clerk_user_id: clerkUser.id,
        created_via_jit: true,
        approved: true, // Auto-approve users from Clerk
        permissions: this.getDefaultPermissions(role),
        two_factor_enabled: false,
        force_password_change: false,
        timezone: 'Europe/London', // Default timezone
        language: 'en'
      };

      const newUser = await prisma.user.create({
        data: userData
      });

      logInfo('Created database user from Clerk', {
        email: primaryEmail,
        dbUserId: newUser.id,
        clerkUserId: clerkUser.id,
        role: role
      });

      return { success: true, userId: newUser.id };

    } catch (error) {
      logError('Failed to create database user', error);
      return { success: false, error: error.message };
    }
  }

  determineUserRole(email, clerkUser) {
    // Define role assignment rules
    const adminDomains = ['sentiaspirits.com'];
    const managerDomains = ['gabalabs.com'];
    
    const emailDomain = email.split('@')[1]?.toLowerCase();

    // Check for admin roles
    if (adminDomains.includes(emailDomain)) {
      return 'admin';
    }

    // Check for manager roles
    if (managerDomains.includes(emailDomain)) {
      return 'manager';
    }

    // Check Clerk metadata for role
    if (clerkUser.publicMetadata?.role) {
      return clerkUser.publicMetadata.role;
    }

    // Default to user role
    return 'user';
  }

  getDefaultPermissions(role) {
    const permissionSets = {
      admin: {
        read: true,
        write: true,
        admin: true,
        delete: true,
        manage_users: true,
        manage_settings: true,
        view_reports: true,
        export_data: true
      },
      manager: {
        read: true,
        write: true,
        view_reports: true,
        export_data: true,
        manage_team: true
      },
      user: {
        read: true,
        view_reports: false,
        export_data: false
      },
      viewer: {
        read: true
      }
    };

    return permissionSets[role] || permissionSets.user;
  }

  async syncSingleUser(clerkUserId) {
    if (!this.isConfigured) {
      logWarn('Cannot sync user - service not configured');
      return { success: false, error: 'Service not configured' };
    }

    try {
      // Get user from Clerk
      const clerkUser = await clerk.users.getUser(clerkUserId);
      if (!clerkUser) {
        throw new Error('User not found in Clerk');
      }

      const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
      if (!primaryEmail) {
        throw new Error('No email address found for user');
      }

      // Check if user exists in database
      const existingUser = await prisma.user.findUnique({
        where: { email: primaryEmail.toLowerCase() }
      });

      let result;
      if (existingUser) {
        result = await this.updateDatabaseUser(existingUser, clerkUser);
        result.action = 'updated';
      } else {
        result = await this.createDatabaseUser(clerkUser);
        result.action = 'created';
      }

      if (result.success) {
        logInfo('Single user sync completed', {
          action: result.action,
          email: primaryEmail,
          clerkUserId: clerkUserId
        });
      }

      return result;

    } catch (error) {
      logError('Single user sync failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async cleanupInactiveUsers() {
    try {
      logInfo('Starting inactive user cleanup');

      // Find users in database that don't exist in Clerk
      const dbUsers = await this.getAllDatabaseUsers();
      const clerkUserEmails = new Set();

      // Get all Clerk user emails
      const clerkUsers = await this.getAllClerkUsers();
      clerkUsers.forEach(user => {
        const email = user.emailAddresses?.[0]?.emailAddress;
        if (email) {
          clerkUserEmails.add(email.toLowerCase());
        }
      });

      const orphanedUsers = dbUsers.filter(user => 
        user.email && 
        user.created_via_jit && 
        !clerkUserEmails.has(user.email.toLowerCase())
      );

      logInfo(`Found ${orphanedUsers.length} orphaned users`);

      // Deactivate orphaned users instead of deleting them
      const deactivatedCount = await prisma.user.updateMany({
        where: {
          id: { in: orphanedUsers.map(u => u.id) }
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      logInfo('Inactive user cleanup completed', {
        orphanedUsers: orphanedUsers.length,
        deactivated: deactivatedCount.count
      });

      return {
        success: true,
        orphanedUsers: orphanedUsers.length,
        deactivated: deactivatedCount.count
      };

    } catch (error) {
      logError('Inactive user cleanup failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getSyncStatus() {
    return {
      configured: this.isConfigured,
      stats: this.syncStats,
      lastSyncAge: this.syncStats.lastSyncTime ? 
        Date.now() - this.syncStats.lastSyncTime.getTime() : null
    };
  }

  async scheduledSync() {
    logInfo('Running scheduled user synchronization');
    
    const syncResult = await this.syncAllUsers();
    
    // Also cleanup inactive users weekly
    const now = new Date();
    const isWeeklyCleanup = now.getDay() === 0 && now.getHours() === 2; // Sunday at 2 AM
    
    if (isWeeklyCleanup) {
      await this.cleanupInactiveUsers();
    }

    return syncResult;
  }
}

export const userSyncService = new UserSyncService();