# Multi-Market Configuration Guide

## Overview

The CapLiquify Manufacturing Platform supports global operations across multiple markets with region-specific compliance, currencies, tax calculations, and business rules. This guide covers setup, configuration, and management of multi-market operations.

## Supported Markets

### Primary Markets
- **UK** (United Kingdom) - GBP, VAT, GDPR compliance
- **USA** (United States) - USD, Sales Tax, State regulations
- **EU** (European Union) - EUR, VAT, GDPR compliance
- **ASIA** (Asia Pacific) - Multi-currency, Regional compliance

### Market Configuration Structure

Each market includes:
- Currency and exchange rate management
- Tax calculation rules (VAT, Sales Tax, Customs)
- Regulatory compliance requirements
- Shipping and logistics parameters
- Local business rules and workflows

## Database Configuration

### Market Master Data (`markets` table)

```sql
-- Example market configuration
INSERT INTO markets (code, name, region, currency_code, tax_rate, standard_shipping_days) VALUES
('UK', 'United Kingdom', 'Europe', 'GBP', 0.20, 2),
('USA', 'United States', 'North America', 'USD', 0.0875, 5),
('EU', 'European Union', 'Europe', 'EUR', 0.19, 3),
('ASIA', 'Asia Pacific', 'Asia', 'USD', 0.10, 7);
```

**Key Fields:**
- `code`: Unique market identifier
- `currency_code`: ISO 4217 currency code
- `tax_rate`: Default tax rate (decimal format)
- `regulatory_requirements`: JSON compliance rules
- `import_restrictions`: Trade limitations

### Currency Configuration (`currencies` table)

```sql
-- Multi-currency setup
INSERT INTO currencies (code, name, symbol, decimal_places) VALUES
('GBP', 'British Pound Sterling', '£', 2),
('USD', 'US Dollar', '$', 2),
('EUR', 'Euro', '€', 2),
('JPY', 'Japanese Yen', '¥', 0),
('AUD', 'Australian Dollar', 'A$', 2);
```

### Exchange Rates (`fx_rates` table)

```sql
-- Daily FX rates (automated from ECB/OANDA)
INSERT INTO fx_rates (as_of_date, base_code, quote_code, rate, source) VALUES
('2024-01-15', 'GBP', 'USD', 1.2750, 'ecb'),
('2024-01-15', 'GBP', 'EUR', 1.1650, 'ecb'),
('2024-01-15', 'USD', 'EUR', 0.9137, 'ecb');
```

## Environment Variables

### Market-Specific Configuration

```bash
# Market Configuration
SUPPORTED_MARKETS=UK,USA,EU,ASIA
DEFAULT_MARKET=UK
BASE_CURRENCY=GBP

# UK Market
UK_VAT_RATE=0.20
UK_VAT_THRESHOLD=85000
UK_CUSTOMS_API_URL=https://api.gov.uk/customs

# USA Market  
USA_DEFAULT_SALES_TAX=0.0875
USA_SALES_TAX_API_URL=https://api.taxjar.com
TAXJAR_API_KEY=your_taxjar_key

# EU Market
EU_VAT_RATE=0.19
EU_VAT_OSS_ENABLED=true
EU_CUSTOMS_API_URL=https://ec.europa.eu/api

# Asia Market
ASIA_DEFAULT_CURRENCY=USD
ASIA_TAX_RATE=0.10
```

### FX Rate Providers

```bash
# Exchange Rate APIs
FX_PROVIDER=ecb  # ecb, oanda, xe
ECB_API_URL=https://api.exchangeratesapi.io/v1
OANDA_API_KEY=your_oanda_key
OANDA_API_URL=https://api-fxpractice.oanda.com

# FX Update Schedule
FX_UPDATE_CRON=0 9 * * 1-5  # 9 AM weekdays
FX_RATE_CACHE_HOURS=24
```

## Tax Configuration

### VAT Configuration (UK/EU)

#### VAT Rates Table (`vat_rates`)
```sql
-- UK VAT rates
INSERT INTO vat_rates (country_code, rate_name, rate_pct, valid_from) VALUES
('GB', 'Standard', 0.2000, '2024-01-01'),
('GB', 'Reduced', 0.0500, '2024-01-01'),
('GB', 'Zero', 0.0000, '2024-01-01');

-- EU VAT rates by country
INSERT INTO vat_rates (country_code, rate_name, rate_pct, valid_from) VALUES
('DE', 'Standard', 0.1900, '2024-01-01'),
('FR', 'Standard', 0.2000, '2024-01-01'),
('IT', 'Standard', 0.2200, '2024-01-01'),
('ES', 'Standard', 0.2100, '2024-01-01');
```

#### VAT Calculation Service
```javascript
// services/tax/vatCalculator.js
export class VATCalculator {
  async calculateVAT(amount, countryCode, productCategory = 'standard') {
    const vatRate = await this.getVATRate(countryCode, productCategory);
    const netAmount = amount / (1 + vatRate);
    const vatAmount = amount - netAmount;
    
    return {
      grossAmount: amount,
      netAmount,
      vatAmount,
      vatRate,
      vatRegistration: this.getVATRegistration(countryCode)
    };
  }

  async getVATRate(countryCode, category) {
    const rate = await prisma.vatRate.findFirst({
      where: {
        country_code: countryCode,
        rate_name: this.mapCategoryToRate(category),
        valid_from: { lte: new Date() },
        OR: [
          { valid_to: null },
          { valid_to: { gte: new Date() } }
        ]
      }
    });
    
    return rate?.rate_pct || 0;
  }
}
```

### US Sales Tax Configuration

#### Sales Tax Rates (`sales_tax_us`)
```sql
-- US state sales tax rates
INSERT INTO sales_tax_us (state_code, locality, rate_pct, valid_from) VALUES
('CA', NULL, 0.0725, '2024-01-01'),        -- California base
('CA', 'Los Angeles', 0.1000, '2024-01-01'), -- LA total rate
('NY', NULL, 0.0800, '2024-01-01'),        -- New York base
('TX', NULL, 0.0625, '2024-01-01'),        -- Texas base
('FL', NULL, 0.0600, '2024-01-01');        -- Florida base
```

#### Sales Tax Integration (TaxJar)
```javascript
// services/tax/salesTaxCalculator.js
import TaxJar from 'taxjar';

export class SalesTaxCalculator {
  constructor() {
    this.taxjar = new TaxJar({
      apiKey: process.env.TAXJAR_API_KEY
    });
  }

  async calculateSalesTax(orderData) {
    try {
      const taxCalculation = await this.taxjar.taxForOrder({
        from_country: 'US',
        from_zip: orderData.fromZip,
        from_state: orderData.fromState,
        to_country: 'US',
        to_zip: orderData.toZip,
        to_state: orderData.toState,
        amount: orderData.amount,
        shipping: orderData.shipping || 0,
        line_items: orderData.items
      });

      return {
        totalTax: taxCalculation.tax.amount_to_collect,
        rate: taxCalculation.tax.rate,
        breakdown: taxCalculation.tax.breakdown
      };
    } catch (error) {
      // Fallback to local rates
      return this.calculateLocalSalesTax(orderData);
    }
  }
}
```

## Multi-Currency Operations

### Currency Conversion Service

```javascript
// services/currency/currencyConverter.js
export class CurrencyConverter {
  async convert(amount, fromCurrency, toCurrency, asOfDate = new Date()) {
    if (fromCurrency === toCurrency) {
      return {
        originalAmount: amount,
        convertedAmount: amount,
        rate: 1.0,
        fromCurrency,
        toCurrency
      };
    }

    const rate = await this.getFXRate(fromCurrency, toCurrency, asOfDate);
    const convertedAmount = amount * rate;

    return {
      originalAmount: amount,
      convertedAmount: parseFloat(convertedAmount.toFixed(2)),
      rate,
      fromCurrency,
      toCurrency,
      asOfDate
    };
  }

  async getFXRate(baseCurrency, quoteCurrency, date) {
    const fxRate = await prisma.fxRate.findFirst({
      where: {
        base_code: baseCurrency,
        quote_code: quoteCurrency,
        as_of_date: { lte: date }
      },
      orderBy: { as_of_date: 'desc' }
    });

    if (!fxRate) {
      throw new Error(`FX rate not found: ${baseCurrency}/${quoteCurrency}`);
    }

    return parseFloat(fxRate.rate);
  }
}
```

### Automated FX Rate Updates

```javascript
// services/currency/fxRateUpdater.js
import cron from 'node-cron';

export class FXRateUpdater {
  constructor() {
    this.providers = {
      ecb: new ECBProvider(),
      oanda: new OandaProvider(),
      xe: new XEProvider()
    };
  }

  startAutomaticUpdates() {
    // Update FX rates daily at 9 AM UTC
    cron.schedule('0 9 * * 1-5', async () => {
      await this.updateAllRates();
    });
  }

  async updateAllRates() {
    const currencyPairs = await this.getCurrencyPairs();
    const provider = this.providers[process.env.FX_PROVIDER || 'ecb'];

    for (const pair of currencyPairs) {
      try {
        const rate = await provider.getRate(pair.base, pair.quote);
        
        await prisma.fxRate.create({
          data: {
            as_of_date: new Date(),
            base_code: pair.base,
            quote_code: pair.quote,
            rate: rate,
            source: provider.name
          }
        });

        console.log(`Updated ${pair.base}/${pair.quote}: ${rate}`);
      } catch (error) {
        console.error(`Failed to update ${pair.base}/${pair.quote}:`, error);
      }
    }
  }
}
```

## Sales Channel Configuration

### Multi-Market Sales Channels

```javascript
// Market-specific channel configuration
const MARKET_CHANNELS = {
  UK: [
    {
      name: 'Amazon UK',
      type: 'marketplace',
      api_endpoint: 'https://sellingpartnerapi-eu.amazon.com',
      currency: 'GBP',
      commission_rate: 0.15,
      vat_handling: 'marketplace_collected'
    },
    {
      name: 'Shopify UK',
      type: 'direct',
      currency: 'GBP',
      commission_rate: 0.029,
      vat_handling: 'merchant_collected'
    }
  ],
  USA: [
    {
      name: 'Amazon US',
      type: 'marketplace', 
      api_endpoint: 'https://sellingpartnerapi-na.amazon.com',
      currency: 'USD',
      commission_rate: 0.15,
      tax_handling: 'marketplace_collected'
    },
    {
      name: 'Shopify US',
      type: 'direct',
      currency: 'USD',
      commission_rate: 0.029,
      tax_handling: 'merchant_collected'
    }
  ],
  EU: [
    {
      name: 'Amazon DE',
      type: 'marketplace',
      api_endpoint: 'https://sellingpartnerapi-eu.amazon.com',
      currency: 'EUR',
      commission_rate: 0.15,
      vat_handling: 'marketplace_collected',
      vat_oss: true
    }
  ]
};
```

### Channel Registration Script

```javascript
// scripts/setupMarketChannels.js
export async function setupMarketChannels() {
  for (const [marketCode, channels] of Object.entries(MARKET_CHANNELS)) {
    const market = await prisma.market.findUnique({
      where: { code: marketCode }
    });

    for (const channelConfig of channels) {
      await prisma.salesChannel.create({
        data: {
          name: channelConfig.name,
          channel_type: channelConfig.type,
          market_code: marketCode,
          api_endpoint: channelConfig.api_endpoint,
          commission_rate: channelConfig.commission_rate,
          is_active: true,
          sync_enabled: true,
          sync_frequency_minutes: 60
        }
      });
    }
  }
}
```

## Compliance Configuration

### GDPR Compliance (UK/EU)

```javascript
// services/compliance/gdprCompliance.js
export class GDPRCompliance {
  async handleDataSubjectRequest(requestType, userEmail, marketCode) {
    const isEUMarket = ['UK', 'EU'].includes(marketCode);
    
    if (!isEUMarket) {
      return { applicable: false };
    }

    switch (requestType) {
      case 'access':
        return await this.generateDataExport(userEmail);
      case 'erasure':
        return await this.executeRightToErasure(userEmail);
      case 'portability':
        return await this.generatePortableData(userEmail);
      case 'rectification':
        return await this.updatePersonalData(userEmail);
    }
  }

  async executeRightToErasure(userEmail) {
    // Pseudonymize rather than delete for business records
    const updates = {
      email: `deleted-${Date.now()}@example.com`,
      first_name: 'DELETED',
      last_name: 'DELETED',
      deleted_at: new Date()
    };

    await prisma.user.update({
      where: { email: userEmail },
      data: updates
    });

    return { status: 'completed', timestamp: new Date() };
  }
}
```

### Regional Data Residency

```javascript
// Database configuration for data residency
const DB_REGIONS = {
  UK: process.env.UK_DATABASE_URL,
  EU: process.env.EU_DATABASE_URL,
  USA: process.env.USA_DATABASE_URL,
  ASIA: process.env.ASIA_DATABASE_URL
};

export function getDatabaseForMarket(marketCode) {
  return DB_REGIONS[marketCode] || DB_REGIONS.UK;
}
```

## Working Capital Management

### Multi-Market Cash Flow

```javascript
// services/workingCapital/multiMarketProjection.js
export class MultiMarketWCProjection {
  async generateConsolidatedProjection(entities, baseCurrency = 'GBP') {
    const projections = new Map();

    for (const entity of entities) {
      const entityProjection = await this.generateEntityProjection(entity);
      const convertedProjection = await this.convertToBaseCurrency(
        entityProjection, 
        entity.currency_code, 
        baseCurrency
      );
      
      projections.set(entity.id, convertedProjection);
    }

    return this.consolidateProjections(projections, baseCurrency);
  }

  async convertToBaseCurrency(projection, fromCurrency, toCurrency) {
    const fxRate = await currencyConverter.getFXRate(fromCurrency, toCurrency);
    
    return {
      ...projection,
      projected_sales_revenue: projection.projected_sales_revenue * fxRate,
      accounts_receivable: projection.accounts_receivable * fxRate,
      accounts_payable: projection.accounts_payable * fxRate,
      inventory_value: projection.inventory_value * fxRate,
      net_cash_flow: projection.net_cash_flow * fxRate,
      fx_rate_used: fxRate,
      original_currency: fromCurrency,
      converted_currency: toCurrency
    };
  }
}
```

### Market-Specific Payment Terms

```javascript
// Payment terms by market
const MARKET_PAYMENT_TERMS = {
  UK: {
    standard_terms: 30,
    early_payment_discount: 0.02,
    early_payment_days: 10,
    late_payment_fee: 0.08 // 8% per annum
  },
  USA: {
    standard_terms: 30,
    early_payment_discount: 0.02,
    early_payment_days: 10,
    late_payment_fee: 0.015 // 1.5% per month
  },
  EU: {
    standard_terms: 30,
    early_payment_discount: 0.01,
    early_payment_days: 14,
    late_payment_fee: 0.08 // EU Late Payment Directive
  }
};
```

## Forecasting Configuration

### Market-Specific AI Models

```javascript
// services/ai/marketSpecificForecasting.js
export class MarketSpecificForecasting {
  getMarketPrompt(market, productData, historicalData) {
    const marketContext = MARKET_CONTEXTS[market];
    
    return `
    You are a demand forecasting expert for the ${marketContext.region} market.
    
    Market Context:
    - Currency: ${marketContext.currency}
    - Economic factors: ${marketContext.economicFactors.join(', ')}
    - Seasonal patterns: ${marketContext.seasonality}
    - Consumer behavior: ${marketContext.consumerBehavior}
    - Regulatory environment: ${marketContext.regulations}
    
    Product: ${productData.name}
    Category: ${productData.category}
    
    Historical sales data (${historicalData.length} data points):
    ${this.formatHistoricalData(historicalData)}
    
    Generate a ${marketContext.forecastHorizon}-day demand forecast considering:
    1. Market-specific seasonality patterns
    2. Local economic indicators
    3. Currency fluctuations impact
    4. Regulatory changes
    5. Cultural events and holidays
    
    Return forecast as JSON with daily predictions including confidence intervals.
    `;
  }
}

const MARKET_CONTEXTS = {
  UK: {
    region: 'United Kingdom',
    currency: 'GBP',
    economicFactors: ['Brexit impact', 'inflation', 'energy costs'],
    seasonality: 'Strong Christmas peak, summer lull',
    consumerBehavior: 'Quality-focused, premium willing',
    regulations: 'MHRA, Trading Standards',
    forecastHorizon: 30
  },
  USA: {
    region: 'United States',
    currency: 'USD',
    economicFactors: ['Fed policy', 'supply chain', 'labor market'],
    seasonality: 'Black Friday, Christmas, back-to-school',
    consumerBehavior: 'Value-conscious, convenience-driven',
    regulations: 'FDA, FTC, state-specific',
    forecastHorizon: 30
  }
};
```

## Data Import Configuration

### Market-Specific Import Templates

```javascript
// Multi-market data import configuration
const IMPORT_TEMPLATES = {
  UK_AMAZON: {
    currency: 'GBP',
    tax_inclusive: true,
    date_format: 'DD/MM/YYYY',
    decimal_separator: '.',
    fields: {
      order_date: 'purchase-date',
      amount: 'item-price',
      tax: 'item-tax',
      currency: 'currency'
    },
    validations: {
      vat_rate: { min: 0, max: 0.25 },
      currency: { allowed: ['GBP'] }
    }
  },
  USA_SHOPIFY: {
    currency: 'USD',
    tax_inclusive: false,
    date_format: 'MM/DD/YYYY',
    decimal_separator: '.',
    fields: {
      order_date: 'created_at',
      amount: 'total_price',
      tax: 'total_tax',
      currency: 'currency'
    },
    validations: {
      tax_rate: { min: 0, max: 0.15 },
      currency: { allowed: ['USD'] }
    }
  }
};
```

## API Configuration

### Market-Specific Endpoints

```javascript
// API routing by market
app.get('/api/:market/forecasts', marketMiddleware, (req, res) => {
  const { market } = req.params;
  const marketConfig = getMarketConfig(market);
  
  // Market-specific forecast logic
  const forecasts = await forecastingService.getMarketForecasts(
    market, 
    marketConfig
  );
  
  res.json(forecasts);
});

function marketMiddleware(req, res, next) {
  const { market } = req.params;
  
  if (!SUPPORTED_MARKETS.includes(market)) {
    return res.status(400).json({ 
      error: 'Unsupported market',
      supported: SUPPORTED_MARKETS 
    });
  }
  
  req.marketConfig = getMarketConfig(market);
  next();
}
```

### Rate Limiting by Market

```javascript
// Market-specific rate limiting
const marketLimiters = {
  UK: rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }),
  USA: rateLimit({ windowMs: 15 * 60 * 1000, max: 1500 }),
  EU: rateLimit({ windowMs: 15 * 60 * 1000, max: 800 }),
  ASIA: rateLimit({ windowMs: 15 * 60 * 1000, max: 500 })
};

app.use('/api/:market', (req, res, next) => {
  const limiter = marketLimiters[req.params.market];
  if (limiter) {
    limiter(req, res, next);
  } else {
    next();
  }
});
```

## Frontend Configuration

### Market Selection Component

```javascript
// src/components/MarketSelector.jsx
export const MarketSelector = ({ onMarketChange, currentMarket }) => {
  const markets = [
    { code: 'UK', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
    { code: 'USA', name: 'United States', currency: 'USD', flag: '🇺🇸' },
    { code: 'EU', name: 'European Union', currency: 'EUR', flag: '🇪🇺' },
    { code: 'ASIA', name: 'Asia Pacific', currency: 'USD', flag: '🌏' }
  ];

  return (
    <div className="market-selector">
      {markets.map(market => (
        <button
          key={market.code}
          className={`market-option ${currentMarket === market.code ? 'active' : ''}`}
          onClick={() => onMarketChange(market.code)}
        >
          <span className="flag">{market.flag}</span>
          <span className="name">{market.name}</span>
          <span className="currency">{market.currency}</span>
        </button>
      ))}
    </div>
  );
};
```

### Currency Display Formatting

```javascript
// src/utils/currencyFormatter.js
export const formatCurrency = (amount, currency, locale = 'en-GB') => {
  const localeMap = {
    GBP: 'en-GB',
    USD: 'en-US',
    EUR: 'en-GB', // Use GB formatting for EUR
    JPY: 'ja-JP'
  };

  return new Intl.NumberFormat(localeMap[currency] || locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(amount);
};

export const getCurrencySymbol = (currency) => {
  const symbols = {
    GBP: '£',
    USD: '$',
    EUR: '€',
    JPY: '¥'
  };
  return symbols[currency] || currency;
};
```

## Monitoring and Alerts

### Market-Specific Health Checks

```javascript
// services/monitoring/marketHealthChecks.js
export class MarketHealthChecks {
  async checkMarketHealth(marketCode) {
    const checks = {
      currency: await this.checkCurrencyRates(marketCode),
      tax: await this.checkTaxRates(marketCode),
      compliance: await this.checkCompliance(marketCode),
      channels: await this.checkSalesChannels(marketCode),
      forecasting: await this.checkForecastingAccuracy(marketCode)
    };

    const overallHealth = Object.values(checks).every(c => c.status === 'healthy');
    
    return {
      market: marketCode,
      overall: overallHealth ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date()
    };
  }

  async checkCurrencyRates(marketCode) {
    const market = await prisma.market.findUnique({
      where: { code: marketCode }
    });

    const latestRate = await prisma.fxRate.findFirst({
      where: { 
        OR: [
          { base_code: market.currency_code },
          { quote_code: market.currency_code }
        ]
      },
      orderBy: { as_of_date: 'desc' }
    });

    const isStale = Date.now() - latestRate.as_of_date.getTime() > 86400000; // 24 hours

    return {
      status: isStale ? 'warning' : 'healthy',
      message: isStale ? 'FX rates are stale' : 'FX rates current',
      lastUpdate: latestRate.as_of_date
    };
  }
}
```

## Deployment Considerations

### Environment-Specific Settings

```bash
# Development
NODE_ENV=development
SUPPORTED_MARKETS=UK,USA
DEFAULT_MARKET=UK
FX_UPDATE_ENABLED=false

# Production
NODE_ENV=production
SUPPORTED_MARKETS=UK,USA,EU,ASIA
DEFAULT_MARKET=UK
FX_UPDATE_ENABLED=true
FX_PROVIDER=oanda
```

### Database Migrations

```sql
-- Market data migration script
-- migrations/001_setup_markets.sql

-- Create markets
INSERT INTO markets (id, code, name, region, currency_code, tax_rate, is_active) VALUES
(gen_random_uuid(), 'UK', 'United Kingdom', 'Europe', 'GBP', 0.20, true),
(gen_random_uuid(), 'USA', 'United States', 'North America', 'USD', 0.0875, true),
(gen_random_uuid(), 'EU', 'European Union', 'Europe', 'EUR', 0.19, true),
(gen_random_uuid(), 'ASIA', 'Asia Pacific', 'Asia', 'USD', 0.10, true);

-- Create currencies
INSERT INTO currencies (code, name, symbol, decimal_places, is_active) VALUES
('GBP', 'British Pound Sterling', '£', 2, true),
('USD', 'US Dollar', '$', 2, true),
('EUR', 'Euro', '€', 2, true),
('JPY', 'Japanese Yen', '¥', 0, true);

-- Create initial FX rates
INSERT INTO fx_rates (id, as_of_date, base_code, quote_code, rate, source) VALUES
(gen_random_uuid(), CURRENT_DATE, 'GBP', 'USD', 1.27, 'manual'),
(gen_random_uuid(), CURRENT_DATE, 'GBP', 'EUR', 1.16, 'manual'),
(gen_random_uuid(), CURRENT_DATE, 'USD', 'EUR', 0.91, 'manual');
```

## Testing Multi-Market Setup

### Integration Tests

```javascript
// tests/integration/multiMarket.test.js
describe('Multi-Market Operations', () => {
  test('should convert currencies correctly', async () => {
    const converter = new CurrencyConverter();
    const result = await converter.convert(100, 'GBP', 'USD');
    
    expect(result.originalAmount).toBe(100);
    expect(result.convertedAmount).toBeGreaterThan(100);
    expect(result.fromCurrency).toBe('GBP');
    expect(result.toCurrency).toBe('USD');
  });

  test('should calculate VAT for UK market', async () => {
    const calculator = new VATCalculator();
    const result = await calculator.calculateVAT(120, 'GB');
    
    expect(result.vatAmount).toBe(20);
    expect(result.netAmount).toBe(100);
    expect(result.vatRate).toBe(0.20);
  });

  test('should generate market-specific forecasts', async () => {
    const forecaster = new MarketSpecificForecasting();
    const forecast = await forecaster.generateForecast('UK', mockProductData, mockHistoricalData);
    
    expect(forecast.market).toBe('UK');
    expect(forecast.currency).toBe('GBP');
    expect(forecast.daily_forecast).toHaveLength(30);
  });
});
```

### Manual Testing Checklist

- [ ] Currency conversion calculations are accurate
- [ ] Tax calculations match local requirements
- [ ] FX rates update automatically
- [ ] Market-specific forecasts generate correctly
- [ ] Sales channel integrations work per market
- [ ] Compliance features function (GDPR, etc.)
- [ ] Multi-currency financial reports are accurate
- [ ] Data imports handle market-specific formats
- [ ] User interface displays correct currencies and formats
- [ ] Health checks monitor all market components

## Support and Maintenance

### Common Issues
- **FX Rate Failures**: Check API credentials and rate limits
- **Tax Calculation Errors**: Verify tax rate tables are current
- **Currency Formatting**: Ensure locale settings are correct
- **Compliance Violations**: Review regulatory requirements
- **Performance Issues**: Monitor database queries across markets

### Maintenance Schedule
- Daily: FX rate updates
- Weekly: Tax rate validation
- Monthly: Compliance review
- Quarterly: Market performance analysis
- Annually: Regulatory requirement updates

### Contact Information
- Market Configuration: config@sentia.ai
- Compliance Issues: compliance@sentia.ai
- Technical Support: support@sentia.ai