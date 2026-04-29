
-- Migration: Add evaluation versioning and fix candidate_stages nullability
-- Created: 2026-04-30

-- 1. Add attempt_number column to evaluations table
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1;

-- 2. Make started_at nullable in candidate_stages table
-- This allows pending stages to exist without a start timestamp
ALTER TABLE candidate_stages ALTER COLUMN started_at DROP NOT NULL;
