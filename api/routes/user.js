import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { rateLimiters } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get user dashboard layout
router.get('/dashboard-layout',
  authenticate,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const { userId } = req.auth;

    try {
      // Find existing layout for user
      const userPreferences = await prisma.userPreferences.findUnique({
        where: { userId },
        select: {
          dashboardLayout: true,
          dashboardWidgets: true
        }
      });

      if (userPreferences) {
        res.json({
          success: true,
          layouts: userPreferences.dashboardLayout,
          widgets: userPreferences.dashboardWidgets
        });
      } else {
        res.json({
          success: true,
          layouts: null,
          widgets: null
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard layout:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard layout'
      });
    }
  })
);

// Save user dashboard layout
router.post('/dashboard-layout',
  authenticate,
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    const { userId } = req.auth;
    const { layouts, widgets } = req.body;

    try {
      // Upsert user preferences
      const userPreferences = await prisma.userPreferences.upsert({
        where: { userId },
        update: {
          dashboardLayout: layouts,
          dashboardWidgets: widgets,
          updatedAt: new Date()
        },
        create: {
          userId,
          dashboardLayout: layouts,
          dashboardWidgets: widgets
        }
      });

      res.json({
        success: true,
        message: 'Dashboard layout saved successfully',
        preferences: userPreferences
      });
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save dashboard layout'
      });
    }
  })
);

// Get user preferences
router.get('/preferences',
  authenticate,
  rateLimiters.read,
  asyncHandler(async (req, res) => {
    const { userId } = req.auth;

    try {
      const preferences = await prisma.userPreferences.findUnique({
        where: { userId }
      });

      res.json({
        success: true,
        preferences: preferences || {
          theme: 'light',
          notifications: true,
          dashboardLayout: null,
          dashboardWidgets: null
        }
      });
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch preferences'
      });
    }
  })
);

// Update user preferences
router.put('/preferences',
  authenticate,
  rateLimiters.write,
  asyncHandler(async (req, res) => {
    const { userId } = req.auth;
    const { theme, notifications, language, timezone } = req.body;

    try {
      const preferences = await prisma.userPreferences.upsert({
        where: { userId },
        update: {
          theme,
          notifications,
          language,
          timezone,
          updatedAt: new Date()
        },
        create: {
          userId,
          theme: theme || 'light',
          notifications: notifications !== undefined ? notifications : true,
          language: language || 'en',
          timezone: timezone || 'UTC'
        }
      });

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        preferences
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update preferences'
      });
    }
  })
);

export default router;