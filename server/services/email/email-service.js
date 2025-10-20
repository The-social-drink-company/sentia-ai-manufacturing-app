/**
 * Email Service - Email Notifications
 *
 * Handles sending transactional emails for subscription events.
 * Supports multiple email providers (Resend, SendGrid, etc.)
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-010 (Production Stripe Integration)
 */

import subscriptionTemplates from './templates/subscription-templates.js';

// Email provider configuration
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'console'; // 'console', 'resend', 'sendgrid'
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@capliquify.com';

class EmailService {
  constructor() {
    this.provider = EMAIL_PROVIDER;
    this.from = EMAIL_FROM;
    this.client = null;
    this._initializeProvider();
  }

  /**
   * Initialize email provider
   * @private
   */
  async _initializeProvider() {
    if (this.provider === 'resend') {
      // Resend integration
      const { Resend } = await import('resend');
      this.client = new Resend(process.env.RESEND_API_KEY);
    } else if (this.provider === 'sendgrid') {
      // SendGrid integration
      const sgMail = await import('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.client = sgMail;
    }
  }

  /**
   * Send email
   * @param {Object} params - Email parameters
   * @returns {Promise<Object>} Send result
   */
  async sendEmail({ to, subject, html, text }) {
    if (this.provider === 'console') {
      // Development mode - log to console
      console.log('\n[Email] ---------- EMAIL ----------');
      console.log('[Email] To:', to);
      console.log('[Email] Subject:', subject);
      console.log('[Email] Body:', text || html.substring(0, 200) + '...');
      console.log('[Email] ---------------------------\n');
      return { success: true, messageId: 'console-' + Date.now() };
    }

    try {
      if (this.provider === 'resend') {
        const result = await this.client.emails.send({
          from: this.from,
          to,
          subject,
          html,
          text,
        });
        return { success: true, messageId: result.id };
      } else if (this.provider === 'sendgrid') {
        const result = await this.client.send({
          from: this.from,
          to,
          subject,
          html,
          text,
        });
        return { success: true, messageId: result[0].headers['x-message-id'] };
      }
    } catch (error) {
      console.error('[Email] Error sending email:', error.message);
      throw error;
    }
  }

  /**
   * Send upgrade confirmation email
   * @param {Object} params - Email parameters
   */
  async sendUpgradeConfirmation({ tenantId, newTier, newCycle, effectiveDate }) {
    try {
      // Get tenant email
      const tenantEmail = await this._getTenantEmail(tenantId);

      const { subject, html, text } = subscriptionTemplates.upgradeConfirmation({
        tierName: this._formatTierName(newTier),
        cycle: newCycle,
        effectiveDate: effectiveDate.toLocaleDateString(),
      });

      return await this.sendEmail({
        to: tenantEmail,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('[Email] Error sending upgrade confirmation:', error.message);
      throw error;
    }
  }

  /**
   * Send downgrade scheduled email
   * @param {Object} params - Email parameters
   */
  async sendDowngradeScheduled({ tenantId, currentTier, newTier, effectiveDate }) {
    try {
      const tenantEmail = await this._getTenantEmail(tenantId);

      const { subject, html, text } = subscriptionTemplates.downgradeScheduled({
        currentTier: this._formatTierName(currentTier),
        newTier: this._formatTierName(newTier),
        effectiveDate: effectiveDate.toLocaleDateString(),
      });

      return await this.sendEmail({
        to: tenantEmail,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('[Email] Error sending downgrade scheduled:', error.message);
      throw error;
    }
  }

  /**
   * Send downgrade cancelled email
   * @param {Object} params - Email parameters
   */
  async sendDowngradeCancelled({ tenantId }) {
    try {
      const tenantEmail = await this._getTenantEmail(tenantId);

      const { subject, html, text} = subscriptionTemplates.downgradeCancelled();

      return await this.sendEmail({
        to: tenantEmail,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('[Email] Error sending downgrade cancelled:', error.message);
      throw error;
    }
  }

  /**
   * Send billing cycle switch confirmation
   * @param {Object} params - Email parameters
   */
  async sendCycleSwitchConfirmation({ tenantId, oldCycle, newCycle, effectiveDate }) {
    try {
      const tenantEmail = await this._getTenantEmail(tenantId);

      const { subject, html, text } = subscriptionTemplates.cycleSwitchConfirmation({
        oldCycle,
        newCycle,
        effectiveDate: effectiveDate.toLocaleDateString(),
      });

      return await this.sendEmail({
        to: tenantEmail,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('[Email] Error sending cycle switch confirmation:', error.message);
      throw error;
    }
  }

  /**
   * Send payment receipt
   * @param {Object} params - Email parameters
   */
  async sendPaymentReceipt({ tenantId, amount, currency, invoiceUrl }) {
    try {
      const tenantEmail = await this._getTenantEmail(tenantId);

      const { subject, html, text } = subscriptionTemplates.paymentReceipt({
        amount: `${currency} ${amount.toFixed(2)}`,
        invoiceUrl,
      });

      return await this.sendEmail({
        to: tenantEmail,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('[Email] Error sending payment receipt:', error.message);
      throw error;
    }
  }

  /**
   * Send payment failed alert
   * @param {Object} params - Email parameters
   */
  async sendPaymentFailedAlert({ tenantId, amount, currency, retryUrl }) {
    try {
      const tenantEmail = await this._getTenantEmail(tenantId);

      const { subject, html, text } = subscriptionTemplates.paymentFailedAlert({
        amount: `${currency} ${amount.toFixed(2)}`,
        retryUrl,
      });

      return await this.sendEmail({
        to: tenantEmail,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('[Email] Error sending payment failed alert:', error.message);
      throw error;
    }
  }

  /**
   * Send welcome email
   * @param {Object} params - Email parameters
   */
  async sendWelcomeEmail({ tenantId, tier, cycle }) {
    try {
      const tenantEmail = await this._getTenantEmail(tenantId);

      const { subject, html, text } = subscriptionTemplates.welcomeEmail({
        tierName: this._formatTierName(tier),
        cycle,
      });

      return await this.sendEmail({
        to: tenantEmail,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('[Email] Error sending welcome email:', error.message);
      throw error;
    }
  }

  /**
   * Send trial ending reminder
   * @param {Object} params - Email parameters
   */
  async sendTrialEndingReminder({ tenantId, daysRemaining, trialEndDate }) {
    try {
      const tenantEmail = await this._getTenantEmail(tenantId);

      const { subject, html, text } = subscriptionTemplates.trialEndingReminder({
        daysRemaining,
        trialEndDate: trialEndDate.toLocaleDateString(),
      });

      return await this.sendEmail({
        to: tenantEmail,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('[Email] Error sending trial ending reminder:', error.message);
      throw error;
    }
  }

  /**
   * Send cancellation confirmation
   * @param {Object} params - Email parameters
   */
  async sendCancellationConfirmation({ tenantId }) {
    try {
      const tenantEmail = await this._getTenantEmail(tenantId);

      const { subject, html, text } = subscriptionTemplates.cancellationConfirmation();

      return await this.sendEmail({
        to: tenantEmail,
        subject,
        html,
        text,
      });
    } catch (error) {
      console.error('[Email] Error sending cancellation confirmation:', error.message);
      throw error;
    }
  }

  /**
   * Get tenant email address
   * @private
   */
  async _getTenantEmail(tenantId) {
    // TODO: Fetch from database
    // For now, return a mock email
    return process.env.TEST_EMAIL || `tenant-${tenantId}@example.com`;
  }

  /**
   * Format tier name for display
   * @private
   */
  _formatTierName(tier) {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  }
}

// Export singleton instance
export default new EmailService();
