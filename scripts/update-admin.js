#!/usr/bin/env node

// Update existing admin user with proper metadata
import { createClerkClient } from '@clerk/backend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function updateAdminUser() {
    try {
        console.log('Setting up master admin user with full privileges...');
        
        // Initialize Clerk client with secret key
        const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        
        // Target admin user ID
        const masterAdminUserId = 'user_32BPH7zwpYMYM1X46weccOs4DsR';
        
        console.log('Configuring master admin user:', masterAdminUserId);
        
        // Get the specific admin user by ID
        let adminUser;
        try {
            adminUser = await clerkClient.users.getUser(masterAdminUserId);
            console.log('Found master admin user:', adminUser.id);
        } catch (error) {
            console.log('User ID not found, searching by email/username...');
            
            // Try to find by email
            const userList = await clerkClient.users.getUserList({
                emailAddress: ['dudley@financeflo.ai']
            });
            
            if (!userList || userList.length === 0) {
                // Try to find by username
                const usersByUsername = await clerkClient.users.getUserList({
                    username: ['dudleypeacock']
                });
                
                if (!usersByUsername || usersByUsername.length === 0) {
                    console.error('Master admin user not found by ID, email, or username');
                    process.exit(1);
                }
                
                adminUser = usersByUsername[0];
                console.log('Found admin user by username:', adminUser.id);
            } else {
                adminUser = userList[0];
                console.log('Found admin user by email:', adminUser.id);
            }
        }
        
        // Update the user's metadata with master admin privileges
        await clerkClient.users.updateUserMetadata(adminUser.id, {
            publicMetadata: {
                role: 'admin',
                approved: true,
                masterAdmin: true,
                permissions: {
                    fullAccess: true,
                    autoApproved: true,
                    systemAdmin: true,
                    userManagement: true,
                    dataAccess: true,
                    configAccess: true
                },
                createdAt: new Date().toISOString(),
                notes: 'Master administrator with full system privileges'
            }
        });
        
        console.log('SUCCESS: Master admin privileges configured!');
        console.log('=====================================');
        console.log('User ID:', adminUser.id);
        console.log('Email:', adminUser.emailAddresses[0]?.emailAddress || 'dudley@financeflo.ai');
        console.log('Username:', adminUser.username || 'dudleypeacock');
        console.log('Role: Master Administrator');
        console.log('Status: Automatically Approved');
        console.log('Privileges: Full System Access');
        console.log('');
        console.log('Master Admin capabilities:');
        console.log('- Full access to all dashboard features');
        console.log('- Automatic approval for all functions');
        console.log('- User management and invitation system');
        console.log('- System configuration access');
        console.log('- Database and resource management');
        console.log('- Admin panel at /admin');
        console.log('- No restrictions on any functionality');

    } catch (error) {
        console.error('ERROR updating admin user:');
        console.error('Message:', error.message);
        
        if (error.errors && error.errors.length > 0) {
            console.error('Details:');
            error.errors.forEach((err, index) => {
                console.error(`  ${index + 1}. ${err.message} (${err.code})`);
            });
        }
        
        process.exit(1);
    }
}

// Check if required environment variables are set
if (!process.env.CLERK_SECRET_KEY) {
    console.error('ERROR: CLERK_SECRET_KEY environment variable not found');
    console.error('Make sure .env.local file contains the Clerk secret key');
    process.exit(1);
}

// Run the script
updateAdminUser();