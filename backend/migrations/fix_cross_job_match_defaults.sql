
-- Migration: Fix missing default for created_at in cross_job_matches
-- Author: Antigravity

ALTER TABLE cross_job_matches 
ALTER COLUMN created_at SET DEFAULT now();

-- Ensure candidate_id is populated for existing matches (best effort)
UPDATE cross_job_matches cjm
SET candidate_id = r.candidate_id
FROM resumes r
WHERE cjm.resume_id = r.id AND cjm.candidate_id IS NULL;
