# SendGrid Email Configuration Guide

**Last Updated**: 2025-10-20
**Status**: ✅ Configured
**Email Provider**: SendGrid

---

## 📧 Overview

CapLiquify uses **SendGrid** as the email service provider for:
- **Trial email nurture sequence** (Day 1, 7, 12, 14)
- **Transactional emails** (password resets, notifications)
- **Email address validation** (signup verification)
- **Marketing communications** (future)

---

## 🔑 API Keys Configuration

We have **5 SendGrid API keys** configured for different purposes:

### **1. Primary API Key** (REQUIRED)
```env
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

**Purpose**: General email sending (trial emails, transactional emails)
**Permissions**: Full Access or Mail Send
**Rate Limit**: 100 emails/day (SendGrid free tier)
**Used For**:
- Trial welcome email (Day 1)
- Trial check-in email (Day 7)
- Trial ending email (Day 12)
- Trial expired email (Day 14)
- Password reset emails
- System notifications

---

### **2. Secondary API Key** (OPTIONAL)
```env
SENDGRID_API_KEY_SECONDARY=your_secondary_api_key_here
```

**Purpose**: Automatic failover if primary key hits rate limit
**Permissions**: Full Access or Mail Send
**Used For**: Load balancing and redundancy

---

### **3. Tertiary API Key** (OPTIONAL)
```env
SENDGRID_API_KEY_TERTIARY=your_tertiary_api_key_here
```

**Purpose**: Third-level failover
**Permissions**: Full Access or Mail Send
**Used For**: Additional redundancy

---

### **4. Send Routing API Key** (OPTIONAL)
```env
SENDGRID_ROUTING_API_KEY=your_routing_api_key_here
```

**Purpose**: Advanced routing rules
**Permissions**: Mail Send + Advanced Features
**Used For**:
- Regional routing (UK vs US vs EU)
- A/B testing email templates
- Subuser routing
- Marketing segmentation

---

### **5. Email Validation API Key** (RECOMMENDED)
```env
SENDGRID_VALIDATION_API_KEY=your_validation_api_key_here
```

**Purpose**: Email address validation during signup
**Permissions**: Email Validation API Access
**API Endpoint**: `https://api.sendgrid.com/v3/validations/email`
**Used For**:
- Validating email addresses during trial signup
- Preventing fake/disposable email addresses
- Reducing bounce rates
- Improving deliverability

**Validation Response**:
```json
{
  "result": {
    "email": "user@example.com",
    "verdict": "Valid",
    "score": 0.95,
    "local": "user",
    "host": "example.com",
    "suggestion": null,
    "checks": {
      "domain": { "has_valid_address_syntax": true, "has_mx_or_a_record": true },
      "local_part": { "is_suspected_role_address": false },
      "additional": { "has_known_bounces": false, "has_suspected_bounces": false }
    }
  }
}
```

---

## 🎯 Trial Email Sequence

### **Day 1: Welcome Email**
**Template ID**: `SENDGRID_TEMPLATE_TRIAL_WELCOME`
**Sent**: Immediately after email verification
**Purpose**: Welcome user, provide quick start guide

**Template Variables**:
```json
{
  "firstName": "John",
  "tier": "Professional",
  "trialEndDate": "November 3, 2025",
  "dashboardUrl": "https://app.capliquify.com/dashboard",
  "supportUrl": "https://support.capliquify.com"
}
```

---

### **Day 7: Mid-Trial Check-in**
**Template ID**: `SENDGRID_TEMPLATE_TRIAL_DAY_7`
**Sent**: 7 days after trial start
**Purpose**: Check progress, offer help

**Template Variables**:
```json
{
  "firstName": "John",
  "daysRemaining": 7,
  "featuresUsed": 3,
  "totalFeatures": 10,
  "helpUrl": "https://support.capliquify.com/getting-started"
}
```

---

### **Day 12: Trial Ending Soon**
**Template ID**: `SENDGRID_TEMPLATE_TRIAL_DAY_12`
**Sent**: 12 days after trial start (2 days before end)
**Purpose**: Urgency, encourage conversion

**Template Variables**:
```json
{
  "firstName": "John",
  "daysRemaining": 2,
  "tier": "Professional",
  "monthlyPrice": "$149",
  "annualPrice": "$1,490",
  "annualSavings": "$298",
  "addPaymentUrl": "https://app.capliquify.com/settings/billing"
}
```

---

### **Day 14: Trial Expired**
**Template ID**: `SENDGRID_TEMPLATE_TRIAL_EXPIRED`
**Sent**: When trial expires without payment
**Purpose**: Grace period notice, reactivation link

**Template Variables**:
```json
{
  "firstName": "John",
  "gracePeriodDays": 3,
  "reactivateUrl": "https://app.capliquify.com/reactivate",
  "supportEmail": "support@capliquify.com"
}
```

---

## 📊 SendGrid Dashboard Setup

### **1. Verify Sender Identity**
Before sending emails, verify your sender email address:

1. Go to: https://app.sendgrid.com/settings/sender_auth
2. Click "Verify a Single Sender"
3. Enter: `noreply@capliquify.com`
4. Check inbox for verification email
5. Click verification link

**Status**: ⏳ Pending verification

---

### **2. Create Dynamic Templates**
Create 4 email templates for the trial sequence:

1. Go to: https://mc.sendgrid.com/dynamic-templates
2. Click "Create a Dynamic Template"
3. Name: "Trial Welcome Email"
4. Click "Add Version"
5. Choose "Blank Template" or "Code Editor"
6. Design email with handlebars syntax: `{{firstName}}`
7. Save and copy Template ID (format: `d-XXXXX...`)
8. Paste Template ID into `.env.local`

**Repeat for all 4 templates** (Welcome, Day 7, Day 12, Expired)

---

### **3. Set Up Email Analytics**
Enable open/click tracking:

1. Go to: https://app.sendgrid.com/settings/tracking
2. Enable "Open Tracking"
3. Enable "Click Tracking"
4. Enable "Subscription Tracking"

---

### **4. Configure IP Whitelisting** (Production)
Whitelist Render's IP addresses for production:

1. Go to: https://app.sendgrid.com/settings/access
2. Add Render's IP ranges:
   - `44.224.0.0/12` (us-west-2)
   - `44.240.0.0/13` (us-west-2)
   - Check Render docs for latest IPs

---

## 🔧 Email Service Implementation

### **Email Service Module** (To Be Created)
**File**: `server/services/email/sendgrid.service.ts`

**Features**:
- Primary/secondary/tertiary failover
- Rate limiting (100 emails/day)
- Retry logic (3 attempts with exponential backoff)
- Template-based sending
- Email validation integration
- Sandbox mode for development

**Usage Example**:
```typescript
import { sendTrialWelcomeEmail } from './services/email/sendgrid.service';

// Send welcome email
await sendTrialWelcomeEmail({
  to: 'user@example.com',
  firstName: 'John',
  tier: 'Professional',
  trialEndDate: new Date('2025-11-03')
});
```

---

## 🔐 Security Best Practices

### **1. Key Rotation**
- **Frequency**: Rotate API keys every **90 days**
- **Process**:
  1. Generate new key in SendGrid dashboard
  2. Update `.env.local` and Render environment variables
  3. Wait 24 hours for propagation
  4. Delete old key from SendGrid dashboard

### **2. Permissions**
- **Primary Key**: Full Access or Mail Send only
- **Validation Key**: Email Validation API only
- **Routing Key**: Mail Send + Advanced Features

### **3. Rate Limiting**
- **Free Tier**: 100 emails/day
- **Current Limit**: `EMAIL_RATE_LIMIT_PER_DAY=100`
- **Upgrade**: Essentials plan ($19.95/mo) = 40,000 emails/month

### **4. Monitoring**
Monitor SendGrid dashboard daily:
- **Bounce rate** (target: <2%)
- **Spam reports** (target: <0.1%)
- **Deliverability** (target: >98%)
- **API errors** (should be 0)

---

## 📈 SendGrid Plans & Pricing

| Plan | Price | Emails/Month | Features |
|------|-------|--------------|----------|
| **Free** | $0 | 100/day (3,000/month) | Basic sending |
| **Essentials** | $19.95/mo | 40,000 | Email validation, templates |
| **Pro** | $89.95/mo | 100,000 | Advanced analytics, dedicated IP |
| **Premier** | Custom | 1.5M+ | White-label, priority support |

**Current Plan**: Free tier (sufficient for MVP)
**Recommended Upgrade**: Essentials when exceeding 100 users

---

## ✅ Next Steps

### **Immediate** (Before Trial Launch):
1. ✅ **DONE**: Add SendGrid API keys to `.env.local`
2. ⏳ **TODO**: Verify sender email (`noreply@capliquify.com`)
3. ⏳ **TODO**: Create 4 dynamic email templates
4. ⏳ **TODO**: Add template IDs to `.env.local`
5. ⏳ **TODO**: Test email sending in sandbox mode

### **Before Production**:
1. ⏳ **TODO**: Set up domain authentication (DKIM/SPF)
2. ⏳ **TODO**: Configure IP whitelisting
3. ⏳ **TODO**: Enable email analytics
4. ⏳ **TODO**: Create `sendgrid.service.ts` module
5. ⏳ **TODO**: Integrate with trial API endpoints
6. ⏳ **TODO**: Test trial email sequence end-to-end

### **Post-Launch**:
1. Monitor deliverability metrics
2. A/B test email templates
3. Optimize send times
4. Consider upgrading to Essentials plan

---

## 🆘 Troubleshooting

### **Emails Not Sending**
1. Check `SENDGRID_API_KEY` is correct
2. Verify sender email is verified
3. Check `SENDGRID_ENABLED=true`
4. Check `SENDGRID_SANDBOX_MODE=false`
5. Review SendGrid dashboard for errors

### **High Bounce Rate**
1. Enable email validation (`SENDGRID_VALIDATION_API_KEY`)
2. Check sender domain authentication
3. Review email content for spam triggers
4. Verify email list quality

### **Rate Limit Errors**
1. Check current usage in SendGrid dashboard
2. Enable secondary/tertiary keys for failover
3. Consider upgrading SendGrid plan
4. Implement queuing for batch sends

---

## 📞 Support

**SendGrid Support**:
- Dashboard: https://app.sendgrid.com
- Documentation: https://docs.sendgrid.com
- Support: support@sendgrid.com

**Internal Support**:
- Engineering: engineering@capliquify.com
- DevOps: devops@capliquify.com

---

**Document Status**: ✅ Complete
**Last Reviewed**: 2025-10-20
**Next Review**: 2025-11-20
