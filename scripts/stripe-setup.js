/**
 * Stripe Product & Price Setup Script
 *
 * BMAD-MULTITENANT-004 Story 1: Stripe Product & Price Configuration
 *
 * This script creates Stripe products and prices for CapLiquify's three subscription tiers:
 * - Starter ($29-49/month)
 * - Professional ($99-149/month)
 * - Enterprise ($299-499/month)
 *
 * Usage:
 *   # Test mode (default)
 *   node scripts/stripe-setup.js
 *
 *   # Production mode
 *   node scripts/stripe-setup.js --production
 *
 * Prerequisites:
 *   - STRIPE_SECRET_KEY environment variable set (test or live key)
 *   - npm install stripe
 *
 * @module scripts/stripe-setup
 */

import Stripe from 'stripe'
import 'dotenv/config'

const isProduction = process.argv.includes('--production')
const stripeSecretKey = isProduction
  ? process.env.STRIPE_LIVE_SECRET_KEY
  : process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  console.error('❌ Error: STRIPE_SECRET_KEY not found in environment variables')
  console.error('Set STRIPE_SECRET_KEY (test mode) or STRIPE_LIVE_SECRET_KEY (production) in your .env file')
  process.exit(1)
}

const stripe = new Stripe(stripeSecretKey)

/**
 * Subscription tier definitions
 */
const TIERS = [
  {
    name: 'Starter',
    description: 'Perfect for small manufacturing businesses getting started with working capital optimization',
    metadata: {
      tier: 'starter',
      maxUsers: '5',
      maxEntities: '500',
      features: JSON.stringify([
        'basic_forecasting',
        'api_integrations',
        'standard_reports',
        'email_support'
      ])
    },
    prices: [
      {
        nickname: 'Starter Monthly',
        amount: 4900, // $49.00
        interval: 'month',
        trialPeriodDays: 14
      }
    ]
  },
  {
    name: 'Professional',
    description: 'Advanced AI-powered forecasting and what-if analysis for growing manufacturers',
    metadata: {
      tier: 'professional',
      maxUsers: '25',
      maxEntities: '5000',
      features: JSON.stringify([
        'basic_forecasting',
        'ai_forecasting',
        'what_if_analysis',
        'api_integrations',
        'advanced_reports',
        'priority_support'
      ])
    },
    prices: [
      {
        nickname: 'Professional Monthly',
        amount: 14900, // $149.00
        interval: 'month',
        trialPeriodDays: 14
      },
      {
        nickname: 'Professional Annual',
        amount: 151830, // $1,518.30 (15% discount)
        interval: 'year',
        trialPeriodDays: 14
      }
    ]
  },
  {
    name: 'Enterprise',
    description: 'Unlimited users, custom integrations, and dedicated support for large-scale operations',
    metadata: {
      tier: 'enterprise',
      maxUsers: '100',
      maxEntities: 'unlimited',
      features: JSON.stringify([
        'basic_forecasting',
        'ai_forecasting',
        'what_if_analysis',
        'api_integrations',
        'advanced_reports',
        'custom_integrations',
        'dedicated_support',
        'custom_training'
      ])
    },
    prices: [
      {
        nickname: 'Enterprise Monthly',
        amount: 49900, // $499.00
        interval: 'month',
        trialPeriodDays: 14
      },
      {
        nickname: 'Enterprise Annual',
        amount: 508830, // $5,088.30 (15% discount)
        interval: 'year',
        trialPeriodDays: 14
      }
    ]
  }
]

/**
 * Create or retrieve Stripe product
 */
async function createProduct(tierConfig) {
  console.log(`\n📦 Creating product: ${tierConfig.name}...`)

  try {
    // Check if product already exists
    const existingProducts = await stripe.products.search({
      query: `name:'CapLiquify ${tierConfig.name}' AND active:'true'`
    })

    if (existingProducts.data.length > 0) {
      const product = existingProducts.data[0]
      console.log(`   ✅ Product already exists: ${product.id}`)
      return product
    }

    // Create new product
    const product = await stripe.products.create({
      name: `CapLiquify ${tierConfig.name}`,
      description: tierConfig.description,
      metadata: tierConfig.metadata,
      default_price_data: {
        currency: 'usd',
        unit_amount: tierConfig.prices[0].amount,
        recurring: {
          interval: tierConfig.prices[0].interval,
          trial_period_days: tierConfig.prices[0].trialPeriodDays
        }
      }
    })

    console.log(`   ✅ Created product: ${product.id}`)
    return product
  } catch (error) {
    console.error(`   ❌ Error creating product: ${error.message}`)
    throw error
  }
}

/**
 * Create Stripe price for a product
 */
async function createPrice(productId, priceConfig) {
  console.log(`   💰 Creating price: ${priceConfig.nickname}...`)

  try {
    // Check if price already exists
    const existingPrices = await stripe.prices.list({
      product: productId,
      active: true
    })

    const matchingPrice = existingPrices.data.find(
      (p) =>
        p.unit_amount === priceConfig.amount &&
        p.recurring?.interval === priceConfig.interval
    )

    if (matchingPrice) {
      console.log(`      ✅ Price already exists: ${matchingPrice.id}`)
      return matchingPrice
    }

    // Create new price
    const price = await stripe.prices.create({
      product: productId,
      nickname: priceConfig.nickname,
      currency: 'usd',
      unit_amount: priceConfig.amount,
      recurring: {
        interval: priceConfig.interval,
        trial_period_days: priceConfig.trialPeriodDays
      }
    })

    console.log(`      ✅ Created price: ${price.id} ($${(price.unit_amount / 100).toFixed(2)}/${price.recurring.interval})`)
    return price
  } catch (error) {
    console.error(`      ❌ Error creating price: ${error.message}`)
    throw error
  }
}

/**
 * Main setup function
 */
async function setupStripeProducts() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎯 CapLiquify Stripe Product & Price Setup')
  console.log(`📍 Mode: ${isProduction ? 'PRODUCTION' : 'TEST'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const results = {
    products: [],
    prices: [],
    envVars: []
  }

  for (const tierConfig of TIERS) {
    try {
      // Create product
      const product = await createProduct(tierConfig)
      results.products.push(product)

      // Create prices for this product
      for (const priceConfig of tierConfig.prices) {
        const price = await createPrice(product.id, priceConfig)
        results.prices.push(price)

        // Generate environment variable name
        const envVarName = `STRIPE_PRICE_${tierConfig.metadata.tier.toUpperCase()}_${priceConfig.interval.toUpperCase()}`
        results.envVars.push({ name: envVarName, value: price.id })
      }
    } catch (error) {
      console.error(`\n❌ Failed to setup ${tierConfig.name} tier`)
      continue
    }
  }

  // Print summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Setup Complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('📊 Created Resources:')
  console.log(`   Products: ${results.products.length}`)
  console.log(`   Prices:   ${results.prices.length}\n`)

  console.log('🔧 Environment Variables:')
  console.log('   Copy these to your .env file:\n')
  results.envVars.forEach((envVar) => {
    console.log(`   ${envVar.name}=${envVar.value}`)
  })

  console.log('\n📝 Product IDs:')
  results.products.forEach((product) => {
    console.log(`   ${product.name}: ${product.id}`)
  })

  console.log('\n💰 Price IDs:')
  results.prices.forEach((price) => {
    const interval = price.recurring.interval === 'month' ? 'Monthly' : 'Annual'
    console.log(`   ${price.nickname} (${interval}): ${price.id} - $${(price.unit_amount / 100).toFixed(2)}/${price.recurring.interval}`)
  })

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📖 Next Steps:')
  console.log('   1. Copy environment variables to your .env file')
  console.log('   2. Update render.yaml with environment variables')
  console.log('   3. Configure Stripe webhook endpoint')
  console.log('   4. Test subscription creation flow')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  return results
}

/**
 * Run setup if executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  setupStripeProducts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('\n❌ Setup failed:', error.message)
      process.exit(1)
    })
}

export { setupStripeProducts, TIERS }
