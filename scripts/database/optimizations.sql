
-- Enterprise database optimizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active ON users(email) WHERE active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dashboard_widgets_user_timestamp ON dashboard_widgets(user_id, updated_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_manufacturing_data_timestamp_line ON manufacturing_data(timestamp DESC, production_line);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_sku_location ON inventory(sku, location) WHERE active = true;

-- Partitioning for large tables
CREATE TABLE IF NOT EXISTS manufacturing_data_y2025 PARTITION OF manufacturing_data
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
