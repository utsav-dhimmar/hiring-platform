-- Migration: Fix Job Deletion Cascade for Candidates
-- Description: Makes applied_job_id nullable and sets up SET NULL on delete cascade to preserve candidates.

-- 1. Remove NOT NULL constraint from candidates.applied_job_id
ALTER TABLE candidates ALTER COLUMN applied_job_id DROP NOT NULL;

-- 2. Drop existing foreign key constraint
-- The constraint name is usually candidates_applied_job_id_fkey by default in SQLAlchemy
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_applied_job_id_fkey;

-- 3. Add new foreign key constraint with ON DELETE SET NULL
ALTER TABLE candidates 
ADD CONSTRAINT candidates_applied_job_id_fkey 
FOREIGN KEY (applied_job_id) 
REFERENCES jobs(id) 
ON DELETE SET NULL;
