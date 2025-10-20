
-- Database Optimization Queries for CapLiquify Manufacturing Platform
-- Performance enhancements for production scale

-- Index optimization for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_orders_date ON sales_orders(order_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_orders_status ON sales_orders(status) WHERE status IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_product_date ON inventory_levels(product_id, created_at DESC);

-- Composite indexes for dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kpi_metrics_date_type ON kpi_metrics(date DESC, metric_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manufacturing_jobs_status_date ON manufacturing_jobs(status, created_at DESC);

-- Partial indexes for active records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_orders ON sales_orders(created_at DESC) 
  WHERE status IN ('pending', 'processing', 'shipped');

-- Database maintenance queries
ANALYZE;
VACUUM (ANALYZE);

-- Query optimization hints
-- For high-frequency dashboard queries, consider materialized views
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_kpis AS
SELECT 
  date_trunc('day', created_at) as date,
  COUNT(*) as order_count,
  SUM(total_amount) as revenue,
  AVG(total_amount) as avg_order_value
FROM sales_orders 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date_trunc('day', created_at)
ORDER BY date DESC;

-- Refresh materialized view (run via cron job)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_kpis;

