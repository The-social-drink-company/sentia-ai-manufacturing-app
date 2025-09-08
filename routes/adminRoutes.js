import express from 'express';
import { createClerkClient } from '@clerk/backend';
import logger from '../services/logger.js';

const router = express.Router();
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Admin middleware to check both authentication and admin privileges
const adminMiddleware = async (req, res, next) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    if (!sessionToken) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    // Verify the session with Clerk
    const session = await clerk.sessions.verifySession({ 
      sessionId: sessionToken,
      token: sessionToken 
    });
    
    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Get user details to check admin status
    const user = await clerk.users.getUser(session.userId);
    const userRole = user.publicMetadata?.role;
    
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return res.status(403).json({ 
        error: 'Forbidden - Admin privileges required' 
      });
    }

    req.auth = { 
      userId: session.userId, 
      user: user,
      role: userRole 
    };
    next();
  } catch (error) {
    logger.error('Admin middleware error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

/**
 * Get All Users
 * GET /api/admin/users
 */
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const users = await clerk.users.getUserList({
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      users: users,
      total: users.length,
      hasMore: users.length === parseInt(limit)
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
    const user = await clerk.users.getUser(userId);
    
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
    
    // Update user metadata to mark as approved
    const updatedUser = await clerk.users.updateUser(userId, {
      publicMetadata: {
        ...((await clerk.users.getUser(userId)).publicMetadata || {}),
        approved: true,
        approvedBy: req.auth.userId,
        approvedAt: new Date().toISOString()
      }
    });

    logger.info(`User ${userId} approved by admin ${req.auth.userId}`);
    
    res.json({ 
      success: true,
      message: 'User approved successfully',
      user: updatedUser 
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
    
    // Update user metadata to revoke access
    const updatedUser = await clerk.users.updateUser(userId, {
      publicMetadata: {
        ...((await clerk.users.getUser(userId)).publicMetadata || {}),
        approved: false,
        revokedBy: req.auth.userId,
        revokedAt: new Date().toISOString()
      }
    });

    logger.info(`User ${userId} access revoked by admin ${req.auth.userId}`);
    
    res.json({ 
      success: true,
      message: 'User access revoked successfully',
      user: updatedUser 
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

    // Prevent non-super-admins from creating admins
    if (role === 'admin' && req.auth.role !== 'super_admin') {
      return res.status(403).json({ 
        error: 'Only super admins can assign admin roles' 
      });
    }

    const updatedUser = await clerk.users.updateUser(userId, {
      publicMetadata: {
        ...((await clerk.users.getUser(userId)).publicMetadata || {}),
        role: role,
        roleUpdatedBy: req.auth.userId,
        roleUpdatedAt: new Date().toISOString()
      }
    });

    logger.info(`User ${userId} role updated to ${role} by admin ${req.auth.userId}`);
    
    res.json({ 
      success: true,
      message: `User role updated to ${role}`,
      user: updatedUser 
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
    
    // Prevent deletion of other admins by non-super-admins
    const targetUser = await clerk.users.getUser(userId);
    if (targetUser.publicMetadata?.role === 'admin' && req.auth.role !== 'super_admin') {
      return res.status(403).json({ 
        error: 'Only super admins can delete admin users' 
      });
    }

    // Prevent self-deletion
    if (userId === req.auth.userId) {
      return res.status(403).json({ 
        error: 'Cannot delete your own account' 
      });
    }

    await clerk.users.deleteUser(userId);
    logger.info(`User ${userId} deleted by admin ${req.auth.userId}`);
    
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

    // Create invitation through Clerk
    const invitation = await clerk.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: {
        role: role,
        invitedBy: req.auth.userId,
        invitedAt: new Date().toISOString()
      }
    });

    logger.info(`Invitation sent to ${email} with role ${role} by admin ${req.auth.userId}`);
    
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
    const invitations = await clerk.invitations.getInvitationList();
    
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
    
    await clerk.invitations.revokeInvitation(invitationId);
    logger.info(`Invitation ${invitationId} revoked by admin ${req.auth.userId}`);
    
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
    // Get user counts by role
    const allUsers = await clerk.users.getUserList({ limit: 1000 });
    const pendingInvitations = await clerk.invitations.getInvitationList();
    
    const stats = {
      totalUsers: allUsers.length,
      usersByRole: {},
      pendingInvitations: pendingInvitations.length,
      activeUsers: allUsers.filter(u => u.lastSignInAt && 
        new Date(u.lastSignInAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length
    };

    // Count users by role
    allUsers.forEach(user => {
      const role = user.publicMetadata?.role || 'user';
      stats.usersByRole[role] = (stats.usersByRole[role] || 0) + 1;
    });
    
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