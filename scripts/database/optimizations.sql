-- Enterprise Database Query Optimizations
-- Performance indexes for high-volume manufacturing data

-- Amazon Inventory Performance Indexes
CREATE INDEX IF NOT EXISTS idx_amazon_inventory_sku_btree ON amazon_inventory USING btree(sku);
CREATE INDEX IF NOT EXISTS idx_amazon_inventory_low_stock ON amazon_inventory(fulfillable_quantity) WHERE fulfillable_quantity < 20;
CREATE INDEX IF NOT EXISTS idx_amazon_inventory_last_updated ON amazon_inventory(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_amazon_inventory_asin_sku ON amazon_inventory(asin, sku);

-- Amazon Orders Performance Indexes  
CREATE INDEX IF NOT EXISTS idx_amazon_orders_date_range ON amazon_orders(purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_amazon_orders_status ON amazon_orders(order_status) WHERE order_status IN ('Pending', 'Shipped', 'Delivered');
CREATE INDEX IF NOT EXISTS idx_amazon_orders_buyer_email ON amazon_orders(buyer_email);

-- Shopify Multi-Store Indexes
CREATE INDEX IF NOT EXISTS idx_shopify_orders_store_date ON shopify_orders(store_domain, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shopify_products_store_status ON shopify_products(store_domain, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_shopify_inventory_store_sku ON shopify_inventory(store_domain, sku);

-- Production Batches High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_production_batches_status_date ON production_batches(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_batches_product_id ON production_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_completion ON production_batches(estimated_completion) WHERE status = 'in_progress';

-- Unleashed ERP Performance Indexes
CREATE INDEX IF NOT EXISTS idx_unleashed_products_stock_code ON unleashed_products(stock_code);
CREATE INDEX IF NOT EXISTS idx_unleashed_sales_orders_date ON unleashed_sales_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_unleashed_purchase_orders_status ON unleashed_purchase_orders(order_status);

-- User Activity and Dashboard Performance
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_id ON dashboard_layouts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(expires_at) WHERE expires_at > NOW();

-- Composite Indexes for Complex Queries
CREATE INDEX IF NOT EXISTS idx_inventory_reorder_composite ON amazon_inventory(fulfillable_quantity, last_updated) 
  WHERE fulfillable_quantity < 50;

CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_composite ON amazon_orders(order_status, purchase_date, fulfillment_channel);

CREATE INDEX IF NOT EXISTS idx_production_efficiency_composite ON production_batches(status, created_at, estimated_completion);

-- Partitioning for Time-Series Data (if supported)
-- CREATE TABLE amazon_orders_2025 PARTITION OF amazon_orders 
--   FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Statistics Update for Query Planner Optimization
ANALYZE amazon_inventory;
ANALYZE amazon_orders;  
ANALYZE shopify_orders;
ANALYZE production_batches;
ANALYZE unleashed_products;

-- Performance monitoring views
CREATE OR REPLACE VIEW slow_queries AS
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;

CREATE OR REPLACE VIEW index_usage AS
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;