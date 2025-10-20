import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting CapLiquify Platform database seed...');

  try {
    // Clear existing data (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('Clearing existing data...');
      await prisma.historical_sales.deleteMany();
      await prisma.forecasts.deleteMany();
      await prisma.inventory_levels.deleteMany();
      await prisma.working_capital.deleteMany();
      await prisma.products.deleteMany();
      await prisma.sales_channels.deleteMany();
      await prisma.markets.deleteMany();
      await prisma.currencies.deleteMany();
      await prisma.users.deleteMany();
    }

    // Create currencies first
    console.log('Creating currencies...');
    await prisma.currencies.createMany({
      data: [
        {
          code: 'GBP',
          name: 'British Pound Sterling',
          symbol: '£',
          decimal_places: 2,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          code: 'EUR',
          name: 'Euro',
          symbol: '€',
          decimal_places: 2,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          code: 'USD',
          name: 'US Dollar',
          symbol: '$',
          decimal_places: 2,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ]
    });

    // Create admin user
    console.log('Creating admin user...');
    const adminUser = await prisma.users.create({
      data: {
        id: uuidv4(),
        username: 'admin',
        email: 'admin@sentiamanufacturing.com',
        role: 'admin',
        is_active: true,
        is_admin: true,
        permissions: {
          canManageUsers: true,
          canManageProducts: true,
          canViewReports: true,
          canManageSettings: true,
        },
        two_factor_enabled: false,
        force_password_change: false,
        created_at: new Date(),
        updated_at: new Date()
      },
    });

    // Create markets
    console.log('Creating markets...');
    const ukMarket = await prisma.markets.create({
      data: {
        id: uuidv4(),
        code: 'UK',
        name: 'United Kingdom',
        region: 'Europe',
        currency_code: 'GBP',
        tax_rate: 0.2000, // 20% VAT
        standard_shipping_days: 2,
        express_shipping_days: 1,
        regulatory_requirements: {
          notes: 'MHRA regulations, post-Brexit compliance',
          certifications: ['MHRA', 'UK-CA']
        },
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: adminUser.id,
      },
    });

    const euMarket = await prisma.markets.create({
      data: {
        id: uuidv4(),
        code: 'EU',
        name: 'European Union',
        region: 'Europe',
        currency_code: 'EUR',
        tax_rate: 0.1900, // 19% VAT
        standard_shipping_days: 5,
        express_shipping_days: 3,
        regulatory_requirements: {
          notes: 'EU Novel Food regulations, multilingual labeling',
          certifications: ['EU-NF', 'CE']
        },
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: adminUser.id,
      },
    });

    const usMarket = await prisma.markets.create({
      data: {
        id: uuidv4(),
        code: 'USA',
        name: 'United States',
        region: 'North America',
        currency_code: 'USD',
        tax_rate: 0.0800, // 8% Sales Tax
        standard_shipping_days: 7,
        express_shipping_days: 3,
        regulatory_requirements: {
          notes: 'FDA regulations, state-specific requirements',
          certifications: ['FDA', 'USDA']
        },
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: adminUser.id,
      },
    });

    // Create products (9 SKUs: 3 products × 3 regions)
    console.log('Creating Sentia products (9 SKUs)...');
    const products = [];
    const categories = ['GABA Red', 'GABA Black', 'GABA Gold'];
    const markets = [
      { code: 'UK', cost: 15.00, price: 29.99 },
      { code: 'EU', cost: 16.50, price: 34.99 },
      { code: 'USA', cost: 18.00, price: 39.99 },
    ];

    for (const category of categories) {
      for (const market of markets) {
        const product = await prisma.products.create({
          data: {
            id: uuidv4(),
            sku: `${category.replace(' ', '_').toUpperCase()}_${market.code}`,
            name: `${category} - ${market.code}`,
            category: category,
            market_region: market.code,
            weight_kg: 0.5,
            dimensions_cm: '10x5x5',
            unit_cost: market.cost,
            selling_price: market.price,
            production_time_hours: 3.5,
            batch_size_min: 100,
            batch_size_max: 1000,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: adminUser.id,
          },
        });
        products.push(product);
      }
    }

    // Create sales channels (5 channels: 2 Amazon + 3 Shopify)
    console.log('Creating sales channels...');
    const salesChannels = [];
    
    // Amazon UK
    const amazonUK = await prisma.sales_channels.create({
      data: {
        id: uuidv4(),
        name: 'Amazon UK',
        channel_type: 'Amazon',
        market_code: 'UK',
        api_endpoint: 'https://sellingpartnerapi-eu.amazon.com',
        marketplace_id: 'A1F83G8C2ARO7P',
        commission_rate: 0.15,
        fulfillment_method: 'FBA',
        average_processing_days: 2,
        sync_enabled: true,
        sync_frequency_minutes: 60,
        sync_status: 'active',
        conversion_rate: 0.12,
        monthly_sales_target: 50000.00,
        return_rate: 0.05,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: adminUser.id,
      },
    });
    salesChannels.push(amazonUK);

    // Amazon USA
    const amazonUSA = await prisma.sales_channels.create({
      data: {
        id: uuidv4(),
        name: 'Amazon USA',
        channel_type: 'Amazon',
        market_code: 'USA',
        api_endpoint: 'https://sellingpartnerapi-na.amazon.com',
        marketplace_id: 'ATVPDKIKX0DER',
        commission_rate: 0.15,
        fulfillment_method: 'FBA',
        average_processing_days: 3,
        sync_enabled: true,
        sync_frequency_minutes: 60,
        sync_status: 'active',
        conversion_rate: 0.10,
        monthly_sales_target: 75000.00,
        return_rate: 0.06,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: adminUser.id,
      },
    });
    salesChannels.push(amazonUSA);

    // Shopify UK
    const shopifyUK = await prisma.sales_channels.create({
      data: {
        id: uuidv4(),
        name: 'Shopify UK',
        channel_type: 'Shopify',
        market_code: 'UK',
        api_endpoint: 'https://sentia-uk.myshopify.com',
        commission_rate: 0.029,
        fulfillment_method: 'Own',
        average_processing_days: 1,
        sync_enabled: true,
        sync_frequency_minutes: 30,
        sync_status: 'active',
        conversion_rate: 0.08,
        monthly_sales_target: 25000.00,
        return_rate: 0.03,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: adminUser.id,
      },
    });
    salesChannels.push(shopifyUK);

    // Shopify EU
    const shopifyEU = await prisma.sales_channels.create({
      data: {
        id: uuidv4(),
        name: 'Shopify EU',
        channel_type: 'Shopify',
        market_code: 'EU',
        api_endpoint: 'https://sentia-eu.myshopify.com',
        commission_rate: 0.029,
        fulfillment_method: 'Own',
        average_processing_days: 2,
        sync_enabled: true,
        sync_frequency_minutes: 30,
        sync_status: 'active',
        conversion_rate: 0.06,
        monthly_sales_target: 30000.00,
        return_rate: 0.04,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: adminUser.id,
      },
    });
    salesChannels.push(shopifyEU);

    // Shopify USA
    const shopifyUSA = await prisma.sales_channels.create({
      data: {
        id: uuidv4(),
        name: 'Shopify USA',
        channel_type: 'Shopify',
        market_code: 'USA',
        api_endpoint: 'https://sentia-usa.myshopify.com',
        commission_rate: 0.029,
        fulfillment_method: 'Own',
        average_processing_days: 2,
        sync_enabled: true,
        sync_frequency_minutes: 30,
        sync_status: 'active',
        conversion_rate: 0.07,
        monthly_sales_target: 35000.00,
        return_rate: 0.03,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: adminUser.id,
      },
    });
    salesChannels.push(shopifyUSA);

    // Create inventory levels for each product
    console.log('Creating inventory levels...');
    for (const product of products) {
      await prisma.inventory_levels.create({
        data: {
          id: uuidv4(),
          product_id: product.id,
          location_type: 'warehouse',
          location_id: 'WH-001',
          location_name: 'Main Warehouse',
          country_code: product.market_region,
          available_quantity: Math.floor(200 + Math.random() * 800),
          reserved_quantity: Math.floor(10 + Math.random() * 50),
          inbound_quantity: Math.floor(50 + Math.random() * 200),
          defective_quantity: Math.floor(0 + Math.random() * 10),
          total_quantity: Math.floor(260 + Math.random() * 1060),
          reorder_point: Math.floor(50 + Math.random() * 100),
          safety_stock: Math.floor(25 + Math.random() * 75),
          maximum_stock: 1000,
          economic_order_quantity: Math.floor(200 + Math.random() * 300),
          unit_cost: product.unit_cost,
          total_value: product.unit_cost * Math.floor(260 + Math.random() * 1060),
          storage_cost_per_unit_monthly: 0.5,
          average_age_days: Math.floor(15 + Math.random() * 45),
          turnover_rate_monthly: 2.5 + Math.random() * 2,
          expected_demand_30d: Math.floor(100 + Math.random() * 300),
          days_of_supply: Math.floor(30 + Math.random() * 60),
          stock_out_risk_score: Math.random() * 0.5,
          status: 'active',
          snapshot_date: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          created_by: adminUser.id,
        },
      });
    }

    // Create historical sales data for the last 6 months
    console.log('Creating historical sales data...');
    const salesData = [];
    for (let monthsBack = 6; monthsBack >= 0; monthsBack--) {
      for (const product of products) {
        for (const channel of salesChannels) {
          if (channel.market_code === product.market_region) {
            const saleDate = new Date();
            saleDate.setMonth(saleDate.getMonth() - monthsBack);
            
            const quantity = Math.floor(10 + Math.random() * 90);
            const unitPrice = product.selling_price;
            const grossRevenue = quantity * unitPrice;
            const discounts = grossRevenue * 0.05; // 5% average discount
            const netRevenue = grossRevenue - discounts;
            const platformFees = netRevenue * channel.commission_rate;
            const cogs = quantity * product.unit_cost;
            
            await prisma.historical_sales.create({
              data: {
                id: uuidv4(),
                product_id: product.id,
                sales_channel_id: channel.id,
                sale_date: saleDate,
                sale_datetime: saleDate,
                quantity_sold: quantity,
                unit_price: unitPrice,
                gross_revenue: grossRevenue,
                discounts: discounts,
                net_revenue: netRevenue,
                cost_of_goods_sold: cogs,
                shipping_cost: 5.00,
                platform_fees: platformFees,
                taxes: netRevenue * 0.08,
                net_profit: netRevenue - cogs - platformFees - 5.00,
                order_id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                customer_type: 'B2C',
                fulfillment_method: channel.fulfillment_method,
                shipping_country: product.market_region,
                season: getSeason(saleDate),
                data_source: channel.channel_type,
                data_quality_score: 0.95,
                is_validated: true,
                created_at: saleDate,
                updated_at: saleDate,
                created_by: adminUser.id,
              },
            });
          }
        }
      }
    }

    // Create working capital projections
    console.log('Creating working capital data...');
    for (let monthsBack = 12; monthsBack >= 0; monthsBack--) {
      const projectionDate = new Date();
      projectionDate.setMonth(projectionDate.getMonth() - monthsBack);
      projectionDate.setDate(1); // First day of month
      
      const currentAssets = 2000000 + Math.random() * 1000000;
      const currentLiabilities = 1200000 + Math.random() * 600000;
      const workingCapital = currentAssets - currentLiabilities;
      
      await prisma.working_capital.create({
        data: {
          id: uuidv4(),
          projection_date: projectionDate,
          projection_period: 'monthly',
          currency_code: 'GBP',
          projected_sales_revenue: 180000 + Math.random() * 40000,
          payment_terms_days: 30,
          collection_rate: 0.95,
          cost_of_goods_sold: 120000 + Math.random() * 25000,
          inventory_investment: 400000 + Math.random() * 100000,
          manufacturing_costs: 80000 + Math.random() * 20000,
          raw_materials_cost: 60000 + Math.random() * 15000,
          labor_costs: 45000 + Math.random() * 10000,
          marketing_spend: 15000 + Math.random() * 5000,
          platform_fees: 12000 + Math.random() * 3000,
          shipping_costs: 8000 + Math.random() * 2000,
          storage_fees: 5000 + Math.random() * 1500,
          administrative_costs: 25000 + Math.random() * 5000,
          accounts_receivable: 150000 + Math.random() * 50000,
          inventory_value: 400000 + Math.random() * 100000,
          accounts_payable: 100000 + Math.random() * 30000,
          accrued_expenses: 50000 + Math.random() * 15000,
          net_cash_flow: 60000 + Math.random() * 40000,
          cash_conversion_cycle_days: 45 + Math.floor(Math.random() * 30),
          working_capital_requirement: workingCapital,
          working_capital_turnover: 4.5 + Math.random() * 2,
          days_sales_outstanding: 35 + Math.floor(Math.random() * 15),
          days_inventory_outstanding: 45 + Math.floor(Math.random() * 20),
          days_payable_outstanding: 30 + Math.floor(Math.random() * 15),
          scenario_type: monthsBack > 3 ? 'forecast' : 'actual',
          confidence_level: monthsBack > 3 ? 0.80 : 0.95,
          status: 'approved',
          is_approved: true,
          approved_by: adminUser.id,
          approved_at: new Date(),
          created_at: projectionDate,
          updated_at: projectionDate,
          created_by: adminUser.id,
        },
      });
    }

    console.log('CapLiquify Platform database seed completed successfully!');
    console.log(`Created:`);
    console.log(`- 3 currencies (GBP, EUR, USD)`);
    console.log(`- 1 admin user`);
    console.log(`- 3 markets (UK, EU, USA)`);
    console.log(`- 9 products (3 GABA variants × 3 regions)`);
    console.log(`- 5 sales channels (2 Amazon, 3 Shopify)`);
    console.log(`- ${products.length} inventory level records`);
    console.log(`- Historical sales data for 6 months`);
    console.log(`- Working capital projections for 12 months`);

  } catch (error) {
    console.error('Error during seed:', error);
    throw error;
  }
}

function getSeason(date) {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Autumn';
  return 'Winter';
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });