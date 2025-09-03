#!/usr/bin/env node

// Create admin user script using Clerk Backend SDK
import { createClerkClient } from '@clerk/backend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function createAdminUser() {
    try {
        console.log('Creating admin user...');
        
        // Initialize Clerk client with secret key
        const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        
        // Create the admin user
        const user = await clerkClient.users.createUser({
            emailAddress: ['dudley@financeflo.ai'],
            username: 'dudleypeacock',
            password: 'dp$456789',
            firstName: 'Dudley',
            lastName: 'Pacock',
            // Set the user as verified to avoid email verification
            emailAddressVerified: true,
            skipPasswordRequirement: false,
            skipPasswordChecks: false,
        });

        console.log('SUCCESS: Admin user created successfully!');
        console.log('User ID:', user.id);
        console.log('Email:', user.emailAddresses[0]?.emailAddress);
        console.log('Username:', user.username);
        console.log('');
        console.log('Login credentials:');
        console.log('Email/Username: dudleypeacock or dudley@financeflo.ai');
        console.log('Password: dp$456789');
        
        // Optional: Create organization and make user admin
        try {
            const org = await clerkClient.organizations.createOrganization({
                name: 'Sentia Manufacturing',
                slug: 'sentia-manufacturing',
                createdBy: user.id,
            });
            
            console.log('');
            console.log('Organization created:', org.name);
            console.log('Organization ID:', org.id);
        } catch (orgError) {
            console.log('Note: Organization creation skipped (may require higher plan)');
        }

    } catch (error) {
        console.error('ERROR creating admin user:');
        console.error('Message:', error.message);
        
        if (error.errors && error.errors.length > 0) {
            console.error('Details:');
            error.errors.forEach((err, index) => {
                console.error(`  ${index + 1}. ${err.message} (${err.code})`);
            });
        }
        
        // Check if user already exists
        if (error.message.includes('already exists')) {
            console.log('');
            console.log('User may already exist. Try logging in with:');
            console.log('Email/Username: dudleypeacock or dudley@financeflo.ai');
            console.log('Password: dp$456789');
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
createAdminUser();