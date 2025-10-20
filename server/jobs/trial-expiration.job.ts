/**
 * Trial Expiration Cron Job
 *
 * Automated background job that manages trial lifecycle:
 * - Sends day-12 warning emails (2 days before expiration)
 * - Sends day-14 expired emails on expiration day
 * - Suspends accounts after grace period (17+ days)
 *
 * Runs every hour
 *
 * @module server/jobs/trial-expiration.job
 */

import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

// Email service configuration (replace with your preferred service)
// This is a placeholder - integrate with SendGrid, Resend, or similar
const sendEmail = async (to: string, subject: string, html: string, type: string, tenantId: string) => {
  console.log(`[Trial Email] Sending ${type} email to ${to}`)

  // In production, use actual email service:
  // await emailService.send({ to, subject, html })

  // Log email in database
  try {
    await prisma.trialEmail.create({
      data: {
        tenantId,
        type,
        status: 'SENT',
        subject,
        body: html,
        toEmail: to,
        sentAt: new Date(),
      },
    })
    console.log(`[Trial Email] ${type} email logged for tenant ${tenantId}`)
  } catch (error) {
    console.error(`[Trial Email] Failed to log email:`, error)
  }
}

// Load email template with variable substitution
const loadEmailTemplate = (templateName: string, variables: Record<string, string>): string => {
  const templatePath = path.join(__dirname, '..', 'emails', 'trial', templateName)
  let html = fs.readFileSync(templatePath, 'utf-8')

  // Replace all variables in the template
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    html = html.replace(regex, value)
  })

  return html
}

// Format date for email display
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Check for trials expiring in 3 days and send day-12 warning email
 */
const sendDay12Warnings = async () => {
  try {
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    threeDaysFromNow.setHours(0, 0, 0, 0)

    const threeDaysEnd = new Date(threeDaysFromNow)
    threeDaysEnd.setHours(23, 59, 59, 999)

    // Find tenants with trials expiring in exactly 3 days
    const expiringTenants = await prisma.tenant.findMany({
      where: {
        isInTrial: true,
        trialEndDate: {
          gte: threeDaysFromNow,
          lte: threeDaysEnd,
        },
        subscriptionStatus: 'TRIAL',
      },
    })

    console.log(`[Trial Cron] Found ${expiringTenants.length} trials expiring in 3 days`)

    for (const tenant of expiringTenants) {
      // Check if day-12 email already sent
      const existingEmail = await prisma.trialEmail.findFirst({
        where: {
          tenantId: tenant.id,
          type: 'DAY_12',
          status: {
            in: ['SENT', 'DELIVERED'],
          },
        },
      })

      if (existingEmail) {
        console.log(`[Trial Cron] Day-12 email already sent for tenant ${tenant.id}`)
        continue
      }

      // Prepare email variables
      const variables = {
        firstName: tenant.companyName.split(' ')[0], // Simplified - in production, get from user record
        companyName: tenant.companyName,
        tier: tenant.trialTier || tenant.subscriptionTier,
        trialEndDate: formatDate(tenant.trialEndDate!),
        price: getPriceForTier(tenant.subscriptionTier),
        cashSaved: '45,000', // Placeholder - calculate from actual usage
        daysReduced: '12', // Placeholder - calculate from working capital data
        forecasts: '28', // Placeholder - count from demand_forecasts table
        inventory: '15', // Placeholder - count from inventory optimizations
        paymentUrl: `${process.env.VITE_APP_URL || 'https://app.capliquify.com'}/billing/payment`,
        dashboardUrl: `${process.env.VITE_APP_URL || 'https://app.capliquify.com'}/dashboard`,
        pricingUrl: `${process.env.VITE_APP_URL || 'https://app.capliquify.com'}/pricing`,
        supportUrl: `${process.env.VITE_APP_URL || 'https://app.capliquify.com'}/support`,
      }

      const html = loadEmailTemplate('day-12-ending-soon.html', variables)

      await sendEmail(
        tenant.billingEmail!,
        `Only 2 Days Left - Don't Lose Access to CapLiquify`,
        html,
        'DAY_12',
        tenant.id
      )
    }
  } catch (error) {
    console.error('[Trial Cron] Error sending day-12 warnings:', error)
  }
}

/**
 * Check for expired trials and send day-14 expired email
 */
const sendExpiredEmails = async () => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    // Find tenants with trials expiring today
    const expiredTenants = await prisma.tenant.findMany({
      where: {
        isInTrial: true,
        trialEndDate: {
          gte: today,
          lte: todayEnd,
        },
        subscriptionStatus: 'TRIAL',
      },
      include: {
        subscription: true,
      },
    })

    console.log(`[Trial Cron] Found ${expiredTenants.length} trials expiring today`)

    for (const tenant of expiredTenants) {
      // Check if day-14 email already sent
      const existingEmail = await prisma.trialEmail.findFirst({
        where: {
          tenantId: tenant.id,
          type: 'DAY_14',
          status: {
            in: ['SENT', 'DELIVERED'],
          },
        },
      })

      if (existingEmail) {
        console.log(`[Trial Cron] Day-14 email already sent for tenant ${tenant.id}`)
        continue
      }

      // Calculate grace period end (3 days from trial end)
      const gracePeriodEnd = new Date(tenant.trialEndDate!)
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3)

      // Prepare email variables
      const variables = {
        firstName: tenant.companyName.split(' ')[0],
        companyName: tenant.companyName,
        tier: tenant.trialTier || tenant.subscriptionTier,
        gracePeriodEnd: formatDate(gracePeriodEnd),
        paymentUrl: `${process.env.VITE_APP_URL || 'https://app.capliquify.com'}/billing/payment`,
        dashboardUrl: `${process.env.VITE_APP_URL || 'https://app.capliquify.com'}/dashboard`,
        pricingUrl: `${process.env.VITE_APP_URL || 'https://app.capliquify.com'}/pricing`,
        supportUrl: `${process.env.VITE_APP_URL || 'https://app.capliquify.com'}/support`,
        faqUrl: `${process.env.VITE_APP_URL || 'https://app.capliquify.com'}/faq`,
        unsubscribeUrl: `${process.env.VITE_APP_URL || 'https://app.capliquify.com'}/unsubscribe`,
      }

      const html = loadEmailTemplate('day-14-expired.html', variables)

      await sendEmail(
        tenant.billingEmail!,
        `Your CapLiquify Trial Has Ended - 3-Day Grace Period Active`,
        html,
        'DAY_14',
        tenant.id
      )
    }
  } catch (error) {
    console.error('[Trial Cron] Error sending expired emails:', error)
  }
}

/**
 * Suspend accounts that are past grace period without payment
 */
const suspendExpiredAccounts = async () => {
  try {
    const today = new Date()
    const gracePeriodEnd = new Date()
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() - 3) // 3 days ago
    gracePeriodEnd.setHours(23, 59, 59, 999)

    // Find tenants past grace period without subscription
    const toSuspend = await prisma.tenant.findMany({
      where: {
        isInTrial: true,
        trialEndDate: {
          lte: gracePeriodEnd,
        },
        subscriptionStatus: 'TRIAL',
        isActive: true,
      },
    })

    console.log(`[Trial Cron] Found ${toSuspend.length} accounts to suspend`)

    for (const tenant of toSuspend) {
      // Update tenant status to suspended
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          subscriptionStatus: 'SUSPENDED',
          isActive: false,
          suspendedAt: new Date(),
          suspendReason: 'Trial expired without payment method',
        },
      })

      // Update subscription status
      if (tenant.subscriptionId) {
        await prisma.subscription.update({
          where: { id: tenant.subscriptionId },
          data: {
            status: 'SUSPENDED',
            suspendedAt: new Date(),
          },
        })
      }

      console.log(`[Trial Cron] Suspended tenant ${tenant.id} (${tenant.name})`)
    }
  } catch (error) {
    console.error('[Trial Cron] Error suspending accounts:', error)
  }
}

/**
 * Get price for subscription tier
 */
const getPriceForTier = (tier: string): string => {
  const prices = {
    starter: '99',
    professional: '249',
    enterprise: '499',
  }
  return prices[tier as keyof typeof prices] || '249'
}

/**
 * Main cron job function
 */
export const startTrialExpirationJob = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[Trial Cron] Running trial expiration job...')

    try {
      await sendDay12Warnings()
      await sendExpiredEmails()
      await suspendExpiredAccounts()

      console.log('[Trial Cron] Trial expiration job completed successfully')
    } catch (error) {
      console.error('[Trial Cron] Trial expiration job failed:', error)
    }
  })

  console.log('[Trial Cron] Trial expiration cron job started (runs every hour)')
}

// For manual testing
export const runTrialExpirationJobNow = async () => {
  console.log('[Trial Cron] Running trial expiration job manually...')

  try {
    await sendDay12Warnings()
    await sendExpiredEmails()
    await suspendExpiredAccounts()

    console.log('[Trial Cron] Manual trial expiration job completed')
  } catch (error) {
    console.error('[Trial Cron] Manual trial expiration job failed:', error)
  }
}

export default {
  startTrialExpirationJob,
  runTrialExpirationJobNow,
}
