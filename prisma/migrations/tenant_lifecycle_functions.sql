-- =====================================================
-- TENANT LIFECYCLE FUNCTIONS
-- CapLiquify Multi-Tenant SaaS Platform
-- =====================================================
--
-- This file contains PostgreSQL functions for managing tenant schema lifecycle:
-- 1. create_tenant_schema() - Creates a new tenant schema with all tables
-- 2. delete_tenant_schema() - Drops a tenant schema and all data (CASCADE)
-- 3. clone_tenant_schema()  - Duplicates a tenant schema for backup/testing
--
-- Usage:
--   SELECT create_tenant_schema('550e8400-e29b-41d4-a716-446655440000');
--   SELECT delete_tenant_schema('550e8400-e29b-41d4-a716-446655440000');
--   SELECT clone_tenant_schema('source-uuid', 'dest-uuid');
--
-- Epic: BMAD-MULTITENANT-001 (Story 4)
-- Created: 2025-10-20
-- =====================================================

-- =====================================================
-- FUNCTION: create_tenant_schema
-- =====================================================
-- Creates a new tenant schema with all required tables, indexes, and constraints.
--
-- Parameters:
--   tenant_uuid UUID - The tenant's unique identifier (from public.tenants.id)
--
-- Returns:
--   VARCHAR - The created schema name (e.g., "tenant_550e8400-e29b-41d4-a716-446655440000")
--
-- Example:
--   SELECT create_tenant_schema('550e8400-e29b-41d4-a716-446655440000');
-- =====================================================

CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_uuid UUID)
RETURNS VARCHAR AS $$
DECLARE
  schema_name VARCHAR;
BEGIN
  -- Generate schema name from tenant UUID
  schema_name := 'tenant_' || tenant_uuid::TEXT;

  -- Create schema
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);

  -- =====================================================
  -- TABLE: companies
  -- =====================================================
  EXECUTE format('
    CREATE TABLE %I.companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      legal_name VARCHAR(255),
      registration_number VARCHAR(100),
      tax_id VARCHAR(100),
      industry VARCHAR(100),
      website VARCHAR(255),
      logo_url TEXT,
      primary_currency VARCHAR(3) NOT NULL DEFAULT ''GBP'',
      fiscal_year_start VARCHAR(5), -- MM-DD format
      address TEXT,
      city VARCHAR(100),
      state_province VARCHAR(100),
      postal_code VARCHAR(20),
      country VARCHAR(2), -- ISO 3166-1 alpha-2
      timezone VARCHAR(50) DEFAULT ''UTC'',
      metadata JSONB DEFAULT ''{}''::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP WITH TIME ZONE
    )
  ', schema_name);

  EXECUTE format('CREATE INDEX %I ON %I.companies(deleted_at) WHERE deleted_at IS NULL',
    'idx_companies_active', schema_name);

  -- =====================================================
  -- TABLE: products
  -- =====================================================
  EXECUTE format('
    CREATE TABLE %I.products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL REFERENCES %I.companies(id) ON DELETE CASCADE,
      sku VARCHAR(100) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      unit_of_measure VARCHAR(50) DEFAULT ''unit'',

      -- Pricing
      unit_cost DECIMAL(15, 2),
      unit_price DECIMAL(15, 2),
      currency VARCHAR(3) DEFAULT ''GBP'',

      -- Inventory Management
      reorder_point INT,
      reorder_quantity INT,
      lead_time_days INT,
      safety_stock INT,

      -- Multi-channel tracking
      track_inventory BOOLEAN DEFAULT true,
      is_active BOOLEAN DEFAULT true,

      metadata JSONB DEFAULT ''{}''::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP WITH TIME ZONE
    )
  ', schema_name, schema_name);

  EXECUTE format('CREATE INDEX %I ON %I.products(company_id)',
    'idx_products_company', schema_name);
  EXECUTE format('CREATE INDEX %I ON %I.products(sku)',
    'idx_products_sku', schema_name);
  EXECUTE format('CREATE INDEX %I ON %I.products(deleted_at) WHERE deleted_at IS NULL',
    'idx_products_active', schema_name);

  -- =====================================================
  -- TABLE: sales
  -- =====================================================
  EXECUTE format('
    CREATE TABLE %I.sales (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL REFERENCES %I.companies(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES %I.products(id) ON DELETE RESTRICT,

      sale_date DATE NOT NULL,

      -- Quantities
      quantity INT NOT NULL,
      unit_price DECIMAL(15, 2) NOT NULL,
      total_amount DECIMAL(15, 2) NOT NULL,

      -- Multi-channel tracking
      channel VARCHAR(50), -- "amazon_uk", "shopify_uk", "shopify_eu", etc.
      channel_order_id VARCHAR(255),

      -- Financial details
      currency VARCHAR(3) DEFAULT ''GBP'',
      commission_rate DECIMAL(5, 4), -- e.g., 0.0290 for 2.9%%
      commission_amount DECIMAL(15, 2),
      net_revenue DECIMAL(15, 2), -- total_amount - commission_amount

      -- Regional tracking
      market VARCHAR(10), -- "UK", "EU", "USA"

      metadata JSONB DEFAULT ''{}''::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  ', schema_name, schema_name, schema_name);

  EXECUTE format('CREATE INDEX %I ON %I.sales(company_id)',
    'idx_sales_company', schema_name);
  EXECUTE format('CREATE INDEX %I ON %I.sales(product_id)',
    'idx_sales_product', schema_name);
  EXECUTE format('CREATE INDEX %I ON %I.sales(sale_date)',
    'idx_sales_date', schema_name);
  EXECUTE format('CREATE INDEX %I ON %I.sales(channel)',
    'idx_sales_channel', schema_name);

  -- =====================================================
  -- TABLE: inventory
  -- =====================================================
  EXECUTE format('
    CREATE TABLE %I.inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL REFERENCES %I.companies(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES %I.products(id) ON DELETE CASCADE,

      -- Inventory levels
      quantity_on_hand INT NOT NULL DEFAULT 0,
      quantity_reserved INT NOT NULL DEFAULT 0,
      quantity_available INT GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,

      -- Multi-location tracking
      location VARCHAR(100), -- "warehouse_uk", "fba_usa", etc.

      -- Dates
      last_counted_at TIMESTAMP WITH TIME ZONE,
      last_received_at TIMESTAMP WITH TIME ZONE,

      metadata JSONB DEFAULT ''{}''::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  ', schema_name, schema_name, schema_name);

  EXECUTE format('CREATE INDEX %I ON %I.inventory(company_id)',
    'idx_inventory_company', schema_name);
  EXECUTE format('CREATE INDEX %I ON %I.inventory(product_id)',
    'idx_inventory_product', schema_name);
  EXECUTE format('CREATE UNIQUE INDEX %I ON %I.inventory(product_id, location)',
    'idx_inventory_product_location', schema_name);

  -- =====================================================
  -- TABLE: forecasts
  -- =====================================================
  EXECUTE format('
    CREATE TABLE %I.forecasts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL REFERENCES %I.companies(id) ON DELETE CASCADE,
      product_id UUID REFERENCES %I.products(id) ON DELETE CASCADE,

      forecast_date DATE NOT NULL,
      forecast_type VARCHAR(50) NOT NULL, -- DEMAND, REVENUE, CASH_FLOW
      period_type VARCHAR(20), -- DAILY, WEEKLY, MONTHLY

      -- AI/ML Model Info
      model_type VARCHAR(50), -- "arima", "lstm", "prophet", "ensemble"
      model_version VARCHAR(50),

      -- Predictions
      predicted_value DECIMAL(15, 2) NOT NULL,
      lower_bound DECIMAL(15, 2),
      upper_bound DECIMAL(15, 2),
      confidence_level DECIMAL(5, 4), -- 0.95 for 95%% confidence

      -- Accuracy tracking
      actual_value DECIMAL(15, 2),
      accuracy_percentage DECIMAL(5, 2),

      -- Multi-channel specific
      channel VARCHAR(50),

      metadata JSONB DEFAULT ''{}''::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  ', schema_name, schema_name, schema_name);

  EXECUTE format('CREATE INDEX %I ON %I.forecasts(company_id)',
    'idx_forecasts_company', schema_name);
  EXECUTE format('CREATE INDEX %I ON %I.forecasts(product_id)',
    'idx_forecasts_product', schema_name);
  EXECUTE format('CREATE INDEX %I ON %I.forecasts(forecast_date)',
    'idx_forecasts_date', schema_name);
  EXECUTE format('CREATE INDEX %I ON %I.forecasts(forecast_type)',
    'idx_forecasts_type', schema_name);

  -- =====================================================
  -- TABLE: working_capital_metrics
  -- =====================================================
  EXECUTE format('
    CREATE TABLE %I.working_capital_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL REFERENCES %I.companies(id) ON DELETE CASCADE,

      period_date DATE NOT NULL,
      period_type VARCHAR(20), -- DAILY, WEEKLY, MONTHLY

      -- Current Assets
      cash DECIMAL(15, 2) NOT NULL DEFAULT 0,
      accounts_receivable DECIMAL(15, 2) NOT NULL DEFAULT 0,
      inventory DECIMAL(15, 2) NOT NULL DEFAULT 0,
      other_current_assets DECIMAL(15, 2) DEFAULT 0,

      -- Current Liabilities
      accounts_payable DECIMAL(15, 2) NOT NULL DEFAULT 0,
      short_term_debt DECIMAL(15, 2) DEFAULT 0,
      other_current_liabilities DECIMAL(15, 2) DEFAULT 0,

      -- Calculated Metrics
      total_current_assets DECIMAL(15, 2) GENERATED ALWAYS AS
        (cash + accounts_receivable + inventory + other_current_assets) STORED,
      total_current_liabilities DECIMAL(15, 2) GENERATED ALWAYS AS
        (accounts_payable + short_term_debt + other_current_liabilities) STORED,
      working_capital DECIMAL(15, 2) GENERATED ALWAYS AS
        (cash + accounts_receivable + inventory + other_current_assets -
         accounts_payable - short_term_debt - other_current_liabilities) STORED,

      -- Financial Ratios
      current_ratio DECIMAL(10, 4),
      quick_ratio DECIMAL(10, 4),

      -- Cash Conversion Cycle Components
      days_sales_outstanding DECIMAL(10, 2), -- DSO
      days_inventory_outstanding DECIMAL(10, 2), -- DIO
      days_payables_outstanding DECIMAL(10, 2), -- DPO
      cash_conversion_cycle DECIMAL(10, 2), -- DSO + DIO - DPO

      currency VARCHAR(3) DEFAULT ''GBP'',
      metadata JSONB DEFAULT ''{}''::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  ', schema_name, schema_name);

  EXECUTE format('CREATE INDEX %I ON %I.working_capital_metrics(company_id)',
    'idx_wc_metrics_company', schema_name);
  EXECUTE format('CREATE INDEX %I ON %I.working_capital_metrics(period_date)',
    'idx_wc_metrics_date', schema_name);
  EXECUTE format('CREATE UNIQUE INDEX %I ON %I.working_capital_metrics(company_id, period_date)',
    'idx_wc_metrics_company_date', schema_name);

  -- =====================================================
  -- TABLE: scenarios
  -- =====================================================
  EXECUTE format('
    CREATE TABLE %I.scenarios (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL REFERENCES %I.companies(id) ON DELETE CASCADE,

      name VARCHAR(255) NOT NULL,
      description TEXT,
      scenario_type VARCHAR(50), -- WHAT_IF, OPTIMIZATION, SENSITIVITY

      -- Scenario parameters (stored as JSON)
      parameters JSONB NOT NULL DEFAULT ''{}''::jsonb,

      -- Results (stored as JSON)
      results JSONB DEFAULT ''{}''::jsonb,

      -- Comparison to baseline
      baseline_scenario_id UUID,
      impact_summary JSONB,

      is_active BOOLEAN DEFAULT true,

      created_by UUID, -- References public.users.id
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP WITH TIME ZONE
    )
  ', schema_name, schema_name);

  EXECUTE format('CREATE INDEX %I ON %I.scenarios(company_id)',
    'idx_scenarios_company', schema_name);
  EXECUTE format('CREATE INDEX %I ON %I.scenarios(scenario_type)',
    'idx_scenarios_type', schema_name);
  EXECUTE format('CREATE INDEX %I ON %I.scenarios(deleted_at) WHERE deleted_at IS NULL',
    'idx_scenarios_active', schema_name);

  -- =====================================================
  -- TABLE: api_credentials
  -- =====================================================
  EXECUTE format('
    CREATE TABLE %I.api_credentials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID NOT NULL REFERENCES %I.companies(id) ON DELETE CASCADE,

      service_name VARCHAR(100) NOT NULL, -- "xero", "shopify_uk", "amazon_sp_api", etc.
      service_type VARCHAR(50), -- "accounting", "ecommerce", "erp"

      -- Encrypted credentials (use pgcrypto for encryption)
      credentials_encrypted TEXT NOT NULL, -- Encrypted JSON

      -- OAuth tokens
      access_token_encrypted TEXT,
      refresh_token_encrypted TEXT,
      token_expires_at TIMESTAMP WITH TIME ZONE,

      -- API configuration
      api_endpoint VARCHAR(255),
      api_version VARCHAR(50),

      -- Status
      is_active BOOLEAN DEFAULT true,
      last_sync_at TIMESTAMP WITH TIME ZONE,
      last_sync_status VARCHAR(50), -- SUCCESS, FAILURE, PENDING

      metadata JSONB DEFAULT ''{}''::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP WITH TIME ZONE
    )
  ', schema_name, schema_name);

  EXECUTE format('CREATE INDEX %I ON %I.api_credentials(company_id)',
    'idx_api_creds_company', schema_name);
  EXECUTE format('CREATE INDEX %I ON %I.api_credentials(service_name)',
    'idx_api_creds_service', schema_name);
  EXECUTE format('CREATE UNIQUE INDEX %I ON %I.api_credentials(company_id, service_name) WHERE deleted_at IS NULL',
    'idx_api_creds_company_service', schema_name);

  -- =====================================================
  -- TABLE: user_preferences
  -- =====================================================
  EXECUTE format('
    CREATE TABLE %I.user_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL, -- References public.users.id
      company_id UUID NOT NULL REFERENCES %I.companies(id) ON DELETE CASCADE,

      -- Dashboard customization
      dashboard_layout JSONB DEFAULT ''{}''::jsonb,
      widget_preferences JSONB DEFAULT ''{}''::jsonb,

      -- UI preferences
      theme VARCHAR(20) DEFAULT ''light'', -- light, dark, auto
      locale VARCHAR(10) DEFAULT ''en-GB'',
      timezone VARCHAR(50),

      -- Notification preferences
      email_notifications JSONB DEFAULT ''{}''::jsonb,
      push_notifications JSONB DEFAULT ''{}''::jsonb,

      -- Feature flags (user-specific overrides)
      feature_flags JSONB DEFAULT ''{}''::jsonb,

      metadata JSONB DEFAULT ''{}''::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  ', schema_name, schema_name);

  EXECUTE format('CREATE INDEX %I ON %I.user_preferences(user_id)',
    'idx_user_prefs_user', schema_name);
  EXECUTE format('CREATE INDEX %I ON %I.user_preferences(company_id)',
    'idx_user_prefs_company', schema_name);
  EXECUTE format('CREATE UNIQUE INDEX %I ON %I.user_preferences(user_id, company_id)',
    'idx_user_prefs_user_company', schema_name);

  -- Return created schema name
  RETURN schema_name;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create tenant schema: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- FUNCTION: delete_tenant_schema
-- =====================================================
-- Deletes a tenant schema and all its data (CASCADE).
-- WARNING: This operation is irreversible!
--
-- Parameters:
--   tenant_uuid UUID - The tenant's unique identifier
--
-- Returns:
--   BOOLEAN - true if deletion successful, false otherwise
--
-- Example:
--   SELECT delete_tenant_schema('550e8400-e29b-41d4-a716-446655440000');
-- =====================================================

CREATE OR REPLACE FUNCTION delete_tenant_schema(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  schema_name VARCHAR;
  schema_exists BOOLEAN;
BEGIN
  -- Generate schema name from tenant UUID
  schema_name := 'tenant_' || tenant_uuid::TEXT;

  -- Check if schema exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = schema_name
  ) INTO schema_exists;

  IF NOT schema_exists THEN
    RAISE NOTICE 'Schema % does not exist, skipping deletion', schema_name;
    RETURN false;
  END IF;

  -- Drop schema CASCADE (removes all tables and data)
  EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', schema_name);

  -- Clean up audit logs in public schema (optional)
  -- DELETE FROM public.audit_logs WHERE tenant_id = tenant_uuid;

  RAISE NOTICE 'Successfully deleted tenant schema: %', schema_name;
  RETURN true;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to delete tenant schema: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- FUNCTION: clone_tenant_schema
-- =====================================================
-- Duplicates a tenant schema for backup or testing purposes.
-- Creates a new schema with identical structure and data.
--
-- Parameters:
--   source_uuid UUID - Source tenant UUID to clone from
--   dest_uuid UUID   - Destination tenant UUID (must not exist)
--
-- Returns:
--   VARCHAR - The created schema name
--
-- Example:
--   SELECT clone_tenant_schema(
--     '550e8400-e29b-41d4-a716-446655440000',  -- source
--     '660e8400-e29b-41d4-a716-446655440001'   -- destination
--   );
-- =====================================================

CREATE OR REPLACE FUNCTION clone_tenant_schema(source_uuid UUID, dest_uuid UUID)
RETURNS VARCHAR AS $$
DECLARE
  source_schema VARCHAR;
  dest_schema VARCHAR;
  table_record RECORD;
  source_exists BOOLEAN;
  dest_exists BOOLEAN;
BEGIN
  -- Generate schema names
  source_schema := 'tenant_' || source_uuid::TEXT;
  dest_schema := 'tenant_' || dest_uuid::TEXT;

  -- Check if source schema exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = source_schema
  ) INTO source_exists;

  IF NOT source_exists THEN
    RAISE EXCEPTION 'Source schema % does not exist', source_schema;
  END IF;

  -- Check if destination schema already exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = dest_schema
  ) INTO dest_exists;

  IF dest_exists THEN
    RAISE EXCEPTION 'Destination schema % already exists', dest_schema;
  END IF;

  -- Create destination schema using create_tenant_schema function
  PERFORM create_tenant_schema(dest_uuid);

  -- Copy data from all tables in source schema to destination
  FOR table_record IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = source_schema
  LOOP
    EXECUTE format('INSERT INTO %I.%I SELECT * FROM %I.%I',
      dest_schema, table_record.table_name,
      source_schema, table_record.table_name
    );

    RAISE NOTICE 'Copied table: %', table_record.table_name;
  END LOOP;

  RAISE NOTICE 'Successfully cloned % to %', source_schema, dest_schema;
  RETURN dest_schema;

EXCEPTION
  WHEN OTHERS THEN
    -- Attempt cleanup on failure
    EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', dest_schema);
    RAISE EXCEPTION 'Failed to clone tenant schema: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- HELPER FUNCTION: list_tenant_schemas
-- =====================================================
-- Lists all tenant schemas in the database.
--
-- Returns:
--   TABLE - List of tenant schema names and their UUIDs
--
-- Example:
--   SELECT * FROM list_tenant_schemas();
-- =====================================================

CREATE OR REPLACE FUNCTION list_tenant_schemas()
RETURNS TABLE (
  tenant_uuid UUID,
  schema_name VARCHAR,
  table_count BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CAST(SUBSTRING(s.schema_name FROM 8) AS UUID) AS tenant_uuid,
    s.schema_name::VARCHAR,
    COUNT(t.table_name)::BIGINT AS table_count,
    NULL::TIMESTAMP WITH TIME ZONE AS created_at -- Would need to join with public.tenants for actual created_at
  FROM information_schema.schemata s
  LEFT JOIN information_schema.tables t ON t.table_schema = s.schema_name
  WHERE s.schema_name LIKE 'tenant_%'
  GROUP BY s.schema_name
  ORDER BY s.schema_name;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Example 1: Create a new tenant schema
-- SELECT create_tenant_schema('550e8400-e29b-41d4-a716-446655440000');
-- Result: 'tenant_550e8400-e29b-41d4-a716-446655440000'

-- Example 2: List all tenant schemas
-- SELECT * FROM list_tenant_schemas();

-- Example 3: Clone a tenant schema for backup
-- SELECT clone_tenant_schema(
--   '550e8400-e29b-41d4-a716-446655440000',  -- source
--   '660e8400-e29b-41d4-a716-446655440001'   -- destination (backup)
-- );

-- Example 4: Delete a tenant schema (DANGEROUS!)
-- SELECT delete_tenant_schema('550e8400-e29b-41d4-a716-446655440000');

-- =====================================================
-- END OF TENANT LIFECYCLE FUNCTIONS
-- =====================================================
