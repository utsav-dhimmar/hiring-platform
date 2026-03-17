-- Run this script in your PostgreSQL 'hiring' database
-- to enable the pgvector extension before starting the app

-- Enable pgvector extension (required for VECTOR columns)
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
