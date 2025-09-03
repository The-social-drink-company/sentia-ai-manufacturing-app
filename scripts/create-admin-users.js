import { createClerkClient } from '@clerk/backend';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error('ERROR: CLERK_SECRET_KEY not found in environment variables');
  console.error('Please set CLERK_SECRET_KEY in your .env file');
  process.exit(1);
}

// Initialize Clerk client
const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });

// Function to generate a secure password
function generateSecurePassword() {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each required type
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Admin users to create
const adminUsers = [
  {
    firstName: 'Paul',
    lastName: 'Roberts',
    emailAddress: 'paul.roberts@sentiaspirits.com',
    organization: 'Sentia Spirits'
  },
  {
    firstName: 'David',
    lastName: 'Orren', 
    emailAddress: 'David.Orren@gabalabs.com',
    organization: 'Gaba Labs'
  }
];

async function createAdminUser(userData) {
  const password = generateSecurePassword();
  
  try {
    console.log(`Creating user: ${userData.emailAddress}...`);
    
    // Check if user already exists
    try {
      const existingUsers = await clerkClient.users.getUserList({
        emailAddress: [userData.emailAddress]
      });
      
      if (existingUsers.length > 0) {
        console.log(`⚠️  User ${userData.emailAddress} already exists`);
        const existingUser = existingUsers[0];
        
        // Update existing user to admin role if not already
        if (existingUser.publicMetadata?.role !== 'admin') {
          console.log(`   Updating ${userData.emailAddress} to admin role...`);
          await clerkClient.users.updateUserMetadata(existingUser.id, {
            publicMetadata: {
              role: 'admin',
              approved: true,
              organization: userData.organization,
              permissions: [
                'view_admin_portal',
                'manage_users', 
                'manage_system_settings',
                'manage_feature_flags',
                'view_system_health',
                'manage_integrations',
                'view_logs',
                'manage_maintenance',
                'dashboard.view',
                'dashboard.edit',
                'dashboard.export',
                'forecast.view',
                'forecast.run', 
                'forecast.configure',
                'stock.view',
                'stock.optimize',
                'stock.approve',
                'workingcapital.view',
                'workingcapital.analyze',
                'workingcapital.configure',
                'capacity.view',
                'capacity.configure',
                'import.view',
                'import.upload',
                'import.configure',
                'users.manage',
                'system.configure',
                'reports.generate',
                'alerts.configure'
              ],
              createdBy: 'system',
              createdAt: new Date().toISOString()
            }
          });
          console.log(`✅ Updated ${userData.emailAddress} to admin role`);
        } else {
          console.log(`✅ User ${userData.emailAddress} is already an admin`);
        }
        
        return {
          success: true,
          user: existingUser,
          password: 'EXISTING_USER',
          message: 'User already exists and updated to admin role'
        };
      }
    } catch (error) {
      // User doesn't exist, continue with creation
    }
    
    // Create new user
    const user = await clerkClient.users.createUser({
      firstName: userData.firstName,
      lastName: userData.lastName,
      emailAddress: [userData.emailAddress],
      password: password,
      publicMetadata: {
        role: 'admin',
        approved: true,
        organization: userData.organization,
        permissions: [
          'view_admin_portal',
          'manage_users',
          'manage_system_settings', 
          'manage_feature_flags',
          'view_system_health',
          'manage_integrations',
          'view_logs',
          'manage_maintenance',
          'dashboard.view',
          'dashboard.edit',
          'dashboard.export',
          'forecast.view',
          'forecast.run',
          'forecast.configure',
          'stock.view',
          'stock.optimize',
          'stock.approve',
          'workingcapital.view',
          'workingcapital.analyze',
          'workingcapital.configure',
          'capacity.view',
          'capacity.configure',
          'import.view',
          'import.upload',
          'import.configure',
          'users.manage',
          'system.configure',
          'reports.generate',
          'alerts.configure'
        ],
        createdBy: 'system',
        createdAt: new Date().toISOString()
      },
      privateMetadata: {
        accountType: 'admin',
        createdBy: 'claude-code-assistant'
      }
    });

    console.log(`✅ Successfully created admin user: ${userData.emailAddress}`);
    
    return {
      success: true,
      user: user,
      password: password,
      message: 'User created successfully'
    };

  } catch (error) {
    console.error(`❌ Failed to create user ${userData.emailAddress}:`, error.message);
    return {
      success: false,
      error: error.message,
      userData: userData
    };
  }
}

async function main() {
  console.log('🚀 Starting admin user creation process...\n');
  console.log('================================================');
  
  const results = [];
  
  for (const userData of adminUsers) {
    const result = await createAdminUser(userData);
    results.push(result);
    console.log(''); // Add spacing between users
  }
  
  console.log('================================================');
  console.log('📋 ADMIN USER CREATION SUMMARY');
  console.log('================================================\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    console.log('✅ SUCCESSFULLY CREATED/UPDATED USERS:');
    console.log('=====================================');
    successful.forEach(result => {
      if (result.password !== 'EXISTING_USER') {
        console.log(`👤 Name: ${result.user.firstName} ${result.user.lastName}`);
        console.log(`📧 Email: ${result.user.emailAddresses[0].emailAddress}`);
        console.log(`🔑 Password: ${result.password}`);
        console.log(`🎭 Role: admin`);
        console.log(`📝 Status: ${result.message}`);
        console.log(`🆔 User ID: ${result.user.id}`);
        console.log('---');
      } else {
        console.log(`👤 Email: ${result.user.emailAddresses[0].emailAddress}`);
        console.log(`📝 Status: ${result.message}`);
        console.log('---');
      }
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ FAILED TO CREATE USERS:');
    console.log('==========================');
    failed.forEach(result => {
      console.log(`👤 Email: ${result.userData.emailAddress}`);
      console.log(`❌ Error: ${result.error}`);
      console.log('---');
    });
  }
  
  console.log('\n📚 IMPORTANT NOTES:');
  console.log('==================');
  console.log('• Save the generated passwords in a secure password manager');
  console.log('• Users can change their passwords after first login');
  console.log('• Admin users have full access to the manufacturing dashboard');
  console.log('• Admin users can manage other users and system settings');
  console.log('• These credentials are for initial access only');
  
  if (successful.some(r => r.password !== 'EXISTING_USER')) {
    console.log('\n🔒 SECURITY REMINDER:');
    console.log('===================');
    console.log('• Please share these credentials securely (encrypted email/secure chat)');
    console.log('• Instruct users to change passwords on first login');
    console.log('• Consider enabling 2FA for admin accounts');
  }
  
  console.log(`\n🎉 Process completed: ${successful.length} successful, ${failed.length} failed`);
}

// Run the script
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});