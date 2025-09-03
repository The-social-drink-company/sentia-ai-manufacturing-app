#!/usr/bin/env node

// Add multiple master admin users with full privileges
import { createClerkClient } from '@clerk/backend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Master admin users to configure
const masterAdmins = [
    {
        email: 'dudley@financeflo.ai',
        username: 'dudleypeacock',
        password: 'dp$456789',
        userId: 'user_32BPH7zwpYMYM1X46weccOs4DsR', // Existing user
        name: 'Dudley Peacock'
    },
    {
        email: 'adam@financeflo.ai',
        username: 'adamfinanceflo',
        password: 'vN6*y95nZ%!T@zqp',
        name: 'Adam FinanceFlow'
    },
    {
        email: 'daniel.kenny@sentiaspirits.com',
        username: 'danielkenny',
        password: 'Ui$4j#AnxPSVpnSQ',
        name: 'Daniel Kenny'
    }
];

async function addMasterAdmins() {
    try {
        console.log('Setting up multiple master admin users...');
        console.log('==========================================');
        
        // Initialize Clerk client with secret key
        const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        
        for (const admin of masterAdmins) {
            console.log(`\nProcessing master admin: ${admin.email}`);
            
            let adminUser;
            
            // Check if user already exists by ID first (for existing users)
            if (admin.userId) {
                try {
                    adminUser = await clerkClient.users.getUser(admin.userId);
                    console.log(`Found existing user by ID: ${adminUser.id}`);
                } catch (error) {
                    console.log(`User ID not found, will search by email: ${admin.email}`);
                }
            }
            
            // If not found by ID, search by email
            if (!adminUser) {
                try {
                    const userList = await clerkClient.users.getUserList({
                        emailAddress: [admin.email]
                    });
                    
                    if (userList && userList.length > 0) {
                        adminUser = userList[0];
                        console.log(`Found existing user by email: ${adminUser.id}`);
                    }
                } catch (error) {
                    console.log(`No existing user found for ${admin.email}`);
                }
            }
            
            // If user doesn't exist, create new user
            if (!adminUser) {
                console.log(`Creating new master admin user: ${admin.email}`);
                
                try {
                    adminUser = await clerkClient.users.createUser({
                        emailAddress: [admin.email],
                        username: admin.username,
                        password: admin.password,
                        firstName: admin.name.split(' ')[0],
                        lastName: admin.name.split(' ').slice(1).join(' '),
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
                    
                    console.log(`SUCCESS: Created new master admin user: ${adminUser.id}`);
                } catch (createError) {
                    console.error(`ERROR creating user ${admin.email}:`, createError.message);
                    continue; // Skip to next admin
                }
            } else {
                // Update existing user with master admin privileges
                console.log(`Updating existing user with master admin privileges...`);
                
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
                        updatedAt: new Date().toISOString(),
                        notes: 'Master administrator with full system privileges'
                    }
                });
                
                console.log(`SUCCESS: Updated existing user to master admin`);
            }
            
            // Display admin details
            console.log(`--------------------`);
            console.log(`User ID: ${adminUser.id}`);
            console.log(`Email: ${admin.email}`);
            console.log(`Username: ${admin.username}`);
            console.log(`Password: ${admin.password}`);
            console.log(`Status: Master Administrator`);
            console.log(`Privileges: Full System Access`);
        }
        
        console.log('\n==========================================');
        console.log('ALL MASTER ADMINS CONFIGURED SUCCESSFULLY!');
        console.log('==========================================');
        console.log('\nMASTER ADMIN CREDENTIALS:');
        console.log('========================');
        
        masterAdmins.forEach((admin, index) => {
            console.log(`\n${index + 1}. ${admin.name}:`);
            console.log(`   Email: ${admin.email}`);
            console.log(`   Username: ${admin.username}`);
            console.log(`   Password: ${admin.password}`);
        });
        
        console.log('\nAll master admins have:');
        console.log('- Full access to all dashboard features');
        console.log('- Automatic approval for all functions');
        console.log('- User management and invitation capabilities');
        console.log('- System configuration access');
        console.log('- Database and resource management');
        console.log('- Admin panel access at /admin');
        console.log('- No restrictions on any functionality');

    } catch (error) {
        console.error('ERROR setting up master admins:');
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
addMasterAdmins();