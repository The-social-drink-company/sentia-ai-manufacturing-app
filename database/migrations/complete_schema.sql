-- Complete Database Schema for CapLiquify Manufacturing Platform
-- This migration adds all missing tables for production management

-- Enable pgvector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ===== PRODUCTION MANAGEMENT TABLES =====

-- Production Lines
CREATE TABLE IF NOT EXISTS production_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL,
    efficiency REAL DEFAULT 0,
    current_product VARCHAR(255),
    capacity INT DEFAULT 0,
    location VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_production_lines_status ON production_lines(status);
CREATE INDEX IF NOT EXISTS idx_production_lines_code ON production_lines(code);

-- Production Metrics
CREATE TABLE IF NOT EXISTS production_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_id UUID NOT NULL REFERENCES production_lines(id),
    product_id VARCHAR(255),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    units_produced INT NOT NULL,
    target_units INT NOT NULL,
    defect_count INT DEFAULT 0,
    defect_rate REAL DEFAULT 0,
    efficiency REAL DEFAULT 0,
    oee REAL DEFAULT 0,
    availability REAL DEFAULT 0,
    performance REAL DEFAULT 0,
    quality REAL DEFAULT 0,
    downtime INT DEFAULT 0,
    shift_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_production_metrics_line_id ON production_metrics(line_id);
CREATE INDEX IF NOT EXISTS idx_production_metrics_timestamp ON production_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_production_metrics_product_id ON production_metrics(product_id);
CREATE INDEX IF NOT EXISTS idx_production_metrics_line_timestamp ON production_metrics(line_id, timestamp);

-- Production Schedule
CREATE TABLE IF NOT EXISTS production_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_id UUID NOT NULL REFERENCES production_lines(id),
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    scheduled_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    shift_id VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'scheduled',
    notes TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_production_schedule_line_id ON production_schedule(line_id);
CREATE INDEX IF NOT EXISTS idx_production_schedule_date ON production_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_production_schedule_status ON production_schedule(status);

-- Batch Production
CREATE TABLE IF NOT EXISTS batch_production (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number VARCHAR(100) UNIQUE NOT NULL,
    line_id UUID NOT NULL REFERENCES production_lines(id),
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    target_quantity INT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'in-progress',
    quality_check_passed BOOLEAN,
    quality_check_date TIMESTAMPTZ,
    notes TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_batch_production_batch_number ON batch_production(batch_number);
CREATE INDEX IF NOT EXISTS idx_batch_production_line_id ON batch_production(line_id);
CREATE INDEX IF NOT EXISTS idx_batch_production_status ON batch_production(status);

-- ===== INVENTORY MANAGEMENT TABLES =====

-- Inventory Movements
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID,
    sku VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    from_location VARCHAR(100),
    to_location VARCHAR(100),
    reference VARCHAR(255),
    reason TEXT,
    status VARCHAR(50) DEFAULT 'completed',
    scheduled_date DATE,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255),
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_sku ON inventory_movements(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_timestamp ON inventory_movements(timestamp);

-- Stock Takes
CREATE TABLE IF NOT EXISTS stock_takes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location VARCHAR(100) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    total_items INT NOT NULL,
    total_variance DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'in-progress',
    notes TEXT,
    approved_by VARCHAR(255),
    approved_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_stock_takes_location ON stock_takes(location);
CREATE INDEX IF NOT EXISTS idx_stock_takes_status ON stock_takes(status);

-- ===== QUALITY MANAGEMENT TABLES =====

-- Quality Inspections
CREATE TABLE IF NOT EXISTS quality_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id VARCHAR(100),
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    inspection_date TIMESTAMPTZ NOT NULL,
    inspector_id VARCHAR(255) NOT NULL,
    inspector_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    sample_size INT NOT NULL,
    pass_count INT NOT NULL,
    fail_count INT NOT NULL,
    defect_types JSON,
    criteria JSON,
    overall_result VARCHAR(20) NOT NULL,
    notes TEXT,
    corrective_actions TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quality_inspections_batch_id ON quality_inspections(batch_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_product_id ON quality_inspections(product_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_date ON quality_inspections(inspection_date);

-- Quality Defects
CREATE TABLE IF NOT EXISTS quality_defects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    batch_id VARCHAR(100),
    line_id UUID,
    category VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    quantity INT NOT NULL,
    root_cause TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    status VARCHAR(50) DEFAULT 'open',
    inspection_id UUID,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quality_defects_product_id ON quality_defects(product_id);
CREATE INDEX IF NOT EXISTS idx_quality_defects_batch_id ON quality_defects(batch_id);
CREATE INDEX IF NOT EXISTS idx_quality_defects_category ON quality_defects(category);
CREATE INDEX IF NOT EXISTS idx_quality_defects_status ON quality_defects(status);

-- Quality Metrics
CREATE TABLE IF NOT EXISTS quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    product_id VARCHAR(255),
    line_id UUID,
    total_produced INT NOT NULL,
    defects INT DEFAULT 0,
    rework INT DEFAULT 0,
    scrap INT DEFAULT 0,
    first_pass_yield REAL NOT NULL,
    defect_rate REAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, product_id, line_id)
);

CREATE INDEX IF NOT EXISTS idx_quality_metrics_date ON quality_metrics(date);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_product_id ON quality_metrics(product_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_line_id ON quality_metrics(line_id);

-- Quality Specifications
CREATE TABLE IF NOT EXISTS quality_specifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(255) NOT NULL,
    parameter VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    nominal REAL NOT NULL,
    upper_limit REAL NOT NULL,
    lower_limit REAL NOT NULL,
    critical BOOLEAN DEFAULT false,
    description TEXT,
    test_method VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, parameter)
);

CREATE INDEX IF NOT EXISTS idx_quality_specifications_product_id ON quality_specifications(product_id);

-- Quality Certifications
CREATE TABLE IF NOT EXISTS quality_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    cert_number VARCHAR(100) NOT NULL,
    issuer VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'valid',
    document_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quality_certifications_status ON quality_certifications(status);
CREATE INDEX IF NOT EXISTS idx_quality_certifications_expiry ON quality_certifications(expiry_date);

-- Quality Measurements
CREATE TABLE IF NOT EXISTS quality_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(255) NOT NULL,
    batch_id VARCHAR(100),
    parameter VARCHAR(100) NOT NULL,
    value REAL NOT NULL,
    unit VARCHAR(20) NOT NULL,
    measured_at TIMESTAMPTZ NOT NULL,
    measured_by VARCHAR(255) NOT NULL,
    equipment VARCHAR(100),
    in_spec BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quality_measurements_product_id ON quality_measurements(product_id);
CREATE INDEX IF NOT EXISTS idx_quality_measurements_batch_id ON quality_measurements(batch_id);
CREATE INDEX IF NOT EXISTS idx_quality_measurements_parameter ON quality_measurements(parameter);

-- ===== MAINTENANCE MANAGEMENT =====

CREATE TABLE IF NOT EXISTS maintenance_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id VARCHAR(255) NOT NULL,
    equipment_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    scheduled_date DATE NOT NULL,
    frequency VARCHAR(50),
    description TEXT NOT NULL,
    assigned_to VARCHAR(255),
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'scheduled',
    completed_date TIMESTAMPTZ,
    completed_by VARCHAR(255),
    notes TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedule_equipment ON maintenance_schedule(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedule_date ON maintenance_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedule_status ON maintenance_schedule(status);

-- ===== SUPPLY CHAIN MANAGEMENT =====

CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id VARCHAR(255) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    order_date DATE NOT NULL,
    delivery_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    items JSON NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    tax DECIMAL(15,2) DEFAULT 0,
    shipping DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_terms VARCHAR(100),
    notes TEXT,
    approved_by VARCHAR(255),
    approved_date TIMESTAMPTZ,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);

-- ===== AI/ML EMBEDDINGS =====

CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding vector(1536), -- Using pgvector
    metadata JSON,
    category VARCHAR(50),
    entity_id VARCHAR(255),
    dimension INT DEFAULT 1536,
    model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_embeddings_category ON embeddings(category);
CREATE INDEX IF NOT EXISTS idx_embeddings_entity ON embeddings(entity_id);
-- Create vector similarity search index
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ===== ENHANCED FINANCIAL TABLES =====

CREATE TABLE IF NOT EXISTS cash_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    type VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(100),
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    reference VARCHAR(255),
    account_id UUID,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cash_flows_date ON cash_flows(date);
CREATE INDEX IF NOT EXISTS idx_cash_flows_type ON cash_flows(type);
CREATE INDEX IF NOT EXISTS idx_cash_flows_category ON cash_flows(category);

CREATE TABLE IF NOT EXISTS cash_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    opening_balance DECIMAL(15,2) NOT NULL,
    inflows DECIMAL(15,2) NOT NULL,
    outflows DECIMAL(15,2) NOT NULL,
    closing_balance DECIMAL(15,2) NOT NULL,
    balance DECIMAL(15,2) NOT NULL,
    reconciled BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cash_balances_date ON cash_balances(date);

-- ===== UPDATE TRIGGERS FOR UPDATED_AT =====

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END $$;
