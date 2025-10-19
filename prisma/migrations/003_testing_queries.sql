-- CapLiquify Multi-Tenant Database Testing Queries
-- File: 003_testing_queries.sql
-- Description: Comprehensive testing and verification queries
-- Date: October 19, 2025

-- ============================================================================
-- TEST 1: Create Test Tenant
-- ============================================================================

-- Step 1.1: Insert tenant record
INSERT INTO public.tenants (
  slug,
  name,
  schema_name,
  clerk_organization_id,
  subscription_tier,
  subscription_status,
  trial_ends_at,
  max_users,
  max_entities,
  features
) VALUES (
  'acme-manufacturing',
  'ACME Manufacturing Ltd',
  'tenant_test123',
  'org_clerk_acme_test_12345',
  'professional',
  'trial',
  NOW() + INTERVAL '14 days',
  10,
  1000,
  '{"ai_forecasting": true, "what_if": true, "api_integrations": true, "advanced_reports": true}'::JSONB
) RETURNING *;

-- Step 1.2: Create tenant schema
SELECT create_tenant_schema((SELECT id FROM public.tenants WHERE slug = 'acme-manufacturing'));

-- Step 1.3: Create test user
INSERT INTO public.users (
  clerk_user_id,
  email,
  full_name,
  tenant_id,
  role
) VALUES (
  'user_clerk_test_owner_12345',
  'owner@acme-manufacturing.com',
  'John Doe',
  (SELECT id FROM public.tenants WHERE slug = 'acme-manufacturing'),
  'owner'
) RETURNING *;

-- Step 1.4: Create subscription
INSERT INTO public.subscriptions (
  tenant_id,
  billing_cycle,
  amount_cents,
  status,
  current_period_start,
  current_period_end
) VALUES (
  (SELECT id FROM public.tenants WHERE slug = 'acme-manufacturing'),
  'monthly',
  9900, -- $99.00
  'trial',
  NOW(),
  NOW() + INTERVAL '14 days'
) RETURNING *;

-- ============================================================================
-- TEST 2: Insert Sample Data into Tenant Schema
-- ============================================================================

-- Note: Replace 'tenant_test123' with actual schema name from Step 1.2

-- Step 2.1: Create test company
INSERT INTO tenant_test123.companies (
  name,
  legal_name,
  tax_id,
  currency,
  fiscal_year_end,
  settings
) VALUES (
  'ACME Manufacturing',
  'ACME Manufacturing Ltd',
  '12-3456789',
  'USD',
  '12-31',
  '{"accounting_method": "accrual", "inventory_method": "fifo"}'::JSONB
) RETURNING *;

-- Step 2.2: Create test products
INSERT INTO tenant_test123.products (
  company_id,
  sku,
  name,
  description,
  category,
  unit_cost,
  unit_price,
  reorder_point,
  reorder_quantity,
  lead_time_days
) VALUES
  (
    (SELECT id FROM tenant_test123.companies LIMIT 1),
    'WID-001',
    'Premium Widget',
    'High-quality precision widget for manufacturing',
    'Widgets',
    25.00,
    50.00,
    100,
    500,
    14
  ),
  (
    (SELECT id FROM tenant_test123.companies LIMIT 1),
    'GAD-001',
    'Industrial Gadget',
    'Heavy-duty gadget for industrial applications',
    'Gadgets',
    75.00,
    150.00,
    50,
    200,
    21
  ),
  (
    (SELECT id FROM tenant_test123.companies LIMIT 1),
    'SPR-001',
    'Precision Sprocket',
    'High-precision sprocket assembly',
    'Components',
    15.00,
    35.00,
    200,
    1000,
    7
  )
RETURNING *;

-- Step 2.3: Create test sales
INSERT INTO tenant_test123.sales (
  company_id,
  product_id,
  sale_date,
  quantity,
  unit_price,
  total_amount,
  channel,
  customer_name
) VALUES
  (
    (SELECT id FROM tenant_test123.companies LIMIT 1),
    (SELECT id FROM tenant_test123.products WHERE sku = 'WID-001'),
    CURRENT_DATE - INTERVAL '7 days',
    50,
    50.00,
    2500.00,
    'shopify',
    'TechCorp Industries'
  ),
  (
    (SELECT id FROM tenant_test123.companies LIMIT 1),
    (SELECT id FROM tenant_test123.products WHERE sku = 'GAD-001'),
    CURRENT_DATE - INTERVAL '5 days',
    20,
    150.00,
    3000.00,
    'amazon',
    'BuildRight Solutions'
  ),
  (
    (SELECT id FROM tenant_test123.companies LIMIT 1),
    (SELECT id FROM tenant_test123.products WHERE sku = 'SPR-001'),
    CURRENT_DATE - INTERVAL '3 days',
    100,
    35.00,
    3500.00,
    'direct',
    'ManuFact Global'
  )
RETURNING *;

-- Step 2.4: Create test inventory
INSERT INTO tenant_test123.inventory (
  company_id,
  product_id,
  warehouse_location,
  quantity_on_hand,
  quantity_reserved,
  unit_cost
) VALUES
  (
    (SELECT id FROM tenant_test123.companies LIMIT 1),
    (SELECT id FROM tenant_test123.products WHERE sku = 'WID-001'),
    'Warehouse A',
    450,
    50,
    25.00
  ),
  (
    (SELECT id FROM tenant_test123.companies LIMIT 1),
    (SELECT id FROM tenant_test123.products WHERE sku = 'GAD-001'),
    'Warehouse A',
    180,
    20,
    75.00
  ),
  (
    (SELECT id FROM tenant_test123.companies LIMIT 1),
    (SELECT id FROM tenant_test123.products WHERE sku = 'SPR-001'),
    'Warehouse B',
    900,
    100,
    15.00
  )
RETURNING *;

-- Step 2.5: Create test forecasts
INSERT INTO tenant_test123.forecasts (
  company_id,
  product_id,
  forecast_date,
  forecast_type,
  model_type,
  predicted_value,
  lower_bound,
  upper_bound,
  confidence_level
) VALUES
  (
    (SELECT id FROM tenant_test123.companies LIMIT 1),
    (SELECT id FROM tenant_test123.products WHERE sku = 'WID-001'),
    CURRENT_DATE + INTERVAL '30 days',
    'demand',
    'ensemble',
    65,
    55,
    75,
    85.5
  ),
  (
    (SELECT id FROM tenant_test123.companies LIMIT 1),
    (SELECT id FROM tenant_test123.products WHERE sku = 'GAD-001'),
    CURRENT_DATE + INTERVAL '30 days',
    'demand',
    'arima',
    28,
    22,
    34,
    80.0
  )
RETURNING *;

-- Step 2.6: Create test working capital metrics
INSERT INTO tenant_test123.working_capital_metrics (
  company_id,
  period_date,
  period_type,
  cash,
  accounts_receivable,
  inventory,
  accounts_payable,
  short_term_debt,
  working_capital,
  current_ratio,
  quick_ratio,
  days_sales_outstanding,
  days_inventory_outstanding,
  days_payables_outstanding,
  cash_conversion_cycle,
  operating_cash_flow,
  cash_runway_days
) VALUES
  (
    (SELECT id FROM tenant_test123.companies LIMIT 1),
    CURRENT_DATE,
    'monthly',
    125000.00,
    85000.00,
    145000.00,
    95000.00,
    50000.00,
    210000.00, -- working_capital = (cash + AR + inventory) - (AP + short-term debt)
    2.45,      -- current_ratio
    1.45,      -- quick_ratio
    32.5,      -- days_sales_outstanding
    45.2,      -- days_inventory_outstanding
    28.7,      -- days_payables_outstanding
    49.0,      -- cash_conversion_cycle (DSO + DIO - DPO)
    42000.00,  -- operating_cash_flow
    90         -- cash_runway_days
  )
RETURNING *;

-- ============================================================================
-- TEST 3: Query Data from Specific Tenant
-- ============================================================================

-- Query 3.1: Get tenant overview
SELECT
  t.name AS tenant_name,
  t.slug,
  t.subscription_tier,
  t.subscription_status,
  COUNT(DISTINCT u.id) AS user_count,
  s.billing_cycle,
  s.amount_cents / 100.0 AS monthly_price,
  t.trial_ends_at
FROM public.tenants t
LEFT JOIN public.users u ON u.tenant_id = t.id
LEFT JOIN public.subscriptions s ON s.tenant_id = t.id
WHERE t.slug = 'acme-manufacturing'
GROUP BY t.id, s.id;

-- Query 3.2: Get tenant's products with inventory
SELECT
  p.sku,
  p.name,
  p.category,
  p.unit_cost,
  p.unit_price,
  p.unit_price - p.unit_cost AS margin,
  i.quantity_on_hand,
  i.quantity_reserved,
  i.quantity_available,
  i.total_value
FROM tenant_test123.products p
LEFT JOIN tenant_test123.inventory i ON i.product_id = p.id
ORDER BY p.name;

-- Query 3.3: Get tenant's recent sales
SELECT
  s.sale_date,
  p.sku,
  p.name AS product_name,
  s.quantity,
  s.unit_price,
  s.total_amount,
  s.channel,
  s.customer_name
FROM tenant_test123.sales s
JOIN tenant_test123.products p ON p.id = s.product_id
ORDER BY s.sale_date DESC
LIMIT 10;

-- Query 3.4: Get tenant's forecasts
SELECT
  p.sku,
  p.name AS product_name,
  f.forecast_date,
  f.forecast_type,
  f.model_type,
  f.predicted_value,
  f.lower_bound,
  f.upper_bound,
  f.confidence_level
FROM tenant_test123.forecasts f
JOIN tenant_test123.products p ON p.id = f.product_id
ORDER BY f.forecast_date;

-- Query 3.5: Get tenant's working capital metrics
SELECT
  period_date,
  period_type,
  cash,
  accounts_receivable,
  inventory,
  accounts_payable,
  working_capital,
  current_ratio,
  cash_conversion_cycle,
  cash_runway_days
FROM tenant_test123.working_capital_metrics
ORDER BY period_date DESC
LIMIT 1;

-- ============================================================================
-- TEST 4: Create Second Tenant (for isolation testing)
-- ============================================================================

-- Step 4.1: Insert second tenant
INSERT INTO public.tenants (
  slug,
  name,
  schema_name,
  clerk_organization_id,
  subscription_tier,
  subscription_status,
  max_users,
  max_entities
) VALUES (
  'beta-industries',
  'Beta Industries Inc',
  'tenant_beta456',
  'org_clerk_beta_test_67890',
  'starter',
  'trial',
  5,
  500
) RETURNING *;

-- Step 4.2: Create second tenant schema
SELECT create_tenant_schema((SELECT id FROM public.tenants WHERE slug = 'beta-industries'));

-- Step 4.3: Insert company into second tenant
INSERT INTO tenant_beta456.companies (
  name,
  legal_name,
  currency
) VALUES (
  'Beta Industries',
  'Beta Industries Inc',
  'USD'
) RETURNING *;

-- Step 4.4: Insert product into second tenant
INSERT INTO tenant_beta456.products (
  company_id,
  sku,
  name,
  unit_cost,
  unit_price
) VALUES (
  (SELECT id FROM tenant_beta456.companies LIMIT 1),
  'BETA-001',
  'Beta Product Alpha',
  100.00,
  200.00
) RETURNING *;

-- ============================================================================
-- TEST 5: Verify Tenant Isolation
-- ============================================================================

-- Test 5.1: Verify Tenant A cannot access Tenant B's data
-- This query should return data from ACME Manufacturing only
SELECT
  'ACME Schema' AS source,
  COUNT(*) AS product_count
FROM tenant_test123.products;

-- This query should return data from Beta Industries only
SELECT
  'Beta Schema' AS source,
  COUNT(*) AS product_count
FROM tenant_beta456.products;

-- Test 5.2: Verify cross-tenant query isolation
-- This should show that each tenant has separate product catalogs
SELECT
  t.name AS tenant_name,
  t.schema_name,
  (
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = t.schema_name
    AND table_type = 'BASE TABLE'
  ) AS table_count
FROM public.tenants t
WHERE t.schema_name LIKE 'tenant_%'
ORDER BY t.name;

-- Test 5.3: Verify users are associated with correct tenant
SELECT
  u.email,
  u.role,
  t.name AS tenant_name,
  t.slug
FROM public.users u
JOIN public.tenants t ON t.id = u.tenant_id
ORDER BY t.name, u.email;

-- Test 5.4: Verify subscriptions are tenant-specific
SELECT
  t.name AS tenant_name,
  t.subscription_tier,
  s.billing_cycle,
  s.amount_cents / 100.0 AS price,
  s.status
FROM public.tenants t
LEFT JOIN public.subscriptions s ON s.tenant_id = t.id
ORDER BY t.name;

-- ============================================================================
-- TEST 6: Audit Log Testing
-- ============================================================================

-- Test 6.1: Insert audit log entries
INSERT INTO public.audit_logs (
  tenant_id,
  user_id,
  action,
  resource_type,
  resource_id,
  metadata
) VALUES
  (
    (SELECT id FROM public.tenants WHERE slug = 'acme-manufacturing'),
    (SELECT id FROM public.users WHERE email = 'owner@acme-manufacturing.com'),
    'user.login',
    'user',
    (SELECT id::TEXT FROM public.users WHERE email = 'owner@acme-manufacturing.com'),
    '{"ip": "192.168.1.100", "device": "Chrome/Windows"}'::JSONB
  ),
  (
    (SELECT id FROM public.tenants WHERE slug = 'acme-manufacturing'),
    (SELECT id FROM public.users WHERE email = 'owner@acme-manufacturing.com'),
    'forecast.generated',
    'forecast',
    (SELECT id::TEXT FROM tenant_test123.forecasts LIMIT 1),
    '{"model": "ensemble", "confidence": 85.5}'::JSONB
  )
RETURNING *;

-- Test 6.2: Query audit logs for specific tenant
SELECT
  al.created_at,
  al.action,
  u.email AS user_email,
  al.resource_type,
  al.metadata
FROM public.audit_logs al
LEFT JOIN public.users u ON u.id = al.user_id
WHERE al.tenant_id = (SELECT id FROM public.tenants WHERE slug = 'acme-manufacturing')
ORDER BY al.created_at DESC
LIMIT 10;

-- ============================================================================
-- TEST 7: Performance & Statistics
-- ============================================================================

-- Test 7.1: Get database size statistics
SELECT
  schema_name,
  pg_size_pretty(SUM(pg_total_relation_size(quote_ident(schema_name) || '.' || quote_ident(table_name)))) AS size
FROM information_schema.tables
WHERE table_schema LIKE 'tenant_%' OR table_schema = 'public'
GROUP BY schema_name
ORDER BY SUM(pg_total_relation_size(quote_ident(schema_name) || '.' || quote_ident(table_name))) DESC;

-- Test 7.2: Count records per tenant
SELECT
  t.name AS tenant_name,
  t.schema_name,
  (SELECT COUNT(*) FROM tenant_test123.products) AS products,
  (SELECT COUNT(*) FROM tenant_test123.sales) AS sales,
  (SELECT COUNT(*) FROM tenant_test123.inventory) AS inventory_items,
  (SELECT COUNT(*) FROM tenant_test123.forecasts) AS forecasts
FROM public.tenants t
WHERE t.slug = 'acme-manufacturing';

-- Test 7.3: List all tenant schemas with stats
SELECT * FROM list_tenant_schemas();

-- Test 7.4: Verify tenant isolation
SELECT * FROM verify_tenant_isolation();

-- ============================================================================
-- TEST 8: Cleanup (Optional - Use with Caution!)
-- ============================================================================

-- DANGER: These commands DELETE DATA. Only run in testing environment!

-- Step 8.1: Delete test tenants (soft delete)
-- UPDATE public.tenants SET deleted_at = NOW() WHERE slug IN ('acme-manufacturing', 'beta-industries');

-- Step 8.2: Hard delete tenant schemas
-- SELECT delete_tenant_schema((SELECT id FROM public.tenants WHERE slug = 'acme-manufacturing'));
-- SELECT delete_tenant_schema((SELECT id FROM public.tenants WHERE slug = 'beta-industries'));

-- Step 8.3: Permanently remove tenant records
-- DELETE FROM public.tenants WHERE slug IN ('acme-manufacturing', 'beta-industries');

-- ============================================================================
-- VERIFICATION SUMMARY
-- ============================================================================

-- Run this query to verify the multi-tenant setup is working correctly
SELECT
  'Public Schema Tables' AS check_name,
  COUNT(*)::TEXT AS result,
  '4 expected (tenants, users, subscriptions, audit_logs)' AS expected
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('tenants', 'users', 'subscriptions', 'audit_logs')

UNION ALL

SELECT
  'Tenant Schemas Created',
  COUNT(*)::TEXT,
  '2 expected (tenant_test123, tenant_beta456)'
FROM information_schema.schemata
WHERE schema_name LIKE 'tenant_%'

UNION ALL

SELECT
  'Tenants Registered',
  COUNT(*)::TEXT,
  '2 expected (acme-manufacturing, beta-industries)'
FROM public.tenants

UNION ALL

SELECT
  'Users Created',
  COUNT(*)::TEXT,
  '1+ expected'
FROM public.users

UNION ALL

SELECT
  'Subscriptions Created',
  COUNT(*)::TEXT,
  '1+ expected'
FROM public.subscriptions;

-- ============================================================================
-- END OF TESTING QUERIES
-- ============================================================================
