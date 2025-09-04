import bcrypt from 'bcrypt';
import { logInfo, logWarn, logError } from '../logger.js';

/**
 * Password Service for enhanced password policies and validation
 */
class PasswordService {
  constructor(pool) {
    this.pool = pool;
    this.SALT_ROUNDS = 14; // High entropy for security
    
    // Password policy configuration
    this.policy = {
      minLength: 12,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventReuse: 5,
      maxAge: 90, // days
      minComplexityScore: 8,
      commonPasswordBlacklist: [
        'password123', 'admin123', 'qwerty123', 'welcome123',
        '123456789', 'password1', 'letmein123', 'admin1234'
      ]
    };
  }

  /**
   * Validate password against policy requirements
   * @param {string} password - Password to validate
   * @param {Object} userInfo - User information for context-aware validation
   * @returns {Object} Validation result with score and issues
   */
  validatePassword(password, userInfo = {}) {
    const result = {
      isValid: true,
      score: 0,
      issues: [],
      recommendations: []
    };

    if (!password || typeof password !== 'string') {
      result.isValid = false;
      result.issues.push('Password is required');
      return result;
    }

    // Length validation
    if (password.length < this.policy.minLength) {
      result.isValid = false;
      result.issues.push(`Password must be at least ${this.policy.minLength} characters long`);
    } else if (password.length >= this.policy.minLength) {
      result.score += Math.min(password.length / 4, 6); // Max 6 points for length
    }

    if (password.length > this.policy.maxLength) {
      result.isValid = false;
      result.issues.push(`Password must not exceed ${this.policy.maxLength} characters`);
    }

    // Character type requirements
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password);

    if (this.policy.requireUppercase && !hasUppercase) {
      result.isValid = false;
      result.issues.push('Password must contain at least one uppercase letter');
    } else if (hasUppercase) {
      result.score += 1;
    }

    if (this.policy.requireLowercase && !hasLowercase) {
      result.isValid = false;
      result.issues.push('Password must contain at least one lowercase letter');
    } else if (hasLowercase) {
      result.score += 1;
    }

    if (this.policy.requireNumbers && !hasNumbers) {
      result.isValid = false;
      result.issues.push('Password must contain at least one number');
    } else if (hasNumbers) {
      result.score += 1;
    }

    if (this.policy.requireSpecialChars && !hasSpecialChars) {
      result.isValid = false;
      result.issues.push('Password must contain at least one special character');
    } else if (hasSpecialChars) {
      result.score += 2;
    }

    // Complexity scoring
    const uniqueChars = new Set(password).size;
    result.score += Math.min(uniqueChars / 4, 3); // Max 3 points for character diversity

    // Pattern detection (repetitive, sequential)
    if (/(.)\1{2,}/.test(password)) {
      result.score -= 2;
      result.recommendations.push('Avoid repeating characters');
    }

    if (/(012|123|234|345|456|567|678|789|890|abc|bcd|cde)/.test(password.toLowerCase())) {
      result.score -= 2;
      result.recommendations.push('Avoid sequential characters');
    }

    // Common password check
    const lowercasePassword = password.toLowerCase();
    if (this.policy.commonPasswordBlacklist.some(common => 
        lowercasePassword.includes(common.toLowerCase()))) {
      result.isValid = false;
      result.issues.push('Password contains common patterns that are easily guessable');
    }

    // Context-aware validation (if user info provided)
    if (userInfo.email) {
      const emailLocal = userInfo.email.split('@')[0].toLowerCase();
      if (lowercasePassword.includes(emailLocal) && emailLocal.length > 3) {
        result.score -= 3;
        result.recommendations.push('Avoid using parts of your email address');
      }
    }

    if (userInfo.name) {
      const nameParts = userInfo.name.toLowerCase().split(' ');
      for (const part of nameParts) {
        if (part.length > 2 && lowercasePassword.includes(part)) {
          result.score -= 2;
          result.recommendations.push('Avoid using parts of your name');
          break;
        }
      }
    }

    // Final score validation
    result.score = Math.max(0, Math.min(20, result.score)); // Clamp between 0-20
    
    if (result.score < this.policy.minComplexityScore) {
      result.isValid = false;
      result.issues.push(`Password complexity score (${result.score}) is below required minimum (${this.policy.minComplexityScore})`);
    }

    return result;
  }

  /**
   * Hash password with bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, this.SALT_ROUNDS);
    } catch (error) {
      logError('Password hashing failed', error);
      throw new Error('Password processing failed');
    }
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Stored password hash
   * @returns {Promise<boolean>} Verification result
   */
  async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logError('Password verification failed', error);
      return false;
    }
  }

  /**
   * Check if password has been used recently (prevent reuse)
   * @param {string} userId - User ID
   * @param {string} newPassword - New password to check
   * @returns {Promise<boolean>} True if password was used recently
   */
  async isPasswordReused(userId, newPassword) {
    try {
      const query = `
        SELECT password_hash 
        FROM password_history 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `;
      
      const result = await this.pool.query(query, [userId, this.policy.preventReuse]);
      
      for (const row of result.rows) {
        if (await this.verifyPassword(newPassword, row.password_hash)) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      logError('Password reuse check failed', error);
      return false;
    }
  }

  /**
   * Store password in history for reuse prevention
   * @param {string} userId - User ID
   * @param {string} passwordHash - Hashed password
   */
  async storePasswordHistory(userId, passwordHash) {
    try {
      // Insert new password
      await this.pool.query(
        'INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)',
        [userId, passwordHash]
      );

      // Clean up old password history beyond the prevention limit
      await this.pool.query(`
        DELETE FROM password_history 
        WHERE user_id = $1 
        AND id NOT IN (
          SELECT id 
          FROM password_history 
          WHERE user_id = $1 
          ORDER BY created_at DESC 
          LIMIT $2
        )
      `, [userId, this.policy.preventReuse + 5]); // Keep a few extra for safety
      
    } catch (error) {
      logError('Failed to store password history', error);
    }
  }

  /**
   * Check if password needs to be changed based on age policy
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Password age status
   */
  async checkPasswordAge(userId) {
    try {
      const query = `
        SELECT password_changed_at, locked_until, failed_login_count
        FROM users 
        WHERE clerk_user_id = $1
      `;
      
      const result = await this.pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return { needsChange: false, daysSinceChange: null, isExpired: false };
      }

      const { password_changed_at } = result.rows[0];
      
      if (!password_changed_at) {
        return { needsChange: true, daysSinceChange: null, isExpired: true };
      }

      const daysSinceChange = Math.floor(
        (new Date() - new Date(password_changed_at)) / (1000 * 60 * 60 * 24)
      );

      const needsChange = daysSinceChange >= this.policy.maxAge;
      const isExpired = daysSinceChange > this.policy.maxAge + 7; // Grace period

      return {
        needsChange,
        daysSinceChange,
        isExpired,
        daysUntilExpiry: this.policy.maxAge - daysSinceChange
      };
    } catch (error) {
      logError('Password age check failed', error);
      return { needsChange: false, daysSinceChange: null, isExpired: false };
    }
  }

  /**
   * Generate password reset token
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @returns {Promise<string>} Reset token
   */
  async generatePasswordResetToken(userId, email) {
    try {
      const token = this.generateSecureToken(32);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      // Revoke any existing tokens
      await this.pool.query(
        'UPDATE password_reset_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
        [userId]
      );

      // Create new token
      await this.pool.query(
        `INSERT INTO password_reset_tokens (user_id, email, token_hash, expires_at) 
         VALUES ($1, $2, $3, $4)`,
        [userId, email, await this.hashPassword(token), expiresAt]
      );

      logInfo('Password reset token generated', { userId, email });
      return token;
    } catch (error) {
      logError('Password reset token generation failed', error);
      throw new Error('Failed to generate reset token');
    }
  }

  /**
   * Verify password reset token
   * @param {string} token - Reset token
   * @param {string} email - User email
   * @returns {Promise<Object>} Verification result
   */
  async verifyPasswordResetToken(token, email) {
    try {
      const query = `
        SELECT prt.id, prt.user_id, prt.token_hash, prt.expires_at
        FROM password_reset_tokens prt
        WHERE prt.email = $1 
        AND prt.expires_at > NOW() 
        AND prt.revoked_at IS NULL
        ORDER BY prt.created_at DESC
        LIMIT 1
      `;
      
      const result = await this.pool.query(query, [email]);
      
      if (result.rows.length === 0) {
        return { isValid: false, userId: null, reason: 'Token not found or expired' };
      }

      const { id, user_id, token_hash, expires_at } = result.rows[0];
      
      const isValidToken = await this.verifyPassword(token, token_hash);
      
      if (!isValidToken) {
        return { isValid: false, userId: user_id, reason: 'Invalid token' };
      }

      if (new Date() > new Date(expires_at)) {
        return { isValid: false, userId: user_id, reason: 'Token expired' };
      }

      // Mark token as used
      await this.pool.query(
        'UPDATE password_reset_tokens SET revoked_at = NOW() WHERE id = $1',
        [id]
      );

      return { isValid: true, userId: user_id, tokenId: id };
    } catch (error) {
      logError('Password reset token verification failed', error);
      return { isValid: false, userId: null, reason: 'Verification failed' };
    }
  }

  /**
   * Generate secure random token
   * @param {number} length - Token length in bytes
   * @returns {string} Secure random token
   */
  generateSecureToken(length = 32) {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Get password policy for client-side validation
   * @returns {Object} Password policy
   */
  getPasswordPolicy() {
    return {
      minLength: this.policy.minLength,
      maxLength: this.policy.maxLength,
      requireUppercase: this.policy.requireUppercase,
      requireLowercase: this.policy.requireLowercase,
      requireNumbers: this.policy.requireNumbers,
      requireSpecialChars: this.policy.requireSpecialChars,
      preventReuse: this.policy.preventReuse,
      maxAge: this.policy.maxAge,
      minComplexityScore: this.policy.minComplexityScore
    };
  }
}

export default PasswordService;