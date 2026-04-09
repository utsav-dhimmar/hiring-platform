-- Migration: Add vacancy columns to jobs and job_versions
-- Description: Store vacancy count for job create/update/list/detail and version snapshots
-- Created: 2026-04-09

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS vacancy INTEGER;

ALTER TABLE job_versions
ADD COLUMN IF NOT EXISTS vacancy INTEGER;

COMMENT ON COLUMN jobs.vacancy IS 'Number of open positions for this job.';
COMMENT ON COLUMN job_versions.vacancy IS 'Vacancy snapshot for this job version.';

DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully: Added vacancy columns to jobs and job_versions';
END $$;
