-- CapLiquify Manufacturing Platform - ENTERPRISE DATABASE SCHEMA
-- Real production database schema for world-class enterprise features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'operator', 'viewer');
CREATE TYPE order_status AS ENUM ('Pending', 'Unshipped', 'PartiallyShipped', 'Shipped', 'Delivered', 'Cancelled');
CREATE TYPE production_status AS ENUM ('Planned', 'InProgress', 'Completed', 'OnHold', 'Cancelled');
CREATE TYPE fulfillment_channel AS ENUM ('MFN', 'AFN');

-- Core users table with Clerk integration
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role NOT NULL DEFAULT 'viewer',
    organization VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- Amazon SP-API Integration Tables
CREATE TABLE amazon_inventory (
    id SERIAL PRIMARY KEY,
    asin VARCHAR(50) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    fnsku VARCHAR(50),
    product_name TEXT,
    total_quantity INTEGER DEFAULT 0,
    in_stock_supply_quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    fulfillable_quantity INTEGER DEFAULT 0,
    inbound_working_quantity INTEGER DEFAULT 0,
    inbound_shipped_quantity INTEGER DEFAULT 0,
    condition_type VARCHAR(20) DEFAULT 'NEW',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for amazon_inventory
CREATE UNIQUE INDEX idx_amazon_inventory_asin ON amazon_inventory(asin);
CREATE INDEX idx_amazon_inventory_sku ON amazon_inventory(sku);
CREATE INDEX idx_amazon_inventory_low_stock ON amazon_inventory(fulfillable_quantity) WHERE fulfillable_quantity < 20;
CREATE INDEX idx_amazon_inventory_updated ON amazon_inventory(last_updated DESC);

-- Amazon orders table
CREATE TABLE amazon_orders (
    id SERIAL PRIMARY KEY,
    amazon_order_id VARCHAR(50) UNIQUE NOT NULL,
    order_status order_status NOT NULL,
    purchase_date TIMESTAMPTZ NOT NULL,
    order_total DECIMAL(10,2) DEFAULT 0,
    currency_code VARCHAR(3) DEFAULT 'USD',
    number_of_items_shipped INTEGER DEFAULT 0,
    number_of_items_unshipped INTEGER DEFAULT 0,
    fulfillment_channel fulfillment_channel,
    sales_channel VARCHAR(50),
    order_channel VARCHAR(50),
    ship_service_level VARCHAR(50),
    marketplace_id VARCHAR(20),
    buyer_email VARCHAR(255),
    buyer_name VARCHAR(255),
    shipping_address JSONB,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for amazon_orders
CREATE UNIQUE INDEX idx_amazon_orders_order_id ON amazon_orders(amazon_order_id);
CREATE INDEX idx_amazon_orders_purchase_date ON amazon_orders(purchase_date DESC);
CREATE INDEX idx_amazon_orders_status ON amazon_orders(order_status);
CREATE INDEX idx_amazon_orders_total ON amazon_orders(order_total DESC);

-- Amazon FBA shipments table
CREATE TABLE amazon_fba_shipments (
    id SERIAL PRIMARY KEY,
    shipment_id VARCHAR(50) UNIQUE NOT NULL,
    shipment_name VARCHAR(255),
    shipment_status VARCHAR(50),
    destination_fulfillment_center_id VARCHAR(20),
    label_prep_preference VARCHAR(50),
    are_cases_required BOOLEAN DEFAULT FALSE,
    confirmed_need_by_date TIMESTAMPTZ,
    box_contents_source VARCHAR(50),
    estimated_box_contents_fee DECIMAL(10,2),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for amazon_fba_shipments
CREATE UNIQUE INDEX idx_fba_shipments_id ON amazon_fba_shipments(shipment_id);
CREATE INDEX idx_fba_shipments_status ON amazon_fba_shipments(shipment_status);
CREATE INDEX idx_fba_shipments_need_by_date ON amazon_fba_shipments(confirmed_need_by_date);

-- Shopify Multi-Store Integration Tables
CREATE TABLE shopify_stores (
    id SERIAL PRIMARY KEY,
    store_domain VARCHAR(255) UNIQUE NOT NULL,
    store_name VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    webhook_verified BOOLEAN DEFAULT FALSE,
    plan_name VARCHAR(100),
    country_code VARCHAR(3),
    currency VARCHAR(3),
    timezone VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for shopify_stores
CREATE UNIQUE INDEX idx_shopify_stores_domain ON shopify_stores(store_domain);
CREATE INDEX idx_shopify_stores_active ON shopify_stores(is_active) WHERE is_active = TRUE;

-- Shopify products table
CREATE TABLE shopify_products (
    id SERIAL PRIMARY KEY,
    shopify_product_id BIGINT NOT NULL,
    store_id INTEGER REFERENCES shopify_stores(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    handle VARCHAR(255),
    vendor VARCHAR(255),
    product_type VARCHAR(255),
    tags TEXT[],
    status VARCHAR(20) DEFAULT 'active',
    total_inventory INTEGER DEFAULT 0,
    price DECIMAL(10,2),
    compare_at_price DECIMAL(10,2),
    sku VARCHAR(100),
    barcode VARCHAR(50),
    weight DECIMAL(10,3),
    requires_shipping BOOLEAN DEFAULT TRUE,
    taxable BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for shopify_products
CREATE UNIQUE INDEX idx_shopify_products_store_product ON shopify_products(store_id, shopify_product_id);
CREATE INDEX idx_shopify_products_sku ON shopify_products(sku);
CREATE INDEX idx_shopify_products_vendor ON shopify_products(vendor);
CREATE INDEX idx_shopify_products_inventory ON shopify_products(total_inventory);

-- Shopify orders table
CREATE TABLE shopify_orders (
    id SERIAL PRIMARY KEY,
    shopify_order_id BIGINT NOT NULL,
    store_id INTEGER REFERENCES shopify_stores(id) ON DELETE CASCADE,
    order_number VARCHAR(50),
    email VARCHAR(255),
    total_price DECIMAL(10,2) NOT NULL,
    subtotal_price DECIMAL(10,2),
    total_tax DECIMAL(10,2),
    currency VARCHAR(3),
    financial_status VARCHAR(50),
    fulfillment_status VARCHAR(50),
    order_status_url TEXT,
    processed_at TIMESTAMPTZ,
    customer_id BIGINT,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    shipping_address JSONB,
    billing_address JSONB,
    line_items JSONB,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for shopify_orders
CREATE UNIQUE INDEX idx_shopify_orders_store_order ON shopify_orders(store_id, shopify_order_id);
CREATE INDEX idx_shopify_orders_processed_at ON shopify_orders(processed_at DESC);
CREATE INDEX idx_shopify_orders_total_price ON shopify_orders(total_price DESC);
CREATE INDEX idx_shopify_orders_customer ON shopify_orders(customer_id);

-- Manufacturing & ERP Integration Tables
CREATE TABLE production_batches (
    id SERIAL PRIMARY KEY,
    batch_number VARCHAR(100) UNIQUE NOT NULL,
    product_id INTEGER,
    product_name VARCHAR(255) NOT NULL,
    planned_quantity INTEGER NOT NULL,
    actual_quantity INTEGER DEFAULT 0,
    status production_status DEFAULT 'Planned',
    priority INTEGER DEFAULT 5,
    scheduled_start TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    scheduled_completion TIMESTAMPTZ,
    actual_completion TIMESTAMPTZ,
    production_line VARCHAR(100),
    operator_id INTEGER REFERENCES users(id),
    quality_score DECIMAL(5,2),
    yield_percentage DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for production_batches
CREATE UNIQUE INDEX idx_production_batches_number ON production_batches(batch_number);
CREATE INDEX idx_production_batches_status ON production_batches(status);
CREATE INDEX idx_production_batches_scheduled ON production_batches(scheduled_start);
CREATE INDEX idx_production_batches_line ON production_batches(production_line);

-- Manufacturing resources table
CREATE TABLE manufacturing_resources (
    id SERIAL PRIMARY KEY,
    resource_name VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    capacity_per_hour DECIMAL(10,2),
    utilization_rate DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    maintenance_due_date TIMESTAMPTZ,
    location VARCHAR(255),
    cost_per_hour DECIMAL(10,2),
    efficiency_rating DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for manufacturing_resources
CREATE INDEX idx_resources_name ON manufacturing_resources(resource_name);
CREATE INDEX idx_resources_type ON manufacturing_resources(resource_type);
CREATE INDEX idx_resources_status ON manufacturing_resources(status);
CREATE INDEX idx_resources_utilization ON manufacturing_resources(utilization_rate DESC);

-- Quality control metrics table
CREATE TABLE quality_metrics (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES production_batches(id) ON DELETE CASCADE,
    metric_name VARCHAR(255) NOT NULL,
    metric_value DECIMAL(15,6),
    target_value DECIMAL(15,6),
    tolerance_upper DECIMAL(15,6),
    tolerance_lower DECIMAL(15,6),
    unit_of_measure VARCHAR(50),
    passed BOOLEAN,
    measured_by INTEGER REFERENCES users(id),
    measured_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Indexes for quality_metrics
CREATE INDEX idx_quality_metrics_batch ON quality_metrics(batch_id);
CREATE INDEX idx_quality_metrics_name ON quality_metrics(metric_name);
CREATE INDEX idx_quality_metrics_passed ON quality_metrics(passed);
CREATE INDEX idx_quality_metrics_measured_at ON quality_metrics(measured_at DESC);

-- Dashboard and analytics tables
CREATE TABLE user_dashboards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    dashboard_name VARCHAR(255) NOT NULL,
    layout JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user_dashboards
CREATE INDEX idx_user_dashboards_user_id ON user_dashboards(user_id);
CREATE INDEX idx_user_dashboards_default ON user_dashboards(is_default) WHERE is_default = TRUE;

-- System performance and monitoring tables
CREATE TABLE performance_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(255) NOT NULL,
    metric_value DECIMAL(15,6),
    metric_type VARCHAR(50),
    source_system VARCHAR(100),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance_metrics
CREATE INDEX idx_performance_metrics_name_time ON performance_metrics(metric_name, recorded_at DESC);
CREATE INDEX idx_performance_metrics_type ON performance_metrics(metric_type);

-- Create partitioned table for time-series data
CREATE TABLE manufacturing_data (
    id SERIAL,
    timestamp TIMESTAMPTZ NOT NULL,
    production_line VARCHAR(100),
    metric_name VARCHAR(255),
    metric_value DECIMAL(15,6),
    unit VARCHAR(50),
    batch_id INTEGER,
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create partitions for manufacturing_data (current and next year)
CREATE TABLE manufacturing_data_2025 PARTITION OF manufacturing_data
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE manufacturing_data_2026 PARTITION OF manufacturing_data
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Indexes for partitioned manufacturing_data
CREATE INDEX idx_manufacturing_data_2025_timestamp ON manufacturing_data_2025(timestamp DESC);
CREATE INDEX idx_manufacturing_data_2025_line ON manufacturing_data_2025(production_line);

-- Cache invalidation triggers
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp triggers
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_shopify_stores_timestamp BEFORE UPDATE ON shopify_stores FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_production_batches_timestamp BEFORE UPDATE ON production_batches FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_manufacturing_resources_timestamp BEFORE UPDATE ON manufacturing_resources FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_user_dashboards_timestamp BEFORE UPDATE ON user_dashboards FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Create views for common queries
CREATE VIEW inventory_summary AS
SELECT 
    COUNT(*) as total_skus,
    SUM(total_quantity) as total_quantity,
    SUM(fulfillable_quantity) as fulfillable_quantity,
    COUNT(*) FILTER (WHERE fulfillable_quantity < 20) as low_stock_items,
    MAX(last_updated) as last_sync
FROM amazon_inventory;

CREATE VIEW daily_sales_summary AS
SELECT 
    DATE(purchase_date) as sale_date,
    COUNT(*) as order_count,
    SUM(order_total) as total_revenue,
    AVG(order_total) as avg_order_value
FROM amazon_orders 
WHERE purchase_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(purchase_date)
ORDER BY sale_date DESC;

CREATE VIEW production_efficiency AS
SELECT 
    production_line,
    COUNT(*) as total_batches,
    AVG(yield_percentage) as avg_yield,
    AVG(quality_score) as avg_quality,
    COUNT(*) FILTER (WHERE status = 'Completed') as completed_batches
FROM production_batches 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY production_line;

-- Grant permissions (adjust based on your user roles)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO viewer_role;

-- Performance optimization: Analyze tables
ANALYZE;

-- Enable row-level security (RLS) for multi-tenant data
ALTER TABLE user_dashboards ENABLE ROW LEVEL SECURITY;

-- RLS policy example (customize based on your auth system)
CREATE POLICY user_dashboard_policy ON user_dashboards
    FOR ALL TO authenticated
    USING (user_id = current_setting('app.user_id')::INTEGER);

COMMENT ON DATABASE postgres IS 'CapLiquify Manufacturing Platform - Enterprise Database';
COMMENT ON TABLE users IS 'User authentication and authorization with Clerk integration';
COMMENT ON TABLE amazon_inventory IS 'Real-time Amazon SP-API inventory data';
COMMENT ON TABLE amazon_orders IS 'Amazon order data with full order details';
COMMENT ON TABLE shopify_stores IS 'Multi-store Shopify configuration and credentials';
COMMENT ON TABLE production_batches IS 'Manufacturing batch tracking and quality control';
COMMENT ON TABLE manufacturing_resources IS 'Production resource utilization and capacity planning';
