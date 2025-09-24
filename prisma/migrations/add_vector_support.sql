-- Prisma Migration: Add Vector Support for AI Features
-- This migration adds pgvector extension and AI-enhanced tables

-- Enable pgvector extension (required for vector operations)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector columns to existing tables for AI enhancement
-- Note: Run these carefully in production

-- Add embedding column to Product table for AI-powered search
ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS embedding vector(1536),
ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ;

-- Add AI prediction columns to Forecast table
ALTER TABLE "Forecast"
ADD COLUMN IF NOT EXISTS ai_confidence FLOAT,
ADD COLUMN IF NOT EXISTS pattern_embedding vector(768),
ADD COLUMN IF NOT EXISTS model_version VARCHAR(50);

-- Add quality AI columns to existing tables
ALTER TABLE "InventoryLevel"
ADD COLUMN IF NOT EXISTS quality_vector vector(512),
ADD COLUMN IF NOT EXISTS ai_quality_score FLOAT;

-- Create new AI-specific tables
CREATE TABLE IF NOT EXISTS ai_manufacturing_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    insight_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    insight_embedding vector(1536),
    insight_text TEXT,
    confidence_score FLOAT,
    impact_score FLOAT,
    recommendations JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ai_chat_context (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id UUID,
    message_embedding vector(1536),
    message_text TEXT,
    response_text TEXT,
    context_window JSONB,
    tokens_used INT,
    model_name VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_training_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data_type VARCHAR(100),
    input_vector vector(1536),
    output_vector vector(1536),
    labels JSONB,
    accuracy FLOAT,
    is_validated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for vector similarity search
CREATE INDEX IF NOT EXISTS idx_product_embedding ON "Product" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_forecast_pattern ON "Forecast" USING ivfflat (pattern_embedding vector_cosine_ops) WITH (lists = 50);
CREATE INDEX IF NOT EXISTS idx_inventory_quality ON "InventoryLevel" USING ivfflat (quality_vector vector_cosine_ops) WITH (lists = 50);
CREATE INDEX IF NOT EXISTS idx_ai_insights ON ai_manufacturing_insights USING ivfflat (insight_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_chat_context ON ai_chat_context USING ivfflat (message_embedding vector_cosine_ops) WITH (lists = 100);

-- Create helper functions for AI operations
CREATE OR REPLACE FUNCTION cosine_similarity(a vector, b vector)
RETURNS FLOAT AS $$
BEGIN
    RETURN 1 - (a <=> b);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION euclidean_distance(a vector, b vector)
RETURNS FLOAT AS $$
BEGIN
    RETURN a <-> b;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add triggers for automatic embedding updates
CREATE OR REPLACE FUNCTION update_embedding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.embedding_updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_embedding_update
BEFORE UPDATE OF embedding ON "Product"
FOR EACH ROW
EXECUTE FUNCTION update_embedding_timestamp();