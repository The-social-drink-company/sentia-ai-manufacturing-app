-- PostgreSQL Vector Extension Setup for AI-Enhanced Functionality
-- For Render PostgreSQL Databases (Version 16)
-- Enables vector storage for AI embeddings, similarity search, and ML capabilities

-- ============================================
-- STEP 1: Enable pgvector Extension
-- ============================================
-- Note: Render PostgreSQL supports pgvector on all plans
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';

-- ============================================
-- STEP 2: Create AI Enhancement Tables
-- ============================================

-- Product Embeddings for AI-powered search and recommendations
CREATE TABLE IF NOT EXISTS product_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL,
    product_name VARCHAR(255),
    embedding vector(1536), -- OpenAI ada-002 dimension
    embedding_model VARCHAR(50) DEFAULT 'text-embedding-ada-002',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (product_id) REFERENCES "Product"(id) ON DELETE CASCADE
);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS product_embeddings_vector_idx
ON product_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Manufacturing Process Embeddings for pattern recognition
CREATE TABLE IF NOT EXISTS process_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    process_type VARCHAR(100),
    process_data JSONB,
    embedding vector(1536),
    embedding_model VARCHAR(50) DEFAULT 'text-embedding-ada-002',
    anomaly_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS process_embeddings_vector_idx
ON process_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Demand Forecast Embeddings for pattern matching
CREATE TABLE IF NOT EXISTS forecast_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    forecast_id UUID,
    historical_pattern vector(768), -- Smaller dimension for time series
    market_signals vector(768),
    combined_embedding vector(1536),
    accuracy_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (forecast_id) REFERENCES "Forecast"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS forecast_embeddings_pattern_idx
ON forecast_embeddings
USING ivfflat (historical_pattern vector_cosine_ops)
WITH (lists = 50);

-- Quality Control AI Insights
CREATE TABLE IF NOT EXISTS quality_ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_number VARCHAR(100),
    product_id UUID,
    defect_embedding vector(512), -- Smaller dimension for defect patterns
    quality_score FLOAT,
    ai_recommendations JSONB,
    confidence_level FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (product_id) REFERENCES "Product"(id)
);

CREATE INDEX IF NOT EXISTS quality_ai_insights_vector_idx
ON quality_ai_insights
USING ivfflat (defect_embedding vector_cosine_ops)
WITH (lists = 50);

-- Supply Chain Optimization Vectors
CREATE TABLE IF NOT EXISTS supply_chain_vectors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id VARCHAR(100),
    route_embedding vector(256), -- Compact routing vectors
    cost_optimization_vector vector(256),
    risk_assessment_vector vector(256),
    combined_score FLOAT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS supply_chain_vectors_route_idx
ON supply_chain_vectors
USING ivfflat (route_embedding vector_l2_ops)
WITH (lists = 25);

-- Customer Sentiment Embeddings (from feedback/reviews)
CREATE TABLE IF NOT EXISTS customer_sentiment_vectors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id VARCHAR(100),
    product_id UUID,
    sentiment_embedding vector(768),
    sentiment_score FLOAT, -- -1 to 1
    topics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (product_id) REFERENCES "Product"(id)
);

CREATE INDEX IF NOT EXISTS customer_sentiment_vectors_idx
ON customer_sentiment_vectors
USING ivfflat (sentiment_embedding vector_cosine_ops)
WITH (lists = 75);

-- ============================================
-- STEP 3: Vector Search Functions
-- ============================================

-- Function to find similar products
CREATE OR REPLACE FUNCTION find_similar_products(
    query_embedding vector(1536),
    limit_count INT DEFAULT 10
)
RETURNS TABLE(
    product_id UUID,
    product_name VARCHAR,
    similarity FLOAT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pe.product_id,
        pe.product_name,
        1 - (pe.embedding <=> query_embedding) AS similarity,
        pe.metadata
    FROM product_embeddings pe
    ORDER BY pe.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to detect manufacturing anomalies
CREATE OR REPLACE FUNCTION detect_process_anomalies(
    query_embedding vector(1536),
    threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE(
    process_type VARCHAR,
    anomaly_score FLOAT,
    process_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pe.process_type,
        (pe.embedding <=> query_embedding) AS anomaly_score,
        pe.process_data
    FROM process_embeddings pe
    WHERE (pe.embedding <=> query_embedding) > threshold
    ORDER BY anomaly_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function for demand pattern matching
CREATE OR REPLACE FUNCTION match_demand_patterns(
    historical_query vector(768),
    limit_count INT DEFAULT 5
)
RETURNS TABLE(
    forecast_id UUID,
    pattern_similarity FLOAT,
    accuracy_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        fe.forecast_id,
        1 - (fe.historical_pattern <=> historical_query) AS pattern_similarity,
        fe.accuracy_score
    FROM forecast_embeddings fe
    ORDER BY fe.historical_pattern <=> historical_query
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 4: AI Performance Optimization Tables
-- ============================================

-- Cache for frequently accessed embeddings
CREATE TABLE IF NOT EXISTS embedding_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    embedding vector(1536),
    model_version VARCHAR(50),
    hit_count INT DEFAULT 1,
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- AI Model Performance Metrics
CREATE TABLE IF NOT EXISTS ai_model_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model_name VARCHAR(100),
    model_version VARCHAR(50),
    task_type VARCHAR(100),
    accuracy FLOAT,
    precision_score FLOAT,
    recall_score FLOAT,
    f1_score FLOAT,
    latency_ms INT,
    token_usage INT,
    cost_usd DECIMAL(10,4),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 5: Enable Additional Extensions
-- ============================================

-- For advanced statistics and ML
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS plpython3u; -- If available, for Python ML functions
CREATE EXTENSION IF NOT EXISTS postgis; -- For geospatial AI features

-- ============================================
-- STEP 6: Performance Configuration
-- ============================================

-- Set optimal configuration for vector operations
-- Note: These require superuser privileges
-- ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
-- ALTER SYSTEM SET effective_cache_size = '2GB';
-- ALTER SYSTEM SET shared_buffers = '512MB';
-- ALTER SYSTEM SET work_mem = '16MB';

-- ============================================
-- STEP 7: Create Materialized Views for Fast AI Queries
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS product_similarity_matrix AS
SELECT
    p1.product_id AS product_id_1,
    p2.product_id AS product_id_2,
    1 - (p1.embedding <=> p2.embedding) AS similarity
FROM product_embeddings p1
CROSS JOIN product_embeddings p2
WHERE p1.product_id != p2.product_id
    AND 1 - (p1.embedding <=> p2.embedding) > 0.7;

CREATE INDEX IF NOT EXISTS idx_similarity_matrix
ON product_similarity_matrix(product_id_1, similarity DESC);

-- ============================================
-- STEP 8: Grant Permissions
-- ============================================

-- Grant permissions to application user
-- Replace 'sentia_user' with your actual database user
GRANT ALL ON ALL TABLES IN SCHEMA public TO sentia_dev_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO sentia_test_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO sentia_prod_user;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if vector extension is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check vector dimension limits
SELECT typname, typlen FROM pg_type WHERE typname = 'vector';

-- List all vector indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE indexdef LIKE '%vector%';

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE '%embedding%' OR tablename LIKE '%vector%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;