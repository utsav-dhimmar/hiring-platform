-- Migration: Add match_analysis and candidate_id to cross_job_matches
-- Purpose: Store job-specific AI analysis directly in the match record.
--          Link to original candidate directly so no duplicate Candidate records are needed.
-- Run: psql -d <your_db> -f this_file.sql

ALTER TABLE cross_job_matches
    ADD COLUMN IF NOT EXISTS candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS match_analysis JSONB;

-- Index for fast lookup: "show all cross-matches for this candidate"
CREATE INDEX IF NOT EXISTS ix_cross_job_matches_candidate_id
    ON cross_job_matches (candidate_id);
