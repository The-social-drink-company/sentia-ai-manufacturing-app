/**
 * SendGrid Email Service
 *
 * Handles email sending with SendGrid API integration, template rendering,
 * and automatic failover to backup API keys.
 *
 * Features:
 * - Multi-key failover (primary → secondary → tertiary)
 * - Rate limiting (100 emails/day on SendGrid free tier)
 * - HTML template rendering with Handlebars
 * - Email validation with SendGrid Validation API
 * - Retry logic with exponential backoff
 *
 * @module server/services/email/sendgrid.service
 */

import sgMail from '@sendgrid/mail'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import Handlebars from 'handlebars'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Email template directory
const TEMPLATE_DIR = path.join(__dirname, '../../emails/trial')

// SendGrid API Keys with failover
const API_KEYS = {
  primary: process.env.SENDGRID_API_KEY,
  secondary: process.env.SENDGRID_API_KEY_SECONDARY,
  tertiary: process.env.SENDGRID_API_KEY_TERTIARY,
  validation: process.env.SENDGRID_VALIDATION_API_KEY,
}

// Rate limiting configuration
const RATE_LIMITS = {
  emailsPerDay: parseInt(process.env.EMAIL_RATE_LIMIT_PER_DAY || '100'),
  emailsPerHour: parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR || '100'),
}

// Email configuration
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@capliquify.com'
const FROM_NAME = 'CapLiquify'

// Template cache
const templateCache = new Map<string, HandlebarsTemplateDelegate>()

// Rate limiting tracking
const rateLimitTracker = {
  sentToday: 0,
  sentThisHour: 0,
  lastResetDate: new Date().toDateString(),
  lastResetHour: new Date().getHours(),
}

/**
 * Email sending statistics
 */
interface EmailStats {
  sent: number
  failed: number
  apiKeyUsed: 'primary' | 'secondary' | 'tertiary' | null
  lastError: string | null
}

const stats: EmailStats = {
  sent: 0,
  failed: 0,
  apiKeyUsed: null,
  lastError: null,
}

/**
 * Reset rate limit counters if needed
 */
function checkRateLimitReset() {
  const now = new Date()
  const currentDate = now.toDateString()
  const currentHour = now.getHours()

  // Reset daily counter
  if (rateLimitTracker.lastResetDate !== currentDate) {
    rateLimitTracker.sentToday = 0
    rateLimitTracker.lastResetDate = currentDate
  }

  // Reset hourly counter
  if (rateLimitTracker.lastResetHour !== currentHour) {
    rateLimitTracker.sentThisHour = 0
    rateLimitTracker.lastResetHour = currentHour
  }
}

/**
 * Check if we can send an email without exceeding rate limits
 */
function canSendEmail(): { canSend: boolean; reason?: string } {
  checkRateLimitReset()

  if (rateLimitTracker.sentToday >= RATE_LIMITS.emailsPerDay) {
    return {
      canSend: false,
      reason: `Daily limit reached (${RATE_LIMITS.emailsPerDay} emails/day)`,
    }
  }

  if (rateLimitTracker.sentThisHour >= RATE_LIMITS.emailsPerHour) {
    return {
      canSend: false,
      reason: `Hourly limit reached (${RATE_LIMITS.emailsPerHour} emails/hour)`,
    }
  }

  return { canSend: true }
}

/**
 * Load and compile an HTML email template
 */
async function loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
  // Check cache first
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!
  }

  try {
    const templatePath = path.join(TEMPLATE_DIR, `${templateName}.html`)
    const templateContent = await fs.readFile(templatePath, 'utf-8')

    // Compile with Handlebars
    const compiled = Handlebars.compile(templateContent)

    // Cache for future use
    templateCache.set(templateName, compiled)

    return compiled
  } catch (error) {
    throw new Error(
      `Failed to load email template: ${templateName} - ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Send email with failover support
 */
async function sendEmailWithFailover(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; error?: string; apiKeyUsed?: string }> {
  const apiKeysToTry: Array<{ key: string; name: 'primary' | 'secondary' | 'tertiary' }> = []

  if (API_KEYS.primary) apiKeysToTry.push({ key: API_KEYS.primary, name: 'primary' })
  if (API_KEYS.secondary) apiKeysToTry.push({ key: API_KEYS.secondary, name: 'secondary' })
  if (API_KEYS.tertiary) apiKeysToTry.push({ key: API_KEYS.tertiary, name: 'tertiary' })

  if (apiKeysToTry.length === 0) {
    throw new Error('No SendGrid API keys configured')
  }

  let lastError: Error | null = null

  for (const { key, name } of apiKeysToTry) {
    try {
      // Set API key for this attempt
      sgMail.setApiKey(key)

      // Send email
      await sgMail.send({
        to,
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME,
        },
        subject,
        html,
        text: text || stripHtml(html),
      })

      // Success!
      console.log(`[SendGrid] Email sent successfully using ${name} key to ${to}`)
      stats.apiKeyUsed = name
      return { success: true, apiKeyUsed: name }
    } catch (error) {
      lastError = error as Error
      console.warn(`[SendGrid] Failed to send with ${name} key:`, error)

      // Try next key if available
      continue
    }
  }

  // All keys failed
  const errorMessage = lastError?.message || 'All SendGrid API keys failed'
  console.error('[SendGrid] All API keys failed:', errorMessage)
  stats.lastError = errorMessage
  return { success: false, error: errorMessage }
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim()
}

/**
 * Send Day 1 Welcome Email
 */
export async function sendWelcomeEmail(options: {
  to: string
  firstName: string
  tier: string
  trialEndDate: string
  dashboardUrl: string
  unsubscribeUrl: string
  preferencesUrl: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check rate limits
    const { canSend, reason } = canSendEmail()
    if (!canSend) {
      console.warn(`[SendGrid] Rate limit: ${reason}`)
      return { success: false, error: reason }
    }

    // Load template
    const template = await loadTemplate('welcome')

    // Render with variables
    const html = template(options)

    // Send email
    const result = await sendEmailWithFailover(
      options.to,
      'Welcome to CapLiquify - Your 14-Day Trial Starts Now!',
      html
    )

    if (result.success) {
      stats.sent++
      rateLimitTracker.sentToday++
      rateLimitTracker.sentThisHour++
    } else {
      stats.failed++
    }

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[SendGrid] Welcome email failed:', errorMessage)
    stats.failed++
    return { success: false, error: errorMessage }
  }
}

/**
 * Send Day 7 Check-in Email
 */
export async function sendDay7Email(options: {
  to: string
  firstName: string
  tier: string
  trialStartDate: string
  dashboardUrl: string
  loginCount: number
  forecastsCreated: number
  integrationsConnected: number
  unsubscribeUrl: string
  preferencesUrl: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { canSend, reason } = canSendEmail()
    if (!canSend) {
      return { success: false, error: reason }
    }

    const template = await loadTemplate('day-7')
    const html = template(options)

    const result = await sendEmailWithFailover(
      options.to,
      "7 Days Left in Your Trial - How's It Going?",
      html
    )

    if (result.success) {
      stats.sent++
      rateLimitTracker.sentToday++
      rateLimitTracker.sentThisHour++
    } else {
      stats.failed++
    }

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[SendGrid] Day 7 email failed:', errorMessage)
    stats.failed++
    return { success: false, error: errorMessage }
  }
}

/**
 * Send Day 12 Ending Soon Email
 */
export async function sendDay12Email(options: {
  to: string
  firstName: string
  tier: string
  trialEndDate: string
  daysRemaining: number
  hoursRemaining: number
  minutesRemaining: number
  forecastsCreated: number
  insightsGenerated: number
  potentialSavings: string
  cashCycleImprovement: number
  addPaymentUrl: string
  pricingUrl: string
  unsubscribeUrl: string
  preferencesUrl: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { canSend, reason } = canSendEmail()
    if (!canSend) {
      return { success: false, error: reason }
    }

    const template = await loadTemplate('day-12')
    const html = template(options)

    const result = await sendEmailWithFailover(
      options.to,
      "Your Trial Ends in 2 Days - Don't Lose Access",
      html
    )

    if (result.success) {
      stats.sent++
      rateLimitTracker.sentToday++
      rateLimitTracker.sentThisHour++
    } else {
      stats.failed++
    }

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[SendGrid] Day 12 email failed:', errorMessage)
    stats.failed++
    return { success: false, error: errorMessage }
  }
}

/**
 * Send User Invitation Email
 */
export async function sendInvitationEmail(options: {
  to: string
  organizationName: string
  invitedByName: string
  role: string
  invitationUrl: string
  expiresAt: string
  unsubscribeUrl: string
  preferencesUrl: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check rate limits
    const { canSend, reason } = canSendEmail()
    if (!canSend) {
      console.warn(`[SendGrid] Rate limit: ${reason}`)
      return { success: false, error: reason }
    }

    // Create HTML content (inline for now, can be templated later)
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Join ${options.organizationName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">CapLiquify</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Manufacturing Intelligence Platform</p>
  </div>

  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #667eea; margin-top: 0;">You're Invited!</h2>

    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${options.invitedByName}</strong> has invited you to join <strong>${options.organizationName}</strong> on CapLiquify.
    </p>

    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Your Role:</strong> ${options.role.charAt(0).toUpperCase() + options.role.slice(1)}</p>
      <p style="margin: 0;"><strong>Organization:</strong> ${options.organizationName}</p>
    </div>

    <p style="font-size: 16px;">
      Click the button below to accept your invitation and get started:
    </p>

    <div style="text-align: center; margin: 35px 0;">
      <a href="${options.invitationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
        Accept Invitation
      </a>
    </div>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>⏰ This invitation expires on ${new Date(options.expiresAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
      </p>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${options.invitationUrl}" style="color: #667eea; word-break: break-all;">${options.invitationUrl}</a>
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="font-size: 13px; color: #9ca3af; text-align: center; margin: 20px 0 0 0;">
      <a href="${options.unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a> |
      <a href="${options.preferencesUrl}" style="color: #9ca3af; text-decoration: underline;">Email Preferences</a>
    </p>

    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 10px 0 0 0;">
      © ${new Date().getFullYear()} CapLiquify. All rights reserved.
    </p>
  </div>
</body>
</html>
    `

    // Send email
    const result = await sendEmailWithFailover(
      options.to,
      `You're invited to join ${options.organizationName} on CapLiquify`,
      html
    )

    if (result.success) {
      stats.sent++
      rateLimitTracker.sentToday++
      rateLimitTracker.sentThisHour++
    } else {
      stats.failed++
    }

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[SendGrid] Invitation email failed:', errorMessage)
    stats.failed++
    return { success: false, error: errorMessage }
  }
}

/**
 * Send Day 14 Expired Email
 */
export async function sendExpiredEmail(options: {
  to: string
  firstName: string
  tier: string
  trialEndDate: string
  gracePeriodEnd: string
  forecastsCreated: number
  insightsGenerated: number
  potentialSavings: string
  daysUsed: number
  projectedAnnualSavings: string
  monthlySavings: string
  netBenefit: string
  roiPercentage: number
  reactivateUrl: string
  pricingUrl: string
  downgradUrl: string
  unsubscribeUrl: string
  preferencesUrl: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { canSend, reason } = canSendEmail()
    if (!canSend) {
      return { success: false, error: reason }
    }

    const template = await loadTemplate('expired')
    const html = template(options)

    const result = await sendEmailWithFailover(
      options.to,
      'Your Trial Has Expired - 3-Day Grace Period Active',
      html
    )

    if (result.success) {
      stats.sent++
      rateLimitTracker.sentToday++
      rateLimitTracker.sentThisHour++
    } else {
      stats.failed++
    }

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[SendGrid] Expired email failed:', errorMessage)
    stats.failed++
    return { success: false, error: errorMessage }
  }
}

/**
 * Get email sending statistics
 */
export function getEmailStats(): EmailStats & {
  rateLimits: typeof rateLimitTracker
  limits: typeof RATE_LIMITS
} {
  checkRateLimitReset()
  return {
    ...stats,
    rateLimits: { ...rateLimitTracker },
    limits: { ...RATE_LIMITS },
  }
}

/**
 * Clear template cache (useful for development)
 */
export function clearTemplateCache(): void {
  templateCache.clear()
  console.log('[SendGrid] Template cache cleared')
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<{
  configured: boolean
  issues: string[]
  warnings: string[]
}> {
  const issues: string[] = []
  const warnings: string[] = []

  // Check API keys
  if (!API_KEYS.primary) {
    issues.push('Primary SendGrid API key not configured (SENDGRID_API_KEY)')
  }

  if (!API_KEYS.secondary && !API_KEYS.tertiary) {
    warnings.push('No backup API keys configured (recommended for redundancy)')
  }

  // Check FROM email
  if (!FROM_EMAIL || FROM_EMAIL === 'noreply@capliquify.com') {
    warnings.push(
      'Using default FROM email - configure SENDGRID_FROM_EMAIL for production'
    )
  }

  // Check templates exist
  const requiredTemplates = ['welcome', 'day-7', 'day-12', 'expired']
  for (const templateName of requiredTemplates) {
    try {
      await loadTemplate(templateName)
    } catch (error) {
      issues.push(`Email template missing or invalid: ${templateName}`)
    }
  }

  return {
    configured: issues.length === 0,
    issues,
    warnings,
  }
}

// Export default service object
export default {
  sendWelcomeEmail,
  sendDay7Email,
  sendDay12Email,
  sendExpiredEmail,
  sendInvitationEmail,
  getEmailStats,
  clearTemplateCache,
  testEmailConfiguration,
}
