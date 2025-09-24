-- Fix pgvector extension issue on Render PostgreSQL
-- Run this in the Render database console or via psql

-- Create the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify it's installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check available extensions
SELECT * FROM pg_available_extensions WHERE name = 'vector';