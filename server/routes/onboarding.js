/**
 * Onboarding Routes
 *
 * Handles onboarding flow progress tracking and data persistence
 * for trial users setting up their CapLiquify workspace.
 *
 * @module server/routes/onboarding
 */

import express from 'express'
import { logInfo, logError, logWarn } from '../../services/observability/structuredLogger.js'
// import authMiddleware from '../middleware/authMiddleware.js'

const router = express.Router()

/**
 * GET /api/onboarding/progress
 * Get current onboarding progress for the tenant
 */
router.get('/progress', async (req, res) => {
  try {
    const { prisma } = req.app.locals

    // TODO: Get tenantId from authenticated user session
    // For now, use a test tenant or create one
    const tenantId = req.query.tenantId || 'test-tenant'

    logInfo('Fetching onboarding progress', { tenantId })

    let progress = await prisma.onboardingProgress.findUnique({
      where: { tenantId },
    })

    // Create default progress if doesn't exist
    if (!progress) {
      progress = await prisma.onboardingProgress.create({
        data: {
          tenantId,
          currentStep: 0,
          completedSteps: [],
        },
      })
      logInfo('Created new onboarding progress', { tenantId })
    }

    res.json({
      success: true,
      currentStep: progress.currentStep,
      completedSteps: progress.completedSteps,
      data: {
        company: progress.companyData,
        integrations: progress.integrationsData,
        team: progress.teamData,
        import: progress.importData,
      },
      isComplete: progress.isComplete,
      completedAt: progress.completedAt,
    })
  } catch (error) {
    logError('Failed to fetch onboarding progress', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch onboarding progress',
    })
  }
})

/**
 * POST /api/onboarding/progress
 * Save progress for current onboarding step
 */
router.post('/progress', async (req, res) => {
  try {
    const { prisma } = req.app.locals
    const { currentStep, completedSteps, data } = req.body

    // TODO: Get tenantId from authenticated user session
    const tenantId = req.query.tenantId || 'test-tenant'

    logInfo('Saving onboarding progress', { tenantId, currentStep, completedSteps })

    const progress = await prisma.onboardingProgress.upsert({
      where: { tenantId },
      update: {
        currentStep,
        completedSteps,
        companyData: data.company,
        integrationsData: data.integrations,
        teamData: data.team,
        importData: data.import,
      },
      create: {
        tenantId,
        currentStep,
        completedSteps,
        companyData: data.company,
        integrationsData: data.integrations,
        teamData: data.team,
        importData: data.import,
      },
    })

    res.json({
      success: true,
      progress: {
        currentStep: progress.currentStep,
        completedSteps: progress.completedSteps,
      },
    })
  } catch (error) {
    logError('Failed to save onboarding progress', error)
    res.status(500).json({
      success: false,
      error: 'Failed to save onboarding progress',
    })
  }
})

/**
 * POST /api/onboarding/complete
 * Mark onboarding as complete and process final setup
 */
router.post('/complete', async (req, res) => {
  try {
    const { prisma } = req.app.locals
    const onboardingData = req.body

    // TODO: Get tenantId from authenticated user session
    const tenantId = req.query.tenantId || 'test-tenant'

    logInfo('Completing onboarding', { tenantId })

    // Mark onboarding as complete
    await prisma.onboardingProgress.update({
      where: { tenantId },
      data: {
        isComplete: true,
        completedAt: new Date(),
        companyData: onboardingData.company,
        integrationsData: onboardingData.integrations,
        teamData: onboardingData.team,
        importData: onboardingData.import,
      },
    })

    // Process company data
    if (onboardingData.company) {
      await prisma.organization.update({
        where: { id: tenantId },
        data: {
          industry: onboardingData.company.industry,
          size: onboardingData.company.companySize,
          settings: {
            currency: onboardingData.company.currency,
            annualRevenue: onboardingData.company.annualRevenue,
          },
        },
      })
    }

    // Process team invitations
    if (onboardingData.team && onboardingData.team.length > 0) {
      // TODO: Send team invitations via Clerk
      logInfo('Team invitations to process', {
        tenantId,
        count: onboardingData.team.length,
      })
    }

    // Trigger data import if requested
    if (onboardingData.import?.method === 'sample') {
      // TODO: Trigger sample data generation job
      logInfo('Sample data generation requested', { tenantId })
    } else if (onboardingData.import?.method === 'integration') {
      // TODO: Trigger integration sync jobs
      logInfo('Integration sync requested', {
        tenantId,
        integrations: onboardingData.import.integrations,
      })
    }

    logInfo('Onboarding completed successfully', { tenantId })

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      redirectUrl: '/dashboard?onboarding=complete',
    })
  } catch (error) {
    logError('Failed to complete onboarding', error)
    res.status(500).json({
      success: false,
      error: 'Failed to complete onboarding',
    })
  }
})

/**
 * POST /api/onboarding/generate-sample
 * Generate sample data for trial users
 */
router.post('/generate-sample', async (req, res) => {
  try {
    const { prisma } = req.app.locals

    // TODO: Get tenantId from authenticated user session
    const tenantId = req.query.tenantId || 'test-tenant'

    logInfo('Generating sample data', { tenantId })

    // Get organization/industry info to generate relevant data
    const org = await prisma.organization.findUnique({
      where: { id: tenantId },
      select: { industry: true, size: true },
    })

    // TODO: Call sample data generator service
    // For now, return success
    logInfo('Sample data generation started', {
      tenantId,
      industry: org?.industry,
    })

    res.json({
      success: true,
      message: 'Sample data generation started',
      estimatedTime: '30 seconds',
    })
  } catch (error) {
    logError('Failed to generate sample data', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate sample data',
    })
  }
})

/**
 * GET /api/onboarding/checklist
 * Get checklist status for trial users
 */
router.get('/checklist', async (req, res) => {
  try {
    const { prisma } = req.app.locals

    // TODO: Get tenantId from authenticated user session
    const tenantId = req.query.tenantId || 'test-tenant'

    logInfo('Fetching onboarding checklist', { tenantId })

    const progress = await prisma.onboardingProgress.findUnique({
      where: { tenantId },
    })

    // Define checklist items and their completion status
    const checklist = {
      welcome: progress?.companyData ? true : false,
      integration: progress?.integrationsData?.length > 0 ? true : false,
      data: progress?.importData ? true : false,
      forecast: false, // TODO: Check if user viewed forecast
      dashboard: false, // TODO: Check if user completed tour
      team: progress?.teamData?.length > 0 ? true : false,
    }

    const completedCount = Object.values(checklist).filter(Boolean).length
    const totalSteps = Object.keys(checklist).length

    res.json({
      success: true,
      progress: checklist,
      completedCount,
      totalSteps,
      percentComplete: Math.round((completedCount / totalSteps) * 100),
    })
  } catch (error) {
    logError('Failed to fetch onboarding checklist', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch onboarding checklist',
    })
  }
})

/**
 * PATCH /api/onboarding/skip
 * Skip onboarding entirely
 */
router.patch('/skip', async (req, res) => {
  try {
    const { prisma } = req.app.locals

    // TODO: Get tenantId from authenticated user session
    const tenantId = req.query.tenantId || 'test-tenant'

    logInfo('Skipping onboarding', { tenantId })

    await prisma.onboardingProgress.upsert({
      where: { tenantId },
      update: {
        skipped: true,
        isComplete: true,
        completedAt: new Date(),
      },
      create: {
        tenantId,
        skipped: true,
        isComplete: true,
        completedAt: new Date(),
        currentStep: 0,
        completedSteps: [],
      },
    })

    res.json({
      success: true,
      message: 'Onboarding skipped',
    })
  } catch (error) {
    logError('Failed to skip onboarding', error)
    res.status(500).json({
      success: false,
      error: 'Failed to skip onboarding',
    })
  }
})

export default router
