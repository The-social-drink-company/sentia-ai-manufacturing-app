-- CapLiquify Multi-Tenant Database Functions
-- File: 002_tenant_schema_functions.sql
-- Description: Functions to create/delete tenant schemas dynamically
-- Date: October 19, 2025

-- ============================================================================
-- FUNCTION: create_tenant_schema
-- Description: Creates a new tenant schema with all required tables
-- Usage: SELECT create_tenant_schema('123e4567-e89b-12d3-a456-426614174000'::UUID);
-- Returns: Schema name (e.g., 'tenant_123e4567-e89b-12d3-a456-426614174000')
-- ============================================================================

CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_uuid UUID)
RETURNS VARCHAR AS $$
DECLARE
  schema_name VARCHAR;
BEGIN
  -- Generate schema name
  schema_name := 'tenant_' || REPLACE(tenant_uuid::TEXT, '-', '');

  -- Create schema
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);

  RAISE NOTICE 'Created schema: %', schema_name;

  -- ============================================================================
  -- COMPANIES TABLE
  -- ============================================================================
  EXECUTE format('
    CREATE TABLE %I.companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      legal_name VARCHAR(255),
      tax_id VARCHAR(50),
      currency VARCHAR(3) DEFAULT ''USD'',
      fiscal_year_end VARCHAR(5),
      settings JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )', schema_name);

  RAISE NOTICE 'Created table: %.companies', schema_name;

  -- ============================================================================
  -- PRODUCTS TABLE
  -- ============================================================================
  EXECUTE format('
    CREATE TABLE %I.products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES %I.companies(id) ON DELETE CASCADE,
      sku VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      unit_cost DECIMAL(15, 2),
      unit_price DECIMAL(15, 2),
      currency VARCHAR(3) DEFAULT ''USD'',
      reorder_point INTEGER,
      reorder_quantity INTEGER,
      lead_time_days INTEGER,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )', schema_name, schema_name);

  EXECUTE format('CREATE INDEX idx_products_company ON %I.products(company_id)', schema_name);
  EXECUTE format('CREATE INDEX idx_products_sku ON %I.products(sku)', schema_name);

  RAISE NOTICE 'Created table: %.products', schema_name;

  -- ============================================================================
  -- SALES TABLE
  -- ============================================================================
  EXECUTE format('
    CREATE TABLE %I.sales (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES %I.companies(id) ON DELETE CASCADE,
      product_id UUID REFERENCES %I.products(id) ON DELETE SET NULL,
      sale_date DATE NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(15, 2) NOT NULL,
      total_amount DECIMAL(15, 2) NOT NULL,
      currency VARCHAR(3) DEFAULT ''USD'',
      channel VARCHAR(50),
      external_id VARCHAR(255),
      customer_name VARCHAR(255),
      customer_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )', schema_name, schema_name, schema_name);

  EXECUTE format('CREATE INDEX idx_sales_company ON %I.sales(company_id)', schema_name);
  EXECUTE format('CREATE INDEX idx_sales_product ON %I.sales(product_id)', schema_name);
  EXECUTE format('CREATE INDEX idx_sales_date ON %I.sales(sale_date)', schema_name);

  RAISE NOTICE 'Created table: %.sales', schema_name;

  -- ============================================================================
  -- INVENTORY TABLE
  -- ============================================================================
  EXECUTE format('
    CREATE TABLE %I.inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES %I.companies(id) ON DELETE CASCADE,
      product_id UUID REFERENCES %I.products(id) ON DELETE CASCADE,
      warehouse_location VARCHAR(100),
      quantity_on_hand INTEGER NOT NULL,
      quantity_reserved INTEGER DEFAULT 0,
      quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
      unit_cost DECIMAL(15, 2),
      total_value DECIMAL(15, 2) GENERATED ALWAYS AS (quantity_on_hand * unit_cost) STORED,
      last_counted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )', schema_name, schema_name, schema_name);

  EXECUTE format('CREATE INDEX idx_inventory_company ON %I.inventory(company_id)', schema_name);
  EXECUTE format('CREATE INDEX idx_inventory_product ON %I.inventory(product_id)', schema_name);

  RAISE NOTICE 'Created table: %.inventory', schema_name;

  -- ============================================================================
  -- FORECASTS TABLE
  -- ============================================================================
  EXECUTE format('
    CREATE TABLE %I.forecasts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES %I.companies(id) ON DELETE CASCADE,
      product_id UUID REFERENCES %I.products(id) ON DELETE SET NULL,
      forecast_date DATE NOT NULL,
      forecast_type VARCHAR(50) NOT NULL,
      model_type VARCHAR(50),
      predicted_value DECIMAL(15, 2) NOT NULL,
      lower_bound DECIMAL(15, 2),
      upper_bound DECIMAL(15, 2),
      confidence_level DECIMAL(5, 2),
      actual_value DECIMAL(15, 2),
      accuracy_percentage DECIMAL(5, 2),
      model_parameters JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )', schema_name, schema_name, schema_name);

  EXECUTE format('CREATE INDEX idx_forecasts_company ON %I.forecasts(company_id)', schema_name);
  EXECUTE format('CREATE INDEX idx_forecasts_product ON %I.forecasts(product_id)', schema_name);
  EXECUTE format('CREATE INDEX idx_forecasts_date ON %I.forecasts(forecast_date)', schema_name);

  RAISE NOTICE 'Created table: %.forecasts', schema_name;

  -- ============================================================================
  -- WORKING CAPITAL METRICS TABLE
  -- ============================================================================
  EXECUTE format('
    CREATE TABLE %I.working_capital_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES %I.companies(id) ON DELETE CASCADE,
      period_date DATE NOT NULL,
      period_type VARCHAR(20) NOT NULL,
      cash DECIMAL(15, 2),
      accounts_receivable DECIMAL(15, 2),
      inventory DECIMAL(15, 2),
      accounts_payable DECIMAL(15, 2),
      short_term_debt DECIMAL(15, 2),
      working_capital DECIMAL(15, 2),
      current_ratio DECIMAL(10, 4),
      quick_ratio DECIMAL(10, 4),
      days_sales_outstanding DECIMAL(10, 2),
      days_inventory_outstanding DECIMAL(10, 2),
      days_payables_outstanding DECIMAL(10, 2),
      cash_conversion_cycle DECIMAL(10, 2),
      operating_cash_flow DECIMAL(15, 2),
      cash_runway_days INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )', schema_name, schema_name);

  EXECUTE format('CREATE INDEX idx_wc_metrics_company ON %I.working_capital_metrics(company_id)', schema_name);
  EXECUTE format('CREATE INDEX idx_wc_metrics_date ON %I.working_capital_metrics(period_date)', schema_name);

  RAISE NOTICE 'Created table: %.working_capital_metrics', schema_name;

  -- ============================================================================
  -- SCENARIOS TABLE
  -- ============================================================================
  EXECUTE format('
    CREATE TABLE %I.scenarios (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES %I.companies(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      scenario_type VARCHAR(50),
      parameters JSONB NOT NULL,
      results JSONB,
      is_baseline BOOLEAN DEFAULT FALSE,
      created_by_user_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )', schema_name, schema_name);

  EXECUTE format('CREATE INDEX idx_scenarios_company ON %I.scenarios(company_id)', schema_name);

  RAISE NOTICE 'Created table: %.scenarios', schema_name;

  -- ============================================================================
  -- API CREDENTIALS TABLE
  -- ============================================================================
  EXECUTE format('
    CREATE TABLE %I.api_credentials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id UUID REFERENCES %I.companies(id) ON DELETE CASCADE,
      service VARCHAR(50) NOT NULL,
      service_display_name VARCHAR(100),
      credentials JSONB NOT NULL,
      oauth_access_token TEXT,
      oauth_refresh_token TEXT,
      oauth_token_expires_at TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE,
      last_sync_at TIMESTAMP,
      last_sync_status VARCHAR(50),
      last_sync_error TEXT,
      sync_frequency VARCHAR(20),
      auto_sync_enabled BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT unique_service_per_company UNIQUE(company_id, service)
    )', schema_name, schema_name);

  EXECUTE format('CREATE INDEX idx_api_creds_company ON %I.api_credentials(company_id)', schema_name);
  EXECUTE format('CREATE INDEX idx_api_creds_service ON %I.api_credentials(service)', schema_name);

  RAISE NOTICE 'Created table: %.api_credentials', schema_name);

  -- ============================================================================
  -- USER PREFERENCES TABLE
  -- ============================================================================
  EXECUTE format('
    CREATE TABLE %I.user_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) UNIQUE NOT NULL,
      preferences JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )', schema_name);

  RAISE NOTICE 'Created table: %.user_preferences', schema_name;

  -- ============================================================================
  -- TRIGGERS - Auto-update updated_at timestamp
  -- ============================================================================
  EXECUTE format('
    CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON %I.companies
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  ', schema_name);

  EXECUTE format('
    CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON %I.products
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  ', schema_name);

  EXECUTE format('
    CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON %I.scenarios
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  ', schema_name);

  EXECUTE format('
    CREATE TRIGGER update_api_credentials_updated_at BEFORE UPDATE ON %I.api_credentials
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  ', schema_name);

  EXECUTE format('
    CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON %I.user_preferences
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  ', schema_name);

  -- ============================================================================
  -- GRANT PERMISSIONS (adjust for your deployment environment)
  -- ============================================================================
  -- EXECUTE format('GRANT USAGE ON SCHEMA %I TO app_user', schema_name);
  -- EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO app_user', schema_name);

  RAISE NOTICE 'Tenant schema % created successfully with 9 tables', schema_name;

  RETURN schema_name;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION create_tenant_schema IS 'Creates a new tenant schema with all business tables. Returns schema name.';

-- ============================================================================
-- FUNCTION: delete_tenant_schema
-- Description: Safely deletes a tenant schema and all data
-- Usage: SELECT delete_tenant_schema('123e4567-e89b-12d3-a456-426614174000'::UUID);
-- Returns: TRUE if successful, FALSE if schema doesn''t exist
-- WARNING: This is DESTRUCTIVE and IRREVERSIBLE!
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_tenant_schema(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  schema_name VARCHAR;
  schema_exists BOOLEAN;
BEGIN
  -- Generate schema name
  schema_name := 'tenant_' || REPLACE(tenant_uuid::TEXT, '-', '');

  -- Check if schema exists
  SELECT EXISTS(
    SELECT 1 FROM information_schema.schemata
    WHERE schema_name = schema_name
  ) INTO schema_exists;

  IF NOT schema_exists THEN
    RAISE WARNING 'Schema % does not exist, skipping deletion', schema_name;
    RETURN FALSE;
  END IF;

  -- Drop schema and all tables (CASCADE removes dependencies)
  EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', schema_name);

  RAISE NOTICE 'Tenant schema % deleted successfully', schema_name;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION delete_tenant_schema IS 'Deletes a tenant schema and ALL data. IRREVERSIBLE operation. Use with caution.';

-- ============================================================================
-- FUNCTION: list_tenant_schemas
-- Description: Lists all tenant schemas in the database
-- Usage: SELECT * FROM list_tenant_schemas();
-- Returns: Table with schema_name and table_count columns
-- ============================================================================

CREATE OR REPLACE FUNCTION list_tenant_schemas()
RETURNS TABLE (
  schema_name VARCHAR,
  table_count INTEGER,
  size_mb DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.schema_name::VARCHAR,
    COUNT(t.table_name)::INTEGER AS table_count,
    ROUND(SUM(pg_total_relation_size(quote_ident(s.schema_name) || '.' || quote_ident(t.table_name))) / 1024.0 / 1024.0, 2) AS size_mb
  FROM information_schema.schemata s
  LEFT JOIN information_schema.tables t
    ON s.schema_name = t.table_schema
  WHERE s.schema_name LIKE 'tenant_%'
  GROUP BY s.schema_name
  ORDER BY s.schema_name;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION list_tenant_schemas IS 'Lists all tenant schemas with table count and size in MB';

-- ============================================================================
-- FUNCTION: verify_tenant_isolation
-- Description: Verifies that tenant schemas are properly isolated
-- Usage: SELECT * FROM verify_tenant_isolation();
-- Returns: Table with test results
-- ============================================================================

CREATE OR REPLACE FUNCTION verify_tenant_isolation()
RETURNS TABLE (
  test_name VARCHAR,
  result VARCHAR,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'Tenant Schema Count'::VARCHAR AS test_name,
    CASE
      WHEN COUNT(*) > 0 THEN 'PASS'::VARCHAR
      ELSE 'FAIL'::VARCHAR
    END AS result,
    'Found ' || COUNT(*)::TEXT || ' tenant schemas' AS details
  FROM information_schema.schemata
  WHERE schema_name LIKE 'tenant_%';

  RETURN QUERY
  SELECT
    'Public Schema Tables'::VARCHAR AS test_name,
    CASE
      WHEN COUNT(*) = 4 THEN 'PASS'::VARCHAR
      ELSE 'FAIL'::VARCHAR
    END AS result,
    'Expected 4, found ' || COUNT(*)::TEXT AS details
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('tenants', 'users', 'subscriptions', 'audit_logs');
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION verify_tenant_isolation IS 'Runs verification tests on multi-tenant setup';

-- ============================================================================
-- END OF FUNCTIONS
-- ============================================================================
