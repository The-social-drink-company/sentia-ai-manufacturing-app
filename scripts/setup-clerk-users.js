#!/usr/bin/env node

import { createClerkClient } from '@clerk/backend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

// User configurations
const USERSTO_CREATE = [
  {
    email: 'paul.roberts@sentiaspirits.com',
    username: 'paul_roberts',
    firstName: 'Paul',
    lastName: 'Roberts',
    role: 'admin',
    publicMetadata: {
      role: 'admin',
      permissions: ['all']
    }
  },
  {
    email: 'david.orren@gabalabs.com',
    username: 'david_orren',
    firstName: 'David',
    lastName: 'Orren',
    role: 'admin',
    publicMetadata: {
      role: 'admin',
      permissions: ['all']
    }
  },
  {
    email: 'daniel.kenny@sentiaspirits.com',
    username: 'daniel_kenny',
    firstName: 'Daniel',
    lastName: 'Kenny',
    role: 'admin',
    publicMetadata: {
      role: 'admin',
      permissions: ['all']
    }
  },
  {
    email: 'marta.haczek@gabalabs.com',
    username: 'marta_haczek',
    firstName: 'Marta',
    lastName: 'Haczek',
    role: 'user',
    publicMetadata: {
      role: 'viewer',
      permissions: ['dashboard.view', 'reports.view']
    }
  },
  {
    email: 'matt.coulshed@gabalabs.com',
    username: 'matt_coulshed',
    firstName: 'Matt',
    lastName: 'Coulshed',
    role: 'user',
    publicMetadata: {
      role: 'viewer',
      permissions: ['dashboard.view', 'reports.view']
    }
  },
  {
    email: 'jaron.reid@gabalabs.com',
    username: 'jaron_reid',
    firstName: 'Jaron',
    lastName: 'Reid',
    role: 'user',
    publicMetadata: {
      role: 'viewer',
      permissions: ['dashboard.view', 'reports.view']
    }
  }
];

const EMAILTEMPLATE = {
  subject: 'Welcome to Sentia Manufacturing Dashboard - Test Access',
  body: `
Dear {{firstName}},

Welcome to the Sentia Manufacturing Dashboard! Your account has been successfully created.

**IMPORTANT NOTICE - DEVELOPMENT IN PROGRESS**
⚠️ Please note that the system is currently under active development. At this stage, we only need you to:
1. Test your login access
2. Verify you can access the dashboard
3. Report any login issues

The full functionality will be available once development is complete. You will be notified when the system is ready for full use.

Your Account Details:
- Email: {{email}}
- Role: {{role}}
- Access Level: {{accessLevel}}

To log in, please visit: https://sentia-manufacturing-dashboard-production.up.railway.app

If you have any questions or encounter any issues logging in, please contact our support team.

Best regards,
The Sentia Development Team

---
This is an automated message from the Sentia Manufacturing Dashboard development team.
`
};

async function createUser(userData) {
  try {
    console.log(`Creating user: ${userData.email}`);
    
    // Check if user already exists
    const existingUsers = await clerk.users.getUserList({
      emailAddress: [userData.email]
    });

    if (existingUsers.data && existingUsers.data.length > 0) {
      console.log(`User ${userData.email} already exists. Updating metadata...`);
      
      const user = existingUsers.data[0];
      
      // Update user metadata
      await clerk.users.updateUser(user.id, {
        publicMetadata: userData.publicMetadata,
        firstName: userData.firstName,
        lastName: userData.lastName
      });

      // Send welcome email
      await sendWelcomeEmail(user, userData);
      
      return { success: true, message: 'User updated and email sent', user };
    }

    // Create new user
    const newUser = await clerk.users.createUser({
      emailAddress: [userData.email],
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      publicMetadata: userData.publicMetadata,
      skipPasswordRequirement: true,
      skipPasswordChecks: true
    });

    console.log(`User ${userData.email} created successfully`);

    // Create password reset/invitation link
    const invitation = await clerk.invitations.createInvitation({
      emailAddress: userData.email,
      redirectUrl: 'https://sentia-manufacturing-dashboard-production.up.railway.app/dashboard',
      publicMetadata: userData.publicMetadata,
      notify: true,
      ignoreExisting: false
    });

    console.log(`Invitation sent to ${userData.email}`);

    // Send custom welcome email
    await sendWelcomeEmail(newUser, userData);

    return { success: true, message: 'User created and invitation sent', user: newUser, invitation };
  } catch (error) {
    console.error(`Error creating user ${userData.email}:`, error);
    return { success: false, message: error.message, email: userData.email };
  }
}

async function sendWelcomeEmail(user, userData) {
  try {
    // Create email content with replacements
    let emailBody = EMAIL_TEMPLATE.body
      .replace(/{{firstName}}/g, userData.firstName)
      .replace(/{{email}}/g, userData.email)
      .replace(/{{role}}/g, userData.role)
      .replace(/{{accessLevel}}/g, userData.role === 'admin' ? 'Full Administrative Access' : 'Viewer Access');

    // Note: Clerk will send the invitation email automatically
    // This is just for logging purposes
    console.log(`Welcome email queued for ${userData.email}`);
    
    return true;
  } catch (error) {
    console.error(`Error sending email to ${userData.email}:`, error);
    return false;
  }
}

async function setupAllUsers() {
  console.log('=================================');
  console.log('Sentia Manufacturing Dashboard');
  console.log('User Account Setup Script');
  console.log('=================================\n');

  if (!process.env.CLERK_SECRET_KEY) {
    console.error('ERROR: CLERK_SECRET_KEY not found in environment variables');
    console.log('Please set CLERK_SECRET_KEY in your .env file');
    process.exit(1);
  }

  console.log(`Setting up ${USERS_TO_CREATE.length} users...\n`);

  const results = [];

  for (const userData of USERS_TO_CREATE) {
    const result = await createUser(userData);
    results.push(result);
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n=================================');
  console.log('Setup Complete');
  console.log('=================================\n');

  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Successfully processed: ${successful} users`);
  console.log(`Failed: ${failed} users`);

  if (failed > 0) {
    console.log('\nFailed users:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`- ${r.email}: ${r.message}`);
    });
  }

  console.log('\n=================================');
  console.log('Next Steps:');
  console.log('=================================');
  console.log('1. Users will receive invitation emails from Clerk');
  console.log('2. They should click the invitation link to set their password');
  console.log('3. Once logged in, they can test their access level');
  console.log('4. Admins have full access, Users have viewer access only');
  console.log('\nDashboard URL: https://sentia-manufacturing-dashboard-production.up.railway.app');
}

// Run the setup
setupAllUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});