-- Install pgvector extension on Render PostgreSQL
-- Database: sentia_manufacturing_dev
-- Run this via psql or any PostgreSQL client

-- Step 1: Create the extension (requires superuser privileges)
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Verify installation
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';

-- Step 3: Check if vector type is now available
SELECT typname FROM pg_type WHERE typname = 'vector';

-- Step 4: Test vector functionality
-- Create a test table to verify it works
CREATE TABLE IF NOT EXISTS vector_test (
    id SERIAL PRIMARY KEY,
    embedding vector(3)
);

-- Insert test data
INSERT INTO vector_test (embedding) VALUES ('[1,2,3]');

-- Query test data
SELECT * FROM vector_test;

-- Clean up test table
DROP TABLE IF EXISTS vector_test;

-- If successful, you should see:
-- CREATE EXTENSION
-- extname | extversion
-- ---------+-----------
-- vector  | 0.5.1 (or similar version)
--
-- typname
-- --------
-- vector