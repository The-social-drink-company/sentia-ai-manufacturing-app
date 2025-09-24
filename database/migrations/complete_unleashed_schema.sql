-- ===== UNLEASHED INTEGRATION SCHEMA MIGRATION =====
-- Run this migration to add Unleashed-specific tables to the database
-- Requires PostgreSQL with pgvector extension

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Update Inventory table to support Unleashed data
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS sku VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS quantity_allocated DECIMAL(15, 4),
  ADD COLUMN IF NOT EXISTS quantity_available DECIMAL(15, 4),
  ADD COLUMN IF NOT EXISTS location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS last_modified TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS avg_daily_usage DECIMAL(15, 4);

-- Change quantity to DECIMAL for better precision
ALTER TABLE inventory
  ALTER COLUMN quantity TYPE DECIMAL(15, 4),
  ALTER COLUMN reorder_point TYPE DECIMAL(15, 4),
  ALTER COLUMN reorder_quantity TYPE DECIMAL(15, 4);

-- Add index on sku if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);

-- Create SalesOrder table for Unleashed sales orders
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer VARCHAR(255) NOT NULL,
  customer_code VARCHAR(100) NOT NULL,
  order_date DATE NOT NULL,
  required_date DATE,
  status VARCHAR(50) NOT NULL,
  sub_total DECIMAL(15, 2) NOT NULL,
  tax DECIMAL(15, 2) NOT NULL,
  total DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for SalesOrder
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_order_date ON sales_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer);

-- Create StockMovement table for inventory tracking
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movement_id VARCHAR(255) UNIQUE NOT NULL,
  product_code VARCHAR(100) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  warehouse VARCHAR(100) NOT NULL,
  movement_type VARCHAR(50) NOT NULL,
  quantity DECIMAL(15, 4) NOT NULL,
  unit_cost DECIMAL(15, 4) NOT NULL,
  total_cost DECIMAL(15, 2) NOT NULL,
  reference VARCHAR(255),
  order_number VARCHAR(50),
  completed_date TIMESTAMPTZ(6) NOT NULL,
  reason VARCHAR(255),
  customer_supplier VARCHAR(255),
  created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for StockMovement
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_code ON stock_movements(product_code);
CREATE INDEX IF NOT EXISTS idx_stock_movements_completed_date ON stock_movements(completed_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_type ON stock_movements(movement_type);

-- Create InventoryMetric table for tracking metrics over time
CREATE TABLE IF NOT EXISTS inventory_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  total_products INT NOT NULL,
  total_quantity DECIMAL(15, 4) NOT NULL,
  total_value DECIMAL(15, 2) NOT NULL,
  low_stock_items INT NOT NULL,
  out_of_stock_items INT NOT NULL,
  timestamp TIMESTAMPTZ(6) NOT NULL,
  created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP
);

-- Create index for InventoryMetric
CREATE INDEX IF NOT EXISTS idx_inventory_metrics_timestamp ON inventory_metrics(timestamp);

-- Update PurchaseOrder table if it exists (add missing columns)
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS supplier VARCHAR(255),
  ADD COLUMN IF NOT EXISTS supplier_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS order_date DATE,
  ADD COLUMN IF NOT EXISTS required_date DATE,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS sub_total DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS tax DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS total DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3),
  ADD COLUMN IF NOT EXISTS data JSONB;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON sales_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_movements_updated_at BEFORE UPDATE ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance optimization on existing tables
CREATE INDEX IF NOT EXISTS idx_production_metrics_timestamp ON production_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_production_metrics_line_id ON production_metrics(line_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_timestamp ON quality_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_product_id ON quality_metrics(product_id);
CREATE INDEX IF NOT EXISTS idx_working_capital_date ON working_capital(date);
CREATE INDEX IF NOT EXISTS idx_inventory_movement_timestamp ON inventory_movements(timestamp);
CREATE INDEX IF NOT EXISTS idx_inventory_movement_product_id ON inventory_movements(product_id);

-- Create vector similarity search index for embeddings
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Grant appropriate permissions (adjust as needed for your database user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;