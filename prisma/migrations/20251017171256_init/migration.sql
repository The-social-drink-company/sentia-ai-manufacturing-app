-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'OPERATOR', 'ANALYST', 'VIEWER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "password_hash" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verification_token" TEXT,
    "password_reset_token" TEXT,
    "password_reset_expires" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "permissions" JSON,
    "organization_id" TEXT NOT NULL,
    "department_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "last_login_ip" TEXT,
    "login_count" INTEGER NOT NULL DEFAULT 0,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "account_locked_until" TIMESTAMP(3),
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT,
    "preferences" JSON,
    "dashboard_layout" JSON,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "domain" TEXT,
    "logo" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "settings" JSON NOT NULL DEFAULT '{}',
    "features" JSON NOT NULL DEFAULT '{}',
    "apiKeys" JSON,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "plan_expiry" TIMESTAMP(3),
    "billing_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "manager" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "working_capital" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "revenue" DECIMAL(15,2) NOT NULL,
    "cogs" DECIMAL(15,2) NOT NULL,
    "gross_profit" DECIMAL(15,2) NOT NULL,
    "gross_margin" DECIMAL(5,2) NOT NULL,
    "accounts_receivable" DECIMAL(15,2) NOT NULL,
    "inventory" DECIMAL(15,2) NOT NULL,
    "accounts_payable" DECIMAL(15,2) NOT NULL,
    "working_capital" DECIMAL(15,2) NOT NULL,
    "dso" INTEGER NOT NULL,
    "dio" INTEGER NOT NULL,
    "dpo" INTEGER NOT NULL,
    "ccc" INTEGER NOT NULL,
    "inventory_turnover" DECIMAL(8,2) NOT NULL,
    "receivables_turnover" DECIMAL(8,2) NOT NULL,
    "payables_turnover" DECIMAL(8,2) NOT NULL,
    "quick_ratio" DECIMAL(8,2) NOT NULL,
    "current_ratio" DECIMAL(8,2) NOT NULL,
    "working_capital_ratio" DECIMAL(8,2) NOT NULL,
    "ai_score" DOUBLE PRECISION,
    "ai_recommendations" JSON,
    "embedding" vector(1536),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "working_capital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_flow_forecasts" (
    "id" TEXT NOT NULL,
    "working_capital_id" TEXT NOT NULL,
    "forecast_date" TIMESTAMP(3) NOT NULL,
    "horizon" INTEGER NOT NULL DEFAULT 30,
    "opening_balance" DECIMAL(15,2) NOT NULL,
    "cash_inflows" DECIMAL(15,2) NOT NULL,
    "cash_outflows" DECIMAL(15,2) NOT NULL,
    "closing_balance" DECIMAL(15,2) NOT NULL,
    "sales_receipts" DECIMAL(15,2) NOT NULL,
    "supplier_payments" DECIMAL(15,2) NOT NULL,
    "payroll_expenses" DECIMAL(15,2) NOT NULL,
    "overhead_expenses" DECIMAL(15,2) NOT NULL,
    "capital_expenses" DECIMAL(15,2) NOT NULL,
    "cash_runway" INTEGER,
    "burn_rate" DECIMAL(15,2),
    "confidence" DOUBLE PRECISION,
    "model_version" TEXT NOT NULL,
    "assumptions" JSON,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_flow_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "what_if_scenarios" (
    "id" TEXT NOT NULL,
    "working_capital_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "revenue_change" DECIMAL(5,2) NOT NULL,
    "cogs_change" DECIMAL(5,2) NOT NULL,
    "dso_change" INTEGER NOT NULL,
    "dio_change" INTEGER NOT NULL,
    "dpo_change" INTEGER NOT NULL,
    "projected_revenue" DECIMAL(15,2) NOT NULL,
    "projected_cogs" DECIMAL(15,2) NOT NULL,
    "projected_wc" DECIMAL(15,2) NOT NULL,
    "projected_ccc" INTEGER NOT NULL,
    "impact" DECIMAL(15,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "what_if_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "selling_price" DECIMAL(10,2) NOT NULL,
    "weight" DECIMAL(8,3),
    "dimensions" JSON,
    "lead_time" INTEGER NOT NULL,
    "moq" INTEGER NOT NULL DEFAULT 1,
    "batch_size" INTEGER,
    "safety_stock" INTEGER NOT NULL DEFAULT 0,
    "reorder_point" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "discontinued_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "location" TEXT,
    "quantity_on_hand" INTEGER NOT NULL,
    "quantity_available" INTEGER NOT NULL,
    "quantity_reserved" INTEGER NOT NULL DEFAULT 0,
    "quantity_in_transit" INTEGER NOT NULL DEFAULT 0,
    "batch_number" TEXT,
    "serial_number" TEXT,
    "expiry_date" TIMESTAMP(3),
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "total_value" DECIMAL(15,2) NOT NULL,
    "last_counted" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "total_cost" DECIMAL(15,2) NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "from_location" TEXT,
    "to_location" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "performed_by" TEXT NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_jobs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "job_number" TEXT NOT NULL,
    "work_order_number" TEXT,
    "quantity_ordered" INTEGER NOT NULL,
    "quantity_produced" INTEGER NOT NULL DEFAULT 0,
    "quantity_rejected" INTEGER NOT NULL DEFAULT 0,
    "planned_start" TIMESTAMP(3) NOT NULL,
    "planned_end" TIMESTAMP(3) NOT NULL,
    "actual_start" TIMESTAMP(3),
    "actual_end" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "assigned_line" TEXT,
    "assigned_team" TEXT,
    "labor_hours" DECIMAL(8,2),
    "machine_hours" DECIMAL(8,2),
    "material_cost" DECIMAL(12,2),
    "labor_cost" DECIMAL(12,2),
    "overhead_cost" DECIMAL(12,2),
    "total_cost" DECIMAL(12,2),
    "quality_score" DOUBLE PRECISION,
    "defect_rate" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "production_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_records" (
    "id" TEXT NOT NULL,
    "production_job_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "inspection_type" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "sample_size" INTEGER NOT NULL,
    "passed" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL,
    "pass_rate" DOUBLE PRECISION NOT NULL,
    "defects" JSON,
    "root_cause" TEXT,
    "corrective_action" TEXT,
    "measurements" JSON,
    "specifications" JSON,
    "inspected_by" TEXT NOT NULL,
    "inspected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "quality_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demand_forecasts" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "forecast_date" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "horizon" INTEGER NOT NULL,
    "baseline_demand" INTEGER NOT NULL,
    "seasonal_factor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "trend_factor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "forecasted_demand" INTEGER NOT NULL,
    "lower_bound" INTEGER NOT NULL,
    "upper_bound" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "model_type" TEXT NOT NULL,
    "model_version" TEXT NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "ai_adjustment" DOUBLE PRECISION,
    "ai_rationale" TEXT,
    "embedding" vector(1536),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demand_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'CUSTOM',
    "layout" JSON NOT NULL,
    "widgets" JSON NOT NULL,
    "filters" JSON,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "share_token" TEXT,
    "shared_with" JSON,
    "last_accessed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "details" JSON NOT NULL,
    "metrics" JSON,
    "model_used" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT,
    "embedding" vector(1536),
    "suggested_actions" JSON,
    "action_taken" TEXT,
    "action_result" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "viewed_at" TIMESTAMP(3),
    "dismissed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcp_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tool_name" TEXT NOT NULL,
    "tool_version" TEXT NOT NULL,
    "request_type" TEXT NOT NULL,
    "input" JSON NOT NULL,
    "parameters" JSON,
    "context" JSON,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "output" JSON,
    "error" TEXT,
    "processing_time" INTEGER,
    "tokens_used" INTEGER,
    "model_used" TEXT,
    "trace_id" TEXT NOT NULL,
    "parent_request_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "mcp_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vector_store" (
    "id" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSON NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_latest" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vector_store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "old_values" JSON,
    "new_values" JSON,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "request_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSON NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSON,
    "action_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_exports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "filters" JSON,
    "columns" JSON,
    "date_range" JSON,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER,
    "file_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "data_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_jobs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cron_expression" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "config" JSON NOT NULL,
    "timeout" INTEGER NOT NULL DEFAULT 300000,
    "retry_count" INTEGER NOT NULL DEFAULT 3,
    "last_run_at" TIMESTAMP(3),
    "last_run_status" TEXT,
    "last_run_duration" INTEGER,
    "last_error" TEXT,
    "next_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_name_key" ON "organizations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_domain_key" ON "organizations"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_organization_id_name_key" ON "departments"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "working_capital_organization_id_idx" ON "working_capital"("organization_id");

-- CreateIndex
CREATE INDEX "working_capital_period_start_period_end_idx" ON "working_capital"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "working_capital_status_idx" ON "working_capital"("status");

-- CreateIndex
CREATE INDEX "cash_flow_forecasts_working_capital_id_idx" ON "cash_flow_forecasts"("working_capital_id");

-- CreateIndex
CREATE INDEX "cash_flow_forecasts_forecast_date_idx" ON "cash_flow_forecasts"("forecast_date");

-- CreateIndex
CREATE INDEX "what_if_scenarios_working_capital_id_idx" ON "what_if_scenarios"("working_capital_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_organization_id_idx" ON "products"("organization_id");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "inventory_items_organization_id_idx" ON "inventory_items"("organization_id");

-- CreateIndex
CREATE INDEX "inventory_items_product_id_idx" ON "inventory_items"("product_id");

-- CreateIndex
CREATE INDEX "inventory_items_warehouse_id_idx" ON "inventory_items"("warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_product_id_warehouse_id_batch_number_key" ON "inventory_items"("product_id", "warehouse_id", "batch_number");

-- CreateIndex
CREATE INDEX "inventory_movements_inventory_item_id_idx" ON "inventory_movements"("inventory_item_id");

-- CreateIndex
CREATE INDEX "inventory_movements_performed_at_idx" ON "inventory_movements"("performed_at");

-- CreateIndex
CREATE UNIQUE INDEX "production_jobs_job_number_key" ON "production_jobs"("job_number");

-- CreateIndex
CREATE INDEX "production_jobs_organization_id_idx" ON "production_jobs"("organization_id");

-- CreateIndex
CREATE INDEX "production_jobs_product_id_idx" ON "production_jobs"("product_id");

-- CreateIndex
CREATE INDEX "production_jobs_status_idx" ON "production_jobs"("status");

-- CreateIndex
CREATE INDEX "production_jobs_planned_start_idx" ON "production_jobs"("planned_start");

-- CreateIndex
CREATE INDEX "quality_records_production_job_id_idx" ON "quality_records"("production_job_id");

-- CreateIndex
CREATE INDEX "quality_records_product_id_idx" ON "quality_records"("product_id");

-- CreateIndex
CREATE INDEX "quality_records_inspected_at_idx" ON "quality_records"("inspected_at");

-- CreateIndex
CREATE INDEX "demand_forecasts_product_id_idx" ON "demand_forecasts"("product_id");

-- CreateIndex
CREATE INDEX "demand_forecasts_forecast_date_idx" ON "demand_forecasts"("forecast_date");

-- CreateIndex
CREATE UNIQUE INDEX "dashboards_share_token_key" ON "dashboards"("share_token");

-- CreateIndex
CREATE INDEX "dashboards_user_id_idx" ON "dashboards"("user_id");

-- CreateIndex
CREATE INDEX "ai_insights_user_id_idx" ON "ai_insights"("user_id");

-- CreateIndex
CREATE INDEX "ai_insights_type_idx" ON "ai_insights"("type");

-- CreateIndex
CREATE INDEX "ai_insights_category_idx" ON "ai_insights"("category");

-- CreateIndex
CREATE INDEX "ai_insights_status_idx" ON "ai_insights"("status");

-- CreateIndex
CREATE INDEX "mcp_requests_user_id_idx" ON "mcp_requests"("user_id");

-- CreateIndex
CREATE INDEX "mcp_requests_tool_name_idx" ON "mcp_requests"("tool_name");

-- CreateIndex
CREATE INDEX "mcp_requests_status_idx" ON "mcp_requests"("status");

-- CreateIndex
CREATE INDEX "mcp_requests_created_at_idx" ON "mcp_requests"("created_at");

-- CreateIndex
CREATE INDEX "vector_store_namespace_idx" ON "vector_store"("namespace");

-- CreateIndex
CREATE UNIQUE INDEX "vector_store_namespace_key_version_key" ON "vector_store"("namespace", "key", "version");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_category_idx" ON "system_settings"("category");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "data_exports_user_id_idx" ON "data_exports"("user_id");

-- CreateIndex
CREATE INDEX "data_exports_status_idx" ON "data_exports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_jobs_name_key" ON "scheduled_jobs"("name");

-- CreateIndex
CREATE INDEX "scheduled_jobs_is_active_idx" ON "scheduled_jobs"("is_active");

-- CreateIndex
CREATE INDEX "scheduled_jobs_next_run_at_idx" ON "scheduled_jobs"("next_run_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_capital" ADD CONSTRAINT "working_capital_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow_forecasts" ADD CONSTRAINT "cash_flow_forecasts_working_capital_id_fkey" FOREIGN KEY ("working_capital_id") REFERENCES "working_capital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "what_if_scenarios" ADD CONSTRAINT "what_if_scenarios_working_capital_id_fkey" FOREIGN KEY ("working_capital_id") REFERENCES "working_capital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_jobs" ADD CONSTRAINT "production_jobs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_jobs" ADD CONSTRAINT "production_jobs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_records" ADD CONSTRAINT "quality_records_production_job_id_fkey" FOREIGN KEY ("production_job_id") REFERENCES "production_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_records" ADD CONSTRAINT "quality_records_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demand_forecasts" ADD CONSTRAINT "demand_forecasts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcp_requests" ADD CONSTRAINT "mcp_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_exports" ADD CONSTRAINT "data_exports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

