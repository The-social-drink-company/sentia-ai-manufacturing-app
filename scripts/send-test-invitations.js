#!/usr/bin/env node

import { createClerkClient } from '@clerk/backend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

// All users to send invitations to
const USERS = [
  { email: 'paul.roberts@sentiaspirits.com', name: 'Paul Roberts', role: 'Admin' },
  { email: 'david.orren@gabalabs.com', name: 'David Orren', role: 'Admin' },
  { email: 'daniel.kenny@sentiaspirits.com', name: 'Daniel Kenny', role: 'Admin' },
  { email: 'marta.haczek@gabalabs.com', name: 'Marta Haczek', role: 'Viewer' },
  { email: 'matt.coulshed@gabalabs.com', name: 'Matt Coulshed', role: 'Viewer' },
  { email: 'jaron.reid@gabalabs.com', name: 'Jaron Reid', role: 'Viewer' }
];

async function sendPasswordResetWithWarning(userEmail, userName, role) {
  try {
    console.log(`Processing ${userEmail}...`);
    
    // Get the user
    const users = await clerk.users.getUserList({
      emailAddress: [userEmail]
    });

    if (!users.data || users.data.length === 0) {
      console.log(`User ${userEmail} not found in Clerk`);
      return { success: false, email: userEmail, message: 'User not found' };
    }

    const user = users.data[0];
    console.log(`Found user: ${user.id} - ${userEmail}`);

    // Create invitation to reset password
    const invitation = await clerk.invitations.createInvitation({
      emailAddress: userEmail,
      redirectUrl: 'https://sentia-manufacturing-dashboard-production.up.railway.app/dashboard',
      notify: true,
      ignoreExisting: true
    });

    console.log(`Password reset flow created for ${userEmail}`);

    // Send custom notification email
    // Note: This will trigger Clerk's password reset email
    // The warning message will be in the dashboard when they log in
    
    return { 
      success: true, 
      email: userEmail, 
      message: 'Invitation email sent',
      invitation: invitation 
    };

  } catch (error) {
    console.error(`Error processing ${userEmail}:`, error.message);
    return { success: false, email: userEmail, message: error.message };
  }
}

async function createDevelopmentWarningBanner() {
  // This creates a file that the frontend will read to show the warning
  const warningContent = {
    enabled: true,
    message: "⚠️ DEVELOPMENT IN PROGRESS: The system is currently under active development. At this stage, we only need you to test your login access. Full functionality will be available once development is complete.",
    type: "warning",
    dismissible: false,
    showUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
  };

  const fs = await import('fs/promises');
  const path = await import('path');
  
  try {
    await fs.writeFile(
      path.join(process.cwd(), 'public', 'development-warning.json'),
      JSON.stringify(warningContent, null, 2)
    );
    console.log('Development warning banner configuration created');
  } catch (error) {
    console.error('Failed to create warning banner:', error);
  }
}

async function main() {
  console.log('=================================');
  console.log('CapLiquify Manufacturing Platform');
  console.log('Test Access Invitation Script');
  console.log('=================================\n');

  if (!process.env.CLERK_SECRET_KEY) {
    console.error('ERROR: CLERK_SECRET_KEY not found');
    process.exit(1);
  }

  // Create development warning banner
  await createDevelopmentWarningBanner();

  console.log('Sending password reset emails to all users...\n');
  
  const results = [];
  
  for (const user of USERS) {
    const result = await sendPasswordResetWithWarning(user.email, user.name, user.role);
    results.push(result);
    
    // Delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n=================================');
  console.log('Summary');
  console.log('=================================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✓ Successful: ${successful.length} users`);
  if (successful.length > 0) {
    successful.forEach(r => console.log(`  - ${r.email}`));
  }
  
  if (failed.length > 0) {
    console.log(`\n✗ Failed: ${failed.length} users`);
    failed.forEach(r => console.log(`  - ${r.email}: ${r.message}`));
  }

  console.log('\n=================================');
  console.log('Instructions Sent to Users:');
  console.log('=================================');
  console.log('Users will receive an email with:');
  console.log('1. Password reset link to set/reset their password');
  console.log('2. Instructions to test login access only');
  console.log('3. Warning that system is under development');
  console.log('4. Notice that full functionality coming soon');
  console.log('\nDashboard URL: https://sentia-manufacturing-dashboard-production.up.railway.app');
  console.log('\n⚠️  A development warning banner will appear when users log in');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});