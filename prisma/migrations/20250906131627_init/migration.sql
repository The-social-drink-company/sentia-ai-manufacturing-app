-- CreateEnum
CREATE TYPE "public"."filetype" AS ENUM ('CSV', 'XLSX', 'JSON', 'XML', 'API');

-- CreateEnum
CREATE TYPE "public"."importstatus" AS ENUM ('PENDING', 'PROCESSING', 'VALIDATING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."importtype" AS ENUM ('PRODUCTS', 'HISTORICAL_SALES', 'INVENTORY_LEVELS', 'MANUFACTURING_DATA', 'FINANCIAL_DATA', 'FORECASTS');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(64) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "password_hash" VARCHAR(256),
    "first_name" VARCHAR(50),
    "last_name" VARCHAR(50),
    "display_name" VARCHAR(100),
    "role" VARCHAR(20) NOT NULL,
    "permissions" JSON,
    "is_active" BOOLEAN NOT NULL,
    "is_admin" BOOLEAN NOT NULL,
    "department" VARCHAR(50),
    "access_regions" JSON,
    "last_login" TIMESTAMPTZ(6),
    "last_login_ip" VARCHAR(45),
    "login_count" INTEGER,
    "password_reset_token" VARCHAR(255),
    "password_reset_expires" TIMESTAMPTZ(6),
    "failed_login_attempts" INTEGER,
    "account_locked_until" TIMESTAMPTZ(6),
    "two_factor_enabled" BOOLEAN NOT NULL,
    "two_factor_secret" VARCHAR(32),
    "backup_codes" JSON,
    "session_token" VARCHAR(255),
    "session_expires" TIMESTAMPTZ(6),
    "locked_until" TIMESTAMPTZ(6),
    "failed_login_count" INTEGER DEFAULT 0,
    "last_failed_login" TIMESTAMPTZ(6),
    "password_changed_at" TIMESTAMPTZ(6),
    "default_entity_id" UUID,
    "allowed_entity_ids" JSONB,
    "allowed_regions" JSONB,
    "preferred_currency_code" VARCHAR(3),
    "preferred_locale" VARCHAR(10),
    "preferred_timezone" VARCHAR(50),
    "sso_provider" VARCHAR(50),
    "last_sso_login" TIMESTAMPTZ(6),
    "created_via_jit" BOOLEAN DEFAULT false,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "force_password_change" BOOLEAN NOT NULL,
    "preferences" JSON,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."markets" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "region" VARCHAR(50) NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "tax_rate" DECIMAL(5,4),
    "standard_shipping_days" INTEGER,
    "express_shipping_days" INTEGER,
    "customs_requirements" TEXT,
    "regulatory_requirements" JSON,
    "import_restrictions" TEXT,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" UUID NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "market_region" VARCHAR(10) NOT NULL,
    "weight_kg" DECIMAL(8,3),
    "dimensions_cm" VARCHAR(50),
    "unit_cost" DECIMAL(10,2),
    "selling_price" DECIMAL(10,2),
    "production_time_hours" DECIMAL(6,2),
    "batch_size_min" INTEGER,
    "batch_size_max" INTEGER,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sales_channels" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "channel_type" VARCHAR(50) NOT NULL,
    "market_code" VARCHAR(10) NOT NULL,
    "api_endpoint" VARCHAR(255),
    "api_credentials_encrypted" TEXT,
    "marketplace_id" VARCHAR(100),
    "commission_rate" DECIMAL(5,4),
    "fulfillment_method" VARCHAR(20),
    "average_processing_days" INTEGER,
    "sync_enabled" BOOLEAN NOT NULL,
    "sync_frequency_minutes" INTEGER,
    "last_sync_at" TIMESTAMPTZ(6),
    "sync_status" VARCHAR(20),
    "sync_error_message" TEXT,
    "monthly_sales_target" DECIMAL(12,2),
    "conversion_rate" DECIMAL(5,4),
    "return_rate" DECIMAL(5,4),
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "sales_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."historical_sales" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "sales_channel_id" UUID NOT NULL,
    "sale_date" DATE NOT NULL,
    "sale_datetime" TIMESTAMPTZ(6) NOT NULL,
    "quantity_sold" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "gross_revenue" DECIMAL(12,2) NOT NULL,
    "discounts" DECIMAL(10,2),
    "net_revenue" DECIMAL(12,2) NOT NULL,
    "cost_of_goods_sold" DECIMAL(10,2),
    "shipping_cost" DECIMAL(8,2),
    "platform_fees" DECIMAL(8,2),
    "taxes" DECIMAL(8,2),
    "net_profit" DECIMAL(10,2),
    "order_id" VARCHAR(100),
    "order_item_id" VARCHAR(100),
    "customer_type" VARCHAR(20),
    "fulfillment_method" VARCHAR(20),
    "shipping_country" VARCHAR(10),
    "shipping_region" VARCHAR(50),
    "season" VARCHAR(20),
    "data_source" VARCHAR(50),
    "data_quality_score" DECIMAL(3,2),
    "is_validated" BOOLEAN NOT NULL,
    "validation_notes" TEXT,
    "entity_id" UUID,
    "region" VARCHAR(10),
    "currency_code_tx" VARCHAR(3),
    "currency_code_base" VARCHAR(3),
    "amount_tx" DECIMAL(18,4),
    "amount_base" DECIMAL(18,4),
    "fx_rate_used" DECIMAL(18,8),
    "import_batch_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "historical_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forecasts" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "sales_channel_id" UUID NOT NULL,
    "forecast_date" DATE NOT NULL,
    "forecast_period" VARCHAR(20) NOT NULL,
    "forecast_horizon_days" INTEGER NOT NULL,
    "predicted_demand" INTEGER NOT NULL,
    "demand_lower_bound" INTEGER,
    "demand_upper_bound" INTEGER,
    "confidence_score" DECIMAL(3,2),
    "predicted_revenue" DECIMAL(12,2),
    "revenue_lower_bound" DECIMAL(12,2),
    "revenue_upper_bound" DECIMAL(12,2),
    "seasonal_factor" DECIMAL(5,4),
    "trend_factor" DECIMAL(5,4),
    "promotional_factor" DECIMAL(5,4),
    "external_factors" JSON,
    "model_type" VARCHAR(50) NOT NULL,
    "model_version" VARCHAR(20),
    "training_data_start" DATE,
    "training_data_end" DATE,
    "model_accuracy_score" DECIMAL(5,4),
    "status" VARCHAR(20) NOT NULL,
    "is_approved" BOOLEAN NOT NULL,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "actual_demand" INTEGER,
    "actual_revenue" DECIMAL(12,2),
    "forecast_error" DECIMAL(8,2),
    "forecast_accuracy" DECIMAL(5,4),
    "notes" TEXT,
    "manual_adjustments" JSON,
    "entity_id" UUID,
    "region" VARCHAR(10),
    "currency_code_tx" VARCHAR(3),
    "currency_code_base" VARCHAR(3),
    "predicted_revenue_tx" DECIMAL(18,4),
    "predicted_revenue_base" DECIMAL(18,4),
    "fx_rate_assumption" DECIMAL(18,8),
    "series_id" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory_levels" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "location_type" VARCHAR(50) NOT NULL,
    "location_id" VARCHAR(100) NOT NULL,
    "location_name" VARCHAR(200),
    "country_code" VARCHAR(10),
    "available_quantity" INTEGER NOT NULL,
    "reserved_quantity" INTEGER,
    "inbound_quantity" INTEGER,
    "defective_quantity" INTEGER,
    "total_quantity" INTEGER NOT NULL,
    "reorder_point" INTEGER,
    "safety_stock" INTEGER,
    "maximum_stock" INTEGER,
    "economic_order_quantity" INTEGER,
    "unit_cost" DECIMAL(10,2),
    "total_value" DECIMAL(12,2),
    "storage_cost_per_unit_monthly" DECIMAL(8,4),
    "average_age_days" INTEGER,
    "oldest_stock_date" DATE,
    "turnover_rate_monthly" DECIMAL(6,4),
    "expected_demand_30d" INTEGER,
    "days_of_supply" INTEGER,
    "stock_out_risk_score" DECIMAL(3,2),
    "status" VARCHAR(20) NOT NULL,
    "last_movement_date" DATE,
    "last_count_date" DATE,
    "requires_recount" BOOLEAN,
    "data_source" VARCHAR(50),
    "last_sync_at" TIMESTAMPTZ(6),
    "sync_status" VARCHAR(20),
    "notes" TEXT,
    "adjustment_reason" VARCHAR(200),
    "snapshot_date" DATE NOT NULL,
    "entity_id" UUID,
    "region" VARCHAR(10),
    "currency_code_valuation" VARCHAR(3),
    "currency_code_base" VARCHAR(3),
    "unit_cost_base" DECIMAL(18,4),
    "total_value_base" DECIMAL(18,4),
    "fx_rate_valuation" DECIMAL(18,8),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "inventory_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."working_capital" (
    "id" UUID NOT NULL,
    "projection_date" DATE NOT NULL,
    "projection_period" VARCHAR(20) NOT NULL,
    "product_id" UUID,
    "market_code" VARCHAR(10),
    "sales_channel_id" UUID,
    "currency_code" VARCHAR(3) NOT NULL,
    "projected_sales_revenue" DECIMAL(15,2),
    "actual_sales_revenue" DECIMAL(15,2),
    "payment_terms_days" INTEGER,
    "collection_rate" DECIMAL(5,4),
    "cost_of_goods_sold" DECIMAL(12,2),
    "inventory_investment" DECIMAL(12,2),
    "manufacturing_costs" DECIMAL(12,2),
    "raw_materials_cost" DECIMAL(12,2),
    "labor_costs" DECIMAL(12,2),
    "marketing_spend" DECIMAL(10,2),
    "platform_fees" DECIMAL(10,2),
    "shipping_costs" DECIMAL(10,2),
    "storage_fees" DECIMAL(8,2),
    "administrative_costs" DECIMAL(8,2),
    "vat_gst_payable" DECIMAL(10,2),
    "corporate_tax_payable" DECIMAL(10,2),
    "customs_duties" DECIMAL(8,2),
    "accounts_receivable" DECIMAL(12,2),
    "inventory_value" DECIMAL(12,2),
    "accounts_payable" DECIMAL(12,2),
    "accrued_expenses" DECIMAL(10,2),
    "net_cash_flow" DECIMAL(15,2),
    "cumulative_cash_flow" DECIMAL(15,2),
    "cash_conversion_cycle_days" INTEGER,
    "working_capital_requirement" DECIMAL(15,2),
    "working_capital_turnover" DECIMAL(6,4),
    "days_sales_outstanding" INTEGER,
    "days_inventory_outstanding" INTEGER,
    "days_payable_outstanding" INTEGER,
    "scenario_type" VARCHAR(20),
    "confidence_level" DECIMAL(3,2),
    "risk_factors" JSON,
    "sensitivity_analysis" JSON,
    "status" VARCHAR(20) NOT NULL,
    "is_approved" BOOLEAN NOT NULL,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "assumptions" JSON,
    "data_sources" JSON,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "entity_id" UUID,
    "region" VARCHAR(10),
    "currency_code_base" VARCHAR(3),
    "fx_rate_to_base" DECIMAL(18,8),
    "tax_jurisdiction" VARCHAR(10),
    "vat_rate_applied" DECIMAL(5,4),
    "import_duty_rate" DECIMAL(5,4),
    "compliance_status" VARCHAR(20),
    "risk_category" VARCHAR(20),
    "consolidation_group" VARCHAR(50),
    "intercompany_elimination_flag" BOOLEAN DEFAULT false,

    CONSTRAINT "working_capital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_settings" (
    "id" UUID NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "value_text" TEXT,
    "value_integer" BIGINT,
    "value_decimal" DECIMAL(20,8),
    "value_boolean" BOOLEAN,
    "value_json" JSON,
    "value_date" DATE,
    "value_datetime" TIMESTAMPTZ(6),
    "data_type" VARCHAR(20) NOT NULL,
    "is_encrypted" BOOLEAN NOT NULL,
    "validation_rules" JSON,
    "default_value" TEXT,
    "is_system_setting" BOOLEAN NOT NULL,
    "is_sensitive" BOOLEAN NOT NULL,
    "requires_restart" BOOLEAN NOT NULL,
    "environment" VARCHAR(20),
    "scope" VARCHAR(50),
    "scope_id" VARCHAR(100),
    "version" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "effective_from" TIMESTAMPTZ(6),
    "effective_to" TIMESTAMPTZ(6),
    "previous_value" TEXT,
    "change_reason" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jobs" (
    "id" UUID NOT NULL,
    "job_number" VARCHAR(50) NOT NULL,
    "customer_name" VARCHAR(200) NOT NULL,
    "product_type" VARCHAR(100),
    "quantity" INTEGER NOT NULL,
    "priority" INTEGER,
    "status" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6),
    "due_date" TIMESTAMPTZ(6) NOT NULL,
    "start_date" TIMESTAMPTZ(6),
    "completion_date" TIMESTAMPTZ(6),
    "estimated_hours" DOUBLE PRECISION,
    "actual_hours" DOUBLE PRECISION,
    "notes" TEXT,
    "schedule_id" UUID,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."schedules" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "version" INTEGER,
    "status" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6) NOT NULL,
    "optimization_score" DOUBLE PRECISION,
    "total_jobs" INTEGER,
    "completed_jobs" INTEGER,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."resources" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "capacity" DOUBLE PRECISION,
    "status" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6),
    "last_maintenance" TIMESTAMPTZ(6),
    "next_maintenance" TIMESTAMPTZ(6),
    "efficiency_rating" DOUBLE PRECISION,
    "cost_per_hour" DOUBLE PRECISION,
    "location" VARCHAR(100),
    "description" TEXT,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_imports" (
    "id" UUID NOT NULL,
    "import_name" VARCHAR(200) NOT NULL,
    "import_type" "public"."importtype" NOT NULL,
    "import_description" TEXT,
    "original_filename" VARCHAR(255),
    "file_type" "public"."filetype" NOT NULL,
    "file_path" VARCHAR(500),
    "file_size_bytes" BIGINT,
    "file_hash" VARCHAR(64),
    "status" "public"."importstatus" NOT NULL,
    "progress_percentage" INTEGER,
    "current_step" VARCHAR(100),
    "total_rows" INTEGER,
    "processed_rows" INTEGER,
    "successful_rows" INTEGER,
    "failed_rows" INTEGER,
    "duplicate_rows" INTEGER,
    "data_quality_score" DECIMAL(3,2),
    "completeness_score" DECIMAL(3,2),
    "accuracy_score" DECIMAL(3,2),
    "import_settings" JSON,
    "validation_rules" JSON,
    "field_mappings" JSON,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "processing_duration_seconds" INTEGER,
    "error_message" TEXT,
    "error_details" JSON,
    "rollback_completed" BOOLEAN,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "data_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."import_errors" (
    "id" UUID NOT NULL,
    "import_id" UUID NOT NULL,
    "row_number" INTEGER,
    "column_name" VARCHAR(100),
    "error_type" VARCHAR(50) NOT NULL,
    "error_code" VARCHAR(20),
    "error_message" TEXT NOT NULL,
    "error_severity" VARCHAR(20),
    "original_value" TEXT,
    "suggested_value" TEXT,
    "row_data" JSON,
    "is_resolved" BOOLEAN,
    "resolution_method" VARCHAR(50),
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "resolution_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "import_errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."import_logs" (
    "id" UUID NOT NULL,
    "import_id" UUID NOT NULL,
    "log_level" VARCHAR(20) NOT NULL,
    "log_message" TEXT NOT NULL,
    "log_context" JSON,
    "step_name" VARCHAR(100),
    "row_number" INTEGER,
    "processing_time_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "import_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."import_templates" (
    "id" UUID NOT NULL,
    "template_name" VARCHAR(100) NOT NULL,
    "import_type" "public"."importtype" NOT NULL,
    "version" VARCHAR(20),
    "description" TEXT,
    "file_format" "public"."filetype" NOT NULL,
    "field_definitions" JSON NOT NULL,
    "sample_data" JSON,
    "validation_rules" JSON,
    "template_file_path" VARCHAR(500),
    "documentation_path" VARCHAR(500),
    "download_count" INTEGER,
    "usage_count" INTEGER,
    "success_rate" DECIMAL(5,2),
    "is_active" BOOLEAN,
    "is_system_template" BOOLEAN,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "import_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."import_job" (
    "id" SERIAL NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_type" VARCHAR(100) NOT NULL,
    "data_type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'uploaded',
    "mapping_config" JSON,
    "validation_rules" JSON,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "error_rows" INTEGER NOT NULL DEFAULT 0,
    "warnings" JSON,
    "uploaded_by" UUID,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL,
    "processed_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "import_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."validation_result" (
    "id" SERIAL NOT NULL,
    "import_job_id" INTEGER NOT NULL,
    "row_number" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "errors" JSON,
    "warnings" JSON,
    "original_data" JSON NOT NULL,
    "processed_data" JSON,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validation_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."entities" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "country_code" VARCHAR(2) NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "tax_number" VARCHAR(50),
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."currencies" (
    "code" VARCHAR(3) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "decimal_places" INTEGER NOT NULL DEFAULT 2,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "public"."fx_rates" (
    "id" UUID NOT NULL,
    "as_of_date" DATE NOT NULL,
    "base_code" VARCHAR(3) NOT NULL,
    "quote_code" VARCHAR(3) NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "source" VARCHAR(50) NOT NULL DEFAULT 'ecb',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fx_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vat_rates" (
    "id" UUID NOT NULL,
    "country_code" VARCHAR(2) NOT NULL,
    "rate_name" VARCHAR(50) NOT NULL,
    "rate_pct" DECIMAL(5,4) NOT NULL,
    "valid_from" DATE NOT NULL,
    "valid_to" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vat_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sales_tax_us" (
    "id" UUID NOT NULL,
    "state_code" VARCHAR(2) NOT NULL,
    "locality" VARCHAR(100),
    "rate_pct" DECIMAL(5,4) NOT NULL,
    "valid_from" DATE NOT NULL,
    "valid_to" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sales_tax_us_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."import_provenance" (
    "id" UUID NOT NULL,
    "import_job_id" UUID,
    "source_system" VARCHAR(100) NOT NULL,
    "batch_identifier" VARCHAR(100) NOT NULL,
    "import_timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "record_count" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_provenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ar_policies" (
    "id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "term_days" INTEGER NOT NULL,
    "pct_share" DECIMAL(5,4) NOT NULL,
    "fees_pct" DECIMAL(5,4) NOT NULL,
    "bad_debt_pct" DECIMAL(5,4) NOT NULL,
    "active_from" DATE NOT NULL,
    "active_to" DATE,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ar_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ap_policies" (
    "id" UUID NOT NULL,
    "supplier_id" VARCHAR(100) NOT NULL,
    "supplier_name" VARCHAR(200) NOT NULL,
    "term_days" INTEGER NOT NULL,
    "early_pay_discount_pct" DECIMAL(5,4),
    "early_pay_days" INTEGER,
    "strategy" VARCHAR(20) NOT NULL DEFAULT 'due',
    "active_from" DATE NOT NULL,
    "active_to" DATE,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ap_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory_policies" (
    "id" UUID NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "product_id" UUID NOT NULL,
    "target_dio" INTEGER NOT NULL,
    "service_level" DECIMAL(4,3) NOT NULL,
    "rop" INTEGER NOT NULL,
    "ss" INTEGER NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventory_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wc_projections" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "month" DATE NOT NULL,
    "cash_in" DECIMAL(15,2) NOT NULL,
    "cash_out" DECIMAL(15,2) NOT NULL,
    "net_change" DECIMAL(15,2) NOT NULL,
    "ending_cash" DECIMAL(15,2) NOT NULL,
    "scenario" VARCHAR(50) NOT NULL DEFAULT 'baseline',
    "currency_code" VARCHAR(3) NOT NULL DEFAULT 'GBP',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wc_projections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wc_kpis" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "projection_id" UUID NOT NULL,
    "scenario" VARCHAR(50) NOT NULL DEFAULT 'baseline',
    "dso" DECIMAL(6,2) NOT NULL,
    "dpo" DECIMAL(6,2) NOT NULL,
    "dio" DECIMAL(6,2) NOT NULL,
    "ccc" DECIMAL(6,2) NOT NULL,
    "inv_turnover" DECIMAL(6,2) NOT NULL,
    "wc_turnover" DECIMAL(6,2) NOT NULL,
    "min_cash" DECIMAL(15,2) NOT NULL,
    "facility_utilization" DECIMAL(5,4) NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wc_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wc_scenarios" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "scenario_type" VARCHAR(20) NOT NULL,
    "parameters" JSON NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "run_id" UUID,
    "created_by" UUID,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "wc_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wc_optimizations" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "recommendation_type" VARCHAR(50) NOT NULL,
    "current_state" JSON NOT NULL,
    "recommended_state" JSON NOT NULL,
    "impact_analysis" JSON NOT NULL,
    "implementation_notes" TEXT,
    "priority_score" DECIMAL(3,1) NOT NULL,
    "confidence_level" DECIMAL(3,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "implemented_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wc_optimizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" VARCHAR(255) NOT NULL,
    "access_token_hash" VARCHAR(255),
    "device_name" VARCHAR(200),
    "user_agent" VARCHAR(500),
    "ip_address" VARCHAR(45),
    "ip_country" VARCHAR(2),
    "ip_city" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "revoked_reason" VARCHAR(100),
    "is_suspicious" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "event_type" VARCHAR(50) NOT NULL,
    "event_data" JSON,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "session_id" UUID,
    "resource_type" VARCHAR(50),
    "resource_id" UUID,
    "old_value" JSON,
    "new_value" JSON,
    "severity" VARCHAR(10) NOT NULL DEFAULT 'info',
    "environment" VARCHAR(20) NOT NULL DEFAULT 'production',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sso_providers" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "provider_type" VARCHAR(50) NOT NULL,
    "metadata_url" VARCHAR(500),
    "client_id" VARCHAR(255),
    "client_secret" VARCHAR(255),
    "domain_whitelist" JSON,
    "default_role" VARCHAR(20) NOT NULL DEFAULT 'viewer',
    "default_entity_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sso_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feature_flags" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "rollout_pct" INTEGER NOT NULL DEFAULT 0,
    "environments" JSON,
    "user_filters" JSON,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."password_history" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_runs" (
    "id" UUID NOT NULL,
    "goal" TEXT NOT NULL,
    "mode" VARCHAR(20) NOT NULL,
    "scope" JSON,
    "budgets" JSON,
    "status" VARCHAR(20) NOT NULL,
    "userId" UUID,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "outcomes" JSON,
    "reflection" JSON,
    "lessons" JSON,
    "next_steps" JSON,
    "error" TEXT,

    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_steps" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "step_number" INTEGER NOT NULL,
    "tool_id" VARCHAR(100) NOT NULL,
    "params" JSON NOT NULL,
    "dependencies" JSON,
    "expected_outcome" JSON,
    "status" VARCHAR(20) NOT NULL,
    "result" JSON,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "agent_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tool_invocations" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "step_id" VARCHAR(100) NOT NULL,
    "tool_id" VARCHAR(100) NOT NULL,
    "params" JSON NOT NULL,
    "result" JSON,
    "status" VARCHAR(20) NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "finished_at" TIMESTAMPTZ(6),
    "metrics_json" JSON,

    CONSTRAINT "tool_invocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reflections" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "content" JSON NOT NULL,
    "score" DECIMAL(3,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reflections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lessons" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "content" TEXT NOT NULL,
    "recommendation" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."approvals" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "step_id" VARCHAR(100) NOT NULL,
    "approver_id" UUID,
    "decision" VARCHAR(20) NOT NULL,
    "reason" TEXT,
    "approved_at" TIMESTAMPTZ(6),

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_evals" (
    "id" UUID NOT NULL,
    "goal" TEXT NOT NULL,
    "dataset_key" VARCHAR(100),
    "simulate" BOOLEAN NOT NULL DEFAULT true,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "finished_at" TIMESTAMPTZ(6),
    "status" VARCHAR(20) NOT NULL,

    CONSTRAINT "agent_evals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_eval_cases" (
    "id" UUID NOT NULL,
    "eval_id" UUID NOT NULL,
    "tool" VARCHAR(100) NOT NULL,
    "params_json" JSON NOT NULL,
    "metrics_json" JSON NOT NULL,

    CONSTRAINT "agent_eval_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_eval_scores" (
    "id" UUID NOT NULL,
    "eval_id" UUID NOT NULL,
    "scorecard_json" JSON NOT NULL,
    "passed" BOOLEAN NOT NULL,

    CONSTRAINT "agent_eval_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_schedules" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "cron" VARCHAR(100) NOT NULL,
    "tz" VARCHAR(50) NOT NULL,
    "mode" VARCHAR(20) NOT NULL,
    "entity_id" UUID,
    "region" VARCHAR(10),
    "preset_key" VARCHAR(50),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "freeze_window_cron" VARCHAR(100),
    "last_run_at" TIMESTAMPTZ(6),

    CONSTRAINT "agent_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_policies" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "role_scope" VARCHAR(50) NOT NULL,
    "allowed_tools" TEXT[],
    "default_mode" VARCHAR(20) NOT NULL DEFAULT 'DRY_RUN',
    "max_steps" INTEGER NOT NULL DEFAULT 12,
    "wall_clock_ms" INTEGER NOT NULL DEFAULT 180000,
    "per_tool_budgets_json" JSON,
    "numeric_clamps_json" JSON,
    "require_step_up" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "agent_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_approvals" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "step_id" UUID NOT NULL,
    "approver_id" UUID NOT NULL,
    "approver_role" VARCHAR(50) NOT NULL,
    "decision" VARCHAR(20) NOT NULL,
    "reason" TEXT,
    "step_up_token" VARCHAR(255),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_safety_metrics" (
    "id" UUID NOT NULL,
    "period" DATE NOT NULL,
    "blocked_plans" INTEGER NOT NULL DEFAULT 0,
    "blocked_steps_by_rule" JSON NOT NULL,
    "exceeded_budgets" INTEGER NOT NULL DEFAULT 0,
    "disallowed_tools" JSON NOT NULL,
    "approval_requests" INTEGER NOT NULL DEFAULT 0,
    "approvals_granted" INTEGER NOT NULL DEFAULT 0,
    "approvals_rejected" INTEGER NOT NULL DEFAULT 0,
    "rate_limit_hits" INTEGER NOT NULL DEFAULT 0,
    "freeze_window_blocks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_safety_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dq_rules" (
    "id" UUID NOT NULL,
    "dataset" VARCHAR(100) NOT NULL,
    "rule_key" VARCHAR(100) NOT NULL,
    "severity" VARCHAR(10) NOT NULL,
    "config_json" JSON,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "dq_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dq_runs" (
    "id" UUID NOT NULL,
    "dataset" VARCHAR(100) NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "finished_at" TIMESTAMPTZ(6),
    "status" VARCHAR(20) NOT NULL,
    "profile_id" UUID,
    "ruleset_hash" VARCHAR(64),
    "total_rules" INTEGER NOT NULL DEFAULT 0,
    "passed_rules" INTEGER NOT NULL DEFAULT 0,
    "failed_rules" INTEGER NOT NULL DEFAULT 0,
    "warned_rules" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "dq_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dq_findings" (
    "id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "rule_key" VARCHAR(100) NOT NULL,
    "severity" VARCHAR(10) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "sample_ref" TEXT,
    "impact_value_base" DECIMAL(15,2),
    "impact_currency" VARCHAR(3),
    "notes" TEXT,

    CONSTRAINT "dq_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."model_artifacts" (
    "id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "run_id" UUID,
    "entity_id" UUID,
    "region" VARCHAR(10),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "metrics_json" JSON,
    "params_json" JSON,
    "artifact_url" TEXT,
    "status" VARCHAR(20) NOT NULL,
    "tags" TEXT[],
    "version" VARCHAR(50),

    CONSTRAINT "model_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."model_baselines" (
    "id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "entity_id" UUID,
    "region" VARCHAR(10),
    "active_from" TIMESTAMPTZ(6) NOT NULL,
    "active_to" TIMESTAMPTZ(6),
    "artifact_id" UUID NOT NULL,
    "approver_id" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "snapshot_json" JSON,

    CONSTRAINT "model_baselines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."import_lineage" (
    "id" UUID NOT NULL,
    "import_job_id" INTEGER NOT NULL,
    "validation_profile_id" UUID,
    "lineage_tag" TEXT NOT NULL,
    "ruleset_hash" VARCHAR(64),
    "rows_affected" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_lineage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ix_users_username" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ix_users_email" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "ix_user_last_login" ON "public"."users"("last_login");

-- CreateIndex
CREATE INDEX "ix_user_role_active" ON "public"."users"("role", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "ix_markets_code" ON "public"."markets"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ix_products_sku" ON "public"."products"("sku");

-- CreateIndex
CREATE INDEX "ix_product_active_created" ON "public"."products"("is_active", "created_at");

-- CreateIndex
CREATE INDEX "ix_product_category_market" ON "public"."products"("category", "market_region");

-- CreateIndex
CREATE INDEX "ix_sales_channel_active_sync" ON "public"."sales_channels"("is_active", "sync_enabled");

-- CreateIndex
CREATE INDEX "ix_sales_channel_last_sync" ON "public"."sales_channels"("last_sync_at");

-- CreateIndex
CREATE INDEX "ix_sales_channel_type_market" ON "public"."sales_channels"("channel_type", "market_code");

-- CreateIndex
CREATE INDEX "ix_historical_sales_date_channel" ON "public"."historical_sales"("sale_date", "sales_channel_id");

-- CreateIndex
CREATE INDEX "ix_historical_sales_date_product" ON "public"."historical_sales"("sale_date", "product_id");

-- CreateIndex
CREATE INDEX "ix_historical_sales_order" ON "public"."historical_sales"("order_id");

-- CreateIndex
CREATE INDEX "ix_historical_sales_product_channel_date" ON "public"."historical_sales"("product_id", "sales_channel_id", "sale_date");

-- CreateIndex
CREATE INDEX "ix_historical_sales_sale_date" ON "public"."historical_sales"("sale_date");

-- CreateIndex
CREATE INDEX "ix_historical_sales_timeseries" ON "public"."historical_sales"("product_id", "sales_channel_id", "sale_date", "quantity_sold");

-- CreateIndex
CREATE INDEX "ix_historical_sales_validated" ON "public"."historical_sales"("is_validated", "data_quality_score");

-- CreateIndex
CREATE INDEX "ix_historical_sales_entity_date" ON "public"."historical_sales"("entity_id", "sale_date");

-- CreateIndex
CREATE INDEX "ix_historical_sales_region_date" ON "public"."historical_sales"("region", "sale_date");

-- CreateIndex
CREATE INDEX "ix_historical_sales_currency_date" ON "public"."historical_sales"("currency_code_tx", "sale_date");

-- CreateIndex
CREATE INDEX "ix_historical_sales_batch" ON "public"."historical_sales"("import_batch_id");

-- CreateIndex
CREATE INDEX "ix_forecast_date_channel" ON "public"."forecasts"("forecast_date", "sales_channel_id");

-- CreateIndex
CREATE INDEX "ix_forecast_date_product" ON "public"."forecasts"("forecast_date", "product_id");

-- CreateIndex
CREATE INDEX "ix_forecast_model_type" ON "public"."forecasts"("model_type");

-- CreateIndex
CREATE INDEX "ix_forecast_product_channel_date" ON "public"."forecasts"("product_id", "sales_channel_id", "forecast_date");

-- CreateIndex
CREATE INDEX "ix_forecast_status_approved" ON "public"."forecasts"("status", "is_approved");

-- CreateIndex
CREATE INDEX "ix_forecasts_forecast_date" ON "public"."forecasts"("forecast_date");

-- CreateIndex
CREATE INDEX "ix_forecast_entity_date" ON "public"."forecasts"("entity_id", "forecast_date");

-- CreateIndex
CREATE INDEX "ix_forecast_region_date" ON "public"."forecasts"("region", "forecast_date");

-- CreateIndex
CREATE INDEX "ix_forecast_series_id" ON "public"."forecasts"("series_id");

-- CreateIndex
CREATE INDEX "ix_forecast_series_date" ON "public"."forecasts"("series_id", "forecast_date");

-- CreateIndex
CREATE UNIQUE INDEX "uq_forecast_product_channel_date_period" ON "public"."forecasts"("product_id", "sales_channel_id", "forecast_date", "forecast_period");

-- CreateIndex
CREATE INDEX "ix_inventory_country" ON "public"."inventory_levels"("country_code");

-- CreateIndex
CREATE INDEX "ix_inventory_levels_snapshot_date" ON "public"."inventory_levels"("snapshot_date");

-- CreateIndex
CREATE INDEX "ix_inventory_location_type" ON "public"."inventory_levels"("location_type");

-- CreateIndex
CREATE INDEX "ix_inventory_product_location" ON "public"."inventory_levels"("product_id", "location_id");

-- CreateIndex
CREATE INDEX "ix_inventory_snapshot_date" ON "public"."inventory_levels"("snapshot_date");

-- CreateIndex
CREATE INDEX "ix_inventory_status_date" ON "public"."inventory_levels"("status", "snapshot_date");

-- CreateIndex
CREATE INDEX "ix_inventory_entity_date" ON "public"."inventory_levels"("entity_id", "snapshot_date");

-- CreateIndex
CREATE INDEX "ix_inventory_region_date" ON "public"."inventory_levels"("region", "snapshot_date");

-- CreateIndex
CREATE INDEX "ix_inventory_currency_date" ON "public"."inventory_levels"("currency_code_valuation", "snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "uq_inventory_product_location_date" ON "public"."inventory_levels"("product_id", "location_id", "snapshot_date");

-- CreateIndex
CREATE INDEX "ix_working_capital_currency" ON "public"."working_capital"("currency_code");

-- CreateIndex
CREATE INDEX "ix_working_capital_date" ON "public"."working_capital"("projection_date");

-- CreateIndex
CREATE INDEX "ix_working_capital_market_date" ON "public"."working_capital"("market_code", "projection_date");

-- CreateIndex
CREATE INDEX "ix_working_capital_product_date" ON "public"."working_capital"("product_id", "projection_date");

-- CreateIndex
CREATE INDEX "ix_working_capital_projection_date" ON "public"."working_capital"("projection_date");

-- CreateIndex
CREATE INDEX "ix_working_capital_scenario_status" ON "public"."working_capital"("scenario_type", "status");

-- CreateIndex
CREATE INDEX "ix_wc_entity_date_scenario" ON "public"."working_capital"("entity_id", "projection_date", "scenario_type");

-- CreateIndex
CREATE INDEX "ix_wc_region_date" ON "public"."working_capital"("region", "projection_date");

-- CreateIndex
CREATE INDEX "ix_wc_base_currency_date" ON "public"."working_capital"("currency_code_base", "projection_date");

-- CreateIndex
CREATE INDEX "ix_wc_tax_jurisdiction" ON "public"."working_capital"("tax_jurisdiction", "projection_date");

-- CreateIndex
CREATE INDEX "ix_wc_compliance_risk" ON "public"."working_capital"("compliance_status", "risk_category");

-- CreateIndex
CREATE INDEX "ix_wc_consolidation_date" ON "public"."working_capital"("consolidation_group", "projection_date");

-- CreateIndex
CREATE INDEX "ix_wc_interco_elimination" ON "public"."working_capital"("intercompany_elimination_flag", "projection_date");

-- CreateIndex
CREATE UNIQUE INDEX "uq_working_capital_projection" ON "public"."working_capital"("product_id", "market_code", "sales_channel_id", "projection_date", "projection_period", "scenario_type");

-- CreateIndex
CREATE INDEX "ix_system_settings_active_effective" ON "public"."system_settings"("is_active", "effective_from", "effective_to");

-- CreateIndex
CREATE INDEX "ix_system_settings_category" ON "public"."system_settings"("category");

-- CreateIndex
CREATE INDEX "ix_system_settings_category_key" ON "public"."system_settings"("category", "key");

-- CreateIndex
CREATE INDEX "ix_system_settings_environment" ON "public"."system_settings"("environment");

-- CreateIndex
CREATE INDEX "ix_system_settings_key" ON "public"."system_settings"("key");

-- CreateIndex
CREATE INDEX "ix_system_settings_scope" ON "public"."system_settings"("scope", "scope_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_system_settings_active" ON "public"."system_settings"("category", "key", "scope", "scope_id", "environment", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ix_jobs_job_number" ON "public"."jobs"("job_number");

-- CreateIndex
CREATE INDEX "ix_resources_name" ON "public"."resources"("name");

-- CreateIndex
CREATE INDEX "ix_data_imports_created_user" ON "public"."data_imports"("created_at", "created_by");

-- CreateIndex
CREATE INDEX "ix_data_imports_import_type" ON "public"."data_imports"("import_type");

-- CreateIndex
CREATE INDEX "ix_data_imports_processing" ON "public"."data_imports"("status", "started_at");

-- CreateIndex
CREATE INDEX "ix_data_imports_status" ON "public"."data_imports"("status");

-- CreateIndex
CREATE INDEX "ix_data_imports_status_type" ON "public"."data_imports"("status", "import_type");

-- CreateIndex
CREATE INDEX "ix_import_errors_import_severity" ON "public"."import_errors"("import_id", "error_severity");

-- CreateIndex
CREATE INDEX "ix_import_errors_row" ON "public"."import_errors"("import_id", "row_number");

-- CreateIndex
CREATE INDEX "ix_import_errors_type_resolved" ON "public"."import_errors"("error_type", "is_resolved");

-- CreateIndex
CREATE INDEX "ix_import_logs_created" ON "public"."import_logs"("created_at");

-- CreateIndex
CREATE INDEX "ix_import_logs_import_level" ON "public"."import_logs"("import_id", "log_level");

-- CreateIndex
CREATE UNIQUE INDEX "import_templates_template_name_key" ON "public"."import_templates"("template_name");

-- CreateIndex
CREATE INDEX "ix_import_templates_type_active" ON "public"."import_templates"("import_type", "is_active");

-- CreateIndex
CREATE INDEX "ix_import_templates_usage" ON "public"."import_templates"("usage_count", "success_rate");

-- CreateIndex
CREATE INDEX "ix_import_jobs_status_date" ON "public"."import_job"("status", "uploaded_at");

-- CreateIndex
CREATE INDEX "ix_import_jobs_user_date" ON "public"."import_job"("uploaded_by", "uploaded_at");

-- CreateIndex
CREATE INDEX "ix_validation_results_job_status" ON "public"."validation_result"("import_job_id", "status");

-- CreateIndex
CREATE INDEX "ix_validation_results_job_row" ON "public"."validation_result"("import_job_id", "row_number");

-- CreateIndex
CREATE INDEX "ix_entity_country" ON "public"."entities"("country_code");

-- CreateIndex
CREATE INDEX "ix_entity_currency" ON "public"."entities"("currency_code");

-- CreateIndex
CREATE INDEX "ix_entity_active" ON "public"."entities"("is_active");

-- CreateIndex
CREATE INDEX "ix_fx_rate_date" ON "public"."fx_rates"("as_of_date");

-- CreateIndex
CREATE INDEX "ix_fx_rate_pair" ON "public"."fx_rates"("base_code", "quote_code");

-- CreateIndex
CREATE UNIQUE INDEX "fx_rates_as_of_date_base_code_quote_code_key" ON "public"."fx_rates"("as_of_date", "base_code", "quote_code");

-- CreateIndex
CREATE INDEX "ix_vat_rate_country_date" ON "public"."vat_rates"("country_code", "valid_from");

-- CreateIndex
CREATE INDEX "ix_vat_rate_validity" ON "public"."vat_rates"("valid_from", "valid_to");

-- CreateIndex
CREATE INDEX "ix_sales_tax_state_date" ON "public"."sales_tax_us"("state_code", "valid_from");

-- CreateIndex
CREATE INDEX "ix_provenance_system_time" ON "public"."import_provenance"("source_system", "import_timestamp");

-- CreateIndex
CREATE INDEX "ix_provenance_batch" ON "public"."import_provenance"("batch_identifier");

-- CreateIndex
CREATE INDEX "ix_ar_policy_channel_active" ON "public"."ar_policies"("channel_id", "active_from");

-- CreateIndex
CREATE UNIQUE INDEX "ar_policies_channel_id_active_from_key" ON "public"."ar_policies"("channel_id", "active_from");

-- CreateIndex
CREATE INDEX "ix_ap_policy_supplier_active" ON "public"."ap_policies"("supplier_id", "active_from");

-- CreateIndex
CREATE UNIQUE INDEX "ap_policies_supplier_id_active_from_key" ON "public"."ap_policies"("supplier_id", "active_from");

-- CreateIndex
CREATE INDEX "ix_inventory_policy_product_active" ON "public"."inventory_policies"("product_id", "effective_from");

-- CreateIndex
CREATE INDEX "ix_inventory_policy_sku" ON "public"."inventory_policies"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_policies_product_id_effective_from_key" ON "public"."inventory_policies"("product_id", "effective_from");

-- CreateIndex
CREATE INDEX "ix_wc_projection_run_scenario" ON "public"."wc_projections"("run_id", "scenario");

-- CreateIndex
CREATE INDEX "ix_wc_projection_month" ON "public"."wc_projections"("month");

-- CreateIndex
CREATE UNIQUE INDEX "wc_projections_run_id_month_scenario_key" ON "public"."wc_projections"("run_id", "month", "scenario");

-- CreateIndex
CREATE INDEX "ix_wc_kpis_run_scenario" ON "public"."wc_kpis"("run_id", "scenario");

-- CreateIndex
CREATE INDEX "ix_wc_kpis_ccc" ON "public"."wc_kpis"("ccc");

-- CreateIndex
CREATE UNIQUE INDEX "wc_kpis_run_id_projection_id_scenario_key" ON "public"."wc_kpis"("run_id", "projection_id", "scenario");

-- CreateIndex
CREATE INDEX "ix_wc_scenario_type_status" ON "public"."wc_scenarios"("scenario_type", "status");

-- CreateIndex
CREATE INDEX "ix_wc_scenario_creator" ON "public"."wc_scenarios"("created_by");

-- CreateIndex
CREATE INDEX "ix_wc_optimization_run" ON "public"."wc_optimizations"("run_id");

-- CreateIndex
CREATE INDEX "ix_wc_optimization_type_priority" ON "public"."wc_optimizations"("recommendation_type", "priority_score");

-- CreateIndex
CREATE INDEX "ix_wc_optimization_status_priority" ON "public"."wc_optimizations"("status", "priority_score");

-- CreateIndex
CREATE INDEX "ix_sessions_user_active" ON "public"."user_sessions"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "ix_sessions_refresh_token" ON "public"."user_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "ix_sessions_expires" ON "public"."user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "ix_sessions_suspicious" ON "public"."user_sessions"("is_suspicious", "created_at");

-- CreateIndex
CREATE INDEX "ix_sessions_ip_time" ON "public"."user_sessions"("ip_address", "created_at");

-- CreateIndex
CREATE INDEX "ix_audit_user_time" ON "public"."audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ix_audit_event_time" ON "public"."audit_logs"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "ix_audit_severity_time" ON "public"."audit_logs"("severity", "created_at");

-- CreateIndex
CREATE INDEX "ix_audit_resource" ON "public"."audit_logs"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "ix_audit_created" ON "public"."audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "ix_reset_tokens_user" ON "public"."password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "ix_reset_tokens_hash" ON "public"."password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "ix_reset_tokens_expires" ON "public"."password_reset_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_name_key" ON "public"."feature_flags"("name");

-- CreateIndex
CREATE INDEX "ix_password_history_user_date" ON "public"."password_history"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "agent_runs_userId_started_at_idx" ON "public"."agent_runs"("userId", "started_at");

-- CreateIndex
CREATE INDEX "agent_runs_status_idx" ON "public"."agent_runs"("status");

-- CreateIndex
CREATE INDEX "agent_steps_run_id_step_number_idx" ON "public"."agent_steps"("run_id", "step_number");

-- CreateIndex
CREATE INDEX "agent_steps_status_idx" ON "public"."agent_steps"("status");

-- CreateIndex
CREATE INDEX "tool_invocations_run_id_step_id_idx" ON "public"."tool_invocations"("run_id", "step_id");

-- CreateIndex
CREATE INDEX "tool_invocations_tool_id_started_at_idx" ON "public"."tool_invocations"("tool_id", "started_at");

-- CreateIndex
CREATE INDEX "reflections_run_id_idx" ON "public"."reflections"("run_id");

-- CreateIndex
CREATE INDEX "lessons_run_id_idx" ON "public"."lessons"("run_id");

-- CreateIndex
CREATE INDEX "lessons_type_idx" ON "public"."lessons"("type");

-- CreateIndex
CREATE INDEX "approvals_run_id_step_id_idx" ON "public"."approvals"("run_id", "step_id");

-- CreateIndex
CREATE INDEX "approvals_approver_id_idx" ON "public"."approvals"("approver_id");

-- CreateIndex
CREATE INDEX "agent_evals_status_idx" ON "public"."agent_evals"("status");

-- CreateIndex
CREATE INDEX "agent_eval_cases_eval_id_idx" ON "public"."agent_eval_cases"("eval_id");

-- CreateIndex
CREATE INDEX "agent_eval_scores_eval_id_idx" ON "public"."agent_eval_scores"("eval_id");

-- CreateIndex
CREATE INDEX "agent_eval_scores_passed_idx" ON "public"."agent_eval_scores"("passed");

-- CreateIndex
CREATE INDEX "agent_schedules_enabled_idx" ON "public"."agent_schedules"("enabled");

-- CreateIndex
CREATE INDEX "agent_schedules_last_run_at_idx" ON "public"."agent_schedules"("last_run_at");

-- CreateIndex
CREATE INDEX "agent_policies_role_scope_active_idx" ON "public"."agent_policies"("role_scope", "active");

-- CreateIndex
CREATE INDEX "agent_policies_created_at_idx" ON "public"."agent_policies"("created_at");

-- CreateIndex
CREATE INDEX "agent_approvals_run_id_step_id_idx" ON "public"."agent_approvals"("run_id", "step_id");

-- CreateIndex
CREATE INDEX "agent_approvals_approver_id_idx" ON "public"."agent_approvals"("approver_id");

-- CreateIndex
CREATE INDEX "agent_approvals_decision_idx" ON "public"."agent_approvals"("decision");

-- CreateIndex
CREATE INDEX "agent_approvals_expires_at_idx" ON "public"."agent_approvals"("expires_at");

-- CreateIndex
CREATE INDEX "agent_safety_metrics_period_idx" ON "public"."agent_safety_metrics"("period");

-- CreateIndex
CREATE UNIQUE INDEX "agent_safety_metrics_period_key" ON "public"."agent_safety_metrics"("period");

-- CreateIndex
CREATE INDEX "dq_rules_dataset_active_idx" ON "public"."dq_rules"("dataset", "active");

-- CreateIndex
CREATE UNIQUE INDEX "dq_rules_dataset_rule_key_key" ON "public"."dq_rules"("dataset", "rule_key");

-- CreateIndex
CREATE INDEX "dq_runs_dataset_started_at_idx" ON "public"."dq_runs"("dataset", "started_at");

-- CreateIndex
CREATE INDEX "dq_runs_status_idx" ON "public"."dq_runs"("status");

-- CreateIndex
CREATE INDEX "dq_findings_run_id_idx" ON "public"."dq_findings"("run_id");

-- CreateIndex
CREATE INDEX "dq_findings_rule_key_severity_idx" ON "public"."dq_findings"("rule_key", "severity");

-- CreateIndex
CREATE INDEX "model_artifacts_type_created_at_idx" ON "public"."model_artifacts"("type", "created_at");

-- CreateIndex
CREATE INDEX "model_artifacts_entity_id_region_idx" ON "public"."model_artifacts"("entity_id", "region");

-- CreateIndex
CREATE INDEX "model_artifacts_status_idx" ON "public"."model_artifacts"("status");

-- CreateIndex
CREATE INDEX "model_baselines_type_entity_id_region_active_to_idx" ON "public"."model_baselines"("type", "entity_id", "region", "active_to");

-- CreateIndex
CREATE INDEX "model_baselines_artifact_id_idx" ON "public"."model_baselines"("artifact_id");

-- CreateIndex
CREATE UNIQUE INDEX "model_baselines_type_entity_id_region_active_from_key" ON "public"."model_baselines"("type", "entity_id", "region", "active_from");

-- CreateIndex
CREATE INDEX "import_lineage_import_job_id_idx" ON "public"."import_lineage"("import_job_id");

-- CreateIndex
CREATE INDEX "import_lineage_lineage_tag_idx" ON "public"."import_lineage"("lineage_tag");

-- AddForeignKey
ALTER TABLE "public"."markets" ADD CONSTRAINT "markets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."sales_channels" ADD CONSTRAINT "sales_channels_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."sales_channels" ADD CONSTRAINT "sales_channels_market_code_fkey" FOREIGN KEY ("market_code") REFERENCES "public"."markets"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."historical_sales" ADD CONSTRAINT "historical_sales_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."historical_sales" ADD CONSTRAINT "historical_sales_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."historical_sales" ADD CONSTRAINT "historical_sales_sales_channel_id_fkey" FOREIGN KEY ("sales_channel_id") REFERENCES "public"."sales_channels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."historical_sales" ADD CONSTRAINT "historical_sales_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."historical_sales" ADD CONSTRAINT "historical_sales_currency_code_tx_fkey" FOREIGN KEY ("currency_code_tx") REFERENCES "public"."currencies"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."historical_sales" ADD CONSTRAINT "historical_sales_currency_code_base_fkey" FOREIGN KEY ("currency_code_base") REFERENCES "public"."currencies"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."forecasts" ADD CONSTRAINT "forecasts_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."forecasts" ADD CONSTRAINT "forecasts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."forecasts" ADD CONSTRAINT "forecasts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."forecasts" ADD CONSTRAINT "forecasts_sales_channel_id_fkey" FOREIGN KEY ("sales_channel_id") REFERENCES "public"."sales_channels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."forecasts" ADD CONSTRAINT "forecasts_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."forecasts" ADD CONSTRAINT "forecasts_currency_code_tx_fkey" FOREIGN KEY ("currency_code_tx") REFERENCES "public"."currencies"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."forecasts" ADD CONSTRAINT "forecasts_currency_code_base_fkey" FOREIGN KEY ("currency_code_base") REFERENCES "public"."currencies"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."inventory_levels" ADD CONSTRAINT "inventory_levels_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."inventory_levels" ADD CONSTRAINT "inventory_levels_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."inventory_levels" ADD CONSTRAINT "inventory_levels_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."inventory_levels" ADD CONSTRAINT "inventory_levels_currency_code_valuation_fkey" FOREIGN KEY ("currency_code_valuation") REFERENCES "public"."currencies"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."inventory_levels" ADD CONSTRAINT "inventory_levels_currency_code_base_fkey" FOREIGN KEY ("currency_code_base") REFERENCES "public"."currencies"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."working_capital" ADD CONSTRAINT "working_capital_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."working_capital" ADD CONSTRAINT "working_capital_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."working_capital" ADD CONSTRAINT "working_capital_market_code_fkey" FOREIGN KEY ("market_code") REFERENCES "public"."markets"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."working_capital" ADD CONSTRAINT "working_capital_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."working_capital" ADD CONSTRAINT "working_capital_sales_channel_id_fkey" FOREIGN KEY ("sales_channel_id") REFERENCES "public"."sales_channels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."working_capital" ADD CONSTRAINT "working_capital_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."working_capital" ADD CONSTRAINT "working_capital_currency_code_base_fkey" FOREIGN KEY ("currency_code_base") REFERENCES "public"."currencies"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."working_capital" ADD CONSTRAINT "working_capital_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "public"."currencies"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."system_settings" ADD CONSTRAINT "system_settings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."system_settings" ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."schedules" ADD CONSTRAINT "schedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."data_imports" ADD CONSTRAINT "data_imports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."import_errors" ADD CONSTRAINT "import_errors_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "public"."data_imports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."import_errors" ADD CONSTRAINT "import_errors_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."import_logs" ADD CONSTRAINT "import_logs_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "public"."data_imports"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."import_templates" ADD CONSTRAINT "import_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."import_job" ADD CONSTRAINT "import_job_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."validation_result" ADD CONSTRAINT "validation_result_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "public"."import_job"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."fx_rates" ADD CONSTRAINT "fx_rates_base_code_fkey" FOREIGN KEY ("base_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fx_rates" ADD CONSTRAINT "fx_rates_quote_code_fkey" FOREIGN KEY ("quote_code") REFERENCES "public"."currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ar_policies" ADD CONSTRAINT "ar_policies_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."sales_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ar_policies" ADD CONSTRAINT "ar_policies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ap_policies" ADD CONSTRAINT "ap_policies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_policies" ADD CONSTRAINT "inventory_policies_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_policies" ADD CONSTRAINT "inventory_policies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wc_projections" ADD CONSTRAINT "wc_projections_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wc_kpis" ADD CONSTRAINT "wc_kpis_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wc_kpis" ADD CONSTRAINT "wc_kpis_projection_id_fkey" FOREIGN KEY ("projection_id") REFERENCES "public"."wc_projections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wc_scenarios" ADD CONSTRAINT "wc_scenarios_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wc_scenarios" ADD CONSTRAINT "wc_scenarios_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wc_optimizations" ADD CONSTRAINT "wc_optimizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wc_optimizations" ADD CONSTRAINT "wc_optimizations_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_runs" ADD CONSTRAINT "agent_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_steps" ADD CONSTRAINT "agent_steps_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tool_invocations" ADD CONSTRAINT "tool_invocations_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reflections" ADD CONSTRAINT "reflections_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."approvals" ADD CONSTRAINT "approvals_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."agent_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."approvals" ADD CONSTRAINT "approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_eval_cases" ADD CONSTRAINT "agent_eval_cases_eval_id_fkey" FOREIGN KEY ("eval_id") REFERENCES "public"."agent_evals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_eval_scores" ADD CONSTRAINT "agent_eval_scores_eval_id_fkey" FOREIGN KEY ("eval_id") REFERENCES "public"."agent_evals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dq_findings" ADD CONSTRAINT "dq_findings_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."dq_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."model_baselines" ADD CONSTRAINT "model_baselines_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "public"."model_artifacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
