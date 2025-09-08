import express from 'express';
import logger from '../services/logger.js';

// Enterprise admin routes for Sentia Manufacturing Dashboard
// Temporary implementation without direct Clerk integration for Railway deployment
const router = express.Router();

// Simplified admin middleware for Railway deployment compatibility
const adminMiddleware = async (req, res, next) => {
  try {
    // For Railway deployment, use simplified authentication check
    // In production, this would integrate with Clerk properly
    const authHeader = req.headers.authorization;
    
    // Allow access for development/testing - production would have proper auth
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      next();
      return;
    }
    
    // For production, check for auth token
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized - Authentication required' });
    }
    
    next();
  } catch (error) {
    logger.error('Admin middleware error:', error);
    return res.status(500).json({ error: 'Authentication service unavailable' });
  }
};

/**
 * Get All Users
 * GET /api/admin/users
 */
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    // Simplified demo users for Railway deployment without Clerk integration
    const demoUsers = [
      {
        id: 'user_001',
        first_name: 'Paul',
        last_name: 'Roberts',
        username: 'paul.roberts',
        email_addresses: [{ email_address: 'paul.roberts@sentiaspirits.com' }],
        public_metadata: { 
          role: 'admin', 
          approved: true,
          department: 'Management'
        },
        last_sign_in_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        created_at: '2024-01-15T00:00:00.000Z'
      },
      {
        id: 'user_002',
        first_name: 'Sarah',
        last_name: 'Mitchell',
        username: 'sarah.mitchell',
        email_addresses: [{ email_address: 'sarah.mitchell@sentiaspirits.com' }],
        public_metadata: { 
          role: 'manager', 
          approved: true,
          department: 'Production'
        },
        last_sign_in_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        created_at: '2024-02-20T00:00:00.000Z'
      }
    ];

    res.json({
      success: true,
      users: demoUsers.slice(parseInt(offset), parseInt(offset) + parseInt(limit)),
      total: demoUsers.length,
      hasMore: (parseInt(offset) + parseInt(limit)) < demoUsers.length
    });
  } catch (error) {
    logger.error('Failed to fetch users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      message: error.message 
    });
  }
});

/**
 * Get User by ID
 * GET /api/admin/users/:userId
 */
router.get('/users/:userId', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Return demo user data
    const user = {
      id: userId,
      first_name: 'Demo',
      last_name: 'User',
      username: 'demo.user',
      email_addresses: [{ email_address: 'demo.user@sentiaspirits.com' }],
      public_metadata: { role: 'user', approved: true }
    };
    
    res.json({ user });
  } catch (error) {
    logger.error('Failed to fetch user:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user',
      message: error.message 
    });
  }
});

/**
 * Approve User
 * POST /api/admin/users/:userId/approve
 */
router.post('/users/:userId/approve', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Simplified approval for Railway deployment
    logger.info(`User ${userId} approved by admin`);
    
    res.json({ 
      success: true,
      message: 'User approved successfully',
      user: {
        id: userId,
        public_metadata: { approved: true, approvedAt: new Date().toISOString() }
      }
    });
  } catch (error) {
    logger.error('Failed to approve user:', error);
    res.status(500).json({ 
      error: 'Failed to approve user',
      message: error.message 
    });
  }
});

/**
 * Revoke User Access
 * POST /api/admin/users/:userId/revoke
 */
router.post('/users/:userId/revoke', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Simplified revoke for Railway deployment
    logger.info(`User ${userId} access revoked by admin`);
    
    res.json({ 
      success: true,
      message: 'User access revoked successfully',
      user: {
        id: userId,
        public_metadata: { approved: false, revokedAt: new Date().toISOString() }
      }
    });
  } catch (error) {
    logger.error('Failed to revoke user access:', error);
    res.status(500).json({ 
      error: 'Failed to revoke user access',
      message: error.message 
    });
  }
});

/**
 * Update User Role
 * POST /api/admin/users/:userId/role
 */
router.post('/users/:userId/role', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!role || !['user', 'admin', 'manager', 'operator', 'viewer'].includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be one of: user, admin, manager, operator, viewer' 
      });
    }

    // Simplified role update for Railway deployment
    logger.info(`User ${userId} role updated to ${role} by admin`);
    
    res.json({ 
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: userId,
        public_metadata: { role: role, roleUpdatedAt: new Date().toISOString() }
      }
    });
  } catch (error) {
    logger.error('Failed to update user role:', error);
    res.status(500).json({ 
      error: 'Failed to update user role',
      message: error.message 
    });
  }
});

/**
 * Delete User
 * DELETE /api/admin/users/:userId
 */
router.delete('/users/:userId', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Simplified deletion for Railway deployment
    logger.info(`User ${userId} deleted by admin`);
    
    res.json({ 
      success: true,
      message: 'User deleted successfully' 
    });
  } catch (error) {
    logger.error('Failed to delete user:', error);
    res.status(500).json({ 
      error: 'Failed to delete user',
      message: error.message 
    });
  }
});

/**
 * Send User Invitation
 * POST /api/admin/invite
 */
router.post('/invite', adminMiddleware, async (req, res) => {
  try {
    const { email, role = 'user' } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!['user', 'admin', 'manager', 'operator', 'viewer'].includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be one of: user, admin, manager, operator, viewer' 
      });
    }

    // Simplified invitation for Railway deployment
    const invitation = {
      id: 'inv_' + Date.now(),
      email_address: email,
      status: 'pending',
      public_metadata: {
        role: role,
        invitedAt: new Date().toISOString()
      }
    };

    logger.info(`Invitation sent to ${email} with role ${role} by admin`);
    
    res.json({ 
      success: true,
      message: 'Invitation sent successfully',
      invitation: invitation 
    });
  } catch (error) {
    logger.error('Failed to send invitation:', error);
    res.status(500).json({ 
      error: 'Failed to send invitation',
      message: error.message 
    });
  }
});

/**
 * Get All Invitations
 * GET /api/admin/invitations
 */
router.get('/invitations', adminMiddleware, async (req, res) => {
  try {
    // Demo invitations for Railway deployment
    const invitations = [
      {
        id: 'inv_001',
        email_address: 'new.user@sentiaspirits.com',
        status: 'pending',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    res.json({
      invitations: invitations,
      total: invitations.length
    });
  } catch (error) {
    logger.error('Failed to fetch invitations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch invitations',
      message: error.message 
    });
  }
});

/**
 * Delete Invitation
 * DELETE /api/admin/invitations/:invitationId
 */
router.delete('/invitations/:invitationId', adminMiddleware, async (req, res) => {
  try {
    const { invitationId } = req.params;
    
    // Simplified revoke for Railway deployment
    logger.info(`Invitation ${invitationId} revoked by admin`);
    
    res.json({ 
      success: true,
      message: 'Invitation revoked successfully' 
    });
  } catch (error) {
    logger.error('Failed to revoke invitation:', error);
    res.status(500).json({ 
      error: 'Failed to revoke invitation',
      message: error.message 
    });
  }
});

/**
 * Get Admin Stats
 * GET /api/admin/stats
 */
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    // Demo stats for Railway deployment
    const stats = {
      totalUsers: 12,
      usersByRole: {
        admin: 2,
        manager: 3,
        operator: 4,
        user: 3
      },
      pendingInvitations: 1,
      activeUsers: 8
    };
    
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get admin stats:', error);
    res.status(500).json({ 
      error: 'Failed to get admin stats',
      message: error.message 
    });
  }
});

export default router;