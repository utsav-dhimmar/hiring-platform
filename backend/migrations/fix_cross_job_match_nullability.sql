-- Migration: Fix nullability of original_job_id in cross_job_matches
-- Author: Antigravity

-- 1. Ensure original_job_id is nullable (to match SQLAlchemy model and handle SET NULL)
ALTER TABLE cross_job_matches ALTER COLUMN original_job_id DROP NOT NULL;

-- 2. Ensure candidate_id is also nullable just in case
ALTER TABLE cross_job_matches ALTER COLUMN candidate_id DROP NOT NULL;

-- 3. Fix foreign key constraints to ensure proper cleanup
ALTER TABLE cross_job_matches DROP CONSTRAINT IF EXISTS cross_job_matches_original_job_id_fkey;
ALTER TABLE cross_job_matches ADD CONSTRAINT cross_job_matches_original_job_id_fkey 
    FOREIGN KEY (original_job_id) REFERENCES jobs(id) ON DELETE SET NULL;

ALTER TABLE cross_job_matches DROP CONSTRAINT IF EXISTS cross_job_matches_matched_job_id_fkey;
ALTER TABLE cross_job_matches ADD CONSTRAINT cross_job_matches_matched_job_id_fkey 
    FOREIGN KEY (matched_job_id) REFERENCES jobs(id) ON DELETE CASCADE;
