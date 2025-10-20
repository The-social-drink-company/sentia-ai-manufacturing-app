/**
 * Onboarding Routes - Multi-Tenant
 *
 * Handles onboarding flow progress tracking and data persistence
 * for trial users setting up their CapLiquify workspace.
 * All routes are tenant-scoped using tenantContext middleware.
 *
 * @module server/routes/onboarding
 */

import express from 'express'
import { logInfo, logError, logWarn } from '../../services/observability/structuredLogger.js'
import { generateSampleData } from '../services/sampleDataGenerator.js'
import { tenantContext, preventReadOnly } from '../middleware/tenantContext.js'
import { tenantPrisma } from '../services/tenantPrisma.js'

const router = express.Router()

// Apply tenant middleware to all routes in this file
router.use(tenantContext)

/**
 * GET /api/onboarding/progress
 * Get current onboarding progress for the tenant (tenant-scoped)
 */
router.get('/progress', async (req, res) => {
  try {
    const { tenant, tenantSchema } = req
    const tenantId = tenant.id

    logInfo('Fetching onboarding progress', { tenantId, tenantName: tenant.name })

    // Query onboarding progress from public schema (tenant metadata)
    const { prisma } = req.app.locals
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
      tenant: {
        id: tenant.id,
        name: tenant.name,
        tier: tenant.subscriptionTier
      }
    })
  } catch (error) {
    logError('Failed to fetch onboarding progress', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch onboarding progress',
      message: error.message
    })
  }
})

/**
 * POST /api/onboarding/progress
 * Save progress for current onboarding step (tenant-scoped)
 */
router.post('/progress', preventReadOnly, async (req, res) => {
  try {
    const { prisma } = req.app.locals
    const { tenant } = req
    const { currentStep, completedSteps, data } = req.body
    const tenantId = tenant.id

    logInfo('Saving onboarding progress', { tenantId, tenantName: tenant.name, currentStep, completedSteps })

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
      message: error.message
    })
  }
})

/**
 * POST /api/onboarding/complete
 * Mark onboarding as complete and process final setup (tenant-scoped)
 */
router.post('/complete', preventReadOnly, async (req, res) => {
  try {
    const { prisma } = req.app.locals
    const { tenant, tenantSchema } = req
    const onboardingData = req.body
    const tenantId = tenant.id

    logInfo('Completing onboarding', { tenantId, tenantName: tenant.name })

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

    // Process company data - update in tenant schema
    if (onboardingData.company) {
      const companyExists = await tenantPrisma.queryRaw(
        tenantSchema,
        `SELECT id FROM companies LIMIT 1`
      )

      if (companyExists.length > 0) {
        // Update existing company
        await tenantPrisma.executeRaw(
          tenantSchema,
          `UPDATE companies
           SET industry = $1, size = $2, currency = $3, annual_revenue = $4, updated_at = NOW()
           WHERE id = $5`,
          [
            onboardingData.company.industry,
            onboardingData.company.companySize,
            onboardingData.company.currency,
            onboardingData.company.annualRevenue,
            companyExists[0].id
          ]
        )
      } else {
        // Create company if doesn't exist
        await tenantPrisma.executeRaw(
          tenantSchema,
          `INSERT INTO companies (name, industry, size, currency, annual_revenue)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            tenant.name,
            onboardingData.company.industry,
            onboardingData.company.companySize,
            onboardingData.company.currency,
            onboardingData.company.annualRevenue
          ]
        )
      }
    }

    // Process team invitations
    if (onboardingData.team && onboardingData.team.length > 0) {
      // TODO: Send team invitations via Clerk (Phase 3)
      logInfo('Team invitations to process', {
        tenantId,
        count: onboardingData.team.length,
      })
    }

    // Trigger data import if requested
    if (onboardingData.import?.method === 'sample') {
      // TODO: Trigger sample data generation job (will use tenantSchema)
      logInfo('Sample data generation requested', { tenantId, tenantSchema })
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
      message: error.message
    })
  }
})

/**
 * POST /api/onboarding/generate-sample
 * Generate sample data for trial users (tenant-scoped)
 */
router.post('/generate-sample', preventReadOnly, async (req, res) => {
  try {
    const { tenant, tenantSchema } = req
    const tenantId = tenant.id

    logInfo('Generating sample data', { tenantId, tenantName: tenant.name, tenantSchema })

    // Get company/industry info from tenant schema to generate relevant data
    const companyData = await tenantPrisma.queryRaw(
      tenantSchema,
      `SELECT industry, size FROM companies LIMIT 1`
    )

    const industry = companyData[0]?.industry || 'manufacturing'

    // Call sample data generator service with tenant schema
    // Note: This will generate data in the tenant's schema, not public schema
    const { prisma } = req.app.locals
    const result = await generateSampleData(prisma, tenantId, industry, tenantSchema)

    logInfo('Sample data generation complete', {
      tenantId,
      tenantSchema,
      industry,
      result,
    })

    res.json({
      success: true,
      message: 'Sample data generated successfully in your tenant workspace',
      data: result.data,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        schema: tenantSchema
      }
    })
  } catch (error) {
    logError('Failed to generate sample data', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate sample data',
      message: error.message
    })
  }
})

/**
 * GET /api/onboarding/checklist
 * Get checklist status for trial users (tenant-scoped)
 */
router.get('/checklist', async (req, res) => {
  try {
    const { prisma } = req.app.locals
    const { tenant } = req
    const tenantId = tenant.id

    logInfo('Fetching onboarding checklist', { tenantId, tenantName: tenant.name })

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
      tenant: {
        id: tenant.id,
        name: tenant.name,
        tier: tenant.subscriptionTier
      }
    })
  } catch (error) {
    logError('Failed to fetch onboarding checklist', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch onboarding checklist',
      message: error.message
    })
  }
})

/**
 * PATCH /api/onboarding/skip
 * Skip onboarding entirely (tenant-scoped)
 */
router.patch('/skip', preventReadOnly, async (req, res) => {
  try {
    const { prisma } = req.app.locals
    const { tenant } = req
    const tenantId = tenant.id

    logInfo('Skipping onboarding', { tenantId, tenantName: tenant.name })

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
      message: error.message
    })
  }
})

export default router
