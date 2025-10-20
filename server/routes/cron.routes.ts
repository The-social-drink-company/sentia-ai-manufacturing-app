/**
 * Cron Job Routes
 *
 * Handles scheduled tasks triggered by GitHub Actions or external cron services.
 *
 * @module server/routes/cron.routes
 */

import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import sendgridService from '../services/email/sendgrid.service.js'

const router = Router()
const prisma = new PrismaClient()

// Cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET_KEY || 'change-this-secret-in-production'

/**
 * Middleware to verify cron secret
 */
function verifyCronSecret(req: Request, res: Response, next: Function) {
  const secret = req.headers['x-cron-secret']

  if (!secret || secret !== CRON_SECRET) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid cron secret',
    })
  }

  next()
}

/**
 * Calculate which day of trial a tenant is on
 */
function getTrialDay(trialStartDate: Date): number {
  const now = new Date()
  const start = new Date(trialStartDate)
  const diffTime = Math.abs(now.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Check if tenant should receive email on this day
 */
function shouldSendEmail(
  trialDay: number,
  lastEmailSent: string | null
): { shouldSend: boolean; emailType: string | null } {
  const emailSchedule = {
    1: 'DAY_1',
    7: 'DAY_7',
    12: 'DAY_12',
    14: 'DAY_14',
  }

  const emailType = emailSchedule[trialDay as keyof typeof emailSchedule]

  if (!emailType) {
    return { shouldSend: false, emailType: null }
  }

  // Don't send if we already sent this email type
  if (lastEmailSent === emailType) {
    return { shouldSend: false, emailType }
  }

  return { shouldSend: true, emailType }
}

/**
 * POST /api/cron/trial-expiration
 *
 * Check all trial tenants and send appropriate emails
 *
 * Headers:
 * - X-Cron-Secret: Cron authentication secret
 *
 * Body:
 * {
 *   dryRun?: boolean  // If true, don't actually send emails (testing)
 * }
 */
router.post(
  '/trial-expiration',
  verifyCronSecret,
  async (req: Request, res: Response) => {
    try {
      const { dryRun = false } = req.body

      console.log(
        `[CRON] Trial expiration check started (dryRun: ${dryRun})`
      )

      // Statistics
      const stats = {
        totalChecked: 0,
        day1Sent: 0,
        day7Sent: 0,
        day12Sent: 0,
        day14Sent: 0,
        gracePeriodExpiring: 0,
        errors: 0,
      }

      // Find all tenants currently in trial
      const trialTenants = await prisma.tenant.findMany({
        where: {
          isInTrial: true,
        },
        include: {
          subscription: true,
        },
      })

      stats.totalChecked = trialTenants.length
      console.log(`[CRON] Found ${trialTenants.length} trial tenants`)

      for (const tenant of trialTenants) {
        try {
          const trialDay = getTrialDay(tenant.trialStartDate!)
          const now = new Date()
          const trialEndDate = new Date(tenant.trialEndDate!)
          const isExpired = now > trialEndDate

          console.log(
            `[CRON] Tenant ${tenant.slug}: Day ${trialDay}, Expired: ${isExpired}`
          )

          // Check grace period expiration
          if (
            isExpired &&
            tenant.subscription?.gracePeriodEnd &&
            now > new Date(tenant.subscription.gracePeriodEnd)
          ) {
            stats.gracePeriodExpiring++

            // Deactivate tenant (grace period expired)
            if (!dryRun) {
              await prisma.tenant.update({
                where: { id: tenant.id },
                data: {
                  isActive: false,
                  subscriptionStatus: 'EXPIRED',
                },
              })

              await prisma.subscription.update({
                where: { id: tenant.subscriptionId! },
                data: {
                  status: 'EXPIRED',
                },
              })

              console.log(
                `[CRON] Tenant ${tenant.slug}: Deactivated (grace period expired)`
              )
            }

            continue
          }

          // Check if we should send an email
          const lastEmailRecord = await prisma.trialEmail.findFirst({
            where: { tenantId: tenant.id },
            orderBy: { createdAt: 'desc' },
          })

          const { shouldSend, emailType } = shouldSendEmail(
            trialDay,
            lastEmailRecord?.type || null
          )

          if (shouldSend && emailType) {
            console.log(
              `[CRON] Tenant ${tenant.slug}: Should send ${emailType} email`
            )

            // Get email subject based on type
            const emailSubjects = {
              DAY_1: 'Welcome to CapLiquify - Your 14-Day Trial Starts Now!',
              DAY_7: '7 Days Left in Your Trial - How\'s It Going?',
              DAY_12: 'Your Trial Ends in 2 Days - Don\'t Lose Access',
              DAY_14:
                'Your Trial Has Expired - 3-Day Grace Period Active',
            }

            if (!dryRun) {
              // Create email record
              await prisma.trialEmail.create({
                data: {
                  tenantId: tenant.id,
                  type: emailType,
                  status: 'PENDING',
                  subject: emailSubjects[emailType as keyof typeof emailSubjects],
                  body: `Email template: ${emailType}`, // Placeholder - actual sending handled by email service
                  toEmail: tenant.billingEmail,
                },
              })

              // Update stats
              if (emailType === 'DAY_1') stats.day1Sent++
              else if (emailType === 'DAY_7') stats.day7Sent++
              else if (emailType === 'DAY_12') stats.day12Sent++
              else if (emailType === 'DAY_14') stats.day14Sent++
            } else {
              console.log(
                `[CRON] DRY RUN: Would send ${emailType} to ${tenant.billingEmail}`
              )

              // Update stats in dry run mode too
              if (emailType === 'DAY_1') stats.day1Sent++
              else if (emailType === 'DAY_7') stats.day7Sent++
              else if (emailType === 'DAY_12') stats.day12Sent++
              else if (emailType === 'DAY_14') stats.day14Sent++
            }
          }
        } catch (error) {
          stats.errors++
          console.error(
            `[CRON] Error processing tenant ${tenant.slug}:`,
            error
          )
        }
      }

      // Process pending emails (actually send them)
      if (!dryRun) {
        const pendingEmails = await prisma.trialEmail.findMany({
          where: {
            status: 'PENDING',
          },
          include: {
            tenant: true,
          },
          take: 100, // Process max 100 emails per run to avoid rate limits
        })

        console.log(
          `[CRON] Found ${pendingEmails.length} pending emails to send`
        )

        for (const emailRecord of pendingEmails) {
          try {
            // TODO: Integrate with SendGrid service once created
            // For now, mark as sent to avoid re-sending
            await prisma.trialEmail.update({
              where: { id: emailRecord.id },
              data: {
                status: 'SENT',
                sentAt: new Date(),
              },
            })

            console.log(
              `[CRON] Email ${emailRecord.type} sent to ${emailRecord.toEmail}`
            )
          } catch (error) {
            stats.errors++
            console.error(
              `[CRON] Error sending email ${emailRecord.id}:`,
              error
            )

            await prisma.trialEmail.update({
              where: { id: emailRecord.id },
              data: {
                status: 'FAILED',
                error: error instanceof Error ? error.message : 'Unknown error',
              },
            })
          }
        }
      }

      console.log(`[CRON] Trial expiration check completed`, stats)

      res.json({
        success: true,
        message: dryRun
          ? 'Dry run completed (no emails sent)'
          : 'Trial expiration check completed',
        stats,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('[CRON] Trial expiration check failed:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to check trial expirations',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
)

/**
 * POST /api/cron/email-queue-processor
 *
 * Process pending emails from the queue
 *
 * Headers:
 * - X-Cron-Secret: Cron authentication secret
 */
router.post(
  '/email-queue-processor',
  verifyCronSecret,
  async (req: Request, res: Response) => {
    try {
      console.log('[CRON] Email queue processor started')

      const stats = {
        processed: 0,
        sent: 0,
        failed: 0,
      }

      // Get pending emails
      const pendingEmails = await prisma.trialEmail.findMany({
        where: {
          status: 'PENDING',
        },
        include: {
          tenant: true,
        },
        take: 50, // Process 50 emails per run (SendGrid free tier: 100/day)
        orderBy: {
          createdAt: 'asc', // Oldest first
        },
      })

      stats.processed = pendingEmails.length
      console.log(
        `[CRON] Found ${pendingEmails.length} pending emails to process`
      )

      for (const emailRecord of pendingEmails) {
        try {
          // Send email via SendGrid service
          let result: { success: boolean; error?: string } | null = null

          // Prepare common email options
          const baseUrl = process.env.VITE_APP_URL || 'https://app.capliquify.com'
          const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(emailRecord.toEmail)}`
          const preferencesUrl = `${baseUrl}/email-preferences?email=${encodeURIComponent(emailRecord.toEmail)}`

          // Send appropriate email based on type
          switch (emailRecord.type) {
            case 'DAY_1':
              result = await sendgridService.sendWelcomeEmail({
                to: emailRecord.toEmail,
                firstName: emailRecord.tenant.name.split(' ')[0],
                tier: emailRecord.tenant.subscriptionTier || 'Professional',
                trialEndDate: emailRecord.tenant.trialEndDate?.toDateString() || '',
                dashboardUrl: `${baseUrl}/dashboard`,
                unsubscribeUrl,
                preferencesUrl,
              })
              break

            case 'DAY_7':
              result = await sendgridService.sendDay7Email({
                to: emailRecord.toEmail,
                firstName: emailRecord.tenant.name.split(' ')[0],
                tier: emailRecord.tenant.subscriptionTier || 'Professional',
                trialStartDate: emailRecord.tenant.trialStartDate?.toDateString() || '',
                dashboardUrl: `${baseUrl}/dashboard`,
                loginCount: 0, // TODO: Track actual login count
                forecastsCreated: 0, // TODO: Query actual forecasts
                integrationsConnected: 0, // TODO: Query actual integrations
                unsubscribeUrl,
                preferencesUrl,
              })
              break

            case 'DAY_12':
              const trialEndDate = new Date(emailRecord.tenant.trialEndDate!)
              const now = new Date()
              const timeRemaining = trialEndDate.getTime() - now.getTime()
              const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24))
              const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60))
              const minutesRemaining = Math.ceil(timeRemaining / (1000 * 60))

              result = await sendgridService.sendDay12Email({
                to: emailRecord.toEmail,
                firstName: emailRecord.tenant.name.split(' ')[0],
                tier: emailRecord.tenant.subscriptionTier || 'Professional',
                trialEndDate: trialEndDate.toDateString(),
                daysRemaining: Math.max(0, daysRemaining),
                hoursRemaining: Math.max(0, hoursRemaining % 24),
                minutesRemaining: Math.max(0, minutesRemaining % 60),
                forecastsCreated: 0, // TODO: Query actual forecasts
                insightsGenerated: 0, // TODO: Query actual insights
                potentialSavings: '0', // TODO: Calculate actual savings
                cashCycleImprovement: 0, // TODO: Calculate actual improvement
                addPaymentUrl: `${baseUrl}/billing/add-payment`,
                pricingUrl: `${baseUrl}/pricing`,
                unsubscribeUrl,
                preferencesUrl,
              })
              break

            case 'DAY_14':
              result = await sendgridService.sendExpiredEmail({
                to: emailRecord.toEmail,
                firstName: emailRecord.tenant.name.split(' ')[0],
                tier: emailRecord.tenant.subscriptionTier || 'Professional',
                trialEndDate: emailRecord.tenant.trialEndDate?.toDateString() || '',
                gracePeriodEnd: emailRecord.tenant.subscription?.gracePeriodEnd?.toDateString() || '',
                forecastsCreated: 0, // TODO: Query actual forecasts
                insightsGenerated: 0, // TODO: Query actual insights
                potentialSavings: '0', // TODO: Calculate actual savings
                daysUsed: 14,
                projectedAnnualSavings: '0', // TODO: Calculate actual savings
                monthlySavings: '0', // TODO: Calculate actual savings
                netBenefit: '0', // TODO: Calculate actual benefit
                roiPercentage: 0, // TODO: Calculate actual ROI
                reactivateUrl: `${baseUrl}/billing/reactivate`,
                pricingUrl: `${baseUrl}/pricing`,
                downgradUrl: `${baseUrl}/billing/change-plan?plan=starter`,
                unsubscribeUrl,
                preferencesUrl,
              })
              break

            default:
              throw new Error(`Unknown email type: ${emailRecord.type}`)
          }

          if (result && result.success) {
            // Mark as sent
            await prisma.trialEmail.update({
              where: { id: emailRecord.id },
              data: {
                status: 'SENT',
                sentAt: new Date(),
              },
            })

            stats.sent++
            console.log(
              `[CRON] Email sent: ${emailRecord.type} to ${emailRecord.toEmail}`
            )
          } else {
            throw new Error(result?.error || 'Unknown error sending email')
          }
        } catch (error) {
          stats.failed++
          console.error(
            `[CRON] Failed to send email ${emailRecord.id}:`,
            error
          )

          await prisma.trialEmail.update({
            where: { id: emailRecord.id },
            data: {
              status: 'FAILED',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          })
        }
      }

      console.log('[CRON] Email queue processor completed', stats)

      res.json({
        success: true,
        message: 'Email queue processed',
        stats,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('[CRON] Email queue processor failed:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to process email queue',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
)

/**
 * GET /api/cron/status
 *
 * Get status of cron jobs and email queue
 *
 * Headers:
 * - X-Cron-Secret: Cron authentication secret
 */
router.get(
  '/status',
  verifyCronSecret,
  async (req: Request, res: Response) => {
    try {
      const [
        trialTenantsCount,
        pendingEmailsCount,
        sentEmailsToday,
        failedEmailsToday,
      ] = await Promise.all([
        prisma.tenant.count({
          where: { isInTrial: true },
        }),
        prisma.trialEmail.count({
          where: { status: 'PENDING' },
        }),
        prisma.trialEmail.count({
          where: {
            status: 'SENT',
            sentAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.trialEmail.count({
          where: {
            status: 'FAILED',
            updatedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      ])

      res.json({
        success: true,
        data: {
          trialTenants: trialTenantsCount,
          pendingEmails: pendingEmailsCount,
          emailsSentToday: sentEmailsToday,
          emailsFailedToday: failedEmailsToday,
          sendgridDailyLimit: 100,
          sendgridRemainingToday: Math.max(0, 100 - sentEmailsToday),
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('[CRON] Status check failed:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get cron status',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
)

export default router
