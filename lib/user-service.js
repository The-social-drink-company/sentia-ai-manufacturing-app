import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword } from './password-utils.js';

const prisma = new PrismaClient();

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} - User object or null
 */
export async function findUserByEmail(email) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase()
      },
      select: {
        id: true,
        username: true,
        email: true,
        password_hash: true,
        first_name: true,
        last_name: true,
        display_name: true,
        role: true,
        permissions: true,
        isActive: true,
        is_admin: true,
        department: true,
        last_login: true,
        failed_login_attempts: true,
        account_locked_until: true,
        approved: true
      }
    });
    return user;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object|null>} - Created user or null
 */
export async function createUser(userData) {
  try {
    const hashedPassword = await hashPassword(userData.password);
    
    const user = await prisma.user.create({
      data: {
        username: userData.username || userData.email,
        email: userData.email.toLowerCase(),
        password_hash: hashedPassword,
        first_name: userData.firstName,
        last_name: userData.lastName,
        display_name: userData.displayName || `${userData.firstName} ${userData.lastName}`,
        role: userData.role || 'user',
        permissions: userData.permissions || { read: true },
        isActive: true,
        is_admin: userData.role === 'admin',
        department: userData.department,
        approved: userData.approved !== false, // Default to true unless explicitly false
        force_password_change: userData.force_password_change || false,
        two_factor_enabled: false
      },
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
        is_admin: true
      }
    });
    
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

/**
 * Verify user credentials
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<Object|null>} - User object if valid, null if invalid
 */
export async function verifyUserCredentials(email, password) {
  try {
    const user = await findUserByEmail(email);
    
    if (!user) {
      return null;
    }

    // Check if account is locked
    if (user.account_locked_until && new Date() < user.account_locked_until) {
      return null;
    }

    // Check if user is active and approved
    if (!user.isActive || !user.approved) {
      return null;
    }

    // For users without password_hash (legacy), allow any password temporarily
    if (!user.password_hash) {
      console.warn(`User ${email} has no password hash - allowing login for migration`);
      return {
        id: user.id,
        email: user.email,
        name: user.display_name || `${user.first_name} ${user.last_name}`,
        role: user.role,
        permissions: user.permissions || { read: true },
        isActive: user.isActive,
        needsPasswordReset: true
      };
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    
    if (!isValidPassword) {
      // Increment failed login attempts
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failed_login_attempts: (user.failed_login_attempts || 0) + 1,
          last_failed_login: new Date()
        }
      });
      return null;
    }

    // Reset failed login attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failed_login_attempts: 0,
        last_login: new Date(),
        login_count: { increment: 1 }
      }
    });

    return {
      id: user.id,
      email: user.email,
      name: user.display_name || `${user.first_name} ${user.last_name}`,
      role: user.role,
      permissions: user.permissions || { read: true },
      isActive: user.isActive
    };
  } catch (error) {
    console.error('Error verifying user credentials:', error);
    return null;
  }
}

/**
 * Update user password
 * @param {string} userId - User ID
 * @param {string} newPassword - New plain text password
 * @returns {Promise<boolean>} - Success status
 */
export async function updateUserPassword(userId, newPassword) {
  try {
    const hashedPassword = await hashPassword(newPassword);
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: hashedPassword,
        password_changed_at: new Date(),
        force_password_change: false
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error updating user password:', error);
    return false;
  }
}

/**
 * Initialize default users with hashed passwords
 */
export async function initializeDefaultUsers() {
  const defaultUsers = [
    {
      email: "admin@sentia.com",
      password: "admin123",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      permissions: { read: true, write: true, admin: true, delete: true, manage_users: true }
    },
    {
      email: "test@sentia.com", 
      password: "test123",
      firstName: "Test",
      lastName: "User",
      role: "user",
      permissions: { read: true }
    },
    {
      email: "daniel.kenny@sentiaspirits.com",
      password: "kenny123",
      firstName: "Daniel",
      lastName: "Kenny",
      role: "master_admin",
      permissions: { read: true, write: true, admin: true, delete: true, manage_users: true, system_config: true, master_access: true }
    },
    {
      email: "paul.roberts@sentiaspirits.com",
      password: "roberts123",
      firstName: "Paul", 
      lastName: "Roberts",
      role: "admin",
      permissions: { read: true, write: true, admin: true, delete: true, manage_users: true }
    },
    {
      email: "david.orren@gabalabs.com",
      password: "orren123", 
      firstName: "David",
      lastName: "Orren",
      role: "admin",
      permissions: { read: true, write: true, admin: true, delete: true, manage_users: true }
    },
    // Gaba Labs Team - Standard Users
    {
      email: "marta.haczek@gabalabs.com",
      password: "haczek123",
      firstName: "Marta",
      lastName: "Haczek",
      role: "user",
      permissions: { read: true, write: true }
    },
    {
      email: "matt.coulshed@gabalabs.com",
      password: "coulshed123",
      firstName: "Matt",
      lastName: "Coulshed", 
      role: "user",
      permissions: { read: true, write: true }
    },
    {
      email: "jaron.reid@gabalabs.com",
      password: "reid123",
      firstName: "Jaron",
      lastName: "Reid",
      role: "user", 
      permissions: { read: true, write: true }
    },
    // FinanceFlo Team - Master Admin
    {
      email: "adam@financeflo.ai",
      password: "pavitt123",
      firstName: "Adam",
      lastName: "Pavitt",
      role: "master_admin",
      permissions: { read: true, write: true, admin: true, delete: true, manage_users: true, system_config: true, master_access: true }
    },
    {
      email: "dudley@financeflo.ai",
      password: "dudley123",
      firstName: "Dudley",
      lastName: "Peacock",
      role: "master_admin",
      permissions: { read: true, write: true, admin: true, delete: true, manage_users: true, system_config: true, master_access: true }
    }
  ];

  for (const userData of defaultUsers) {
    const existingUser = await findUserByEmail(userData.email);
    if (!existingUser) {
      console.log(`Creating default user: ${userData.email}`);
      await createUser(userData);
    } else if (!existingUser.password_hash) {
      console.log(`Adding password to existing user: ${userData.email}`);
      await updateUserPassword(existingUser.id, userData.password);
    }
  }
}

export { prisma };
