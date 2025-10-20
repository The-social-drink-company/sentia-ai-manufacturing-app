/**
 * Subscription Email Templates
 *
 * HTML and text templates for subscription-related emails.
 *
 * @epic EPIC-008 (Feature Gating System)
 * @story BMAD-GATE-010 (Production Stripe Integration)
 */

const EMAIL_BRAND = {
  name: 'CapLiquify',
  color: '#2563eb', // Blue
  supportEmail: 'support@capliquify.com',
  dashboardUrl: 'https://app.capliquify.com',
};

class SubscriptionTemplates {
  /**
   * Upgrade confirmation email
   */
  upgradeConfirmation({ tierName, cycle, effectiveDate }) {
    return {
      subject: `🎉 Subscription Upgraded to ${tierName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: ${EMAIL_BRAND.color};">Subscription Upgraded!</h1>
          <p>Great news! Your CapLiquify subscription has been upgraded.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>New Plan:</strong> ${tierName}</p>
            <p style="margin: 10px 0 0 0;"><strong>Billing Cycle:</strong> ${cycle}</p>
            <p style="margin: 10px 0 0 0;"><strong>Effective Date:</strong> ${effectiveDate}</p>
          </div>
          <p>You now have access to all the features included in your ${tierName} plan. Visit your dashboard to explore:</p>
          <a href="${EMAIL_BRAND.dashboardUrl}" style="display: inline-block; background: ${EMAIL_BRAND.color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Go to Dashboard</a>
          <p>Questions? Contact us at <a href="mailto:${EMAIL_BRAND.supportEmail}">${EMAIL_BRAND.supportEmail}</a></p>
        </div>
      `,
      text: `Subscription Upgraded!\n\nYour CapLiquify subscription has been upgraded to ${tierName} (${cycle}).\nEffective: ${effectiveDate}\n\nVisit ${EMAIL_BRAND.dashboardUrl} to explore your new features.`,
    };
  }

  /**
   * Downgrade scheduled email
   */
  downgradeScheduled({ currentTier, newTier, effectiveDate }) {
    return {
      subject: `Subscription Change Scheduled`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: ${EMAIL_BRAND.color};">Subscription Change Scheduled</h1>
          <p>Your subscription downgrade has been scheduled.</p>
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0;"><strong>Current Plan:</strong> ${currentTier}</p>
            <p style="margin: 10px 0 0 0;"><strong>New Plan:</strong> ${newTier}</p>
            <p style="margin: 10px 0 0 0;"><strong>Effective Date:</strong> ${effectiveDate}</p>
          </div>
          <p>Your subscription will change to ${newTier} on ${effectiveDate}. Until then, you'll continue to have access to all ${currentTier} features.</p>
          <p><strong>Changed your mind?</strong> You can cancel this downgrade anytime before ${effectiveDate}.</p>
          <a href="${EMAIL_BRAND.dashboardUrl}/settings/billing" style="display: inline-block; background: ${EMAIL_BRAND.color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Cancel Downgrade</a>
          <p>Questions? Contact us at <a href="mailto:${EMAIL_BRAND.supportEmail}">${EMAIL_BRAND.supportEmail}</a></p>
        </div>
      `,
      text: `Subscription Change Scheduled\n\nYour subscription will change from ${currentTier} to ${newTier} on ${effectiveDate}.\n\nYou can cancel this downgrade before ${effectiveDate} at ${EMAIL_BRAND.dashboardUrl}/settings/billing`,
    };
  }

  /**
   * Downgrade cancelled email
   */
  downgradeCancelled() {
    return {
      subject: `Downgrade Cancelled`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: ${EMAIL_BRAND.color};">Downgrade Cancelled</h1>
          <p>Good news! Your scheduled subscription downgrade has been cancelled.</p>
          <p>You'll continue to enjoy all the features of your current plan.</p>
          <a href="${EMAIL_BRAND.dashboardUrl}" style="display: inline-block; background: ${EMAIL_BRAND.color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Go to Dashboard</a>
          <p>Questions? Contact us at <a href="mailto:${EMAIL_BRAND.supportEmail}">${EMAIL_BRAND.supportEmail}</a></p>
        </div>
      `,
      text: `Downgrade Cancelled\n\nYour scheduled subscription downgrade has been cancelled. You'll continue with your current plan.`,
    };
  }

  /**
   * Billing cycle switch confirmation
   */
  cycleSwitchConfirmation({ oldCycle, newCycle, effectiveDate }) {
    return {
      subject: `Billing Cycle Changed`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: ${EMAIL_BRAND.color};">Billing Cycle Changed</h1>
          <p>Your billing cycle has been updated.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Previous Cycle:</strong> ${oldCycle}</p>
            <p style="margin: 10px 0 0 0;"><strong>New Cycle:</strong> ${newCycle}</p>
            <p style="margin: 10px 0 0 0;"><strong>Effective:</strong> ${effectiveDate}</p>
          </div>
          ${newCycle === 'ANNUAL' ? '<p style="background: #d1fae5; padding: 15px; border-radius: 6px; color: #065f46;"><strong>🎉 You\'re saving 17% with annual billing!</strong></p>' : ''}
          <a href="${EMAIL_BRAND.dashboardUrl}/settings/billing" style="display: inline-block; background: ${EMAIL_BRAND.color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Billing</a>
          <p>Questions? Contact us at <a href="mailto:${EMAIL_BRAND.supportEmail}">${EMAIL_BRAND.supportEmail}</a></p>
        </div>
      `,
      text: `Billing Cycle Changed\n\nYour billing cycle has been changed from ${oldCycle} to ${newCycle}.\nEffective: ${effectiveDate}`,
    };
  }

  /**
   * Payment receipt
   */
  paymentReceipt({ amount, invoiceUrl }) {
    return {
      subject: `Payment Receipt - ${amount}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: ${EMAIL_BRAND.color};">Payment Received</h1>
          <p>Thank you for your payment!</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 24px;"><strong>${amount}</strong></p>
            <p style="margin: 10px 0 0 0;">Payment processed successfully</p>
          </div>
          <a href="${invoiceUrl}" style="display: inline-block; background: ${EMAIL_BRAND.color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Download Invoice</a>
          <p>Questions? Contact us at <a href="mailto:${EMAIL_BRAND.supportEmail}">${EMAIL_BRAND.supportEmail}</a></p>
        </div>
      `,
      text: `Payment Receipt\n\nPayment received: ${amount}\n\nDownload invoice: ${invoiceUrl}`,
    };
  }

  /**
   * Payment failed alert
   */
  paymentFailedAlert({ amount, retryUrl }) {
    return {
      subject: `⚠️ Payment Failed - Action Required`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Payment Failed</h1>
          <p>We were unable to process your payment of <strong>${amount}</strong>.</p>
          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0;"><strong>Action Required:</strong> Please update your payment method or retry the payment.</p>
          </div>
          <p>Your subscription will remain active for 3 days while we attempt to retry the payment. After that, your account may be suspended.</p>
          <a href="${retryUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Update Payment Method</a>
          <p>Questions? Contact us at <a href="mailto:${EMAIL_BRAND.supportEmail}">${EMAIL_BRAND.supportEmail}</a></p>
        </div>
      `,
      text: `Payment Failed - Action Required\n\nWe were unable to process your payment of ${amount}.\n\nPlease update your payment method: ${retryUrl}`,
    };
  }

  /**
   * Welcome email
   */
  welcomeEmail({ tierName, cycle }) {
    return {
      subject: `Welcome to CapLiquify ${tierName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: ${EMAIL_BRAND.color};">Welcome to CapLiquify!</h1>
          <p>Thank you for subscribing to CapLiquify ${tierName}.</p>
          <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Your Plan:</strong> ${tierName} (${cycle})</p>
          </div>
          <p><strong>Get Started:</strong></p>
          <ul>
            <li>Connect your Xero, Shopify, or Amazon accounts</li>
            <li>Set up your inventory tracking</li>
            <li>Configure demand forecasting</li>
            <li>Explore AI-powered analytics</li>
          </ul>
          <a href="${EMAIL_BRAND.dashboardUrl}" style="display: inline-block; background: ${EMAIL_BRAND.color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Get Started</a>
          <p>Need help? Contact us at <a href="mailto:${EMAIL_BRAND.supportEmail}">${EMAIL_BRAND.supportEmail}</a></p>
        </div>
      `,
      text: `Welcome to CapLiquify!\n\nThank you for subscribing to CapLiquify ${tierName} (${cycle}).\n\nGet started at ${EMAIL_BRAND.dashboardUrl}`,
    };
  }

  /**
   * Trial ending reminder
   */
  trialEndingReminder({ daysRemaining, trialEndDate }) {
    return {
      subject: `Your trial ends in ${daysRemaining} days`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: ${EMAIL_BRAND.color};">Your trial is ending soon</h1>
          <p>Your CapLiquify trial will end in <strong>${daysRemaining} days</strong> on ${trialEndDate}.</p>
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0;">To continue using CapLiquify without interruption, please add a payment method before your trial ends.</p>
          </div>
          <a href="${EMAIL_BRAND.dashboardUrl}/settings/billing" style="display: inline-block; background: ${EMAIL_BRAND.color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Add Payment Method</a>
          <p>Questions? Contact us at <a href="mailto:${EMAIL_BRAND.supportEmail}">${EMAIL_BRAND.supportEmail}</a></p>
        </div>
      `,
      text: `Your trial is ending soon\n\nYour CapLiquify trial ends in ${daysRemaining} days (${trialEndDate}).\n\nAdd payment method: ${EMAIL_BRAND.dashboardUrl}/settings/billing`,
    };
  }

  /**
   * Cancellation confirmation
   */
  cancellationConfirmation() {
    return {
      subject: `Subscription Cancelled`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: ${EMAIL_BRAND.color};">Subscription Cancelled</h1>
          <p>Your CapLiquify subscription has been cancelled.</p>
          <p>We're sorry to see you go! Your account will remain active until the end of your current billing period.</p>
          <p><strong>Changed your mind?</strong> You can reactivate your subscription at any time.</p>
          <a href="${EMAIL_BRAND.dashboardUrl}/settings/billing" style="display: inline-block; background: ${EMAIL_BRAND.color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reactivate Subscription</a>
          <p>Questions? Contact us at <a href="mailto:${EMAIL_BRAND.supportEmail}">${EMAIL_BRAND.supportEmail}</a></p>
        </div>
      `,
      text: `Subscription Cancelled\n\nYour CapLiquify subscription has been cancelled.\n\nReactivate at any time: ${EMAIL_BRAND.dashboardUrl}/settings/billing`,
    };
  }
}

// Export singleton instance
export default new SubscriptionTemplates();
