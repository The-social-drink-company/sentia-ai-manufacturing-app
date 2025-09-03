#!/usr/bin/env node

// Update existing admin user with proper metadata
import { createClerkClient } from '@clerk/backend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function updateAdminUser() {
    try {
        console.log('Updating admin user metadata...');
        
        // Initialize Clerk client with secret key
        const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        
        // Find the existing admin user by email
        const userList = await clerkClient.users.getUserList({
            emailAddress: ['dudley@financeflo.ai']
        });
        
        if (!userList || userList.length === 0) {
            console.error('Admin user not found with email: dudley@financeflo.ai');
            
            // Try to find by username instead
            const usersByUsername = await clerkClient.users.getUserList({
                username: ['dudleypeacock']
            });
            
            if (!usersByUsername || usersByUsername.length === 0) {
                console.error('Admin user not found by username either');
                process.exit(1);
            }
            
            const adminUser = usersByUsername[0];
            console.log('Found admin user by username:', adminUser.id);
        } else {
            var adminUser = userList[0];
            console.log('Found admin user by email:', adminUser.id);
        }
        console.log('Found admin user:', adminUser.id);
        
        // Update the user's metadata
        await clerkClient.users.updateUserMetadata(adminUser.id, {
            publicMetadata: {
                role: 'admin',
                approved: true
            }
        });
        
        console.log('SUCCESS: Admin user metadata updated successfully!');
        console.log('User ID:', adminUser.id);
        console.log('Email:', adminUser.emailAddresses[0]?.emailAddress);
        console.log('Username:', adminUser.username);
        console.log('Role: admin');
        console.log('Approved: true');
        console.log('');
        console.log('Admin can now:');
        console.log('- Access the admin panel at /admin');
        console.log('- Invite new users');
        console.log('- Approve/revoke user access');
        console.log('- Manage all system features');

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