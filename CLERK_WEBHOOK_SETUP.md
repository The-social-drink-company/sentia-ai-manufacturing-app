# Clerk Webhook Configuration Guide

## Overview
Clerk webhooks allow your application to receive real-time notifications about authentication events (user created, updated, deleted, etc.).

---

## Step 1: Create Webhook Endpoint in Your Application

Your application needs an endpoint to receive Clerk webhook events. Here's the webhook URL for each environment:

### Webhook URLs for Clerk Dashboard

| Environment | Webhook URL to Enter in Clerk |
|------------|-------------------------------|
| **Development** | `https://sentia-manufacturing-dashboard-development.up.railway.app/api/clerk/webhook` |
| **Testing** | `https://sentiatest.financeflo.ai/api/clerk/webhook` |
| **Production** | `https://sentia-manufacturing-production.up.railway.app/api/clerk/webhook` |

---

## Step 2: Configure Webhook in Clerk Dashboard

### For Development/Testing (Using Test Keys):

1. **Go to Clerk Dashboard**: https://dashboard.clerk.com
2. **Select your application**
3. **Navigate to**: Webhooks → Create Endpoint
4. **Enter the webhook URL**:
   ```
   https://sentia-manufacturing-dashboard-development.up.railway.app/api/clerk/webhook
   ```
   Or for testing:
   ```
   https://sentiatest.financeflo.ai/api/clerk/webhook
   ```

5. **Select Events to Listen To** (Recommended):
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `session.created`
   - `session.ended`
   - `organization.created` (if using organizations)
   - `organization.updated` (if using organizations)

6. **Click "Create"**

7. **Copy the Signing Secret** (it will look like):
   ```
   whsec_test_abcdefghijklmnopqrstuvwxyz123456789
   ```

### For Production (Using Live Keys):

1. **Switch to Production in Clerk Dashboard**
2. **Navigate to**: Webhooks → Create Endpoint
3. **Enter the production webhook URL**:
   ```
   https://sentia-manufacturing-production.up.railway.app/api/clerk/webhook
   ```

4. **Select the same events as above**

5. **Click "Create"**

6. **Copy the Production Signing Secret** (it will look like):
   ```
   whsec_live_abcdefghijklmnopqrstuvwxyz123456789
   ```

---

## Step 3: Add Webhook Secret to Railway Environment Variables

### Development Environment:
```env
CLERK_WEBHOOK_SECRET=whsec_test_YOUR_ACTUAL_SECRET_FROM_CLERK
```

### Testing Environment:
```env
CLERK_WEBHOOK_SECRET=whsec_test_YOUR_ACTUAL_SECRET_FROM_CLERK
```

### Production Environment:
```env
CLERK_WEBHOOK_SECRET=whsec_live_YOUR_ACTUAL_PRODUCTION_SECRET_FROM_CLERK
```

---

## Step 4: Create Webhook Handler (If Not Already Exists)

Add this endpoint to your `server.js` or create a new file `api/clerk-webhook.js`:

```javascript
// api/clerk-webhook.js
import express from 'express';
import { Webhook } from 'svix';

const router = express.Router();

// Clerk webhook handler
router.post('/api/clerk/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  // Get headers
  const svix_id = req.headers['svix-id'];
  const svix_timestamp = req.headers['svix-timestamp'];
  const svix_signature = req.headers['svix-signature'];

  // Verify the webhook
  const wh = new Webhook(webhookSecret);
  let evt;

  try {
    evt = wh.verify(req.body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle the webhook event
  const eventType = evt.type;
  console.log(`Received Clerk webhook: ${eventType}`);

  switch (eventType) {
    case 'user.created':
      console.log('New user created:', evt.data.id);
      // Add user to your database
      // await handleUserCreated(evt.data);
      break;

    case 'user.updated':
      console.log('User updated:', evt.data.id);
      // Update user in your database
      // await handleUserUpdated(evt.data);
      break;

    case 'user.deleted':
      console.log('User deleted:', evt.data.id);
      // Remove user from your database
      // await handleUserDeleted(evt.data.id);
      break;

    case 'session.created':
      console.log('Session created for user:', evt.data.user_id);
      // Log session creation
      break;

    case 'session.ended':
      console.log('Session ended for user:', evt.data.user_id);
      // Log session end
      break;

    default:
      console.log(`Unhandled webhook event: ${eventType}`);
  }

  res.status(200).json({ received: true });
});

export default router;
```

---

## Step 5: Install Required Dependencies

If you haven't already, install the Svix package for webhook verification:

```bash
npm install svix
```

---

## Step 6: Test the Webhook

### In Clerk Dashboard:
1. Go to your webhook endpoint
2. Click on "Test"
3. Select an event type
4. Click "Send test"
5. Check your Railway logs to see if the webhook was received

### Check Railway Logs:
```bash
railway logs --service [your-service-id] | grep -i webhook
```

---

## Complete Environment Variable Example

### For Development/Testing:
```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_cHJvdWQtcGFuZ29saW4tNjcuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
CLERK_WEBHOOK_SECRET=whsec_test_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
```

### For Production:
```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_production_publishable_key
CLERK_SECRET_KEY=sk_live_your_production_secret_key
CLERK_WEBHOOK_SECRET=whsec_live_your_production_webhook_secret
```

---

## Troubleshooting

### Issue: "Invalid signature" error
- **Cause**: Webhook secret doesn't match
- **Fix**: Copy the exact secret from Clerk dashboard, including the `whsec_` prefix

### Issue: 404 Not Found
- **Cause**: Webhook endpoint not implemented
- **Fix**: Add the webhook handler code to your application

### Issue: No events received
- **Cause**: Webhook URL incorrect or service not deployed
- **Fix**: Verify the URL is accessible and the service is running

### Issue: CLERK_WEBHOOK_SECRET not defined
- **Cause**: Environment variable not set in Railway
- **Fix**: Add the variable in Railway dashboard and redeploy

---

## Security Best Practices

1. **Always verify webhooks**: Never process webhook data without verification
2. **Use HTTPS**: Always use HTTPS URLs for webhooks (Railway provides this)
3. **Different secrets per environment**: Use different webhook secrets for dev/test/prod
4. **Log events**: Log all webhook events for auditing
5. **Idempotency**: Handle duplicate events gracefully

---

## Quick Reference

### What You Need From Clerk:
1. Create webhook endpoint in Clerk dashboard
2. Copy the signing secret (starts with `whsec_`)
3. Add it to Railway environment variables

### Webhook URL Format:
```
https://[your-domain]/api/clerk/webhook
```

### Environment Variable Name:
```
CLERK_WEBHOOK_SECRET=whsec_[test|live]_[your_secret]
```

---

## Summary

1. **Give Clerk this URL** (choose based on your environment):
   - Dev: `https://sentia-manufacturing-dashboard-development.up.railway.app/api/clerk/webhook`
   - Test: `https://sentiatest.financeflo.ai/api/clerk/webhook`
   - Prod: `https://sentia-manufacturing-production.up.railway.app/api/clerk/webhook`

2. **Clerk will give you a secret** that looks like:
   - `whsec_test_xxxxx` (for development/testing)
   - `whsec_live_xxxxx` (for production)

3. **Add that secret to Railway** as:
   ```
   CLERK_WEBHOOK_SECRET=whsec_test_xxxxx
   ```

That's it! Your Clerk webhooks will now be configured and verified.

---

**Last Updated**: December 2024
**For**: Sentia Manufacturing Dashboard