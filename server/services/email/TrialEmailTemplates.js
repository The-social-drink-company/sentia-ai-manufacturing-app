/**
 * Trial Email Templates
 *
 * 8-email nurture sequence for trial users (Day 0, 1, 3, 7, 9, 11, 13, 14).
 * HTML + Plain text versions with personalization.
 *
 * @module server/services/email/TrialEmailTemplates
 * @epic BMAD-TRIAL-001 (Automated Free Trial Journey)
 * @story Story 3 (Email Nurture Sequence)
 */

export const trialEmailTemplates = {
  /**
   * Day 0: Welcome Email
   */
  welcome: ({ firstName, companyName, dashboardUrl }) => ({
    subject: 'Welcome to CapLiquify! Get started in <10 minutes ⚡',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; }
          .cta { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; margin: 20px 0; }
          .checklist { background: #f3f4f6; padding: 24px; border-radius: 8px; margin: 24px 0; }
          .checklist-item { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
          .checklist-item:last-child { border-bottom: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to CapLiquify! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>

            <p>Welcome to your 14-day free trial! You now have full access to CapLiquify's AI-powered working capital optimization platform.</p>

            <p><strong>Your trial includes:</strong></p>
            <ul>
              <li>✅ AI forecasting with >85% accuracy</li>
              <li>✅ What-if scenario analysis</li>
              <li>✅ Real-time cash flow insights</li>
              <li>✅ Xero, Shopify, Amazon integrations</li>
            </ul>

            <div class="checklist">
              <h3 style="margin-top: 0;">Quick Start Checklist (< 10 minutes)</h3>
              <div class="checklist-item">☐ Complete onboarding wizard (3 min)</div>
              <div class="checklist-item">☐ Connect your first integration (2 min)</div>
              <div class="checklist-item">☐ View your first forecast (2 min)</div>
              <div class="checklist-item">☐ Explore what-if scenarios (3 min)</div>
            </div>

            <p style="text-align: center;">
              <a href="${dashboardUrl}" class="cta">Complete Onboarding →</a>
            </p>

            <p><strong>Need help?</strong> Reply to this email or check out our <a href="https://app.capliquify.com/help">Help Center</a>.</p>

            <p>Cheers,<br>
            The CapLiquify Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${firstName},

Welcome to your 14-day free trial! You now have full access to CapLiquify's AI-powered working capital optimization platform.

Your trial includes:
✅ AI forecasting with >85% accuracy
✅ What-if scenario analysis
✅ Real-time cash flow insights
✅ Xero, Shopify, Amazon integrations

Quick Start Checklist (<10 minutes):
☐ Complete onboarding wizard (3 min)
☐ Connect your first integration (2 min)
☐ View your first forecast (2 min)
☐ Explore what-if scenarios (3 min)

Get started: ${dashboardUrl}

Need help? Reply to this email or visit: https://app.capliquify.com/help

Cheers,
The CapLiquify Team`
  }),

  /**
   * Day 1: Activation Email
   */
  activation: ({ firstName, dashboardUrl }) => ({
    subject: 'Your first working capital forecast is ready! 📊',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .content { background: white; padding: 40px; border: 1px solid #e5e7eb; border-radius: 12px; }
          .cta { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; margin: 20px 0; }
          .highlight-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 24px 0; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h2>Your dashboard is ready! 🎯</h2>

            <p>Hi ${firstName},</p>

            <p>Great news! Your working capital forecast is now live in your dashboard.</p>

            <div class="highlight-box">
              <h3 style="margin-top: 0;">What you'll see:</h3>
              <ul>
                <li><strong>30-day cash forecast</strong> with AI predictions</li>
                <li><strong>Inventory optimization</strong> recommendations</li>
                <li><strong>Days sales outstanding (DSO)</strong> trends</li>
                <li><strong>Cash conversion cycle</strong> improvements</li>
              </ul>
            </div>

            <p style="text-align: center;">
              <a href="${dashboardUrl}" class="cta">Explore Dashboard →</a>
            </p>

            <p><strong>💡 Pro Tip:</strong> Use the "What-If" analysis to model different scenarios and optimize your cash flow strategy.</p>

            <p>Questions? Reply to this email—we're here to help!</p>

            <p>Best,<br>
            The CapLiquify Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${firstName},

Great news! Your working capital forecast is now live in your dashboard.

What you'll see:
- 30-day cash forecast with AI predictions
- Inventory optimization recommendations
- Days sales outstanding (DSO) trends
- Cash conversion cycle improvements

Explore your dashboard: ${dashboardUrl}

💡 Pro Tip: Use the "What-If" analysis to model different scenarios and optimize your cash flow strategy.

Questions? Reply to this email—we're here to help!

Best,
The CapLiquify Team`
  }),

  /**
   * Day 3: Feature Discovery
   */
  featureDiscovery: ({ firstName, videoUrl }) => ({
    subject: '3 hidden features you need to know 🔍',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .content { background: white; padding: 40px; border: 1px solid #e5e7eb; border-radius: 12px; }
          .cta { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; margin: 20px 0; }
          .feature-card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; margin: 16px 0; border-radius: 8px; }
          .feature-number { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h2>3 Features That Will Transform Your Cash Flow 🚀</h2>

            <p>Hi ${firstName},</p>

            <p>You've been exploring CapLiquify for 3 days—here are powerful features you might have missed:</p>

            <div class="feature-card">
              <span class="feature-number">1</span>
              <h3>AI Forecasting (>85% accuracy)</h3>
              <p>Our machine learning models predict demand with industry-leading accuracy. See 30-90 day forecasts and adjust inventory proactively.</p>
            </div>

            <div class="feature-card">
              <span class="feature-number">2</span>
              <h3>What-If Scenario Analysis</h3>
              <p>Model different scenarios: "What if I reduce payment terms from 60 to 30 days?" Instantly see the cash flow impact.</p>
            </div>

            <div class="feature-card">
              <span class="feature-number">3</span>
              <h3>Multi-Store Integrations</h3>
              <p>Connect Xero, Shopify, Amazon, and Unleashed ERP. Get a unified view of inventory, sales, and financials in one dashboard.</p>
            </div>

            <p style="text-align: center;">
              <a href="${videoUrl}" class="cta">Watch 3-Minute Demo →</a>
            </p>

            <p><strong>📅 Book a call:</strong> Want personalized help? <a href="https://app.capliquify.com/book-demo">Schedule a 15-minute walkthrough</a> with our team.</p>

            <p>Best,<br>
            The CapLiquify Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${firstName},

You've been exploring CapLiquify for 3 days—here are powerful features you might have missed:

1️⃣ AI Forecasting (>85% accuracy)
Our machine learning models predict demand with industry-leading accuracy. See 30-90 day forecasts and adjust inventory proactively.

2️⃣ What-If Scenario Analysis
Model different scenarios: "What if I reduce payment terms from 60 to 30 days?" Instantly see the cash flow impact.

3️⃣ Multi-Store Integrations
Connect Xero, Shopify, Amazon, and Unleashed ERP. Get a unified view of inventory, sales, and financials in one dashboard.

Watch 3-minute demo: ${videoUrl}

📅 Book a call: Want personalized help? Schedule a 15-minute walkthrough: https://app.capliquify.com/book-demo

Best,
The CapLiquify Team`
  }),

  /**
   * Day 7: Social Proof (Halfway Point)
   */
  socialProof: ({ firstName, daysRemaining }) => ({
    subject: 'How manufacturers save $50K+ annually with CapLiquify 💰',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .content { background: white; padding: 40px; border: 1px solid #e5e7eb; border-radius: 12px; }
          .cta { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; margin: 20px 0; }
          .testimonial { background: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 8px; }
          .stats { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 32px; border-radius: 12px; text-align: center; margin: 24px 0; }
          .stat-item { display: inline-block; margin: 0 24px; }
          .stat-number { font-size: 36px; font-weight: bold; }
          .trial-reminder { background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h2>Real Results from FinanceFlo.ai Clients 📈</h2>

            <p>Hi ${firstName},</p>

            <p>You're ${daysRemaining} days into your trial—here's what other manufacturers achieved with our platform:</p>

            <div class="stats">
              <div class="stat-item">
                <div class="stat-number">66%</div>
                <div>Cost Reduction</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">500%</div>
                <div>ROI</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">450+</div>
                <div>UK Businesses</div>
              </div>
            </div>

            <p><strong>How they did it:</strong></p>

            <div class="testimonial">
              <p><em>"CapLiquify reduced our cash conversion cycle from 82 days to 48 days. That's £127K of freed-up working capital we reinvested in growth."</em></p>
              <p><strong>— Mid-sized Manufacturing Company (FinanceFlo.ai client)</strong></p>
            </div>

            <div class="testimonial">
              <p><em>"The AI forecasting prevented £43K in excess inventory. We now order exactly what we need, when we need it."</em></p>
              <p><strong>— E-commerce Manufacturer (FinanceFlo.ai client)</strong></p>
            </div>

            <div class="trial-reminder">
              <strong>⏰ ${daysRemaining} days left</strong> in your trial
            </div>

            <p style="text-align: center;">
              <a href="https://app.capliquify.com/upgrade?discount=TRIAL20" class="cta">Upgrade Now (20% Off) →</a>
            </p>

            <p><strong>Want to discuss your specific needs?</strong> <a href="https://app.capliquify.com/book-demo">Book a call</a> with our team.</p>

            <p>Best,<br>
            The CapLiquify Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${firstName},

You're ${daysRemaining} days into your trial—here's what other manufacturers achieved with our platform:

📊 Real Results from FinanceFlo.ai Clients:
• 66% Cost Reduction
• 500% ROI
• 450+ UK Businesses Served

How they did it:

"CapLiquify reduced our cash conversion cycle from 82 days to 48 days. That's £127K of freed-up working capital we reinvested in growth."
— Mid-sized Manufacturing Company

"The AI forecasting prevented £43K in excess inventory. We now order exactly what we need, when we need it."
— E-commerce Manufacturer

⏰ ${daysRemaining} days left in your trial

Upgrade now (20% off): https://app.capliquify.com/upgrade?discount=TRIAL20

Want to discuss your specific needs? Book a call: https://app.capliquify.com/book-demo

Best,
The CapLiquify Team`
  }),

  /**
   * Day 9: Urgency (5 days left)
   */
  urgency: ({ firstName, daysRemaining, upgradeUrl }) => ({
    subject: `Only ${daysRemaining} days left in your trial ⏰`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .content { background: white; padding: 40px; border: 1px solid #e5e7eb; border-radius: 12px; }
          .cta { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; margin: 20px 0; }
          .urgency-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; }
          .benefit-list { background: #f9fafb; padding: 24px; border-radius: 8px; margin: 24px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="urgency-box">
              <h2 style="margin: 0; color: #92400e;">⏰ Only ${daysRemaining} Days Left</h2>
              <p style="margin: 12px 0 0 0; color: #78350f;">Your trial expires soon. Upgrade now to keep your data and access.</p>
            </div>

            <p>Hi ${firstName},</p>

            <p>Your 14-day trial is almost over. Here's a quick recap of what you've accomplished:</p>

            <div class="benefit-list">
              <h3 style="margin-top: 0;">You've experienced:</h3>
              <ul>
                <li>✅ AI-powered demand forecasting</li>
                <li>✅ Real-time cash flow visibility</li>
                <li>✅ Working capital optimization insights</li>
                <li>✅ Multi-platform integrations</li>
              </ul>
            </div>

            <p><strong>Don't lose this progress.</strong> Upgrade now to continue optimizing your working capital.</p>

            <p><strong>🎁 Special Trial Offer:</strong> Upgrade in the next ${daysRemaining} days and get <strong>20% off your first month</strong>.</p>

            <p style="text-align: center;">
              <a href="${upgradeUrl}" class="cta">Upgrade Now (20% Off) →</a>
            </p>

            <p><strong>Questions about pricing?</strong> Reply to this email or <a href="https://app.capliquify.com/pricing">compare plans</a>.</p>

            <p>Best,<br>
            The CapLiquify Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${firstName},

⏰ Only ${daysRemaining} Days Left

Your 14-day trial is almost over. Here's a quick recap of what you've accomplished:

You've experienced:
✅ AI-powered demand forecasting
✅ Real-time cash flow visibility
✅ Working capital optimization insights
✅ Multi-platform integrations

Don't lose this progress. Upgrade now to continue optimizing your working capital.

🎁 Special Trial Offer: Upgrade in the next ${daysRemaining} days and get 20% off your first month.

Upgrade now: ${upgradeUrl}

Questions about pricing? Reply to this email or compare plans: https://app.capliquify.com/pricing

Best,
The CapLiquify Team`
  }),

  /**
   * Day 11: Last Chance (3 days left)
   */
  lastChance: ({ firstName, daysRemaining, upgradeUrl }) => ({
    subject: `Last chance: Trial expires in ${daysRemaining} days 🚨`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .content { background: white; padding: 40px; border: 1px solid #e5e7eb; border-radius: 12px; }
          .cta { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; margin: 20px 0; }
          .critical-box { background: #fee2e2; border: 3px solid #dc2626; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; }
          .comparison-table { background: #f9fafb; padding: 24px; border-radius: 8px; margin: 24px 0; }
          .tier-card { border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin: 12px 0; }
          .recommended { border: 2px solid #2563eb; background: #eff6ff; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="critical-box">
              <h2 style="margin: 0; color: #991b1b;">🚨 ${daysRemaining} Days Left</h2>
              <p style="margin: 12px 0 0 0; color: #7f1d1d; font-size: 18px;">Your trial expires soon. Don't miss out on these benefits.</p>
            </div>

            <p>Hi ${firstName},</p>

            <p>This is your final reminder—your trial ends in ${daysRemaining} days.</p>

            <p><strong>What you'll miss without upgrading:</strong></p>
            <ul>
              <li>❌ AI forecasting (>85% accuracy)</li>
              <li>❌ What-if scenario analysis</li>
              <li>❌ All your configured integrations</li>
              <li>❌ Historical trend data</li>
            </ul>

            <div class="comparison-table">
              <h3 style="margin-top: 0;">Choose Your Plan:</h3>

              <div class="tier-card">
                <h4>Starter • $49/month</h4>
                <p>Perfect for small manufacturers</p>
                <ul style="font-size: 14px;">
                  <li>5 users, 500 entities</li>
                  <li>Basic forecasting</li>
                  <li>API integrations</li>
                </ul>
              </div>

              <div class="tier-card recommended">
                <h4>Professional • $149/month <span style="background: #2563eb; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">RECOMMENDED</span></h4>
                <p>Everything in Starter, plus:</p>
                <ul style="font-size: 14px;">
                  <li>25 users, 5,000 entities</li>
                  <li><strong>AI forecasting</strong></li>
                  <li><strong>What-if analysis</strong></li>
                  <li>Priority support</li>
                </ul>
              </div>

              <div class="tier-card">
                <h4>Enterprise • $499/month</h4>
                <p>Everything in Professional, plus:</p>
                <ul style="font-size: 14px;">
                  <li>100 users, unlimited entities</li>
                  <li>Custom integrations</li>
                  <li>Dedicated support</li>
                </ul>
              </div>
            </div>

            <p style="text-align: center;">
              <a href="${upgradeUrl}" class="cta">Upgrade Now (20% Off Final 24H) →</a>
            </p>

            <p><strong>Still deciding?</strong> <a href="https://app.capliquify.com/book-demo">Book a 15-min call</a> with our team to discuss your needs.</p>

            <p>Best,<br>
            The CapLiquify Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${firstName},

🚨 ${daysRemaining} Days Left

This is your final reminder—your trial ends in ${daysRemaining} days.

What you'll miss without upgrading:
❌ AI forecasting (>85% accuracy)
❌ What-if scenario analysis
❌ All your configured integrations
❌ Historical trend data

Choose Your Plan:

STARTER • $49/month
Perfect for small manufacturers
• 5 users, 500 entities
• Basic forecasting
• API integrations

PROFESSIONAL • $149/month [RECOMMENDED]
Everything in Starter, plus:
• 25 users, 5,000 entities
• AI forecasting
• What-if analysis
• Priority support

ENTERPRISE • $499/month
Everything in Professional, plus:
• 100 users, unlimited entities
• Custom integrations
• Dedicated support

Upgrade now (20% off final 24h): ${upgradeUrl}

Still deciding? Book a 15-min call: https://app.capliquify.com/book-demo

Best,
The CapLiquify Team`
  }),

  /**
   * Day 13: Final Notice (1 day left)
   */
  finalNotice: ({ firstName, upgradeUrl }) => ({
    subject: '⚠️ Your trial expires tomorrow',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .content { background: white; padding: 40px; border: 1px solid #e5e7eb; border-radius: 12px; }
          .cta { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 700; margin: 20px 0; font-size: 18px; }
          .critical-box { background: #dc2626; color: white; padding: 32px; border-radius: 12px; text-align: center; margin: 24px 0; }
          .testimonial { background: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 8px; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="critical-box">
              <h2 style="margin: 0; font-size: 32px;">⚠️ Final Notice</h2>
              <p style="margin: 12px 0 0 0; font-size: 20px;">Your trial expires tomorrow at 11:59 PM</p>
            </div>

            <p>Hi ${firstName},</p>

            <p><strong>This is your last day to upgrade.</strong></p>

            <p>Tomorrow, your access to CapLiquify will become read-only. You'll lose:</p>
            <ul>
              <li>❌ The ability to create new forecasts</li>
              <li>❌ What-if scenario modeling</li>
              <li>❌ Real-time integration syncs</li>
              <li>❌ New data updates</li>
            </ul>

            <p><strong>Upgrade today to preserve:</strong></p>
            <ul>
              <li>✅ All your historical data</li>
              <li>✅ Configured integrations</li>
              <li>✅ Custom reports and dashboards</li>
              <li>✅ Team member access</li>
            </ul>

            <div class="testimonial">
              <p>"We almost let our trial expire but decided to upgrade at the last minute. Best decision we made—CapLiquify saved us £84K in the first year."</p>
              <p><strong>— Manufacturing CFO, FinanceFlo.ai client</strong></p>
            </div>

            <p style="text-align: center;">
              <a href="${upgradeUrl}" class="cta">Upgrade Now (Final 24H) →</a>
            </p>

            <p style="text-align: center; color: #dc2626; font-weight: bold; font-size: 18px;">⏰ This offer expires tomorrow at 11:59 PM</p>

            <p><strong>Have questions?</strong> Reply to this email or call us: +44 (0) 20 XXXX XXXX</p>

            <p>We'd hate to see you go,<br>
            The CapLiquify Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${firstName},

⚠️ FINAL NOTICE: Your trial expires tomorrow at 11:59 PM

This is your last day to upgrade.

Tomorrow, your access to CapLiquify will become read-only. You'll lose:
❌ The ability to create new forecasts
❌ What-if scenario modeling
❌ Real-time integration syncs
❌ New data updates

Upgrade today to preserve:
✅ All your historical data
✅ Configured integrations
✅ Custom reports and dashboards
✅ Team member access

"We almost let our trial expire but decided to upgrade at the last minute. Best decision we made—CapLiquify saved us £84K in the first year."
— Manufacturing CFO, FinanceFlo.ai client

Upgrade now: ${upgradeUrl}

⏰ This offer expires tomorrow at 11:59 PM

Have questions? Reply to this email or call us: +44 (0) 20 XXXX XXXX

We'd hate to see you go,
The CapLiquify Team`
  }),

  /**
   * Day 14: Expired (Trial Ended)
   */
  expired: ({ firstName, upgradeUrl }) => ({
    subject: 'Your trial has ended—here's what's next',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .content { background: white; padding: 40px; border: 1px solid #e5e7eb; border-radius: 12px; }
          .cta { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; margin: 20px 0; }
          .info-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 24px 0; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h2>Your Trial Has Ended</h2>

            <p>Hi ${firstName},</p>

            <p>Your 14-day free trial of CapLiquify has ended. Thank you for trying our platform!</p>

            <div class="info-box">
              <h3 style="margin-top: 0;">Your Account Status:</h3>
              <ul>
                <li>📊 <strong>Read-only access:</strong> You can still view your dashboard and historical data</li>
                <li>❌ <strong>No new updates:</strong> Forecasts and integrations are paused</li>
                <li>💾 <strong>Data preserved:</strong> All your data is safe for 30 days</li>
              </ul>
            </div>

            <p><strong>Restore full access anytime:</strong></p>
            <p>Upgrade to a paid plan to continue using all features. Your data and settings will be restored immediately.</p>

            <p style="text-align: center;">
              <a href="${upgradeUrl}" class="cta">Restore Access →</a>
            </p>

            <p><strong>Not ready to upgrade?</strong> We'd love your feedback. Reply to this email and tell us what we could improve.</p>

            <p><strong>Need more time to decide?</strong> <a href="https://app.capliquify.com/book-demo">Book a call</a> with our team to discuss your specific needs.</p>

            <p>Thank you for trying CapLiquify,<br>
            The CapLiquify Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Hi ${firstName},

Your 14-day free trial of CapLiquify has ended. Thank you for trying our platform!

Your Account Status:
📊 Read-only access: You can still view your dashboard and historical data
❌ No new updates: Forecasts and integrations are paused
💾 Data preserved: All your data is safe for 30 days

Restore full access anytime:
Upgrade to a paid plan to continue using all features. Your data and settings will be restored immediately.

Restore access: ${upgradeUrl}

Not ready to upgrade? We'd love your feedback. Reply to this email and tell us what we could improve.

Need more time to decide? Book a call: https://app.capliquify.com/book-demo

Thank you for trying CapLiquify,
The CapLiquify Team`
  })
}
